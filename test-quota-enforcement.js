const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuotaEnforcement() {
  try {
    console.log('=== QUOTA ENFORCEMENT TEST ===\n');
    
    // Find a free user to test with
    const { data: freeUsers } = await supabase
      .from('users')
      .select('id, plan, api_request_count')
      .eq('plan', 'free')
      .limit(1);
    
    if (!freeUsers || freeUsers.length === 0) {
      console.log('❌ No free users found to test with');
      return;
    }
    
    const testUser = freeUsers[0];
    console.log(`Testing quota enforcement with user: ${testUser.id.slice(0, 8)}...`);
    console.log(`Current usage: ${testUser.api_request_count || 0}/250`);
    
    // Test 1: Normal API call (should work)
    console.log('\n📞 Test 1: Normal API call');
    try {
      const response = await fetch('http://localhost:10000/api/me/usage', {
        headers: {
          'x-user-id': testUser.id,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API call successful');
        console.log('Response:', data);
      } else {
        console.log('❌ API call failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ API call error:', error.message);
    }
    
    // Test 2: Set user to quota limit and test enforcement
    console.log('\n📞 Test 2: Quota limit enforcement');
    
    // Set user to 249 calls (just under limit)
    await supabase
      .from('users')
      .update({ api_request_count: 249 })
      .eq('id', testUser.id);
    
    console.log('Set user to 249/250 calls');
    
    // Try API call (should work)
    try {
      const response = await fetch('http://localhost:10000/api/scores', {
        headers: {
          'x-user-id': testUser.id,
          'Accept': 'application/json'
        }
      });
      
      console.log(`API call at 249/250: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
      }
    } catch (error) {
      console.log('API call error:', error.message);
    }
    
    // Set user to 250 calls (at limit)
    await supabase
      .from('users')
      .update({ api_request_count: 250 })
      .eq('id', testUser.id);
    
    console.log('Set user to 250/250 calls (at limit)');
    
    // Try API call (should be blocked)
    try {
      const response = await fetch('http://localhost:10000/api/scores', {
        headers: {
          'x-user-id': testUser.id,
          'Accept': 'application/json'
        }
      });
      
      console.log(`API call at 250/250: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('✅ Quota enforcement working - Error response:', errorData);
      } else {
        console.log('⚠️ API call succeeded when it should have been blocked');
      }
    } catch (error) {
      console.log('API call error:', error.message);
    }
    
    // Reset user back to original count
    await supabase
      .from('users')
      .update({ api_request_count: testUser.api_request_count || 0 })
      .eq('id', testUser.id);
    
    console.log(`✅ Reset user back to ${testUser.api_request_count || 0} calls`);
    
    // Test 3: Check platinum user (should have unlimited)
    console.log('\n📞 Test 3: Platinum user (unlimited)');
    
    const { data: platinumUsers } = await supabase
      .from('users')
      .select('id, plan, api_request_count')
      .eq('plan', 'platinum')
      .limit(1);
    
    if (platinumUsers && platinumUsers.length > 0) {
      const platUser = platinumUsers[0];
      console.log(`Testing with platinum user: ${platUser.id.slice(0, 8)}...`);
      
      try {
        const response = await fetch('http://localhost:10000/api/me/usage', {
          headers: {
            'x-user-id': platUser.id,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Platinum user API call successful');
          console.log('Response:', data);
        }
      } catch (error) {
        console.log('❌ Platinum API call error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testQuotaEnforcement();
