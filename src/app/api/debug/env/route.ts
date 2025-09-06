import { NextResponse } from 'next/server';

export async function GET() {
  // Only enable in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ 
      error: 'This endpoint is only available in development mode' 
    }, { status: 403 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    stripe: {
      secretKey: {
        exists: !!stripeSecretKey,
        isPlaceholder: stripeSecretKey?.includes('your_secret_key_here') || false,
        prefix: stripeSecretKey ? stripeSecretKey.substring(0, 12) + '...' : 'N/A'
      },
      publishableKey: {
        exists: !!stripePublishableKey,
        isPlaceholder: stripePublishableKey?.includes('your_publishable_key_here') || false,
        prefix: stripePublishableKey ? stripePublishableKey.substring(0, 12) + '...' : 'N/A'
      }
    },
    allStripeEnvVars: Object.keys(process.env).filter(key => 
      key.includes('STRIPE')
    ).map(key => ({
      name: key,
      exists: !!process.env[key],
      isPlaceholder: process.env[key]?.includes('your_') || false
    }))
  });
}
