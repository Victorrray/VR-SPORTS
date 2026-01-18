/**
 * Prevent forced page refresh when switching tabs
 * This disables any automatic reload detection or service worker update checks
 */

export function preventTabRefresh() {
  // Disable any automatic reload on visibility change
  document.addEventListener('visibilitychange', (e) => {
    e.stopImmediatePropagation();
  }, true);

  // Prevent any beforeunload handlers from triggering reloads
  window.addEventListener('beforeunload', (e) => {
    // Don't prevent the event, just log it
    console.log('beforeunload event detected');
  });

  // Intercept any location.reload calls
  const originalReload = window.location.reload;
  window.location.reload = function(forceReload) {
    console.warn('⚠️ Attempted page reload blocked:', new Error().stack);
    // Don't actually reload
    return;
  };

  // Prevent any service worker update notifications from triggering reloads
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', (e) => {
      console.log('Service Worker controller changed - preventing reload');
      e.stopImmediatePropagation();
    }, true);
  }

  // Disable any meta refresh tags
  const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
  if (metaRefresh) {
    metaRefresh.remove();
  }

  // Monitor for any dynamically added meta refresh tags
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'META' && node.getAttribute('http-equiv') === 'refresh') {
            console.warn('Removing dynamically added meta refresh tag');
            node.remove();
          }
        });
      }
    });
  });

  observer.observe(document.head, { childList: true });

  console.log('✅ Tab refresh prevention enabled');
}
