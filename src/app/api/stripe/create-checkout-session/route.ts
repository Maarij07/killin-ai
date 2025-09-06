import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Serverless-compatible Stripe initialization
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
    typescript: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment first
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Stripe configuration error: Missing secret key' },
        { status: 500 }
      );
    }

    if (process.env.STRIPE_SECRET_KEY.includes('your_secret_key_here')) {
      console.error('Stripe secret key is not properly configured - using placeholder');
      return NextResponse.json(
        { error: 'Stripe configuration error: Invalid secret key' },
        { status: 500 }
      );
    }

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
        { error: 'Missing required parameters: priceId and planId are required' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    let stripeInstance: Stripe;
    try {
      stripeInstance = getStripe();
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      return NextResponse.json(
        { error: 'Stripe initialization failed' },
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
