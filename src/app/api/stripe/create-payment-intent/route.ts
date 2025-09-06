import { NextRequest, NextResponse } from 'next/server';
import { createStripeInstance, validateStripeConfig } from '../../../../lib/stripe-server';
import { getPlanConfig } from '../../../../config/plans';
import { paymentSessions } from '../../../../lib/payment-sessions';

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration
    const configValidation = validateStripeConfig();
    if (!configValidation.isValid) {
      console.error('Stripe configuration error:', configValidation.error);
      return NextResponse.json(
        { error: `Stripe configuration error: ${configValidation.error}` },
        { status: 500 }
      );
    }

    // Parse request body with better error handling
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      );
    }

    const { planId, userId, userEmail } = requestBody;
    
    console.log('Received payment intent request:', {
      planId,
      userId,
      userEmail
    });

    if (!planId || !userId) {
      console.error('Missing required parameters:', { planId, userId });
      return NextResponse.json(
        { error: 'Missing required parameters: planId and userId are required' },
        { status: 400 }
      );
    }

    // Check if there's already an active payment session for this user/plan
    const existingSession = paymentSessions.getExistingSession(userId, planId);
    if (existingSession) {
      console.log(`Returning existing payment session for user ${userId}, plan ${planId}`);
      return NextResponse.json({
        clientSecret: existingSession.clientSecret,
        paymentIntentId: existingSession.paymentIntentId,
        amount: getPlanConfig(planId)?.amountCents || 0,
        description: getPlanConfig(planId)?.description || '',
        planConfig: {
          id: planId,
          name: getPlanConfig(planId)?.name || '',
          minutes: getPlanConfig(planId)?.minutes || 0,
          plan_type: getPlanConfig(planId)?.plan_type || ''
        }
      });
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

    // Get plan configuration from centralized source
    const planConfig = getPlanConfig(planId);
    
    if (!planConfig) {
      console.error(`Unknown plan ID: ${planId}`);
      return NextResponse.json(
        { error: `Invalid plan selected: ${planId}` },
        { status: 400 }
      );
    }

    // Handle enterprise plans that require sales contact
    if (planId === 'enterprise') {
      console.log(`${planId} plan requires sales contact`);
      return NextResponse.json(
        { error: 'Enterprise plan requires sales contact. Please contact our sales team.' },
        { status: 400 }
      );
    }

    // Prevent duplicate payment intents for the same user/plan combination
    const idempotencyKey = `${userId}-${planId}-${Date.now()}`;
    
    console.log('Creating payment intent with idempotency key:', idempotencyKey);

    console.log('Creating payment intent with config:', planConfig);

    // Create the payment intent with idempotency to prevent duplicates
    const paymentIntent = await stripe.paymentIntents.create({
      amount: planConfig.amountCents,
      currency: 'usd',
      description: planConfig.description,
      metadata: {
        planId: planId,
        userId: userId || '',
        userEmail: userEmail || '',
        planType: planConfig.plan_type,
        minutes: planConfig.minutes.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    }, {
      idempotencyKey: idempotencyKey
    });

    console.log('Payment intent created successfully:', paymentIntent.id);
    
    // Create a session to track this payment intent and prevent duplicates
    paymentSessions.createSession(
      userId, 
      planId, 
      paymentIntent.id, 
      paymentIntent.client_secret || ''
    );
    
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: planConfig.amountCents,
      description: planConfig.description,
      planConfig: {
        id: planConfig.id,
        name: planConfig.name,
        minutes: planConfig.minutes,
        plan_type: planConfig.plan_type
      }
    });

  } catch (error) {
    console.error('Detailed error creating payment intent:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { 
        error: 'Error creating payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
