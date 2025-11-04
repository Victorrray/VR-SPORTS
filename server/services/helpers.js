/**
 * Helper Functions
 * Utility functions for odds processing, market handling, and data transformation
 */

const {
  PLAYER_PROPS_MARKET_MAP,
  DEFAULT_PLAYER_PROP_MARKETS,
  INVALID_PLAYER_PROP_MARKETS,
  PLAYER_PROPS_TIMEZONE,
  DEFAULT_BOOK_STATE,
  MAX_BOOKMAKERS,
  FOCUSED_BOOKMAKERS,
  TRIAL_BOOKMAKERS,
  ALTERNATE_MARKETS,
  PLAYER_PROP_MARKETS,
} = require('../config/constants');

/**
 * Filter out invalid player prop markets
 */
function filterValidMarkets(markets) {
  return markets.filter(market => !INVALID_PLAYER_PROP_MARKETS.includes(market));
}

/**
 * Canonicalize market name to standard format
 */
function canonicalizeMarket(marketKey = '') {
  const key = String(marketKey || '').toLowerCase();
  return PLAYER_PROPS_MARKET_MAP[key] || key;
}

/**
 * Convert canonical market name to display format
 */
function displayMarketName(canonicalKey) {
  return String(canonicalKey || '')
    .replace(/player_/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Split array into chunks of specified size
 */
function chunkArray(items = [], size = 1) {
  if (!Array.isArray(items) || size <= 0) return [items];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Safely convert value to number
 */
function safeNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim().toUpperCase();
    if (trimmed === 'EVEN') return 100;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolve bookmaker URL with state substitution
 */
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

/**
 * Convert date and time to ISO format in specified timezone
 */
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

/**
 * Get current monthly window (UTC)
 */
function currentMonthlyWindow(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

/**
 * Clamp bookmaker list to MAX_BOOKMAKERS
 */
function clampBookmakers(bookmakers = []) {
  if (!bookmakers || bookmakers.length === 0) {
    return FOCUSED_BOOKMAKERS;
  }
  
  // Dedupe and limit to MAX_BOOKMAKERS
  const uniqueBooks = [...new Set(bookmakers)];
  return uniqueBooks.slice(0, MAX_BOOKMAKERS);
}

/**
 * Get bookmakers allowed for user plan
 */
function getBookmakersForPlan(plan) {
  // Gold plan (and grandfathered platinum) get full access
  if (plan === 'gold' || plan === 'platinum') {
    return FOCUSED_BOOKMAKERS;
  }
  // Legacy free/trial users (should not exist after migration)
  return TRIAL_BOOKMAKERS;
}

/**
 * Build event odds URL with parameters
 */
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

/**
 * Transform Supabase cached odds back to The Odds API format
 */
function transformCachedOddsToApiFormat(cachedOdds) {
  if (!cachedOdds || cachedOdds.length === 0) return [];
  
  // Group by event_id to reconstruct games
  const gamesMap = new Map();
  
  cachedOdds.forEach(cached => {
    const eventId = cached.event_id;
    
    if (!gamesMap.has(eventId)) {
      gamesMap.set(eventId, {
        id: eventId,
        sport_key: cached.sport_key,
        sport_title: cached.sport_title || cached.sport_key.toUpperCase(),
        commence_time: cached.commence_time,
        home_team: cached.home_team,
        away_team: cached.away_team,
        bookmakers: []
      });
    }
    
    const game = gamesMap.get(eventId);
    
    // Find or create bookmaker
    let bookmaker = game.bookmakers.find(b => b.key === cached.bookmaker_key);
    if (!bookmaker) {
      bookmaker = {
        key: cached.bookmaker_key,
        title: cached.bookmaker_title || cached.bookmaker_key,
        last_update: cached.last_update || new Date().toISOString(),
        markets: []
      };
      game.bookmakers.push(bookmaker);
    }
    
    // Find or create market
    let market = bookmaker.markets.find(m => m.key === cached.market_key);
    if (!market) {
      market = {
        key: cached.market_key,
        last_update: cached.last_update || new Date().toISOString(),
        outcomes: []
      };
      bookmaker.markets.push(market);
    }
    
    // Add outcome if it has odds data
    if (cached.odds_data && typeof cached.odds_data === 'object') {
      const outcomes = Array.isArray(cached.odds_data) ? cached.odds_data : [cached.odds_data];
      outcomes.forEach(outcome => {
        if (outcome && outcome.name && outcome.price !== undefined) {
          market.outcomes.push(outcome);
        }
      });
    }
  });
  
  return Array.from(gamesMap.values());
}

/**
 * Save odds data to Supabase for persistent caching
 */
async function saveOddsToSupabase(games, sportKey, supabase) {
  if (!supabase || !games || games.length === 0) return;
  
  const cacheEntries = [];
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minute cache
  
  games.forEach(game => {
    game.bookmakers?.forEach(bookmaker => {
      bookmaker.markets?.forEach(market => {
        // Create a cache entry for each market
        cacheEntries.push({
          sport_key: sportKey,
          event_id: game.id,
          home_team: game.home_team,
          away_team: game.away_team,
          commence_time: game.commence_time,
          bookmaker_key: bookmaker.key,
          bookmaker_title: bookmaker.title,
          market_key: market.key,
          odds_data: market.outcomes, // Store all outcomes as JSON
          last_update: bookmaker.last_update || now,
          expires_at: expiresAt,
          created_at: now
        });
      });
    });
  });
  
  if (cacheEntries.length === 0) return;
  
  // Upsert to Supabase (update if exists, insert if new)
  const { error } = await supabase
    .from('cached_odds')
    .upsert(cacheEntries, {
      onConflict: 'sport_key,event_id,bookmaker_key,market_key'
    });
  
  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }
}

module.exports = {
  filterValidMarkets,
  canonicalizeMarket,
  displayMarketName,
  chunkArray,
  safeNumber,
  resolveBookUrl,
  toISOInTimeZone,
  currentMonthlyWindow,
  clampBookmakers,
  getBookmakersForPlan,
  buildEventOddsUrl,
  transformCachedOddsToApiFormat,
  saveOddsToSupabase,
};
