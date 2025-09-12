const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  try {
    // Test basic connection
    console.log('Testing users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, plan')
      .limit(3);
    
    if (usersError) {
      console.log('⚠️ Users table issue:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log('Sample users:', users.map(u => ({ 
        id: u.id.slice(0,8) + '...', 
        plan: u.plan 
      })));
    }
    
    // Check profiles table
    console.log('Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, plan')
      .limit(3);
    
    if (profilesError) {
      console.log('⚠️ Profiles table issue:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('Sample profiles:', profiles.map(p => ({ 
        id: p.id.slice(0,8) + '...', 
        plan: p.plan 
      })));
    }
    
    // Test specific user
    console.log('Testing specific user: 54276b6c-5255-4117-be95-70c22132591c');
    const { data: specificUser, error: specificError } = await supabase
      .from('users')
      .select('*')
      .eq('id', '54276b6c-5255-4117-be95-70c22132591c')
      .single();
    
    if (specificError) {
      console.log('⚠️ Specific user error:', specificError.message);
    } else {
      console.log('✅ Found user:', {
        id: specificUser.id,
        plan: specificUser.plan,
        api_count: specificUser.api_request_count
      });
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
}

testConnection();
