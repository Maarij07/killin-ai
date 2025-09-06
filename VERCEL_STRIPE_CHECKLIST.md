# Vercel Stripe Integration Checklist

## ✅ Fixed Issues

### 1. **Serverless Compatibility**
- ✅ All Stripe API routes now use shared `createStripeInstance()` from `stripe-server.ts`
- ✅ Removed inconsistent lazy initialization patterns
- ✅ Fresh Stripe instance created for each serverless function call
- ✅ Proper error handling for initialization failures

### 2. **Consistent Error Handling**
- ✅ All routes use `validateStripeConfig()` for environment validation
- ✅ Standardized error messages across all endpoints
- ✅ Better debugging information in logs

## 🔧 Vercel Environment Variables Setup

### Required Environment Variables
Add these in your Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Stripe Configuration (REQUIRED)
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key_here

# Webhook Configuration (OPTIONAL but recommended)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app

# Backend API (for payment confirmation)
BACKEND_API_URL=https://3758a6b3509d.ngrok-free.app
```

### Environment Variable Rules:
1. **Set for ALL environments**: Production, Preview, Development
2. **Use test keys** for Preview and Development
3. **Use live keys** only for Production
4. **Ensure key pairs match** (secret and publishable from same account)

## 🚀 Deployment Steps

### 1. Environment Variables
```bash
# Test locally first
npm run build
npm run start

# Check if Stripe config works
curl https://your-app.vercel.app/api/stripe/test-config
```

### 2. Verify Configuration
After deployment, test this endpoint:
```
https://your-app.vercel.app/api/stripe/test-config
```

Expected success response:
```json
{
  "configured": true,
  "testMode": true,
  "accountId": "acct_...",
  "keysMatch": true,
  "message": "✅ Stripe is properly configured!"
}
```

### 3. Test Payment Flow
1. Try creating a payment intent
2. Test the embedded payment form
3. Verify webhook handling (if configured)

## 🐛 Common Issues & Solutions

### Issue 1: "STRIPE_SECRET_KEY is not set"
**Solution**: Verify environment variables are set in Vercel Dashboard for the correct environment.

### Issue 2: "Keys are from different accounts"
**Solution**: Ensure both `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are from the same Stripe account.

### Issue 3: "Stripe initialization failed"
**Solution**: Check if you're using placeholder values. Keys should start with `sk_test_` or `sk_live_`.

### Issue 4: "Module not found" errors
**Solution**: Ensure all imports use correct relative paths in serverless environment.

## 📋 Updated API Routes

All these routes are now serverless-compatible:

- ✅ `/api/stripe/create-payment-intent`
- ✅ `/api/stripe/create-checkout-session`  
- ✅ `/api/stripe/webhook`
- ✅ `/api/stripe/payment-success`
- ✅ `/api/stripe/test-config`
- ✅ `/api/confirm-payment`

## 🔍 Testing Checklist

Before going live, test:

1. **Configuration Test**
   ```bash
   curl https://your-app.vercel.app/api/stripe/test-config
   ```

2. **Payment Intent Creation**
   ```bash
   curl -X POST https://your-app.vercel.app/api/stripe/create-payment-intent \
     -H "Content-Type: application/json" \
     -d '{"planId": "starter", "userId": "123", "userEmail": "test@example.com"}'
   ```

3. **Frontend Payment Flow**
   - Try purchasing a plan through the UI
   - Verify payment form loads correctly
   - Test with Stripe test cards

## 🚨 Key Changes Made

### Before (Problematic):
```typescript
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripe;
};
```

### After (Serverless-Compatible):
```typescript
import { createStripeInstance, validateStripeConfig } from '../../../../lib/stripe-server';

// In each route:
const configValidation = validateStripeConfig();
if (!configValidation.isValid) {
  return NextResponse.json({ error: configValidation.error }, { status: 500 });
}

const stripe = createStripeInstance();
```

## 🎉 Next Steps

1. **Deploy to Vercel** with updated environment variables
2. **Test the `/api/stripe/test-config` endpoint**
3. **Test payment flow end-to-end**
4. **Set up webhooks** for production (optional)
5. **Switch to live keys** when ready for production

Your Stripe integration should now work perfectly on Vercel! 🚀
