#!/usr/bin/env node

// Enhanced script to restore platinum status with proper subscription tracking
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restorePlatinumWithSubscription(userId, durationDays = 30) {
  try {
    // Calculate subscription end date
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays);

    // Update user plan to platinum with subscription end date
    const { data, error } = await supabase
      .from('users')
      .update({ 
        plan: 'platinum',
        subscription_end_date: subscriptionEndDate.toISOString(),
        api_request_count: 0 // Reset counter as well
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Failed to update user plan:', error);
      return;
    }

    console.log('✅ Successfully restored platinum status with subscription tracking');
    console.log(`📅 Subscription expires: ${subscriptionEndDate.toLocaleDateString()}`);
    console.log('Updated user data:', data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get user ID and optional duration from command line
const userId = process.argv[2];
const durationDays = parseInt(process.argv[3]) || 30;

if (!userId) {
  console.log('Usage: node update-restore-platinum.js <user-id> [duration-days]');
  console.log('Example: node update-restore-platinum.js your-supabase-user-id 30');
  process.exit(1);
}

console.log(`🚀 Restoring platinum status for user: ${userId} (${durationDays} days)`);
restorePlatinumWithSubscription(userId, durationDays);
