// server/index.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ODDS_API_KEY;
const SPORTSGAMEODDS_API_KEY = process.env.SPORTSGAMEODDS_API_KEY || null;

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
      'https://oddssightseer.com'
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    hasOddsAPI: !!API_KEY,
    hasSportsGameOddsAPI: !!SPORTSGAMEODDS_API_KEY
  });
});

/* ------------------------------------ Helpers ------------------------------------ */

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function firstLogo(teamObj) {
  try {
    // Most ESPN team objects: team.logos = [{ href, ...}, ...]
    const logos = teamObj?.logos || teamObj?.team?.logos || [];
    const href = Array.isArray(logos) ? logos[0]?.href : null;
    if (!href) return null;

    // Prefer transparent PNG with a reasonable height
    const u = new URL(href);
    u.searchParams.set("format", "png");
    u.searchParams.set("bgc", "transparent");
    u.searchParams.set("h", "80");
    return u.toString();
  } catch {
    return null;
  }
}

function recordText(teamObj) {
  // e.g., team.record.items[0].summary -> "10-2", or displayValue
  const rec = teamObj?.record?.items?.[0];
  return rec?.summary || rec?.displayValue || null;
}

function rankNum(teamObj) {
  // NCAAF/NFL sometimes include rank fields
  return teamObj?.rank ?? teamObj?.rankings?.[0]?.rank ?? null;
}

function normalizeStatusFromEspn(typeObj) {
  // ESPN: type.state ∈ "pre" | "in" | "post"; type.completed boolean
  if (!typeObj) return "scheduled";
  if (typeObj.completed) return "final";
  if (typeObj.state === "in") return "in_progress";
  return "scheduled";
}

/* ------------------------------------ Routes ------------------------------------ */

// health
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// sports list (Odds API)
app.get("/api/sports", async (_req, res) => {
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
app.get("/api/events", async (req, res) => {
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
app.get("/api/odds", async (req, res) => {
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
          const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${marketsToFetch.join(',')}&oddsFormat=${oddsFormat}&bookmakers=betmgm,betonlineag,betrivers,betus,bovada,williamhill_us,draftkings,fanatics_us,fanduel,lowvig,mybookieag,espnbet,pointsbetau,unibet_us,betfred_us,hardrockbet,fliff,superdraft,prizepicks`;
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
          const eventUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(game.sport_key)}/events/${encodeURIComponent(game.id)}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${playerPropMarkets.join(',')}&oddsFormat=${oddsFormat}&bookmakers=betmgm,betonlineag,betrivers,betus,bovada,williamhill_us,draftkings,fanatics_us,fanduel,lowvig,mybookieag,espnbet,pointsbetau,unibet_us,betfred_us,hardrockbet,fliff,superdraft,prizepicks`;
          console.log(`Fetching props for game ${game.id}:`, eventUrl);
          
          const propResponse = await axios.get(eventUrl);
          const propData = propResponse.data;
          
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
app.get("/api/odds-data", async (req, res) => {
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

// player props (Odds API) - enhanced with market discovery
app.get("/api/player-props", async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const { sport, eventId, regions = "us", markets = "", oddsFormat = "american" } = req.query;
    if (!sport || !eventId) return res.status(400).json({ error: "Missing sport or eventId" });

    // If no specific markets requested, get available markets first
    let marketsToFetch = markets;
    if (!markets) {
      try {
        const marketsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/markets?apiKey=${API_KEY}&regions=${regions}&bookmakers=betmgm,betonlineag,betrivers,betus,bovada,williamhill_us,draftkings,fanatics_us,fanduel,lowvig,mybookieag,espnbet,pointsbetau,unibet_us,betfred_us,hardrockbet,fliff,superdraft,prizepicks`;
        const marketsResp = await axios.get(marketsUrl);
        
        // Extract player prop markets (typically contain "player" in the key)
        const playerPropMarkets = [];
        if (marketsResp.data && marketsResp.data.bookmakers) {
          marketsResp.data.bookmakers.forEach(book => {
            if (book.markets) {
              book.markets.forEach(market => {
                if (market.includes('player') || market.includes('prop')) {
                  playerPropMarkets.push(market);
                }
              });
            }
          });
        }
        
        if (playerPropMarkets.length > 0) {
          marketsToFetch = [...new Set(playerPropMarkets)].join(',');
        }
      } catch (marketsErr) {
        console.warn("Failed to fetch available markets, using default player prop markets");
        // Common player prop markets for different sports
        const defaultPlayerProps = {
          'americanfootball_nfl': 'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds',
          'basketball_nba': 'player_points,player_rebounds,player_assists,player_threes,player_blocks,player_steals',
          'baseball_mlb': 'player_home_runs,player_hits,player_total_bases,player_rbis,player_runs_scored',
          'icehockey_nhl': 'player_points,player_goals,player_assists,player_shots_on_goal'
        };
        marketsToFetch = defaultPlayerProps[sport] || '';
      }
    }

    if (!marketsToFetch) {
      return res.json({ message: "No player prop markets available for this event", bookmakers: [] });
    }

    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/odds?apiKey=${API_KEY}&regions=${regions}&oddsFormat=${oddsFormat}&markets=${marketsToFetch}&bookmakers=betmgm,betonlineag,betrivers,betus,bovada,williamhill_us,draftkings,fanatics_us,fanduel,lowvig,mybookieag,espnbet,pointsbetau,unibet_us,betfred_us,hardrockbet,fliff,superdraft,prizepicks`;

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("player-props error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: String(err) });
  }
});

// available markets for an event (useful for discovering player props)
app.get("/api/event-markets", async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const { sport, eventId, regions = "us" } = req.query;
    if (!sport || !eventId) return res.status(400).json({ error: "Missing sport or eventId" });

    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/markets?apiKey=${API_KEY}&regions=${regions}&bookmakers=betmgm,betonlineag,betrivers,betus,bovada,williamhill_us,draftkings,fanatics_us,fanduel,lowvig,mybookieag,espnbet,pointsbetau,unibet_us,betfred_us,hardrockbet,fliff,superdraft,prizepicks`;
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
app.get("/api/scores", async (req, res) => {
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

// In-memory storage for reactions (in production, use a database)
const gameReactions = new Map();

// Get reactions for a specific game
app.get('/api/reactions/:gameKey', (req, res) => {
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
