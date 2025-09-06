import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createStripeInstance, validateStripeConfig } from '../../../../lib/stripe-server';

export async function POST(request: NextRequest) {
  // Validate Stripe configuration
  const configValidation = validateStripeConfig();
  if (!configValidation.isValid) {
    console.error('Stripe configuration error:', configValidation.error);
    return NextResponse.json(
      { error: `Stripe configuration error: ${configValidation.error}` },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    console.error('Webhook secret not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  // Initialize Stripe
  let stripe;
  try {
    stripe = createStripeInstance();
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return NextResponse.json(
      { error: 'Stripe initialization failed' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Payment successful:', session);
        
        // TODO: Update user's subscription in your database
        await handleSuccessfulPayment(session);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription);
        
        // TODO: Update subscription status in your database
        await handleSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription);
        
        // TODO: Handle subscription cancellation
        await handleSubscriptionCancellation(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed:', invoice);
        
        // TODO: Handle failed payment
        await handleFailedPayment(invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { planId, userId } = session.metadata!;
  
  console.log(`User ${userId} successfully purchased ${planId}`);
  
  try {
    // Map plan IDs to minutes and plan types
    const planConfig = {
      starter: { plan_type: 'starter', minutes: 250, amount: 199.00 },
      professional: { plan_type: 'professional', minutes: 450, amount: 469.00 },
      'ai-voice': { plan_type: 'ai-voice', minutes: 0, amount: 25.00 },
      minutes_100: { plan_type: 'minutes', minutes: 100, amount: 40.00 },
      minutes_250: { plan_type: 'minutes', minutes: 250, amount: 75.00 },
      minutes_500: { plan_type: 'minutes', minutes: 500, amount: 140.00 },
      minutes_1000: { plan_type: 'minutes', minutes: 1000, amount: 260.00 },
    };

    const config = planConfig[planId as keyof typeof planConfig];
    
    if (!config) {
      console.error(`Unknown plan ID: ${planId}`);
      return;
    }

    // Prepare payment confirmation data
    const paymentData = {
      user_id: parseInt(userId),
      plan_type: config.plan_type,
      amount_paid: config.amount,
      transaction_id: session.id, // Use Stripe session ID as transaction ID
      payment_intent_id: session.payment_intent as string,
      minutes: config.minutes
    };

    console.log('Sending payment confirmation:', paymentData);

    // Call your payment confirmation API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/stripe/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment confirmation API failed:', response.status, errorText);
      throw new Error(`Payment confirmation failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Payment confirmation successful:', result);
    
  } catch (error) {
    console.error('Error confirming payment with backend:', error);
    // You might want to implement retry logic here or send to a dead letter queue
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Implement your logic to handle subscription updates
  console.log(`Subscription ${subscription.id} updated`);
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  // Implement your logic to handle subscription cancellations
  console.log(`Subscription ${subscription.id} cancelled`);
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  // Implement your logic to handle failed payments
  console.log(`Payment failed for invoice ${invoice.id}`);
}
