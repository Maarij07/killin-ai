# Vercel Deployment Guide - Stripe Integration

## 🚨 Issue Fixed

The error you were experiencing:
```
TypeError: Cannot read properties of undefined (reading 'match')
Error: Stripe configuration error
```

This was caused by improper Stripe initialization in serverless environments like Vercel. **I've now fixed all your Stripe API routes** to use serverless-compatible initialization.

## 🔧 What I Fixed

### 1. **Replaced Lazy Initialization Pattern**
**Before (Problematic):**
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

**After (Serverless-Compatible):**
```typescript
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
    typescript: true,
  });
}
```

### 2. **Updated Routes Fixed:**
- ✅ `/api/stripe/create-payment-intent/route.ts`
- ✅ `/api/stripe/create-checkout-session/route.ts`
- ✅ `/api/stripe/webhook/route.ts`
- ✅ `/api/stripe/payment-success/route.ts`
- ✅ `/api/stripe/test-config/route.ts`

### 3. **Created Shared Utility**
- ✅ `src/lib/stripe-server.ts` - Centralized serverless-compatible Stripe utilities

## 📋 Vercel Environment Variables Setup

### 1. **Add Environment Variables in Vercel Dashboard**

Go to your Vercel project dashboard → Settings → Environment Variables and add:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
BACKEND_API_URL=https://your-backend-api-url.com
```

### 2. **Environment-Specific Variables**
Set these for **all environments** (Production, Preview, Development):

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `STRIPE_SECRET_KEY` | Your live key | Test key | Test key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your live key | Test key | Test key |
| `NEXT_PUBLIC_APP_URL` | Your domain | Preview URL | localhost:3000 |

## 🚀 Deployment Steps

### 1. **Push Your Code**
```bash
git add .
git commit -m "Fix Stripe serverless initialization for Vercel"
git push origin main
```

### 2. **Redeploy on Vercel**
Vercel will automatically redeploy, or trigger manually in the dashboard.

### 3. **Test the Integration**
After deployment, test with this URL:
```
https://your-app.vercel.app/api/stripe/test-config
```

You should see:
```json
{
  "configured": true,
  "testMode": true,
  "accountId": "acct_...",
  "message": "✅ Stripe is properly configured!"
}
```

## 🔍 Testing Your Payment Flow

### 1. **Test Payment Intent API**
```bash
curl -X POST https://your-app.vercel.app/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"planId": "starter", "userId": "123", "userEmail": "test@example.com"}'
```

### 2. **Expected Response**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 19900,
  "description": "Starter Plan - Monthly subscription"
}
```

## 🛠 Key Changes Made

### **Serverless-Compatible Pattern:**
1. **No global variables** that persist between function calls
2. **Fresh Stripe instance** created for each request
3. **Proper error handling** for initialization failures
4. **Environment validation** before attempting to use Stripe

### **Better Error Messages:**
- Clear indication when environment variables are missing
- Specific error messages for different failure modes
- Proper HTTP status codes

### **TypeScript Support:**
- Added `typescript: true` flag to Stripe initialization
- Proper type definitions for better development experience

## 🔄 Webhook Configuration

For production, you'll need to:

1. **Create webhook endpoint in Stripe Dashboard:**
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, etc.

2. **Get webhook secret and add to Vercel environment variables:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
   ```

## ✅ Verification Checklist

After deployment, verify:

- [ ] `/api/stripe/test-config` returns success
- [ ] Payment intents can be created without errors
- [ ] Checkout sessions work properly
- [ ] No "Cannot read properties of undefined" errors in Vercel logs
- [ ] Both test and production environment variables are set

## 🆘 If You Still Have Issues

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Functions tab
   - Check for any remaining initialization errors

2. **Verify Environment Variables:**
   - Ensure all variables are set for the correct environment
   - Check for typos in variable names

3. **Test API Configuration:**
   - Hit `/api/stripe/test-config` to verify setup
   - Check that keys are from the same Stripe account

Your Stripe integration should now work perfectly in Vercel's serverless environment! 🎉
