/**
 * Diagnostic utility to detect what's causing page reloads
 * Logs all potential reload triggers
 */

export function initReloadDiagnostics() {
  console.log('🔍 Initializing reload diagnostics...');

  // Track all navigation events
  window.addEventListener('beforeunload', (e) => {
    console.warn('⚠️ BEFOREUNLOAD event fired', {
      timestamp: new Date().toISOString(),
      returnValue: e.returnValue,
      stack: new Error().stack
    });
  });

  window.addEventListener('unload', (e) => {
    console.warn('⚠️ UNLOAD event fired', {
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    });
  });

  window.addEventListener('pagehide', (e) => {
    console.warn('⚠️ PAGEHIDE event fired', {
      timestamp: new Date().toISOString(),
      persisted: e.persisted,
      stack: new Error().stack
    });
  });

  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    console.log('📱 VISIBILITYCHANGE event', {
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      timestamp: new Date().toISOString()
    });
  });

  // Track all location changes
  const originalReplace = window.location.replace;
  const originalAssign = window.location.assign;
  const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');

  window.location.replace = function(url) {
    console.warn('⚠️ location.replace() called', {
      url,
      stack: new Error().stack
    });
  };

  window.location.assign = function(url) {
    console.warn('⚠️ location.assign() called', {
      url,
      stack: new Error().stack
    });
  };

  Object.defineProperty(window.location, 'href', {
    get: originalHref.get,
    set: function(url) {
      console.warn('⚠️ location.href assignment attempted', {
        url,
        stack: new Error().stack
      });
    },
    configurable: true
  });

  // Track hash changes
  window.addEventListener('hashchange', (e) => {
    console.log('📍 HASHCHANGE event', {
      oldURL: e.oldURL,
      newURL: e.newURL,
      timestamp: new Date().toISOString()
    });
  });

  // Track popstate (back/forward button)
  window.addEventListener('popstate', (e) => {
    console.log('🔙 POPSTATE event (back/forward button)', {
      state: e.state,
      timestamp: new Date().toISOString()
    });
  });

  // Track service worker events
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.warn('⚠️ Service Worker controller changed', {
        timestamp: new Date().toISOString()
      });
    });

    navigator.serviceWorker.addEventListener('message', (e) => {
      console.log('📨 Service Worker message', {
        data: e.data,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Track online/offline events
  window.addEventListener('online', () => {
    console.log('🌐 ONLINE event', {
      timestamp: new Date().toISOString()
    });
  });

  window.addEventListener('offline', () => {
    console.warn('⚠️ OFFLINE event', {
      timestamp: new Date().toISOString()
    });
  });

  // Track storage events (from other tabs)
  window.addEventListener('storage', (e) => {
    console.log('💾 STORAGE event (from other tab)', {
      key: e.key,
      oldValue: e.oldValue ? e.oldValue.substring(0, 50) : null,
      newValue: e.newValue ? e.newValue.substring(0, 50) : null,
      timestamp: new Date().toISOString()
    });
  });

  // Track focus/blur
  window.addEventListener('focus', () => {
    console.log('👁️ FOCUS event - page became visible', {
      timestamp: new Date().toISOString()
    });
  });

  window.addEventListener('blur', () => {
    console.log('👁️ BLUR event - page lost focus', {
      timestamp: new Date().toISOString()
    });
  });

  // Track all fetch requests that might be triggering reloads
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    // Log suspicious fetch patterns
    if (url.includes('manifest') || url.includes('version') || url.includes('build')) {
      console.log('🔄 Fetch request (potential reload trigger)', {
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString()
      });
    }

    return originalFetch.apply(this, args);
  };

  console.log('✅ Reload diagnostics initialized - check console for reload triggers');
}
