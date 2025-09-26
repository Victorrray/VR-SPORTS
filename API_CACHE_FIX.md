# API Cache Fix

## Issue Fixed

Fixed a JavaScript error that was occurring in the player props mode:

```
Uncaught (in promise) TypeError: xr.delete is not a function
    at useMarkets.js:194:16
```

This error was occurring because the `APICache` class in `performance.js` was missing a `delete` method, but the `useMarkets.js` hook was trying to call `APICache.delete(cacheKey)`.

## Changes Made

Added a `delete` method to the `APICache` class in `utils/performance.js`:

```javascript
// Before: Missing delete method
static clear() {
  this.cache.clear();
}

static size() {
  return this.cache.size;
}

// After: Added delete method
static clear() {
  this.cache.clear();
}

static delete(key) {
  return this.cache.delete(key);
}

static size() {
  return this.cache.size;
}
```

## Why This Fix Works

The `useMarkets.js` hook was trying to clear empty cache entries by calling `APICache.delete(cacheKey)`, but the `APICache` class didn't have a `delete` method implemented. This caused a JavaScript error when the code tried to call a non-existent method.

By adding the `delete` method to the `APICache` class, we've fixed this error and enabled proper cache management in the `useMarkets.js` hook.

## Impact

This fix resolves the JavaScript error that was occurring in the player props mode. The error was preventing the proper fetching and display of player props data, as the cache management was failing.

With this fix, the cache management in `useMarkets.js` will work correctly, allowing the hook to clear empty cache entries and fetch fresh data when needed.
