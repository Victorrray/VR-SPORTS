/**
 * Market Name Cache Utility
 * Caches market name formatting to improve performance
 */

// In-memory cache for market names
const marketNameCache = new Map();

// Base market name mappings
const MARKET_NAMES = {
  'h2h': 'MONEYLINE',
  'spreads': 'SPREAD',
  'totals': 'TOTAL',
  'h2h_lay': 'MONEYLINE LAY',
  'h2h_3_way': 'MONEYLINE 3-WAY',
  'draw_no_bet': 'DRAW NO BET',
  'btts': 'BOTH TEAMS TO SCORE',
  'player_points': 'PLAYER POINTS',
  'player_rebounds': 'PLAYER REBOUNDS',
  'player_assists': 'PLAYER ASSISTS',
  'player_passes': 'PLAYER PASSES',
  'player_rushing_yards': 'PLAYER RUSHING YARDS',
  'player_receiving_yards': 'PLAYER RECEIVING YARDS',
  'player_anytime_touchdown': 'ANYTIME TOUCHDOWN',
  'player_first_touchdown': 'FIRST TOUCHDOWN',
  'player_last_touchdown': 'LAST TOUCHDOWN',
  'player_goal_scorer': 'GOAL SCORER',
  'player_first_goal_scorer': 'FIRST GOAL SCORER',
  'player_anytime_goal_scorer': 'ANYTIME GOAL SCORER',
};

// Quarter/half/period prefixes
const QUARTER_PATTERNS = {
  '_q1': 'Q1',
  '_q2': 'Q2',
  '_q3': 'Q3',
  '_q4': 'Q4',
  '_h1': 'H1',
  '_h2': 'H2',
  '_p1': 'P1',
  '_p2': 'P2',
  '_p3': 'P3',
  '_1st_': '1ST',
};

/**
 * Get formatted market display name with caching
 * @param {string} market - The market key (e.g., 'h2h', 'h2h_q1', 'spreads')
 * @returns {string} - Formatted market name (e.g., 'MONEYLINE', 'Q1 MONEYLINE')
 */
export function getMarketDisplayName(market) {
  if (!market) return '';

  // Check cache first
  if (marketNameCache.has(market)) {
    return marketNameCache.get(market);
  }

  const marketLower = String(market).toLowerCase();

  // Extract quarter/half/period prefix
  let quarterPrefix = '';
  for (const [pattern, prefix] of Object.entries(QUARTER_PATTERNS)) {
    if (marketLower.includes(pattern)) {
      quarterPrefix = prefix;
      break;
    }
  }

  // Remove quarter/half/period suffix to get base market
  let baseMarket = marketLower;
  for (const pattern of Object.keys(QUARTER_PATTERNS)) {
    baseMarket = baseMarket.replace(pattern, '');
  }

  // Get base market name
  const baseName = MARKET_NAMES[baseMarket] || baseMarket.toUpperCase();

  // Combine quarter prefix with base name
  const result = quarterPrefix ? `${quarterPrefix} ${baseName}` : baseName;

  // Cache the result
  marketNameCache.set(market, result);

  return result;
}

/**
 * Clear the market name cache (useful for testing or if market names change)
 */
export function clearMarketNameCache() {
  marketNameCache.clear();
}

/**
 * Get cache statistics for debugging
 * @returns {object} - Cache statistics
 */
export function getMarketNameCacheStats() {
  return {
    size: marketNameCache.size,
    entries: Array.from(marketNameCache.entries()),
  };
}

/**
 * Batch format multiple market names
 * @param {string[]} markets - Array of market keys
 * @returns {object} - Map of market key to formatted name
 */
export function getMarketDisplayNames(markets) {
  const result = {};
  for (const market of markets) {
    result[market] = getMarketDisplayName(market);
  }
  return result;
}
