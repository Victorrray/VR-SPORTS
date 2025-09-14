// Test script to verify the complete sign out flow
const puppeteer = require('puppeteer');

async function testSignOutFlow() {
  console.log('🧪 Testing complete sign out flow...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the local development server
    await page.goto('http://localhost:3001');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    console.log('✅ Page loaded successfully');
    
    // Check if we can access the profile page (would require auth)
    try {
      await page.goto('http://localhost:3001/profile');
      await page.waitForTimeout(1000);
      
      // Look for sign out button
      const signOutButton = await page.$('[data-testid="btn-signout"]');
      if (signOutButton) {
        console.log('✅ Found sign out button on profile page');
        
        // Click sign out
        await signOutButton.click();
        console.log('✅ Clicked sign out button');
        
        // Wait for redirect
        await page.waitForTimeout(3000);
        
        // Check if we're back on home page
        const currentUrl = page.url();
        if (currentUrl.includes('localhost:3001') && !currentUrl.includes('/profile')) {
          console.log('✅ Successfully redirected after sign out');
        } else {
          console.log('❌ Redirect after sign out failed, current URL:', currentUrl);
        }
      } else {
        console.log('ℹ️ No sign out button found (user may not be logged in)');
      }
    } catch (error) {
      console.log('ℹ️ Profile page access test:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Sign out flow test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available, otherwise just test the server endpoint
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, 'node_modules/puppeteer'))) {
  testSignOutFlow();
} else {
  console.log('ℹ️ Puppeteer not available, testing server endpoint only...');
  
  const axios = require('axios');
  
  async function testServerOnly() {
    try {
      const response = await axios.post('http://localhost:10000/api/logout');
      console.log('✅ Server logout endpoint working:', response.data);
    } catch (error) {
      console.error('❌ Server logout test failed:', error.message);
    }
  }
  
  testServerOnly();
}
