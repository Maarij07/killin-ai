'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';
import { CheckIcon, MicrophoneIcon, BuildingStorefrontIcon, CogIcon, PhoneIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { useEmbeddedPayment } from '../hooks/useEmbeddedPayment';
import PaymentModal from './PaymentModal';
import { useSearchParams } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import colors from '../../colors.json';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  featured: boolean;
  color: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'trial',
    name: 'Trial',
    price: '25.00',
    period: '100 mins',
    description: 'Perfect trial package to test our AI phone assistance with generous minutes.',
    features: [
      '100 minutes included',
      'Basic voice assistant',
      'Simple dashboard',
      'Email support',
      'Great for testing'
    ],
    featured: false,
    color: colors.colors.grey[600]
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '199.00',
    period: 'Per Month',
    description: 'Perfect for small restaurants getting started with AI phone assistance.',
    features: [
      '250+ calls per month',
      '1 Twilio number',
      '1 Voice assistant',
      '1 Dashboard',
      'Customer SMS notify',
      '24/7 Support'
    ],
    featured: false,
    color: colors.colors.grey[500]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '469.00',
    period: 'Per Month',
    description: 'Ideal for busy restaurants with high call volumes and premium requirements.',
    features: [
      '450+ calls per month',
      '1 Twilio number',
      '1 Voice assistant',
      '1 Dashboard',
      'Customer SMS notify',
      '24/7 Support'
    ],
    featured: true,
    color: colors.colors.primary
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '899.00+',
    period: 'Per Month',
    description: 'Complete solution for restaurant chains and high-volume establishments.',
    features: [
      '900+ calls per month',
      '1 Twilio number',
      '1 Voice assistant',
      '1 Dashboard',
      'Customer SMS notify',
      '24/7 Support'
    ],
    featured: false,
    color: colors.colors.primary
  }
];

interface UserDetails {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: string;
  minutes_allowed: number;
  minutes_used: number;
  agent_id: string;
  twilio_phone_number?: string;
  created_at?: string;
  [key: string]: string | number | boolean | undefined;
}

interface UserPricingProps {
  userPlan?: string | null;
}

export default function UserPricing({ userPlan }: UserPricingProps) {
  const { isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading] = useState(false);
  const {
    isModalOpen,
    selectedPlan: embeddedSelectedPlan,
    openPaymentModal,
    closePaymentModal,
    handlePaymentSuccess: originalHandlePaymentSuccess
  } = useEmbeddedPayment();

  // Enhanced payment success handler that refreshes user details
  const handlePaymentSuccess = async () => {
    console.log('🎉 Payment successful! Refreshing user details...');
    
    // Call the original payment success handler
    originalHandlePaymentSuccess();
    
    // Wait a moment for the backend to process the update
    setTimeout(async () => {
      await fetchUserDetails(false); // Don't show loading since payment modal is closing
      showSuccess('Payment successful! Your account has been updated.');
    }, 2000); // 2-second delay to ensure backend processing
  };
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { showSuccess, showError } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Helper function to normalize plan name
  const getNormalizedPlan = (plan?: string | null) => {
    if (!plan || plan.trim() === '') {
      return 'free';
    }
    return plan.toLowerCase();
  };

  const normalizedUserPlan = getNormalizedPlan(userPlan);

  // Log for debugging
  console.log('User plan:', userPlan, 'Normalized:', normalizedUserPlan);

  // Function to fetch user details (extracted for reusability)
  const fetchUserDetails = useCallback(async (showLoading = true) => {
    if (!user?.id) {
      setIsLoadingDetails(false);
      return;
    }
    
    if (showLoading) {
      setIsLoadingDetails(true);
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Fetching user details for user ID:', user.id);
      
      const response = await fetch('https://3758a6b3509d.ngrok-free.app/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('All users data response:', data);
        
        // Find current user by ID
        const currentUserDetails = data.users?.find((u: UserDetails) => u.id === parseInt(user.id)) || data.find((u: UserDetails) => u.id === parseInt(user.id));
        
        if (currentUserDetails) {
          setUserDetails(currentUserDetails);
          console.log('✅ Found current user details:', currentUserDetails);
        } else {
          console.log('❌ User not found in users list, creating fallback');
          // Create a basic UserDetails object from context user data
          setUserDetails({
            id: parseInt(user.id),
            name: user.name,
            email: user.email,
            plan: 'Unknown',
            status: 'active',
            minutes_allowed: 0,
            minutes_used: 0,
            agent_id: 'N/A'
          });
        }
      } else {
        console.error('❌ Failed to fetch users:', response.status, response.statusText);
        showError('Failed to load user details');
      }
    } catch (error) {
      console.error('❌ Error fetching user details:', error);
      showError('Failed to load user details');
    } finally {
      if (showLoading) {
        setIsLoadingDetails(false);
      }
    }
  }, [user?.id, user, showError]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams?.get('success');
    const canceled = searchParams?.get('canceled');
    const sessionId = searchParams?.get('session_id');
    
    if (success && sessionId && user) {
      // Handle successful payment
      console.log('Payment successful! Processing...');
      
      // Call our payment success API to confirm with backend
      fetch('/api/stripe/payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: user.id
        }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showSuccess('Payment successful! Your plan has been updated.');
          console.log('Payment processed successfully:', data);
          // Optionally refresh user data or redirect
        } else {
          showError('Payment completed but there was an issue updating your account. Please contact support.');
        }
      })
      .catch(error => {
        console.error('Error processing payment success:', error);
        showError('Payment completed but there was an issue updating your account. Please contact support.');
      });
    }
    
    if (canceled) {
      console.log('Payment was canceled');
      showError('Payment was canceled. You can try again anytime.');
    }
  }, [searchParams, user, showSuccess, showError]);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    
    // Get plan details for the modal
    let planName = planId;
    let planPrice = '0';
    
    // Find plan details from pricing plans or addon plans
    const mainPlan = pricingPlans.find(p => p.id === planId);
    if (mainPlan) {
      planName = mainPlan.name;
      planPrice = mainPlan.price.replace('+', ''); // Remove + from enterprise price
    } else {
      // Handle addon plans
      const addonPlans: { [key: string]: { name: string; price: string } } = {
        'minutes_100': { name: '100 Minutes', price: '40.00' },
        'minutes_250': { name: '250 Minutes', price: '75.00' },
        'minutes_500': { name: '500 Minutes', price: '140.00' },
        'minutes_1000': { name: '1000 Minutes', price: '260.00' },
        'ai-voice': { name: 'AI Voice', price: '25.00' }
      };
      
      if (addonPlans[planId]) {
        planName = addonPlans[planId].name;
        planPrice = addonPlans[planId].price;
      }
    }
    
    // Open embedded payment modal instead of redirecting to Stripe Checkout
    await openPaymentModal(planId, planName, planPrice);
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
      showError(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <>
      {/* Add shimmer animation CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(400%) rotate(45deg);
          }
        }
      `}</style>
      
      <div className="min-h-screen transition-all duration-300 relative overflow-hidden"
        style={{
          background: isDark
            ? colors.colors.dark
            : colors.colors.white,
          transition: 'background 0.3s ease-in-out'
        }}>

      {/* Aesthetic blobs with your color theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: colors.colors.primary }}></div>
        <div className="absolute bottom-40 right-10 w-72 h-72 rounded-full opacity-5 blur-2xl"
          style={{ backgroundColor: colors.colors.primary }}></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-5 blur-xl transition-colors duration-300"
          style={{ backgroundColor: isDark ? colors.colors.grey[600] : colors.colors.grey[400] }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full opacity-5 blur-2xl transition-colors duration-300"
          style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[300] }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-8 sm:py-12">
        {/* User Summary Section */}
        {isLoadingDetails ? (
          /* Skeleton Loading */
          <div className="mb-16">
            {/* Summary Heading */}
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 transition-colors duration-300" 
                style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                Summary
              </h2>
              <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed transition-colors duration-300" 
                style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                Select the perfect AI phone assistant plan for your restaurant. Streamline your
              </p>
            </div>

            {/* Skeleton Summary Container */}
            <div className="max-w-7xl mx-auto px-4">
              <div className="relative overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8 h-auto"
                style={{
                  background: `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 100%)`,
                  border: `2px solid ${colors.colors.primary}30`
                }}>
                <div className="relative z-10 h-full">
                  {/* Skeleton Header */}
                  <div className="text-left mb-4 sm:mb-6">
                    <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4"
                      style={{ backgroundColor: colors.colors.primary }}>
                      User Summary
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                      <div>
                        {/* Skeleton Name */}
                        <div className="h-8 w-48 rounded mb-2 animate-pulse" 
                          style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[300] }}>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          {/* Skeleton Agent ID */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>Agent ID:</span>
                            <div className="h-6 w-32 rounded animate-pulse" 
                              style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[200] }}>
                            </div>
                          </div>
                          {/* Skeleton Status */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>Status:</span>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <div className="h-4 w-16 rounded animate-pulse" 
                                style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[300] }}>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skeleton Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-auto">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="relative rounded-2xl p-4 group cursor-default transition-all duration-300 flex flex-col justify-between overflow-hidden"
                        style={{
                          backgroundColor: 'transparent',
                          background: isDark 
                            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                          border: isDark
                            ? `2px solid #4a5568`
                            : `2px solid #cbd5e0`,
                          boxShadow: isDark
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease-in-out'
                        }}>
                        <div className="text-center">
                          {/* Skeleton Number */}
                          <div className="h-8 w-16 rounded mx-auto mb-2 animate-pulse" 
                            style={{ backgroundColor: colors.colors.primary + '40' }}>
                          </div>
                          {/* Skeleton Title */}
                          <div className="h-3 w-20 rounded mx-auto mb-1 animate-pulse" 
                            style={{ backgroundColor: isDark ? colors.colors.grey[600] : colors.colors.grey[400] }}>
                          </div>
                          {/* Skeleton Subtitle */}
                          <div className="h-3 w-12 rounded mx-auto animate-pulse" 
                            style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[300] }}>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !isLoadingDetails && userDetails && (
          <div className="mb-16">
            {/* Summary Heading */}
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 transition-colors duration-300" 
                style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                Summary
              </h2>
              <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed transition-colors duration-300" 
                style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                Select the perfect AI phone assistant plan for your restaurant. Streamline your
              </p>
            </div>

            {/* Orange Summary Container */}
            <div className="max-w-7xl mx-auto px-4">
              <div className="relative overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8 h-auto"
                style={{
                  background: `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 100%)`,
                  border: `2px solid ${colors.colors.primary}30`
                }}>
                <div className="relative z-10 h-full">
                  {/* Header */}
                  <div className="text-left mb-4 sm:mb-6">
                    <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4"
                      style={{ backgroundColor: colors.colors.primary }}>
                      User Summary
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                          {userDetails.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>Agent ID:</span>
                            <span className="text-sm font-mono px-2 py-1 rounded" 
                              style={{ 
                                backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[200],
                                color: isDark ? colors.colors.white : colors.colors.dark 
                              }}>
                              {userDetails.agent_id}
                            </span>
                            <button
                              onClick={() => copyToClipboard(userDetails.agent_id, 'Agent ID')}
                              className="p-1 rounded transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                              style={{ 
                                color: colors.colors.primary
                              }}
                              title="Copy Agent ID"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>Status:</span>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-sm font-semibold capitalize" style={{ color: colors.colors.primary }}>{userDetails.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 4 Summary Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-auto">
                    {/* Total Minutes Card */}
                    <div className="relative rounded-2xl p-4 group cursor-default transition-all duration-300 flex flex-col justify-between overflow-hidden"
                      style={{
                        backgroundColor: 'transparent',
                        background: isDark 
                          ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                        border: isDark
                          ? `2px solid #4a5568`
                          : `2px solid #cbd5e0`,
                        boxShadow: isDark
                          ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                          : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease-in-out'
                      }}>
                      <div className="text-center">
                        <h4 className="text-2xl font-black mb-2" style={{ color: colors.colors.primary }}>
                          {userDetails.minutes_allowed.toLocaleString()}
                        </h4>
                        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          Total Minutes
                        </p>
                        <p className="text-xs opacity-70" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          Allowed
                        </p>
                      </div>
                    </div>
                    
                    {/* Used Minutes Card */}
                    <div className="relative rounded-2xl p-4 group cursor-default transition-all duration-300 flex flex-col justify-between overflow-hidden"
                      style={{
                        backgroundColor: 'transparent',
                        background: isDark 
                          ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                        border: isDark
                          ? `2px solid #4a5568`
                          : `2px solid #cbd5e0`,
                        boxShadow: isDark
                          ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                          : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease-in-out'
                      }}>
                      <div className="text-center">
                        <h4 className="text-2xl font-black mb-2" style={{ color: colors.colors.primary }}>
                          {userDetails.minutes_used.toLocaleString()}
                        </h4>
                        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          Used Minutes
                        </p>
                        <p className="text-xs opacity-70" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          Consumed
                        </p>
                      </div>
                    </div>
                    
                    {/* Virtual Phone Card */}
                    <div className="relative rounded-2xl p-4 group cursor-default transition-all duration-300 flex flex-col justify-between overflow-hidden"
                      style={{
                        backgroundColor: 'transparent',
                        background: isDark 
                          ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                        border: isDark
                          ? `2px solid #4a5568`
                          : `2px solid #cbd5e0`,
                        boxShadow: isDark
                          ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                          : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease-in-out'
                      }}>
                      <div className="text-center">
                        <h4 className="text-lg font-black mb-2" style={{ color: colors.colors.primary }}>
                          {userDetails.twilio_phone_number || 'Not Assigned'}
                        </h4>
                        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          Virtual Phone
                        </p>
                        <p className="text-xs opacity-70" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          Twilio Number
                        </p>
                      </div>
                    </div>
                    
                    {/* Plan Type Card */}
                    <div className="relative rounded-2xl p-4 group cursor-default transition-all duration-300 flex flex-col justify-between overflow-hidden"
                      style={{
                        backgroundColor: 'transparent',
                        background: isDark 
                          ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                        border: isDark
                          ? `2px solid #4a5568`
                          : `2px solid #cbd5e0`,
                        boxShadow: isDark
                          ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                          : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease-in-out'
                      }}>
                      <div className="text-center">
                        <h4 className="text-2xl font-black mb-2 capitalize" style={{ color: colors.colors.primary }}>
                          {userDetails.plan}
                        </h4>
                        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          Plan Type
                        </p>
                        <p className="text-xs opacity-70" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
                          Current Plan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 transition-colors duration-300" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
            Choose Your Plan
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed transition-colors duration-300" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
            Select the perfect AI phone assistant plan for your restaurant. Streamline your operations,
            enhance customer experience, and never miss a call again with KALLIN.AI&apos;s intelligent solutions.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto px-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-auto min-h-[550px] sm:min-h-[600px] overflow-hidden ${plan.featured ? 'lg:scale-105' : ''
                }`}
              style={{
                backgroundColor: 'transparent',
                background: isDark 
                  ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                  : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                border: isDark
                  ? `2px solid #4a5568`
                  : `2px solid #cbd5e0`,
                boxShadow: isDark
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {/* Shine effect for all plans */}
              <div className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
                  animation: 'shimmer 3s ease-in-out infinite'
                }}>
              </div>
              {/* Angled Plan Badge */}
              <div className="absolute top-0 left-0">
                <div
                  className="relative px-8 py-3 text-white font-bold text-sm uppercase tracking-wide"
                  style={{
                    backgroundColor: plan.color,
                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)'
                  }}
                >
                  {plan.name}
                </div>
              </div>

              <div className="flex flex-col flex-grow p-4 sm:p-6 lg:p-8 pt-12 sm:pt-16">
                {/* Price */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-baseline mb-2">
                    <span 
                      className={`text-4xl sm:text-5xl lg:text-6xl font-black transition-all duration-300 bg-gradient-to-r bg-clip-text text-transparent`}
                      style={{
                        backgroundImage: isDark
                          ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e0 25%, #e2e8f0 50%, #f7fafc 75%, #ffffff 100%)'
                          : 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #718096 75%, #1a202c 100%)',
                        transition: 'all 0.3s ease-in-out'
                      }}>
                      ${Math.floor(parseFloat(plan.price))}
                    </span>
                    <span 
                      className={`text-2xl font-bold ml-1 transition-all duration-300 bg-gradient-to-r bg-clip-text text-transparent`}
                      style={{
                        backgroundImage: isDark
                          ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e0 25%, #e2e8f0 50%, #f7fafc 75%, #ffffff 100%)'
                          : 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #718096 75%, #1a202c 100%)',
                        transition: 'all 0.3s ease-in-out'
                      }}>
                      .{plan.price.split('.')[1] || '00'}
                    </span>
                  </div>
                  <p className="text-sm font-medium uppercase tracking-wide" style={{ 
                    color: isDark ? colors.colors.grey[300] : colors.colors.grey[500] 
                  }}>
                    {plan.period}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm mb-8 leading-relaxed" style={{ 
                  color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] 
                }}>
                  {plan.description}
                </p>

                {/* Features - with flex-grow to push button to bottom */}
                <div className="flex-grow mb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                          style={{ backgroundColor: plan.color }}
                        >
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm" style={{ 
                          color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] 
                        }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button - positioned at bottom - Only show for non-free plans */}
                {plan.id !== 'free' && (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={normalizedUserPlan === plan.id || loading}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-lg uppercase tracking-wide transition-all duration-300 hover:scale-105 transform ${normalizedUserPlan === plan.id || loading ? 'opacity-75 cursor-default' : 'hover:opacity-90'
                      }`}
                    style={{
                      background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`,
                      boxShadow: `0 10px 25px -5px ${plan.color}40`
                    }}
                  >
                    {loading && selectedPlan === plan.id 
                      ? 'PROCESSING...' 
                      : normalizedUserPlan === plan.id 
                        ? 'CURRENT PLAN' 
                        : plan.id === 'enterprise' 
                          ? 'CONTACT SALES' 
                          : 'BUY NOW'
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Topup Minutes Section */}
        <div className="mt-20 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ 
              color: isDark ? colors.colors.white : colors.colors.dark 
            }}>
              Need Extra Minutes?
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ 
              color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] 
            }}>
              Top up your account with additional minutes when you need them most.
            </p>
          </div>

          {/* Flex Layout - 70% Left, 30% Right */}
          <div className="max-w-8xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Side - 70% */}
              <div className="flex-1 lg:w-[70%]">
                {/* Addon Minutes Container */}
                <div className="relative overflow-hidden rounded-3xl mb-6 p-4 sm:p-6 lg:p-8 h-auto min-h-[400px] sm:min-h-[480px]"
                  style={{
                    background: `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 100%)`,
                    border: `2px solid ${colors.colors.primary}30`
                  }}>
                  <div className="relative z-10 h-full">
                    {/* Header */}
                    <div className="text-left mb-4 sm:mb-6">
                      <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4"
                        style={{ backgroundColor: colors.colors.primary }}>
                        Addon Minutes
                      </div>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                        Choose Your Add-on
                      </h3>
                      <p className="text-sm sm:text-base opacity-80" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                        Select the perfect minutes package for your needs.
                      </p>
                    </div>
                    
                    {/* 4 Inner Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-auto min-h-[180px] sm:min-h-[200px]">
                      {/* 100 Minutes Card */}
                      <div className="relative rounded-2xl p-4 group cursor-pointer hover:scale-105 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                        style={{
                          backgroundColor: 'transparent',
                          background: isDark 
                            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                          border: isDark
                            ? `2px solid #4a5568`
                            : `2px solid #cbd5e0`,
                          boxShadow: isDark
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease-in-out'
                        }}>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
                            animation: 'shimmer 3s ease-in-out infinite'
                          }}>
                        </div>
                        <div className="text-center">
                          <h4 className="text-2xl font-black mb-2" style={{ color: colors.colors.primary }}>100</h4>
                          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>Minutes</p>
                          <div className="mb-3">
                            <span 
                              className="text-2xl font-black transition-all duration-300 bg-gradient-to-r bg-clip-text text-transparent"
                              style={{
                                backgroundImage: isDark
                                  ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e0 25%, #e2e8f0 50%, #f7fafc 75%, #ffffff 100%)'
                                  : 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #718096 75%, #1a202c 100%)',
                                transition: 'all 0.3s ease-in-out'
                              }}>
                              $40
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSelectPlan('minutes_100')}
                          disabled={loading}
                          className="w-full py-2 px-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          {loading && selectedPlan === 'minutes_100' ? 'Processing...' : 'Buy Now'}
                        </button>
                      </div>
                      
                      {/* 250 Minutes Card */}
                      <div className="relative rounded-2xl p-4 group cursor-pointer hover:scale-105 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                        style={{
                          backgroundColor: 'transparent',
                          background: isDark 
                            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                          border: isDark
                            ? `2px solid #4a5568`
                            : `2px solid #cbd5e0`,
                          boxShadow: isDark
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease-in-out'
                        }}>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
                            animation: 'shimmer 3s ease-in-out infinite'
                          }}>
                        </div>
                        <div className="text-center">
                          <h4 className="text-2xl font-black mb-2" style={{ color: colors.colors.primary }}>250</h4>
                          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>Minutes</p>
                          <div className="mb-3">
                            <span 
                              className="text-2xl font-black transition-all duration-300 bg-gradient-to-r bg-clip-text text-transparent"
                              style={{
                                backgroundImage: isDark
                                  ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e0 25%, #e2e8f0 50%, #f7fafc 75%, #ffffff 100%)'
                                  : 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #718096 75%, #1a202c 100%)',
                                transition: 'all 0.3s ease-in-out'
                              }}>
                              $75
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSelectPlan('minutes_250')}
                          disabled={loading}
                          className="w-full py-2 px-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          {loading && selectedPlan === 'minutes_250' ? 'Processing...' : 'Buy Now'}
                        </button>
                      </div>
                      
                      {/* 500 Minutes Card */}
                      <div className="relative rounded-2xl p-4 group cursor-pointer hover:scale-105 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                        style={{
                          backgroundColor: 'transparent',
                          background: isDark 
                            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                          border: isDark
                            ? `2px solid #4a5568`
                            : `2px solid #cbd5e0`,
                          boxShadow: isDark
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease-in-out'
                        }}>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
                            animation: 'shimmer 3s ease-in-out infinite'
                          }}>
                        </div>
                        <div className="text-center">
                          <h4 className="text-2xl font-black mb-2" style={{ color: colors.colors.primary }}>500</h4>
                          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>Minutes</p>
                          <div className="mb-3">
                            <span 
                              className="text-2xl font-black transition-all duration-300 bg-gradient-to-r bg-clip-text text-transparent"
                              style={{
                                backgroundImage: isDark
                                  ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e0 25%, #e2e8f0 50%, #f7fafc 75%, #ffffff 100%)'
                                  : 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #718096 75%, #1a202c 100%)',
                                transition: 'all 0.3s ease-in-out'
                              }}>
                              $140
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSelectPlan('minutes_500')}
                          disabled={loading}
                          className="w-full py-2 px-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          {loading && selectedPlan === 'minutes_500' ? 'Processing...' : 'Buy Now'}
                        </button>
                      </div>
                      
                      {/* 1000 Minutes Card */}
                      <div className="relative rounded-2xl p-4 group cursor-pointer hover:scale-105 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                        style={{
                          backgroundColor: 'transparent',
                          background: isDark 
                            ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                          border: isDark
                            ? `2px solid #4a5568`
                            : `2px solid #cbd5e0`,
                          boxShadow: isDark
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease-in-out'
                        }}>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
                          style={{
                            background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
                            animation: 'shimmer 3s ease-in-out infinite'
                          }}>
                        </div>
                        <div className="text-center">
                          <h4 className="text-2xl font-black mb-2" style={{ color: colors.colors.primary }}>1000</h4>
                          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>Minutes</p>
                          <div className="mb-3">
                            <span 
                              className="text-2xl font-black transition-all duration-300 bg-gradient-to-r bg-clip-text text-transparent"
                              style={{
                                backgroundImage: isDark
                                  ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e0 25%, #e2e8f0 50%, #f7fafc 75%, #ffffff 100%)'
                                  : 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #718096 75%, #1a202c 100%)',
                                transition: 'all 0.3s ease-in-out'
                              }}>
                              $260
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSelectPlan('minutes_1000')}
                          disabled={loading}
                          className="w-full py-2 px-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          {loading && selectedPlan === 'minutes_1000' ? 'Processing...' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Three Feature Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 h-auto min-h-[200px] sm:min-h-[240px]">
                  
                  {/* AI Voice Card */}
                  <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 100%)`,
                      border: `2px solid ${colors.colors.primary}30`
                    }}>
                    <div className="flex flex-col justify-between h-full">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                          style={{ backgroundColor: colors.colors.primary }}>
                          <MicrophoneIcon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold mb-3" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>AI Voice</h4>
                        <p className="text-sm opacity-80 mb-4" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                          Variety of Male/Female Voices
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="mb-3">
                          <span className="text-xl font-bold" style={{ color: colors.colors.primary }}>$25/month</span>
                        </div>
                        <button 
                          onClick={() => handleSelectPlan('ai-voice')}
                          disabled={loading}
                          className="w-full py-2 px-4 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          {loading && selectedPlan === 'ai-voice' ? 'Processing...' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant Branding Card */}
                  <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 100%)`,
                      border: `2px solid ${colors.colors.primary}30`
                    }}>
                    <div className="flex flex-col justify-between h-full">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                          style={{ backgroundColor: colors.colors.primary }}>
                          <BuildingStorefrontIcon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold mb-3" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Restaurant Branding</h4>
                        <p className="text-sm opacity-80 mb-4" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                          Customize your AI assistant with your restaurant&apos;s brand and personality
                        </p>
                      </div>
                      <div className="text-center">
                        <button 
                          onClick={() => window.open('mailto:info@kallin.ai?subject=Restaurant Branding Inquiry&body=Hello, I am interested in restaurant branding options. Please contact me to discuss the details.', '_blank')}
                          className="w-full py-2 px-4 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Contact Sales
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add Custom Options Card */}
                  <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 100%)`,
                      border: `2px solid ${colors.colors.primary}30`
                    }}>
                    <div className="flex flex-col justify-between h-full">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                          style={{ backgroundColor: colors.colors.primary }}>
                          <CogIcon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold mb-3" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Add Custom Options</h4>
                        <p className="text-sm opacity-80 mb-4" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                          Add call forwarding and other custom options for your agent
                        </p>
                      </div>
                      <div className="text-center">
                        <button 
                          onClick={() => window.open('mailto:info@kallin.ai?subject=Custom Options Inquiry&body=Hello, I am interested in adding custom options to my AI assistant. Please contact me to discuss the available features.', '_blank')}
                          className="w-full py-2 px-4 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Contact Sales
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - 30% */}
              <div className="lg:w-[30%] flex flex-col gap-6">
                
                {/* Future-ready Card */}
                <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.01] transition-all duration-300 overflow-hidden h-[240px]"
                  style={{
                    background: `linear-gradient(135deg, ${colors.colors.primary}12 0%, ${colors.colors.primary}06 100%)`,
                    border: `1px solid ${colors.colors.primary}40`
                  }}>
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-15"
                    style={{ backgroundColor: colors.colors.primary }}></div>
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-baseline mb-2">
                        <span className="text-2xl font-black mr-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Future Ready</span>
                      </div>
                      <p className="text-xs opacity-70" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>Outbound calling (reminders, promos, reservations).</p>
                    </div>
                    <div className="flex items-center justify-end">
                      <button className="px-5 py-2 rounded-xl font-semibold text-white text-sm uppercase transition-all duration-300 hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>

                {/* Never Miss A Call Again Card */}
                <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.01] transition-all duration-300 h-[540px] overflow-hidden"
                  style={{
                    backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                    border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
                  }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent"></div>
                  <Image 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="24/7 Phone Support"
                    fill
                    className="object-cover opacity-20" />
                  <div className="flex flex-col justify-center h-full">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                        style={{ backgroundColor: `${colors.colors.primary}20` }}>
                        <PhoneIcon className="w-12 h-12" style={{ color: colors.colors.primary }} />
                      </div>
                      <h4 className="text-2xl font-bold mb-4" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Never Miss A Call Again</h4>
                      <p className="text-base opacity-80 mb-6" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                        AI assistant never sleeps, handles calls anytime, ensuring every customer reaches you 24/7.
                      </p>
                      <div className="flex items-center justify-center text-sm" style={{ color: colors.colors.primary }}>
                        <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                        <span className="font-semibold">Active now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-sm" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
            Need a custom solution? <a href="/contact" style={{ color: colors.colors.primary }} className="hover:opacity-80 font-medium transition-opacity">Contact our sales team</a>
          </p>
        </div>
      </div>
      </div>

      {/* Embedded Payment Modal */}
      {embeddedSelectedPlan && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={closePaymentModal}
          planId={embeddedSelectedPlan.id}
          planName={embeddedSelectedPlan.name}
          planPrice={embeddedSelectedPlan.price}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
