// Storage optimization utilities for VR-Odds platform
class StorageOptimizer {
  constructor() {
    this.compressionEnabled = true;
    this.maxStorageSize = 5 * 1024 * 1024; // 5MB limit
    this.cleanupThreshold = 0.8; // Clean up when 80% full
  }

  // Compress data before storing
  compress(data) {
    if (!this.compressionEnabled) return JSON.stringify(data);
    
    try {
      const jsonString = JSON.stringify(data);
      // Simple compression: remove whitespace and common patterns
      return jsonString
        .replace(/\s+/g, ' ')
        .replace(/": "/g, '":"')
        .replace(/", "/g, '","')
        .replace(/\[ "/g, '["')
        .replace(/" \]/g, '"]');
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return JSON.stringify(data);
    }
  }

  // Decompress data after retrieval
  decompress(compressedData) {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return null;
    }
  }

  // Smart storage with automatic cleanup
  setItem(key, value, options = {}) {
    const { ttl, priority = 'normal', compress = true } = options;
    
    const data = {
      value,
      timestamp: Date.now(),
      ttl: ttl || null,
      priority,
      accessCount: 0
    };

    const serialized = compress ? this.compress(data) : JSON.stringify(data);
    
    try {
      // Check storage space before storing
      if (this.shouldCleanup()) {
        this.cleanup();
      }

      localStorage.setItem(key, serialized);
      
      // Update access tracking
      this.updateAccessLog(key);
      
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting cleanup...');
        this.cleanup();
        try {
          localStorage.setItem(key, serialized);
        } catch (retryError) {
          console.error('Storage failed even after cleanup:', retryError);
          this.emergencyCleanup();
        }
      } else {
        console.error('Storage error:', error);
      }
    }
  }

  // Smart retrieval with TTL checking
  getItem(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;

      const data = this.decompress(stored);
      if (!data) return defaultValue;

      // Check TTL
      if (data.ttl && Date.now() - data.timestamp > data.ttl) {
        localStorage.removeItem(key);
        return defaultValue;
      }

      // Update access tracking
      data.accessCount = (data.accessCount || 0) + 1;
      this.setItem(key, data.value, { 
        ttl: data.ttl, 
        priority: data.priority,
        compress: false // Already processed
      });

      return data.value;
    } catch (error) {
      console.warn('Retrieval error for key:', key, error);
      return defaultValue;
    }
  }

  // Check if cleanup is needed
  shouldCleanup() {
    try {
      const used = new Blob(Object.values(localStorage)).size;
      return used > (this.maxStorageSize * this.cleanupThreshold);
    } catch (error) {
      return false;
    }
  }

  // Intelligent cleanup based on priority and access patterns
  cleanup() {
    const items = [];
    
    // Collect all items with metadata
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const data = this.decompress(localStorage.getItem(key));
        if (data && data.timestamp) {
          items.push({
            key,
            ...data,
            age: Date.now() - data.timestamp,
            size: localStorage.getItem(key).length
          });
        }
      } catch (error) {
        // Invalid data, mark for removal
        items.push({ key, priority: 'remove', age: Infinity });
      }
    }

    // Sort by cleanup priority (expired first, then by access patterns)
    items.sort((a, b) => {
      // Remove expired items first
      const aExpired = a.ttl && a.age > a.ttl;
      const bExpired = b.ttl && b.age > b.ttl;
      if (aExpired && !bExpired) return -1;
      if (!aExpired && bExpired) return 1;

      // Then by priority
      const priorityOrder = { high: 3, normal: 2, low: 1, remove: 0 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Finally by access patterns (age vs access count)
      const aScore = (a.accessCount || 0) / Math.max(a.age / 86400000, 1); // per day
      const bScore = (b.accessCount || 0) / Math.max(b.age / 86400000, 1);
      return aScore - bScore;
    });

    // Remove items until we're under threshold
    let removedCount = 0;
    for (const item of items.slice(0, Math.ceil(items.length * 0.3))) {
      localStorage.removeItem(item.key);
      removedCount++;
    }

    console.log(`Storage cleanup: removed ${removedCount} items`);
  }

  // Emergency cleanup - remove everything except critical data
  emergencyCleanup() {
    const critical = [
      'vr-odds-remember-me',
      'vr-odds-remembered-email',
      'userSelectedSportsbooks',
      'userBankroll'
    ];

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!critical.includes(key)) {
        localStorage.removeItem(key);
      }
    }

    console.warn('Emergency storage cleanup performed');
  }

  // Update access tracking
  updateAccessLog(key) {
    const accessLog = this.getAccessLog();
    accessLog[key] = {
      lastAccess: Date.now(),
      count: (accessLog[key]?.count || 0) + 1
    };
    
    // Keep only recent access data
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    Object.keys(accessLog).forEach(k => {
      if (accessLog[k].lastAccess < cutoff) {
        delete accessLog[k];
      }
    });

    localStorage.setItem('_storage_access_log', JSON.stringify(accessLog));
  }

  // Get access log
  getAccessLog() {
    try {
      return JSON.parse(localStorage.getItem('_storage_access_log') || '{}');
    } catch (error) {
      return {};
    }
  }

  // Get storage statistics
  getStorageStats() {
    let totalSize = 0;
    let itemCount = 0;
    const items = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = value.length;
      
      totalSize += size;
      itemCount++;
      items[key] = {
        size,
        sizeKB: Math.round(size / 1024 * 100) / 100
      };
    }

    return {
      totalSize,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      itemCount,
      maxSize: this.maxStorageSize,
      usagePercent: Math.round((totalSize / this.maxStorageSize) * 100),
      items
    };
  }
}

// Optimized storage categories
export const StorageCategories = {
  // Critical data that should never be cleaned up
  CRITICAL: {
    keys: ['vr-odds-remember-me', 'vr-odds-remembered-email', 'userSelectedSportsbooks', 'userBankroll'],
    priority: 'high',
    ttl: null
  },
  
  // User preferences that should persist
  PREFERENCES: {
    keys: ['vr-odds-sports', 'vr-odds-markets', 'vr-odds-preset'],
    priority: 'normal',
    ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  
  // Session data that can be cleaned up
  SESSION: {
    keys: ['vr-odds-query', 'vr-odds-date', 'vr-odds-books', 'vr-odds-minev'],
    priority: 'low',
    ttl: 24 * 60 * 60 * 1000 // 1 day
  },
  
  // Cached data with short TTL
  CACHE: {
    keys: ['oss-plan-info', 'oss-user-stats'],
    priority: 'low',
    ttl: 5 * 60 * 1000 // 5 minutes
  }
};

// Create singleton instance
export const storageOptimizer = new StorageOptimizer();

// Convenience functions
export const optimizedStorage = {
  // Set with automatic optimization
  set: (key, value, options = {}) => {
    // Auto-detect category and apply appropriate settings
    const category = Object.values(StorageCategories).find(cat => 
      cat.keys.includes(key)
    );
    
    if (category) {
      options = { ...options, priority: category.priority, ttl: category.ttl };
    }
    
    return storageOptimizer.setItem(key, value, options);
  },
  
  // Get with automatic decompression and TTL checking
  get: (key, defaultValue = null) => {
    return storageOptimizer.getItem(key, defaultValue);
  },
  
  // Remove item
  remove: (key) => {
    localStorage.removeItem(key);
  },
  
  // Clear all non-critical data
  clearSession: () => {
    const critical = StorageCategories.CRITICAL.keys;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!critical.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  },
  
  // Get storage statistics
  getStats: () => storageOptimizer.getStorageStats()
};

export default storageOptimizer;
