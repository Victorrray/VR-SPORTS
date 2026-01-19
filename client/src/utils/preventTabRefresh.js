/**
 * Prevent forced page refresh when switching tabs
 * This disables any automatic reload detection or service worker update checks
 */

let isTabHidden = false;
let tabHiddenTime = null;

export function preventTabRefresh() {
  console.log('🛡️ Starting tab refresh prevention...');

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

  // Track tab visibility to prevent auto-refresh on tab switch
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isTabHidden = true;
      tabHiddenTime = Date.now();
      console.log('📱 Tab hidden');
    } else {
      const hiddenDuration = tabHiddenTime ? Date.now() - tabHiddenTime : 0;
      console.log(`📱 Tab visible again after ${hiddenDuration}ms`);
      isTabHidden = false;
      
      // Don't trigger any refreshes when tab becomes visible
      // Let the normal polling/data fetching handle updates
    }
  }, true);

  // Prevent any service worker update notifications from triggering reloads
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', (e) => {
      console.log('🔄 Service Worker controller changed - preventing reload');
      e.stopImmediatePropagation();
      e.preventDefault();
    }, true);
    
    // Ignore service worker update messages
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data && (e.data.type === 'SKIP_WAITING' || e.data.type === 'UPDATE_AVAILABLE')) {
        console.log('⚠️ Service Worker update message ignored:', e.data.type);
        e.stopImmediatePropagation();
      }
    }, true);
  }

  console.log('✅ Tab refresh prevention fully enabled');
}

// Export helper to check if tab is hidden
export function isTabCurrentlyHidden() {
  return isTabHidden;
}
