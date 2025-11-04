/**
 * Sports Routes
 * Endpoints for sports data, events, participants, and scores
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireUser, checkPlanAccess, enforceUsage } = require('../middleware/auth');
const { getCacheKey, getCachedResponse, setCachedResponse } = require('../services/cache');
const { API_KEY } = require('../config/constants');

/**
 * GET /api/sports
 * Returns list of available sports with Supabase caching
 * Also fetches NCAA team logos from ESPN
 */
router.get('/sports', requireUser, checkPlanAccess, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    // Step 1: Try to get sports from Supabase cache
    if (supabase) {
      try {
        const { data: cachedSports, error: cacheError } = await supabase
          .rpc('get_active_sports');
        
        if (!cacheError && cachedSports && cachedSports.length > 0) {
          console.log(`📦 Returning ${cachedSports.length} sports from Supabase cache`);
          return res.json(cachedSports);
        }
        
        if (cacheError) {
          console.warn('⚠️ Supabase cache error:', cacheError.message);
        }
      } catch (supabaseErr) {
        console.warn('⚠️ Supabase query failed:', supabaseErr.message);
      }
    }
    
    // Step 2: If no Supabase cache, check memory cache
    const cacheKey = getCacheKey('sports', {});
    const memoryCached = getCachedResponse(cacheKey);
    
    if (memoryCached) {
      console.log('📦 Using memory cached sports list');
      return res.json(memoryCached);
    }
    
    // Step 3: If no API key, return fallback sports list
    if (!API_KEY) {
      const fallbackSports = [
        // Major US Sports
        { key: "americanfootball_nfl", title: "NFL", active: true, group: "Major US Sports" },
        { key: "americanfootball_ncaaf", title: "NCAAF", active: true, group: "Major US Sports" },
        { key: "basketball_nba", title: "NBA", active: true, group: "Major US Sports" },
        { key: "basketball_ncaab", title: "NCAAB", active: true, group: "Major US Sports" },
        { key: "icehockey_nhl", title: "NHL", active: true, group: "Major US Sports" },
        
        // Soccer
        { key: "soccer_epl", title: "EPL", active: true, group: "Soccer" },
        { key: "soccer_uefa_champs_league", title: "Champions League", active: true, group: "Soccer" },
        { key: "soccer_mls", title: "MLS", active: true, group: "Soccer" },
        
        // Combat Sports
        { key: "mma_mixed_martial_arts", title: "MMA", active: true, group: "Combat Sports" },
        { key: "boxing_boxing", title: "Boxing", active: true, group: "Combat Sports" }
      ];
      console.log('🧪 Returning fallback sports list - API key not configured');
      return res.json(fallbackSports);
    }
    
    // Step 4: Fetch from The Odds API and update Supabase cache
    console.log('🌐 Fetching sports list from The Odds API');
    const url = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
    const response = await axios.get(url);
    
    // Filter unwanted sports
    const excludedSports = [
      'baseball_mlb', // MLB is out of season - completely delisted
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
    
    const filteredSports = response.data.filter(sport => {
      if (excludedSports.includes(sport.key)) return false;
      if (lessPopularLeagues.some(league => sport.key.startsWith(league))) return false;
      return true;
    });
    
    // Step 4b: Fetch NCAA team logos from ESPN (for college football)
    console.log('🏈 Fetching NCAA football team logos from ESPN');
    let ncaaTeamLogos = {};
    try {
      const ncaaResponse = await axios.get(
        'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams',
        { timeout: 10000 }
      );
      
      if (ncaaResponse.data?.sports?.[0]?.leagues?.[0]?.teams) {
        const teams = ncaaResponse.data.sports[0].leagues[0].teams;
        teams.forEach(teamWrapper => {
          const team = teamWrapper.team;
          if (team && team.id && team.logos && team.logos.length > 0) {
            ncaaTeamLogos[team.id] = {
              id: team.id,
              name: team.displayName || team.name,
              abbreviation: team.abbreviation,
              logo: team.logos[0].href,
              color: team.color,
              alternateColor: team.alternateColor
            };
          }
        });
        console.log(`✅ Fetched ${Object.keys(ncaaTeamLogos).length} NCAA team logos`);
      }
    } catch (ncaaErr) {
      console.warn('⚠️ Failed to fetch NCAA team logos:', ncaaErr.message);
    }
    
    // MLB is out of season - skip team logos fetching
    let mlbTeamLogos = {};
    
    // Step 4d: Fetch NHL team logos from ESPN (for hockey)
    console.log('🏒 Fetching NHL team logos from ESPN');
    let nhlTeamLogos = {};
    try {
      const nhlResponse = await axios.get(
        'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams',
        { timeout: 10000 }
      );
      
      if (nhlResponse.data?.sports?.[0]?.leagues?.[0]?.teams) {
        const teams = nhlResponse.data.sports[0].leagues[0].teams;
        teams.forEach(teamWrapper => {
          const team = teamWrapper.team;
          if (team && team.id && team.logos && team.logos.length > 0) {
            nhlTeamLogos[team.id] = {
              id: team.id,
              name: team.displayName || team.name,
              abbreviation: team.abbreviation,
              logo: team.logos[0].href,
              color: team.color,
              alternateColor: team.alternateColor
            };
          }
        });
        console.log(`✅ Fetched ${Object.keys(nhlTeamLogos).length} NHL team logos`);
      }
    } catch (nhlErr) {
      console.warn('⚠️ Failed to fetch NHL team logos:', nhlErr.message);
    }
    
    // Step 5: Update Supabase cache
    if (supabase) {
      try {
        for (const sport of filteredSports) {
          await supabase.rpc('refresh_sports_cache', {
            p_sport_key: sport.key,
            p_title: sport.title,
            p_group_name: sport.group || null,
            p_active: sport.active !== false
          });
        }
        console.log(`✅ Updated ${filteredSports.length} sports in Supabase cache`);
      } catch (updateErr) {
        console.warn('⚠️ Failed to update Supabase cache:', updateErr.message);
      }
    }
    
    // Step 6: Update memory cache
    const sportsWithLogos = {
      sports: filteredSports,
      ncaaTeamLogos: ncaaTeamLogos,
      mlbTeamLogos: mlbTeamLogos,
      nhlTeamLogos: nhlTeamLogos
    };
    setCachedResponse(cacheKey, sportsWithLogos);
    
    res.json(sportsWithLogos);
  } catch (err) {
    console.error("sports error:", err?.response?.status, err?.response?.data || err.message);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /api/events
 * Returns events for a specific sport (cached)
 */
router.get('/events', enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const { sport } = req.query;
    if (!sport) return res.status(400).json({ error: "Missing sport" });
    
    // Check cache first
    const cacheKey = getCacheKey('events', { sport });
    const cachedEvents = getCachedResponse(cacheKey);
    
    if (cachedEvents) {
      console.log(`📦 Using cached events for ${sport}`);
      return res.json(cachedEvents);
    }
    
    console.log(`🌐 API call for events: ${sport}`);
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events?apiKey=${API_KEY}`;
    const r = await axios.get(url);
    const events = Array.isArray(r.data) ? r.data : (r.data ? Object.values(r.data) : []);
    
    setCachedResponse(cacheKey, events);
    res.json(events);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("events error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: String(err) });
  }
});

/**
 * GET /api/events/:sport/:eventId/markets
 * Returns available markets for a specific event
 */
router.get('/events/:sport/:eventId/markets', requireUser, async (req, res) => {
  try {
    const { sport, eventId } = req.params;
    const { regions = 'us' } = req.query;
    
    if (!API_KEY) {
      return res.status(400).json({ 
        code: 'MISSING_ENV', 
        message: "Missing ODDS_API_KEY", 
        hint: 'Set ODDS_API_KEY in backend env' 
      });
    }
    
    // Check cache first (cache for 5 minutes)
    const cacheKey = getCacheKey('event-markets', { sport, eventId, regions });
    const cached = getCachedResponse(cacheKey);
    
    if (cached) {
      console.log(`📦 Using cached markets for event ${eventId}`);
      return res.json(cached);
    }
    
    console.log(`🌐 Fetching available markets for event ${eventId} (costs 1 credit)`);
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/markets?apiKey=${API_KEY}&regions=${regions}`;
    
    const response = await axios.get(url, { timeout: 7000 });
    const data = response.data;
    
    // Cache for 5 minutes
    setCachedResponse(cacheKey, data);
    
    console.log(`✅ Retrieved markets for event ${eventId}:`, data.bookmakers?.map(b => ({
      bookmaker: b.key,
      marketCount: b.markets?.length || 0,
      markets: b.markets?.map(m => m.key) || []
    })));
    
    res.json(data);
    
  } catch (error) {
    console.error('Error fetching event markets:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      hint: 'Failed to fetch event markets from The Odds API'
    });
  }
});

/**
 * GET /api/participants/:sport
 * Returns list of teams/players for a sport (FREE - doesn't count against quota)
 */
router.get('/participants/:sport', requireUser, async (req, res) => {
  try {
    const { sport } = req.params;
    
    if (!API_KEY) {
      return res.status(400).json({ 
        code: 'MISSING_ENV', 
        message: "Missing ODDS_API_KEY", 
        hint: 'Set ODDS_API_KEY in backend env' 
      });
    }
    
    // Check cache first (cache for 24 hours since participants don't change often)
    const cacheKey = getCacheKey('participants', { sport });
    const cached = getCachedResponse(cacheKey);
    
    if (cached) {
      console.log(`📦 Using cached participants for ${sport}`);
      return res.json(cached);
    }
    
    console.log(`🌐 Fetching participants for ${sport} (FREE - no quota cost)`);
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/participants?apiKey=${API_KEY}`;
    
    const response = await axios.get(url, { timeout: 7000 });
    const participants = response.data;
    
    // Cache for 24 hours (86400000 ms)
    setCachedResponse(cacheKey, participants);
    
    console.log(`✅ Retrieved ${participants.length} participants for ${sport}`);
    res.json(participants);
    
  } catch (error) {
    console.error('Error fetching participants:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      hint: 'Failed to fetch participants from The Odds API'
    });
  }
});

/**
 * GET /api/scores
 * Returns scores from ESPN with logos, records, and rankings
 */
router.get('/scores', enforceUsage, async (req, res) => {
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
      soccer_uefa_champs_league: "uefa.champions"
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

    // Helper functions
    const firstLogoFrom = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const raw = arr[0]?.href || arr[0]?.url || arr[0];
      if (!raw) return "";
      try {
        const u = new URL(String(raw));
        if (u.protocol !== "https:") u.protocol = "https:";
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
      let logo =
        firstLogoFrom(team.logos) ||
        (team.logo ? String(team.logo) : "") ||
        firstLogoFrom(competitor.logos);
      return logo || "";
    };

    const getRecord = (competitor = {}) => {
      if (Array.isArray(competitor.records) && competitor.records.length) {
        const withSummary = competitor.records.find((x) => x && x.summary);
        if (withSummary?.summary) return String(withSummary.summary);
      }
      if (competitor.recordSummary) return String(competitor.recordSummary);

      const team = competitor.team || {};
      const tRecs = team.records || team.record;
      if (Array.isArray(tRecs) && tRecs.length) {
        const withSummary = tRecs.find((x) => x && x.summary);
        if (withSummary?.summary) return String(withSummary.summary);
      }
      return null;
    };

    const getRank = (competitor = {}) => {
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

    const getGameStatus = (event, competition) => {
      const status = event.status || competition.status || {};
      const type = status.type || {};
      
      if (type.completed === true || type.state === 'post') {
        return 'final';
      }
      
      if (type.state === 'in' || status.displayClock) {
        return 'in_progress';
      }
      
      if (type.state === 'pre' || new Date(event.date) > new Date()) {
        return 'scheduled';
      }
      
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
      
      let enhancedClock = clock;
      if (enhancedStatus === 'in_progress') {
        const statusType = e.status?.type || comp.status?.type || {};
        enhancedClock = statusType.displayClock || 
                       statusType.shortDetail || 
                       statusType.detail || 
                       clock || 
                       'Live';
      }

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
        id: e.id,
        date: e.date,
        home_team: homeName,
        away_team: awayName,
        home_score: homeScore,
        away_score: awayScore,
        home_logo,
        away_logo,
        home_record,
        away_record,
        home_rank,
        away_rank,
        status: enhancedStatus,
        clock: enhancedClock,
        vegas_line: vegasLine,
        over_under: overUnder,
        provider
      };
    });

    res.json({
      sport,
      week,
      season,
      games
    });
  } catch (err) {
    console.error("scores error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});

module.exports = router;
