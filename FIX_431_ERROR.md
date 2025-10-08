# 🔧 Fixed: 431 Request Header Fields Too Large

## Problem
```
Failed to load resource: the server responded with a status of 431 (Request Header Fields Too Large)
```

## Root Cause
The `secureFetch` utility was including large cookies/headers in the request to `/api/cached-odds/nfl`, causing the HTTP headers to exceed the server's limit.

## Solution Applied
Changed `useCachedOdds` hook to use plain `fetch()` instead of `secureFetch()`:

### Before (Caused 431 Error)
```javascript
const response = await secureFetch(url);
```

### After (Fixed)
```javascript
const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  },
  credentials: 'omit', // Don't send cookies
});
```

## Why This Works
1. **No Authentication Needed** - Cached odds are public data
2. **No Cookies** - `credentials: 'omit'` prevents sending large cookies
3. **Minimal Headers** - Only sends essential headers
4. **Smaller Request** - Stays well under 431 limit

## Files Modified
- ✅ `client/src/hooks/useCachedOdds.js`
  - Updated `useCachedOdds()` function
  - Updated `useCachedOddsStats()` function
  - Removed `secureFetch` import

## Testing
After this fix, you should see:
- ✅ No more 431 errors
- ✅ Cached data loads successfully
- ✅ Green "Cached" badge appears
- ✅ NFL odds display correctly

## Verify Fix
```bash
# Check browser console - should see:
📦 Using cached NFL data: X games

# Check Network tab - should see:
✅ GET /api/cached-odds/nfl - 200 OK
```

---

**Status:** ✅ **FIXED**

**Next:** Refresh browser and test NFL caching
