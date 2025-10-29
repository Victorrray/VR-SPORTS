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
    
    // Define DFS apps list at top level for use throughout the function
    const dfsApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'draftkings_pick6'];
    
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
            
            // Log quota information from response headers
            const quotaRemaining = response.headers['x-requests-remaining'];
            const quotaUsed = response.headers['x-requests-used'];
            const quotaLast = response.headers['x-requests-last'];
            console.log(`📊 Quota - Remaining: ${quotaRemaining}, Used: ${quotaUsed}, Last Call Cost: ${quotaLast}`);
            
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
    // NOTE: Player props must be fetched using /events/{eventId}/odds endpoint, one event at a time
    if (playerPropMarkets.length > 0 && ENABLE_PLAYER_PROPS_V2) {
      console.log('🎯 Fetching player props for markets:', playerPropMarkets);
      
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      // Filter to DFS apps only for player props
      const playerPropsBookmakers = allowedBookmakers.filter(book => dfsApps.includes(book));
      const bookmakerList = playerPropsBookmakers.join(',');
      
      console.log(`🎯 Player props bookmakers for ${sportsArray.join(', ')}: ${bookmakerList}`);
      console.log(`🔍 Player props bookmakers details: ${JSON.stringify(playerPropsBookmakers)}`);
      
      let playerPropsCount = 0;
      
      for (const sport of sportsArray) {
        try {
          // First, get list of events for this sport
          const eventsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events?apiKey=${API_KEY}`;
          console.log(`🔍 Fetching events for ${sport}...`);
          const eventsResponse = await axios.get(eventsUrl, { timeout: 30000 });
          const events = eventsResponse.data || [];
          
          console.log(`📅 Got ${events.length} events for ${sport}`);
          
          // For each event, fetch player props using /events/{eventId}/odds endpoint
          for (const event of events) {
            try {
              const playerPropsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${event.id}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${playerPropMarkets.join(',')}&bookmakers=${bookmakerList}&oddsFormat=${oddsFormat}&includeBetLimits=true`;
              
              console.log(`🔍 Fetching player props for event ${event.id} (${event.home_team} vs ${event.away_team})...`);
              const playerPropsResponse = await axios.get(playerPropsUrl, { timeout: 30000 });
              
              // Log quota information from response headers
              const quotaRemaining = playerPropsResponse.headers['x-requests-remaining'];
              const quotaUsed = playerPropsResponse.headers['x-requests-used'];
              const quotaLast = playerPropsResponse.headers['x-requests-last'];
              console.log(`📊 Quota - Remaining: ${quotaRemaining}, Used: ${quotaUsed}, Last Call Cost: ${quotaLast}`);
              
              // TheOddsAPI returns a single event object with bookmakers and markets
              if (playerPropsResponse.data && playerPropsResponse.data.bookmakers && playerPropsResponse.data.bookmakers.length > 0) {
                // Filter bookmakers to only include those with player prop markets
                const eventWithProps = {
                  ...playerPropsResponse.data,
                  bookmakers: playerPropsResponse.data.bookmakers
                    .filter(bk => 
                      bk.markets && bk.markets.some(m => playerPropMarkets.includes(m.key))
                    )
                    .map(bk => ({
                      ...bk,
                      // Ensure title is set for display
                      title: bk.title || bk.key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
                    }))
                };
                
                if (eventWithProps.bookmakers.length > 0) {
                  console.log(`✅ Got player props for ${event.home_team} vs ${event.away_team} with ${eventWithProps.bookmakers.length} bookmakers and ${eventWithProps.bookmakers.reduce((sum, bk) => sum + (bk.markets?.length || 0), 0)} markets`);
                  allGames.push(eventWithProps);
                  playerPropsCount++;
                } else {
                  console.log(`⏭️ Event ${event.id} has bookmakers but no player prop markets`);
                }
              } else {
                console.log(`⏭️ Event ${event.id} has no bookmakers with player props`);
              }
            } catch (eventErr) {
              // Skip events that don't have player props available
              if (eventErr.response?.status === 422) {
                console.log(`⏭️ No player props available for event ${event.id}`);
              } else {
                console.warn(`⚠️ Player props fetch error for event ${event.id}:`, eventErr.message);
              }
            }
          }
        } catch (sportErr) {
          console.warn(`⚠️ Failed to fetch events for ${sport}:`, sportErr.message);
          // Continue with other sports even if one fails
        }
      }
      
      console.log(`✅ Total player props events fetched: ${playerPropsCount}`);
    }
    
    console.log(`📊 Final response: ${allGames.length} total games/events (including ${allGames.filter(g => g.bookmakers?.some(b => dfsApps.includes(b.key))).length} with player props)`);
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
    
    // Use DFS apps for player props
    const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au'];
    params.bookmakers = bookmakers || dfsApps.join(',');

    console.log('🎯 Fetching player props:', { sportKey, markets: marketsList.join(','), bookmakers: params.bookmakers });

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
