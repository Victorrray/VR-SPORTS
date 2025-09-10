const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:10000';
const TEST_USER_ID = 'test-user-' + Date.now();

const endpoints = [
  { 
    method: 'GET',
    path: '/api/health',
    requiresAuth: false,
    params: {}
  },
  {
    method: 'GET',
    path: '/api/sports',
    requiresAuth: true,
    params: {}
  },
  {
    method: 'GET',
    path: '/api/odds',
    requiresAuth: true,
    params: {
      sports: 'americanfootball_nfl',
      regions: 'us',
      markets: 'h2h,spreads,totals'
    }
  },
  {
    method: 'GET',
    path: '/api/player-props',
    requiresAuth: true,
    params: {
      sport: 'americanfootball_nfl',
      eventId: '12345', // This will be replaced with a real event ID
      markets: 'player_pass_tds,player_rush_yds'
    }
  },
  {
    method: 'GET',
    path: '/api/scores',
    requiresAuth: false,
    params: {
      league: 'nfl'
    }
  }
];

async function testEndpoint({ method, path, requiresAuth, params }) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };

  if (requiresAuth) {
    headers['x-user-id'] = TEST_USER_ID;
  }

  try {
    console.log(`\n🔍 Testing ${method} ${path}...`);
    
    const response = await axios({
      method,
      url,
      headers,
      params,
      validateStatus: () => true // Don't throw on HTTP errors
    });

    const status = response.status;
    const isSuccess = status >= 200 && status < 300;
    
    console.log(`✅ ${method} ${path}: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Status: ${status} ${response.statusText}`);
    
    if (!isSuccess) {
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    }
    
    return isSuccess;
  } catch (error) {
    console.error(`❌ ${method} ${path} ERROR:`, error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting VR-Odds API Endpoint Tests\n');
  
  // First, get a real event ID from the scores endpoint
  try {
    const scoresResponse = await axios.get(`${BASE_URL}/api/scores`, {
      params: { league: 'nfl' }
    });
    
    if (scoresResponse.data && scoresResponse.data.length > 0) {
      const firstGame = scoresResponse.data[0];
      if (firstGame.id) {
        // Update the player-props test with a real event ID
        const playerPropsEndpoint = endpoints.find(ep => ep.path === '/api/player-props');
        if (playerPropsEndpoint) {
          playerPropsEndpoint.params.eventId = firstGame.id;
          console.log(`Using event ID ${firstGame.id} for player props test`);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch live scores to get event ID:', error.message);
  }
  
  // Test each endpoint
  const results = [];
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    results.push({ ...endpoint, success });
    await new Promise(resolve => setTimeout(resolve, 500)); // Add delay between requests
  }
  
  // Print summary
  console.log('\n📊 Test Results:');
  console.log('-----------------');
  results.forEach(({ method, path, success }) => {
    console.log(`${success ? '✅' : '❌'} ${method} ${path}`);
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`\n🎉 ${passed} of ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
}

runTests().catch(console.error);
