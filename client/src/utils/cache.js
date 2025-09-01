// Simple in-memory cache with TTL support
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttlMs = 300000) { // 5 minutes default
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlMs);
    
    this.timers.set(key, timer);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  size() {
    return this.cache.size;
  }
}

// Create singleton instance
export const apiCache = new MemoryCache();

// Cache key generators
export const cacheKeys = {
  odds: (sports, markets, books) => `odds:${sports.join(',')}:${markets.join(',')}:${books.join(',')}`,
  scores: (sport, date) => `scores:${sport}:${date}`,
  profile: (userId) => `profile:${userId}`,
  quota: () => 'api:quota'
};

// Cache utilities
export const cacheUtils = {
  // Wrap API calls with caching
  withCache: async (key, fetchFn, ttlMs = 300000) => {
    // Check cache first
    const cached = apiCache.get(key);
    if (cached) {
      console.log(`Cache hit: ${key}`);
      return cached;
    }

    // Fetch and cache
    console.log(`Cache miss: ${key}`);
    try {
      const result = await fetchFn();
      apiCache.set(key, result, ttlMs);
      return result;
    } catch (error) {
      console.error(`Cache fetch error for ${key}:`, error);
      throw error;
    }
  },

  // Invalidate related cache entries
  invalidatePattern: (pattern) => {
    const keys = Array.from(apiCache.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    });
  },

  // Get cache stats
  getStats: () => ({
    size: apiCache.size(),
    keys: Array.from(apiCache.cache.keys()),
    memory: JSON.stringify(Array.from(apiCache.cache.entries())).length
  })
};

export default apiCache;
