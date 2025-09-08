// server/index.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

// Initialize Stripe after dotenv loads
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const app = express();
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ODDS_API_KEY;
const SPORTSGAMEODDS_API_KEY = process.env.SPORTSGAMEODDS_API_KEY || null;

// Stripe configuration
const STRIPE_PRICE_PLATINUM = process.env.STRIPE_PRICE_PLATINUM;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// In-memory storage for usage tracking (replace with Supabase in production)
const userUsage = new Map(); // user_id -> { period_start, period_end, calls_made }
const userPlans = new Map(); // user_id -> 'free_trial' | 'platinum'

// Constants for improved player props stability
const FOCUSED_BOOKMAKERS = [
  "draftkings", "fanduel", "betmgm", "caesars", "espnbet", "fanatics", "prizepicks", "underdog"
];

const PLAYER_PROP_MARKETS = [
  "player_points", "player_assists", "player_rebounds", "player_pass_tds", 
  "player_pass_yds", "player_rush_yds", "player_receptions", "player_reception_yds"
];

const MAX_BOOKMAKERS = 10;

// Helper function to get current monthly window (UTC)
function currentMonthlyWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

// Helper function to clamp bookmaker lists
function clampBookmakers(bookmakers = []) {
  if (!bookmakers || bookmakers.length === 0) {
    return FOCUSED_BOOKMAKERS;
  }
  
  // Dedupe and limit to MAX_BOOKMAKERS
  const uniqueBooks = [...new Set(bookmakers)];
  return uniqueBooks.slice(0, MAX_BOOKMAKERS);
}

// Helper function to build event odds URLs consistently
function buildEventOddsUrl({ sportKey, eventId, apiKey, regions = "us", markets, bookmakers = [] }) {
  const baseUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/events/${encodeURIComponent(eventId)}/odds`;
  const params = new URLSearchParams({
    apiKey,
    regions,
    oddsFormat: "american"
  });
  
  if (markets) {
    params.append('markets', Array.isArray(markets) ? markets.join(',') : markets);
  }
  
  if (bookmakers && bookmakers.length > 0) {
    params.append('bookmakers', Array.isArray(bookmakers) ? bookmakers.join(',') : bookmakers);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

// Enhanced axios wrapper with retry logic and quota diagnostics
async function axiosWithRetry(url, options = {}, { tries = 2, backoffMs = 700 } = {}) {
  const axiosConfig = {
    timeout: 9000,
    ...options
  };
  
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const response = await axios.get(url, axiosConfig);
      
      // Log quota information
      const remaining = response.headers['x-requests-remaining'];
      const used = response.headers['x-requests-used'];
      if (remaining !== undefined || used !== undefined) {
        console.log(`API Quota - Remaining: ${remaining || 'N/A'}, Used: ${used || 'N/A'}`);
      }
      
      return response;
    } catch (error) {
      const status = error.response?.status;
      const isLastAttempt = attempt === tries;
      
      // Don't retry quota/plan limit errors
      if (status === 402 || status === 429) {
        console.error(`API quota/plan limit hit (${status}):`, error.response?.data);
        throw error;
      }
      
      // Retry transient errors with exponential backoff
      if (!isLastAttempt && (status >= 500 || !status)) {
        const delay = backoffMs * Math.pow(2, attempt - 1);
        console.warn(`Attempt ${attempt} failed (${status || 'timeout'}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
}

if (!API_KEY) {
  console.warn("⚠️  Missing ODDS_API_KEY in .env (odds endpoints will still work for ESPN scores).");
}

// Configure CORS for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://odds-frontend-j2pn.onrender.com',
      'https://oddssightseer.com',
      'https://oddsightseer.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware to enforce API usage limits
function enforceUsage(req, res, next) {
  // Mock user extraction - replace with actual JWT/session logic
  const userId = req.headers['x-user-id'] || 'demo-user';
  const userPlan = userPlans.get(userId) || 'free_trial';
  
  // Platinum users bypass all limits
  if (userPlan === 'platinum') {
    req.user = { id: userId, plan: userPlan };
    return next();
  }
  
  // Free trial users: enforce 1000 calls per month
  const { start, end } = currentMonthlyWindow();
  const periodKey = `${userId}-${start.toISOString()}`;
  
  // Get or create usage record for current month
  let usage = userUsage.get(periodKey);
  if (!usage) {
    usage = { period_start: start, period_end: end, calls_made: 0 };
    userUsage.set(periodKey, usage);
  }
  
  // Check if quota exceeded
  if (usage.calls_made >= 1000) {
    return res.status(403).json({
      error: 'quota_exceeded',
      message: 'Monthly API limit of 1,000 calls exceeded. Upgrade to Platinum for unlimited access.',
      calls_made: usage.calls_made,
      limit: 1000,
      period_end: usage.period_end.toISOString()
    });
  }
  
  // Increment usage and continue
  usage.calls_made += 1;
  userUsage.set(periodKey, usage);
  
  req.user = { id: userId, plan: userPlan };
  next();
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Usage endpoint - get current user's quota info
app.get('/api/usage/me', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo-user';
  const userPlan = userPlans.get(userId) || 'free_trial';
  
  if (userPlan === 'platinum') {
    return res.json({
      plan: 'platinum',
      limit: null,
      calls_made: null,
      remaining: null,
      period_end: null
    });
  }
  
  // Free trial: return current month usage
  const { start, end } = currentMonthlyWindow();
  const periodKey = `${userId}-${start.toISOString()}`;
  const usage = userUsage.get(periodKey) || { calls_made: 0 };
  
  res.json({
    plan: 'free_trial',
    limit: 1000,
    calls_made: usage.calls_made,
    remaining: Math.max(0, 1000 - usage.calls_made),
    period_end: end.toISOString()
  });
});

// Stripe: Create checkout session for Platinum subscription
app.post('/api/billing/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }
    
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: STRIPE_PRICE_PLATINUM,
        quantity: 1,
      }],
      success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/billing/cancel`,
      client_reference_id: userId,
      metadata: { user_id: userId }
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe: Webhook handler
app.post('/api/billing/webhook', (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata?.user_id;
    
    if (userId) {
      // Upgrade user to platinum
      userPlans.set(userId, 'platinum');
      console.log(`User ${userId} upgraded to Platinum`);
    }
  }
  
  res.json({ received: true });
});

// sports list (Odds API)
app.get("/api/sports", enforceUsage, async (_req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const url = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    console.error("sports error:", err?.response?.status, err?.response?.data || err.message);
    res.status(500).json({ error: String(err) });
  }
});

// events by sport (Odds API)
app.get("/api/events", enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const { sport } = req.query;
    if (!sport) return res.status(400).json({ error: "Missing sport" });
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events?apiKey=${API_KEY}`;
    const r = await axios.get(url);
    res.json(Array.isArray(r.data) ? r.data : (r.data ? Object.values(r.data) : []));
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("events error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: String(err) });
  }
});

// odds endpoint (unified for multiple sports)
app.get("/api/odds", enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    
    const { sports, regions = "us", markets = "h2h,spreads,totals", oddsFormat = "american" } = req.query;
    if (!sports) return res.status(400).json({ error: "Missing sports parameter" });
    
    const sportsArray = sports.split(',');
    const marketsArray = markets.split(',');
    let allGames = [];
    
    // Check if player props are requested
    const playerPropMarkets = marketsArray.filter(m => m.includes('player_') || m.includes('batter_') || m.includes('pitcher_'));
    const regularMarkets = marketsArray.filter(m => !m.includes('player_') && !m.includes('batter_') && !m.includes('pitcher_'));
    
    console.log('Player prop markets requested:', playerPropMarkets);
    console.log('Regular markets requested:', regularMarkets);
    
    // Step 1: Fetch regular odds (h2h, spreads, totals) if requested, OR fetch base games for player props
    if (regularMarkets.length > 0 || playerPropMarkets.length > 0) {
      // If only player props requested, fetch h2h to get base games
      const marketsToFetch = regularMarkets.length > 0 ? regularMarkets : ['h2h'];
      
      // Fetch each sport separately since TheOddsAPI doesn't support multiple sports in one request
      for (const sport of sportsArray) {
        try {
          const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${marketsToFetch.join(',')}&oddsFormat=${oddsFormat}&bookmakers=betmgm,betonlineag,betrivers,betus,bovada,williamhill_us,draftkings,fanatics,fanduel,lowvig,mybookieag,espnbet,ballybet,betanysports,betparx,hardrockbet,fliff,rebet,windcreek,betopenly,novig,prophetx,prizepicks,underdog,draftkings_pick6,pointsbet,bet365,unibet`;
          console.log(`Fetching base games for ${sport} from:`, url);
          
          const response = await axios.get(url);
          const sportGames = response.data || [];
          console.log(`Got ${sportGames.length} games for ${sport}`);
          
          allGames.push(...sportGames);
        } catch (sportErr) {
          console.warn(`Failed to fetch games for sport ${sport}:`, sportErr.response?.status, sportErr.response?.data || sportErr.message);
          // Continue with other sports even if one fails
        }
      }
      
      console.log(`Got ${allGames.length} total games with base markets`);
      
      // If we only fetched h2h for player props, remove those markets to avoid confusion
      if (regularMarkets.length === 0 && playerPropMarkets.length > 0) {
        allGames.forEach(game => {
          game.bookmakers.forEach(bookmaker => {
            bookmaker.markets = bookmaker.markets.filter(market => !['h2h'].includes(market.key));
          });
        });
      }
    }
    
    // Step 2: Fetch player props for each game individually (if requested)
    if (playerPropMarkets.length > 0 && allGames.length > 0) {
      console.log(`Fetching player props for ${allGames.length} games...`);
      
      for (const game of allGames) {
        try {
          // Use TheOddsAPI's /events/{eventId}/odds endpoint for player props
          // Use focused bookmaker list to prevent timeouts
          const clampedBookmakers = clampBookmakers(FOCUSED_BOOKMAKERS);
          const eventUrl = buildEventOddsUrl({
            sportKey: game.sport_key,
            eventId: game.id,
            apiKey: API_KEY,
            regions,
            markets: playerPropMarkets,
            bookmakers: clampedBookmakers
          });
          console.log(`Fetching props for game ${game.id}:`, eventUrl);
          
          const propResponse = await axios.get(eventUrl);
          const propData = propResponse.data;
          
          // Log API quota and response details
          console.log(`API Response Status: ${propResponse.status}`);
          console.log(`X-Requests-Remaining: ${propResponse.headers['x-requests-remaining'] || 'N/A'}`);
          console.log(`X-Requests-Used: ${propResponse.headers['x-requests-used'] || 'N/A'}`);
          console.log(`Response size: ${JSON.stringify(propData).length} bytes`);
          
          if (propData && propData.bookmakers && propData.bookmakers.length > 0) {
            console.log(`Got ${propData.bookmakers.length} bookmakers with props for game ${game.id}`);
            
            // Merge prop bookmakers with existing game bookmakers
            propData.bookmakers.forEach(propBookmaker => {
              // Find existing bookmaker in game or add new one
              let existingBookmaker = game.bookmakers.find(b => b.key === propBookmaker.key);
              
              if (existingBookmaker) {
                // Add prop markets to existing bookmaker
                existingBookmaker.markets = existingBookmaker.markets || [];
                existingBookmaker.markets.push(...(propBookmaker.markets || []));
              } else {
                // Add new bookmaker with prop markets
                game.bookmakers.push(propBookmaker);
              }
            });
          } else {
            console.log(`No prop data returned for game ${game.id} from TheOddsAPI - trying SportsGameOdds fallback`);
            
            // Try SportsGameOdds API as fallback
            if (SPORTSGAMEODDS_API_KEY) {
              try {
                await fetchSportsGameOddsPlayerProps(game);
              } catch (sgoErr) {
                console.warn(`SportsGameOdds fallback also failed for game ${game.id}:`, sgoErr.message);
              }
            } else {
              console.log(`No SportsGameOdds API key configured - skipping fallback`);
            }
          }
          
        } catch (propErr) {
          console.warn(`Failed to fetch props for game ${game.id} from TheOddsAPI:`, propErr.message);
          console.warn(`Error details:`, propErr.response?.status, propErr.response?.data);
          console.warn(`X-Requests-Remaining: ${propErr.response?.headers?.['x-requests-remaining'] || 'N/A'}`);
          
          // If 402/429 (quota exceeded), don't try fallback immediately
          if (propErr.response?.status === 402 || propErr.response?.status === 429) {
            console.warn('API quota exceeded - skipping SportsGameOdds fallback for this game');
            continue;
          }
          
          // Try SportsGameOdds API as fallback
          if (SPORTSGAMEODDS_API_KEY) {
            console.log(`Trying SportsGameOdds fallback for game ${game.id}`);
            try {
              await fetchSportsGameOddsPlayerProps(game);
            } catch (sgoErr) {
              console.warn(`SportsGameOdds fallback also failed for game ${game.id}:`, sgoErr.message);
            }
          } else {
            console.log(`No SportsGameOdds API key configured - skipping fallback`);
          }
        }
      }
    }
    
    console.log(`Returning ${allGames.length} games total`);
    res.json(allGames);
  } catch (err) {
    console.error("odds error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});

// Helper function to fetch player props from SportsGameOdds API
async function fetchSportsGameOddsPlayerProps(game) {
  if (!SPORTSGAMEODDS_API_KEY) {
    throw new Error('SportsGameOdds API key not configured');
  }

  try {
    // Map sport keys from TheOddsAPI to SportsGameOdds league IDs
    const leagueMapping = {
      'americanfootball_nfl': 'NFL',
      'basketball_nba': 'NBA', 
      'baseball_mlb': 'MLB',
      'icehockey_nhl': 'NHL'
    };

    const sgoLeagueID = leagueMapping[game.sport_key];
    if (!sgoLeagueID) {
      console.log(`Sport ${game.sport_key} not supported by SportsGameOdds fallback`);
      return;
    }

    // SportsGameOdds API endpoint for events with leagueID
    const eventsUrl = `https://api.sportsgameodds.com/v2/events`;
    
    // Get events for the specific league
    const eventsResponse = await axios.get(eventsUrl, {
      headers: {
        'x-api-key': SPORTSGAMEODDS_API_KEY
      },
      params: {
        leagueID: sgoLeagueID,
        format: 'json'
      }
    });

    const eventsData = eventsResponse.data;
    if (!eventsData || !eventsData.success || !eventsData.data || eventsData.data.length === 0) {
      console.log(`No events found for league ${sgoLeagueID} in SportsGameOdds`);
      return;
    }

    // Find matching event by team names
    const matchingEvent = eventsData.data.find(event => {
      const homeTeam = event.homeTeam?.toLowerCase() || '';
      const awayTeam = event.awayTeam?.toLowerCase() || '';
      const gameHome = game.home_team?.toLowerCase() || '';
      const gameAway = game.away_team?.toLowerCase() || '';
      
      return (homeTeam.includes(gameHome) || gameHome.includes(homeTeam)) &&
             (awayTeam.includes(gameAway) || gameAway.includes(awayTeam));
    });

    if (!matchingEvent) {
      console.log(`No matching event found for ${game.home_team} vs ${game.away_team} in SportsGameOdds`);
      console.log(`Available events:`, eventsData.data.map(e => `${e.homeTeam} vs ${e.awayTeam}`));
      return;
    }

    console.log(`Found matching event: ${matchingEvent.homeTeam} vs ${matchingEvent.awayTeam} (ID: ${matchingEvent.eventID})`);

    // Now get odds for the specific event
    const oddsUrl = `https://api.sportsgameodds.com/v2/odds`;
    const response = await axios.get(oddsUrl, {
      headers: {
        'x-api-key': SPORTSGAMEODDS_API_KEY
      },
      params: {
        eventID: matchingEvent.eventID,
        format: 'json'
      }
    });

    const sgoData = response.data;
    console.log(`SportsGameOdds returned data for ${game.id}:`, sgoData ? 'Success' : 'No data');

    if (sgoData && sgoData.data && sgoData.data.length > 0) {
      // Transform SportsGameOdds data to TheOddsAPI format
      const transformedBookmakers = transformSportsGameOddsData(sgoData, game);
      
      if (transformedBookmakers.length > 0) {
        console.log(`Successfully transformed ${transformedBookmakers.length} bookmakers from SportsGameOdds for game ${game.id}`);
        
        // Merge with existing game bookmakers
        transformedBookmakers.forEach(sgoBookmaker => {
          let existingBookmaker = game.bookmakers.find(b => b.key === sgoBookmaker.key);
          
          if (existingBookmaker) {
            existingBookmaker.markets = existingBookmaker.markets || [];
            existingBookmaker.markets.push(...(sgoBookmaker.markets || []));
          } else {
            game.bookmakers.push(sgoBookmaker);
          }
        });
      }
    }

  } catch (error) {
    console.error(`SportsGameOdds API error for game ${game.id}:`, error.message);
    throw error;
  }
}

// Helper function to transform SportsGameOdds data to TheOddsAPI format
function transformSportsGameOddsData(sgoData, game) {
  const bookmakers = [];
  
  try {
    console.log('Transforming SportsGameOdds data:', JSON.stringify(sgoData, null, 2));
    
    // Group odds by bookmaker
    const bookmakerGroups = {};
    
    // SportsGameOdds v2 API structure
    const oddsArray = sgoData.data || sgoData.odds || [];
    
    oddsArray.forEach(odd => {
      console.log('Processing odd:', JSON.stringify(odd, null, 2));
      
      // Check if this is a player prop
      const isPlayerProp = odd.market_type === 'player_props' || 
                          odd.bet_type === 'player_prop' ||
                          odd.category === 'player' ||
                          (odd.market && odd.market.includes('player'));
      
      if (!isPlayerProp || !odd.bookmaker) return;
      
      const bookmakerKey = odd.bookmaker.toLowerCase().replace(/\s+/g, '_');
      if (!bookmakerGroups[bookmakerKey]) {
        bookmakerGroups[bookmakerKey] = {
          key: bookmakerKey,
          title: odd.bookmaker,
          markets: []
        };
      }
      
      // Transform player prop to TheOddsAPI format
      const market = {
        key: `player_${odd.prop_type || odd.market || 'unknown'}`,
        outcomes: []
      };
      
      // Handle different SportsGameOdds data formats
      if (odd.over_price && odd.under_price && odd.line !== undefined) {
        market.outcomes.push({
          name: 'Over',
          price: parseFloat(odd.over_price),
          point: parseFloat(odd.line),
          description: odd.player_name || odd.player || 'Unknown Player'
        });
        
        market.outcomes.push({
          name: 'Under', 
          price: parseFloat(odd.under_price),
          point: parseFloat(odd.line),
          description: odd.player_name || odd.player || 'Unknown Player'
        });
      } else if (odd.odds && Array.isArray(odd.odds)) {
        // Handle array format
        odd.odds.forEach(outcome => {
          if (outcome.name && outcome.price) {
            market.outcomes.push({
              name: outcome.name,
              price: parseFloat(outcome.price),
              point: outcome.point ? parseFloat(outcome.point) : undefined,
              description: odd.player_name || odd.player || 'Unknown Player'
            });
          }
        });
      }
      
      if (market.outcomes.length > 0) {
        bookmakerGroups[bookmakerKey].markets.push(market);
        console.log(`Added market for ${bookmakerKey}:`, market);
      }
    });
    
    // Convert to array
    Object.values(bookmakerGroups).forEach(bookmaker => {
      if (bookmaker.markets.length > 0) {
        bookmakers.push(bookmaker);
      }
    });
    
    console.log(`Transformed ${bookmakers.length} bookmakers from SportsGameOdds`);
    
  } catch (transformError) {
    console.error('Error transforming SportsGameOdds data:', transformError);
  }
  
  return bookmakers;
}

// Helper function to add realistic NFL player props
function addNFLPlayerProps(game, requestedMarkets) {
  // Use game ID as seed for consistent data generation
  const gameId = game.id || `${game.home_team}-${game.away_team}`;
  const seed = gameId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  
  // Seeded random function for consistent results
  let seedValue = Math.abs(seed);
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  // Realistic NFL player roster by team (current season)
  const nflPlayers = {
    'Arizona Cardinals': ['Kyler Murray', 'James Conner', 'DeAndre Hopkins'],
    'Atlanta Falcons': ['Kirk Cousins', 'Bijan Robinson', 'Drake London'],
    'Baltimore Ravens': ['Lamar Jackson', 'Derrick Henry', 'Mark Andrews'],
    'Buffalo Bills': ['Josh Allen', 'James Cook', 'Stefon Diggs'],
    'Carolina Panthers': ['Bryce Young', 'Chuba Hubbard', 'DJ Moore'],
    'Chicago Bears': ['Caleb Williams', 'D\'Andre Swift', 'DJ Moore'],
    'Cincinnati Bengals': ['Joe Burrow', 'Joe Mixon', 'Ja\'Marr Chase'],
    'Cleveland Browns': ['Deshaun Watson', 'Nick Chubb', 'Amari Cooper'],
    'Dallas Cowboys': ['Dak Prescott', 'Tony Pollard', 'CeeDee Lamb'],
    'Denver Broncos': ['Bo Nix', 'Javonte Williams', 'Courtland Sutton'],
    'Detroit Lions': ['Jared Goff', 'David Montgomery', 'Amon-Ra St. Brown'],
    'Green Bay Packers': ['Jordan Love', 'Josh Jacobs', 'Jayden Reed'],
    'Houston Texans': ['C.J. Stroud', 'Joe Mixon', 'Nico Collins'],
    'Indianapolis Colts': ['Anthony Richardson', 'Jonathan Taylor', 'Michael Pittman Jr.'],
    'Jacksonville Jaguars': ['Trevor Lawrence', 'Travis Etienne', 'Brian Thomas Jr.'],
    'Kansas City Chiefs': ['Patrick Mahomes', 'Kareem Hunt', 'Travis Kelce'],
    'Las Vegas Raiders': ['Gardner Minshew', 'Alexander Mattison', 'Davante Adams'],
    'Los Angeles Chargers': ['Justin Herbert', 'J.K. Dobbins', 'Ladd McConkey'],
    'Los Angeles Rams': ['Matthew Stafford', 'Kyren Williams', 'Cooper Kupp'],
    'Miami Dolphins': ['Tua Tagovailoa', 'De\'Von Achane', 'Tyreek Hill'],
    'Minnesota Vikings': ['Sam Darnold', 'Aaron Jones', 'Justin Jefferson'],
    'New England Patriots': ['Drake Maye', 'Rhamondre Stevenson', 'DeMario Douglas'],
    'New Orleans Saints': ['Derek Carr', 'Alvin Kamara', 'Chris Olave'],
    'New York Giants': ['Daniel Jones', 'Tyrone Tracy Jr.', 'Malik Nabers'],
    'New York Jets': ['Aaron Rodgers', 'Breece Hall', 'Garrett Wilson'],
    'Philadelphia Eagles': ['Jalen Hurts', 'Saquon Barkley', 'A.J. Brown'],
    'Pittsburgh Steelers': ['Russell Wilson', 'Najee Harris', 'George Pickens'],
    'San Francisco 49ers': ['Brock Purdy', 'Christian McCaffrey', 'Deebo Samuel'],
    'Seattle Seahawks': ['Geno Smith', 'Kenneth Walker III', 'DK Metcalf'],
    'Tampa Bay Buccaneers': ['Baker Mayfield', 'Rachaad White', 'Mike Evans'],
    'Tennessee Titans': ['Will Levis', 'Tony Pollard', 'DeAndre Hopkins'],
    'Washington Commanders': ['Jayden Daniels', 'Brian Robinson Jr.', 'Terry McLaurin']
  };

  // Get players for this game
  const homeTeamPlayers = nflPlayers[game.home_team] || ['Player A', 'Player B', 'Player C'];
  const awayTeamPlayers = nflPlayers[game.away_team] || ['Player X', 'Player Y', 'Player Z'];
  const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers];

  // Find or create DraftKings bookmaker
  let draftKingsBook = game.bookmakers.find(b => b.key === 'draftkings');
  if (draftKingsBook) {
    // Add player prop markets to existing DraftKings book
    requestedMarkets.forEach(marketKey => {
      if (marketKey === 'player_pass_tds') {
        // Add passing TDs ONLY for QBs (first player from each team)
        // allPlayers = [homeQB, homeRB, homeWR, awayQB, awayRB, awayWR]
        [allPlayers[0], allPlayers[3]].forEach((player, idx) => {
          const baseLine = 1.5 + Math.floor(seededRandom() * 2);
          draftKingsBook.markets.push({
            key: marketKey,
            outcomes: [
              { name: 'Over', description: player, price: 150, point: baseLine },
              { name: 'Under', description: player, price: -180, point: baseLine }
            ]
          });
        });
      } else if (marketKey === 'player_pass_yds') {
        // Add passing yards ONLY for QBs (first player from each team)
        [allPlayers[0], allPlayers[3]].forEach((player, idx) => {
          const baseYards = 250 + Math.floor(seededRandom() * 100);
          draftKingsBook.markets.push({
            key: marketKey,
            outcomes: [
              { name: 'Over', description: player, price: -110, point: baseYards },
              { name: 'Under', description: player, price: -110, point: baseYards }
            ]
          });
        });
      } else if (marketKey === 'player_rush_yds') {
        // Add rushing yards ONLY for RBs (second player from each team)
        [allPlayers[1], allPlayers[4]].forEach((player, idx) => {
          const baseYards = 60 + Math.floor(seededRandom() * 40);
          draftKingsBook.markets.push({
            key: marketKey,
            outcomes: [
              { name: 'Over', description: player, price: -115, point: baseYards },
              { name: 'Under', description: player, price: -105, point: baseYards }
            ]
          });
        });
      }
    });
  }

  // Add PrizePicks as a separate bookmaker with player props
  const prizePicksMarkets = [];
  requestedMarkets.forEach(marketKey => {
    if (marketKey === 'player_pass_tds') {
      // PrizePicks passing TDs ONLY for QBs (first player from each team)
      // allPlayers = [homeQB, homeRB, homeWR, awayQB, awayRB, awayWR]
      [allPlayers[0], allPlayers[3]].forEach((player, idx) => {
        const baseLine = 2.5 + Math.floor(seededRandom() * 2);
        prizePicksMarkets.push({
          key: marketKey,
          outcomes: [
            { name: 'Over', description: player, price: 200, point: baseLine },
            { name: 'Under', description: player, price: -250, point: baseLine }
          ]
        });
      });
    } else if (marketKey === 'player_pass_yds') {
      // PrizePicks passing yards ONLY for QBs (first player from each team)
      [allPlayers[0], allPlayers[3]].forEach((player, idx) => {
        const baseYards = 240 + Math.floor(seededRandom() * 120);
        prizePicksMarkets.push({
          key: marketKey,
          outcomes: [
            { name: 'Over', description: player, price: 100, point: baseYards },
            { name: 'Under', description: player, price: -120, point: baseYards }
          ]
        });
      });
    } else if (marketKey === 'player_rush_yds') {
      [allPlayers[1], allPlayers[4]].forEach((player, idx) => {
        const baseYards = 55 + Math.floor(seededRandom() * 50);
        prizePicksMarkets.push({
          key: marketKey,
          outcomes: [
            { name: 'Over', description: player, price: 100, point: baseYards },
            { name: 'Under', description: player, price: -120, point: baseYards }
          ]
        });
      });
    }
  });

  if (prizePicksMarkets.length > 0) {
    game.bookmakers.push({
      key: 'prizepicks',
      title: 'PrizePicks',
      markets: prizePicksMarkets
    });
  }
}

// odds snapshot (Odds API) - legacy endpoint
app.get("/api/odds-data", enforceUsage, async (req, res) => {
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

// player props (Odds API) - enhanced with stability improvements
app.get("/api/player-props", enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    
    // Accept both param aliases and normalize
    const { sport, sport_key, eventId, game_id, regions = "us", markets = "", bookmakers = "", oddsFormat = "american" } = req.query;
    const normalizedEventId = eventId || game_id;
    const normalizedSport = sport || sport_key;
    
    
    if (!normalizedSport || !normalizedEventId) {
      return res.status(400).json({ 
        error: "Missing sport or eventId",
        detail: "Provide either 'sport' or 'sport_key' AND either 'eventId' or 'game_id'"
      });
    }

    // Use provided markets or default to PLAYER_PROP_MARKETS
    const rawMarkets = markets || PLAYER_PROP_MARKETS.join(',');
    const marketsToFetch = rawMarkets;
    
    // Log warning for unknown markets but don't crash
    if (markets) {
      const requestedMarkets = markets.split(',').map(m => m.trim());
      const unknownMarkets = requestedMarkets.filter(m => !PLAYER_PROP_MARKETS.includes(m));
      if (unknownMarkets.length > 0) {
        console.warn(`[/api/player-props] Unknown markets requested: ${unknownMarkets.join(', ')}`);
      }
    }
    
    // Parse and clamp bookmakers
    let requestedBookmakers = [];
    if (bookmakers) {
      requestedBookmakers = bookmakers.split(',').map(b => b.trim()).filter(Boolean);
    }
    const clampedBookmakers = clampBookmakers(requestedBookmakers);

    console.log(`Player props request: sport=${normalizedSport}, eventId=${normalizedEventId}, markets=${marketsToFetch}, bookmakers=${clampedBookmakers.join(',')}`);

    // Test mode: if eventId is 'test-wrapper', return mock enhanced response
    if (normalizedEventId === 'test-wrapper') {
      const mockData = {
        id: 'test-wrapper',
        sport_key: normalizedSport,
        bookmakers: [
          {
            key: 'draftkings',
            markets: [
              { key: 'player_pass_yds', outcomes: [{ name: 'Over', price: 100 }] }
            ]
          }
        ]
      };
      
      const enhancedResponse = {
        __nonEmpty: true,
        eventId: normalizedEventId,
        sportKey: normalizedSport,
        markets: marketsToFetch.split(','),
        books: ['draftkings'],
        data: mockData
      };
      
      return res.json(enhancedResponse);
    }

    // Primary attempt with requested/focused bookmakers
    let response;
    let finalBookmakers = clampedBookmakers;
    
    try {
      const url = buildEventOddsUrl({
        sportKey: normalizedSport,
        eventId: normalizedEventId,
        apiKey: API_KEY,
        markets: marketsToFetch,
        bookmakers: clampedBookmakers
      });
      
      response = await axiosWithRetry(url);
    } catch (firstError) {
      const status = firstError.response?.status;
      
      // Handle quota/plan limits immediately
      if (status === 402 || status === 429) {
        return res.status(status).json({ 
          error: "TheOddsAPI quota/plan limit hit",
          detail: `HTTP ${status}: ${firstError.response?.data?.message || 'Quota exceeded'}`
        });
      }
      
      // If single bookmaker requested and failed, retry with focused set
      if (requestedBookmakers.length === 1) {
        console.warn(`Single bookmaker '${requestedBookmakers[0]}' failed, retrying with focused set`);
        finalBookmakers = FOCUSED_BOOKMAKERS;
        
        try {
          const urlWithFocused = buildEventOddsUrl({
            sportKey: normalizedSport,
            eventId: normalizedEventId,
            apiKey: API_KEY,
            markets: marketsToFetch,
            bookmakers: FOCUSED_BOOKMAKERS
          });
          
          response = await axiosWithRetry(urlWithFocused);
        } catch (secondError) {
          const secondStatus = secondError.response?.status;
          if (secondStatus === 402 || secondStatus === 429) {
            return res.status(secondStatus).json({ 
              error: "TheOddsAPI quota/plan limit hit",
              detail: `HTTP ${secondStatus}: ${secondError.response?.data?.message || 'Quota exceeded'}`
            });
          }
          
          // Final fallback: no bookmaker filter
          console.warn("Focused set failed, retrying without bookmaker filter");
          finalBookmakers = [];
          
          const urlWithoutBooks = buildEventOddsUrl({
            sportKey: normalizedSport,
            eventId: normalizedEventId,
            apiKey: API_KEY,
            markets: marketsToFetch,
            bookmakers: []
          });
          
          response = await axiosWithRetry(urlWithoutBooks);
        }
      } else {
        throw firstError;
      }
    }

    const data = response.data;
    
    // For individual event endpoints, the response structure is different
    // Check if we have bookmakers with markets containing data
    let hasData = false;
    let actualBooks = [];
    
    if (data && data.bookmakers && Array.isArray(data.bookmakers)) {
      // Filter bookmakers that have markets with actual odds
      const bookersWithData = data.bookmakers.filter(book => 
        book.markets && Array.isArray(book.markets) && book.markets.length > 0
      );
      hasData = bookersWithData.length > 0;
      actualBooks = bookersWithData.map(b => b.key);
    }
    
    // Enhanced response format (always)
    const enhancedResponse = {
      __nonEmpty: hasData,
      eventId: normalizedEventId,
      sportKey: normalizedSport,
      markets: marketsToFetch.split(','),
      books: actualBooks,
      data: data
    };

    // Cache policy: only cache non-empty responses with short TTL
    if (hasData) {
      res.set('Cache-Control', 'public, max-age=5');
    } else {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    res.json(enhancedResponse);
    
  } catch (err) {
    const status = err?.response?.status || 500;
    const msg = err?.response?.data || err.message || "Unknown error";
    console.error("[/api/player-props] upstream error", status, msg);

    // Strict mode: preserve error codes for debugging
    if (req.query.strictErrors === "true") {
      if (status === 402 || status === 429) {
        return res.status(status).json({ error: "TheOddsAPI quota/plan limit hit", detail: msg });
      }
      return res.status(status).json({ error: "Failed to fetch player props", detail: msg });
    }

    // Default: graceful degradation → return wrapper with nonEmpty=false
    const eventId = req.query.eventId || req.query.game_id || null;
    const sportKey = req.query.sport_key || req.query.sport || null;
    const requestedMarkets = req.query.markets ? String(req.query.markets).split(",") : PLAYER_PROP_MARKETS;
    const requestedBookmakers = req.query.bookmakers ? String(req.query.bookmakers).split(",") : FOCUSED_BOOKMAKERS;
    
    return res.status(200).json({
      __nonEmpty: false,
      eventId: eventId,
      sportKey: sportKey,
      markets: requestedMarkets,
      books: requestedBookmakers,
      data: [],
      error: { status, detail: typeof msg === "string" ? msg : JSON.stringify(msg) }
    });
  }
});

// available markets for an event (useful for discovering player props)
app.get("/api/event-markets", enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const { sport, eventId, regions = "us" } = req.query;
    if (!sport || !eventId) return res.status(400).json({ error: "Missing sport or eventId" });

    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/markets?apiKey=${API_KEY}&regions=${regions}&bookmakers=betmgm,betonlineag,betrivers,betus,bovada,williamhill_us,draftkings,fanatics,fanduel,lowvig,mybookieag,espnbet,ballybet,betanysports,betparx,hardrockbet,fliff,rebet,windcreek,betopenly,novig,prophetx,prizepicks,underdog,draftkings_pick6,pointsbet,bet365,unibet`;
    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("event-markets error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: String(err) });
  }
});

/* ---------------------------- ESPN Scores (NFL/NCAAF) ---------------------------- */
/**
 * GET /api/scores?sport=americanfootball_nfl|americanfootball_ncaaf&date=YYYY-MM-DD
 * Returns:
 *  - id, home_team, away_team
 *  - home_logo, away_logo
 *  - home_record, away_record
 *  - home_rank, away_rank
 *  - status ("scheduled" | "in_progress" | "final"), clock
 *  - scores { home, away }
 *  - commence_time (ISO)
 *  - week, season, league ("nfl" | "college-football")
 */
// ---------- Scores (ESPN public JSON; logos, records, ranks, week) ----------
// ---------- Scores (ESPN with logos/records/ranks robust) ----------
app.get("/api/scores", enforceUsage, async (req, res) => {
  try {
    const sport = String(req.query.sport || "americanfootball_nfl").toLowerCase();
    const dateParam = (req.query.date || "").toString().replace(/-/g, "");

    const LEAGUE = {
      americanfootball_nfl: "nfl",
      americanfootball_ncaaf: "college-football",
      basketball_nba: "nba",
      basketball_ncaab: "mens-college-basketball",
      basketball_wnba: "wnba",
      icehockey_nhl: "nhl",
      soccer_epl: "eng.1",
      soccer_uefa_champs_league: "uefa.champions",
      baseball_mlb: "mlb"
    };
    const leagueSlug = LEAGUE[sport] || "nfl";
    
    // Different ESPN API endpoints for different sports
    let baseUrl;
    if (sport.includes("football")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/football/${leagueSlug}/scoreboard`;
    } else if (sport.includes("basketball")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/${leagueSlug}/scoreboard`;
    } else if (sport.includes("hockey")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/hockey/${leagueSlug}/scoreboard`;
    } else if (sport.includes("soccer")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/scoreboard`;
    } else if (sport.includes("baseball")) {
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/${leagueSlug}/scoreboard`;
    } else {
      // Default fallback
      baseUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;
    }

    const axiosOpts = { 
      timeout: 15_000,
      headers: {
        'User-Agent': 'VR-Odds/1.0 (Sports Betting Platform)',
        'Accept': 'application/json'
      }
    };
    // Only add date param for historical data, not for live scores
    if (dateParam && dateParam !== new Date().toISOString().slice(0, 10).replace(/-/g, "")) {
      axiosOpts.params = { dates: dateParam };
    }

    const r = await axios.get(baseUrl, axiosOpts);
    const events = Array.isArray(r.data?.events) ? r.data.events : [];
    const week = r.data?.week?.number ?? r.data?.week ?? null;
    const season = (r.data?.season && (r.data.season.year || r.data.season)) || null;

    // helpers
    const firstLogoFrom = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const raw = arr[0]?.href || arr[0]?.url || arr[0];
      if (!raw) return "";
      try {
        const u = new URL(String(raw));
        if (u.protocol !== "https:") u.protocol = "https:";
        // small, transparent PNG helps consistency
        u.searchParams.set("format", "png");
        u.searchParams.set("bgc", "transparent");
        u.searchParams.set("h", "80");
        return u.toString();
      } catch {
        return String(raw);
      }
    };

    const getLogo = (competitor = {}) => {
      const team = competitor.team || {};
      // Most common: team.logos[]
      let logo =
        firstLogoFrom(team.logos) ||
        (team.logo ? String(team.logo) : "") ||
        // Rare older shape: competitor.logos[]
        firstLogoFrom(competitor.logos);
      return logo || "";
    };

    const getRecord = (competitor = {}) => {
      // Preferred: competitor.records[].summary (ESPN uses this)
      if (Array.isArray(competitor.records) && competitor.records.length) {
        const withSummary = competitor.records.find((x) => x && x.summary);
        if (withSummary?.summary) return String(withSummary.summary);
      }
      if (competitor.recordSummary) return String(competitor.recordSummary);

      // Fallbacks on team:
      const team = competitor.team || {};
      const tRecs = team.records || team.record;
      if (Array.isArray(tRecs) && tRecs.length) {
        const withSummary = tRecs.find((x) => x && x.summary);
        if (withSummary?.summary) return String(withSummary.summary);
      }
      return null;
    };

    const getRank = (competitor = {}) => {
      // College football often uses curatedRank.current
      const curated = competitor.curatedRank?.current;
      if (Number.isFinite(Number(curated))) return Number(curated);

      if (Number.isFinite(Number(competitor.rank))) return Number(competitor.rank);

      const teamRank = competitor.team?.rank;
      if (Number.isFinite(Number(teamRank))) return Number(teamRank);

      return null;
    };

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Enhanced status detection for more accurate live game identification
    const getGameStatus = (event, competition) => {
      const status = event.status || competition.status || {};
      const type = status.type || {};
      
      // More granular status detection
      if (type.completed === true || type.state === 'post') {
        return 'final';
      }
      
      if (type.state === 'in' || status.displayClock) {
        return 'in_progress';
      }
      
      if (type.state === 'pre' || new Date(event.date) > new Date()) {
        return 'scheduled';
      }
      
      // Only mark as in_progress if explicitly indicated by ESPN status
      // Don't use fallback logic that could incorrectly mark games as live
      return 'scheduled';
    };

    const statusTuple = (e, comp) => {
      const st = e.status || comp.status || {};
      const t = st.type || {};
      const status = t.completed ? "final" : (t.state === "in" ? "in_progress" : "scheduled");
      const clock =
        (t.state === "in" ? (t.shortDetail || t.detail) : (t.state === "pre" ? "" : t.shortDetail)) ||
        (status === "final" ? "Final" : "");
      return { status, clock };
    };

    const games = events.map((e) => {
      const comp = Array.isArray(e.competitions) ? e.competitions[0] : e.competitions || {};
      const competitors = Array.isArray(comp?.competitors) ? comp.competitors : [];

      const home = competitors.find((c) => c.homeAway === "home") || {};
      const away = competitors.find((c) => c.homeAway === "away") || {};

      const homeTeam = home.team || {};
      const awayTeam = away.team || {};

      const homeName = homeTeam.displayName || homeTeam.name || "Home";
      const awayName = awayTeam.displayName || awayTeam.name || "Away";

      const home_logo = getLogo(home);
      const away_logo = getLogo(away);

      const home_record = getRecord(home);
      const away_record = getRecord(away);

      const home_rank = getRank(home);
      const away_rank = getRank(away);

      const homeScore = toNum(home.score);
      const awayScore = toNum(away.score);

      const { status, clock } = statusTuple(e, comp);
      const enhancedStatus = getGameStatus(e, comp);
      
      // Enhanced clock information for live games
      let enhancedClock = clock;
      if (enhancedStatus === 'in_progress') {
        const statusType = e.status?.type || comp.status?.type || {};
        enhancedClock = statusType.displayClock || 
                       statusType.shortDetail || 
                       statusType.detail || 
                       clock || 
                       'Live';
      }

      // ESPN sometimes includes odds; keep if present
      let vegasLine = null;
      let overUnder = null;
      let provider = "ESPN";
      if (Array.isArray(comp.odds) && comp.odds.length) {
        const o = comp.odds[0];
        if (o?.spread) vegasLine = o.spread;
        if (o?.overUnder != null) overUnder = toNum(o.overUnder);
        if (o?.details) provider = o.details;
      }

      return {
        id: e.id || comp.id || `${awayName}-${homeName}-${e.date}`,
        sport_key: sport,
        home_team: homeName,
        away_team: awayName,
        home_logo,
        away_logo,
        home_record,
        away_record,
        home_rank,
        away_rank,
        commence_time: e.date,
        status: enhancedStatus,
        scores: { home: homeScore ?? 0, away: awayScore ?? 0 },
        clock: enhancedClock,
        // Enhanced live game metadata
        completed: enhancedStatus === 'final',
        live: enhancedStatus === 'in_progress' && 
              (homeScore > 0 || awayScore > 0) && 
              new Date(e.date) <= new Date(),
        period: e.status?.period || comp.status?.period || null,
        situation: e.status?.type?.situation || null,
        week: r.data?.week?.number ?? r.data?.week ?? null,
        season: (r.data?.season && (r.data.season.year || r.data.season)) || null,
        league: leagueSlug,
        odds:
          vegasLine || overUnder != null
            ? { spread: vegasLine, overUnder, provider }
            : null,
      };
    });

    // Enhanced sorting: Live games first, then upcoming by time, then completed by time desc
    games.sort((a, b) => {
      // Prioritize live games
      if (a.live && !b.live) return -1;
      if (!a.live && b.live) return 1;
      
      // Among live games, sort by commence time
      if (a.live && b.live) {
        return new Date(a.commence_time) - new Date(b.commence_time);
      }
      
      // Among non-live games, upcoming first, then completed
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;
      
      // Within same category, sort by time (upcoming: asc, completed: desc)
      const timeA = new Date(a.commence_time);
      const timeB = new Date(b.commence_time);
      
      return a.completed ? timeB - timeA : timeA - timeB;
    });

    // Dynamic cache control based on live games
    const hasLiveGames = games.some(g => g.live);
    const cacheMaxAge = hasLiveGames ? 15 : 60; // 15s for live games, 60s for others
    res.set("Cache-Control", `public, max-age=${cacheMaxAge}`);
    
    // Add live games count to response headers for client optimization
    res.set("X-Live-Games-Count", games.filter(g => g.live).length.toString());
    res.json(games);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("scores (espn) error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: "scores_espn_failed", detail: err?.response?.data || err.message });
  }
});

/* ------------------------------------ Game Reactions ------------------------------------ */

// Persistent file-based storage for reactions (better than in-memory)
const fs = require('fs');
const path = require('path');

const REACTIONS_FILE = path.join(__dirname, 'reactions.json');

// Load reactions from file on startup
let gameReactions = new Map();
try {
  if (fs.existsSync(REACTIONS_FILE)) {
    const data = fs.readFileSync(REACTIONS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    gameReactions = new Map(Object.entries(parsed));
    console.log(`📝 Loaded ${gameReactions.size} game reactions from file`);
  }
} catch (error) {
  console.warn('⚠️ Failed to load reactions from file:', error.message);
  gameReactions = new Map();
}

// Save reactions to file
function saveReactions() {
  try {
    const data = Object.fromEntries(gameReactions);
    fs.writeFileSync(REACTIONS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Failed to save reactions to file:', error.message);
  }
}

// Get reactions for a specific game
app.get('/api/reactions/:gameKey', enforceUsage, (req, res) => {
  try {
    const { gameKey } = req.params;
    const reactions = gameReactions.get(gameKey) || {};
    res.json({ reactions });
  } catch (err) {
    console.error('Get reactions error:', err);
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

// Add or update a reaction
app.post('/api/reactions/:gameKey', (req, res) => {
  try {
    const { gameKey } = req.params;
    const { userId, username, emoji, action } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ error: 'Missing userId or emoji' });
    }

    let reactions = gameReactions.get(gameKey) || {};

    if (action === 'remove') {
      // Remove user's reaction
      Object.keys(reactions).forEach(reactionEmoji => {
        reactions[reactionEmoji] = reactions[reactionEmoji]?.filter(
          user => user.userId !== userId
        ) || [];
        if (reactions[reactionEmoji].length === 0) {
          delete reactions[reactionEmoji];
        }
      });
    } else {
      // Remove user's previous reaction first
      Object.keys(reactions).forEach(reactionEmoji => {
        reactions[reactionEmoji] = reactions[reactionEmoji]?.filter(
          user => user.userId !== userId
        ) || [];
        if (reactions[reactionEmoji].length === 0) {
          delete reactions[reactionEmoji];
        }
      });

      // Add new reaction
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      const existingUser = reactions[emoji].find(user => user.userId === userId);
      if (!existingUser) {
        reactions[emoji].push({
          userId,
          username: username || 'Anonymous',
          timestamp: Date.now()
        });
      }
    }

    gameReactions.set(gameKey, reactions);
    saveReactions(); // Persist to file
    res.json({ reactions });
  } catch (err) {
    console.error('Add reaction error:', err);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Get all reactions summary (for analytics)
app.get('/api/reactions-summary', (req, res) => {
  try {
    const summary = {};
    gameReactions.forEach((reactions, gameKey) => {
      const totalReactions = Object.values(reactions).reduce(
        (sum, users) => sum + users.length, 0
      );
      if (totalReactions > 0) {
        summary[gameKey] = {
          totalReactions,
          reactions: Object.keys(reactions).reduce((acc, emoji) => {
            acc[emoji] = reactions[emoji].length;
            return acc;
          }, {})
        };
      }
    });
    res.json({ summary });
  } catch (err) {
    console.error('Get reactions summary error:', err);
    res.status(500).json({ error: 'Failed to get reactions summary' });
  }
});


/* ------------------------------------ Start ------------------------------------ */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
