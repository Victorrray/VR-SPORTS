// Service Worker for OddSightSeer Platform

// Disable service worker on localhost for development (prevents CSP conflicts)
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  console.log('SW: Localhost detected - disabling service worker');
  
  self.addEventListener('install', (event) => {
    console.log('SW: Localhost - skipping install');
    event.waitUntil(self.skipWaiting());
  });
  
  self.addEventListener('activate', (event) => {
    console.log('SW: Localhost - unregistering');
    event.waitUntil(
      self.registration.unregister().then(() => self.clients.claim())
    );
  });
  
  self.addEventListener('fetch', (event) => {
    // On localhost, don't intercept - let browser handle everything
    // This prevents CSP conflicts with external resources
  });
  
  // Stop processing - don't load production SW code
  self.skipWaiting();
} else {
  // Production code - only runs on non-localhost
  
const CACHE_NAME = 'oddssightseer-v1.0.0';
const STATIC_CACHE = 'oddssightseer-static-v1';
const API_CACHE = 'oddssightseer-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/apple-touch-icon.png'
];

// API endpoints to cache (exclude auth-related endpoints)
const API_ENDPOINTS = [
  '/api/odds',
  '/api/sports',
  '/api/bookmakers'
];

// Auth-related endpoints that should NOT be cached
const AUTH_ENDPOINTS = [
  '/api/auth',
  '/api/user',
  '/api/profile',
  '/api/billing'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(async (cache) => {
        try {
          await cache.addAll(STATIC_ASSETS);
        } catch (err) {
          console.warn('Service Worker: bulk cache failed, retrying individually', err);
          for (const asset of STATIC_ASSETS) {
            try {
              await cache.add(asset);
            } catch (assetErr) {
              console.warn('Service Worker: skipping asset', asset, assetErr?.message || assetErr);
            }
          }
        }
      }),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore unsupported schemes (e.g., extensions)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return; // let the browser handle it
  }

  // Always handle navigations with a network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Check if this is an auth-related endpoint that should NOT be cached
  const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
  if (isAuthEndpoint) {
    // Always fetch auth endpoints from network
    event.respondWith(fetch(request));
    return;
  }

  // Handle same-origin API requests only
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// API request handler - stale-while-revalidate strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Network error, keep using cached version
    });
    
    return cachedResponse;
  }

  // No cache, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No internet connection available',
        cached: false 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Static asset handler - cache first strategy
async function handleStaticRequest(request) {
  // Guard against unsupported schemes
  try {
    const u = new URL(request.url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return fetch(request).catch(() => new Response('Not Found', { status: 404 }));
    }
  } catch (_) {}

  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('Service Worker: fetch failed for', request.url, error);
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/') || new Response('Offline');
    }
    // For non-navigation requests, return a 503 Service Unavailable response
    return new Response('Service Unavailable', { status: 503 });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Retry failed API requests when back online
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
    } catch (error) {
      console.log('Background sync failed for:', request.url);
    }
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'oddssightseer-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Odds'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'OddSightSeer Update', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/sportsbooks')
    );
  }
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

} // End of production-only code block
