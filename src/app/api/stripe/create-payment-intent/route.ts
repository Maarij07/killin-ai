import { NextRequest, NextResponse } from 'next/server';
import { createStripeInstance, validateStripeConfig } from '../../../../lib/stripe-server';

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

    const { planId, userId, userEmail } = await request.json();
    
    console.log('Received payment intent request:', {
      planId,
      userId,
      userEmail
    });

    if (!planId) {
      console.error('Missing required parameters:', { planId });
      return NextResponse.json(
        { error: 'Missing required parameters: planId is required' },
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

    // Plan configuration with amounts in cents
    const planConfig = {
      trial: { amount: 2500, description: 'Trial Plan - 100 minutes' },
      starter: { amount: 19900, description: 'Starter Plan - Monthly subscription' },
      professional: { amount: 46900, description: 'Professional Plan - Monthly subscription' },
      enterprise: { amount: 89900, description: 'Enterprise Plan - Monthly subscription' },
      custom: { amount: 0, description: 'Custom Plan - Contact sales for pricing' },
      'ai-voice': { amount: 2500, description: 'AI Voice Add-on - Monthly subscription' },
      minutes_100: { amount: 4000, description: '100 Minutes Top-up' },
      minutes_250: { amount: 7500, description: '250 Minutes Top-up' },
      minutes_500: { amount: 14000, description: '500 Minutes Top-up' },
      minutes_1000: { amount: 26000, description: '1000 Minutes Top-up' },
    };

    const config = planConfig[planId as keyof typeof planConfig];
    
    if (!config) {
      console.error(`Unknown plan ID: ${planId}. Available plans:`, Object.keys(planConfig));
      return NextResponse.json(
        { error: `Invalid plan selected: ${planId}` },
        { status: 400 }
      );
    }

    // Handle custom and enterprise plans that require sales contact
    if (planId === 'custom' || (planId === 'enterprise' && config.amount === 0)) {
      console.log(`${planId} plan requires sales contact`);
      return NextResponse.json(
        { error: 'This plan requires sales contact. Please contact our sales team.' },
        { status: 400 }
      );
    }

    console.log('Creating payment intent with config:', config);

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: config.amount,
      currency: 'usd',
      description: config.description,
      metadata: {
        planId: planId,
        userId: userId || '',
        userEmail: userEmail || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created successfully:', paymentIntent.id);
    
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: config.amount,
      description: config.description
    });

  } catch (error) {
    console.error('Detailed error creating payment intent:', error);
    
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    );
  }
}
