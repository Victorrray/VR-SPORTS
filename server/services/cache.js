/**
 * Cache Service
 * Handles in-memory caching for API responses, plans, and player props
 */

const {
  CACHE_DURATION_MS,
  PLAYER_PROPS_CACHE_DURATION_MS,
  ALTERNATE_MARKETS_CACHE_DURATION_MS,
  ALTERNATE_MARKETS,
  PLAYER_PROP_MARKETS,
  PLAYER_PROPS_MAX_CACHE_ENTRIES,
} = require('../config/constants');

// In-memory caches
const apiCache = new Map();
const planCache = new Map();
const playerPropsCache = new Map();
const playerPropsInFlight = new Map();
const oddsInFlight = new Map(); // Prevent thundering herd for odds API calls

// Player props metrics
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

/**
 * Generate cache key from endpoint and parameters
 */
function getCacheKey(endpoint, params) {
  return `${endpoint}_${JSON.stringify(params)}`;
}

/**
 * Get cached response with TTL validation
 */
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
    cacheDuration = PLAYER_PROPS_CACHE_DURATION_MS; // 30 seconds for player props
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

/**
 * Set cached response with timestamp
 */
function setCachedResponse(cacheKey, data) {
  // Check if this is an alternate market for logging purposes
  const isAlternateMarket = ALTERNATE_MARKETS.some(market => cacheKey.includes(market));
  
  apiCache.set(cacheKey, { data, timestamp: Date.now() });
  console.log(`💾 Cached response for ${cacheKey}${isAlternateMarket ? ' (alternate market with extended TTL)' : ''}`);
}

/**
 * Get cached plan for user
 */
function getCachedPlan(userId) {
  const cached = planCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > 5 * 60 * 1000) { // 5 minute TTL
    planCache.delete(userId);
    return null;
  }
  return cached.payload;
}

/**
 * Set cached plan for user
 */
function setCachedPlan(userId, payload) {
  planCache.set(userId, { payload, timestamp: Date.now() });
}

/**
 * Set player props cache entry with LRU eviction
 */
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

/**
 * Get player props cache entry
 */
function getPlayerPropsCacheEntry(key) {
  return playerPropsCache.get(key);
}

/**
 * Get player props in-flight promise
 */
function getPlayerPropsInFlight(key) {
  return playerPropsInFlight.get(key);
}

/**
 * Set player props in-flight promise
 */
function setPlayerPropsInFlight(key, promise) {
  playerPropsInFlight.set(key, promise);
}

/**
 * Delete player props in-flight promise
 */
function deletePlayerPropsInFlight(key) {
  playerPropsInFlight.delete(key);
}

/**
 * Record player props metric
 */
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

/**
 * Get player props metrics summary
 */
function summarizePlayerPropMetrics() {
  if (!playerPropsMetrics.vendorDurations.length) return null;
  const sum = playerPropsMetrics.vendorDurations.reduce((acc, v) => acc + v, 0);
  const avg = Math.round(sum / playerPropsMetrics.vendorDurations.length);
  return { averageVendorMs: avg, samples: playerPropsMetrics.vendorDurations.length };
}

/**
 * Get all player props metrics
 */
function getPlayerPropsMetrics() {
  return playerPropsMetrics;
}

/**
 * Clear plan cache for a specific user
 */
function clearUserPlanCache(userId) {
  planCache.delete(userId);
  console.log(`🗑️ Cleared plan cache for user: ${userId}`);
}

/**
 * Clear all caches (useful for testing)
 */
function clearAllCaches() {
  apiCache.clear();
  planCache.clear();
  playerPropsCache.clear();
  playerPropsInFlight.clear();
  oddsInFlight.clear();
}

/**
 * Get odds in-flight promise (prevents thundering herd)
 */
function getOddsInFlight(key) {
  return oddsInFlight.get(key);
}

/**
 * Set odds in-flight promise
 */
function setOddsInFlight(key, promise) {
  oddsInFlight.set(key, promise);
}

/**
 * Delete odds in-flight promise
 */
function deleteOddsInFlight(key) {
  oddsInFlight.delete(key);
}

module.exports = {
  // Cache key generation
  getCacheKey,
  
  // API response caching
  getCachedResponse,
  setCachedResponse,
  
  // Odds request deduplication (thundering herd prevention)
  getOddsInFlight,
  setOddsInFlight,
  deleteOddsInFlight,
  
  // Plan caching
  getCachedPlan,
  setCachedPlan,
  clearUserPlanCache,
  
  // Player props caching
  setPlayerPropsCacheEntry,
  getPlayerPropsCacheEntry,
  getPlayerPropsInFlight,
  setPlayerPropsInFlight,
  deletePlayerPropsInFlight,
  
  // Metrics
  recordPlayerPropMetric,
  summarizePlayerPropMetrics,
  getPlayerPropsMetrics,
  
  // Utilities
  clearAllCaches,
};
