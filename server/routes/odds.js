/**
 * Odds Routes
 * Main odds endpoint and related functionality
 * This is the most complex route - handles game odds, player props, and caching
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireUser, checkPlanAccess, enforceUsage } = require('../middleware/auth');
const { getCacheKey, getCachedResponse, setCachedResponse } = require('../services/cache');
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

// Sport-specific market support from TheOddsAPI
const SPORT_MARKET_SUPPORT = {
  'americanfootball_nfl': [
    'h2h', 'spreads', 'totals', 'h2h_lay',
    'alternate_spreads', 'alternate_totals', 'h2h_3_way', 'team_totals', 'alternate_team_totals',
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    'h2h_h1', 'h2h_h2',
    'h2h_3_way_h1', 'h2h_3_way_h2',
    'spreads_h1', 'spreads_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2'
  ],
  'americanfootball_ncaaf': [
    'h2h', 'spreads', 'totals', 'h2h_lay',
    'alternate_spreads', 'alternate_totals', 'h2h_3_way', 'team_totals', 'alternate_team_totals',
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    'h2h_h1', 'h2h_h2',
    'h2h_3_way_h1', 'h2h_3_way_h2',
    'spreads_h1', 'spreads_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2'
  ],
  'basketball_nba': [
    'h2h', 'spreads', 'totals', 'h2h_lay',
    'alternate_spreads', 'alternate_totals', 'h2h_3_way', 'team_totals', 'alternate_team_totals',
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4'
  ],
  'basketball_ncaab': [
    'h2h', 'spreads', 'totals', 'h2h_lay',
    'alternate_spreads', 'alternate_totals', 'h2h_3_way', 'team_totals', 'alternate_team_totals',
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4'
  ],
  'baseball_mlb': [
    'h2h', 'spreads', 'totals', 'h2h_lay',
    'alternate_spreads', 'alternate_totals', 'h2h_3_way', 'team_totals', 'alternate_team_totals',
    'h2h_h1', 'h2h_h2',
    'h2h_3_way_h1', 'h2h_3_way_h2',
    'spreads_h1', 'spreads_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2',
    'h2h_1st_1_innings', 'h2h_1st_3_innings', 'h2h_1st_5_innings', 'h2h_1st_7_innings',
    'h2h_3_way_1st_1_innings', 'h2h_3_way_1st_3_innings', 'h2h_3_way_1st_5_innings', 'h2h_3_way_1st_7_innings',
    'spreads_1st_1_innings', 'spreads_1st_3_innings', 'spreads_1st_5_innings', 'spreads_1st_7_innings',
    'alternate_spreads_1st_1_innings', 'alternate_spreads_1st_3_innings', 'alternate_spreads_1st_5_innings', 'alternate_spreads_1st_7_innings',
    'totals_1st_1_innings', 'totals_1st_3_innings', 'totals_1st_5_innings', 'totals_1st_7_innings',
    'alternate_totals_1st_1_innings', 'alternate_totals_1st_3_innings', 'alternate_totals_1st_5_innings', 'alternate_totals_1st_7_innings'
  ],
  'icehockey_nhl': [
    'h2h', 'spreads', 'totals', 'h2h_lay',
    'alternate_spreads', 'alternate_totals', 'h2h_3_way', 'team_totals', 'alternate_team_totals',
    'h2h_p1', 'h2h_p2', 'h2h_p3',
    'h2h_3_way_p1', 'h2h_3_way_p2', 'h2h_3_way_p3',
    'spreads_p1', 'spreads_p2', 'spreads_p3',
    'alternate_spreads_p1', 'alternate_spreads_p2', 'alternate_spreads_p3',
    'totals_p1', 'totals_p2', 'totals_p3',
    'alternate_totals_p1', 'alternate_totals_p2', 'alternate_totals_p3',
    'team_totals_p1', 'team_totals_p2', 'team_totals_p3',
    'alternate_team_totals_p1', 'alternate_team_totals_p2', 'alternate_team_totals_p3'
  ],
  'soccer_epl': ['h2h', 'spreads', 'totals', 'h2h_lay', 'h2h_3_way', 'draw_no_bet', 'btts', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'],
  'soccer_uefa_champs_league': ['h2h', 'spreads', 'totals', 'h2h_lay', 'h2h_3_way', 'draw_no_bet', 'btts', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'],
  'soccer_mls': ['h2h', 'spreads', 'totals', 'h2h_lay', 'h2h_3_way', 'draw_no_bet', 'btts', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'],
  'soccer_spain_la_liga': ['h2h', 'spreads', 'totals', 'h2h_lay', 'h2h_3_way', 'draw_no_bet', 'btts', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'],
  'soccer_germany_bundesliga': ['h2h', 'spreads', 'totals', 'h2h_lay', 'h2h_3_way', 'draw_no_bet', 'btts', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'],
  'soccer_italy_serie_a': ['h2h', 'spreads', 'totals', 'h2h_lay', 'h2h_3_way', 'draw_no_bet', 'btts', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'],
  'soccer_france_ligue_one': ['h2h', 'spreads', 'totals', 'h2h_lay', 'h2h_3_way', 'draw_no_bet', 'btts', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'],
  'soccer_fifa_world_cup': ['h2h', 'spreads', 'totals', 'h2h_lay', 'h2h_3_way', 'draw_no_bet', 'btts', 'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals'],
  'mma_mixed_martial_arts': ['h2h', 'spreads', 'totals', 'h2h_lay'],
  'boxing_boxing': ['h2h', 'spreads', 'totals', 'h2h_lay'],
  'golf_pga': ['outrights', 'outrights_lay'],
  'golf_masters': ['outrights', 'outrights_lay'],
  'golf_us_open': ['outrights', 'outrights_lay'],
  'golf_british_open': ['outrights', 'outrights_lay'],
  'default': ['h2h', 'spreads', 'totals']
};

/**
 * GET /api/odds
 * Main odds endpoint - returns game odds with optional player props
 */
router.get('/', requireUser, checkPlanAccess, async (req, res) => {
  try {
    const { sports, regions = "us", markets = "h2h,spreads,totals", oddsFormat = "american", date } = req.query;
    console.log('🔍 /api/odds called with:', { sports, regions, markets, date, userId: req.__userId });
    
    if (!sports) return res.status(400).json({ error: "Missing sports parameter" });
    if (!API_KEY) {
      return res.status(500).json({ 
        error: "ODDS_API_KEY not configured", 
        message: "Please configure ODDS_API_KEY environment variable" 
      });
    }
    
    const sportsArray = sports.split(',');
    const marketsArray = markets.split(',');
    let allGames = [];
    
    // Separate player props from regular markets
    const regularMarkets = marketsArray.filter(m => !m.includes('player_') && !m.includes('batter_') && !m.includes('pitcher_'));
    const playerPropMarkets = marketsArray.filter(m => m.includes('player_') || m.includes('batter_') || m.includes('pitcher_'));
    
    // Filter markets based on sport support
    const filteredRegularMarkets = regularMarkets.filter(m => {
      return sportsArray.some(sport => {
        const supportedForSport = SPORT_MARKET_SUPPORT[sport] || SPORT_MARKET_SUPPORT['default'];
        return supportedForSport.includes(m);
      });
    });
    
    console.log('🎯 Sport-specific market filtering:');
    sportsArray.forEach(sport => {
      const supportedForSport = SPORT_MARKET_SUPPORT[sport] || SPORT_MARKET_SUPPORT['default'];
      console.log(`  ${sport}: ${supportedForSport.join(', ')}`);
    });
    
    // Separate quarter/half/period markets from base markets
    const quarterMarketPatterns = ['_q1', '_q2', '_q3', '_q4', '_h1', '_h2', '_p1', '_p2', '_p3', '_1st_'];
    const baseMarkets = filteredRegularMarkets.filter(m => !quarterMarketPatterns.some(pattern => m.includes(pattern)));
    const quarterMarkets = filteredRegularMarkets.filter(m => quarterMarketPatterns.some(pattern => m.includes(pattern)));
    
    console.log('📊 Market separation:');
    console.log('  Base markets:', baseMarkets);
    console.log('  Quarter/Half/Period markets:', quarterMarkets);
    
    // Step 1: Fetch base odds
    if (baseMarkets.length > 0) {
      const marketsToFetch = baseMarkets;
      const supabase = req.app.locals.supabase;
      const oddsCacheService = req.app.locals.oddsCacheService;
      
      for (const sport of sportsArray) {
        try {
          const userProfile = req.__userProfile || { plan: 'free' };
          const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
          
          // Filter out DFS apps for game odds
          const dfsApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'draftkings_pick6'];
          const gameOddsBookmakers = allowedBookmakers.filter(book => !dfsApps.includes(book));
          const bookmakerList = gameOddsBookmakers.join(',');
          
          console.log(`🎯 Game odds bookmakers for ${sport}: ${bookmakerList}`);
          
          // Check Supabase cache first
          let supabaseCachedData = null;
          if (supabase && oddsCacheService) {
            try {
              const cachedOdds = await oddsCacheService.getCachedOdds(sport, {
                markets: marketsToFetch
              });
              
              if (cachedOdds && cachedOdds.length > 0) {
                console.log(`📦 Supabase cache HIT for ${sport}: ${cachedOdds.length} cached entries`);
                supabaseCachedData = transformCachedOddsToApiFormat(cachedOdds);
                console.log(`✅ Using ${supabaseCachedData.length} games from Supabase cache`);
              } else {
                console.log(`📦 Supabase cache MISS for ${sport}`);
              }
            } catch (cacheErr) {
              console.warn(`⚠️ Supabase cache error for ${sport}:`, cacheErr.message);
            }
          }
          
          // Use Supabase cache if available
          if (supabaseCachedData && supabaseCachedData.length > 0) {
            allGames.push(...supabaseCachedData);
            console.log(`💰 Saved API call for ${sport} using Supabase cache`);
            continue;
          }
          
          // Make API call
          const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${marketsToFetch.join(',')}&bookmakers=${bookmakerList}&oddsFormat=${oddsFormat}&includeBetLimits=true&includeLinks=true&includeSids=true`;
          
          // Split markets for optimized caching
          const regularMarketsData = marketsToFetch.filter(market => !ALTERNATE_MARKETS.includes(market));
          const alternateMarketsData = marketsToFetch.filter(market => ALTERNATE_MARKETS.includes(market));
          
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
          
          const cacheKey = getCacheKey('odds', { sport, regions, markets: marketsToFetch });
          const cachedData = getCachedResponse(cacheKey);
          
          let responseData;
          
          if (canUseAllCached) {
            responseData = [];
            if (cachedRegularData) {
              console.log(`📦 Using cached regular markets data for ${sport}`);
              responseData = [...responseData, ...cachedRegularData];
            }
            if (cachedAlternateData) {
              console.log(`📦 Using cached alternate markets data for ${sport}`);
              responseData = [...responseData, ...cachedAlternateData];
            }
            if (cachedData) {
              console.log(`📦 Using combined cached data for ${sport}`);
              responseData = cachedData;
            }
          } else {
            console.log(`🌐 API call for ${sport}`);
            const response = await axios.get(url);
            responseData = response.data;
            
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
                console.log(`💾 Saving ${responseData.length} games to Supabase cache for ${sport}`);
                await saveOddsToSupabase(responseData, sport, supabase);
                console.log(`✅ Successfully cached ${responseData.length} games in Supabase`);
              } catch (supabaseSaveErr) {
                console.warn(`⚠️ Failed to save to Supabase cache:`, supabaseSaveErr.message);
              }
            }
          }
          
          const sportGames = responseData || [];
          console.log(`Got ${sportGames.length} games for ${sport}`);
          allGames.push(...sportGames);
        } catch (sportErr) {
          console.warn(`Failed to fetch games for sport ${sport}:`, sportErr.response?.status, sportErr.response?.data || sportErr.message);
        }
      }
      
      // Filter bookmakers based on user plan
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      allGames.forEach(game => {
        game.bookmakers = game.bookmakers.filter(bookmaker => 
          allowedBookmakers.includes(bookmaker.key)
        );
      });
      
      console.log(`Filtered to ${allowedBookmakers.length} allowed bookmakers for user plan: ${userProfile.plan}`);
    }
    
    // Step 2: Fetch player props if requested
    if (playerPropMarkets.length > 0 && ENABLE_PLAYER_PROPS_V2) {
      console.log('🎯 Fetching player props for markets:', playerPropMarkets);
      // Player props logic would go here - truncated for brevity
      // This is handled by the /api/player-props endpoint
    }
    
    res.json(allGames);
  } catch (err) {
    console.error('Odds error:', err);
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
