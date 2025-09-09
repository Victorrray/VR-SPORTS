#!/usr/bin/env node

// Script to sign out all users from VR-Odds platform
// Usage: node signout-all-users.js [server-url]

const https = require('https');
const http = require('http');

const serverUrl = process.argv[2] || 'http://localhost:3000';
const endpoint = '/api/admin/signout-all';

console.log(`🔐 Signing out all users from: ${serverUrl}`);

const url = new URL(serverUrl + endpoint);
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'VR-Odds-Admin-Script'
  }
};

const client = url.protocol === 'https:' ? https : http;

const req = client.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 && response.ok) {
        console.log('✅ SUCCESS: All users have been signed out');
        console.log(`📅 Timestamp: ${response.timestamp}`);
        console.log('💡 Users will need to log in again to access the platform');
      } else {
        console.error('❌ FAILED:', response.error || 'Unknown error');
        if (response.details) {
          console.error('Details:', response.details);
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('💡 Make sure your server is running and accessible');
});

req.end();
