#!/usr/bin/env node
/**
 * Admin Script: List Users
 * 
 * Usage:
 *   node server/scripts/list-users.js [--plan <plan>] [--limit <n>]
 * 
 * Examples:
 *   node server/scripts/list-users.js                    # List all users
 *   node server/scripts/list-users.js --plan platinum    # List platinum users
 *   node server/scripts/list-users.js --limit 10         # List first 10 users
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

async function listUsers(options = {}) {
  console.log('\n📋 Fetching users...\n');
  
  let query = supabase
    .from('users')
    .select('id, plan, grandfathered, stripe_customer_id, created_at')
    .order('created_at', { ascending: false });
  
  // Filter by plan if specified
  if (options.plan) {
    if (options.plan === 'free' || options.plan === 'null') {
      query = query.is('plan', null);
    } else {
      query = query.eq('plan', options.plan);
    }
  }
  
  // Limit results
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data: users, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching users:', error.message);
    process.exit(1);
  }
  
  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }
  
  console.log(`Found ${users.length} user(s):\n`);
  console.log('─'.repeat(95));
  console.log(
    'User ID'.padEnd(40) +
    'Plan'.padEnd(12) +
    'Stripe'.padEnd(10) +
    'Grandfathered'.padEnd(15) +
    'Created'
  );
  console.log('─'.repeat(95));
  
  users.forEach(user => {
    const userId = (user.id || 'N/A').substring(0, 38).padEnd(40);
    const plan = (user.plan || 'free').padEnd(12);
    const stripe = (user.stripe_customer_id ? 'Yes' : 'No').padEnd(10);
    const grandfathered = (user.grandfathered ? 'Yes' : 'No').padEnd(15);
    const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
    
    console.log(`${userId}${plan}${stripe}${grandfathered}${created}`);
  });
  
  console.log('─'.repeat(100));
  
  // Summary
  const planCounts = users.reduce((acc, u) => {
    const p = u.plan || 'free';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 Summary:');
  Object.entries(planCounts).forEach(([plan, count]) => {
    console.log(`   ${plan}: ${count} user(s)`);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--plan' && args[i + 1]) {
    options.plan = args[i + 1].toLowerCase();
    i++;
  } else if (args[i] === '--limit' && args[i + 1]) {
    options.limit = parseInt(args[i + 1], 10);
    i++;
  }
}

listUsers(options)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
