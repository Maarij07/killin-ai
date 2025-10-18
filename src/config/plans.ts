// Centralized plan configuration - single source of truth
export interface PlanConfig {
  id: string;
  name: string;
  price: number; // Price in dollars
  amountCents: number; // Price in cents for Stripe
  period: string;
  description: string;
  minutes: number;
  plan_type: string;
  features: string[];
  featured?: boolean;
  color: string;
  stripeProductId?: string; // Will be set when products are created
  stripePriceId?: string; // Will be set when prices are created
}

// Import colors for consistency
import colors from '../../colors.json';

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  trial: {
    id: 'trial',
    name: 'Trial',
    price: 25.00,
    amountCents: 2500,
    period: '100 mins',
    description: 'Perfect trial package to test our AI phone assistance with generous minutes.',
    minutes: 100,
    plan_type: 'trial',
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
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 299.00,
    amountCents: 29900,
    period: 'Per Month',
    description: 'Perfect for small restaurants getting started with AI phone assistance.',
    minutes: 250,
    plan_type: 'starter',
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
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 469.00,
    amountCents: 46900,
    period: 'Per Month',
    description: 'Ideal for busy restaurants with high call volumes and premium requirements.',
    minutes: 450,
    plan_type: 'professional',
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
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499.00,
    amountCents: 49900,
    period: 'Per Month',
    description: 'Complete solution for restaurant chains and high-volume establishments.',
    minutes: 900,
    plan_type: 'enterprise',
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
  },
  'ai-voice': {
    id: 'ai-voice',
    name: 'AI Voice',
    price: 25.00,
    amountCents: 2500,
    period: 'Per Month',
    description: 'Variety of Male/Female Voices',
    minutes: 0,
    plan_type: 'ai-voice',
    features: [
      'Multiple voice options',
      'Male & Female voices',
      'Natural speech patterns',
      'Custom voice training'
    ],
    featured: false,
    color: colors.colors.primary
  },
  minutes_100: {
    id: 'minutes_100',
    name: '100 Minutes',
    price: 40.00,
    amountCents: 4000,
    period: 'One-time',
    description: '100 Minutes Top-up',
    minutes: 100,
    plan_type: 'minutes',
    features: [
      '100 additional minutes',
      'Never expires',
      'Instant activation',
      'Perfect for small needs'
    ],
    featured: false,
    color: colors.colors.primary
  },
  minutes_250: {
    id: 'minutes_250',
    name: '250 Minutes',
    price: 75.00,
    amountCents: 7500,
    period: 'One-time',
    description: '250 Minutes Top-up',
    minutes: 250,
    plan_type: 'minutes',
    features: [
      '250 additional minutes',
      'Never expires',
      'Instant activation',
      'Great value'
    ],
    featured: false,
    color: colors.colors.primary
  },
  minutes_500: {
    id: 'minutes_500',
    name: '500 Minutes',
    price: 140.00,
    amountCents: 14000,
    period: 'One-time',
    description: '500 Minutes Top-up',
    minutes: 500,
    plan_type: 'minutes',
    features: [
      '500 additional minutes',
      'Never expires',
      'Instant activation',
      'Best for heavy usage'
    ],
    featured: false,
    color: colors.colors.primary
  },
  minutes_1000: {
    id: 'minutes_1000',
    name: '1000 Minutes',
    price: 260.00,
    amountCents: 26000,
    period: 'One-time',
    description: '1000 Minutes Top-up',
    minutes: 1000,
    plan_type: 'minutes',
    features: [
      '1000 additional minutes',
      'Never expires',
      'Instant activation',
      'Maximum value'
    ],
    featured: false,
    color: colors.colors.primary
  }
};

// Helper functions
export function getPlanConfig(planId: string): PlanConfig | null {
  return PLAN_CONFIGS[planId] || null;
}

export function getAllPlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIGS);
}

export function getMainPlans(): PlanConfig[] {
  return getAllPlans().filter(plan => 
    ['trial', 'starter', 'professional', 'enterprise'].includes(plan.id)
  );
}

export function getAddonPlans(): PlanConfig[] {
  return getAllPlans().filter(plan => 
    plan.plan_type === 'minutes' || plan.id === 'ai-voice'
  );
}

export function isSubscriptionPlan(planId: string): boolean {
  const plan = getPlanConfig(planId);
  return plan ? !plan.id.startsWith('minutes_') && plan.id !== 'trial' : false;
}

export function isOneTimePlan(planId: string): boolean {
  const plan = getPlanConfig(planId);
  return plan ? plan.id.startsWith('minutes_') || plan.id === 'trial' : false;
}
