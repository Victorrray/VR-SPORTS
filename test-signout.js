// Test script to verify sign out functionality
const axios = require('axios');

async function testSignOut() {
  console.log('🧪 Testing sign out functionality...');
  
  try {
    // Test server logout endpoint
    const response = await axios.post('http://localhost:10000/api/logout', {}, {
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log('✅ Server logout endpoint response:', {
      status: response.status,
      data: response.data,
      headers: response.headers['set-cookie'] || 'No cookies set'
    });
    
    if (response.status === 200 && response.data?.ok) {
      console.log('✅ Server logout endpoint is working correctly');
    } else {
      console.log('❌ Server logout endpoint returned unexpected response');
    }
    
  } catch (error) {
    console.error('❌ Server logout test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 10000');
    }
  }
}

testSignOut();
