const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkApiUsageTracking() {
  try {
    console.log('=== API Usage Tracking Analysis ===\n');
    
    // Get all users with their usage data
    const { data: users, error } = await supabase
      .from('users')
      .select('id, plan, api_request_count, api_cycle_start, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log('📊 User Usage Summary:');
    console.log('Total users:', users.length);
    
    const freeUsers = users.filter(u => u.plan === 'free');
    const platinumUsers = users.filter(u => u.plan === 'platinum');
    
    console.log('Free plan users:', freeUsers.length);
    console.log('Platinum users:', platinumUsers.length);
    console.log('');
    
    // Analyze free users specifically
    console.log('🆓 FREE PLAN USERS ANALYSIS:');
    freeUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id.slice(0, 8)}...`);
      console.log(`  API Calls Used: ${user.api_request_count || 0}/250`);
      console.log(`  Cycle Start: ${user.api_cycle_start || 'Not set'}`);
      console.log(`  Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });
    
    // Check for users approaching limits
    const nearLimit = freeUsers.filter(u => (u.api_request_count || 0) > 200);
    const overLimit = freeUsers.filter(u => (u.api_request_count || 0) >= 250);
    
    console.log('⚠️ QUOTA STATUS:');
    console.log(`Users near limit (>200 calls): ${nearLimit.length}`);
    console.log(`Users over limit (≥250 calls): ${overLimit.length}`);
    
    if (overLimit.length > 0) {
      console.log('\n🚫 USERS OVER LIMIT:');
      overLimit.forEach(user => {
        console.log(`  ${user.id.slice(0, 8)}... - ${user.api_request_count} calls`);
      });
    }
    
    // Test the increment function
    console.log('\n🧪 TESTING INCREMENT FUNCTION:');
    
    // Find a free user to test with
    const testUser = freeUsers[0];
    if (testUser) {
      console.log(`Testing with user: ${testUser.id.slice(0, 8)}...`);
      console.log(`Current count: ${testUser.api_request_count || 0}`);
      
      // Simulate an API call increment
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({ 
          api_request_count: (testUser.api_request_count || 0) + 1,
          api_cycle_start: testUser.api_cycle_start || new Date().toISOString()
        })
        .eq('id', testUser.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Update failed:', updateError.message);
      } else {
        console.log(`✅ Count incremented to: ${updated.api_request_count}`);
        
        // Reset it back
        await supabase
          .from('users')
          .update({ api_request_count: testUser.api_request_count || 0 })
          .eq('id', testUser.id);
        console.log('✅ Count reset to original value');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking API usage:', error.message);
  }
}

checkApiUsageTracking();
