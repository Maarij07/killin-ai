import { useState } from 'react';
import { getStripe } from '../lib/stripe';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { showError, showSuccess } = useToast();

  const createCheckoutSession = async (planId: string) => {
    if (!user) {
      showError('Please sign in to purchase a plan');
      return;
    }

    setLoading(true);

    try {
      // Map plan IDs to actual Stripe price IDs
      const priceIdMap: Record<string, string> = {
        starter: 'price_1S3jdY3oMRus0y5mZHkl9Msl',
        professional: 'price_1S3jdZ3oMRus0y5mGQUmTwlW',
        'ai-voice': 'price_1S3jda3oMRus0y5mZMriyL2y',
        minutes_100: 'price_1S3jdb3oMRus0y5mRNy3raUi',
        minutes_250: 'price_1S3jdc3oMRus0y5mrQyW6zro',
        minutes_500: 'price_1S3jdd3oMRus0y5m0s9TpEDX',
        minutes_1000: 'price_1S3jde3oMRus0y5mf5ymwdR8',
      };

      const priceId = priceIdMap[planId];
      
      if (!priceId) {
        throw new Error('Invalid plan selected');
      }

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

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      const { error: stripeError } = await stripe!.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      showError(error instanceof Error ? error.message : 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
  };
};
