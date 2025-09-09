#!/usr/bin/env node

// Simple script to grant platinum access to users
const axios = require('axios');

const ADMIN_API_KEY = 'admin-dev-key-2024'; // Set this in your .env file
const BASE_URL = 'http://localhost:10000';

async function grantPlatinum(userId) {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/set-plan`, {
      userId: userId,
      plan: 'platinum'
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Successfully granted platinum access to:', userId);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Failed to grant platinum:', error.response?.data || error.message);
  }
}

async function checkUsage(userId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/me/usage`, {
      headers: {
        'x-user-id': userId
      }
    });
    
    console.log('📊 Current usage for', userId + ':', response.data);
  } catch (error) {
    console.error('❌ Failed to check usage:', error.response?.data || error.message);
  }
}

// Main execution
const userId = process.argv[2] || 'demo-user';
const action = process.argv[3] || 'grant';

console.log(`🚀 Admin Tool - ${action === 'grant' ? 'Granting platinum' : 'Checking usage'} for user: ${userId}`);

if (action === 'grant') {
  grantPlatinum(userId);
} else if (action === 'check') {
  checkUsage(userId);
} else {
  console.log('Usage: node grant-platinum.js [userId] [grant|check]');
  console.log('Example: node grant-platinum.js demo-user grant');
  console.log('Example: node grant-platinum.js demo-user check');
}
