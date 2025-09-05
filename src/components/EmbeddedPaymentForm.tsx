'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import colors from '../../colors.json';

interface EmbeddedPaymentFormProps {
  clientSecret: string;
  planId: string;
  planName: string;
  planPrice: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EmbeddedPaymentForm({
  clientSecret,
  planId,
  planName,
  planPrice,
  onSuccess,
  onCancel
}: EmbeddedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentElementOptions = {
    layout: 'tabs' as const,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      showError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pricing?success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          showError(error.message || 'Payment failed. Please check your payment details.');
        } else {
          showError('An unexpected error occurred. Please try again.');
        }
      } else {
        // Payment succeeded - now call our API to confirm the payment
        console.log('Payment succeeded, confirming with backend...');
        await confirmPaymentWithBackend();
        
        showSuccess(`Payment successful! Welcome to the ${planName} plan.`);
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      showError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to confirm payment with our backend
  const confirmPaymentWithBackend = async () => {
    if (!user?.id) {
      console.error('No user ID available for payment confirmation');
      return;
    }

    try {
      // Plan configuration to map planId to minutes and plan_type
      const planConfig: { [key: string]: { minutes: number; plan_type: string; amount: number } } = {
        trial: { minutes: 100, plan_type: 'trial', amount: 25.00 },
        starter: { minutes: 250, plan_type: 'starter', amount: 199.00 },
        professional: { minutes: 450, plan_type: 'professional', amount: 469.00 },
        'ai-voice': { minutes: 0, plan_type: 'ai-voice', amount: 25.00 },
        minutes_100: { minutes: 100, plan_type: 'minutes', amount: 40.00 },
        minutes_250: { minutes: 250, plan_type: 'minutes', amount: 75.00 },
        minutes_500: { minutes: 500, plan_type: 'minutes', amount: 140.00 },
        minutes_1000: { minutes: 1000, plan_type: 'minutes', amount: 260.00 },
      };

      const config = planConfig[planId];
      if (!config) {
        console.error(`Unknown plan ID: ${planId}`);
        return;
      }

      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret_')[0];
      
      // Prepare the API payload
      const payload = {
        user_id: user.id,
        plan_type: config.plan_type,
        amount_paid: config.amount,
        transaction_id: paymentIntentId, // Use payment intent ID as transaction ID
        payment_intent_id: paymentIntentId,
        minutes: config.minutes,
        is_admin: false // This is a user payment, not admin action
      };

      console.log('Confirming payment with payload:', payload);

      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Payment confirmation failed:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to confirm payment');
      }

      const result = await response.json();
      console.log('Payment confirmation successful:', result);

    } catch (error) {
      console.error('Error confirming payment with backend:', error);
      // Don't throw the error here - we don't want to break the user experience
      // The payment already succeeded with Stripe, the backend confirmation is secondary
    }
  };


  return (
    <div className="w-full max-w-md mx-auto">
      {/* Plan Summary */}
      <div className="mb-6 p-4 rounded-2xl border-2 border-dashed"
        style={{
          borderColor: colors.colors.primary + '40',
          backgroundColor: colors.colors.primary + '10'
        }}>
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2" 
            style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
            {planName} Plan
          </h3>
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-black" style={{ color: colors.colors.primary }}>
              ${planPrice}
            </span>
            <span className="text-sm ml-2" 
              style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
              {planName.toLowerCase().includes('minutes') ? 'one-time' : '/month'}
            </span>
          </div>
          <p className="text-sm mt-2" 
            style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
            Secure payment powered by Stripe
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Element */}
        <div className="p-4 rounded-2xl border"
          style={{
            backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
            borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300]
          }}>
          <PaymentElement 
            id="payment-element"
            options={paymentElementOptions}
          />
        </div>

        {/* Billing Address */}
        <div className="p-4 rounded-2xl border"
          style={{
            backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
            borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300]
          }}>
          <h4 className="text-sm font-semibold mb-3"
            style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
            Billing Address
          </h4>
          <AddressElement 
            options={{ 
              mode: 'billing',
              allowedCountries: ['US', 'CA'],
              defaultValues: {
                name: user?.name || '',
              }
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-3 px-6 rounded-xl font-semibold border-2 transition-all duration-200 disabled:opacity-50"
            style={{
              borderColor: isDark ? colors.colors.grey[600] : colors.colors.grey[300],
              backgroundColor: 'transparent',
              color: isDark ? colors.colors.white : colors.colors.dark
            }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="flex-1 py-3 px-6 rounded-xl font-bold text-white uppercase tracking-wide transition-all duration-200 disabled:opacity-50 hover:opacity-90"
            style={{
              backgroundColor: colors.colors.primary,
              boxShadow: `0 4px 14px 0 ${colors.colors.primary}40`
            }}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              `Pay $${planPrice}`
            )}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="text-center mt-4">
        <p className="text-xs" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
}
