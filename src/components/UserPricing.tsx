'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';
import { CheckIcon, MicrophoneIcon, BuildingStorefrontIcon, CogIcon, PhoneIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { useEmbeddedPayment } from '../hooks/useEmbeddedPayment';
import PaymentModal from './PaymentModal';
import ContactSalesModal from './ContactSalesModal';
import EditMenuModal from './EditMenuModal';
import { useSearchParams } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { recordFreeTrialUsage, confirmFreeTrialWithBackend } from '../lib/freeTrialService';
import colors from '../../colors.json';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
    id: 'starter',
    name: 'Starter',
    price: '299.00',
    period: 'Per Month',
    description: 'Perfect for small restaurants getting started with AI phone assistance.',
    features: [
      '250+ calls per month',
      '1 Virtual number',
      '1 Voice assistant',
      '1 Dashboard',
      'Customer SMS notify',
      '24/7 Support'
    ],
    featured: false,
    color: colors.colors.grey[500]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '499.00',
    period: 'Per Month',
    description: 'Complete solution for restaurant chains and high-volume establishments.',
    features: [
      '900+ calls per month',
      '1 Virtual number',
      '1 Voice assistant',
      '1 Dashboard',
      'Customer SMS notify',
      '24/7 Support'
    ],
    featured: true,
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
  prompt?: string;
  [key: string]: string | number | boolean | undefined;
}

// Add interface for menu content
interface MenuContent {
  menu_text: string;
  specials_text: string;
}

interface UserPricingProps {
  userPlan?: string | null;
}

export default function UserPricing({ userPlan }: UserPricingProps) {
  const { isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactService, setContactService] = useState<string | undefined>(undefined);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [editMenuMode, setEditMenuMode] = useState<'menu' | 'specials'>('menu');
  const [menuContent, setMenuContent] = useState<MenuContent | null>(null); // Add state for menu content
  const [isLoadingMenuContent, setIsLoadingMenuContent] = useState(false); // Add loading state
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
    
    // If this was a trial payment, record free trial usage
    if (embeddedSelectedPlan?.id === 'trial' && user?.id && user?.email) {
      console.log('🆓 Recording free trial usage for paid trial...');
      try {
        const recorded = await recordFreeTrialUsage(user.id, user.email);
        if (recorded) {
          setHasUsedFreeTrialState(true);
          await confirmFreeTrialWithBackend(user.id);
          console.log('✅ Free trial status recorded successfully');
        }
      } catch (error) {
        console.error('❌ Failed to record free trial usage:', error);
      }
    }
    
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
  const [hasUsedFreeTrialState, setHasUsedFreeTrialState] = useState<boolean | null>(null); // Start with null to indicate "not checked yet"
  const [isCheckingFreeTrial, setIsCheckingFreeTrial] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<string>('');

  // Fetch menu content function
  const fetchMenuContent = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingMenuContent(true);
    try {
      const response = await fetch(`https://server.kallin.ai/menu/${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Menu content response:', data);
        setMenuContent(data.data);
      } else {
        console.error('Failed to fetch menu content:', response.status);
        showError('Failed to load menu content');
      }
    } catch (error) {
      console.error('Error fetching menu content:', error);
      showError('Failed to load menu content');
    } finally {
      setIsLoadingMenuContent(false);
    }
  }, [user?.id, showError]);

  // Helper function to normalize plan name
  const getNormalizedPlan = (plan?: string | null) => {
    if (!plan || plan.trim() === '') {
      return 'free';
    }
    const normalized = plan.toLowerCase().trim();
    // Handle common plan variations
    switch (normalized) {
      case 'custom':
      case 'enterprise':
      case 'starter':
      case 'professional':
      case 'trial':
        return normalized;
      default:
        return 'free';
    }
  };

  // Use useMemo to prevent unnecessary re-calculations
  const normalizedUserPlan = useMemo(() => {
    const normalized = getNormalizedPlan(userPlan);
    console.log('User plan:', userPlan, 'Normalized:', normalized);
    return normalized;
  }, [userPlan]);

  // Helper function to create fallback user details
  const createFallbackUserDetails = useCallback(() => {
    return {
      id: parseInt(user?.id || '0'),
      name: user?.name || '',
      email: user?.email || '',
      plan: 'Unknown',
      status: 'active',
      minutes_allowed: 0,
      minutes_used: 0,
      agent_id: 'N/A'
    };
  }, [user?.id, user?.name, user?.email]);

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
      
      const response = await fetch('https://server.kallin.ai/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Production server - no special headers needed
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
          setUserDetails(createFallbackUserDetails());
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
  }, [user?.id, showError, createFallbackUserDetails]);

  // Check free trial status when user loads
  useEffect(() => {
    const checkFreeTrialStatus = async () => {
      if (!user?.id) {
        console.log('No user ID, skipping free trial check');
        setHasUsedFreeTrialState(null);
        setIsCheckingFreeTrial(false);
        return;
      }

      console.log('🔍 Checking Firebase free trial status for user:', user.id);
      setIsCheckingFreeTrial(true);
      
      // Add a small delay to ensure Firebase is initialized
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Dynamic import for client-side only
        const { hasUsedFreeTrial } = await import('../lib/freeTrialService');
        const hasUsed = await hasUsedFreeTrial(user.id);
        
        console.log('🆓 Firebase free trial check result:', hasUsed ? 'USED' : 'AVAILABLE');
        setHasUsedFreeTrialState(hasUsed);
      } catch (error) {
        console.error('❌ Error checking free trial status:', error);
        // Default to available (false) on error for better UX for new users
        console.log('⚠️ Defaulting free trial to AVAILABLE due to error');
        setHasUsedFreeTrialState(false);
      } finally {
        setIsCheckingFreeTrial(false);
      }
    };

    checkFreeTrialStatus();
  }, [user?.id]);

  // Initial fetch on component mount - only run when user ID changes
  useEffect(() => {
    if (user?.id) {
      fetchUserDetails();
      fetchMenuContent(); // Fetch menu content when component loads
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    // Prevent multiple selections while one is in progress
    if (selectedPlan && selectedPlan === planId) {
      console.log(`Plan ${planId} already selected, ignoring duplicate selection`);
      return;
    }
    
    // Prevent selection if modal is already open
    if (isModalOpen) {
      console.log('Modal already open, ignoring plan selection');
      return;
    }
    
    console.log(`Selecting plan: ${planId}`);
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
    try {
      await openPaymentModal(planId, planName, planPrice);
    } finally {
      // Clear selected plan after modal operation completes
      setTimeout(() => setSelectedPlan(null), 1000);
    }
  };

  // Copy to clipboard function - wrapped in useCallback to prevent re-renders
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
      showError(`Failed to copy ${label.toLowerCase()}`);
    }
  }, [showSuccess, showError]);

  // Add useEffect to listen for menu updates
  useEffect(() => {
    const handleMenuUpdate = () => {
      fetchMenuContent(); // Refresh menu content when update event is received
    };

    window.addEventListener('menuContentUpdated', handleMenuUpdate);
    return () => {
      window.removeEventListener('menuContentUpdated', handleMenuUpdate);
    };
  }, [fetchMenuContent]);

  return (
    <>
      {/* Add shimmer animation and custom scrollbar CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(400%) rotate(45deg);
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? colors.colors.grey[800] : colors.colors.grey[100]};
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${colors.colors.primary};
          border-radius: 4px;
          transition: opacity 0.2s;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${colors.colors.primary}dd;
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${colors.colors.primary} ${isDark ? colors.colors.grey[800] : colors.colors.grey[100]};
        }
      `}</style>
      
      <div className="min-h-screen transition-all duration-300 relative overflow-hidden"
        style={{
          background: isDark
            ? colors.colors.dark
            : colors.colors.white,
          transition: 'background 0.3s ease-in-out'
        }}>


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
              <div className="relative overflow-hidden rounded-xl p-4 sm:p-6 lg:p-8 h-auto shadow-sm"
                style={{
                  backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                  border: `1px solid ${isDark ? colors.colors.grey[700] : colors.colors.grey[200]}`
                }}>
                <div className="relative z-10 h-full">
                  {/* Skeleton Header */}
                  <div className="text-left mb-4 sm:mb-6">
                    <div className="inline-flex items-center px-3 sm:px-4 py-1 rounded text-xs sm:text-sm font-medium mb-3 sm:mb-4"
                      style={{ color: colors.colors.primary }}>
                      USER SUMMARY
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

            {/* Summary Container with Metallic Grey */}
            <div className="max-w-7xl mx-auto px-4">
              <div className="relative overflow-hidden rounded-xl p-4 sm:p-6 lg:p-8 h-auto shadow-sm"
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
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                }}>
                <div className="relative z-10 h-full">
                  {/* Header */}
                  <div className="text-left mb-4 sm:mb-6">
                    <div className="inline-flex items-center px-3 sm:px-4 py-1 rounded text-xs sm:text-sm font-medium mb-3 sm:mb-4"
                      style={{ color: colors.colors.primary }}>
                      USER SUMMARY
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                          {userDetails.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>Agent ID:</span>
                            <Badge variant="secondary" className="font-mono">
                              {userDetails.agent_id}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(userDetails.agent_id, 'Agent ID');
                              }}
                              style={{ color: colors.colors.primary }}
                              title="Copy Agent ID"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>Status:</span>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full animate-pulse ${userDetails.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                              <Badge variant="outline" className="capitalize" style={{ 
                                borderColor: colors.colors.primary + '40', 
                                color: colors.colors.primary 
                              }}>
                                {userDetails.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 4 Summary Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 h-auto">
                    {/* Total Minutes Card */}
                    <Card className="transition-all duration-300 cursor-default" style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                      border: isDark ? '2px solid #4a5568' : '2px solid #cbd5e0',
                      boxShadow: isDark
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    }}>
                      <CardContent className="p-4">
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
                      </CardContent>
                    </Card>
                    
                    {/* Used Minutes Card */}
                    <Card className="transition-all duration-300 cursor-default" style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                      border: isDark ? '2px solid #4a5568' : '2px solid #cbd5e0',
                      boxShadow: isDark
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    }}>
                      <CardContent className="p-4">
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
                      </CardContent>
                    </Card>
                    
                    {/* Virtual Phone Card */}
                    <Card className="transition-all duration-300 cursor-default" style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                      border: isDark ? '2px solid #4a5568' : '2px solid #cbd5e0',
                      boxShadow: isDark
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    }}>
                      <CardContent className="p-4">
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
                      </CardContent>
                    </Card>
                    
                    {/* Plan Type Card */}
                    <Card className="transition-all duration-300 cursor-default" style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                      border: isDark ? '2px solid #4a5568' : '2px solid #cbd5e0',
                      boxShadow: isDark
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    }}>
                      <CardContent className="p-4">
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
                      </CardContent>
                    </Card>
                  </div>

                  {/* Menu & Specials Display with Edit Buttons */}
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Box - Menu */}
                    <div className="flex flex-col">
                      <Card className="flex-1 mb-3" style={{
                        background: isDark 
                          ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                        border: isDark ? '2px solid #4a5568' : '2px solid #cbd5e0',
                        boxShadow: isDark
                          ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 10px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                      }}>
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <h4 className="text-base font-semibold tracking-tight flex items-center" 
                              style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Menu
                            </h4>
                          </div>
                          <div 
                            className="rounded-lg p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-6 custom-scrollbar select-none"
                            style={{
                              backgroundColor: 'transparent',
                              color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none'
                            }}
                            onCopy={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText('Nice Try Diddy');
                            }}
                          >
                            {isLoadingMenuContent ? (
                              <span className="italic" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[500] }}>
                                Loading menu content...
                              </span>
                            ) : menuContent?.menu_text ? (
                              menuContent.menu_text
                            ) : (
                              <span className="italic" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[500] }}>
                                No menu available yet.
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <Button
                        onClick={() => { 
                          setEditMenuMode('menu');
                          setIsEditMenuOpen(true);
                        }}
                        className="w-full font-semibold transition-all duration-300"
                        style={{ 
                          backgroundColor: colors.colors.primary,
                          color: 'white'
                        }}
                        size="lg"
                      >
                        Edit Menu
                      </Button>
                    </div>

                    {/* Right Box - Daily Specials */}
                    <div className="flex flex-col">
                      <Card className="flex-1 mb-3" style={{
                        background: isDark 
                          ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                        border: isDark ? '2px solid #4a5568' : '2px solid #cbd5e0',
                        boxShadow: isDark
                          ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 10px 25px -5px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                      }}>
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <h4 className="text-base font-semibold tracking-tight flex items-center" 
                              style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                              </svg>
                              Daily Specials
                            </h4>
                          </div>
                          <div 
                            className="rounded-lg p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-6 custom-scrollbar select-none"
                            style={{
                              backgroundColor: 'transparent',
                              color: isDark ? colors.colors.grey[300] : colors.colors.grey[700],
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none',
                              msUserSelect: 'none'
                            }}
                            onCopy={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText('Nice Try Diddy');
                            }}
                          >
                            {isLoadingMenuContent ? (
                              <span className="italic" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[500] }}>
                                Loading specials content...
                              </span>
                            ) : menuContent?.specials_text ? (
                              menuContent.specials_text
                            ) : (
                              <span className="italic" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[500] }}>
                                No daily specials available yet.
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <Button
                        onClick={() => { 
                          setEditMenuMode('specials');
                          setIsEditMenuOpen(true);
                        }}
                        className="w-full font-semibold transition-all duration-300"
                        style={{ 
                          backgroundColor: colors.colors.primary,
                          color: 'white'
                        }}
                        size="lg"
                      >
                        Edit Daily Specials
                      </Button>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Header */}
        {/* <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 transition-colors duration-300" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
            Choose Your Plan
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed transition-colors duration-300" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
            Select the perfect AI phone assistant plan for your restaurant. Streamline your operations,
            enhance customer experience, and never miss a call again with KALLIN.AI&apos;s intelligent solutions.
          </p>
        </div> */}

        {/* Pricing Cards */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto px-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`xl:col-span-2 relative rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-auto min-h-[550px] sm:min-h-[600px] overflow-hidden ${
                plan.featured ? 'lg:scale-105' : ''
              } ${
                (normalizedUserPlan === plan.id || plan.id === 'enterprise') ? 'ring-4' : ''
              }`}
              style={{
                backgroundColor: 'transparent',
                background: (normalizedUserPlan === plan.id || plan.id === 'enterprise')
                  ? isDark 
                    ? `linear-gradient(135deg, ${colors.colors.primary}20 0%, ${colors.colors.primary}10 25%, ${colors.colors.primary}15 50%, ${colors.colors.primary}08 75%, ${colors.colors.primary}20 100%)`
                    : `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 25%, ${colors.colors.primary}12 50%, ${colors.colors.primary}06 75%, ${colors.colors.primary}15 100%)`
                  : isDark 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                border: (normalizedUserPlan === plan.id || plan.id === 'enterprise')
                  ? `3px solid ${colors.colors.primary}`
                  : isDark
                    ? `2px solid #4a5568`
                    : `2px solid #cbd5e0`,
                boxShadow: (normalizedUserPlan === plan.id || plan.id === 'enterprise')
                  ? isDark
                    ? `0 25px 50px -12px ${colors.colors.primary}60, inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px ${colors.colors.primary}30, 0 0 20px ${colors.colors.primary}40`
                    : `0 25px 50px -12px ${colors.colors.primary}40, inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 0 0 1px ${colors.colors.primary}20, 0 0 20px ${colors.colors.primary}30`
                  : isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {/* Shine effect for all plans */}
              {/* <div className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
                  animation: 'shimmer 3s ease-in-out infinite'
                }}>
              </div> */}
              {/* Angled Plan Badge */}
              {/* <div className="absolute top-0 left-0">
                <div
                  className="relative px-8 py-3 text-white font-bold text-sm uppercase tracking-wide"
                  style={{
                    backgroundColor: plan.color,
                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)'
                  }}
                >
                  {plan.name}
                </div>
              </div> */}

              {/* <div className="flex flex-col flex-grow p-4 sm:p-6 lg:p-8 pt-12 sm:pt-16"> */}
                {/* Price */}
                {/* <div className="mb-6 sm:mb-8 pt-4">
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
                </div> */}

                {/* Description */}
                {/* <p className="text-sm mb-8 leading-relaxed" style={{ 
                  color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] 
                }}>
                  {plan.description}
                </p> */}

                {/* Features - with flex-grow to push button to bottom */}
                {/* <div className="flex-grow mb-8">
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
                </div> */}

                {/* CTA Button - positioned at bottom - Only show for non-free plans */}
                {/* {plan.id !== 'free' && (
                  <button
                    onClick={() => {
                      if (plan.id === 'enterprise' || plan.id === 'starter') {
                        setContactService(plan.id === 'enterprise' ? 'Enterprise Solution' : 'Starter Plan');
                        setIsContactOpen(true);
                      } else if (plan.id === 'trial' && hasUsedFreeTrialState === true) {
                        // Do nothing if free trial already used for trial plan
                        return;
                      } else {
                        handleSelectPlan(plan.id);
                      }
                    }}
                    disabled={loading || normalizedUserPlan === plan.id || (plan.id === 'trial' && hasUsedFreeTrialState === true)}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-lg uppercase tracking-wide transition-all duration-300 transform ${
                      (loading || normalizedUserPlan === plan.id || (plan.id === 'trial' && hasUsedFreeTrialState === true)) 
                        ? 'opacity-50 cursor-not-allowed hover:scale-100' 
                        : 'hover:opacity-90 hover:scale-105'
                    }`}
                    style={{
                      background: (loading || normalizedUserPlan === plan.id || (plan.id === 'trial' && hasUsedFreeTrialState === true))
                        ? `linear-gradient(135deg, ${isDark ? colors.colors.grey[600] : colors.colors.grey[400]} 0%, ${isDark ? colors.colors.grey[700] : colors.colors.grey[500]}dd 100%)`
                        : `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`,
                      boxShadow: (loading || normalizedUserPlan === plan.id || (plan.id === 'trial' && hasUsedFreeTrialState === true))
                        ? `0 10px 25px -5px ${isDark ? colors.colors.grey[600] : colors.colors.grey[400]}40`
                        : `0 10px 25px -5px ${plan.color}40`
                    }}
                  >
                    {isCheckingFreeTrial && plan.id === 'trial'
                      ? 'CHECKING...'
                      : loading && selectedPlan === plan.id 
                        ? 'PROCESSING...'
                        : (plan.id === 'enterprise' || plan.id === 'starter')
                          ? 'CONTACT SALES'
                          : plan.id === 'trial' && hasUsedFreeTrialState === true
                            ? 'ALREADY USED'
                            : normalizedUserPlan === plan.id 
                              ? 'CURRENT PLAN'
                              : plan.id === 'trial' && hasUsedFreeTrialState === false
                                ? 'START TRIAL'
                                : plan.id === 'trial'
                                  ? 'START TRIAL'
                                  : 'BUY NOW'
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div> */}

        {/* Topup Minutes Section - Only show if user has a matching plan */}
        {(normalizedUserPlan === 'starter' || normalizedUserPlan === 'professional' || normalizedUserPlan === 'enterprise') && (
        <div className="mt-20 mb-16">

          {/* Flex Layout - 70% Left, 30% Right */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Side - 70% */}
              <div className="flex-1 lg:w-[70%]">
                {/* Add-on Grid (lower box) */}
                <div className="mb-3">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                    Choose Your Add-on
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Restaurant Branding */}
                  <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
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
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                    }}>
                    <div className="flex flex-col justify-between h-full">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.colors.primary }}>
                          <BuildingStorefrontIcon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-base sm:text-lg font-bold mb-3" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Restaurant Branding</h4>
                        <p className="text-sm opacity-80 mb-4" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                          Customize your AI assistant with your restaurant&apos;s brand and personality
                        </p>
                      </div>
                      <div className="text-center">
                        <button onClick={() => { setContactService('Restaurant Branding'); setIsContactOpen(true); }}
                          className="w-full py-2 px-4 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Contact Sales
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add Custom Options */}
                  <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
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
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                    }}>
                    <div className="flex flex-col justify-between h-full">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.colors.primary }}>
                          <CogIcon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-base sm:text-lg font-bold mb-3" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Add Custom Options</h4>
                        <p className="text-sm opacity-80 mb-4" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                          Add call forwarding and other custom options for your agent
                        </p>
                      </div>
                      <div className="text-center">
                        <button onClick={() => { setContactService('Custom Integration'); setIsContactOpen(true); }}
                          className="w-full py-2 px-4 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Contact Sales
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Voice */}
                  <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
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
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                    }}>
                    <div className="flex flex-col justify-between h-full">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.colors.primary }}>
                          <MicrophoneIcon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-base sm:text-lg font-bold mb-3" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>AI Voice</h4>
                        <p className="text-sm opacity-80 mb-4" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                          Variety of Male/Female Voices
                        </p>
                      </div>
                      <div className="text-center">
                        <button onClick={() => { setContactService('AI Voice Assistant'); setIsContactOpen(true); }}
                          className="w-full py-2 px-4 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Contact Sales
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add Custom Minutes */}
                  <div className="relative rounded-2xl p-6 group transition-all duration-300 hover:scale-[1.02]"
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
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                    }}>
                    <div className="flex flex-col justify-between h-full">
                      <div className="text-center mb-3">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.colors.primary }}>
                          <ClipboardDocumentIcon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-base sm:text-lg font-bold mb-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Add Custom Minutes</h4>
                        <p className="text-sm opacity-80" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                          Enter the number of minutes you need
                        </p>
                      </div>
                      <div>
                        <input
                          type="number"
                          min={1}
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(e.target.value)}
                          placeholder="e.g. 750"
                          className="w-full px-3 py-3 rounded-xl mb-3 text-sm focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.colors.white,
                            border: isDark ? `1px solid ${colors.colors.grey[600]}` : `1px solid ${colors.colors.grey[300]}`,
                            color: isDark ? colors.colors.white : colors.colors.dark
                          }}
                        />
                        <button
                          onClick={() => { setContactService('Custom Minutes'); setIsContactOpen(true); }}
                          className="w-full py-2 px-4 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}
                        >
                          Contact Sales
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right Side - 30% */}
              <div className="lg:w-[30%] flex flex-col gap-6 lg:mt-[4%]">
                
                {/* Future-ready Card */}
                <div className="relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.01] transition-all duration-300 overflow-hidden h-[240px]"
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
                      : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)'
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-sm" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
            Need a custom solution? <button 
              onClick={() => { setContactService('Custom Solution'); setIsContactOpen(true); }}
              style={{ color: colors.colors.primary }} 
              className="hover:opacity-80 font-medium transition-opacity underline bg-transparent border-none cursor-pointer"
            >
              Contact our sales team
            </button>
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

      {/* Contact Sales Modal */}
      <ContactSalesModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        defaultService={contactService}
      />

      {/* Edit Menu Modal */}
      <EditMenuModal
        isOpen={isEditMenuOpen}
        onClose={() => setIsEditMenuOpen(false)}
        mode={editMenuMode}
        userId={user?.id}
      />
    </>
  );
}