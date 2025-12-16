#!/usr/bin/env node
/**
 * Admin Script: Update User Plan
 * 
 * Usage:
 *   node server/scripts/update-user-plan.js <email> <plan>
 * 
 * Examples:
 *   node server/scripts/update-user-plan.js user@example.com platinum
 *   node server/scripts/update-user-plan.js user@example.com gold
 *   node server/scripts/update-user-plan.js user@example.com free
 * 
 * Plans:
 *   - platinum: Full access, unlimited API calls
 *   - gold: Premium access with limits
 *   - free: Basic access, 250 API calls
 *   - null: Remove plan (same as free)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateUserPlan(identifier, plan) {
  console.log(`\n🔍 Looking up user: ${identifier}`);
  
  // Find user by ID or try to match partial ID
  let users, findError;
  
  // First try exact ID match
  const { data: exactMatch, error: exactError } = await supabase
    .from('users')
    .select('id, plan, grandfathered, stripe_customer_id')
    .eq('id', identifier);
  
  if (!exactError && exactMatch && exactMatch.length > 0) {
    users = exactMatch;
  } else {
    // Try partial ID match (for convenience)
    const { data: partialMatch, error: partialError } = await supabase
      .from('users')
      .select('id, plan, grandfathered, stripe_customer_id')
      .ilike('id', `%${identifier}%`);
    
    users = partialMatch;
    findError = partialError;
  }
  
  if (findError) {
    console.error('❌ Error finding user:', findError.message);
    process.exit(1);
  }
  
  if (!users || users.length === 0) {
    console.error(`❌ No user found with ID: ${identifier}`);
    console.error('   Use the list-users.js script to find user IDs');
    process.exit(1);
  }
  
  if (users.length > 1) {
    console.error(`❌ Multiple users found matching: ${identifier}`);
    users.forEach(u => console.log(`   - ${u.id}`));
    console.error('   Please use the full user ID');
    process.exit(1);
  }
  
  const user = users[0];
  console.log(`✅ Found user: ${user.id}`);
  console.log(`   Current plan: ${user.plan || 'null (free)'}`);
  console.log(`   Grandfathered: ${user.grandfathered || false}`);
  console.log(`   Stripe Customer: ${user.stripe_customer_id || 'none (manually upgraded)'}`);
  
  // Validate plan
  const validPlans = ['platinum', 'gold', 'free', 'null'];
  if (!validPlans.includes(plan)) {
    console.error(`❌ Invalid plan: ${plan}`);
    console.error(`   Valid plans: ${validPlans.join(', ')}`);
    process.exit(1);
  }
  
  // Convert 'null' string to actual null
  const planValue = plan === 'null' || plan === 'free' ? null : plan;
  
  // Update user plan
  console.log(`\n📝 Updating plan to: ${planValue || 'null (free)'}`);
  
  const updateData = {
    plan: planValue,
    updated_at: new Date().toISOString()
  };
  
  // Note: subscription_status, grace_period_end, etc. columns may not exist
  // They are only needed for Stripe subscribers, not manually upgraded users
  
  const { error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id);
  
  if (updateError) {
    console.error('❌ Error updating user:', updateError.message);
    process.exit(1);
  }
  
  console.log(`✅ Successfully updated user plan!`);
  console.log(`\n📊 Summary:`);
  console.log(`   User: ${email}`);
  console.log(`   Old Plan: ${user.plan || 'null (free)'}`);
  console.log(`   New Plan: ${planValue || 'null (free)'}`);
  
  // Verify the update
  const { data: verifyUser, error: verifyError } = await supabase
    .from('users')
    .select('plan, subscription_status')
    .eq('id', user.id)
    .single();
  
  if (!verifyError && verifyUser) {
    console.log(`\n✅ Verified: Plan is now "${verifyUser.plan || 'null (free)'}"`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Usage: node server/scripts/update-user-plan.js <email> <plan>

Examples:
  node server/scripts/update-user-plan.js user@example.com platinum
  node server/scripts/update-user-plan.js user@example.com gold
  node server/scripts/update-user-plan.js user@example.com free

Plans:
  - platinum: Full access, unlimited API calls
  - gold: Premium access with limits
  - free: Basic access, 250 API calls
`);
  process.exit(1);
}

const [email, plan] = args;

updateUserPlan(email, plan.toLowerCase())
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
