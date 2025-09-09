#!/usr/bin/env node

// Admin setup script - run this to configure admin access and grant platinum
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ADMIN_KEY = 'admin-dev-key-2024';
const SERVER_ENV_PATH = path.join(__dirname, 'server', '.env');

// Create .env file with admin key
function createEnvFile() {
  const envContent = `# Development Environment Variables
ODDS_API_KEY=test_key
PORT=10000
ADMIN_API_KEY=${ADMIN_KEY}

# Optional: Add your real API keys here
# ODDS_API_KEY=your_real_odds_api_key_here
# SPORTSGAMEODDS_API_KEY=your_sportsgameodds_api_key_here

# Supabase (optional for local dev)
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe (optional for local dev)
# STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
# STRIPE_PRICE_PLATINUM=price_your_platinum_price_id_here
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:3000
`;

  try {
    fs.writeFileSync(SERVER_ENV_PATH, envContent);
    console.log('✅ Created server/.env file with admin key');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    console.log('📝 Manually create server/.env with this content:');
    console.log(envContent);
  }
}

// Grant platinum to user
async function grantPlatinum(userId = 'demo-user') {
  try {
    const response = await axios.post('http://localhost:10000/api/admin/set-plan', {
      userId: userId,
      plan: 'platinum'
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Successfully granted platinum access to: ${userId}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Server not running. Start server first, then run:');
      console.log(`curl -X POST http://localhost:10000/api/admin/set-plan \\
  -H "Authorization: Bearer ${ADMIN_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "${userId}", "plan": "platinum"}'`);
    } else {
      console.error('❌ Failed to grant platinum:', error.response?.data || error.message);
    }
    return false;
  }
}

// Check current usage
async function checkUsage(userId = 'demo-user') {
  try {
    const response = await axios.get('http://localhost:10000/api/me/usage', {
      headers: { 'x-user-id': userId }
    });
    console.log(`📊 Current usage for ${userId}:`, response.data);
  } catch (error) {
    console.error('❌ Failed to check usage:', error.response?.data || error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Setting up admin access and granting platinum...\n');
  
  // Step 1: Create .env file
  createEnvFile();
  
  // Step 2: Wait a moment for server restart (if needed)
  console.log('\n⏳ Waiting 2 seconds for server to load new env...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: Grant platinum
  const userId = process.argv[2] || 'demo-user';
  console.log(`\n🎯 Granting platinum to user: ${userId}`);
  
  const success = await grantPlatinum(userId);
  if (success) {
    await checkUsage(userId);
  }
  
  console.log('\n📋 Manual commands if needed:');
  console.log('1. Restart server: cd server && npm start');
  console.log(`2. Grant platinum: curl -X POST http://localhost:10000/api/admin/set-plan -H "Authorization: Bearer ${ADMIN_KEY}" -H "Content-Type: application/json" -d '{"userId": "${userId}", "plan": "platinum"}'`);
  console.log(`3. Check usage: curl -H "x-user-id: ${userId}" http://localhost:10000/api/me/usage`);
}

main().catch(console.error);
