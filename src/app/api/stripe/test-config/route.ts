import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createStripeInstance, validateStripeConfig } from '../../../../lib/stripe-server';

export async function GET() {
  try {
    // Validate Stripe configuration first
    const configValidation = validateStripeConfig();
    if (!configValidation.isValid) {
      return NextResponse.json({ 
        error: configValidation.error,
        configured: false 
      }, { status: 500 });
    }

    // Initialize Stripe
    let stripe: Stripe;
    try {
      stripe = createStripeInstance();
    } catch (error) {
      return NextResponse.json({ 
        error: `Failed to initialize Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configured: false 
      }, { status: 500 });
    }

    // Try to retrieve account info (this will fail if keys don't match)
    const account = await stripe.accounts.retrieve();
    
    // Check if both keys are from the same account
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!secretKey || !publishableKey) {
      return NextResponse.json({ 
        error: 'Missing Stripe keys',
        configured: false 
      }, { status: 500 });
    }
    
    const secretKeyAccountId = secretKey.split('_')[2];
    const publishableKeyAccountId = publishableKey.split('_')[2];
    
    const keysMatch = secretKeyAccountId === publishableKeyAccountId;

    return NextResponse.json({
      configured: true,
      testMode: secretKey.includes('test'),
      accountId: account.id,
      accountEmail: account.email || 'Not provided',
      keysMatch,
      secretKeyAccount: secretKeyAccountId,
      publishableKeyAccount: publishableKeyAccountId,
      message: keysMatch 
        ? '✅ Stripe is properly configured!' 
        : '❌ Secret and publishable keys are from different accounts'
    });

  } catch (error) {
    console.error('Stripe configuration test failed:', error);
    
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Stripe configuration failed'
    }, { status: 500 });
  }
}
