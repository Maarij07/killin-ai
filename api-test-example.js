// Example of the updated payment confirmation API calls
// Based on the new user management logic

const API_BASE_URL = 'https://3758a6b3509d.ngrok-free.app/api';

// Example 1: When only minutes are changed (same plan)
const minuteOnlyChangePayload = {
  user_id: 17,
  plan_type: "custom",  // Set to "custom" when only minutes changed
  amount_paid: 0,       // Zero for admin updates
  transaction_id: "",   // Empty string for admin updates
  payment_intent_id: "", // Empty string for admin updates
  minutes: 800,         // Updated minutes value
  is_admin: true        // Admin flag to bypass Stripe validation
};

// Example 2: When plan is also changed
const planChangePayload = {
  user_id: 17,
  plan_type: "premium", // Uses new plan names: basic, premium, enterprise
  amount_paid: 0,       // Zero for admin updates
  transaction_id: "",   // Empty string for admin updates
  payment_intent_id: "", // Empty string for admin updates
  minutes: 800,         // Updated minutes value
  is_admin: true        // Admin flag to bypass Stripe validation
};

// Example API calls that would be made
async function testPaymentConfirmationAPI() {
  console.log('=== API Call Examples ===');
  
  console.log('\n1. Minutes-only change (same plan):');
  console.log('POST', `${API_BASE_URL}/stripe/confirm-payment`);
  console.log('Payload:', JSON.stringify(minuteOnlyChangePayload, null, 2));
  
  console.log('\n2. Plan change:');
  console.log('POST', `${API_BASE_URL}/stripe/confirm-payment`);
  console.log('Payload:', JSON.stringify(planChangePayload, null, 2));
  
  console.log('\n=== Plan Mapping ===');
  const planMapping = {
    'basic': 'basic',
    'premium': 'premium', 
    'enterprise': 'enterprise'
  };
  console.log('Available plans:', Object.keys(planMapping));
  
  console.log('\n=== Logic Summary ===');
  console.log('- Admin payload includes: user_id, plan_type, amount_paid, transaction_id, payment_intent_id, minutes, is_admin');
  console.log('- is_admin: true flag bypasses Stripe validation requirements');
  console.log('- amount_paid: 0 for all admin updates');
  console.log('- transaction_id: "" (empty string) for admin updates');
  console.log('- payment_intent_id: "" (empty string) for admin updates');
  console.log('- If only minutes changed (same plan): plan_type = "custom"');
  console.log('- If plan changed: plan_type = mapped plan name (basic/premium/enterprise)');
  console.log('- Plan names changed from [free, starter, popular, pro] to [basic, premium, enterprise]');
  console.log('- Base URL changed from localhost:5000 to ngrok URL');
}

// Run the test
testPaymentConfirmationAPI();
