import { NextResponse } from 'next/server';
import { createStripeInstance, validateStripeConfig } from '../../../../lib/stripe-server';

export async function GET() {
  console.log('🔍 Testing Stripe configuration...');
  
  try {
    // Test 1: Check environment variables
    const env = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET (length: ' + process.env.STRIPE_SECRET_KEY.length + ')' : 'NOT SET',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.length + ')' : 'NOT SET'
    };
    console.log('Environment variables:', env);
    
    // Test 2: Validate configuration
    const validation = validateStripeConfig();
    console.log('Configuration validation:', validation);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        step: 'validation',
        error: validation.error,
        env
      }, { status: 400 });
    }
    
    // Test 3: Create Stripe instance
    let stripe;
    try {
      stripe = createStripeInstance();
      console.log('✅ Stripe instance created successfully');
    } catch (stripeError) {
      console.error('❌ Failed to create Stripe instance:', stripeError);
      return NextResponse.json({
        success: false,
        step: 'stripe_instance',
        error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        env
      }, { status: 500 });
    }
    
    // Test 4: Try to create a minimal payment intent
    try {
      const testPaymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00
        currency: 'usd',
        description: 'Test payment intent',
        metadata: {
          test: 'true'
        }
      });
      
      console.log('✅ Test payment intent created:', testPaymentIntent.id);
      
      return NextResponse.json({
        success: true,
        message: 'Stripe configuration is working!',
        paymentIntentId: testPaymentIntent.id,
        env
      });
      
    } catch (paymentError) {
      console.error('❌ Failed to create test payment intent:', paymentError);
      return NextResponse.json({
        success: false,
        step: 'payment_intent',
        error: paymentError instanceof Error ? paymentError.message : 'Unknown error',
        env
      }, { status: 500 });
    }
    
  } catch (generalError) {
    console.error('❌ General error in Stripe test:', generalError);
    return NextResponse.json({
      success: false,
      step: 'general',
      error: generalError instanceof Error ? generalError.message : 'Unknown error'
    }, { status: 500 });
  }
}
