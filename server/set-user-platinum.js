#!/usr/bin/env node
/**
 * Quick script to set a user to Platinum plan
 * Usage: node set-user-platinum.js <USER_ID>
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setUserPlatinum(userId) {
  if (!userId) {
    console.error('❌ Please provide a user ID');
    console.log('Usage: node set-user-platinum.js <USER_ID>');
    process.exit(1);
  }

  try {
    console.log(`🔄 Setting user ${userId} to Platinum...`);

    const { data, error } = await supabase
      .from('users')
      .update({ plan: 'platinum' })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Error updating user:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User updated to Platinum!');
    console.log('User data:', data[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

const userId = process.argv[2];
setUserPlatinum(userId);
