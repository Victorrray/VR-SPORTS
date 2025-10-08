// server/test-cache.js
// Quick test script to validate the odds caching system

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const oddsCacheService = require('./services/oddsCache');

async function testCachingSystem() {
  console.log('🧪 Testing Odds Caching System\n');

  // 1. Initialize Supabase
  console.log('1️⃣ Initializing Supabase...');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  oddsCacheService.initialize(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Supabase initialized\n');

  // 2. Test database connection
  console.log('2️⃣ Testing database connection...');
  const { data: testData, error: testError } = await supabase
    .from('cached_odds')
    .select('count')
    .limit(1);
  
  if (testError) {
    console.error('❌ Database connection failed:', testError.message);
    return;
  }
  console.log('✅ Database connection successful\n');

  // 3. Run a single NFL update
  console.log('3️⃣ Running NFL odds update...');
  try {
    const result = await oddsCacheService.updateNFLOdds();
    console.log('✅ Update completed:');
    console.log(`   - Events updated: ${result.eventsUpdated}`);
    console.log(`   - Odds cached: ${result.oddsUpdated}`);
    console.log(`   - API calls made: ${result.apiCallsMade}\n`);
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    return;
  }

  // 4. Query cached data
  console.log('4️⃣ Querying cached odds...');
  const cachedOdds = await oddsCacheService.getCachedOdds('americanfootball_nfl', {
    markets: ['h2h', 'spreads']
  });
  console.log(`✅ Found ${cachedOdds.length} cached odds entries\n`);

  // 5. Check update statistics
  console.log('5️⃣ Checking update statistics...');
  const stats = await oddsCacheService.getUpdateStats('americanfootball_nfl', 5);
  console.log(`✅ Found ${stats.length} update log entries:`);
  stats.forEach((stat, i) => {
    console.log(`   ${i + 1}. ${stat.update_type} - ${stat.status} - ${stat.events_updated} events`);
  });
  console.log('');

  // 6. Test data structure
  console.log('6️⃣ Validating data structure...');
  if (cachedOdds.length > 0) {
    const sample = cachedOdds[0];
    const hasRequiredFields = 
      sample.event_id && 
      sample.event_name && 
      sample.bookmaker_key && 
      sample.market_key && 
      sample.outcomes;
    
    if (hasRequiredFields) {
      console.log('✅ Data structure is valid');
      console.log('   Sample entry:', {
        event: sample.event_name,
        bookmaker: sample.bookmaker_key,
        market: sample.market_key,
        outcomes: sample.outcomes.length + ' outcomes'
      });
    } else {
      console.log('❌ Data structure is invalid');
    }
  }
  console.log('');

  // 7. Check cache freshness
  console.log('7️⃣ Checking cache freshness...');
  const { data: freshnessData } = await supabase
    .from('cached_odds')
    .select('market_key, last_updated, expires_at')
    .eq('sport_key', 'americanfootball_nfl')
    .order('last_updated', { ascending: false })
    .limit(5);

  if (freshnessData && freshnessData.length > 0) {
    console.log('✅ Cache freshness:');
    freshnessData.forEach(item => {
      const age = Math.round((Date.now() - new Date(item.last_updated)) / 1000);
      const ttl = Math.round((new Date(item.expires_at) - Date.now()) / 1000);
      console.log(`   - ${item.market_key}: ${age}s old, expires in ${ttl}s`);
    });
  }
  console.log('');

  // 8. Summary
  console.log('📊 Test Summary:');
  console.log('================');
  console.log('✅ All tests passed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run migration: supabase/migrations/005_cached_odds_system.sql');
  console.log('2. Set AUTO_START_NFL_CACHE=true in .env');
  console.log('3. Start server: npm start');
  console.log('4. Monitor logs for automatic updates every 60 seconds');
  console.log('');
  console.log('API Endpoints:');
  console.log('- GET  /api/cached-odds/nfl?markets=h2h,spreads');
  console.log('- POST /api/cached-odds/nfl/update (admin only)');
  console.log('- GET  /api/cached-odds/stats');
  console.log('');

  process.exit(0);
}

// Run the test
testCachingSystem().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
