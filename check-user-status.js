#!/usr/bin/env node

// Script to check user's current subscription status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Required environment variables:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserStatus(userId) {
  try {
    console.log(`🔍 Checking status for user: ${userId}`);
    
    // Get user data
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching user:', error);
      return;
    }

    if (!data) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📊 Current User Status:');
    console.log('='.repeat(50));
    console.log(`User ID: ${data.id}`);
    console.log(`Email: ${data.email || 'Not available'}`);
    console.log(`Plan: ${data.plan || 'free'}`);
    console.log(`API Request Count: ${data.api_request_count || 0}`);
    console.log(`Subscription End Date: ${data.subscription_end_date || 'Not set'}`);
    console.log(`Created: ${data.created_at || 'Unknown'}`);
    console.log(`Last Sign In: ${data.last_sign_in_at || 'Unknown'}`);
    
    // Check if subscription is active
    if (data.subscription_end_date) {
      const endDate = new Date(data.subscription_end_date);
      const now = new Date();
      const isActive = endDate > now;
      
      console.log(`\n🎯 Subscription Status: ${isActive ? '✅ ACTIVE' : '❌ EXPIRED'}`);
      if (isActive) {
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        console.log(`Days remaining: ${daysLeft}`);
      }
    } else {
      console.log('\n🎯 Subscription Status: ❌ NO SUBSCRIPTION');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node check-user-status.js <user-id>');
  console.log('Example: node check-user-status.js d33fa31a-cbf2-49dc-bf26-14059c576265');
  process.exit(1);
}

checkUserStatus(userId);
