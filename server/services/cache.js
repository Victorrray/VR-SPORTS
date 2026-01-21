/**
 * Cache Service
 * Handles in-memory caching for API responses, plans, and player props
 */

const {
  CACHE_DURATION_MS,
  PLAYER_PROPS_CACHE_DURATION_MS,
  PLAYER_PROPS_STALE_THRESHOLD_MS,
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

// Dedicated player props results cache (keyed by sports+markets combination)
const playerPropsResultsCache = new Map();
const playerPropsBackgroundRefresh = new Set(); // Track which keys are being refreshed

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
    return null;
  }
  
  // Use custom TTL if set, otherwise determine based on market type
  let cacheDuration;
  if (cached.customTtl) {
    cacheDuration = cached.customTtl;
  } else {
    const isAlternateMarket = ALTERNATE_MARKETS.some(market => cacheKey.includes(market));
    const isPlayerProp = PLAYER_PROP_MARKETS.some(market => cacheKey.includes(market));
    
    if (isPlayerProp) {
      cacheDuration = PLAYER_PROPS_CACHE_DURATION_MS;
    } else if (isAlternateMarket) {
      cacheDuration = ALTERNATE_MARKETS_CACHE_DURATION_MS;
    } else {
      cacheDuration = CACHE_DURATION_MS;
    }
  }
  
  if (Date.now() - cached.timestamp < cacheDuration) {
    return cached.data;
  }
  
  apiCache.delete(cacheKey);
  return null;
}

/**
 * Set cached response with timestamp and optional custom TTL
 * @param {string} cacheKey - Cache key
 * @param {any} data - Data to cache
 * @param {number} customTtl - Optional custom TTL in milliseconds
 */
function setCachedResponse(cacheKey, data, customTtl = null) {
  apiCache.set(cacheKey, { data, timestamp: Date.now(), customTtl });
}

/**
 * Clear cached response (used when cache contains stale data like past games)
 */
function clearCachedResponse(cacheKey) {
  if (apiCache.has(cacheKey)) {
    apiCache.delete(cacheKey);
    console.log(`🗑️ Cleared stale cache for ${cacheKey}`);
    return true;
  }
  return false;
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

/**
 * Get cached player props results
 * Returns { data, isStale, isFresh } or null if not cached
 */
function getCachedPlayerPropsResults(cacheKey) {
  const cached = playerPropsResultsCache.get(cacheKey);
  if (!cached) {
    return null;
  }
  
  const age = Date.now() - cached.timestamp;
  const isExpired = age > PLAYER_PROPS_CACHE_DURATION_MS;
  const isStale = age > PLAYER_PROPS_STALE_THRESHOLD_MS;
  
  if (isExpired) {
    playerPropsResultsCache.delete(cacheKey);
    return null;
  }
  
  return {
    data: cached.data,
    isStale,
    isFresh: !isStale,
    age: Math.round(age / 1000) // age in seconds
  };
}

/**
 * Set cached player props results
 */
function setCachedPlayerPropsResults(cacheKey, data) {
  playerPropsResultsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`📦 PLAYER PROPS CACHE: Stored ${data.length} props for key: ${cacheKey.substring(0, 50)}...`);
}

/**
 * Check if background refresh is in progress for a key
 */
function isPlayerPropsRefreshing(cacheKey) {
  return playerPropsBackgroundRefresh.has(cacheKey);
}

/**
 * Mark player props as refreshing (to prevent duplicate refreshes)
 */
function setPlayerPropsRefreshing(cacheKey, isRefreshing) {
  if (isRefreshing) {
    playerPropsBackgroundRefresh.add(cacheKey);
  } else {
    playerPropsBackgroundRefresh.delete(cacheKey);
  }
}

/**
 * Generate cache key for player props based on sports and markets
 */
function getPlayerPropsCacheKey(sports, markets) {
  const sortedSports = [...sports].sort().join(',');
  const sortedMarkets = [...markets].sort().join(',');
  return `pp_${sortedSports}_${sortedMarkets}`;
}

module.exports = {
  // Cache key generation
  getCacheKey,
  
  // API response caching
  getCachedResponse,
  setCachedResponse,
  clearCachedResponse,
  
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
  
  // Player props results caching (stale-while-revalidate)
  getCachedPlayerPropsResults,
  setCachedPlayerPropsResults,
  isPlayerPropsRefreshing,
  setPlayerPropsRefreshing,
  getPlayerPropsCacheKey,
};
