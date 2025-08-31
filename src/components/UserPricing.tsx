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
  userPlan?: string;
}

export default function UserPricing({ userPlan }: UserPricingProps) {
  const { isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Here you would handle the subscription logic
    console.log('Selected plan:', planId);
  };

  return (
    <div className="min-h-screen transition-all duration-300 relative overflow-hidden" 
         style={{
           background: isDark 
             ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
             : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
         }}>
      
      {/* Simple floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20 blur-xl"
             style={{ backgroundColor: '#f093fb' }}></div>
        <div className="absolute bottom-32 right-20 w-96 h-96 rounded-full opacity-15 blur-2xl"
             style={{ backgroundColor: '#f5576c' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
             style={{ backgroundColor: '#4facfe' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Choose Your Plan
          </h1>
          <p className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Select the perfect AI phone assistant plan for your restaurant. Streamline your operations, 
            enhance customer experience, and never miss a call again with KALLIN.AI's intelligent solutions.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto px-4">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl transition-all duration-300 hover:scale-105 flex flex-col h-[600px] ${
                plan.featured ? 'scale-105 ring-4 ring-orange-400 ring-opacity-50' : ''
              }`}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                ...(isDark && {
                  backgroundColor: '#1f2937',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                })
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
                    <span className="text-6xl font-black text-gray-900" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                      ${Math.floor(parseFloat(plan.price))}
                    </span>
                    <span className="text-2xl font-bold text-gray-900 ml-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                      .{plan.price.split('.')[1] || '00'}
                    </span>
                  </div>
                  <p className={`text-sm font-medium uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {plan.period}
                  </p>
                </div>

                {/* Description */}
                <p className={`text-sm mb-8 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
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
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button - positioned at bottom */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={userPlan === plan.id}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-lg uppercase tracking-wide transition-all duration-300 hover:scale-105 transform ${
                    userPlan === plan.id ? 'opacity-75 cursor-default' : 'hover:opacity-90'
                  }`}
                  style={{ 
                    background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`,
                    boxShadow: `0 10px 25px -5px ${plan.color}40`
                  }}
                >
                  {userPlan === plan.id ? 'CURRENT PLAN' : 'BUY NOW'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Need a custom solution? <a href="/contact" className="text-orange-500 hover:text-orange-600 font-medium">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
}
