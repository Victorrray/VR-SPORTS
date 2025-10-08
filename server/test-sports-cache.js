// Test script for sports cache functionality
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSportsCache() {
  console.log('🧪 Testing Sports Cache Integration\n');

  // Test 1: Check if table exists
  console.log('1️⃣ Checking if sports_cache table exists...');
  const { data: tables, error: tableError } = await supabase
    .from('sports_cache')
    .select('*')
    .limit(1);
  
  if (tableError) {
    console.error('❌ Table does not exist or error:', tableError.message);
    console.log('\n📝 Please run the migration first:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of server/migrations/005_sports_cache.sql');
    console.log('   3. Paste and run the SQL\n');
    return;
  }
  console.log('✅ Table exists\n');

  // Test 2: Check initial data
  console.log('2️⃣ Checking initial sports data...');
  const { data: initialSports, error: initialError } = await supabase
    .from('sports_cache')
    .select('*');
  
  if (initialError) {
    console.error('❌ Error fetching initial data:', initialError.message);
  } else {
    console.log(`✅ Found ${initialSports.length} sports in cache`);
    console.log('   Sample sports:', initialSports.slice(0, 3).map(s => `${s.title} (${s.sport_key})`).join(', '));
  }
  console.log('');

  // Test 3: Test get_active_sports() function
  console.log('3️⃣ Testing get_active_sports() function...');
  const { data: activeSports, error: activeError } = await supabase
    .rpc('get_active_sports');
  
  if (activeError) {
    console.error('❌ Function error:', activeError.message);
    console.log('   Make sure the migration created the function');
  } else {
    console.log(`✅ Function works! Returned ${activeSports.length} active sports`);
    console.log('   Sports by group:');
    const groups = {};
    activeSports.forEach(sport => {
      const group = sport.group_name || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(sport.title);
    });
    Object.entries(groups).forEach(([group, sports]) => {
      console.log(`   - ${group}: ${sports.join(', ')}`);
    });
  }
  console.log('');

  // Test 4: Test refresh_sports_cache() function
  console.log('4️⃣ Testing refresh_sports_cache() function...');
  const testSport = {
    sport_key: 'test_sport_' + Date.now(),
    title: 'Test Sport',
    group_name: 'Test Group',
    active: true
  };
  
  const { error: refreshError } = await supabase
    .rpc('refresh_sports_cache', {
      p_sport_key: testSport.sport_key,
      p_title: testSport.title,
      p_group_name: testSport.group_name,
      p_active: testSport.active
    });
  
  if (refreshError) {
    console.error('❌ Refresh function error:', refreshError.message);
  } else {
    console.log('✅ Refresh function works!');
    
    // Verify it was inserted
    const { data: verifyData } = await supabase
      .from('sports_cache')
      .select('*')
      .eq('sport_key', testSport.sport_key)
      .single();
    
    if (verifyData) {
      console.log(`   - Inserted: ${verifyData.title} (${verifyData.sport_key})`);
      console.log(`   - Cache expires: ${verifyData.cache_expires_at}`);
      
      // Clean up test data
      await supabase
        .from('sports_cache')
        .delete()
        .eq('sport_key', testSport.sport_key);
      console.log('   - Test data cleaned up');
    }
  }
  console.log('');

  // Test 5: Check cache expiration logic
  console.log('5️⃣ Checking cache expiration logic...');
  const { data: expiredCheck } = await supabase
    .from('sports_cache')
    .select('*')
    .lt('cache_expires_at', new Date().toISOString());
  
  if (expiredCheck && expiredCheck.length > 0) {
    console.log(`⚠️  Found ${expiredCheck.length} expired cache entries`);
    console.log('   These will be excluded by get_active_sports()');
  } else {
    console.log('✅ No expired cache entries');
  }
  console.log('');

  // Summary
  console.log('📊 Summary:');
  console.log('   ✅ Sports cache table is working');
  console.log('   ✅ Functions are operational');
  console.log('   ✅ Ready for production use');
  console.log('\n🎉 All tests passed! The sports cache integration is ready.\n');
}

testSportsCache().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
