'use client';

import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import { getPlanConfig } from '../config/plans';
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
  clientSecret, // eslint-disable-line @typescript-eslint/no-unused-vars
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

    if (isProcessing) {
      console.log('Payment already processing, ignoring duplicate submission');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting payment confirmation process...');
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pricing?success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        if (error.type === 'card_error' || error.type === 'validation_error') {
          showError(error.message || 'Payment failed. Please check your payment details.');
        } else {
          showError('An unexpected error occurred. Please try again.');
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!', paymentIntent.id);
        
        // Payment succeeded - now call our API to confirm the payment
        console.log('Payment succeeded, confirming with backend...');
        const backendConfirmed = await confirmPaymentWithBackend(paymentIntent.id);
        
        if (backendConfirmed) {
          showSuccess(`Payment successful! Welcome to the ${planName} plan.`);
          onSuccess();
        } else {
          showError('Payment completed but account update failed. Please contact support.');
        }
      } else {
        console.log('Payment requires additional action or failed:', paymentIntent?.status);
        showError('Payment could not be completed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to confirm payment with our backend
  const confirmPaymentWithBackend = async (paymentIntentId: string): Promise<boolean> => {
    if (!user?.id) {
      console.error('No user ID available for payment confirmation');
      return false;
    }

    try {
      // Get plan configuration from centralized source
      const config = getPlanConfig(planId);
      if (!config) {
        console.error(`Unknown plan ID: ${planId}`);
        return false;
      }
      
      // Check if this is an add-on (don't pass plan_type for add-ons)
      const isAddOn = config.plan_type === 'minutes' || config.id === 'ai-voice';
      
      // Prepare the API payload
      interface PaymentPayload {
        user_id: string;
        amount_paid: number;
        transaction_id: string;
        payment_intent_id: string;
        minutes: number;
        is_admin: boolean;
        plan_type?: string;
      }
      
      const payload: PaymentPayload = {
        user_id: user.id,
        amount_paid: config.price,
        transaction_id: paymentIntentId,
        payment_intent_id: paymentIntentId,
        minutes: config.minutes,
        is_admin: false // This is a user payment, not admin action
      };
      
      // Only add plan_type for main plans, not for add-ons
      if (!isAddOn) {
        payload.plan_type = config.plan_type;
      }

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
        return false;
      }

      const result = await response.json();
      console.log('Payment confirmation successful:', result);

      return true;

    } catch (error) {
      console.error('Error confirming payment with backend:', error);
      return false;
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
        <div className="p-4 rounded-2xl border transition-all duration-200"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.colors.white,
            borderColor: isDark ? colors.colors.grey[500] : colors.colors.grey[300],
            backdropFilter: isDark ? 'blur(10px)' : 'none'
          }}>
          <PaymentElement 
            id="payment-element"
            options={paymentElementOptions}
          />
        </div>

        {/* User Info Display - No billing address required */}
        <div className="p-4 rounded-2xl border transition-all duration-200"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.colors.white,
            borderColor: isDark ? colors.colors.grey[500] : colors.colors.grey[300],
            backdropFilter: isDark ? 'blur(10px)' : 'none'
          }}>
          <h4 className="text-sm font-semibold mb-3"
            style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
            Account Information
          </h4>
          <div className="text-sm"
            style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Name:</strong> {user?.name}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-3 px-6 rounded-xl font-semibold border-2 transition-all duration-200 disabled:opacity-50 hover:bg-gray-600/20"
            style={{
              borderColor: isDark ? colors.colors.grey[500] : colors.colors.grey[300],
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
              color: isDark ? colors.colors.grey[200] : colors.colors.dark,
              backdropFilter: isDark ? 'blur(5px)' : 'none'
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
