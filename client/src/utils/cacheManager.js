// Advanced caching manager for odds data
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.subscribers = new Map();
    this.maxSize = 100; // Maximum cache entries
    this.defaultTTL = 30000; // 30 seconds default TTL
    this.cleanupInterval = 60000; // Cleanup every minute
    
    // Start cleanup interval
    this.startCleanup();
  }

  // Generate cache key from parameters
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${url}?${new URLSearchParams(sortedParams).toString()}`;
  }

  // Set cache entry with TTL
  set(key, data, ttl = this.defaultTTL) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
    }

    const entry = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    this.timestamps.set(key, entry.timestamp);
    
    // Notify subscribers of cache update
    this.notifySubscribers(key, data);
  }

  // Get cache entry if valid
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Check if entry has expired
    if (age > entry.ttl) {
      this.delete(key);
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.data;
  }

  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Delete cache entry
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.subscribers.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.subscribers.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    let hitRate = 0;
    let totalAccess = 0;

    for (const [key, entry] of this.cache.entries()) {
      totalSize += JSON.stringify(entry.data).length;
      totalAccess += entry.accessCount;
      
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalSize: Math.round(totalSize / 1024), // KB
      expiredCount,
      hitRate: totalAccess > 0 ? (totalAccess / (totalAccess + expiredCount)) * 100 : 0,
      memoryUsage: Math.round(totalSize / (1024 * 1024) * 100) / 100 // MB
    };
  }

  // Subscribe to cache updates for a key
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Notify subscribers of cache updates
  notifySubscribers(key, data) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Cache subscriber error:', error);
        }
      });
    }
  }

  // Prefetch data for anticipated requests
  async prefetch(key, fetchFunction, ttl = this.defaultTTL) {
    if (this.has(key)) return this.get(key);
    
    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error('Prefetch failed:', error);
      return null;
    }
  }

  // Batch get multiple keys
  getBatch(keys) {
    const results = {};
    const missing = [];
    
    keys.forEach(key => {
      const data = this.get(key);
      if (data !== null) {
        results[key] = data;
      } else {
        missing.push(key);
      }
    });
    
    return { results, missing };
  }

  // Start cleanup interval
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  // Stop cleanup interval
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  // Get cache entries sorted by access patterns
  getPopularEntries(limit = 10) {
    return Array.from(this.cache.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount)
      .slice(0, limit)
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        age: Date.now() - entry.timestamp
      }));
  }
}

// Specialized cache for odds data
class OddsCacheManager extends CacheManager {
  constructor() {
    super();
    this.liveTTL = 5000; // 5 seconds for live games
    this.upcomingTTL = 30000; // 30 seconds for upcoming games
    this.finalTTL = 300000; // 5 minutes for final games
  }

  // Smart TTL based on game status and time
  getSmartTTL(games = []) {
    if (!games.length) return this.defaultTTL;
    
    const now = new Date();
    let hasLiveGames = false;
    let nearestGameTime = Infinity;
    
    games.forEach(game => {
      // Check if game is live
      if (game.status === 'in_progress' || 
          (game.completed === false && new Date(game.commence_time) <= now)) {
        hasLiveGames = true;
      }
      
      // Find nearest upcoming game
      const gameTime = new Date(game.commence_time);
      if (gameTime > now) {
        const timeUntilGame = gameTime - now;
        nearestGameTime = Math.min(nearestGameTime, timeUntilGame);
      }
    });
    
    // Return appropriate TTL
    if (hasLiveGames) return this.liveTTL;
    if (nearestGameTime < 3600000) return 10000; // 10s if game within 1 hour
    if (nearestGameTime < 7200000) return 20000; // 20s if game within 2 hours
    return this.upcomingTTL;
  }

  // Cache odds with smart TTL
  cacheOdds(key, data) {
    const ttl = this.getSmartTTL(data);
    this.set(key, data, ttl);
    return data;
  }

  // Get odds with fallback to stale data
  getOddsWithFallback(key, maxStaleAge = 300000) { // 5 minutes max stale
    const entry = this.cache.get(key);
    if (entry) return entry;
    
    // Check for stale but recent data
    const staleEntry = this.cache.get(key);
    if (staleEntry) {
      const age = Date.now() - staleEntry.timestamp;
      if (age <= maxStaleAge) {
        console.log(`Using stale cache data (${Math.round(age/1000)}s old) for ${key}`);
        return staleEntry.data;
      }
    }
    
    return null;
  }
}

// Create singleton instances
const cacheManager = new CacheManager();
const oddsCacheManager = new OddsCacheManager();

export { CacheManager, OddsCacheManager, cacheManager, oddsCacheManager };
