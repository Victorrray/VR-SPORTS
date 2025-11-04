/**
 * Cache Utilities
 * Functions to clear browser cache and force fresh data loads
 */

/**
 * Clear all browser caches
 * Clears localStorage, sessionStorage, and IndexedDB
 */
export async function clearAllCaches() {
  console.log('🧹 Starting comprehensive cache clear...');
  
  try {
    // Clear localStorage
    console.log('🧹 Clearing localStorage...');
    localStorage.clear();
    console.log('✅ localStorage cleared');
  } catch (e) {
    console.warn('⚠️ Could not clear localStorage:', e);
  }
  
  try {
    // Clear sessionStorage
    console.log('🧹 Clearing sessionStorage...');
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
  } catch (e) {
    console.warn('⚠️ Could not clear sessionStorage:', e);
  }
  
  try {
    // Clear IndexedDB
    console.log('🧹 Clearing IndexedDB...');
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      indexedDB.deleteDatabase(db.name);
    }
    console.log('✅ IndexedDB cleared');
  } catch (e) {
    console.warn('⚠️ Could not clear IndexedDB:', e);
  }
  
  try {
    // Clear service worker cache
    console.log('🧹 Clearing service worker cache...');
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      console.log('✅ Service worker cache cleared');
    }
  } catch (e) {
    console.warn('⚠️ Could not clear service worker cache:', e);
  }
  
  console.log('✅ All caches cleared successfully');
}

/**
 * Clear plan-related caches only (preserves user preferences like bankroll & sportsbooks)
 */
export function clearPlanCache() {
  console.log('🧹 Clearing plan cache (preserving bankroll & sportsbooks)...');
  
  try {
    localStorage.removeItem('userPlan');
    localStorage.removeItem('me');
    localStorage.removeItem('plan');
    localStorage.removeItem('planData');
    console.log('✅ Plan cache cleared (bankroll & sportsbooks preserved)');
  } catch (e) {
    console.warn('⚠️ Could not clear plan cache:', e);
  }
}

/**
 * Force a hard refresh of the page
 * Clears cache and reloads without using cached version
 */
export function hardRefresh() {
  console.log('🔄 Performing hard refresh...');
  
  // Clear caches
  clearAllCaches();
  
  // Force reload without cache
  setTimeout(() => {
    window.location.reload(true);
  }, 100);
}

/**
 * Disable caching for a specific URL
 * Returns headers that prevent caching
 */
export function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Cache-Buster': Date.now().toString()
  };
}

/**
 * Generate a cache-busting query parameter
 */
export function getCacheBuster() {
  return `t=${Date.now()}&_=${Date.now()}`;
}

/**
 * Create a cache-busted URL
 */
export function getCacheBustedUrl(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${getCacheBuster()}`;
}

/**
 * Expose cache utilities to window for console access
 * Usage: window.cacheUtils.clearAllCaches()
 */
if (typeof window !== 'undefined') {
  window.cacheUtils = {
    clearAllCaches,
    clearPlanCache,
    hardRefresh,
    getNoCacheHeaders,
    getCacheBuster,
    getCacheBustedUrl
  };
  
  console.log('💡 Cache utilities available: window.cacheUtils');
  console.log('   - window.cacheUtils.clearAllCaches()');
  console.log('   - window.cacheUtils.clearPlanCache()');
  console.log('   - window.cacheUtils.hardRefresh()');
}
