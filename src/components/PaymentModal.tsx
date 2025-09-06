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
    if (loading) {
      console.log('Payment intent creation already in progress');
      return;
    }
    
    setLoading(true);
    setClientSecret(''); // Clear any existing client secret
    
    try {
      console.log('Creating payment intent for plan:', planId);
      
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
        console.error('Payment intent creation failed:', response.status, errorData);
        throw new Error(errorData.error || `Server error (${response.status}): Failed to create payment intent`);
      }

      const responseData = await response.json();
      console.log('Payment intent response:', responseData);
      
      if (!responseData.clientSecret) {
        throw new Error('No client secret received from server');
      }

      setClientSecret(responseData.clientSecret);
      console.log('Payment intent created successfully');
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment';
      showError(errorMessage);
      
      // Don't close the modal immediately, give user a chance to retry
      setTimeout(() => {
        if (!clientSecret) {
          console.log('No client secret after error, closing modal');
          onClose();
        }
      }, 5000); // Close after 5 seconds if no retry
    } finally {
      setLoading(false);
    }
  }, [planId, planName, planPrice, user?.id, user?.email, showError, onClose, loading, clientSecret]);

  // Create payment intent when modal opens - only once per modal opening
  useEffect(() => {
    if (isOpen && planId && !clientSecret && !loading) {
      console.log('Modal opened, creating payment intent for plan:', planId);
      createPaymentIntent();
    }
  }, [isOpen, planId]); // Removed createPaymentIntent from dependencies to prevent loops

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
      colorBackground: isDark ? colors.colors.dark : colors.colors.white,
      colorText: isDark ? colors.colors.white : colors.colors.dark,
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
      colorTextPlaceholder: isDark ? colors.colors.grey[400] : colors.colors.grey[500],
    },
    rules: {
      '.Input': {
        backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
        border: isDark ? `1px solid ${colors.colors.grey[500]}` : `1px solid ${colors.colors.grey[300]}`,
        borderRadius: '8px',
        transition: 'all 0.2s ease',
      },
      '.Input:focus': {
        borderColor: colors.colors.primary,
        boxShadow: `0 0 0 2px ${colors.colors.primary}20`,
      },
      '.Tab': {
        backgroundColor: isDark ? colors.colors.grey[700] : 'transparent',
        border: isDark ? `1px solid ${colors.colors.grey[500]}` : `1px solid ${colors.colors.grey[300]}`,
      },
      '.Tab--selected': {
        backgroundColor: colors.colors.primary,
        color: 'white',
        borderColor: colors.colors.primary,
      }
    }
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
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide rounded-3xl shadow-2xl transform transition-all duration-300 scale-100"
        style={{ 
          backgroundColor: 'transparent',
          background: isDark 
            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
            : colors.colors.white,
          border: isDark
            ? `2px solid #4a5568`
            : `1px solid ${colors.colors.grey[200]}`,
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 pb-0"
          style={{ 
            backgroundColor: isDark 
              ? 'transparent'
              : colors.colors.white,
            background: isDark 
              ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
              : colors.colors.white,
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
        <div className="p-6"
          style={{
            backgroundColor: isDark 
              ? 'transparent'
              : colors.colors.white,
            background: isDark 
              ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
              : colors.colors.white,
          }}>
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
