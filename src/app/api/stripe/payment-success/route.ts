import { NextRequest, NextResponse } from 'next/server';
import { createStripeInstance, validateStripeConfig } from '../../../../lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration first
    const configValidation = validateStripeConfig();
    if (!configValidation.isValid) {
      console.error('Stripe configuration error:', configValidation.error);
      return NextResponse.json(
        { error: `Stripe configuration error: ${configValidation.error}` },
        { status: 500 }
      );
    }

    const { session_id, user_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
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

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const { planId, userId } = session.metadata!;
    
    // Use provided user_id if session metadata doesn't have it
    const finalUserId = userId || user_id;

    if (!finalUserId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Map plan IDs to minutes and plan types (same as webhook)
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
      return NextResponse.json(
        { error: 'Unknown plan type' },
        { status: 400 }
      );
    }

    // Prepare payment confirmation data
    const paymentData = {
      user_id: parseInt(finalUserId),
      plan_type: config.plan_type,
      amount_paid: config.amount,
      transaction_id: session.id,
      payment_intent_id: session.payment_intent as string,
      minutes: config.minutes
    };

    console.log('Processing successful payment:', paymentData);

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
      return NextResponse.json(
        { error: 'Failed to confirm payment with backend' },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Payment confirmation successful:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Payment processed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error processing payment success:', error);
    return NextResponse.json(
      { error: 'Error processing payment success' },
      { status: 500 }
    );
  }
}
