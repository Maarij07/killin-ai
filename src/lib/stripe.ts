import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    // Primary: Try to get from environment
    let publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    // Fallback: Use hardcoded key as emergency fallback
    if (!publishableKey) {
      console.warn('Environment variable not found, using fallback Stripe key');
      publishableKey = 'pk_test_51S2wlyQRGOH1vbKBntiuLV6YgpKTtvgTh9N8BMlk2huWchuVKyauuoY3veeLfefqtSRbK8WviHe4xQxKYjcrBXPo00gxcUgJgp';
    }
    
    if (publishableKey.includes('your_publishable_key_here')) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is using placeholder value');
      throw new Error('Stripe configuration error: Publishable key not properly configured');
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Price IDs for different plans (you'll need to create these products in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  starter: 'price_starter', // Replace with actual Stripe price ID
  professional: 'price_professional', // Replace with actual Stripe price ID
  enterprise: 'price_enterprise', // Replace with actual Stripe price ID
  'ai-voice': 'price_ai_voice', // Replace with actual Stripe price ID
  // Add-on minutes
  minutes_100: 'price_minutes_100',
  minutes_250: 'price_minutes_250',
  minutes_500: 'price_minutes_500',
  minutes_1000: 'price_minutes_1000',
} as const;

export type StripePriceId = keyof typeof STRIPE_PRICE_IDS;
