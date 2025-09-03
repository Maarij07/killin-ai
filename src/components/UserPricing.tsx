'use client';

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { CheckIcon } from '@heroicons/react/24/solid';
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
    period: 'Forever',
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
    price: '8.00',
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
    id: 'popular',
    name: 'Popular',
    price: '15.00',
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
    id: 'pro',
    name: 'Pro',
    price: '30.00',
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
    // Here you would handle the subscription logic
    console.log('Selected plan:', planId);
  };

  return (
    <div className="min-h-screen transition-all duration-300 relative overflow-hidden" 
         style={{
           background: isDark 
             ? colors.colors.dark
             : colors.colors.white
         }}>
      
      {/* Aesthetic blobs with your color theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ backgroundColor: colors.colors.primary }}></div>
        <div className="absolute bottom-40 right-10 w-72 h-72 rounded-full opacity-5 blur-2xl"
             style={{ backgroundColor: colors.colors.primary }}></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-5 blur-xl"
             style={{ backgroundColor: isDark ? colors.colors.grey[600] : colors.colors.grey[400] }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full opacity-5 blur-2xl"
             style={{ backgroundColor: isDark ? colors.colors.grey[700] : colors.colors.grey[300] }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
            Choose Your Plan
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
            Select the perfect AI phone assistant plan for your restaurant. Streamline your operations, 
            enhance customer experience, and never miss a call again with KALLIN.AI&apos;s intelligent solutions.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto px-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col h-[600px] ${
                plan.featured ? 'scale-105' : ''
              }`}
              style={{
                backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                border: plan.featured 
                  ? `3px solid ${colors.colors.primary}` 
                  : isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`,
                boxShadow: plan.featured 
                  ? `0 25px 50px -12px ${colors.colors.primary}30, 0 0 0 1px ${colors.colors.primary}20`
                  : isDark 
                    ? '0 20px 40px -10px rgba(0, 0, 0, 0.4)'
                    : '0 20px 40px -10px rgba(0, 0, 0, 0.1)'
              }}
            >
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
                    <span className="text-6xl font-black" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                      ${Math.floor(parseFloat(plan.price))}
                    </span>
                    <span className="text-2xl font-bold ml-1" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                      .{plan.price.split('.')[1] || '00'}
                    </span>
                  </div>
                  <p className="text-sm font-medium uppercase tracking-wide" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[500] }}>
                    {plan.period}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm mb-8 leading-relaxed" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
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
                        <span className="text-sm" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[700] }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button - positioned at bottom */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={normalizedUserPlan === plan.id}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-lg uppercase tracking-wide transition-all duration-300 hover:scale-105 transform ${
                    normalizedUserPlan === plan.id ? 'opacity-75 cursor-default' : 'hover:opacity-90'
                  }`}
                  style={{ 
                    background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`,
                    boxShadow: `0 10px 25px -5px ${plan.color}40`
                  }}
                >
                  {normalizedUserPlan === plan.id ? 'CURRENT PLAN' : 'BUY NOW'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Topup Minutes Section */}
        <div className="mt-20 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
              Need Extra Minutes?
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>
              Top up your account with additional minutes when you need them most.
            </p>
          </div>

          {/* REAL Bento Grid - Mixed Content with Images */}
          <div className="max-w-8xl mx-auto px-4">
            <div className="grid grid-cols-6 md:grid-cols-12 lg:grid-cols-16 auto-rows-[120px] gap-4">
              
              {/* Hero Card - Main Feature with Image */}
              <div className="col-span-6 md:col-span-8 lg:col-span-10 row-span-4 relative overflow-hidden rounded-3xl group cursor-pointer"
                   style={{
                     background: `linear-gradient(135deg, ${colors.colors.primary}20 0%, ${colors.colors.primary}10 100%)`,
                     border: `2px solid ${colors.colors.primary}30`
                   }}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
                <img src="https://images.unsplash.com/photo-1556075798-4825dfaaf498?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                     alt="AI Phone Assistant" 
                     className="absolute inset-0 w-full h-full object-cover opacity-30" />
                <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white mb-4" 
                         style={{ backgroundColor: colors.colors.primary }}>
                      🔥 Most Popular
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black mb-4" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>
                      100 Minutes
                    </h3>
                    <p className="text-lg mb-6 opacity-80" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                      Perfect for small restaurants. Most chosen by our customers.
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-5xl font-black" style={{ color: colors.colors.primary }}>$6.00</span>
                      <span className="text-lg ml-2 opacity-60" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>one-time</span>
                    </div>
                    <button className="px-8 py-4 rounded-2xl font-bold text-white text-lg uppercase tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                            style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                      Get Started
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="col-span-3 md:col-span-4 lg:col-span-3 row-span-2 relative rounded-2xl p-6 group cursor-pointer overflow-hidden"
                   style={{
                     backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                     border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
                   }}>
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20" 
                     style={{ backgroundColor: colors.colors.primary }}></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-2">📊</div>
                  <h4 className="text-2xl font-bold mb-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>85%</h4>
                  <p className="text-sm opacity-70" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                    Customer satisfaction rate
                  </p>
                </div>
              </div>

              {/* Quick Access - 50 mins */}
              <div className="col-span-3 md:col-span-4 lg:col-span-3 row-span-2 relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                   style={{
                     backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                     border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
                   }}>
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" 
                     style={{ background: `linear-gradient(90deg, ${colors.colors.primary} 0%, ${colors.colors.primary}80 100%)` }}></div>
                <div className="flex flex-col justify-center h-full text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <h4 className="text-2xl font-black mb-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>50</h4>
                  <p className="text-xs opacity-60 mb-3" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>minutes</p>
                  <span className="text-xl font-bold mb-4" style={{ color: colors.colors.primary }}>$3.50</span>
                  <button className="w-full py-2 px-4 rounded-xl font-semibold text-white text-xs uppercase transition-all duration-300 hover:scale-105"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                    Quick Buy
                  </button>
                </div>
              </div>

              {/* Feature Highlight with Image */}
              <div className="col-span-6 md:col-span-6 lg:col-span-6 row-span-3 relative rounded-2xl overflow-hidden group cursor-pointer"
                   style={{
                     backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                     border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
                   }}>
                <img src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                     alt="Restaurant Phone" 
                     className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                  <h4 className="text-2xl font-bold mb-3 text-white">Never Miss a Call Again</h4>
                  <p className="text-sm text-white/80 mb-4">AI-powered phone assistant handles customer calls 24/7</p>
                  <div className="flex items-center text-sm text-white/60">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Live now
                  </div>
                </div>
              </div>

              {/* 150 mins - Small Square */}
              <div className="col-span-3 md:col-span-2 lg:col-span-3 row-span-2 relative rounded-2xl p-4 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                   style={{
                     backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                     border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
                   }}>
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" 
                       style={{ backgroundColor: `${colors.colors.primary}20` }}>
                    <span className="text-xl font-bold" style={{ color: colors.colors.primary }}>150</span>
                  </div>
                  <p className="text-xs opacity-60 mb-2" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>minutes</p>
                  <span className="text-lg font-bold mb-3" style={{ color: colors.colors.primary }}>$8.50</span>
                  <button className="w-full py-2 px-3 rounded-lg font-semibold text-white text-xs uppercase transition-all duration-300"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                    Buy
                  </button>
                </div>
              </div>

              {/* 200 mins - Medium Rectangle */}
              <div className="col-span-3 md:col-span-4 lg:col-span-4 row-span-2 relative rounded-2xl p-5 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                   style={{
                     backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                     border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
                   }}>
                <div className="flex items-center justify-between h-full">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-2xl font-black mr-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>200</span>
                      <span className="text-xs opacity-60" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>mins</span>
                    </div>
                    <p className="text-xs opacity-70 mb-2" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>Growing business</p>
                    <span className="text-xl font-bold" style={{ color: colors.colors.primary }}>$11.00</span>
                  </div>
                  <button className="px-4 py-2 rounded-lg font-semibold text-white text-xs uppercase transition-all duration-300 hover:scale-105"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                    Select
                  </button>
                </div>
              </div>

              {/* 300 mins - Small Square */}
              <div className="col-span-3 md:col-span-2 lg:col-span-3 row-span-2 relative rounded-2xl p-4 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                   style={{
                     backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                     border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
                   }}>
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="text-3xl font-black mb-1" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>300</div>
                  <p className="text-xs opacity-60 mb-3" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>minutes</p>
                  <span className="text-lg font-bold mb-4" style={{ color: colors.colors.primary }}>$15.50</span>
                  <button className="w-full py-2 px-3 rounded-lg font-semibold text-white text-xs uppercase transition-all duration-300"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                    Buy Now
                  </button>
                </div>
              </div>

              {/* 500 mins - Long Horizontal Card */}
              <div className="col-span-6 md:col-span-8 lg:col-span-10 row-span-2 relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.01] transition-all duration-300"
                   style={{
                     background: `linear-gradient(135deg, ${colors.colors.grey[900]} 0%, ${colors.colors.grey[800]} 100%)`,
                     border: `1px solid ${colors.colors.grey[700]}`
                   }}>
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" 
                         style={{ backgroundColor: colors.colors.primary }}>
                      <span className="text-2xl font-black text-white">500</span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-white mb-1">Business Package</h4>
                      <p className="text-sm text-gray-400">500 minutes • Best value for growing restaurants</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black mb-2" style={{ color: colors.colors.primary }}>$24.00</div>
                    <button className="px-6 py-3 rounded-xl font-semibold text-white text-sm uppercase transition-all duration-300 hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                      Choose Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* 750 mins - Medium Square Card */}
              <div className="col-span-3 md:col-span-3 lg:col-span-3 row-span-2 relative rounded-2xl p-5 group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                   style={{
                     background: `linear-gradient(135deg, ${colors.colors.primary}15 0%, ${colors.colors.primary}08 100%)`,
                     border: `2px solid ${colors.colors.primary}30`
                   }}>
                <div className="text-center h-full flex flex-col justify-center">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" 
                       style={{ backgroundColor: colors.colors.primary }}>
                    <span className="text-xl font-black text-white">750</span>
                  </div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Premium</h4>
                  <p className="text-xs opacity-60 mb-3" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>750 minutes</p>
                  <span className="text-xl font-bold mb-4" style={{ color: colors.colors.primary }}>$34.50</span>
                  <button className="w-full py-2 px-3 rounded-xl font-semibold text-white text-xs uppercase transition-all duration-300 hover:scale-105"
                          style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                    Get Premium
                  </button>
                </div>
              </div>

              {/* 1000 mins - Large Rectangle */}
              <div className="col-span-6 md:col-span-6 lg:col-span-7 row-span-2 relative rounded-2xl p-6 group cursor-pointer hover:scale-[1.01] transition-all duration-300 overflow-hidden"
                   style={{
                     background: `linear-gradient(135deg, ${colors.colors.primary}12 0%, ${colors.colors.primary}06 100%)`,
                     border: `1px solid ${colors.colors.primary}40`
                   }}>
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-15" 
                     style={{ backgroundColor: colors.colors.primary }}></div>
                <div className="relative z-10 flex items-center justify-between h-full">
                  <div>
                    <div className="flex items-baseline mb-2">
                      <span className="text-3xl font-black mr-2" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>1000</span>
                      <span className="text-sm opacity-60" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>minutes</span>
                    </div>
                    <h4 className="text-lg font-bold mb-1" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>Enterprise</h4>
                    <p className="text-xs opacity-70" style={{ color: isDark ? colors.colors.grey[400] : colors.colors.grey[600] }}>Best value per minute</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black mb-3" style={{ color: colors.colors.primary }}>$45.00</div>
                    <button className="px-5 py-2 rounded-xl font-semibold text-white text-sm uppercase transition-all duration-300 hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${colors.colors.primary} 0%, ${colors.colors.primary}dd 100%)` }}>
                      Select
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Feature Card */}
              <div className="col-span-6 md:col-span-6 lg:col-span-6 row-span-2 relative rounded-2xl p-5 group cursor-pointer hover:scale-[1.01] transition-all duration-300"
                   style={{
                     backgroundColor: isDark ? colors.colors.grey[800] : colors.colors.white,
                     border: isDark ? `1px solid ${colors.colors.grey[700]}` : `1px solid ${colors.colors.grey[200]}`
                   }}>
                <div className="flex items-center h-full">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center" 
                           style={{ backgroundColor: `${colors.colors.primary}20` }}>
                        <span className="text-lg">🕐</span>
                      </div>
                      <h4 className="text-lg font-bold" style={{ color: isDark ? colors.colors.white : colors.colors.dark }}>24/7 Available</h4>
                    </div>
                    <p className="text-sm opacity-80 mb-3" style={{ color: isDark ? colors.colors.grey[300] : colors.colors.grey[600] }}>
                      AI assistant never sleeps, handles calls anytime.
                    </p>
                    <div className="flex items-center text-xs" style={{ color: colors.colors.primary }}>
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="font-semibold">Active now</span>
                    </div>
                  </div>
                  <div className="w-20 h-20 rounded-2xl ml-4 flex items-center justify-center" 
                       style={{ backgroundColor: `${colors.colors.primary}10` }}>
                    <span className="text-2xl">📞</span>
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
  );
}
