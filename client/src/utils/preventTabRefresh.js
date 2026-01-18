/**
 * Prevent forced page refresh when switching tabs
 * This disables any automatic reload detection or service worker update checks
 */

// Store original reload function before anything else can modify it
const originalReload = window.location.reload.bind(window.location);

export function preventTabRefresh() {
  console.log('🛡️ Starting tab refresh prevention...');

  // Override location.reload IMMEDIATELY to prevent any reloads
  window.location.reload = function(forceReload) {
    console.warn('⚠️ BLOCKED: window.location.reload() called', {
      forceReload,
      stack: new Error().stack
    });
    // Silently ignore reload attempts
    return undefined;
  };

  // Also override the descriptor to prevent reassignment
  Object.defineProperty(window.location, 'reload', {
    value: function(forceReload) {
      console.warn('⚠️ BLOCKED: window.location.reload() called via descriptor', {
        forceReload,
        stack: new Error().stack
      });
      return undefined;
    },
    writable: false,
    configurable: false
  });

  // Disable any automatic reload on visibility change
  const handleVisibilityChange = (e) => {
    if (document.hidden) {
      console.log('📱 Tab hidden');
    } else {
      console.log('📱 Tab visible - preventing any reload');
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange, true);
  document.addEventListener('visibilitychange', handleVisibilityChange, false);

  // Prevent any beforeunload handlers from triggering reloads
  window.addEventListener('beforeunload', (e) => {
    console.log('⚠️ beforeunload event detected - preventing reload');
    e.preventDefault();
    e.returnValue = '';
  });

  // Prevent any service worker update notifications from triggering reloads
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', (e) => {
      console.log('🔄 Service Worker controller changed - preventing reload');
      e.stopImmediatePropagation();
      e.preventDefault();
    }, true);
  }

  // Disable any meta refresh tags
  const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
  if (metaRefresh) {
    console.warn('🗑️ Removing meta refresh tag');
    metaRefresh.remove();
  }

  // Monitor for any dynamically added meta refresh tags
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'META' && node.getAttribute('http-equiv') === 'refresh') {
            console.warn('🗑️ Removing dynamically added meta refresh tag');
            node.remove();
          }
        });
      }
    });
  });

  observer.observe(document.head, { childList: true });

  // Prevent page unload
  window.addEventListener('unload', (e) => {
    console.log('⚠️ Unload event detected - preventing');
    e.preventDefault();
    e.returnValue = '';
    return false;
  });

  // Prevent pagehide
  window.addEventListener('pagehide', (e) => {
    console.log('⚠️ Pagehide event detected');
    e.preventDefault();
  });

  console.log('✅ Tab refresh prevention fully enabled');
}
