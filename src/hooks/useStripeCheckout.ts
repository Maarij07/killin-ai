import { useState } from 'react';
import { getStripe } from '../lib/stripe';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { showError } = useToast();

  const createCheckoutSession = async (planId: string) => {
    if (!user) {
      showError('Please sign in to purchase a plan');
      return;
    }

    // Check if Stripe is properly configured
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      showError('Stripe is not configured. Please contact support.');
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return;
    }

    setLoading(true);

    try {
      // Map plan IDs to actual Stripe price IDs
      const priceIdMap: Record<string, string> = {
        trial: 'price_1S3jdX3oMRus0y5mXXXXXXXX', // Trial plan
        starter: 'price_1S3jdY3oMRus0y5mZHkl9Msl',
        professional: 'price_1S3jdZ3oMRus0y5mGQUmTwlW',
        enterprise: 'price_1S3jdZ3oMRus0y5mGQUmTwlW', // Same as professional for now
        'ai-voice': 'price_1S3jda3oMRus0y5mZMriyL2y',
        minutes_100: 'price_1S3jdb3oMRus0y5mRNy3raUi',
        minutes_250: 'price_1S3jdc3oMRus0y5mrQyW6zro',
        minutes_500: 'price_1S3jdd3oMRus0y5m0s9TpEDX',
        minutes_1000: 'price_1S3jde3oMRus0y5mf5ymwdR8',
      };

      const priceId = priceIdMap[planId];
      
      if (!priceId) {
        throw new Error(`Plan "${planId}" is not available for purchase`);
      }

      console.log('Creating checkout session for:', { planId, priceId, userId: user.id });

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planId,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (!sessionId) {
        throw new Error('No session ID received from server');
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      
      if (!stripe) {
        throw new Error('Failed to load Stripe. Please refresh the page and try again.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Failed to redirect to Stripe checkout');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          showError('Authentication failed. Please check your Stripe configuration.');
        } else if (error.message.includes('402')) {
          showError('This feature requires a valid payment method.');
        } else if (error.message.includes('404')) {
          showError('The selected plan is not available. Please contact support.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          showError('Network error. Please check your connection and try again.');
        } else {
          showError(error.message);
        }
      } else {
        showError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
  };
};
