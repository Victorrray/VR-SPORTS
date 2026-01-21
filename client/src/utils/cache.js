// src/utils/cache.js
// Unified caching utility with consistent TTLs and strategies

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  ODDS: 2 * 60 * 1000,           // 2 minutes - odds data changes frequently
  PERIOD_MARKETS: 5 * 60 * 1000, // 5 minutes - period markets update less frequently
  LOGOS: 15 * 60 * 1000,         // 15 minutes - team logos rarely change
  USER_DATA: 5 * 60 * 1000,      // 5 minutes - user profile, plan data
  STATIC: 60 * 60 * 1000,        // 1 hour - static data like sports list
};

// In-memory cache with TTL support
class CacheStore {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Set a value in the cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, data, ttl = CACHE_TTL.ODDS) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    this.stats.sets++;
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if expired/missing
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      this.stats.misses++;
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > cached.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return cached.data;
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    if (age > cached.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a specific key
   * @param {string} key - Cache key
   */
  delete(key) {
    this.stats.deletes++;
    return this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : 0;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Get the age of a cached item in milliseconds
   * @param {string} key - Cache key
   * @returns {number|null} - Age in ms or null if not found
   */
  getAge(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    return Date.now() - cached.timestamp;
  }
}

// Singleton instance for the application
export const appCache = new CacheStore();

// Helper functions for common cache operations
export const cacheHelpers = {
  /**
   * Generate a cache key for odds data
   */
  oddsKey: (sports, markets, regions) => {
    const s = Array.isArray(sports) ? sports.sort().join(',') : sports;
    const m = Array.isArray(markets) ? markets.sort().join(',') : markets;
    const r = Array.isArray(regions) ? regions.sort().join(',') : regions;
    return `odds:${s}:${m}:${r}`;
  },

  /**
   * Generate a cache key for period markets
   */
  periodMarketsKey: (sport, eventId) => `period:${sport}:${eventId}`,

  /**
   * Generate a cache key for team logos
   */
  logosKey: (sport) => `logos:${sport}`,

  /**
   * Generate a cache key for user data
   */
  userKey: (userId, type) => `user:${userId}:${type}`,
};

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    appCache.cleanup();
  }, 5 * 60 * 1000);
}

// Export for backward compatibility with existing APICache usage
export class APICache {
  static set(key, data, ttl) {
    appCache.set(key, data, ttl || CACHE_TTL.ODDS);
  }

  static get(key) {
    return appCache.get(key);
  }

  static delete(key) {
    return appCache.delete(key);
  }

  static clear() {
    appCache.clear();
  }

  static size() {
    return appCache.cache.size;
  }
}

// Make cache available globally for debugging
if (typeof window !== 'undefined') {
  window.__appCache = appCache;
}
