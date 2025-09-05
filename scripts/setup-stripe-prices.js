const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  try {
    console.log('Setting up Stripe products and prices...\n');

    // 1. Create Starter Plan
    console.log('Creating Starter plan...');
    const starterProduct = await stripe.products.create({
      name: 'Starter Plan',
      description: 'Perfect for small restaurants getting started with AI phone assistance.',
    });

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 3900, // $39.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      nickname: 'Starter Monthly',
    });

    console.log(`✅ Starter Plan: ${starterPrice.id}`);

    // 2. Create Professional Plan
    console.log('Creating Professional plan...');
    const professionalProduct = await stripe.products.create({
      name: 'Professional Plan',
      description: 'Ideal for growing restaurants with higher call volumes.',
    });

    const professionalPrice = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 7900, // $79.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      nickname: 'Professional Monthly',
    });

    console.log(`✅ Professional Plan: ${professionalPrice.id}`);

    // 3. Create AI Voice Plan (the one from your pricing component)
    console.log('Creating AI Voice plan...');
    const aiVoiceProduct = await stripe.products.create({
      name: 'AI Voice Assistant',
      description: 'Advanced AI-powered voice assistant for restaurants.',
    });

    const aiVoicePrice = await stripe.prices.create({
      product: aiVoiceProduct.id,
      unit_amount: 2500, // $25.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      nickname: 'AI Voice Monthly',
    });

    console.log(`✅ AI Voice Plan: ${aiVoicePrice.id}`);

    // 4. Create Minutes Add-ons (one-time purchases)
    console.log('Creating minutes add-ons...');

    // 100 Minutes
    const minutes100Product = await stripe.products.create({
      name: '100 Additional Minutes',
      description: 'Top up your account with 100 extra minutes.',
    });

    const minutes100Price = await stripe.prices.create({
      product: minutes100Product.id,
      unit_amount: 4000, // $40.00
      currency: 'usd',
      nickname: '100 Minutes Add-on',
    });

    console.log(`✅ 100 Minutes: ${minutes100Price.id}`);

    // 250 Minutes
    const minutes250Product = await stripe.products.create({
      name: '250 Additional Minutes',
      description: 'Top up your account with 250 extra minutes.',
    });

    const minutes250Price = await stripe.prices.create({
      product: minutes250Product.id,
      unit_amount: 9000, // $90.00
      currency: 'usd',
      nickname: '250 Minutes Add-on',
    });

    console.log(`✅ 250 Minutes: ${minutes250Price.id}`);

    // 500 Minutes
    const minutes500Product = await stripe.products.create({
      name: '500 Additional Minutes',
      description: 'Top up your account with 500 extra minutes.',
    });

    const minutes500Price = await stripe.prices.create({
      product: minutes500Product.id,
      unit_amount: 17500, // $175.00
      currency: 'usd',
      nickname: '500 Minutes Add-on',
    });

    console.log(`✅ 500 Minutes: ${minutes500Price.id}`);

    // 1000 Minutes
    const minutes1000Product = await stripe.products.create({
      name: '1000 Additional Minutes',
      description: 'Top up your account with 1000 extra minutes.',
    });

    const minutes1000Price = await stripe.prices.create({
      product: minutes1000Product.id,
      unit_amount: 32500, // $325.00
      currency: 'usd',
      nickname: '1000 Minutes Add-on',
    });

    console.log(`✅ 1000 Minutes: ${minutes1000Price.id}`);

    // Output the price IDs for easy copying
    console.log('\n🎉 All products and prices created successfully!');
    console.log('\n📋 Copy these price IDs to your useStripeCheckout.ts file:');
    console.log('\nconst priceIdMap: Record<string, string> = {');
    console.log(`  starter: '${starterPrice.id}',`);
    console.log(`  professional: '${professionalPrice.id}',`);
    console.log(`  'ai-voice': '${aiVoicePrice.id}',`);
    console.log(`  minutes_100: '${minutes100Price.id}',`);
    console.log(`  minutes_250: '${minutes250Price.id}',`);
    console.log(`  minutes_500: '${minutes500Price.id}',`);
    console.log(`  minutes_1000: '${minutes1000Price.id}',`);
    console.log('};');

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    
    if (error.code === 'api_key_invalid') {
      console.log('\n💡 Make sure your STRIPE_SECRET_KEY is set correctly in .env.local');
    }
  }
}

createStripeProducts();
