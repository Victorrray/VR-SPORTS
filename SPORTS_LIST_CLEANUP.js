// SPORTS_LIST_CLEANUP.js
// This file contains the changes needed to clean up the sports list in the VR-Odds platform

// ============================================================
// PROBLEM IDENTIFIED
// ============================================================
// The sports list currently includes championship winners and other sports that should be removed or condensed.
// In the screenshot, we can see:
// - CFL
// - NCAAF Championship Winner
// - NFL Super Bowl Winner
// - AFL
// - KBO
// - MiLB
// - MLB World Series Winner

// These championship winners and less popular leagues should be removed or condensed.

// ============================================================
// SOLUTION
// ============================================================
// 1. Update the fallback sports list in the server's /api/sports endpoint
// 2. Add a filter function to remove championship winners and other unwanted sports

// ============================================================
// SERVER-SIDE CHANGES (server/index.js)
// ============================================================

// Replace the fallback sports list (around line 1727) with:
const fallbackSports = [
  // Major US Sports
  { key: "americanfootball_nfl", title: "NFL", active: true, group: "Major US Sports" },
  { key: "americanfootball_ncaaf", title: "NCAAF", active: true, group: "Major US Sports" },
  { key: "basketball_nba", title: "NBA", active: true, group: "Major US Sports" },
  { key: "basketball_ncaab", title: "NCAAB", active: true, group: "Major US Sports" },
  { key: "baseball_mlb", title: "MLB", active: true, group: "Major US Sports" },
  { key: "icehockey_nhl", title: "NHL", active: true, group: "Major US Sports" },
  
  // Soccer
  { key: "soccer_epl", title: "EPL", active: true, group: "Soccer" },
  { key: "soccer_uefa_champs_league", title: "Champions League", active: true, group: "Soccer" },
  { key: "soccer_mls", title: "MLS", active: true, group: "Soccer" },
  
  // Combat Sports
  { key: "mma_mixed_martial_arts", title: "MMA", active: true, group: "Combat Sports" },
  { key: "boxing_boxing", title: "Boxing", active: true, group: "Combat Sports" }
];

// Add a filter function to the /api/sports endpoint (around line 1756):
// Filter out championship winners and other unwanted sports
const filterSportsList = (sportsList) => {
  // List of sports to exclude
  const excludedSports = [
    'americanfootball_ncaaf_championship_winner',
    'americanfootball_nfl_super_bowl_winner',
    'baseball_mlb_world_series_winner',
    'basketball_nba_championship_winner',
    'basketball_ncaab_championship_winner',
    'icehockey_nhl_championship_winner',
    'soccer_uefa_champs_league_winner',
    'soccer_epl_winner',
    'soccer_fifa_world_cup_winner',
    'soccer_uefa_europa_league_winner'
  ];
  
  // List of less popular leagues to exclude (optional)
  const lessPopularLeagues = [
    'australianrules_afl',
    'baseball_kbo',
    'baseball_npb',
    'baseball_mlb_preseason',
    'baseball_milb',
    'basketball_euroleague',
    'basketball_nba_preseason',
    'cricket_',
    'cricket_test_match',
    'rugbyleague_',
    'rugbyunion_'
  ];
  
  return sportsList.filter(sport => {
    // Exclude championship winners
    if (excludedSports.includes(sport.key)) {
      return false;
    }
    
    // Exclude less popular leagues
    if (lessPopularLeagues.some(league => sport.key.startsWith(league))) {
      return false;
    }
    
    return true;
  });
};

// Then modify the API response handling (around line 1757):
// For cached response:
if (cachedSports) {
  console.log('📦 Using cached sports list');
  return res.json(filterSportsList(cachedSports));
}

// For API response:
console.log('🌐 API call for sports list');
const url = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
const r = await axios.get(url);

// Cache for longer since sports list is stable
const filteredSports = filterSportsList(r.data);
setCachedResponse(cacheKey, filteredSports);
res.json(filteredSports);

// ============================================================
// CLIENT-SIDE CHANGES (SportsbookMarkets.js)
// ============================================================

// Update the fallback sports list in the client (around line 637):
setSportList([
  { key: 'americanfootball_nfl', title: 'NFL', group: "Major US Sports" },
  { key: 'americanfootball_ncaaf', title: 'NCAAF', group: "Major US Sports" },
  { key: 'basketball_nba', title: 'NBA', group: "Major US Sports" },
  { key: 'basketball_ncaab', title: 'NCAAB', group: "Major US Sports" },
  { key: 'icehockey_nhl', title: 'NHL', group: "Major US Sports" },
  { key: 'baseball_mlb', title: 'MLB', group: "Major US Sports" },
  { key: 'soccer_epl', title: 'EPL', group: "Soccer" },
  { key: 'soccer_uefa_champs_league', title: 'Champions League', group: "Soccer" },
  { key: 'mma_mixed_martial_arts', title: 'MMA', group: "Combat Sports" },
  { key: 'boxing_boxing', title: 'Boxing', group: "Combat Sports" }
]);
