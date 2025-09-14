#!/usr/bin/env node

// Quick script to restore platinum status for the user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restorePlatinum(userId) {
  try {
    // Update user plan to platinum
    const { data, error } = await supabase
      .from('users')
      .update({ 
        plan: 'platinum',
        api_request_count: 0 // Reset counter as well
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Failed to update user plan:', error);
      return;
    }

    console.log('✅ Successfully restored platinum status for user:', userId);
    console.log('Updated user data:', data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get user ID from command line or use your actual user ID
const userId = process.argv[2];

if (!userId) {
  console.log('Usage: node restore-platinum.js <user-id>');
  console.log('Example: node restore-platinum.js your-supabase-user-id');
  process.exit(1);
}

console.log('🚀 Restoring platinum status for user:', userId);
restorePlatinum(userId);
