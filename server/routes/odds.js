/**
 * Odds Routes
 * Main odds endpoint and related functionality
 * This is the most complex route - handles game odds, player props, and caching
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireUser, checkPlanAccess, enforceUsage } = require('../middleware/auth');
const { 
  getCacheKey, getCachedResponse, setCachedResponse, clearCachedResponse, 
  getOddsInFlight, setOddsInFlight, deleteOddsInFlight,
  getCachedPlayerPropsResults, setCachedPlayerPropsResults, 
  isPlayerPropsRefreshing, setPlayerPropsRefreshing, getPlayerPropsCacheKey
} = require('../services/cache');
const {
  getBookmakersForPlan,
  transformCachedOddsToApiFormat,
  saveOddsToSupabase
} = require('../services/helpers');
const {
  API_KEY,
  ALTERNATE_MARKETS,
  ENABLE_PLAYER_PROPS_V2,
  PLAYER_PROPS_CACHE_TTL_MS,
  PLAYER_PROPS_REQUEST_TIMEOUT,
  DEFAULT_BOOK_STATE
} = require('../config/constants');

// All available markets from TheOddsAPI (for reference)
// Featured: h2h, spreads, totals, outrights, h2h_lay, outrights_lay
// Additional: alternate_spreads, alternate_totals, btts, draw_no_bet, h2h_3_way, team_totals, alternate_team_totals
// Game Period: h2h_q1-q4, h2h_h1-h2, h2h_p1-p3, h2h_1st_X_innings, spreads_*, totals_*, alternate_*, team_totals_*
// 3-Way Period: h2h_3_way_q1-q4, h2h_3_way_h1-h2, h2h_3_way_p1-p3, h2h_3_way_1st_X_innings

// Sport-specific market support from TheOddsAPI
const SPORT_MARKET_SUPPORT = {
  'americanfootball_nfl': [
    // Standard markets
    'h2h', 'spreads', 'totals', 
    'alternate_spreads', 'alternate_totals', 
    'team_totals', 'alternate_team_totals',
    // Quarter markets - 2-way
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    // Quarter markets - 3-way
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    // Half markets - 2-way
    'h2h_h1', 'h2h_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2',
    // Half markets - 3-way
    'h2h_3_way_h1', 'h2h_3_way_h2'
  ],
  'americanfootball_ncaaf': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Quarter markets - 2-way
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    // Quarter markets - 3-way
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    // Half markets - 2-way
    'h2h_h1', 'h2h_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2',
    // Half markets - 3-way
    'h2h_3_way_h1', 'h2h_3_way_h2'
  ],
  'basketball_nba': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Quarter markets - 2-way
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    // Quarter markets - 3-way
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    // Half markets - 2-way
    'h2h_h1', 'h2h_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2',
  ],
  'basketball_ncaab': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Quarter markets (if applicable)
    'h2h_h1', 'h2h_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2'
  ],
  'baseball_mlb': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Innings markets
    'h2h_1st_1_innings', 'h2h_1st_3_innings', 'h2h_1st_5_innings', 'h2h_1st_7_innings',
    'h2h_3_way_1st_1_innings', 'h2h_3_way_1st_3_innings', 'h2h_3_way_1st_5_innings', 'h2h_3_way_1st_7_innings',
    'spreads_1st_1_innings', 'spreads_1st_3_innings', 'spreads_1st_5_innings', 'spreads_1st_7_innings',
    'totals_1st_1_innings', 'totals_1st_3_innings', 'totals_1st_5_innings', 'totals_1st_7_innings',
    'alternate_spreads_1st_1_innings', 'alternate_spreads_1st_3_innings', 'alternate_spreads_1st_5_innings', 'alternate_spreads_1st_7_innings',
    'alternate_totals_1st_1_innings', 'alternate_totals_1st_3_innings', 'alternate_totals_1st_5_innings', 'alternate_totals_1st_7_innings'
  ],
  'icehockey_nhl': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Period markets
    'h2h_p1', 'h2h_p2', 'h2h_p3',
    'h2h_3_way_p1', 'h2h_3_way_p2', 'h2h_3_way_p3',
    'spreads_p1', 'spreads_p2', 'spreads_p3',
    'totals_p1', 'totals_p2', 'totals_p3',
    'alternate_spreads_p1', 'alternate_spreads_p2', 'alternate_spreads_p3',
    'alternate_totals_p1', 'alternate_totals_p2', 'alternate_totals_p3',
    'team_totals_p1', 'team_totals_p2', 'team_totals_p3',
    'alternate_team_totals_p1', 'alternate_team_totals_p2', 'alternate_team_totals_p3'
  ],
  // Soccer leagues - only basic markets supported
  // TheOddsAPI returns 422 error for btts, draw_no_bet, double_chance on most soccer leagues
  // Only h2h, spreads, totals are reliably supported
  'soccer_epl': ['h2h', 'spreads', 'totals'],
  'soccer_uefa_champs_league': ['h2h', 'spreads', 'totals'],
  'soccer_usa_mls': ['h2h', 'spreads', 'totals'],
  'soccer_spain_la_liga': ['h2h', 'spreads', 'totals'],
  'soccer_germany_bundesliga': ['h2h', 'spreads', 'totals'],
  'soccer_italy_serie_a': ['h2h', 'spreads', 'totals'],
  'soccer_france_ligue_one': ['h2h', 'spreads', 'totals'],
  'soccer_fifa_world_cup': ['h2h', 'spreads', 'totals'],
  'soccer_uefa_europa_league': ['h2h', 'spreads', 'totals'],
  'soccer_mexico_ligamx': ['h2h', 'spreads', 'totals'],
  'soccer_netherlands_eredivisie': ['h2h', 'spreads', 'totals'],
  'soccer_portugal_primeira_liga': ['h2h', 'spreads', 'totals'],
  'soccer_spl': ['h2h', 'spreads', 'totals'],
  'mma_mixed_martial_arts': ['h2h', 'spreads', 'totals', 'h2h_lay'],
  'boxing_boxing': ['h2h', 'spreads', 'totals', 'h2h_lay'],
  'golf_pga': ['outrights', 'outrights_lay'],
  'golf_masters': ['outrights', 'outrights_lay'],
  'golf_us_open': ['outrights', 'outrights_lay'],
  'golf_british_open': ['outrights', 'outrights_lay'],
  // Default for US sports (supports alternate markets)
  'default': [
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals'
  ],
  // Default for soccer (NO alternate markets - TheOddsAPI doesn't support them)
  'soccer_default': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance']
};

/**
 * Helper function to fetch player props data
 * Used for both initial fetch and background refresh
 */
async function fetchPlayerPropsData(sportsArray, playerPropMarkets, playerPropsMarketMap, oddsFormat, req) {
  console.log(`🎯 PLAYER PROPS FETCH START: ${sportsArray.length} sports, ${playerPropMarkets.length} markets requested`);
  
  const userProfile = req.__userProfile || { plan: 'free' };
  const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
  const bookmakerList = allowedBookmakers.join(',');
  
  const playerPropsResults = [];
  
  // Fetch all sports' events in parallel first
  const eventsPromises = sportsArray.map(async (sport) => {
    try {
      const eventsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events?apiKey=${API_KEY}`;
      const eventsResponse = await axios.get(eventsUrl, { timeout: 30000 });
      const events = eventsResponse.data || [];
      console.log(`🎯 EVENTS: ${sport} has ${events.length} events`);
      return events.map(e => ({ ...e, sport_key: sport }));
    } catch (err) {
      console.log(`❌ EVENTS ERROR: ${sport}: ${err.message}`);
      return [];
    }
  });
  
  const allEventsArrays = await Promise.all(eventsPromises);
  let allEvents = allEventsArrays.flat();
  
  // Filter out soccer events (no player props for soccer)
  // and limit to major US sports for faster loading
  const PLAYER_PROPS_SPORTS = ['americanfootball_nfl', 'basketball_nba', 'basketball_ncaab', 'icehockey_nhl'];
  allEvents = allEvents.filter(e => PLAYER_PROPS_SPORTS.includes(e.sport_key));
  
  // Limit total events to prevent timeout - prioritize by sport
  const MAX_EVENTS_FOR_PROPS = 30;
  if (allEvents.length > MAX_EVENTS_FOR_PROPS) {
    // Prioritize NFL, then NBA, then NHL, then NCAAB
    const sportPriority = { 'americanfootball_nfl': 1, 'basketball_nba': 2, 'icehockey_nhl': 3, 'basketball_ncaab': 4 };
    allEvents.sort((a, b) => (sportPriority[a.sport_key] || 99) - (sportPriority[b.sport_key] || 99));
    allEvents = allEvents.slice(0, MAX_EVENTS_FOR_PROPS);
    console.log(`🎯 PLAYER PROPS: Limited to ${MAX_EVENTS_FOR_PROPS} events (prioritized by sport)`);
  }
  
  console.log(`🎯 PLAYER PROPS FETCH: Processing ${allEvents.length} events across ${sportsArray.length} sports`);
  
  // Rate limiting config - balance speed vs rate limits
  const MAX_CONCURRENT = 5;
  const DELAY_BETWEEN_BATCHES_MS = 800;
  const playerPropsRegions = 'us,us2,us_dfs,us_ex,au';
  
  // DFS apps and sharp books
  const dfsBookmakersForProps = [
    'prizepicks', 'underdog', 'pick6', 'dabble_au', 'betr_us_dfs',
    'pinnacle', 'prophet_exchange', 'rebet', 'betopenly'
  ];
  const allPlayerPropsBookmakers = [...new Set([...bookmakerList.split(','), ...dfsBookmakersForProps])].join(',');
  
  for (let i = 0; i < allEvents.length; i += MAX_CONCURRENT) {
    const batch = allEvents.slice(i, i + MAX_CONCURRENT);
    const batchPromises = batch.map(event => 
      (async () => {
        try {
          const sportKey = event.sport_key;
          
          // Skip soccer player props
          if (sportKey?.startsWith('soccer_')) {
            return null;
          }
          
          const sportSpecificMarkets = playerPropsMarketMap[sportKey] || [];
          const marketsForThisEvent = playerPropMarkets.filter(m => sportSpecificMarkets.includes(m));
          
          if (marketsForThisEvent.length === 0) {
            return null;
          }
          
          const playerPropsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(event.sport_key)}/events/${event.id}/odds?apiKey=${API_KEY}&regions=${playerPropsRegions}&markets=${marketsForThisEvent.join(',')}&oddsFormat=${oddsFormat}&bookmakers=${allPlayerPropsBookmakers}&includeBetLimits=true`;
          
          const playerPropsResponse = await axios.get(playerPropsUrl, { timeout: 15000 });
          
          if (playerPropsResponse.data?.bookmakers?.length > 0) {
            const eventWithProps = {
              ...playerPropsResponse.data,
              bookmakers: playerPropsResponse.data.bookmakers
                .filter(bk => bk.markets && bk.markets.some(m => playerPropMarkets.includes(m.key)))
                .map(bk => ({
                  ...bk,
                  title: bk.title || bk.key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
                }))
            };
            
            if (eventWithProps.bookmakers.length > 0) {
              return eventWithProps;
            }
          }
          return null;
        } catch (eventErr) {
          console.log(`❌ PLAYER PROPS ERROR: ${event.sport_key} event ${event.id}: ${eventErr.message}`);
          return null;
        }
      })()
    );
    
    const batchResults = await Promise.all(batchPromises);
    playerPropsResults.push(...batchResults.filter(r => r !== null));
    
    // Delay between batches to avoid rate limiting
    if (i + MAX_CONCURRENT < allEvents.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    }
  }
  
  return playerPropsResults;
}

/**
 * Background refresh for player props (fire and forget)
 */
async function fetchPlayerPropsInBackground(cacheKey, sportsArray, playerPropMarkets, playerPropsMarketMap, oddsFormat, req) {
  console.log(`🔄 BACKGROUND REFRESH: Starting for ${sportsArray.length} sports`);
  const startTime = Date.now();
  
  try {
    const freshProps = await fetchPlayerPropsData(sportsArray, playerPropMarkets, playerPropsMarketMap, oddsFormat, req);
    
    if (freshProps.length > 0) {
      setCachedPlayerPropsResults(cacheKey, freshProps);
      console.log(`🔄 BACKGROUND REFRESH COMPLETE: Updated cache with ${freshProps.length} props in ${Date.now() - startTime}ms`);
    } else {
      console.log(`🔄 BACKGROUND REFRESH: No props found, keeping existing cache`);
    }
  } catch (err) {
    console.log(`❌ BACKGROUND REFRESH ERROR: ${err.message}`);
  }
}

/**
 * GET /api/odds
 * Main odds endpoint - returns game odds with optional player props
 */

router.get('/', requireUser, checkPlanAccess, async (req, res) => {
  try {
    const { sports, regions = "us,us2", markets = "h2h,spreads,totals", oddsFormat = "american", date, betType } = req.query;
    
    if (!sports) return res.status(400).json({ error: "Missing sports parameter" });
    if (!API_KEY) {
      return res.status(500).json({ 
        error: "ODDS_API_KEY not configured", 
        message: "Please configure ODDS_API_KEY environment variable" 
      });
    }
    
    const sportsArray = sports.split(',');
    let marketsArray = markets.split(',');
    let allGames = [];
    
    console.log(`🏟️ Odds API Request: sports=${sportsArray.length} sports: [${sportsArray.join(', ')}]`);
    const hasNHL = sportsArray.includes('icehockey_nhl');
    if (hasNHL) {
      console.log(`🏒 NHL is in the request - will track processing`);
    }
    
    // Define DFS apps list at top level for use throughout the function
    // Use correct API keys: betr_us_dfs (not betr), pick6 (not draftkings_pick6)
    const dfsApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'betr_us_dfs'];
    
    // Map sports to their player props markets (using TheOddsAPI market names)
    // Reference: https://the-odds-api.com/sports-odds-data/betting-markets.html
    // This is defined outside the betType check so we always have access to player props markets
    const playerPropsMarketMap = {
        'americanfootball_nfl': [
          // Standard props
          'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts', 'player_pass_interceptions',
          'player_pass_longest_completion', 'player_pass_rush_yds', 'player_pass_rush_reception_tds', 'player_pass_rush_reception_yds',
          'player_pass_yds_q1',
          'player_rush_yds', 'player_rush_tds', 'player_rush_attempts', 'player_rush_longest',
          'player_rush_reception_tds', 'player_rush_reception_yds',
          'player_receptions', 'player_reception_yds', 'player_reception_tds', 'player_reception_longest',
          'player_anytime_td', 'player_1st_td', 'player_last_td', 'player_tds_over',
          'player_assists', 'player_defensive_interceptions', 'player_field_goals', 'player_kicking_points',
          'player_pats', 'player_sacks', 'player_solo_tackles', 'player_tackles_assists',
          // Alternate props
          'player_assists_alternate', 'player_field_goals_alternate', 'player_kicking_points_alternate',
          'player_pass_attempts_alternate', 'player_pass_completions_alternate', 'player_pass_interceptions_alternate',
          'player_pass_longest_completion_alternate', 'player_pass_rush_yds_alternate',
          'player_pass_rush_reception_tds_alternate', 'player_pass_rush_reception_yds_alternate',
          'player_pass_tds_alternate', 'player_pass_yds_alternate', 'player_pats_alternate',
          'player_receptions_alternate', 'player_reception_longest_alternate', 'player_reception_tds_alternate', 'player_reception_yds_alternate',
          'player_rush_attempts_alternate', 'player_rush_longest_alternate', 'player_rush_reception_tds_alternate', 'player_rush_reception_yds_alternate',
          'player_rush_tds_alternate', 'player_rush_yds_alternate',
          'player_sacks_alternate', 'player_solo_tackles_alternate', 'player_tackles_assists_alternate'
        ],
        'americanfootball_ncaaf': [
          // Standard props
          'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts', 'player_pass_interceptions',
          'player_pass_longest_completion', 'player_pass_rush_yds', 'player_pass_rush_reception_tds', 'player_pass_rush_reception_yds',
          'player_rush_yds', 'player_rush_tds', 'player_rush_attempts', 'player_rush_longest',
          'player_rush_reception_tds', 'player_rush_reception_yds',
          'player_receptions', 'player_reception_yds', 'player_reception_tds', 'player_reception_longest',
          'player_anytime_td', 'player_1st_td', 'player_last_td', 'player_tds_over',
          'player_assists', 'player_defensive_interceptions', 'player_field_goals', 'player_kicking_points',
          'player_pats', 'player_sacks', 'player_solo_tackles', 'player_tackles_assists',
          // Alternate props (same as NFL)
          'player_assists_alternate', 'player_field_goals_alternate', 'player_kicking_points_alternate',
          'player_pass_attempts_alternate', 'player_pass_completions_alternate', 'player_pass_interceptions_alternate',
          'player_pass_longest_completion_alternate', 'player_pass_rush_yds_alternate',
          'player_pass_rush_reception_tds_alternate', 'player_pass_rush_reception_yds_alternate',
          'player_pass_tds_alternate', 'player_pass_yds_alternate', 'player_pats_alternate',
          'player_receptions_alternate', 'player_reception_longest_alternate', 'player_reception_tds_alternate', 'player_reception_yds_alternate',
          'player_rush_attempts_alternate', 'player_rush_longest_alternate', 'player_rush_reception_tds_alternate', 'player_rush_reception_yds_alternate',
          'player_rush_tds_alternate', 'player_rush_yds_alternate',
          'player_sacks_alternate', 'player_solo_tackles_alternate', 'player_tackles_assists_alternate'
        ],
        'americanfootball_cfl': [
          // CFL uses same markets as NFL/NCAAF
          'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts', 'player_pass_interceptions',
          'player_rush_yds', 'player_rush_tds', 'player_rush_attempts',
          'player_receptions', 'player_reception_yds', 'player_reception_tds',
          'player_anytime_td', 'player_1st_td', 'player_last_td'
        ],
        'basketball_nba': [
          // Standard props
          'player_points', 'player_points_q1', 'player_rebounds', 'player_rebounds_q1',
          'player_assists', 'player_assists_q1', 'player_threes',
          'player_steals', 'player_blocks', 'player_blocks_steals', 'player_turnovers',
          'player_points_rebounds_assists', 'player_points_rebounds', 'player_points_assists', 'player_rebounds_assists',
          'player_field_goals', 'player_frees_made', 'player_frees_attempts',
          'player_first_basket', 'player_first_team_basket', 'player_double_double', 'player_triple_double',
          'player_method_of_first_basket',
          // Alternate props
          'player_points_alternate', 'player_rebounds_alternate', 'player_assists_alternate',
          'player_blocks_alternate', 'player_steals_alternate', 'player_turnovers_alternate', 'player_threes_alternate',
          'player_points_assists_alternate', 'player_points_rebounds_alternate', 'player_rebounds_assists_alternate',
          'player_points_rebounds_assists_alternate'
        ],
        'basketball_ncaab': [
          'player_points', 'player_rebounds', 'player_assists', 'player_threes',
          'player_steals', 'player_blocks', 'player_turnovers',
          'player_points_rebounds_assists', 'player_points_rebounds', 'player_points_assists', 'player_rebounds_assists',
          'player_double_double',
          // Alternate props (same as NBA)
          'player_points_alternate', 'player_rebounds_alternate', 'player_assists_alternate',
          'player_blocks_alternate', 'player_steals_alternate', 'player_turnovers_alternate', 'player_threes_alternate',
          'player_points_assists_alternate', 'player_points_rebounds_alternate', 'player_rebounds_assists_alternate',
          'player_points_rebounds_assists_alternate'
        ],
        // WNBA - Offseason (May-October typically)
        // 'basketball_wnba': [
        //   'player_points', 'player_rebounds', 'player_assists', 'player_threes',
        //   'player_steals', 'player_blocks', 'player_turnovers',
        //   'player_points_rebounds_assists', 'player_points_rebounds', 'player_points_assists', 'player_rebounds_assists',
        //   'player_double_double', 'player_triple_double',
        //   'player_points_alternate', 'player_rebounds_alternate', 'player_assists_alternate',
        //   'player_blocks_alternate', 'player_steals_alternate', 'player_turnovers_alternate', 'player_threes_alternate',
        //   'player_points_assists_alternate', 'player_points_rebounds_alternate', 'player_rebounds_assists_alternate',
        //   'player_points_rebounds_assists_alternate'
        // ],
        'baseball_mlb': [
          // Batter props
          'batter_home_runs', 'batter_first_home_run', 'batter_hits', 'batter_total_bases',
          'batter_rbis', 'batter_runs_scored', 'batter_hits_runs_rbis',
          'batter_singles', 'batter_doubles', 'batter_triples',
          'batter_walks', 'batter_strikeouts', 'batter_stolen_bases',
          // Pitcher props
          'pitcher_strikeouts', 'pitcher_record_a_win', 'pitcher_hits_allowed',
          'pitcher_walks', 'pitcher_earned_runs', 'pitcher_outs',
          // Alternate batter props
          'batter_total_bases_alternate', 'batter_home_runs_alternate', 'batter_hits_alternate',
          'batter_rbis_alternate', 'batter_walks_alternate', 'batter_strikeouts_alternate',
          'batter_runs_scored_alternate', 'batter_singles_alternate', 'batter_doubles_alternate', 'batter_triples_alternate',
          // Alternate pitcher props
          'pitcher_hits_allowed_alternate', 'pitcher_walks_alternate', 'pitcher_strikeouts_alternate'
        ],
        'icehockey_nhl': [
          // Standard props
          'player_points', 'player_power_play_points', 'player_assists',
          'player_blocked_shots', 'player_shots_on_goal', 'player_goals', 'player_total_saves',
          'player_goal_scorer_first', 'player_goal_scorer_last', 'player_goal_scorer_anytime',
          // Alternate props
          'player_points_alternate', 'player_assists_alternate', 'player_power_play_points_alternate',
          'player_goals_alternate', 'player_shots_on_goal_alternate', 'player_blocked_shots_alternate',
          'player_total_saves_alternate'
        ],
        // Soccer leagues - Player props only (no game markets)
        'soccer_epl': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_uefa_champs_league': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_usa_mls': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_spain_la_liga': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_germany_bundesliga': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_italy_serie_a': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_france_ligue_one': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        // AFL
        'aussierules_afl': [
          'player_disposals', 'player_disposals_over',
          'player_goal_scorer_first', 'player_goal_scorer_last', 'player_goal_scorer_anytime',
          'player_goals_scored_over', 'player_marks_over', 'player_marks_most',
          'player_tackles_over', 'player_tackles_most',
          'player_afl_fantasy_points', 'player_afl_fantasy_points_over', 'player_afl_fantasy_points_most'
        ],
        // Rugby League (NRL)
        'rugbyleague_nrl': [
          'player_try_scorer_first', 'player_try_scorer_last', 'player_try_scorer_anytime', 'player_try_scorer_over'
        ]
      };
    
    // Default soccer player props markets (for any soccer league not explicitly defined)
    const defaultSoccerPlayerProps = [
      'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
      'player_to_receive_card', 'player_to_receive_red_card',
      'player_shots_on_target', 'player_shots', 'player_assists'
    ];
    
    // Get player props markets for requested sports (always, not just for betType === 'props')
    const playerPropsMarkets = [];
    sportsArray.forEach(sport => {
      if (playerPropsMarketMap[sport]) {
        playerPropsMarkets.push(...playerPropsMarketMap[sport]);
      } else if (sport.startsWith('soccer_')) {
        // Use default soccer player props for any soccer league
        playerPropsMarkets.push(...defaultSoccerPlayerProps);
      }
    });
    
    // Only include player props markets when betType is 'props'
    // For straight bets (betType='straight' or no betType), only fetch regular markets
    const isPlayerPropsRequest = betType === 'props';
    const allMarketsToFetch = isPlayerPropsRequest 
      ? [...new Set([...marketsArray, ...playerPropsMarkets])]
      : marketsArray.filter(m => !m.includes('player_') && !m.includes('batter_') && !m.includes('pitcher_'));
    
    console.log(`📊 Odds API: betType=${betType}, isPlayerPropsRequest=${isPlayerPropsRequest}, marketsToFetch=${allMarketsToFetch.length}`);
    
    // Separate player props from regular markets
    const regularMarkets = marketsArray.filter(m => !m.includes('player_') && !m.includes('batter_') && !m.includes('pitcher_'));
    const playerPropMarkets = isPlayerPropsRequest ? playerPropsMarkets : [];
    
    // Helper to get supported markets for a sport (use soccer_default for unlisted soccer leagues)
    const getSupportedMarketsForSport = (sport) => {
      if (SPORT_MARKET_SUPPORT[sport]) {
        return SPORT_MARKET_SUPPORT[sport];
      }
      // Use soccer_default for any soccer league not explicitly listed
      if (sport.startsWith('soccer_')) {
        return SPORT_MARKET_SUPPORT['soccer_default'];
      }
      return SPORT_MARKET_SUPPORT['default'];
    };
    
    // Filter markets based on sport support
    const filteredRegularMarkets = regularMarkets.filter(m => {
      return sportsArray.some(sport => {
        const supportedForSport = getSupportedMarketsForSport(sport);
        return supportedForSport.includes(m);
      });
    });
    
    console.log(`📊 MARKETS DEBUG: Requested ${regularMarkets.length} markets, filtered to ${filteredRegularMarkets.length} supported markets`);
    console.log(`📊 MARKETS DEBUG: Filtered markets:`, filteredRegularMarkets);
    
    // Separate quarter/half/period markets from base markets
    // IMPORTANT: Use regex patterns to avoid false positives like h2h_3_way matching _3_
    const isPeriodMarket = (market) => {
      // Quarter markets: _q1, _q2, _q3, _q4
      if (/_q[1-4]/.test(market)) return true;
      // Half markets: _h1, _h2
      if (/_h[12]$/.test(market)) return true;
      // Period markets (hockey): _p1, _p2, _p3
      if (/_p[1-3]$/.test(market)) return true;
      // Innings markets: _1st_1_innings, _1st_3_innings, etc.
      if (/_1st_\d+_innings/.test(market)) return true;
      return false;
    };
    
    // CRITICAL: The main /v4/sports/{sport}/odds endpoint ONLY supports h2h, spreads, totals
    // All other markets (alternate_*, team_totals, period markets) require per-event endpoint
    const MAIN_ENDPOINT_MARKETS = ['h2h', 'spreads', 'totals'];
    const isAlternateMarket = (market) => {
      return market.startsWith('alternate_') || market === 'team_totals' || market === 'alternate_team_totals';
    };
    
    // Split markets into: main endpoint markets, alternate markets (per-event), period markets (per-event)
    const mainEndpointMarkets = filteredRegularMarkets.filter(m => MAIN_ENDPOINT_MARKETS.includes(m));
    const alternateMarkets = filteredRegularMarkets.filter(m => isAlternateMarket(m) && !isPeriodMarket(m));
    const quarterMarkets = filteredRegularMarkets.filter(m => isPeriodMarket(m));
    
    // baseMarkets is now only the 3 featured markets for the main endpoint
    const baseMarkets = mainEndpointMarkets;
    
    console.log(`📊 MARKETS DEBUG: Main endpoint markets (${baseMarkets.length}):`, baseMarkets);
    console.log(`📊 MARKETS DEBUG: Alternate markets for per-event (${alternateMarkets.length}):`, alternateMarkets);
    console.log(`📊 MARKETS DEBUG: Period markets for per-event (${quarterMarkets.length}):`, quarterMarkets);
    
    // Step 1: Fetch base odds (NEVER include player props here - they must be fetched via per-event endpoint in Step 3)
    // The main /sports/{sport}/odds endpoint only supports h2h, spreads, totals - NOT player props
    if (baseMarkets.length > 0) {
      // Only use base markets (h2h, spreads, totals) - player props are fetched separately in Step 3
      const marketsToFetch = baseMarkets;
      const supabase = req.app.locals.supabase;
      const oddsCacheService = req.app.locals.oddsCacheService;
      
      for (const sport of sportsArray) {
        try {
          const userProfile = req.__userProfile || { plan: 'free' };
          const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
          
          // For game odds, filter out DFS apps (they only have player props)
          const gameOddsBookmakers = allowedBookmakers.filter(book => !dfsApps.includes(book));
          const bookmakerList = gameOddsBookmakers.join(',');
          
          // IMPORTANT: Filter markets to only those supported by this specific sport
          // This prevents 422 errors from sending wrong markets to sports that don't support them
          const sportSupportedMarkets = getSupportedMarketsForSport(sport);
          
          // For Step 1, we only have base markets (h2h, spreads, totals) - no player props
          const marketsForThisSport = marketsToFetch.filter(m => sportSupportedMarkets.includes(m));
          
          if (marketsForThisSport.length === 0) {
            console.log(`⚠️ No supported markets for ${sport}, skipping`);
            continue;
          }
          
          // Check Supabase cache first (but skip if player props are requested - they need fresh data)
          let supabaseCachedData = null;
          const hasPlayerProps = playerPropMarkets.length > 0;
          
          if (supabase && oddsCacheService && !hasPlayerProps) {
            try {
              const cachedOdds = await oddsCacheService.getCachedOdds(sport, {
                markets: marketsToFetch
              });
              
              if (cachedOdds && cachedOdds.length > 0) {
                supabaseCachedData = transformCachedOddsToApiFormat(cachedOdds);
              }
            } catch (cacheErr) {
              // Silently skip cache errors
            }
          }
          
          // Use Supabase cache if available
          if (supabaseCachedData && supabaseCachedData.length > 0) {
            console.log(`📦 Using Supabase cache for ${sport}: ${supabaseCachedData.length} games`);
            // Verify the cached data has the correct sport_key
            const validCachedData = supabaseCachedData.filter(game => game.sport_key === sport);
            
            // Also filter out past games from cache
            const now = new Date();
            const futureGames = validCachedData.filter(game => {
              if (!game.commence_time) return false;
              const gameTime = new Date(game.commence_time);
              return gameTime > now;
            });
            
            if (futureGames.length > 0) {
              console.log(`📦 ${sport}: ${futureGames.length} future games from cache (${validCachedData.length - futureGames.length} past games filtered)`);
              allGames.push(...futureGames);
              continue;
            }
            // If all cached games are past, fall through to API call
            console.log(`⚠️ ${sport}: All ${validCachedData.length} cached games are past, fetching fresh data`);
          }
          
          // Make API call - use marketsForThisSport to only request supported markets
          const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${marketsForThisSport.join(',')}&bookmakers=${bookmakerList}&oddsFormat=${oddsFormat}&includeBetLimits=true&includeLinks=true&includeSids=true`;
          
          // Split markets for optimized caching
          const regularMarketsData = marketsForThisSport.filter(market => !ALTERNATE_MARKETS.includes(market));
          const alternateMarketsData = marketsForThisSport.filter(market => ALTERNATE_MARKETS.includes(market));
          
          const needsRegularMarkets = regularMarketsData.length > 0;
          const needsAlternateMarkets = alternateMarketsData.length > 0;
          
          const regularCacheKey = needsRegularMarkets ? 
            getCacheKey('odds', { sport, regions, markets: regularMarketsData }) : null;
          const alternateCacheKey = needsAlternateMarkets ? 
            getCacheKey('odds_alternate', { sport, regions, markets: alternateMarketsData }) : null;
          
          const cachedRegularData = needsRegularMarkets ? getCachedResponse(regularCacheKey) : null;
          const cachedAlternateData = needsAlternateMarkets ? getCachedResponse(alternateCacheKey) : null;
          
          const canUseAllCached = 
            (!needsRegularMarkets || cachedRegularData) && 
            (!needsAlternateMarkets || cachedAlternateData);
          
          const cacheKey = getCacheKey('odds', { sport, regions, markets: marketsForThisSport });
          const cachedData = getCachedResponse(cacheKey);
          
          let responseData;
          
          // Check for forceRefresh parameter to bypass cache
          const forceRefresh = req.query.forceRefresh === 'true';
          
          if (canUseAllCached && !forceRefresh) {
            // Use cached data directly - the cache key already includes sport
            // so we don't need to filter by sport_key again
            responseData = cachedData || [];
            if (!cachedData && cachedRegularData) {
              responseData = [...cachedRegularData];
            }
            if (!cachedData && cachedAlternateData) {
              responseData = [...responseData, ...cachedAlternateData];
            }
            
            // Filter out past games from cached data (cache may contain games that have since started)
            const cacheNow = new Date();
            const beforeCacheFilter = responseData.length;
            responseData = responseData.filter(game => {
              if (!game.commence_time) return false;
              const gameTime = new Date(game.commence_time);
              return gameTime > cacheNow;
            });
            console.log(`📦 Using in-memory cache for ${sport}: ${responseData.length} games (filtered ${beforeCacheFilter - responseData.length} past games)`);
            if (sport === 'icehockey_nhl') {
              console.log(`🏒 NHL in-memory cache: ${beforeCacheFilter} total, ${responseData.length} future games`);
            }
            
            // If all cached games were past, invalidate cache and fetch fresh data
            if (responseData.length === 0 && beforeCacheFilter > 0) {
              console.log(`🔄 All cached games were past for ${sport}, fetching fresh data...`);
              if (sport === 'icehockey_nhl') {
                console.log(`🏒 NHL: All cached games expired, will fetch fresh from API`);
              }
              // Clear the stale cache entries
              if (regularCacheKey) clearCachedResponse(regularCacheKey);
              if (alternateCacheKey) clearCachedResponse(alternateCacheKey);
              if (cacheKey) clearCachedResponse(cacheKey);
              // Fall through to fetch fresh data
            }
          }
          
          // If cache was empty or all games were past, fetch fresh data
          if (!responseData || responseData.length === 0) {
            // Check if there's already an in-flight request for this exact data
            const inFlightPromise = getOddsInFlight(cacheKey);
            if (inFlightPromise) {
              console.log(`⏳ Waiting for in-flight request: ${cacheKey.substring(0, 80)}...`);
              try {
                responseData = await inFlightPromise;
              } catch (err) {
                // If the in-flight request failed, we'll make our own request below
                responseData = null;
              }
            }
            
            // If no in-flight or it failed, make the request
            if (!responseData) {
              const fetchPromise = (async () => {
                const response = await axios.get(url);
                return response.data;
              })();
              
              // Register this request as in-flight
              setOddsInFlight(cacheKey, fetchPromise);
              
              try {
                responseData = await fetchPromise;
                
                // Cache the data
                if (needsRegularMarkets && needsAlternateMarkets) {
                  const regularData = responseData.map(game => ({
                    ...game,
                    bookmakers: game.bookmakers.map(bookmaker => ({
                      ...bookmaker,
                      markets: bookmaker.markets.filter(market => !ALTERNATE_MARKETS.includes(market.key))
                    })).filter(bookmaker => bookmaker.markets.length > 0)
                  })).filter(game => game.bookmakers.length > 0);
                  
                  const alternateData = responseData.map(game => ({
                    ...game,
                    bookmakers: game.bookmakers.map(bookmaker => ({
                      ...bookmaker,
                      markets: bookmaker.markets.filter(market => ALTERNATE_MARKETS.includes(market.key))
                    })).filter(bookmaker => bookmaker.markets.length > 0)
                  })).filter(game => game.bookmakers.length > 0);
                  
                  if (regularData.length > 0) {
                    setCachedResponse(regularCacheKey, regularData);
                  }
                  if (alternateData.length > 0) {
                    setCachedResponse(alternateCacheKey, alternateData);
                  }
                  setCachedResponse(cacheKey, responseData);
                } else {
                  setCachedResponse(cacheKey, responseData);
                }
                
                // Save to Supabase
                if (supabase && oddsCacheService && responseData && responseData.length > 0) {
                  try {
                    await saveOddsToSupabase(responseData, sport, supabase);
                  } catch (supabaseSaveErr) {
                    // Silently skip cache errors
                  }
                }
              } finally {
                // Always clean up in-flight tracking
                deleteOddsInFlight(cacheKey);
              }
            }
          }
          
          const sportGames = responseData || [];
          console.log(`🏈 Sport ${sport}: ${sportGames.length} games fetched`);
          
          // Log when any sport returns 0 games
          if (sportGames.length === 0) {
            console.log(`⚠️ ${sport}: No games returned - may be no games scheduled or all games started`);
          }
          
          if (sport === 'icehockey_nhl') {
            console.log(`🏒 NHL Debug: ${sportGames.length} games from API/cache`);
            if (sportGames.length > 0) {
              console.log(`🏒 NHL first game: ${sportGames[0]?.away_team} @ ${sportGames[0]?.home_team}, commence: ${sportGames[0]?.commence_time}`);
            } else {
              console.log(`🏒 NHL: No games returned from API - check if games are scheduled today`);
            }
            console.log(`🏒 NHL allGames before push: ${allGames.length}`);
          }
          allGames.push(...sportGames);
          if (sport === 'icehockey_nhl') {
            console.log(`🏒 NHL allGames after push: ${allGames.length}`);
          }
        } catch (sportErr) {
          console.error(`❌ Error fetching ${sport}:`, sportErr.message);
          if (sport === 'icehockey_nhl') {
            console.error(`🏒 NHL Error details:`, sportErr.response?.data || sportErr.message);
          }
        }
      }
      
      // Filter bookmakers based on user plan
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      // Count Fliff before filtering
      let fliffCountBefore = 0;
      allGames.forEach(game => {
        if (game.bookmakers) {
          fliffCountBefore += game.bookmakers.filter(b => b.key === 'fliff').length;
        }
      });
      
      // Only filter game odds bookmakers, not player props
      allGames.forEach(game => {
        if (game.bookmakers) {
          game.bookmakers = game.bookmakers.filter(bookmaker => {
            // Always include DFS apps (they have player props)
            if (dfsApps.includes(bookmaker.key)) {
              return true;
            }
            // For traditional bookmakers, check if they're in the allowed list
            return allowedBookmakers.includes(bookmaker.key);
          });
        }
      });
      
      // Count Fliff after filtering
      let fliffCountAfter = 0;
      allGames.forEach(game => {
        if (game.bookmakers) {
          fliffCountAfter += game.bookmakers.filter(b => b.key === 'fliff').length;
        }
      });
    }
    
    // Filter out games that have already started (past games)
    const now = new Date();
    const beforeFilter = allGames.length;
    
    // Debug: Count NHL games before filter
    const nhlGamesBefore = allGames.filter(g => g.sport_key === 'icehockey_nhl').length;
    if (nhlGamesBefore > 0) {
      console.log(`🏒 NHL games before past-game filter: ${nhlGamesBefore}`);
    }
    
    allGames = allGames.filter((game) => {
      if (!game.commence_time) return false;
      const gameTime = new Date(game.commence_time);
      return gameTime > now; // Only include future games
    });
    
    // CRITICAL: Filter out ALL 3-way markets from non-soccer sports
    // 3-way markets (h2h_3_way) only make sense for soccer (Win/Draw/Loss)
    // NBA/NFL/NHL games can't end in ties, so 3-way markets are misleading
    allGames.forEach(game => {
      const isSoccer = game.sport_key?.startsWith('soccer_');
      if (!isSoccer && game.bookmakers) {
        game.bookmakers.forEach(bookmaker => {
          if (bookmaker.markets) {
            // Filter out any market containing "3_way" or "3-way"
            bookmaker.markets = bookmaker.markets.filter(market => {
              const key = market.key || '';
              return !key.includes('3_way') && !key.includes('3-way');
            });
            // Also strip "(3-Way)" from outcome names
            bookmaker.markets.forEach(market => {
              if (market.outcomes) {
                market.outcomes.forEach(outcome => {
                  if (outcome.name) {
                    outcome.name = outcome.name.replace(/\s*\(3-Way\)\s*/gi, '');
                  }
                });
              }
            });
          }
        });
      }
    });
    
    // Debug: Count NHL games after filter
    const nhlGamesAfter = allGames.filter(g => g.sport_key === 'icehockey_nhl').length;
    if (nhlGamesBefore > 0 || nhlGamesAfter > 0) {
      console.log(`🏒 NHL games after past-game filter: ${nhlGamesAfter} (was ${nhlGamesBefore})`);
    }
    
    // If a specific date is requested, filter to only games on that date
    // NOTE: We DON'T filter by date on the backend anymore - let the frontend handle it
    // This is because the frontend knows the user's timezone, but the backend uses UTC
    // The frontend will filter by date in the user's local timezone
    // if (date && date !== 'all_upcoming' && date !== 'all') {
    //   const beforeDateFilter = allGames.length;
    //   // Parse the date string (YYYY-MM-DD format)
    //   const [year, month, day] = date.split('-').map(Number);
    //   const filterDate = new Date(year, month - 1, day);
    //   const nextDay = new Date(filterDate);
    //   nextDay.setDate(nextDay.getDate() + 1);
    //   
    //   allGames = allGames.filter((game) => {
    //     if (!game.commence_time) return false;
    //     const gameTime = new Date(game.commence_time);
    //     // Check if game is on the specified date (between start of day and start of next day)
    //     return gameTime >= filterDate && gameTime < nextDay;
    //   });
    // }
    

    // Step 2: Fetch alternate and period markets via per-event endpoint
    // NOTE: These markets require /events/{eventId}/odds endpoint (one call per game)
    // Combine alternate markets + period markets for a single per-event call
    const perEventMarkets = [...alternateMarkets, ...quarterMarkets];
    console.log(`🏈 PER-EVENT MARKETS CHECK: ${perEventMarkets.length} markets = [${perEventMarkets.slice(0, 5).join(', ')}${perEventMarkets.length > 5 ? '...' : ''}]`);
    if (perEventMarkets.length > 0) {
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      // For game odds, filter out DFS apps (they only have player props)
      const gameOddsBookmakers = allowedBookmakers.filter(book => !dfsApps.includes(book));
      const bookmakerList = gameOddsBookmakers.join(',');
      
      // OPTIMIZATION: Only fetch period markets for games starting within 24 hours
      const MAX_GAMES_FOR_PERIOD_MARKETS = 10; // Limit to 10 games per sport to reduce API calls
      const PERIOD_MARKET_CACHE_MS = 6 * 60 * 60 * 1000; // 6 hour cache for period markets
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      
      for (const sport of sportsArray) {
        try {
          // OPTIMIZATION: Only fetch period markets for games starting within 48 hours (expanded from 24h)
          const now = Date.now();
          const allSportGames = allGames.filter(g => g.sport_key === sport);
          console.log(`🏈 PERIOD MARKETS: ${sport} has ${allSportGames.length} total games`);
          
          // Expanded to 7 days (168 hours) to catch NFL games scheduled for the weekend
          const PERIOD_MARKET_WINDOW_HOURS = 168; // 7 days
          const sportGames = allSportGames
            .filter(g => {
              const gameTime = new Date(g.commence_time).getTime();
              const hoursUntilGame = (gameTime - now) / (1000 * 60 * 60);
              return hoursUntilGame > 0 && hoursUntilGame <= PERIOD_MARKET_WINDOW_HOURS;
            })
            .slice(0, MAX_GAMES_FOR_PERIOD_MARKETS);
          
          if (sportGames.length === 0) {
            console.log(`🏈 PERIOD MARKETS: No games within ${PERIOD_MARKET_WINDOW_HOURS}h for ${sport}, skipping period market fetch`);
            continue;
          }
          
          console.log(`🏈 PER-EVENT MARKETS: Fetching for ${sportGames.length} games in ${sport} (${perEventMarkets.length} markets)`);
          // Fetch alternate + period markets for each game individually
          for (const game of sportGames) {
            try {
              const eventId = game.id;
              const cacheKey = `per_event_markets_${sport}_${eventId}`;
              
              // Check cache first (getCachedResponse is synchronous)
              const cached = getCachedResponse(cacheKey);
              if (cached) {
                // Merge cached data
                if (cached.bookmakers) {
                  cached.bookmakers.forEach(cBookmaker => {
                    const existingBookmaker = game.bookmakers.find(b => b.key === cBookmaker.key);
                    if (existingBookmaker && cBookmaker.markets) {
                      const existingMarketKeys = existingBookmaker.markets.map(m => m.key);
                      cBookmaker.markets.forEach(cMarket => {
                        if (!existingMarketKeys.includes(cMarket.key)) {
                          existingBookmaker.markets.push(cMarket);
                        }
                      });
                    }
                  });
                }
                continue;
              }
              
              // Fetch from API - use perEventMarkets (alternate + period markets)
              const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${eventId}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${perEventMarkets.join(',')}&bookmakers=${bookmakerList}&oddsFormat=${oddsFormat}`;
              
              console.log(`🏈 PER-EVENT API CALL: ${game.home_team} vs ${game.away_team} - requesting ${perEventMarkets.length} markets`);
              
              const response = await axios.get(url);
              const eventData = response.data || {};
              
              // Log what we got back
              const returnedMarkets = new Set();
              (eventData.bookmakers || []).forEach(bm => {
                (bm.markets || []).forEach(m => returnedMarkets.add(m.key));
              });
              console.log(`🏈 PER-EVENT API RESPONSE: ${game.home_team} vs ${game.away_team} - got ${eventData.bookmakers?.length || 0} bookmakers, markets: [${[...returnedMarkets].join(', ')}]`);
              
              // Cache the result with longer TTL for period markets
              if (eventData.bookmakers && eventData.bookmakers.length > 0) {
                setCachedResponse(cacheKey, eventData, PERIOD_MARKET_CACHE_MS);
              }
              
              // Merge period market data with existing game
              if (eventData.bookmakers) {
                let mergedCount = 0;
                eventData.bookmakers.forEach(pBookmaker => {
                  const existingBookmaker = game.bookmakers.find(b => b.key === pBookmaker.key);
                  if (existingBookmaker && pBookmaker.markets) {
                    const existingMarketKeys = existingBookmaker.markets.map(m => m.key);
                    pBookmaker.markets.forEach(pMarket => {
                      if (!existingMarketKeys.includes(pMarket.key)) {
                        existingBookmaker.markets.push(pMarket);
                        mergedCount++;
                      }
                    });
                  } else if (pBookmaker.markets && pBookmaker.markets.length > 0) {
                    // Bookmaker not in base game - add it with period markets only
                    game.bookmakers.push(pBookmaker);
                    mergedCount += pBookmaker.markets.length;
                  }
                });
                if (mergedCount > 0) {
                  console.log(`🏈 PER-EVENT MARKETS: Merged ${mergedCount} markets for game ${game.home_team} vs ${game.away_team}`);
                }
              }
            } catch (gameErr) {
              console.log(`🏈 PERIOD MARKETS ERROR for game ${game?.id}: ${gameErr.message}`);
            }
          }
        } catch (sportErr) {
          // Silently skip sport period market errors
        }
      }
    }
    
    // Step 3: Fetch player props if requested
    // NOTE: Player props must be fetched using /events/{eventId}/odds endpoint, one event at a time
    // OPTIMIZATION: Use stale-while-revalidate caching - return cached data immediately, refresh in background
    
    console.log(`🎯 PLAYER PROPS CHECK: playerPropMarkets.length=${playerPropMarkets.length}, ENABLE_PLAYER_PROPS_V2=${ENABLE_PLAYER_PROPS_V2}, isPlayerPropsRequest=${isPlayerPropsRequest}`);
    
    if (playerPropMarkets.length > 0 && ENABLE_PLAYER_PROPS_V2) {
      // Generate cache key for this player props request
      const ppCacheKey = getPlayerPropsCacheKey(sportsArray, playerPropMarkets);
      console.log(`🎯 PLAYER PROPS: Cache key = ${ppCacheKey.substring(0, 80)}...`);
      const cachedProps = getCachedPlayerPropsResults(ppCacheKey);
      
      if (cachedProps) {
        // We have cached data - return it immediately
        console.log(`📦 PLAYER PROPS CACHE HIT: Returning ${cachedProps.data.length} cached props (age: ${cachedProps.age}s, stale: ${cachedProps.isStale})`);
        // Log first prop to verify structure
        if (cachedProps.data.length > 0) {
          const firstProp = cachedProps.data[0];
          console.log(`📦 FIRST CACHED PROP: ${firstProp.home_team} vs ${firstProp.away_team}, bookmakers: ${firstProp.bookmakers?.length || 0}`);
        }
        allGames.push(...cachedProps.data);
        
        // If data is stale, trigger background refresh (but don't wait for it)
        if (cachedProps.isStale && !isPlayerPropsRefreshing(ppCacheKey)) {
          console.log(`🔄 PLAYER PROPS: Triggering background refresh for stale cache`);
          setPlayerPropsRefreshing(ppCacheKey, true);
          
          // Fire and forget - refresh in background
          fetchPlayerPropsInBackground(ppCacheKey, sportsArray, playerPropMarkets, playerPropsMarketMap, oddsFormat, req)
            .catch(err => console.log(`❌ Background refresh error: ${err.message}`))
            .finally(() => setPlayerPropsRefreshing(ppCacheKey, false));
        }
      } else {
        // No cache - fetch fresh data (this will be slow on first request)
        console.log(`🎯 PLAYER PROPS CACHE MISS: Fetching fresh data for ${sportsArray.length} sports, ${playerPropMarkets.length} markets`);
        const startTime = Date.now();
        const freshProps = await fetchPlayerPropsData(sportsArray, playerPropMarkets, playerPropsMarketMap, oddsFormat, req);
        const duration = Date.now() - startTime;
        
        if (freshProps.length > 0) {
          allGames.push(...freshProps);
          setCachedPlayerPropsResults(ppCacheKey, freshProps);
          console.log(`🎯 PLAYER PROPS COMPLETE: Added ${freshProps.length} events with player props in ${duration}ms (cached for next request)`);
          // Log first prop structure for debugging
          if (freshProps[0]) {
            const fp = freshProps[0];
            const firstBm = fp.bookmakers?.[0];
            const firstMarket = firstBm?.markets?.[0];
            console.log(`🎯 FIRST PROP STRUCTURE: ${fp.home_team} vs ${fp.away_team}, sport=${fp.sport_key}, bookmakers=${fp.bookmakers?.length}, firstMarket=${firstMarket?.key}, outcomes=${firstMarket?.outcomes?.length}`);
          }
        } else {
          console.log(`🎯 PLAYER PROPS COMPLETE: No props found after ${duration}ms`);
        }
      }
    }
    
    // Filter bookmakers' markets to only include requested markets (if not fetching all)
    const allRequestedMarkets = [...regularMarkets, ...playerPropMarkets];
    
    if (allRequestedMarkets.length > 0 && betType !== 'props') {
      // For regular game odds, filter to only requested markets
      allGames.forEach(game => {
        if (game.bookmakers) {
          game.bookmakers = game.bookmakers.map(bookmaker => ({
            ...bookmaker,
            markets: bookmaker.markets?.filter(market => allRequestedMarkets.includes(market.key)) || []
          })).filter(bookmaker => bookmaker.markets && bookmaker.markets.length > 0);
        }
      });
    }
    
    // Log summary of games by sport
    const sportCounts = {};
    allGames.forEach(game => {
      const sport = game.sport_key || 'unknown';
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });
    console.log(`📊 Final games by sport:`, sportCounts);
    console.log(`📊 Total games returned: ${allGames.length}`);
    
    // Check if NHL was requested but not returned
    if (hasNHL && !sportCounts['icehockey_nhl']) {
      console.log(`⚠️ NHL was requested but no NHL games in final response!`);
      console.log(`⚠️ This could mean: 1) No NHL games scheduled, 2) All games already started, 3) API error`);
    }
    
    // Log which sports were requested vs returned
    console.log(`📋 Sports requested: [${sportsArray.join(', ')}]`);
    console.log(`📋 Sports returned: [${Object.keys(sportCounts).join(', ')}]`);
    const missingSports = sportsArray.filter(s => !sportCounts[s]);
    if (missingSports.length > 0) {
      console.log(`⚠️ Missing sports: [${missingSports.join(', ')}]`);
    }
    
    // Log response size for debugging
    const responseSize = JSON.stringify(allGames).length;
    console.log(`📤 RESPONSE: Sending ${allGames.length} games (${Math.round(responseSize / 1024)}KB)`);
    
    // Log player props count in response
    const propsGames = allGames.filter(g => g.bookmakers?.some(bm => bm.markets?.some(m => m.key?.startsWith('player_'))));
    console.log(`🎯 PLAYER PROPS IN RESPONSE: ${propsGames.length} games have player_ markets`);
    
    res.json(allGames);
  } catch (err) {
    console.error('Odds error:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /api/odds-data
 * Legacy endpoint for odds snapshots
 */
router.get('/odds-data', enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const sport = req.query.sport || "basketball_nba";
    const regions = req.query.regions || "us";
    const markets = req.query.markets || "h2h,spreads,totals";
    const oddsFormat = req.query.oddsFormat || "american";
    const includeBetLimits = req.query.includeBetLimits;

    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(
      sport
    )}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}${
      includeBetLimits ? `&includeBetLimits=${encodeURIComponent(includeBetLimits)}` : ""
    }`;

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    console.error("odds-data error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});

/**
 * GET /api/cached-odds/:sport
 * Get cached odds from Supabase for any sport
 */
router.get('/cached-odds/:sport', enforceUsage, async (req, res) => {
  try {
    const { sport } = req.params;
    const { markets, bookmakers, eventId } = req.query;
    const oddsCacheService = req.app.locals.oddsCacheService;
    
    // Map short sport names to full keys
    const sportKeyMap = {
      'nfl': 'americanfootball_nfl',
      'ncaaf': 'americanfootball_ncaaf',
      'nba': 'basketball_nba',
      'ncaab': 'basketball_ncaab',
      'mlb': 'baseball_mlb',
      'nhl': 'icehockey_nhl',
      'epl': 'soccer_epl'
    };
    
    const sportKey = sportKeyMap[sport] || sport;
    console.log(`📦 Fetching cached odds for sport: ${sportKey}`);
    
    const options = {
      markets: markets ? markets.split(',') : null,
      bookmakers: bookmakers ? bookmakers.split(',') : null,
      eventId: eventId || null
    };

    const cachedOdds = await oddsCacheService.getCachedOdds(sportKey, options);
    const transformedData = transformCachedOddsToFrontend(cachedOdds);
    
    console.log(`✅ Returning ${transformedData.length} cached games for ${sportKey}`);
    
    res.set('Cache-Control', 'public, max-age=30');
    res.json(transformedData);
  } catch (err) {
    console.error('Cached odds error:', err);
    res.status(500).json({ error: 'Failed to get cached odds', detail: err.message });
  }
});

/**
 * POST /api/cached-odds/nfl/update
 * Manual trigger for NFL odds update (admin only)
 */
router.post('/cached-odds/nfl/update', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
    
    if (adminKey !== ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const oddsCacheService = req.app.locals.oddsCacheService;
    const result = await oddsCacheService.updateNFLOdds();
    
    res.json({ 
      success: true, 
      message: 'NFL odds updated successfully',
      ...result 
    });
  } catch (err) {
    console.error('Manual update error:', err);
    res.status(500).json({ error: 'Failed to update odds', detail: err.message });
  }
});

/**
 * GET /api/cached-odds/stats
 * Get update statistics
 */
router.get('/cached-odds/stats', async (req, res) => {
  try {
    const { sport = 'americanfootball_nfl', limit = 10 } = req.query;
    const oddsCacheService = req.app.locals.oddsCacheService;
    
    const stats = await oddsCacheService.getUpdateStats(sport, parseInt(limit));
    res.json({ stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats', detail: err.message });
  }
});

/**
 * POST /api/cached-odds/nfl/control
 * Start/stop NFL updates (admin only)
 */
router.post('/cached-odds/nfl/control', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
    
    if (adminKey !== ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { action } = req.body;
    const oddsCacheService = req.app.locals.oddsCacheService;
    
    if (action === 'start') {
      await oddsCacheService.startNFLUpdates();
      res.json({ success: true, message: 'NFL updates started' });
    } else if (action === 'stop') {
      await oddsCacheService.stopNFLUpdates();
      res.json({ success: true, message: 'NFL updates stopped' });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
    }
  } catch (err) {
    console.error('Control error:', err);
    res.status(500).json({ error: 'Failed to control updates', detail: err.message });
  }
});

/**
 * GET /api/odds/player-props
 * Player props endpoint - fetches player prop odds using the /odds endpoint
 * Note: TheOddsAPI only supports player props through the /odds endpoint with specific market keys
 */
router.get('/player-props', requireUser, checkPlanAccess, async (req, res) => {
  try {
    const { league, date, game_id, markets, bookmakers } = req.query;
    
    if (!league) {
      return res.status(400).json({ error: 'Missing required parameter: league' });
    }

    // Convert league to sport_key format
    const sportKeyMap = {
      'americanfootball_nfl': 'americanfootball_nfl',
      'nfl': 'americanfootball_nfl',
      'basketball_nba': 'basketball_nba',
      'nba': 'basketball_nba',
      'baseball_mlb': 'baseball_mlb',
      'mlb': 'baseball_mlb',
      'icehockey_nhl': 'icehockey_nhl',
      'nhl': 'icehockey_nhl'
    };
    
    const sportKey = sportKeyMap[league] || league;
    
    // Parse markets - if not provided, use default player prop markets
    let marketsList = markets 
      ? (typeof markets === 'string' ? markets.split(',') : markets)
      : ['player_points', 'player_assists', 'player_rebounds', 'player_pass_tds', 'player_passing_yards', 'player_rushing_yards', 'player_receiving_yards', 'player_receptions'];
    
    // Ensure all markets are player prop markets
    marketsList = marketsList.filter(m => m.startsWith('player_'));
    
    if (marketsList.length === 0) {
      return res.status(400).json({ error: 'No valid player prop markets specified' });
    }

    // Build API request - use /odds endpoint which supports player props
    const params = {
      apiKey: API_KEY,
      regions: 'us,us_dfs',
      markets: marketsList.join(','),
      oddsFormat: 'american'
    };
    
    // Use DFS apps for player props - include betr_us_dfs
    // NOTE: Do NOT pass bookmakers parameter - it overrides regions
    // Per TheOddsAPI docs: "when both regions and bookmakers are specified, bookmakers takes priority"
    // We want regions=us,us_dfs to get ALL bookmakers from both regions
    // const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au', 'betr_us_dfs'];
    // params.bookmakers = bookmakers || dfsApps.join(',');
    // REMOVED: bookmakers parameter - let regions handle it

    console.log('🎯 Fetching player props:', { sportKey, markets: marketsList.join(','), regions: params.regions });

    // Fetch from TheOddsAPI using /odds endpoint
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds`;
    const response = await axios.get(url, { params, timeout: 30000 });
    
    if (response.status !== 200) {
      throw new Error(`TheOddsAPI returned status ${response.status}`);
    }

    const events = response.data || [];
    
    // Transform to player props format
    const items = [];
    for (const event of events) {
      if (!event.bookmakers || event.bookmakers.length === 0) continue;
      
      for (const bookmaker of event.bookmakers) {
        for (const market of bookmaker.markets || []) {
          if (!market.key.startsWith('player_')) continue;
          
          for (const outcome of market.outcomes || []) {
            items.push({
              event_id: event.id,
              sport_key: sportKey,
              commence_time: event.commence_time,
              home_team: event.home_team,
              away_team: event.away_team,
              bookmaker_key: bookmaker.key,
              bookmaker_title: bookmaker.title,
              market_key: market.key,
              market_name: market.key.replace('player_', ''),
              player_name: outcome.name,
              outcome_name: outcome.description,
              price: outcome.price,
              point: outcome.point
            });
          }
        }
      }
    }

    res.json({
      items,
      stale: false,
      ttl: 300,
      as_of: new Date().toISOString()
    });
  } catch (err) {
    console.error('Player props error:', err);
    res.status(500).json({ error: 'Failed to fetch player props', detail: err.message });
  }
});

/**
 * Helper function to transform cached odds to frontend format
 */
function transformCachedOddsToFrontend(cachedOdds) {
  const eventsMap = new Map();

  for (const odd of cachedOdds) {
    if (!eventsMap.has(odd.event_id)) {
      eventsMap.set(odd.event_id, {
        id: odd.event_id,
        sport_key: odd.sport_key,
        sport_title: 'NFL',
        commence_time: odd.commence_time,
        home_team: odd.event_name.split(' @ ')[1],
        away_team: odd.event_name.split(' @ ')[0],
        bookmakers: []
      });
    }

    const event = eventsMap.get(odd.event_id);
    let bookmaker = event.bookmakers.find(b => b.key === odd.bookmaker_key);
    
    if (!bookmaker) {
      bookmaker = {
        key: odd.bookmaker_key,
        title: odd.bookmaker_key,
        markets: []
      };
      event.bookmakers.push(bookmaker);
    }

    bookmaker.markets.push({
      key: odd.market_key,
      last_update: odd.last_updated,
      outcomes: odd.outcomes
    });
  }

  return Array.from(eventsMap.values());
}

module.exports = router;
