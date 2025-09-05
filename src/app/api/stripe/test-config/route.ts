import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        error: 'STRIPE_SECRET_KEY not found in environment variables',
        configured: false 
      }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in environment variables',
        configured: false 
      }, { status: 500 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });

    // Try to retrieve account info (this will fail if keys don't match)
    const account = await stripe.accounts.retrieve();
    
    // Check if both keys are from the same account
    const secretKeyAccountId = process.env.STRIPE_SECRET_KEY.split('_')[2];
    const publishableKeyAccountId = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.split('_')[2];
    
    const keysMatch = secretKeyAccountId === publishableKeyAccountId;

    return NextResponse.json({
      configured: true,
      testMode: process.env.STRIPE_SECRET_KEY.includes('test'),
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
