const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:10000';
const TEST_USER_ID = 'test-user-' + Date.now();

async function testEndpoint(name, config, expectedStatus = 200) {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    const response = await axios({
      ...config,
      headers: {
        'x-user-id': TEST_USER_ID,
        'Content-Type': 'application/json',
        ...config.headers,
      },
      validateStatus: () => true, // Don't throw on HTTP errors
    });

    const passed = response.status === expectedStatus;
    console.log(`✅ ${name}: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!passed) {
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    }
    
    return passed;
  } catch (error) {
    console.error(`❌ ${name} ERROR:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting VR-Odds API Tests\n');
  
  // Test 1: Health Check
  await testEndpoint('Health Check', {
    method: 'GET',
    url: `${BASE_URL}/api/health`,
  });

  // Test 2: Get Sports
  await testEndpoint('Get Sports', {
    method: 'GET',
    url: `${BASE_URL}/api/sports`,
  });

  // Test 3: Get Odds
  await testEndpoint('Get Odds (NFL)', {
    method: 'GET',
    url: `${BASE_URL}/api/odds`,
    params: {
      sports: 'americanfootball_nfl',
      regions: 'us',
      markets: 'h2h,spreads,totals'
    },
  });

  // Test 4: Get Player Props
  await testEndpoint('Get Player Props (NFL)', {
    method: 'GET',
    url: `${BASE_URL}/api/player-props`,
    params: {
      sport: 'americanfootball_nfl',
      regions: 'us',
      markets: 'player_pass_tds,player_rush_yds'
    },
  });

  // Test 5: Get Scores
  await testEndpoint('Get Scores (NFL)', {
    method: 'GET',
    url: `${BASE_URL}/api/scores`,
    params: {
      league: 'nfl',
    },
  });

  // Test 6: Get Usage
  await testEndpoint('Get Usage', {
    method: 'GET',
    url: `${BASE_URL}/api/usage/me`,
  });

  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
