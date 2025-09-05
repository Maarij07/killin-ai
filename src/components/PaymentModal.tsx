'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripe';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import EmbeddedPaymentForm from './EmbeddedPaymentForm';
import colors from '../../colors.json';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  planPrice: string;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  planId,
  planName,
  planPrice,
  onSuccess
}: PaymentModalProps) {
  const { isDark } = useTheme();
  const { showError } = useToast();
  const { user } = useUser();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const stripe = getStripe();

  const createPaymentIntent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          planName,
          planPrice,
          userId: user?.id,
          userEmail: user?.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      
      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      setClientSecret(clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      showError(error instanceof Error ? error.message : 'Failed to initialize payment');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [planId, planName, planPrice, user?.id, user?.email, showError, onClose]);

  // Create payment intent when modal opens
  useEffect(() => {
    if (isOpen && planId) {
      createPaymentIntent();
    }
  }, [isOpen, planId, createPaymentIntent]);

  const handleSuccess = () => {
    setClientSecret(''); // Clear the client secret
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    setClientSecret(''); // Clear the client secret
    onClose();
  };

  if (!isOpen) return null;

  const appearance = {
    theme: isDark ? ('night' as const) : ('stripe' as const),
    variables: {
      colorPrimary: colors.colors.primary,
      colorBackground: isDark ? colors.colors.grey[800] : colors.colors.white,
      colorText: isDark ? colors.colors.white : colors.colors.dark,
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm transition-opacity duration-300"
        style={{ backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl transform transition-all duration-300 scale-100"
        style={{ 
          backgroundColor: isDark ? colors.colors.grey[900] : colors.colors.white,
          border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 pb-0"
          style={{ 
            backgroundColor: isDark ? colors.colors.grey[900] : colors.colors.white,
          }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold"
              style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
              Complete Your Purchase
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              style={{ 
                color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] 
              }}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="h-px"
            style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[200] }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            // Loading State
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: colors.colors.primary + '40', borderTopColor: 'transparent' }}
              />
              <p className="text-lg font-medium mb-2"
                style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                Initializing Payment
              </p>
              <p className="text-sm"
                style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                Setting up secure payment form...
              </p>
            </div>
          ) : clientSecret ? (
            // Payment Form
            <Elements 
              stripe={stripe} 
              options={{ 
                clientSecret,
                appearance,
                locale: 'en'
              }}
            >
              <EmbeddedPaymentForm
                clientSecret={clientSecret}
                planId={planId}
                planName={planName}
                planPrice={planPrice}
                onSuccess={handleSuccess}
                onCancel={handleClose}
              />
            </Elements>
          ) : (
            // Error State
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: colors.colors.primary + '20' }}>
                <XMarkIcon className="w-8 h-8" style={{ color: colors.colors.primary }} />
              </div>
              <p className="text-lg font-medium mb-2"
                style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                Payment Initialization Failed
              </p>
              <p className="text-sm mb-4"
                style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                We couldn&apos;t set up the payment form. Please try again.
              </p>
              <button
                onClick={createPaymentIntent}
                className="px-6 py-2 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: colors.colors.primary }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
