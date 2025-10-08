// server/manual-cache-update.js
// Quick script to manually populate the cache

require('dotenv').config();
const oddsCacheService = require('./services/oddsCache');

async function manualUpdate() {
  console.log('🔄 Manually triggering NFL cache update...');
  
  // Initialize the service
  oddsCacheService.initialize(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Run a single update
    const result = await oddsCacheService.updateNFLOdds();
    console.log('✅ Update complete:', result);
    
    // Start auto-updates
    console.log('🏈 Starting auto-updates...');
    await oddsCacheService.startNFLUpdates();
    console.log('✅ Auto-updates started - will run every 60 seconds');
    console.log('⏰ Keep this script running or restart the main server');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

manualUpdate();
