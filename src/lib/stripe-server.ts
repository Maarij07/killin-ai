import Stripe from 'stripe';

/**
 * Serverless-compatible Stripe initialization
 * This function creates a new Stripe instance for each serverless function call
 * to avoid issues with lazy initialization in serverless environments like Vercel
 */
export function createStripeInstance(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  
  if (process.env.STRIPE_SECRET_KEY.includes('your_secret_key_here')) {
    throw new Error('STRIPE_SECRET_KEY is not properly configured - using placeholder value');
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
    typescript: true,
  });
}

/**
 * Validate that required environment variables are present
 */
export function validateStripeConfig(): { isValid: boolean; error?: string } {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { isValid: false, error: 'STRIPE_SECRET_KEY is not set in environment variables' };
  }
  
  if (process.env.STRIPE_SECRET_KEY.includes('your_secret_key_here')) {
    return { isValid: false, error: 'STRIPE_SECRET_KEY is not properly configured - using placeholder value' };
  }
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return { isValid: false, error: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables' };
  }
  
  return { isValid: true };
}

/**
 * Common error response helper for Stripe API routes
 */
export function createErrorResponse(message: string, status: number = 500) {
  return {
    error: message,
    timestamp: new Date().toISOString(),
    status
  };
}
