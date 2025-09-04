'use client';

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CheckIcon, MicrophoneIcon, BuildingStorefrontIcon, CogIcon, PhoneIcon } from '@heroicons/react/24/solid';
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
    id: 'free',
    name: 'Free',
    price: '0.00',
    period: '50 mins',
    description: 'Get started with basic AI phone assistance for free - perfect for testing.',
    features: [
      '50 calls per month',
      'Basic voice assistant',
      'Simple dashboard',
      'Email support',
      'No credit card required'
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

interface UserPricingProps {
  userPlan?: string | null;
}

export default function UserPricing({ userPlan }: UserPricingProps) {
  const { isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Helper function to normalize plan name
  const getNormalizedPlan = (plan?: string | null) => {
    if (!plan || plan.trim() === '') {
      return 'free';
    }
    return plan.toLowerCase();
  };

  const normalizedUserPlan = getNormalizedPlan(userPlan);

  // Remove unused variable warning
  console.log('Selected plan state:', selectedPlan);
  console.log('User plan:', userPlan, 'Normalized:', normalizedUserPlan);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    
    if (planId === 'enterprise') {
      // Open email for enterprise plan
      window.open('mailto:info@kallin.ai?subject=Enterprise Plan Inquiry&body=Hello, I am interested in the Enterprise plan. Please contact me to discuss the details.', '_blank');
    } else {
      // Handle Buy Now for other plans
      // Here you would integrate with your payment system (Stripe, PayPal, etc.)
      console.log('Proceeding with purchase for plan:', planId);
      // TODO: Implement actual purchase logic
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto px-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-[600px] ${plan.id !== 'free' ? 'overflow-hidden' : ''} ${plan.featured ? 'scale-105' : ''
                }`}
              style={{
                backgroundColor: plan.id === 'free' 
                  ? (isDark ? colors.colors.grey[800] : colors.colors.white)
                  : 'transparent',
                background: plan.id === 'free' 
                  ? undefined
                  : isDark 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 25%, #2d2d2d 50%, #1f1f1f 75%, #2a2a2a 100%)'
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 25%, #f1f3f4 50%, #e8eaed 75%, #f8f9fa 100%)',
                border: plan.id === 'free'
                  ? (isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`)
                  : isDark
                    ? `2px solid #4a5568`
                    : `2px solid #cbd5e0`,
                boxShadow: plan.id === 'free'
                  ? (isDark ? '0 20px 40px -10px rgba(0, 0, 0, 0.4)' : '0 20px 40px -10px rgba(0, 0, 0, 0.1)')
                  : isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {/* Shine effect for premium plans only */}
              {plan.id !== 'free' && (
                <div className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 100%)',
                    animation: 'shimmer 3s ease-in-out infinite'
                  }}>
                </div>
              )}
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

              <div className="flex flex-col flex-grow p-8 pt-16">
                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline mb-2">
                    <span 
                      className={`text-6xl font-black transition-all duration-300 ${
                        plan.id !== 'free' ? 'bg-gradient-to-r bg-clip-text text-transparent' : ''
                      }`}
                      style={{
                        color: plan.id === 'free' 
                          ? (isDark ? colors.colors.white : colors.colors.dark)
                          : undefined,
                        backgroundImage: plan.id === 'free' 
                          ? undefined
                          : isDark
                            ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e0 25%, #e2e8f0 50%, #f7fafc 75%, #ffffff 100%)'
                            : 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #718096 75%, #1a202c 100%)',
                        transition: 'all 0.3s ease-in-out'
                      }}>
                      ${Math.floor(parseFloat(plan.price))}
                    </span>
                    <span 
                      className={`text-2xl font-bold ml-1 transition-all duration-300 ${
                        plan.id !== 'free' ? 'bg-gradient-to-r bg-clip-text text-transparent' : ''
                      }`}
                      style={{
                        color: plan.id === 'free' 
                          ? (isDark ? colors.colors.white : colors.colors.dark)
                          : undefined,
                        backgroundImage: plan.id === 'free' 
                          ? undefined
                          : isDark
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
                    disabled={normalizedUserPlan === plan.id}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-lg uppercase tracking-wide transition-all duration-300 hover:scale-105 transform ${normalizedUserPlan === plan.id ? 'opacity-75 cursor-default' : 'hover:opacity-90'
                      }`}
                    style={{
                      background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`,
                      boxShadow: `0 10px 25px -5px ${plan.color}40`
                    }}
                  >
                    {normalizedUserPlan === plan.id ? 'CURRENT PLAN' : plan.id === 'enterprise' ? 'CONTACT SALES' : 'BUY NOW'}
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
                <div className="relative overflow-hidden rounded-3xl mb-6 p-8 h-[480px]"
                  style={{
                    background: `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 100%)`,
                    border: `2px solid ${colors.colors.primary}30`
                  }}>
                  <div className="relative z-10 h-full">
                    {/* Header */}
                    <div className="text-left mb-6">
                      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white mb-4"
                        style={{ backgroundColor: colors.colors.primary }}>
                        Addon Minutes
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black mb-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                        Choose Your Add-on
                      </h3>
                      <p className="text-base opacity-80" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                        Select the perfect minutes package for your needs.
                      </p>
                    </div>
                    
                    {/* 4 Inner Cards Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-[200px]">
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
                        <button className="w-full py-2 px-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Buy Now
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
                        <button className="w-full py-2 px-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Buy Now
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
                        <button className="w-full py-2 px-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Buy Now
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
                        <button className="w-full py-2 px-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Three Feature Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[240px]">
                  
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
                          className="w-full py-2 px-4 rounded-xl font-bold text-white text-sm uppercase tracking-wide transition-all duration-300 hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                          Buy Now
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
                  <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="24/7 Phone Support"
                    className="absolute inset-0 w-full h-full object-cover opacity-20" />
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
    </>
  );
}
