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

    console.log('Creating Stripe checkout session with price ID:', priceId);

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
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
