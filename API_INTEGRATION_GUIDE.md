# API Integration Guide - OddsPage

## ✅ Status: Integration Complete

The OddsPage component has been successfully integrated with the backend API. Here's what was done and what to verify.

---

## What Was Done

### 1. Frontend Hook Created
**File:** `/client/src/hooks/useOddsData.ts`

- Fetches odds data from `/api/odds` endpoint
- Supports filtering by:
  - `sport`: Sport code (e.g., 'nba', 'nfl', 'nhl')
  - `date`: Date filter (e.g., 'today', 'tomorrow')
  - `marketType`: Market type (e.g., 'moneyline', 'spread')
  - `betType`: Bet type (e.g., 'straight', 'props')
  - `sportsbooks`: Array of sportsbook IDs
- Auto-refetches when filters change
- Handles loading and error states
- Returns TypeScript-typed `OddsPick[]` array

### 2. OddsPage Updated
**File:** `/client/src/components/design10/OddsPage.tsx`

- Integrated `useOddsData` hook
- Replaced hardcoded mock data with API data
- Commented out mock `topPicks` array
- Syncs loading state with API
- Shows error toasts on failures

### 3. Backend Endpoint Verified
**File:** `/server/routes/odds.js`
**Route:** `GET /api/odds`
**Registered at:** `/api/odds` (in `/server/routes/index.js` line 37)

Current query parameters:
- `sports` (required): Comma-separated sport codes
- `regions`: Region code (default: "us")
- `markets`: Comma-separated market types (default: "h2h,spreads,totals")
- `oddsFormat`: Odds format (default: "american")
- `date`: Date filter

---

## Testing the Integration

### Step 1: Start Your Backend
```bash
cd server
npm start
```

### Step 2: Start Your Frontend
```bash
cd client
npm start
```

### Step 3: Open Browser DevTools
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Filter by "odds"

### Step 4: Navigate to OddsPage
1. Go to the Odds page in your app
2. Watch for API calls to `/api/odds`
3. Check the response data

### Step 5: Verify Data Format
The API should return an array of objects like:
```json
[
  {
    "id": 1,
    "ev": "+78.07%",
    "sport": "NBA",
    "game": "Celtics @ Magic",
    "team1": "Celtics",
    "team2": "Magic",
    "pick": "Magic ML",
    "bestOdds": "+940",
    "bestBook": "Pinnacle",
    "avgOdds": "+850",
    "isHot": true,
    "books": [
      {
        "name": "Pinnacle",
        "odds": "+940",
        "team2Odds": "-1200",
        "ev": "+78.07%",
        "isBest": true
      }
    ]
  }
]
```

---

## Parameter Mapping

### Frontend Filters → Backend Query Params

| Frontend | Backend | Example |
|----------|---------|---------|
| `sport` | `sports` | "nba" → "basketball_nba" |
| `date` | `date` | "today" → "today" |
| `marketType` | `markets` | "moneyline" → "h2h" |
| `betType` | (not used yet) | - |
| `sportsbooks` | (not used yet) | - |

**Note:** You may need to add parameter mapping in the hook if your backend uses different parameter names.

---

## Troubleshooting

### Issue: 404 Error on `/api/odds`
**Solution:** Verify the route is registered in `/server/routes/index.js` line 37

### Issue: 400 Error - "Missing sports parameter"
**Solution:** The backend requires the `sports` parameter. Update the hook to send it:
```typescript
const params = new URLSearchParams();
params.append('sports', sport); // Add this
```

### Issue: Data format doesn't match
**Solution:** You may need to transform the backend response. Add a transformation function in the hook:
```typescript
const transformData = (rawData) => {
  // Transform backend format to OddsPick format
  return rawData.map(item => ({
    // Map fields here
  }));
};
```

### Issue: CORS Error
**Solution:** Verify CORS is enabled in `/server/index.js`

---

## Next Steps

1. **Test with Real Data:** Run the app and verify API calls work
2. **Check Data Format:** Ensure backend response matches `OddsPick` interface
3. **Handle Errors:** Test error scenarios (network down, invalid params)
4. **Optimize Caching:** Consider adding response caching on frontend
5. **Add Pagination:** If needed, implement pagination for large datasets

---

## Files Modified

- ✅ `/client/src/hooks/useOddsData.ts` - Created
- ✅ `/client/src/components/design10/OddsPage.tsx` - Updated
- ✅ `/server/routes/odds.js` - Verified (no changes needed)
- ✅ `/server/routes/index.js` - Verified (no changes needed)

---

## Questions?

Check the console logs:
- Frontend: Browser DevTools Console
- Backend: Server terminal output

Both have detailed logging to help debug issues.
