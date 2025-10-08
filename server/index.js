// server/index.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

// Import usage configuration
const { FREE_QUOTA } = require("./config/usage.js");

// Initialize Stripe after dotenv loads
const Stripe = require("stripe");
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Initialize Supabase client for server operations
const { createClient } = require('@supabase/supabase-js');
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Initialize Odds Cache Service
const oddsCacheService = require('./services/oddsCache');
if (supabase) {
  oddsCacheService.initialize(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const app = express();

// Increase header size limits to prevent 431 errors
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ODDS_API_KEY;
const SPORTSGAMEODDS_API_KEY = process.env.SPORTSGAMEODDS_API_KEY || null;
const PLAYER_PROPS_API_BASE = process.env.PLAYER_PROPS_API_BASE || null;
const ENABLE_PLAYER_PROPS_V2 = process.env.ENABLE_PLAYER_PROPS_V2 === 'true';
const PLAYER_PROPS_CACHE_TTL_MS = Number(process.env.PLAYER_PROPS_CACHE_TTL_MS || 30_000);
const PLAYER_PROPS_RETRY_ATTEMPTS = Number(process.env.PLAYER_PROPS_RETRY_ATTEMPTS || 2);
const PLAYER_PROPS_MAX_MARKETS_PER_REQUEST = Number(process.env.PLAYER_PROPS_MAX_MARKETS || 25);
const PLAYER_PROPS_MAX_BOOKS_PER_REQUEST = Number(process.env.PLAYER_PROPS_MAX_BOOKS || 25);
const PLAYER_PROPS_REQUEST_TIMEOUT = Number(process.env.PLAYER_PROPS_REQUEST_TIMEOUT || 15000); // 15 seconds
const PLAYER_PROPS_MAX_CACHE_ENTRIES = Number(process.env.PLAYER_PROPS_MAX_CACHE_ENTRIES || 50);

// Known invalid markets that should be filtered out
const INVALID_PLAYER_PROP_MARKETS = [
  'player_2_plus_tds',
  'player_receiving_yds',
  'player_receiving_tds', 
  'player_receiving_longest'
];

// Function to filter out invalid markets
function filterValidMarkets(markets) {
  return markets.filter(market => !INVALID_PLAYER_PROP_MARKETS.includes(market));
}

// Stripe configuration
const STRIPE_PRICE_GOLD = process.env.STRIPE_PRICE_GOLD || process.env.STRIPE_PRICE_PLATINUM; // Backward compatibility
const STRIPE_PRICE_PLATINUM = process.env.STRIPE_PRICE_PLATINUM || process.env.STRIPE_PRICE_GOLD; // Backward compatibility
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// In-memory storage for usage tracking (replace with Supabase in production)
const userUsage = new Map(); // user_id -> { period_start, period_end, calls_made }
// userPlans removed - now using Supabase exclusively for plan management

// Constants for improved player props stability and COST REDUCTION
const FOCUSED_BOOKMAKERS = [
  // DFS apps for player props (prioritized for slice limit)
  "prizepicks", "underdog", "pick6", "dabble_au",
  // Sharp books and exchanges (high priority)
  "pinnacle", "prophet_exchange", "rebet",
  // US region books
  "draftkings", "fanduel", "betmgm", "caesars", "pointsbet", "bovada", 
  "mybookie", "betonline", "unibet", "betrivers", "novig", "fliff",
  "hardrock", "espnbet", "fanatics", "wynnbet", "superbook", "twinspires",
  "betfred_us", "circasports", "lowvig", "barstool", "foxbet",
  // Other exchange books
  "betopenly", "prophetx"
];

// Trial user bookmaker restrictions (expanded to include all major sportsbooks and DFS apps for player props)
const TRIAL_BOOKMAKERS = [
  // DFS apps for player props (prioritized for slice limit)
  "prizepicks", "underdog", "pick6", "dabble_au",
  // Sharp books and exchanges (high priority)
  "pinnacle", "prophet_exchange", "rebet",
  // Major sportsbooks
  "draftkings", "fanduel", "caesars", "betmgm", "pointsbet", "betrivers", 
  "unibet", "bovada", "betonline", "fliff", "hardrock", "novig", "wynnbet",
  "espnbet", "fanatics", "betopenly", "prophetx"
];

// Player props completely removed

const MAX_BOOKMAKERS = 20; // Increased to accommodate more sportsbooks and DFS apps for player props
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for regular markets
const PLAYER_PROPS_CACHE_DURATION_MS = 90 * 1000; // 90 seconds for player props (DFS markets close quickly)
const ALTERNATE_MARKETS_CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes for alternate markets

// List of alternate markets that change less frequently
const ALTERNATE_MARKETS = [
  'alternate_spreads',
  'alternate_totals',
  'team_totals',
  'alternate_team_totals'
];

// List of player prop markets that need faster refresh
const PLAYER_PROP_MARKETS = [
  'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts',
  'player_rush_yds', 'player_rush_tds', 'player_rush_attempts',
  'player_receptions', 'player_reception_yds', 'player_reception_tds',
  'player_points', 'player_rebounds', 'player_assists', 'player_threes',
  'player_strikeouts', 'player_hits', 'player_total_bases', 'player_rbis'
];

// In-memory cache for API responses
const apiCache = new Map();
const planCache = new Map();
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const playerPropsCache = new Map(); // key -> { payload, timestamp, stale }
const playerPropsInFlight = new Map(); // key -> Promise
const playerPropsMetrics = {
  requests: 0,
  cacheHits: 0,
  staleHits: 0,
  cacheMisses: 0,
  vendorErrors: 0,
  vendorDurations: [],
  droppedOutcomes: 0,
  notModifiedHits: 0,
};

const DEFAULT_BOOK_STATE = (process.env.DEFAULT_BOOK_STATE || 'nj').toLowerCase();

function setPlayerPropsCacheEntry(key, entry) {
  if (!playerPropsCache.has(key) && playerPropsCache.size >= PLAYER_PROPS_MAX_CACHE_ENTRIES) {
    let oldestKey = null;
    let oldestTs = Infinity;
    for (const [cacheKey, cacheValue] of playerPropsCache.entries()) {
      if (cacheValue.timestamp < oldestTs) {
        oldestKey = cacheKey;
        oldestTs = cacheValue.timestamp;
      }
    }
    if (oldestKey) {
      playerPropsCache.delete(oldestKey);
    }
  }
  playerPropsCache.set(key, entry);
}

console.log('[player-props] flag:', ENABLE_PLAYER_PROPS_V2, 'default_state:', DEFAULT_BOOK_STATE);

function getCacheKey(endpoint, params) {
  return `${endpoint}_${JSON.stringify(params)}`;
}

const PLAYER_PROPS_TIMEZONE = process.env.PLAYER_PROPS_TIMEZONE || 'America/New_York';

const PLAYER_PROPS_MARKET_MAP = {
  player_reception_yds: 'player_receiving_yards',
  player_reception_yards: 'player_receiving_yards',
  player_receptions: 'player_receptions',
  player_receptions_alternate: 'player_receptions_alternate',
  player_pass_yds: 'player_passing_yards',
  player_pass_yards: 'player_passing_yards',
  player_pass_tds: 'player_passing_touchdowns',
  player_pass_td: 'player_passing_touchdowns',
  player_rush_yds: 'player_rushing_yards',
  player_rush_yards: 'player_rushing_yards',
  player_rush_attempts: 'player_rushing_attempts',
  player_rush_attempts_alternate: 'player_rushing_attempts_alternate',
  player_receive_yards: 'player_receiving_yards',
  player_receiving_yards: 'player_receiving_yards',
  player_receiving_yards_alternate: 'player_receiving_yards_alternate',
  player_receiving_receptions: 'player_receptions',
  player_points: 'player_points',
  player_points_alternate: 'player_points_alternate',
  player_assists: 'player_assists',
  player_assists_alternate: 'player_assists_alternate',
  player_rebounds: 'player_rebounds',
  player_rebounds_alternate: 'player_rebounds_alternate',
  player_threes: 'player_three_pointers_made',
  player_threes_alternate: 'player_three_pointers_made_alternate',
  player_total_bases: 'player_total_bases',
  player_total_bases_alternate: 'player_total_bases_alternate',
  player_strikeouts: 'player_strikeouts',
  player_strikeouts_alternate: 'player_strikeouts_alternate',
  player_points_rebounds_assists: 'player_points_rebounds_assists',
  player_points_rebounds_assists_alternate: 'player_points_rebounds_assists_alternate',
  player_anytime_td: 'player_anytime_touchdown',
  player_anytime_touchdown: 'player_anytime_touchdown',
  player_anytime_td_alternate: 'player_anytime_touchdown_alternate',
  player_anytime_touchdown_alternate: 'player_anytime_touchdown_alternate',
  player_combined_tackles: 'player_combined_tackles',
  player_combined_tackles_assists: 'player_combined_tackles',
  player_assists_plus_points: 'player_points_assists',
  player_points_assists: 'player_points_assists',
  player_rush_receive_yds: 'player_rush_receive_yards',
  player_rush_receive_yards: 'player_rush_receive_yards',
  player_rush_receive_yds_alternate: 'player_rush_receive_yards_alternate',
  player_rush_receive_yards_alternate: 'player_rush_receive_yards_alternate',
  player_pass_completions: 'player_pass_completions',
  player_pass_attempts: 'player_pass_attempts',
  player_pass_longest_completion: 'player_pass_longest_completion',
  player_reception_longest: 'player_reception_longest',
  player_rush_attempts_longest: 'player_rush_longest',
  player_rush_longest: 'player_rush_longest',
};

const DEFAULT_PLAYER_PROP_MARKETS = {
  americanfootball_nfl: [
    'player_passing_yards',
    'player_rushing_yards',
    'player_receiving_yards',
    'player_receptions',
    'player_passing_touchdowns',
    'player_rushing_attempts',
  ],
  basketball_nba: [
    'player_points',
    'player_assists',
    'player_rebounds',
    'player_three_pointers_made',
  ],
  baseball_mlb: [
    'player_total_bases',
    'player_hits',
    'player_home_runs',
    'player_strikeouts',
  ],
};

function canonicalizeMarket(marketKey = '') {
  const key = String(marketKey || '').toLowerCase();
  return PLAYER_PROPS_MARKET_MAP[key] || key;
}

function displayMarketName(canonicalKey) {
  return String(canonicalKey || '')
    .replace(/player_/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function chunkArray(items = [], size = 1) {
  if (!Array.isArray(items) || size <= 0) return [items];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function safeNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim().toUpperCase();
    if (trimmed === 'EVEN') return 100;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function resolveBookUrl(url, state) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return { url: null, linkAvailable: false };
  }

  let resolved = url;
  let linkAvailable = true;
  const replacement = (state || DEFAULT_BOOK_STATE || '').toLowerCase();

  if (url.includes('{state}')) {
    if (!replacement) {
      linkAvailable = false;
    } else {
      resolved = url.replace('{state}', replacement);
    }
  }

  if (!linkAvailable) {
    resolved = null;
  }

  return { url: resolved, linkAvailable };
}

function toISOInTimeZone(dateString, timeString, timeZone = PLAYER_PROPS_TIMEZONE) {
  if (!dateString || !timeString) return { iso: null, hasStarted: false };
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute, second = '00'] = timeString.split(':');
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1, Number(hour || 0), Number(minute || 0), Number(second || 0)));

  const tzString = utcDate.toLocaleString('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const [monthPart, dayPart, yearPart, timePart] = tzString.replace(',', '').split(' ');
  const [tzHour, tzMinute, tzSecond] = timePart.split(':').map(Number);
  const tzDate = new Date(Date.UTC(
    Number(yearPart),
    Number(monthPart) - 1,
    Number(dayPart),
    tzHour,
    tzMinute,
    tzSecond,
  ));

  return {
    iso: tzDate.toISOString(),
    hasStarted: tzDate.getTime() <= Date.now(),
  };
}

function recordPlayerPropMetric(field, value) {
  if (!(field in playerPropsMetrics)) return;
  if (Array.isArray(playerPropsMetrics[field])) {
    playerPropsMetrics[field].push(value);
    if (playerPropsMetrics[field].length > 500) {
      playerPropsMetrics[field].shift();
    }
  } else if (typeof playerPropsMetrics[field] === 'number') {
    playerPropsMetrics[field] += value;
  }
}

function summarizePlayerPropMetrics() {
  if (!playerPropsMetrics.vendorDurations.length) return null;
  const sum = playerPropsMetrics.vendorDurations.reduce((acc, v) => acc + v, 0);
  const avg = Math.round(sum / playerPropsMetrics.vendorDurations.length);
  return { averageVendorMs: avg, samples: playerPropsMetrics.vendorDurations.length };
}

async function fetchPlayerPropsFromVendor({
  sportKey,
  eventId,
  markets,
  bookmakers,
  regions,
  state,
  etag,
  cachedSnapshot,
}) {
  if (!PLAYER_PROPS_API_BASE) {
    throw new Error('PLAYER_PROPS_API_BASE is not configured');
  }
  if (!SPORTSGAMEODDS_API_KEY) {
    throw new Error('SPORTSGAMEODDS_API_KEY is not configured');
  }

  const canonicalMarkets = Array.from(new Set((markets || []).map(canonicalizeMarket))).filter(Boolean);
  const canonicalBooks = bookmakers ? Array.from(new Set(bookmakers.map((b) => String(b).toLowerCase()))) : null;

  const rawMarketsToUse = canonicalMarkets.length
    ? canonicalMarkets
    : (DEFAULT_PLAYER_PROP_MARKETS[sportKey] || DEFAULT_PLAYER_PROP_MARKETS.americanfootball_nfl || []);

  // Filter out invalid markets before processing
  const marketsToUse = filterValidMarkets(rawMarketsToUse);
  
  if (rawMarketsToUse.length !== marketsToUse.length) {
    const filteredOut = rawMarketsToUse.filter(m => !marketsToUse.includes(m));
    console.log(`🚫 Filtered out invalid markets: ${filteredOut.join(', ')}`);
  }

  const marketChunks = marketsToUse.length
    ? chunkArray(marketsToUse, PLAYER_PROPS_MAX_MARKETS_PER_REQUEST || marketsToUse.length)
    : [[]];
  const bookChunks = canonicalBooks && canonicalBooks.length
    ? chunkArray(canonicalBooks, PLAYER_PROPS_MAX_BOOKS_PER_REQUEST || canonicalBooks.length)
    : [null];

  const itemsMap = new Map();
  let lastDate = cachedSnapshot?.startDate || null;
  let lastStart = cachedSnapshot?.startTime || null;
  let lastEtag = etag || null;
  const vendorDurations = [];

  if (Array.isArray(cachedSnapshot?.items)) {
    cachedSnapshot.items.forEach((item) => {
      const key = `${item.game_id}||${item.player}||${item.market}||${item.book}||${item.ou}`;
      itemsMap.set(key, item);
    });
  }

  for (const marketChunk of marketChunks) {
    for (const bookChunk of bookChunks) {
      const params = new URLSearchParams();
      params.set('sport', sportKey);
      params.set('eventId', eventId);
      params.set('apiKey', SPORTSGAMEODDS_API_KEY);
      if (regions) params.set('regions', regions);
      if (marketChunk && marketChunk.length) params.set('markets', marketChunk.join(','));
      if (bookChunk && bookChunk.length) params.set('bookmakers', bookChunk.join(','));

      const config = {
        timeout: PLAYER_PROPS_REQUEST_TIMEOUT,
        params: Object.fromEntries(params),
        headers: {
          'X-API-Key': SPORTSGAMEODDS_API_KEY,
        },
      };

      if (lastEtag) {
        config.headers['If-None-Match'] = lastEtag;
      }

      const start = Date.now();
      let response;
      try {
        response = await axiosWithRetry(PLAYER_PROPS_API_BASE, config, {
          tries: PLAYER_PROPS_RETRY_ATTEMPTS + 1,
          backoffMs: 400,
        });
      } catch (err) {
        recordPlayerPropMetric('vendorErrors', 1);
        throw err;
      } finally {
        vendorDurations.push(Date.now() - start);
      }

      if (response.status === 304) {
        recordPlayerPropMetric('notModifiedHits', 1);
        continue;
      }

      lastEtag = response.headers?.etag || lastEtag;

      const payload = response.data;
      if (!payload) {
        continue;
      }

      const books = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.bookmakers)
          ? payload.bookmakers
          : payload.bookmaker
            ? [payload.bookmaker]
            : [];

      const metaDate = payload.date || payload.eventDate || payload.game_date;
      const metaStart = payload.start || payload.eventStart || payload.game_time;
      if (metaDate) lastDate = metaDate;
      if (metaStart) lastStart = metaStart;

      books.forEach((bookPayload) => {
        const bookKey = String(bookPayload.key || bookPayload.book || bookPayload.bookmaker || '').toLowerCase();
        const bookTitle = bookPayload.title || bookPayload.name || bookPayload.key || bookKey || 'Book';
        if (!bookKey) return;

        const marketsArray = Array.isArray(bookPayload.markets)
          ? bookPayload.markets
          : bookPayload.market
            ? [bookPayload.market]
            : [];

        marketsArray.forEach((marketPayload) => {
          const originalMarketKey = marketPayload?.key || marketPayload?.market_key;
          const canonicalKey = canonicalizeMarket(originalMarketKey);
          if (!canonicalKey) {
            recordPlayerPropMetric('droppedOutcomes', 1);
            return;
          }

          const outcomesArray = Array.isArray(marketPayload?.outcomes)
            ? marketPayload.outcomes
            : [];

          outcomesArray.forEach((outcomePayload) => {
            const isActive = outcomePayload?.is_active !== false;
            const isLatest = outcomePayload?.is_latest !== false;
            if (!isActive) {
              recordPlayerPropMetric('droppedOutcomes', 1);
              return;
            }

            const playerName = outcomePayload.player || outcomePayload.description || outcomePayload.participant || outcomePayload.name || 'Player';
            const outcomeName = String(outcomePayload.name || outcomePayload.outcome || '').toLowerCase();
            const type = outcomeName.includes('under') ? 'UNDER'
              : outcomeName.includes('over') ? 'OVER'
              : outcomeName.includes('yes') ? 'YES'
              : outcomeName.includes('no') ? 'NO'
              : outcomeName.toUpperCase();
            const point = safeNumber(outcomePayload.point ?? outcomePayload.line ?? outcomePayload.number);
            const price = safeNumber(outcomePayload.price ?? outcomePayload.odds ?? outcomePayload.moneyline);

            if (price == null) {
              recordPlayerPropMetric('droppedOutcomes', 1);
              return;
            }

            const { url: resolvedUrl, linkAvailable } = resolveBookUrl(outcomePayload.url || bookPayload.url || bookPayload.link, state);

            const key = `${eventId}||${playerName}||${canonicalKey}||${bookKey}||${type}`;

            itemsMap.set(key, {
              game_id: eventId,
              player: playerName,
              market: canonicalKey,
              book: bookKey,
              book_label: bookTitle,
              ou: type,
              line: point,
              price,
              url: resolvedUrl,
              link_available: linkAvailable,
              is_latest: isLatest,
              is_active: isActive,
              start_iso: null,
              has_started: false,
            });
          });
        });
      });
    }
  }

  const { iso, hasStarted } = toISOInTimeZone(lastDate, lastStart, PLAYER_PROPS_TIMEZONE);

  const timestamp = Date.now();
  const items = Array.from(itemsMap.values()).map((item) => ({
    ...item,
    start_iso: iso,
    has_started: Boolean(hasStarted),
  }));

  vendorDurations.forEach((d) => recordPlayerPropMetric('vendorDurations', d));

  return {
    payload: {
      sportKey,
      eventId,
      items,
      start_iso: iso,
      has_started: Boolean(hasStarted),
    },
    etag: lastEtag,
    timestamp,
    stale: false,
    startDate: lastDate,
    startTime: lastStart,
  };
}

function formatPlayerPropsPayload(entry, { stale }) {
  return {
    league: entry.payload.league,
    game_id: entry.payload.game_id,
    items: entry.payload.items,
    start_iso: entry.payload.start_iso,
    has_started: entry.payload.has_started,
    ttl: PLAYER_PROPS_CACHE_TTL_MS,
    as_of: new Date(entry.timestamp).toISOString(),
    stale,
  };
}

async function loadPlayerProps(options) {
  const {
    sportKey,
    eventId,
    markets,
    bookmakers,
    regions,
    state,
    force = false,
  } = options;

  const cacheKey = getCacheKey('player-props', {
    sportKey,
    eventId,
    markets: markets || null,
    bookmakers: bookmakers || null,
    regions: regions || null,
    state,
  });

  const now = Date.now();
  const cacheEntry = playerPropsCache.get(cacheKey);
  const isFresh = cacheEntry && now - cacheEntry.timestamp < PLAYER_PROPS_CACHE_TTL_MS;

  if (!force && isFresh) {
    recordPlayerPropMetric('cacheHits', 1);
    return formatPlayerPropsPayload(cacheEntry, { stale: false });
  }

  const cachedSnapshot = cacheEntry
    ? {
        items: cacheEntry.payload.items,
        startDate: cacheEntry.startDate,
        startTime: cacheEntry.startTime,
      }
    : null;

  if (!force && cacheEntry && !playerPropsInFlight.has(cacheKey)) {
    const background = fetchPlayerPropsFromVendor({
      sportKey,
      eventId,
      markets,
      bookmakers,
      regions,
      state,
      etag: cacheEntry.etag,
      cachedSnapshot,
    }).then((result) => {
      if (result?.payload) {
        const entry = {
          payload: {
            league: sportKey,
            game_id: eventId,
            items: result.payload.items,
            start_iso: result.payload.start_iso,
            has_started: result.payload.has_started,
          },
          timestamp: result.timestamp,
          etag: result.etag,
          startDate: result.startDate,
          startTime: result.startTime,
        };
        setPlayerPropsCacheEntry(cacheKey, entry);
      }
      return result;
    }).catch((err) => {
      console.warn('player-props background refresh failed:', err.message);
      return null;
    }).finally(() => playerPropsInFlight.delete(cacheKey));
    playerPropsInFlight.set(cacheKey, background);
    recordPlayerPropMetric('staleHits', 1);
    return formatPlayerPropsPayload(cacheEntry, { stale: true });
  }

  if (!force && cacheEntry) {
    recordPlayerPropMetric('staleHits', 1);
    return formatPlayerPropsPayload(cacheEntry, { stale: true });
  }

  if (playerPropsInFlight.has(cacheKey)) {
    const inflight = await playerPropsInFlight.get(cacheKey);
    if (inflight?.payload) {
      const entry = {
        payload: {
          league: sportKey,
          game_id: eventId,
          items: inflight.payload.items,
          start_iso: inflight.payload.start_iso,
          has_started: inflight.payload.has_started,
        },
        timestamp: inflight.timestamp,
        etag: inflight.etag,
        startDate: inflight.startDate,
        startTime: inflight.startTime,
      };
      setPlayerPropsCacheEntry(cacheKey, entry);
      return formatPlayerPropsPayload(entry, { stale: false });
    }
    return inflight;
  }

  recordPlayerPropMetric('cacheMisses', 1);

  const fetchPromise = fetchPlayerPropsFromVendor({
    sportKey,
    eventId,
    markets,
    bookmakers,
    regions,
    state,
    etag: cacheEntry?.etag,
    cachedSnapshot,
  }).then((result) => {
    if (result?.payload) {
      const entry = {
        payload: {
          league: sportKey,
          game_id: eventId,
          items: result.payload.items,
          start_iso: result.payload.start_iso,
          has_started: result.payload.has_started,
        },
        timestamp: result.timestamp,
        etag: result.etag,
        startDate: result.startDate,
        startTime: result.startTime,
      };
      setPlayerPropsCacheEntry(cacheKey, entry);
      return formatPlayerPropsPayload(entry, { stale: false });
    }
    return null;
  }).catch((err) => {
    console.error('player-props fetch error:', err.message);
    if (cacheEntry) {
      recordPlayerPropMetric('staleHits', 1);
      return formatPlayerPropsPayload(cacheEntry, { stale: true });
    }
    throw err;
  }).finally(() => playerPropsInFlight.delete(cacheKey));

  playerPropsInFlight.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function getEventIdsForLeagueDate(league, date) {
  if (!league || !date) return [];
  if (!API_KEY) {
    console.warn('⚠️  Cannot resolve events without ODDS_API_KEY');
    return [];
  }

  const cacheKey = getCacheKey('events-by-date', { league, date });
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(league)}/events?apiKey=${API_KEY}`;
    const { data } = await axios.get(url, { timeout: 8000 });
    const events = Array.isArray(data) ? data : [];
    const filtered = events.filter((event) => {
      const commence = event?.commence_time ? new Date(event.commence_time) : null;
      if (!commence) return false;
      return commence.toISOString().slice(0, 10) === date;
    }).map((event) => event.id).filter(Boolean);

    setCachedResponse(cacheKey, filtered);
    return filtered;
  } catch (error) {
    console.error('Failed to load events for league/date', league, date, error.message);
    return [];
  }
}

function getCachedResponse(cacheKey) {
  const cached = apiCache.get(cacheKey);
  if (!cached) {
    console.log(` Cache MISS for ${cacheKey}`);
    return null;
  }
  
  // Determine cache duration based on market type
  const isAlternateMarket = ALTERNATE_MARKETS.some(market => cacheKey.includes(market));
  const isPlayerProp = PLAYER_PROP_MARKETS.some(market => cacheKey.includes(market));
  
  let cacheDuration = CACHE_DURATION_MS; // Default 5 minutes
  let cacheType = 'regular';
  
  if (isPlayerProp) {
    cacheDuration = PLAYER_PROPS_CACHE_DURATION_MS; // 90 seconds for player props
    cacheType = 'player prop';
  } else if (isAlternateMarket) {
    cacheDuration = ALTERNATE_MARKETS_CACHE_DURATION_MS; // 30 minutes for alternates
    cacheType = 'alternate market';
  }
  
  if (Date.now() - cached.timestamp < cacheDuration) {
    console.log(` Cache HIT for ${cacheKey} (${cacheType})`);
    return cached.data;
  }
  
  console.log(` Cache EXPIRED for ${cacheKey} (${cacheType})`);
  apiCache.delete(cacheKey); // Remove expired cache
  return null;
}

function setCachedResponse(cacheKey, data) {
  // Check if this is an alternate market for logging purposes
  const isAlternateMarket = ALTERNATE_MARKETS.some(market => cacheKey.includes(market));
  
  apiCache.set(cacheKey, { data, timestamp: Date.now() });
  console.log(`💾 Cached response for ${cacheKey}${isAlternateMarket ? ' (alternate market with extended TTL)' : ''}`);
}

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

// Helper function to filter bookmakers based on user plan
function getBookmakersForPlan(plan) {
  // Gold plan (and grandfathered platinum) get full access
  if (plan === 'gold' || plan === 'platinum') {
    return FOCUSED_BOOKMAKERS;
  }
  // Legacy free/trial users (should not exist after migration)
  return TRIAL_BOOKMAKERS;
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

// Helper function to get or create user profile
async function getUserProfile(userId) {
  if (!supabase) {
    // Fallback to in-memory storage if Supabase not configured
    if (!userUsage.has(userId)) {
      userUsage.set(userId, {
        id: userId,
        plan: 'free',
        api_request_count: 0,
        created_at: new Date().toISOString()
      });
    }
    return userUsage.get(userId);
  }

  try {
    // First, try to get existing user
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // User doesn't exist, create them
      console.log(`🆕 Creating new user: ${userId}`);
      
      // Create user with all required fields
      const newUser = {
        id: userId,
        plan: null, // New users must subscribe
        api_request_count: 0,
        grandfathered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert(newUser)
        .select("*")
        .single();

      if (insertErr) {
        console.error('❌ Failed to create user:', insertErr);
        
        // Check if it's a constraint violation
        if (insertErr.code === '23514') {
          console.error('❌ Plan constraint violation - database constraint too restrictive');
          throw new Error('Database constraint error: Plan constraint prevents NULL values. Please run the database fix.');
        }
        
        // Check if it's a missing column error
        if (insertErr.code === '42703') {
          console.error('❌ Missing column error:', insertErr.message);
          throw new Error('Database schema error: Missing required columns. Please run the database fix.');
        }
        
        throw new Error(`Database error creating user: ${insertErr.message} (Code: ${insertErr.code})`);
      }

      console.log(`✅ Successfully created user: ${userId}`);
      return inserted;
    }

    if (error) {
      console.error('❌ Database error fetching user:', error);
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
    }

    return data;

  } catch (error) {
    console.error('❌ getUserProfile error:', error);
    throw error;
  }
}

function getCachedPlan(userId) {
  const cached = planCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > PLAN_CACHE_TTL_MS) {
    planCache.delete(userId);
    return null;
  }
  return cached.payload;
}

function setCachedPlan(userId, payload) {
  planCache.set(userId, { payload, timestamp: Date.now() });
}

const allowDemoUserFallback = String(process.env.ALLOW_DEMO_USER || '').toLowerCase() === 'true';

function isLocalRequest(req) {
  const host = (req.get('host') || '').toLowerCase();
  const origin = (req.get('origin') || '').toLowerCase();
  const ip = req.ip || '';
  const check = (value = '') => (
    value.startsWith('localhost') ||
    value.startsWith('127.0.0.1') ||
    value.endsWith('.local')
  );
  return check(host) || check(origin) || ip === '127.0.0.1' || ip === '::1';
}

// Middleware to require authenticated user
function requireUser(req, res, next) {
  const isReadOnlyGet = req.method === 'GET';
  const tokenUserId = req.user?.id;
  const headerUserId = req.headers["x-user-id"];

  if (tokenUserId) {
    if (headerUserId && headerUserId !== tokenUserId) {
      return res.status(401).json({ error: "UNAUTHENTICATED", detail: "Header user mismatch" });
    }
    req.__userId = tokenUserId;
    return next();
  }

  if (allowDemoUserFallback && isReadOnlyGet && isLocalRequest(req)) {
    req.__userId = 'demo-user';
    return next();
  }

  return res.status(401).json({ error: "UNAUTHENTICATED" });
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
        const jitter = Math.floor(Math.random() * 250);
        const waitFor = delay + jitter;
        console.warn(`Attempt ${attempt} failed (${status || 'timeout'}), retrying in ${waitFor}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitFor));
        continue;
      }
      
      throw error;
    }
  }
}

if (!API_KEY) {
  console.warn("⚠️  Missing ODDS_API_KEY in .env (odds endpoints will still work for ESPN scores).");
}

// Configure CORS
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:10000',
  'https://odds-frontend-j2pn.onrender.com',
  'https://my-react-frontend-021i.onrender.com',
  // Primary production domains (correct spelling)
  'https://oddsightseer.com',
  'https://www.oddsightseer.com'
]);

// Add FRONTEND_URL if it exists and isn't already in the set
if (process.env.FRONTEND_URL) {
  allowedOrigins.add(process.env.FRONTEND_URL);
}

console.log('🔄 CORS Allowed Origins:', Array.from(allowedOrigins));

// Create CORS middleware with proper origin validation
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // In development, allow all origins
  if (process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, stripe-signature, x-user-id, Cache-Control, Pragma, Expires');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return next();
  }
  
  // In production, only allow whitelisted origins
  if (!origin || allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, stripe-signature, x-user-id, Cache-Control, Pragma, Expires');
    res.header('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return next();
  }
  
  console.log('🚫 CORS blocked origin:', origin);
  return res.status(403).json({ error: 'Not allowed by CORS' });
};

// Trust proxy (Render/Heroku) for correct IPs in rate-limiting
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Apply CORS middleware
app.use(corsMiddleware);

// Attempt to authenticate user (populate req.user) if Authorization header is present
async function authenticate(req, _res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token && supabase && typeof supabase.auth?.getUser === 'function') {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        req.user = data.user;
      }
    }
  } catch (e) {
    // Non-fatal: continue without req.user
    console.warn('Auth token verification failed:', e.message);
  }
  next();
}

// Apply authentication on API routes
app.use('/api', authenticate);

// Basic API rate limiting (production only)
if (process.env.NODE_ENV === 'production') {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'rate_limited', hint: 'Too many requests, please try again later.' },
  });
  app.use('/api/', apiLimiter);
}

// Use JSON parser for most routes, but skip Stripe webhook which requires raw body
app.use((req, res, next) => {
  if (req.originalUrl === '/api/billing/webhook') return next();
  return bodyParser.json()(req, res, next);
});

// Serve static client build if available
const path = require('path');
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
try {
  app.use(express.static(clientBuildPath));
} catch (_) {
  // ok if not present locally
}

// Usage tracking middleware for Odds API proxy
async function checkPlanAccess(req, res, next) {
  try {
    const userId = req.__userId;
    
    // DEMO MODE: Give demo-user platinum access
    if (userId === 'demo-user') {
      console.log('💎 Demo user - granting Platinum access');
      req.__userProfile = {
        id: 'demo-user',
        plan: 'platinum',
        username: 'Demo User',
        grandfathered: false
      };
      return next();
    }
    
    const profile = await getUserProfile(userId);

    // Gold or Platinum plan (and grandfathered users) get full access
    if (profile.plan === 'gold' || profile.plan === 'platinum' || profile.grandfathered) {
      req.__userProfile = profile;
      return next();
    }

    // TEMPORARY: Allow new users (plan = NULL) limited access to set username and basic functionality
    if (profile.plan === null) {
      console.log(`🆕 Allowing temporary access for new user: ${userId}`);
      req.__userProfile = profile;
      req.__limitedAccess = true; // Flag for limited access
      return next();
    }

    // No valid plan - require subscription
    return res.status(402).json({
      error: "SUBSCRIPTION_REQUIRED",
      code: "SUBSCRIPTION_REQUIRED",
      message: "Subscription required. Choose Gold ($10/month) or Platinum ($25/month) to access live odds and betting data."
    });

  } catch (error) {
    console.error('Plan access check error:', error);
    // In production, deny access on error for security
    return res.status(500).json({
      error: "PLAN_CHECK_FAILED",
      code: "PLAN_CHECK_FAILED", 
      message: "Unable to verify subscription status. Please try again."
    });
  }
}

// Lightweight usage gate used by public GET endpoints to prevent accidental abuse.
// Currently a no-op that forwards the request; retain hook for future expansion.
function enforceUsage(req, res, next) {
  return next();
}

// Increment usage after successful API call
async function incrementUsage(userId, profile) {
  if (!profile || !userId) return; // Guard missing context
  if (profile.plan === "platinum") return; // Platinum users don't count against quota

  if (supabase) {
    try {
      // Try atomic increment function first
      const { error: rpcError } = await supabase.rpc("increment_usage", { uid: userId });
      if (rpcError) {
        // Fallback to update if RPC not available
        await supabase.from("users")
          .update({ api_request_count: profile.api_request_count + 1 })
          .eq("id", userId);
      }
    } catch (error) {
      console.error('Failed to increment usage:', error);
    }
  } else {
    // Fallback to in-memory storage
    const userData = userUsage.get(userId);
    if (userData) {
      userData.api_request_count += 1;
      userUsage.set(userId, userData);
    }
  }
}

// Health check endpoints (for Render and monitors)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// Readiness endpoint with non-secret env presence for quick verification
app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    hasStripePrice: !!(process.env.STRIPE_PRICE_GOLD || process.env.STRIPE_PRICE_PLATINUM),
    hasStripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasSupabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    frontendUrl: process.env.FRONTEND_URL || null,
    version: process.env.GIT_COMMIT || process.env.RENDER_GIT_COMMIT || null,
  });
});

// Simple /api/me endpoint - returns user plan info
app.get('/api/me', async (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('plan, api_request_count, grandfathered')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('User not found, returning free plan');
      return res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
    }

    // Platinum or grandfathered = unlimited
    if (data.plan === 'platinum' || data.grandfathered) {
      return res.json({
        plan: data.plan || 'platinum',
        remaining: null,
        limit: null,
        unlimited: true,
        used: data.api_request_count || 0
      });
    }

    // Free plan = 250 limit
    const limit = 250;
    const used = data.api_request_count || 0;
    const remaining = Math.max(0, limit - used);

    res.json({
      plan: data.plan || 'free',
      remaining,
      limit,
      used,
      unlimited: false
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
  }
});

// Usage endpoint - get current user's quota info
app.get('/api/me/usage', requireUser, async (req, res) => {
  const userId = req.__userId;
  const cached = getCachedPlan(userId);

  try {
    // Removed demo user logic - all users get real authentication
    if (false) {
      const demoPlan = {
        id: userId,
        plan: 'platinum',
        used: 0,
        quota: null,
        source: 'demo'
      };
      setCachedPlan(userId, demoPlan);
      console.log('🎯 Demo user detected, granting platinum access:', userId);
      return res.json(demoPlan);
    }

    const profile = await getUserProfile(userId);

    // Handle demo mode when Supabase is not configured
    if (!supabase && userUsage.has(userId)) {
      const userData = userUsage.get(userId);
      const payload = {
        id: userData.id,
        plan: userData.plan,
        used: userData.api_request_count,
        quota: userData.plan === "platinum" ? null : FREE_QUOTA,
        source: 'demo'
      };
      setCachedPlan(userId, payload);
      return res.json(payload);
    }

    const payload = {
      id: profile.id,
      plan: profile.plan,
      used: profile.api_request_count,
      quota: profile.plan === "platinum" ? null : FREE_QUOTA,
      source: 'live'
    };
    setCachedPlan(userId, payload);
    return res.json(payload);
  } catch (error) {
    console.error('me/usage error:', error);
    if (cached) {
      return res.json({ ...cached, source: 'cache', stale: true });
    }
    return res.status(503).json({ error: "USAGE_FETCH_FAILED", detail: error.message });
  }
});

// Odds API proxy with usage tracking
// Proxy only explicit Odds API endpoints to avoid path-to-regexp wildcards
app.get('/api/odds/v4/sports/:sportKey/events/:eventId/odds', requireUser, checkPlanAccess, async (req, res) => {
  try {
    const userId = req.__userId;
    const profile = req.__userProfile;

    // Proxy to Odds API
    const { sportKey, eventId } = req.params;
    const upstreamPath = `/v4/sports/${encodeURIComponent(sportKey)}/events/${encodeURIComponent(eventId)}/odds`;
    const upstreamUrl = `https://api.the-odds-api.com${upstreamPath}`;
    
    const response = await axios.get(upstreamUrl, { 
      params: { ...req.query, apiKey: API_KEY },
      timeout: 9000
    });

    // If success, increment usage for non-platinum users
    if (response.status === 200) {
      await incrementUsage(userId, profile);
    }

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Odds proxy error:", error?.response?.data || error.message);
    const status = error?.response?.status || 500;
    return res.status(status).json({ error: "PROXY_FAILED", detail: error.message });
  }
});

app.get('/api/odds-history', requireUser, checkPlanAccess, async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(400).json({ code: 'MISSING_ENV', message: 'Missing ODDS_API_KEY', hint: 'Set ODDS_API_KEY in backend env' });
    }

    const userId = req.__userId;
    const profile = req.__userProfile;

    const { sport, sportKey, eventId, markets, bookmakers, regions = 'us' } = req.query;
    const resolvedSport = sport || sportKey;

    if (!resolvedSport) {
      return res.status(400).json({ error: 'missing_sport', message: 'sport parameter is required' });
    }

    if (!eventId) {
      return res.status(400).json({ error: 'missing_event', message: 'eventId parameter is required' });
    }

    const qs = new URLSearchParams({
      apiKey: API_KEY,
      regions: String(regions || 'us'),
      oddsFormat: 'american',
    });

    if (markets) {
      qs.set('markets', Array.isArray(markets) ? markets.join(',') : String(markets));
    }

    if (bookmakers) {
      qs.set('bookmakers', Array.isArray(bookmakers) ? bookmakers.join(',') : String(bookmakers));
    }

    const upstreamUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(resolvedSport)}/events/${encodeURIComponent(eventId)}/odds-history?${qs.toString()}`;

    const response = await axiosWithRetry(upstreamUrl, {}, { tries: 2, backoffMs: 600 });

    if (response.status === 200) {
      await incrementUsage(userId, profile);
    }

    return res.status(response.status).json(response.data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const detail = error?.response?.data || error.message;
    console.error('Odds history proxy error:', detail);
    return res.status(status).json({ error: 'PROXY_FAILED', detail });
  }
});

// Explicit Odds API proxies (Express 5-safe)
app.get('/api/odds/v4/sports', enforceUsage, async (_req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ code: 'MISSING_ENV', message: "Missing ODDS_API_KEY", hint: 'Set ODDS_API_KEY in backend env' });
    const upstreamUrl = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
    const r = await axios.get(upstreamUrl);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'proxy_failed', detail: err?.response?.data || err.message });
  }
});

app.get('/api/odds/v4/sports/:sportKey/events', enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ code: 'MISSING_ENV', message: "Missing ODDS_API_KEY", hint: 'Set ODDS_API_KEY in backend env' });
    const { sportKey } = req.params;
    const upstreamUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/events?apiKey=${API_KEY}`;
    const r = await axios.get(upstreamUrl);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'proxy_failed', detail: err?.response?.data || err.message });
  }
});

app.get('/api/odds/v4/sports/:sportKey/odds', enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ code: 'MISSING_ENV', message: "Missing ODDS_API_KEY", hint: 'Set ODDS_API_KEY in backend env' });
    const { sportKey } = req.params;
    const { regions = 'us', markets = 'h2h,spreads,totals', oddsFormat = 'american', bookmakers, dateFormat, includeBetLimits } = req.query;
    const qs = new URLSearchParams({ apiKey: API_KEY, regions, markets, oddsFormat });
    if (bookmakers) qs.set('bookmakers', String(bookmakers));
    if (dateFormat) qs.set('dateFormat', String(dateFormat));
    if (includeBetLimits) qs.set('includeBetLimits', String(includeBetLimits));
    const upstreamUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds?${qs.toString()}`;
    const r = await axios.get(upstreamUrl);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'proxy_failed', detail: err?.response?.data || err.message });
  }
});

// Legacy usage endpoint
app.get('/api/usage/me', requireUser, async (req, res) => {
  try {
    const userId = req.__userId;
    if (!userId || userId === 'demo-user') {
      return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'SUPABASE_REQUIRED', detail: 'Supabase connection required for usage lookup' });
    }

    // Fetch user plan from database
    let userPlan = 'free_trial'; // default
    const { data: user, error } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();
    
    if (!error && user?.plan) {
      userPlan = user.plan;
    }
    
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
      plan: userPlan || 'free_trial',
      limit: FREE_QUOTA,
      calls_made: usage.calls_made,
      remaining: Math.max(0, FREE_QUOTA - usage.calls_made),
      period_end: end.toISOString()
    });
  } catch (error) {
    console.error('Error fetching user usage:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Stripe: Create checkout session for Gold or Platinum subscription
app.post('/api/billing/create-checkout-session', requireUser, async (req, res) => {
  try {
    const { plan = 'platinum' } = req.body;
    
    console.log('🔍 Checkout session request received');
    console.log('🔍 Requested plan:', plan);
    console.log('🔍 Stripe configured:', !!stripe);
    console.log('🔍 STRIPE_PRICE_GOLD:', STRIPE_PRICE_GOLD);
    console.log('🔍 STRIPE_PRICE_PLATINUM:', STRIPE_PRICE_PLATINUM);
    console.log('🔍 FRONTEND_URL:', FRONTEND_URL);
    
    if (!stripe) {
      console.error('❌ Stripe not configured');
      return res.status(500).json({ code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured', hint: 'Set STRIPE_SECRET_KEY in backend env' });
    }
    
    // Select the correct price ID based on requested plan
    const priceId = plan === 'gold' ? STRIPE_PRICE_GOLD : STRIPE_PRICE_PLATINUM;
    const planName = plan === 'gold' ? 'Gold' : 'Platinum';
    
    if (!priceId) {
      console.error(`❌ STRIPE_PRICE_${planName.toUpperCase()} not set`);
      return res.status(500).json({ 
        code: 'MISSING_ENV', 
        message: `STRIPE_PRICE_${planName.toUpperCase()} not set`, 
        hint: `Set STRIPE_PRICE_${planName.toUpperCase()} (Price ID) in backend env` 
      });
    }
    
    const userId = req.__userId;
    console.log('🔍 User ID:', userId);
    
    if (!userId || userId === 'demo-user') {
      console.error('❌ Invalid user ID');
      return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Authenticated user required' });
    }

    console.log(`✅ Creating ${planName} checkout session for user: ${userId}`);
    console.log(`✅ Using price ID: ${priceId}`);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/billing/cancel`,
      allow_promotion_codes: true,
      metadata: { 
        userId, 
        plan: plan.toLowerCase()
      }
    });
    
    console.log(`✅ Created ${planName} checkout session: ${session.id} for user: ${userId}`);
    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      code: 'CHECKOUT_START_FAILED', 
      message: error.message,
      detail: error.message,
      type: error.type,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Server logout endpoint - clears HTTP-only session cookies if any
app.post('/api/logout', (req, res) => {
  // Clear any session cookies that might be set
  res.clearCookie('session', { path: '/', sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.clearCookie('auth-token', { path: '/', sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  return res.json({ ok: true });
});

// Admin endpoint to sign out all users (invalidate all sessions)
app.post('/api/admin/signout-all', async (req, res) => {
  try {
    // Require admin token
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || token !== ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('🔐 Admin: Signing out all users');
    
    // Use Supabase Admin API to sign out all users
    const { data, error } = await supabase.auth.admin.signOutAllUsers();
    
    if (error) {
      console.error('Failed to sign out all users:', error);
      return res.status(500).json({ error: 'Failed to sign out users', details: error.message });
    }
    
    console.log('✅ Successfully signed out all users');
    return res.json({ 
      ok: true, 
      message: 'All users have been signed out',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error signing out all users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin override route to grant platinum manually
app.post("/api/admin/set-plan", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, plan } = req.body;
  if (!userId || !plan) {
    return res.status(400).json({ error: "Missing userId or plan" });
  }

  if (!supabase) {
    // Fallback to in-memory storage
    const userData = userUsage.get(userId) || { api_request_count: 0, plan: 'free' };
    userData.plan = plan;
    userUsage.set(userId, userData);
    return res.json({ ok: true, userId, plan });
  }

  try {
    const { error } = await supabase.from("users").update({ plan }).eq("id", userId);
    if (error) {
      return res.status(500).json({ error: "SET_PLAN_FAILED", detail: error.message });
    }

    console.log(`✅ Admin granted platinum to user: ${userId}`);
    res.json({ ok: true, userId });
  } catch (error) {
    console.error('grant-platinum error:', error);
    res.status(500).json({ error: 'GRANT_PLATINUM_FAILED', detail: error.message });
  }
});

// Set user plan (for free trial)
app.post('/api/users/plan', requireUser, async (req, res) => {
  try {
    const userId = req.__userId;
    if (!userId || userId === 'demo-user') {
      return res.status(401).json({ error: 'auth_required' });
    }

    const { plan } = req.body || {};
    if (plan !== 'free_trial') {
      return res.status(400).json({ error: 'invalid_plan' });
    }

    console.log(`Setting plan for user ${userId}: ${plan}`);

    if (supabase) {
      // Update user plan in Supabase
      const { error } = await supabase
        .from('users')
        .upsert({ 
          id: userId, 
          plan: 'free_trial',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to update user plan:', error);
        return res.status(500).json({ error: 'database_error' });
      }
    } else {
      return res.status(500).json({ error: "SUPABASE_REQUIRED", message: "Supabase connection required for plan management" });
    }

    res.json({ ok: true, plan: 'free_trial' });
  } catch (error) {
    console.error('Error setting user plan:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Cancel Stripe subscription
app.post('/api/billing/cancel-subscription', requireUser, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const userId = req.__userId;

    // Handle demo mode when Supabase is not configured
    if (!supabase) {
      // Fallback to in-memory storage
      const userData = userUsage.get(userId);
      if (userData && userData.plan === 'platinum') {
        userData.plan = 'free';
        userUsage.set(userId, userData);
        console.log(`✅ Demo mode: Downgraded ${userId} from platinum to free`);
        return res.json({
          success: true,
          message: 'Subscription cancelled successfully (demo mode)',
          cancel_at_period_end: true,
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
        });
      } else {
        return res.status(400).json({ error: 'No active subscription found' });
      }
    }

    // Get user's current subscription from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Set subscription end date instead of immediately removing access
    const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_end_date: subscriptionEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return res.status(500).json({ error: 'Failed to update user plan' });
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Stripe webhook handler (raw body required for signature verification)
app.post('/api/billing/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe not configured' });
    }
    
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        
        if (userId && supabase) {
          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
          
          // Update user plan and subscription end date in Supabase
          const { error } = await supabase
            .from('users')
            .update({ 
              plan: 'gold',
              subscription_end_date: subscriptionEndDate.toISOString(),
              grandfathered: false  // Paying users are not grandfathered
            })
            .eq('id', userId);
            
          if (error) {
            console.error('Failed to update user plan in Supabase:', error);
            throw error;
          }
          
          console.log(`✅ Plan set to gold via webhook: ${userId}, expires: ${subscriptionEndDate}`);
        } else {
          console.error(`Failed to update plan in Supabase for user ${userId}`);
        }
      }
      
      // Handle subscription cancellation/deletion
      else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object;
        
        // Find user by Stripe customer ID
        if (supabase && subscription.customer) {
          const { data: users, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', subscription.customer);
            
          if (!findError && users && users.length > 0) {
            const userId = users[0].id;
            
            // If subscription is canceled or deleted, remove plan access
            if (subscription.status === 'canceled' || subscription.status === 'unpaid' || event.type === 'customer.subscription.deleted') {
              const { error } = await supabase
                .from('users')
                .update({ 
                  plan: null,  // No plan access (must resubscribe)
                  subscription_end_date: null
                })
                .eq('id', userId);
                
              if (error) {
                console.error('Failed to remove user plan in Supabase:', error);
                throw error;
              }
              
              console.log(`✅ Plan access removed via webhook: ${userId}`);
            }
          }
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).send('Webhook handler failed');
    }
  }
);

// GET /historical/odds - Historical odds snapshots for a sport (costs 1 credit per snapshot)
app.get("/api/historical/odds/:sport", requireUser, async (req, res) => {
  try {
    const { sport } = req.params;
    const { 
      regions = 'us',
      markets = 'h2h',
      date,
      bookmakers
    } = req.query;
    
    if (!API_KEY) {
      return res.status(400).json({ 
        code: 'MISSING_ENV', 
        message: "Missing ODDS_API_KEY" 
      });
    }
    
    console.log(`🌐 Fetching historical odds for ${sport} at ${date || 'latest'}`);
    
    const params = new URLSearchParams({
      apiKey: API_KEY,
      regions,
      markets
    });
    
    if (date) params.set('date', date);
    if (bookmakers) params.set('bookmakers', bookmakers);
    
    const url = `https://api.the-odds-api.com/v4/historical/sports/${encodeURIComponent(sport)}/odds?${params.toString()}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    console.log(`✅ Retrieved historical odds snapshot:`, {
      timestamp: response.data.timestamp,
      gameCount: response.data.data?.length || 0
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Error fetching historical odds:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      hint: 'Failed to fetch historical odds from The Odds API'
    });
  }
});

// GET /historical/events/{eventId}/odds - Historical odds for specific event (costs 1 credit per snapshot)
app.get("/api/historical/events/:sport/:eventId/odds", requireUser, async (req, res) => {
  try {
    const { sport, eventId } = req.params;
    const { 
      regions = 'us',
      markets = 'h2h',
      date,
      bookmakers
    } = req.query;
    
    if (!API_KEY) {
      return res.status(400).json({ 
        code: 'MISSING_ENV', 
        message: "Missing ODDS_API_KEY" 
      });
    }
    
    // Check cache (cache for 1 hour since historical data doesn't change)
    const cacheKey = getCacheKey('historical-event-odds', { sport, eventId, date, regions, markets, bookmakers });
    const cached = getCachedResponse(cacheKey);
    
    if (cached) {
      console.log(`📦 Using cached historical odds for event ${eventId}`);
      return res.json(cached);
    }
    
    console.log(`🌐 Fetching historical odds for event ${eventId} at ${date || 'latest'}`);
    
    const params = new URLSearchParams({
      apiKey: API_KEY,
      regions,
      markets
    });
    
    if (date) params.set('date', date);
    if (bookmakers) params.set('bookmakers', bookmakers);
    
    const url = `https://api.the-odds-api.com/v4/historical/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/odds?${params.toString()}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    // Cache for 1 hour
    setCachedResponse(cacheKey, response.data, 3600000);
    
    console.log(`✅ Retrieved historical odds for event:`, {
      timestamp: response.data.timestamp,
      bookmakerCount: response.data.data?.bookmakers?.length || 0
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Error fetching historical event odds:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      hint: 'Failed to fetch historical event odds from The Odds API'
    });
  }
});

// GET /events/{eventId}/markets - Returns available markets for an event (costs 1 credit)
app.get("/api/events/:sport/:eventId/markets", requireUser, async (req, res) => {
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
    
    const response = await axios.get(url, { timeout: 8000 });
    const data = response.data;
    
    // Cache for 5 minutes
    setCachedResponse(cacheKey, data, CACHE_DURATION_MS);
    
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

// GET /participants - Returns list of teams/players for a sport (FREE - doesn't count against quota)
app.get("/api/participants/:sport", requireUser, async (req, res) => {
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
    
    const response = await axios.get(url, { timeout: 8000 });
    const participants = response.data;
    
    // Cache for 24 hours (86400000 ms)
    setCachedResponse(cacheKey, participants, 86400000);
    
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

// sports list - Uses Supabase cache to reduce API calls
app.get("/api/sports", requireUser, checkPlanAccess, async (_req, res) => {
  try {
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
      console.log('🧪 Returning fallback sports list - API key not configured');
      return res.json(fallbackSports);
    }
    
    // Step 4: Fetch from The Odds API and update Supabase cache
    console.log('🌐 Fetching sports list from The Odds API');
    const url = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
    const response = await axios.get(url);
    
    // Filter unwanted sports
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
    setCachedResponse(cacheKey, filteredSports);
    
    res.json(filteredSports);
  } catch (err) {
    console.error("sports error:", err?.response?.status, err?.response?.data || err.message);
    res.status(500).json({ error: String(err) });
  }
});

// events by sport (Odds API) - CACHED to reduce API calls
app.get("/api/events", enforceUsage, async (req, res) => {
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

// odds endpoint (unified for multiple sports)
app.get("/api/odds", requireUser, checkPlanAccess, async (req, res) => {
  try {
    const { sports, regions = "us", markets = "h2h,spreads,totals", oddsFormat = "american" } = req.query;
    console.log('🔍 /api/odds called with:', { sports, regions, markets, userId: req.__userId });
    if (!sports) return res.status(400).json({ error: "Missing sports parameter" });
    
    // If no API key, return error instead of mock data
    if (!API_KEY) {
      console.log('🔧 No API_KEY found, returning error');
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
    
    // Filter out unsupported markets from TheOddsAPI
    const supportedMarkets = ['h2h', 'spreads', 'totals'];
    const filteredRegularMarkets = regularMarkets.filter(m => supportedMarkets.includes(m));
    
    console.log('Original regular markets:', regularMarkets);
    console.log('Filtered to supported markets:', filteredRegularMarkets);
    
    console.log('Regular markets requested:', regularMarkets);
    console.log('Player prop markets requested:', playerPropMarkets);
    console.log('ENABLE_PLAYER_PROPS_V2:', ENABLE_PLAYER_PROPS_V2);
    console.log('API_KEY available:', !!API_KEY);
    console.log('SPORTSGAMEODDS_API_KEY available:', !!SPORTSGAMEODDS_API_KEY);
    
    // Step 1: Fetch regular odds (h2h, spreads, totals) only
    if (filteredRegularMarkets.length > 0) {
      const marketsToFetch = filteredRegularMarkets;
      
      // Fetch each sport separately since TheOddsAPI doesn't support multiple sports in one request
      for (const sport of sportsArray) {
        try {
          // COST REDUCTION: Use bookmakers based on user plan
          const userProfile = req.__userProfile || { plan: 'free' };
          const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
          
          // Filter out DFS apps for game odds (they only offer player props)
          const dfsApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'draftkings_pick6'];
          const gameOddsBookmakers = allowedBookmakers.filter(book => !dfsApps.includes(book));
          const bookmakerList = gameOddsBookmakers.join(',');
          
          console.log(`🎯 Game odds bookmakers (DFS filtered): ${bookmakerList}`);
          
          const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${marketsToFetch.join(',')}&oddsFormat=${oddsFormat}&bookmakers=${bookmakerList}&includeBetLimits=true&includeLinks=true&includeSids=true`;
          // Split markets into regular and alternate for optimized caching
          const regularMarkets = marketsToFetch.filter(market => !ALTERNATE_MARKETS.includes(market));
          const alternateMarkets = marketsToFetch.filter(market => ALTERNATE_MARKETS.includes(market));
          
          // Check if we need to fetch both types of markets
          const needsRegularMarkets = regularMarkets.length > 0;
          const needsAlternateMarkets = alternateMarkets.length > 0;
          
          // Create separate cache keys for regular and alternate markets
          const regularCacheKey = needsRegularMarkets ? 
            getCacheKey('odds', { sport, regions, markets: regularMarkets, bookmakers: bookmakerList }) : null;
          const alternateCacheKey = needsAlternateMarkets ? 
            getCacheKey('odds_alternate', { sport, regions, markets: alternateMarkets, bookmakers: bookmakerList }) : null;
          
          // Check cache for both types
          const cachedRegularData = needsRegularMarkets ? getCachedResponse(regularCacheKey) : null;
          const cachedAlternateData = needsAlternateMarkets ? getCachedResponse(alternateCacheKey) : null;
          
          // Determine if we can use cached data for everything
          const canUseAllCached = 
            (!needsRegularMarkets || cachedRegularData) && 
            (!needsAlternateMarkets || cachedAlternateData);
          
          // For backward compatibility, create a combined cache key
          const cacheKey = getCacheKey('odds', { sport, regions, markets: marketsToFetch, bookmakers: bookmakerList });
          const cachedData = getCachedResponse(cacheKey);
          
          let responseData;
          
          // If we can use all cached data, combine it
          if (canUseAllCached) {
            // Combine cached data from both sources
            responseData = [];
            
            if (cachedRegularData) {
              console.log(`📦 Using cached regular markets data for ${sport}`);
              responseData = [...responseData, ...cachedRegularData];
            }
            
            if (cachedAlternateData) {
              console.log(`📦 Using cached alternate markets data for ${sport} (extended TTL)`);
              responseData = [...responseData, ...cachedAlternateData];
            }
            
            // For backward compatibility
            if (cachedData) {
              console.log(`📦 Using combined cached data for ${sport}`);
              responseData = cachedData;
            }
          } else {
            // Need to make an API call
            console.log(`🌐 API call for ${sport}:`, url);
            const response = await axios.get(url);
            responseData = response.data;
            
            // Cache the data with split strategy
            if (needsRegularMarkets && needsAlternateMarkets) {
              // Split the response data by market type
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
              
              // Cache both separately
              if (regularData.length > 0) {
                setCachedResponse(regularCacheKey, regularData);
              }
              
              if (alternateData.length > 0) {
                setCachedResponse(alternateCacheKey, alternateData);
              }
              
              // Also cache the combined data for backward compatibility
              setCachedResponse(cacheKey, responseData);
            } else {
              // Just cache everything in one go
              setCachedResponse(cacheKey, responseData);
            }
            
            // Increment usage for each actual external API call made
            const userId = req.__userId;
            const profile = req.__userProfile;
            if (userId && profile) {
              await incrementUsage(userId, profile);
              console.log(`📊 Incremented usage for ${sport} API call`);
            }
          }
          const sportGames = responseData || [];
          console.log(`Got ${sportGames.length} games for ${sport}`);
          
          allGames.push(...sportGames);
        } catch (sportErr) {
          console.warn(`Failed to fetch games for sport ${sport}:`, sportErr.response?.status, sportErr.response?.data || sportErr.message);
          // Continue with other sports even if one fails
        }
      }
      
      console.log(`Got ${allGames.length} total games with base markets`);
      
      // Filter bookmakers based on user plan before returning
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      allGames.forEach(game => {
        game.bookmakers = game.bookmakers.filter(bookmaker => 
          allowedBookmakers.includes(bookmaker.key)
        );
      });

    }
    
    // Step 2: Fetch player props if requested and enabled
    console.log(`🔍 Player props check: playerPropMarkets.length=${playerPropMarkets.length}, ENABLE_PLAYER_PROPS_V2=${ENABLE_PLAYER_PROPS_V2}`);
    
    if (playerPropMarkets.length > 0 && ENABLE_PLAYER_PROPS_V2) {
      console.log('🎯 Fetching player props for markets:', playerPropMarkets);
      
      // If no games were found in the regular API call, fetch games specifically for player props
      if (allGames.length === 0) {
        console.log('🎯 No games found in regular API call, fetching games specifically for player props');
        
        try {
          // Fetch games for the requested sports
          for (const sport of sportsArray) {
            const userProfile = req.__userProfile || { plan: 'free' };
            const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
            const bookmakerList = allowedBookmakers.join(',');
            
            const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=us,us_dfs&markets=h2h&oddsFormat=${oddsFormat}&bookmakers=${bookmakerList}`;
            console.log(`🌐 Fetching games for player props: ${url.replace(API_KEY, 'API_KEY_HIDDEN')}`);
            
            try {
              const response = await axios.get(url);
              if (response.data && Array.isArray(response.data)) {
                console.log(`🎯 Found ${response.data.length} games for sport ${sport}`);
                allGames.push(...response.data);
              }
            } catch (sportError) {
              console.error(`🚫 Error fetching games for sport ${sport}:`, sportError.message);
            }
          }
          
          console.log(`🎯 Total games found for player props: ${allGames.length}`);
        } catch (error) {
          console.error('🚫 Error fetching games for player props:', error.message);
        }
      }
      
      console.log(`🎯 Processing ${Math.min(allGames.length, 10)} games for player props`);
      console.log(`🎯 Total games available for props: ${allGames.length}`);
      
      // Sort games to prioritize NCAA games if they're requested
      if (sportsArray.includes('americanfootball_ncaaf') || sportsArray.includes('basketball_ncaab')) {
        console.log('🎓 NCAA sports requested, prioritizing NCAA games for player props');
        allGames.sort((a, b) => {
          const aIsNCAA = a.sport_key === 'americanfootball_ncaaf' || a.sport_key === 'basketball_ncaab';
          const bIsNCAA = b.sport_key === 'americanfootball_ncaaf' || b.sport_key === 'basketball_ncaab';
          return bIsNCAA - aIsNCAA; // Sort NCAA games first
        });
      }
      
      // For each game, fetch individual player props using event ID
      for (let i = 0; i < allGames.length && i < 25; i++) { // Limit to first 25 games for comprehensive coverage
        const game = allGames[i];
        if (!game.id) {
          console.log(`⚠️ Game ${i} missing ID, skipping player props`);
          continue;
        }
        
        console.log(`🎯 Processing game ${i+1}/${Math.min(allGames.length, 25)}: ${game.home_team} vs ${game.away_team} (ID: ${game.id})`);
        
        try {
          const userProfile = req.__userProfile || { plan: 'free' };
          const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
          const bookmakerList = allowedBookmakers.slice(0, 25).join(','); // Limit to 25 books for props (comprehensive coverage including all DFS apps)
          
          // Debug logging for DFS apps
          console.log('🎯 Player Props Bookmaker Debug:', {
            userPlan: userProfile.plan,
            totalBookmakers: allowedBookmakers.length,
            first25: allowedBookmakers.slice(0, 25),
            dfsAppsIncluded: allowedBookmakers.slice(0, 25).filter(b => ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'prophetx'].includes(b)),
            bookmakerListForAPI: bookmakerList
          });
          
          // Use individual event endpoint for player props
          // Include both us and us_dfs regions to get traditional sportsbooks AND DFS apps
          const propsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(game.sport_key)}/events/${encodeURIComponent(game.id)}/odds?apiKey=${API_KEY}&regions=us,us_dfs&markets=${playerPropMarkets.join(',')}&oddsFormat=${oddsFormat}&bookmakers=${bookmakerList}&includeBetLimits=true&includeLinks=true&includeSids=true`;
          console.log(`🌐 Player props URL: ${propsUrl.replace(API_KEY, 'API_KEY_HIDDEN')}`);
          
          const cacheKey = getCacheKey('player-props', { eventId: game.id, markets: playerPropMarkets, bookmakers: bookmakerList });
          const cachedProps = getCachedResponse(cacheKey);
          
          let propsResponse;
          if (cachedProps) {
            propsResponse = { data: cachedProps };
            console.log(`📦 Using cached player props for game ${game.id}`);
          } else {
            console.log(`🌐 Making API call for player props for game ${game.id}...`);
            const startTime = Date.now();
            propsResponse = await axios.get(propsUrl, { timeout: PLAYER_PROPS_REQUEST_TIMEOUT });
            const duration = Date.now() - startTime;
            console.log(`✅ Player props API call completed in ${duration}ms, status: ${propsResponse.status}`);
            console.log(`📊 Player props response data:`, JSON.stringify(propsResponse.data, null, 2).substring(0, 500) + '...');
          
          // Enhanced debugging for bookmaker coverage
          if (propsResponse.data && propsResponse.data.bookmakers) {
            console.log(`🎯 PLAYER PROPS DEBUG - Game: ${game.id}`);
            console.log(`🎯 Total bookmakers in response: ${propsResponse.data.bookmakers.length}`);
            propsResponse.data.bookmakers.forEach(book => {
              console.log(`🎯 Bookmaker: ${book.key} (${book.title}) - Markets: ${book.markets?.length || 0}`);
              if (book.markets) {
                book.markets.forEach(market => {
                  console.log(`  📈 Market: ${market.key} - Outcomes: ${market.outcomes?.length || 0}`);
                  if (market.outcomes) {
                    market.outcomes.forEach(outcome => {
                      if (outcome.name.toLowerCase().includes('tyreek') || outcome.name.toLowerCase().includes('hill')) {
                        console.log(`    🏈 TYREEK HILL FOUND: ${outcome.name} - ${outcome.point} - ${outcome.price}`);
                      }
                    });
                  }
                });
              }
            });
          }
            
            setCachedResponse(cacheKey, propsResponse.data);
            
            // Increment usage for player props API call
            const userId = req.__userId;
            const profile = req.__userProfile;
            if (userId && profile) {
              await incrementUsage(userId, profile);
              console.log(`📊 Incremented usage for player props API call`);
            }
          }
          
          // Merge player props into the existing game's bookmakers
          if (propsResponse.data && propsResponse.data.bookmakers) {
            console.log(`🔗 Merging ${propsResponse.data.bookmakers.length} bookmakers with player props`);
            
            // Check specifically for Dabble
            const dabbleData = propsResponse.data.bookmakers.find(b => b.key === 'dabble_au');
            if (dabbleData) {
              console.log(`🎰 DABBLE FOUND! Markets: ${dabbleData.markets?.length || 0}`, {
                key: dabbleData.key,
                markets: dabbleData.markets?.map(m => m.key) || []
              });
            } else {
              console.log(`❌ Dabble NOT in response. Available bookmakers:`, 
                propsResponse.data.bookmakers.map(b => b.key));
            }
            
            const existingBookmakers = new Map();
            game.bookmakers.forEach(book => {
              existingBookmakers.set(book.key, book);
            });
            
            propsResponse.data.bookmakers.forEach(propsBook => {
              const marketCount = propsBook.markets ? propsBook.markets.length : 0;
              console.log(`📈 Bookmaker ${propsBook.key} has ${marketCount} player prop markets`);
              
              if (existingBookmakers.has(propsBook.key)) {
                // Merge markets into existing bookmaker
                const existingBook = existingBookmakers.get(propsBook.key);
                existingBook.markets = [...(existingBook.markets || []), ...(propsBook.markets || [])];
                console.log(`🔗 Merged ${marketCount} player prop markets into existing ${propsBook.key}`);
              } else {
                // Add new bookmaker with only player props
                game.bookmakers.push(propsBook);
                console.log(`➕ Added new bookmaker ${propsBook.key} with ${marketCount} player prop markets`);
              }
            });
          } else {
            console.log(`❌ No player props data returned for game ${game.id}`);
            
            // Try SportsGameOdds fallback if available
            if (SPORTSGAMEODDS_API_KEY) {
              console.log(`🔄 Trying SportsGameOdds fallback for game ${game.id}...`);
              try {
                const sgoResponse = await axios.get(`https://api.sportsgameodds.com/v1/odds`, {
                  headers: { 'x-api-key': SPORTSGAMEODDS_API_KEY },
                  params: {
                    sport: game.sport_key,
                    eventId: game.id,
                    markets: playerPropMarkets.join(',')
                  },
                  timeout: PLAYER_PROPS_REQUEST_TIMEOUT
                });
                
                if (sgoResponse.data && sgoResponse.data.length > 0) {
                  console.log(`✅ SportsGameOdds fallback returned ${sgoResponse.data.length} items`);
                  // Transform SGO data to TheOddsAPI format and merge
                  // This would need the transformation logic from the memory
                } else {
                  console.log(`❌ SportsGameOdds fallback also returned no data`);
                }
              } catch (sgoErr) {
                console.error(`❌ SportsGameOdds fallback failed:`, sgoErr.message);
              }
            }
          }
          
        } catch (propsErr) {
          console.error(`❌ Failed to fetch player props for game ${game.id}:`);
          console.error(`   Status: ${propsErr.response?.status}`);
          console.error(`   Data: ${JSON.stringify(propsErr.response?.data)}`);
          console.error(`   Message: ${propsErr.message}`);
          
          // Try SportsGameOdds fallback on error
          if (SPORTSGAMEODDS_API_KEY) {
            console.log(`🔄 Trying SportsGameOdds fallback after error for game ${game.id}...`);
            try {
              const sgoResponse = await axios.get(`https://api.sportsgameodds.com/v1/odds`, {
                headers: { 'x-api-key': SPORTSGAMEODDS_API_KEY },
                params: {
                  sport: game.sport_key,
                  eventId: game.id,
                  markets: playerPropMarkets.join(',')
                },
                timeout: PLAYER_PROPS_REQUEST_TIMEOUT
              });
              
              if (sgoResponse.data && sgoResponse.data.length > 0) {
                console.log(`✅ SportsGameOdds fallback returned ${sgoResponse.data.length} items after error`);
                // Transform and merge SGO data
              }
            } catch (sgoErr) {
              console.error(`❌ SportsGameOdds fallback also failed:`, sgoErr.message);
            }
          }
          // Continue with other games even if player props fail
        }
      }
      
      console.log('🎯 Player props fetching completed');
    } else if (playerPropMarkets.length > 0) {
      console.log('🚫 Player props requested but ENABLE_PLAYER_PROPS_V2 is not enabled');
    }
    
    console.log(`🔍 Final response - returning ${allGames.length} games total`);
    console.log('🔍 User profile:', req.__userProfile?.plan || 'unknown');
    console.log('🔍 Regular markets requested:', regularMarkets);
    console.log('🔍 Filtered markets used:', filteredRegularMarkets);
    console.log('🔍 Player prop markets requested:', playerPropMarkets);
    
    // Usage already incremented per external API call above
    // No need to increment again here
    
    res.json(allGames);
  } catch (err) {
    console.error("odds error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});

app.get('/api/player-props', requireUser, checkPlanAccess, async (req, res) => {
  recordPlayerPropMetric('requests', 1);

  if (!ENABLE_PLAYER_PROPS_V2) {
    return res.status(503).json({ error: 'PLAYER_PROPS_DISABLED', message: 'Player props API is disabled. Set ENABLE_PLAYER_PROPS_V2=true to enable.' });
  }

  try {
    const league = req.query.league;
    const date = req.query.date;
    const markets = req.query.markets ? String(req.query.markets).split(',').map((m) => m.trim()).filter(Boolean) : undefined;
    const bookmakers = req.query.bookmakers ? String(req.query.bookmakers).split(',').map((b) => b.trim()).filter(Boolean) : undefined;
    const regions = req.query.regions;
    const state = (req.query.state || req.headers['x-user-state'] || DEFAULT_BOOK_STATE).toLowerCase();
    const force = req.query.force === 'true';
    const explicitGameId = req.query.game_id || req.query.gameId || null;

    if (!league || !date) {
      return res.status(400).json({ error: 'missing_parameters', message: 'league and date are required (YYYY-MM-DD)' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'invalid_date', message: 'date must be YYYY-MM-DD' });
    }

    const resolvedEventIds = explicitGameId
      ? [explicitGameId]
      : await getEventIdsForLeagueDate(league, date);

    const eventIds = resolvedEventIds.slice(0, Number(req.query.limit || 10));

    if (eventIds.length === 0) {
      return res.json({ stale: false, ttl: PLAYER_PROPS_CACHE_TTL_MS, as_of: new Date().toISOString(), items: [] });
    }

    const items = [];
    let stale = false;
    let ttl = PLAYER_PROPS_CACHE_TTL_MS;
    let freshest = 0;

    for (const eventId of eventIds) {
      const payload = await loadPlayerProps({
        sportKey: league,
        eventId,
        markets,
        bookmakers,
        regions,
        state,
        force,
      });

      if (!payload) {
        continue;
      }

      stale = stale || payload.stale;
      ttl = Math.min(ttl, payload.ttl);
      const asOfTs = payload.as_of ? Date.parse(payload.as_of) : 0;
      if (asOfTs > freshest) {
        freshest = asOfTs;
      }

      payload.items.forEach((item) => {
        items.push(item);
      });
    }

    const metrics = summarizePlayerPropMetrics();
    console.log('[player-props] metrics', {
      requests: playerPropsMetrics.requests,
      cacheHits: playerPropsMetrics.cacheHits,
      cacheMisses: playerPropsMetrics.cacheMisses,
      staleHits: playerPropsMetrics.staleHits,
      vendorErrors: playerPropsMetrics.vendorErrors,
      notModified: playerPropsMetrics.notModifiedHits,
      droppedOutcomes: playerPropsMetrics.droppedOutcomes,
      averageVendorMs: metrics?.averageVendorMs || null,
      samples: metrics?.samples || 0,
    });

    return res.json({
      stale,
      ttl,
      as_of: freshest ? new Date(freshest).toISOString() : new Date().toISOString(),
      items,
    });
  } catch (error) {
    recordPlayerPropMetric('vendorErrors', 1);
    console.error('player-props route error:', error.message);

    const status = error?.response?.status || 500;
    if (status >= 500) {
      return res.status(status).json({ error: 'PLAYER_PROPS_UPSTREAM_ERROR', detail: error.message });
    }

    return res.status(status).json({ error: 'PLAYER_PROPS_ERROR', detail: error.message });
  }
});


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

      // Additional ESPN data extraction
      const venue = comp.venue || {};
      const weather = comp.weather || null;
      const attendance = comp.attendance || null;
      const broadcasts = Array.isArray(comp.broadcasts) ? comp.broadcasts : [];
      const notes = Array.isArray(comp.notes) ? comp.notes : [];
      
      // Team statistics if available
      const homeStats = home.statistics || [];
      const awayStats = away.statistics || [];
      
      // Injury reports if available
      const homeInjuries = home.injuries || [];
      const awayInjuries = away.injuries || [];

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
        // Additional ESPN details
        venue: {
          name: venue.fullName || venue.name || null,
          city: venue.address?.city || null,
          state: venue.address?.state || null,
          capacity: venue.capacity || null,
          indoor: venue.indoor || null,
          grass: venue.grass || null
        },
        weather: weather ? {
          temperature: weather.temperature || null,
          condition: weather.conditionId || weather.displayValue || null,
          humidity: weather.humidity || null,
          windSpeed: weather.windSpeed || null
        } : null,
        attendance: attendance || null,
        broadcasts: broadcasts.map(b => ({
          network: b.market || b.type || null,
          name: b.media?.shortName || b.names?.[0] || null
        })).filter(b => b.network || b.name),
        notes: notes.map(n => n.headline || n.text || n).filter(Boolean),
        teamStats: {
          home: homeStats.length > 0 ? homeStats.reduce((acc, stat) => {
            acc[stat.name] = stat.displayValue;
            return acc;
          }, {}) : null,
          away: awayStats.length > 0 ? awayStats.reduce((acc, stat) => {
            acc[stat.name] = stat.displayValue;
            return acc;
          }, {}) : null
        },
        injuries: {
          home: homeInjuries.length > 0 ? homeInjuries.map(inj => ({
            player: inj.athlete?.displayName || null,
            status: inj.status || null,
            details: inj.details || null
          })) : null,
          away: awayInjuries.length > 0 ? awayInjuries.map(inj => ({
            player: inj.athlete?.displayName || null,
            status: inj.status || null,
            details: inj.details || null
          })) : null
        }
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

/* ------------------------------------ Cached Odds Endpoints ------------------------------------ */

// Get cached NFL odds from Supabase
app.get('/api/cached-odds/nfl', enforceUsage, async (req, res) => {
  try {
    const { markets, bookmakers, eventId } = req.query;
    
    const options = {
      markets: markets ? markets.split(',') : null,
      bookmakers: bookmakers ? bookmakers.split(',') : null,
      eventId: eventId || null
    };

    const cachedOdds = await oddsCacheService.getCachedOdds('americanfootball_nfl', options);
    
    // Transform cached data to match frontend expectations
    const transformedData = transformCachedOddsToFrontend(cachedOdds);
    
    res.set('Cache-Control', 'public, max-age=30'); // 30 second client cache
    res.json(transformedData);
  } catch (err) {
    console.error('Cached odds error:', err);
    res.status(500).json({ error: 'Failed to get cached odds', detail: err.message });
  }
});

// Manual trigger for NFL odds update (admin only)
app.post('/api/cached-odds/nfl/update', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

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

// Get update statistics
app.get('/api/cached-odds/stats', async (req, res) => {
  try {
    const { sport = 'americanfootball_nfl', limit = 10 } = req.query;
    const stats = await oddsCacheService.getUpdateStats(sport, parseInt(limit));
    res.json({ stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats', detail: err.message });
  }
});

// Start/stop NFL updates
app.post('/api/cached-odds/nfl/control', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { action } = req.body;
    
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

// Helper function to transform cached odds to frontend format
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

/* ------------------------------------ Game Reactions ------------------------------------ */

// Persistent file-based storage for reactions (better than in-memory)
const fs = require('fs');

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
// SPA fallback: keep last, after static and API routes.
// Use a middleware without a path to catch unmatched GETs in Express 5 safely.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return next();
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(404).send('Not Found');
    }
  });
});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    
    // Auto-start NFL odds caching if enabled
    if (process.env.AUTO_START_NFL_CACHE === 'true' && supabase) {
      console.log('🏈 Auto-starting NFL odds caching...');
      try {
        await oddsCacheService.startNFLUpdates();
      } catch (error) {
        console.error('❌ Failed to auto-start NFL caching:', error.message);
      }
    }
  });
}

module.exports = app;
