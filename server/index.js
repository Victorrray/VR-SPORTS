// server/index.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ODDS_API_KEY || null;

if (!API_KEY) {
  console.warn("⚠️  Missing ODDS_API_KEY in .env (odds endpoints will still work for ESPN scores).");
}

app.use(cors());
app.use(express.json());


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
    const allGames = [];
    
    // Fetch odds for each sport
    for (const sport of sportsArray) {
      try {
        const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport.trim())}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
        const r = await axios.get(url);
        const games = Array.isArray(r.data) ? r.data : [];
        allGames.push(...games);
      } catch (sportErr) {
        console.warn(`Failed to fetch odds for sport ${sport}:`, sportErr.message);
        // Continue with other sports instead of failing completely
      }
    }
    
    res.json(allGames);
  } catch (err) {
    console.error("odds error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});

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
        const marketsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/markets?apiKey=${API_KEY}&regions=${regions}`;
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

    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/odds?apiKey=${API_KEY}&regions=${regions}&oddsFormat=${oddsFormat}&markets=${marketsToFetch}`;

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

    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/markets?apiKey=${API_KEY}&regions=${regions}`;
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

    const axiosOpts = { timeout: 15_000 };
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
        status,
        scores: { home: homeScore ?? 0, away: awayScore ?? 0 },
        clock,
        week: r.data?.week?.number ?? r.data?.week ?? null,
        season: (r.data?.season && (r.data.season.year || r.data.season)) || null,
        league: leagueSlug,
        odds:
          vegasLine || overUnder != null
            ? { spread: vegasLine, overUnder, provider }
            : null,
      };
    });

    games.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

    res.set("Cache-Control", "public, max-age=30");
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
