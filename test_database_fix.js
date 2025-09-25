#!/usr/bin/env node

/**
 * Test script to verify the database fix for new user creation
 * Run this after applying the DATABASE_FIX_NEW_USERS.sql
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseFix() {
  console.log('🧪 Testing Database Fix for New User Creation\n');

  try {
    // Test 1: Check if unified trigger exists
    console.log('1. Checking database trigger...');
    const { data: triggers, error: triggerError } = await supabase.rpc('test_new_user_fix');
    
    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError);
      return false;
    }

    console.log('✅ Database structure test results:');
    triggers.forEach(result => {
      console.log(`   ${result.test_name}: ${result.status} - ${result.details}`);
    });

    // Test 2: Check current user count
    console.log('\n2. Checking current users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, plan, grandfathered, created_at')
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return false;
    }

    console.log(`✅ Found ${users.length} users in database`);
    users.forEach(user => {
      console.log(`   User ${user.id.substring(0, 8)}...: plan=${user.plan || 'NULL'}, grandfathered=${user.grandfathered}`);
    });

    // Test 3: Check profiles table
    console.log('\n3. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, created_at')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return false;
    }

    console.log(`✅ Found ${profiles.length} profiles in database`);
    profiles.forEach(profile => {
      console.log(`   Profile ${profile.id.substring(0, 8)}...: username=${profile.username || 'NULL'}`);
    });

    // Test 4: Test username validation
    console.log('\n4. Testing username validation...');
    const { data: validUsername, error: validationError } = await supabase
      .rpc('username_available', { candidate: 'testuser123' });

    if (validationError) {
      console.error('❌ Error testing username validation:', validationError);
      return false;
    }

    console.log(`✅ Username validation working: 'testuser123' available = ${validUsername}`);

    console.log('\n🎉 Database fix verification complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Apply the DATABASE_FIX_NEW_USERS.sql to your Supabase database');
    console.log('   2. Test user signup flow in your application');
    console.log('   3. Monitor server logs for any remaining errors');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testDatabaseFix()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
