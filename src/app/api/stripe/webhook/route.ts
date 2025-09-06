import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createStripeInstance, validateStripeConfig } from '../../../../lib/stripe-server';
import { getPlanConfig } from '../../../../config/plans';
import { paymentSessions } from '../../../../lib/payment-sessions';

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
        console.log('Checkout session completed:', session.id);
        await handleCheckoutSessionCompleted(session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription);
        await handleSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription);
        await handleSubscriptionCancellation(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed:', invoice);
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

// Common function to confirm payment with backend
async function confirmPaymentWithBackend(planId: string, userId: string, transactionId: string, paymentIntentId?: string) {
  try {
    const config = getPlanConfig(planId);
    if (!config) {
      console.error(`Unknown plan ID: ${planId}`);
      return;
    }

    const paymentData = {
      user_id: parseInt(userId),
      plan_type: config.plan_type,
      amount_paid: config.price,
      transaction_id: transactionId,
      payment_intent_id: paymentIntentId || transactionId,
      minutes: config.minutes,
      is_admin: false
    };

    console.log('Confirming payment with backend:', paymentData);

    const backendUrl = process.env.BACKEND_API_URL || 'https://3758a6b3509d.ngrok-free.app';
    const response = await fetch(`${backendUrl}/api/stripe/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
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
    return result;
    
  } catch (error) {
    console.error('Error confirming payment with backend:', error);
    throw error;
  }
}

// Handle checkout session completed (for redirect flow)
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { planId, userId } = session.metadata!;
  console.log(`Checkout session completed for user ${userId}, plan ${planId}`);
  
  try {
    await confirmPaymentWithBackend(
      planId, 
      userId, 
      session.id, 
      session.payment_intent as string
    );
    
    // Complete the payment session to prevent duplicates
    paymentSessions.completeSession(userId, planId);
  } catch (error) {
    console.error('Failed to handle checkout session completion:', error);
  }
}

// Handle payment intent succeeded (for embedded flow)
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { planId, userId } = paymentIntent.metadata;
  
  if (!planId || !userId) {
    console.log('Payment intent succeeded but missing metadata:', paymentIntent.id);
    return;
  }
  
  console.log(`Payment intent succeeded for user ${userId}, plan ${planId}`);
  
  try {
    await confirmPaymentWithBackend(
      planId, 
      userId, 
      paymentIntent.id, 
      paymentIntent.id
    );
    
    // Complete the payment session to prevent duplicates
    paymentSessions.completeSession(userId, planId);
  } catch (error) {
    console.error('Failed to handle payment intent success:', error);
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
