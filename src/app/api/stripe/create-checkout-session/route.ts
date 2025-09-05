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
    const { priceId, planId, userId, userEmail } = await request.json();
    
    console.log('Received checkout session request:', {
      priceId,
      planId,
      userId,
      userEmail
    });

    if (!priceId || !planId) {
      console.error('Missing required parameters:', { priceId, planId });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get Stripe instance and check if available
    const stripeInstance = getStripe();
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_secret_key_here') || !stripeInstance) {
      console.error('Stripe secret key not configured properly or Stripe instance not available');
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }

    console.log('Creating Stripe checkout session with price ID:', priceId);

    // Create the checkout session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: planId.includes('minutes') ? 'payment' : 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      customer_email: userEmail,
      metadata: {
        planId: planId,
        userId: userId || '',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    console.log('Stripe session created successfully:', session.id);
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Detailed error creating checkout session:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('price') || error.message.includes('No such price')) {
        return NextResponse.json(
          { error: 'Invalid price ID. Please contact support.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
