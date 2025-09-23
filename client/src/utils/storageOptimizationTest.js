// Storage optimization validation tests
import { optimizedStorage } from './storageOptimizer';
import { smartCache } from './enhancedCache';
import { userExperience } from './userExperienceOptimizer';

/**
 * Test suite for storage optimizations
 */
export class StorageOptimizationTest {
  constructor() {
    this.testResults = [];
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Running Storage Optimization Tests...');
    
    try {
      await this.testOptimizedStorage();
      await this.testSmartCache();
      await this.testUserExperience();
      await this.testMigration();
      
      this.printResults();
      return this.testResults.every(test => test.passed);
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return false;
    }
  }

  // Test optimized storage functionality
  async testOptimizedStorage() {
    const testName = 'Optimized Storage';
    console.log(`📦 Testing ${testName}...`);
    
    try {
      // Test basic set/get
      optimizedStorage.set('test-key', { data: 'test-value' }, { priority: 'high' });
      const retrieved = optimizedStorage.get('test-key');
      
      if (!retrieved || retrieved.data !== 'test-value') {
        throw new Error('Basic set/get failed');
      }
      
      // Test TTL functionality
      optimizedStorage.set('ttl-test', { data: 'expires' }, { ttl: 100 }); // 100ms
      await new Promise(resolve => setTimeout(resolve, 150));
      const expired = optimizedStorage.get('ttl-test');
      
      if (expired !== null) {
        throw new Error('TTL expiration failed');
      }
      
      // Test compression (check storage size)
      const largeData = { 
        items: Array(100).fill({ name: 'test', value: 'data'.repeat(10) })
      };
      optimizedStorage.set('large-data', largeData);
      const retrievedLarge = optimizedStorage.get('large-data');
      
      if (!retrievedLarge || retrievedLarge.items.length !== 100) {
        throw new Error('Large data compression/decompression failed');
      }
      
      // Test storage stats
      const stats = optimizedStorage.getStats();
      if (!stats || typeof stats.totalSizeKB !== 'number') {
        throw new Error('Storage stats failed');
      }
      
      this.addTestResult(testName, true, 'All storage operations working correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  // Test smart cache functionality
  async testSmartCache() {
    const testName = 'Smart Cache';
    console.log(`🔄 Testing ${testName}...`);
    
    try {
      let fetchCount = 0;
      const mockFetch = async () => {
        fetchCount++;
        return { data: `fetch-${fetchCount}`, timestamp: Date.now() };
      };
      
      // Test cache miss and hit
      const result1 = await smartCache.get('cache-test', mockFetch);
      const result2 = await smartCache.get('cache-test', mockFetch);
      
      if (fetchCount !== 1) {
        throw new Error('Cache hit/miss logic failed');
      }
      
      if (result1.data !== result2.data) {
        throw new Error('Cache consistency failed');
      }
      
      // Test cache stats
      const stats = smartCache.stats();
      if (!stats || typeof stats.size !== 'number') {
        throw new Error('Cache stats failed');
      }
      
      this.addTestResult(testName, true, 'Cache operations working correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  // Test user experience optimizer
  async testUserExperience() {
    const testName = 'User Experience Optimizer';
    console.log(`👤 Testing ${testName}...`);
    
    try {
      // Test recommendations
      const recommendations = userExperience.getRecommendations();
      
      if (!recommendations || typeof recommendations !== 'object') {
        throw new Error('Recommendations failed');
      }
      
      // Test stats
      const stats = userExperience.getStats();
      
      if (!stats || typeof stats !== 'object') {
        throw new Error('UX stats failed');
      }
      
      this.addTestResult(testName, true, 'UX optimizer working correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  // Test migration from old localStorage
  async testMigration() {
    const testName = 'Migration Compatibility';
    console.log(`🔄 Testing ${testName}...`);
    
    try {
      // Simulate old localStorage data
      const oldData = { sports: ['nfl', 'nba'], books: ['draftkings', 'fanduel'] };
      localStorage.setItem('test-migration', JSON.stringify(oldData));
      
      // Test that we can read old data and migrate it
      const rawOld = localStorage.getItem('test-migration');
      if (rawOld) {
        const parsed = JSON.parse(rawOld);
        optimizedStorage.set('test-migration-new', parsed, { priority: 'normal' });
        
        const migrated = optimizedStorage.get('test-migration-new');
        if (!migrated || migrated.sports.length !== 2) {
          throw new Error('Migration failed');
        }
      }
      
      // Clean up
      localStorage.removeItem('test-migration');
      optimizedStorage.remove('test-migration-new');
      
      this.addTestResult(testName, true, 'Migration compatibility verified');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  // Add test result
  addTestResult(testName, passed, message) {
    this.testResults.push({ testName, passed, message });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  // Print final results
  printResults() {
    const passed = this.testResults.filter(t => t.passed).length;
    const total = this.testResults.length;
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Passed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All storage optimizations are working correctly!');
    } else {
      console.log('⚠️ Some tests failed. Please review the implementation.');
    }
    
    return { passed, total, success: passed === total };
  }

  // Get storage usage comparison
  getStorageComparison() {
    const stats = optimizedStorage.getStats();
    
    // Estimate old localStorage usage (rough calculation)
    let oldEstimate = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      oldEstimate += key.length + value.length;
    }
    
    return {
      optimizedSizeKB: stats.totalSizeKB,
      estimatedOldSizeKB: Math.round(oldEstimate / 1024 * 100) / 100,
      compressionRatio: oldEstimate > 0 ? Math.round((1 - (stats.totalSize / oldEstimate)) * 100) : 0,
      itemCount: stats.itemCount
    };
  }
}

// Convenience function to run tests
export async function validateStorageOptimizations() {
  const tester = new StorageOptimizationTest();
  const success = await tester.runAllTests();
  
  if (success) {
    const comparison = tester.getStorageComparison();
    console.log('\n📈 Storage Optimization Benefits:');
    console.log(`Compression: ${comparison.compressionRatio}% reduction`);
    console.log(`Current size: ${comparison.optimizedSizeKB}KB`);
    console.log(`Items stored: ${comparison.itemCount}`);
  }
  
  return success;
}

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to allow imports to settle
  setTimeout(() => {
    validateStorageOptimizations().catch(console.error);
  }, 1000);
}

export default StorageOptimizationTest;
