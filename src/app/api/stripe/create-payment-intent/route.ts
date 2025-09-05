import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe lazily to avoid build-time issues
let stripe: Stripe | null = null;

const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripe;
};

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, userEmail } = await request.json();
    
    console.log('Received payment intent request:', {
      planId,
      userId,
      userEmail
    });

    if (!planId) {
      console.error('Missing required parameters:', { planId });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get Stripe instance and check if available
    const stripeInstance = getStripe();
    if (!process.env.STRIPE_SECRET_KEY || !stripeInstance) {
      console.error('Stripe secret key not configured properly');
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }

    // Plan configuration with amounts in cents
    const planConfig = {
      trial: { amount: 2500, description: 'Trial Plan - 100 minutes' },
      starter: { amount: 19900, description: 'Starter Plan - Monthly subscription' },
      professional: { amount: 46900, description: 'Professional Plan - Monthly subscription' },
      'ai-voice': { amount: 2500, description: 'AI Voice Add-on - Monthly subscription' },
      minutes_100: { amount: 4000, description: '100 Minutes Top-up' },
      minutes_250: { amount: 7500, description: '250 Minutes Top-up' },
      minutes_500: { amount: 14000, description: '500 Minutes Top-up' },
      minutes_1000: { amount: 26000, description: '1000 Minutes Top-up' },
    };

    const config = planConfig[planId as keyof typeof planConfig];
    
    if (!config) {
      console.error(`Unknown plan ID: ${planId}`);
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    console.log('Creating payment intent with config:', config);

    // Create the payment intent
    const paymentIntent = await stripeInstance.paymentIntents.create({
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
