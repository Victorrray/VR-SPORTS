// Enhanced caching strategy for optimal user experience
import { oddsCacheManager } from './cacheManager.js';

class EnhancedCacheStrategy {
  constructor() {
    this.strategies = {
      // Critical data - cache aggressively
      CRITICAL: {
        ttl: 300000, // 5 minutes
        staleWhileRevalidate: true,
        prefetch: true,
        priority: 'high'
      },
      
      // Live data - short cache with background updates
      LIVE: {
        ttl: 5000, // 5 seconds
        staleWhileRevalidate: true,
        backgroundSync: true,
        priority: 'high'
      },
      
      // Static data - long cache
      STATIC: {
        ttl: 3600000, // 1 hour
        staleWhileRevalidate: false,
        priority: 'normal'
      },
      
      // User data - medium cache with sync
      USER: {
        ttl: 300000, // 5 minutes
        staleWhileRevalidate: true,
        syncAcrossTabs: true,
        priority: 'high'
      }
    };
    
    this.prefetchQueue = new Set();
    this.backgroundSyncQueue = new Set();
    this.setupBackgroundTasks();
  }

  // Intelligent cache key generation
  generateCacheKey(url, params = {}, userContext = {}) {
    // Include user-specific context for personalized caching
    const contextKey = this.generateContextKey(userContext);
    const paramKey = this.generateParamKey(params);
    
    return `${url}:${paramKey}:${contextKey}`;
  }

  generateContextKey(userContext) {
    const { userId, plan, preferences = {} } = userContext;
    const prefKey = Object.keys(preferences)
      .sort()
      .map(k => `${k}=${preferences[k]}`)
      .join('&');
    
    return `u=${userId || 'anon'}:p=${plan || 'free'}:pref=${prefKey}`;
  }

  generateParamKey(params) {
    return Object.keys(params)
      .sort()
      .map(k => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');
  }

  // Smart caching with strategy selection
  async cache(key, data, options = {}) {
    const strategy = this.selectStrategy(key, options);
    const cacheKey = this.enhanceKey(key, strategy);
    
    // Store with enhanced metadata
    const enhancedData = {
      data,
      strategy: strategy.name,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      version: '1.0.0'
    };

    oddsCacheManager.set(cacheKey, enhancedData, strategy.ttl);
    
    // Handle strategy-specific actions
    if (strategy.prefetch && !this.prefetchQueue.has(key)) {
      this.schedulePrefetch(key, options);
    }
    
    if (strategy.backgroundSync) {
      this.scheduleBackgroundSync(key, options);
    }
    
    return data;
  }

  // Smart retrieval with fallback strategies
  async get(key, fetchFunction, options = {}) {
    const strategy = this.selectStrategy(key, options);
    const cacheKey = this.enhanceKey(key, strategy);
    
    // Try cache first
    const cached = oddsCacheManager.get(cacheKey);
    if (cached) {
      // Handle stale-while-revalidate
      if (strategy.staleWhileRevalidate && this.isStale(cached, strategy)) {
        this.scheduleBackgroundUpdate(key, fetchFunction, options);
      }
      
      return cached.data;
    }
    
    // Cache miss - fetch from source
    try {
      const data = await fetchFunction();
      await this.cache(key, data, options);
      return data;
    } catch (error) {
      // Try to return stale data if available
      const staleData = this.getStaleData(cacheKey);
      if (staleData) {
        console.warn('Returning stale data due to fetch error:', error);
        return staleData.data;
      }
      throw error;
    }
  }

  // Select appropriate caching strategy
  selectStrategy(key, options = {}) {
    const { type, priority, customTTL } = options;
    
    // Custom strategy
    if (customTTL) {
      return {
        name: 'CUSTOM',
        ttl: customTTL,
        staleWhileRevalidate: true,
        priority: priority || 'normal'
      };
    }
    
    // Auto-detect strategy based on key patterns
    if (key.includes('/odds') || key.includes('/scores')) {
      return { name: 'LIVE', ...this.strategies.LIVE };
    }
    
    if (key.includes('/user') || key.includes('/profile')) {
      return { name: 'USER', ...this.strategies.USER };
    }
    
    if (key.includes('/sports') || key.includes('/bookmakers')) {
      return { name: 'STATIC', ...this.strategies.STATIC };
    }
    
    // Default to critical strategy
    return { name: 'CRITICAL', ...this.strategies.CRITICAL };
  }

  // Enhanced key with strategy info
  enhanceKey(key, strategy) {
    return `${strategy.name}:${key}`;
  }

  // Check if data is stale
  isStale(cachedData, strategy) {
    const age = Date.now() - cachedData.timestamp;
    return age > (strategy.ttl * 0.8); // Consider stale at 80% of TTL
  }

  // Get stale data for fallback
  getStaleData(key) {
    // Look for any version of the key (different strategies)
    const allKeys = Array.from(oddsCacheManager.cache.keys());
    const matchingKey = allKeys.find(k => k.includes(key.split(':').slice(1).join(':')));
    
    if (matchingKey) {
      const entry = oddsCacheManager.cache.get(matchingKey);
      if (entry && Date.now() - entry.timestamp < 3600000) { // Max 1 hour stale
        return entry;
      }
    }
    
    return null;
  }

  // Schedule prefetch for anticipated requests
  schedulePrefetch(key, options) {
    if (this.prefetchQueue.has(key)) return;
    
    this.prefetchQueue.add(key);
    
    // Prefetch after a short delay
    setTimeout(async () => {
      try {
        if (options.prefetchFunction) {
          const data = await options.prefetchFunction();
          await this.cache(key, data, { ...options, prefetch: false });
        }
      } catch (error) {
        console.warn('Prefetch failed for:', key, error);
      } finally {
        this.prefetchQueue.delete(key);
      }
    }, 1000);
  }

  // Schedule background sync
  scheduleBackgroundSync(key, options) {
    if (this.backgroundSyncQueue.has(key)) return;
    
    this.backgroundSyncQueue.add(key);
    
    // Register for background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register(`cache-sync-${key}`);
      }).catch(error => {
        console.warn('Background sync registration failed:', error);
      });
    }
  }

  // Schedule background update for stale-while-revalidate
  scheduleBackgroundUpdate(key, fetchFunction, options) {
    setTimeout(async () => {
      try {
        const data = await fetchFunction();
        await this.cache(key, data, options);
      } catch (error) {
        console.warn('Background update failed for:', key, error);
      }
    }, 100); // Update in background after 100ms
  }

  // Setup background tasks
  setupBackgroundTasks() {
    // Periodic cleanup
    setInterval(() => {
      this.performMaintenance();
    }, 300000); // Every 5 minutes
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      this.handleOffline();
    });
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handlePageVisible();
      }
    });
  }

  // Maintenance tasks
  performMaintenance() {
    // Clean up expired entries
    oddsCacheManager.cleanup();
    
    // Clear old prefetch queue items
    this.prefetchQueue.clear();
    
    // Log cache statistics
    const stats = oddsCacheManager.getStats();
    if (stats.size > 50) {
      console.log('Cache stats:', stats);
    }
  }

  // Handle online event
  handleOnline() {
    console.log('Back online - syncing cache');
    
    // Trigger background sync for queued items
    this.backgroundSyncQueue.forEach(key => {
      // Attempt to refresh cached data
      const cacheKey = Array.from(oddsCacheManager.cache.keys())
        .find(k => k.includes(key));
      
      if (cacheKey) {
        // Mark for refresh
        const entry = oddsCacheManager.cache.get(cacheKey);
        if (entry) {
          entry.needsRefresh = true;
        }
      }
    });
    
    this.backgroundSyncQueue.clear();
  }

  // Handle offline event
  handleOffline() {
    console.log('Gone offline - extending cache TTLs');
    
    // Extend TTLs for all cached data
    for (const [key, entry] of oddsCacheManager.cache.entries()) {
      entry.ttl = Math.max(entry.ttl, 3600000); // At least 1 hour offline
    }
  }

  // Handle page becoming visible
  handlePageVisible() {
    // Refresh critical data when page becomes visible
    const criticalKeys = Array.from(oddsCacheManager.cache.keys())
      .filter(key => key.startsWith('CRITICAL:') || key.startsWith('LIVE:'));
    
    criticalKeys.forEach(key => {
      const entry = oddsCacheManager.cache.get(key);
      if (entry && this.isStale(entry, { ttl: 30000 })) { // 30s threshold
        entry.needsRefresh = true;
      }
    });
  }

  // Get comprehensive cache statistics
  getCacheStats() {
    const baseStats = oddsCacheManager.getStats();
    
    return {
      ...baseStats,
      strategies: Object.keys(this.strategies).reduce((acc, strategy) => {
        const keys = Array.from(oddsCacheManager.cache.keys())
          .filter(key => key.startsWith(`${strategy}:`));
        
        acc[strategy] = {
          count: keys.length,
          totalSize: keys.reduce((size, key) => {
            const entry = oddsCacheManager.cache.get(key);
            return size + (entry ? JSON.stringify(entry).length : 0);
          }, 0)
        };
        
        return acc;
      }, {}),
      prefetchQueue: this.prefetchQueue.size,
      backgroundSyncQueue: this.backgroundSyncQueue.size
    };
  }
}

// Create singleton instance
export const enhancedCache = new EnhancedCacheStrategy();

// Convenience wrapper functions
export const smartCache = {
  // Cache with automatic strategy selection
  set: (key, data, options = {}) => enhancedCache.cache(key, data, options),
  
  // Get with automatic fallback and refresh
  get: (key, fetchFunction, options = {}) => enhancedCache.get(key, fetchFunction, options),
  
  // Prefetch data for better UX
  prefetch: (key, fetchFunction, options = {}) => {
    return enhancedCache.get(key, fetchFunction, { ...options, prefetch: true });
  },
  
  // Get cache statistics
  stats: () => enhancedCache.getCacheStats()
};

export default enhancedCache;
