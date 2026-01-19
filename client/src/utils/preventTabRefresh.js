/**
 * Prevent forced page refresh when switching tabs
 * This disables any automatic reload detection or service worker update checks
 */

let isTabHidden = false;
let tabHiddenTime = null;
let blockRefreshUntil = 0;

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
      console.log(`📱 Tab visible again after ${hiddenDuration}ms - blocking refreshes for 3 seconds`);
      isTabHidden = false;
      
      // Block any refreshes for 3 seconds after tab becomes visible
      blockRefreshUntil = Date.now() + 3000;
    }
  }, true);

  // Intercept navigation attempts that would cause a refresh
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;
  
  // Create wrapper functions that check if we should block
  const checkAndNavigate = (method, url) => {
    const now = Date.now();
    if (now < blockRefreshUntil) {
      console.warn(`⚠️ BLOCKED: Navigation to ${url} blocked after tab became visible`);
      return;
    }
    // Allow the navigation
    method.call(window.location, url);
  };

  // Override assign and replace without using Object.defineProperty
  window.location.assign = function(url) {
    checkAndNavigate(originalAssign, url);
  };
  
  window.location.replace = function(url) {
    checkAndNavigate(originalReplace, url);
  };

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
