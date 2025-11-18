# TheOddsAPI Key Configuration Guide

## Problem Identified
The backend is receiving an **INVALID_KEY** error from TheOddsAPI. This means:
- The `ODDS_API_KEY` environment variable on Render is either missing, invalid, or expired
- Without a valid key, the API cannot fetch bookmaker odds data

## Current Status
✅ **Frontend is now working with mock data** - The odds table will display with sample bookmaker data while you fix the API key
⚠️ **Backend needs API key configuration** - Real odds data won't display until this is fixed

## How to Fix

### Step 1: Get a Valid TheOddsAPI Key
1. Go to https://the-odds-api.com
2. Sign up or log in to your account
3. Navigate to your API keys section
4. Copy your API key (note: free tier may have limitations)

### Step 2: Update Render Environment Variables
1. Go to https://dashboard.render.com
2. Find your backend service: `odds-backend-4e9q`
3. Go to **Settings** → **Environment**
4. Find or create the `ODDS_API_KEY` variable
5. Paste your API key
6. Click **Save**
7. The service will automatically redeploy

### Step 3: Verify the Fix
1. Refresh the application
2. Check browser console for logs
3. Look for: `🎮 First game from API:` with bookmakers count > 0
4. If successful, odds will display real data instead of mock data

## API Key Tier Considerations

### Free Tier
- ✅ Basic game odds (h2h, spreads, totals)
- ❌ Limited bookmakers
- ❌ May not include all sportsbooks

### Paid Tier
- ✅ Full bookmaker access
- ✅ All sportsbooks included
- ✅ Better rate limits

## Testing the API Key Directly

To test if your API key works:

```bash
curl "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?apiKey=YOUR_KEY_HERE&regions=us&markets=h2h&bookmakers=draftkings,fanduel&oddsFormat=american" | head -c 500
```

Expected response should include `bookmakers` array with odds data.

## Files Involved
- Backend: `/server/routes/odds.js` - Makes API calls to TheOddsAPI
- Frontend: `/client/src/hooks/useOddsData.ts` - Transforms and displays odds
- Config: `/server/config/constants.js` - Bookmaker lists

## Fallback Behavior
Until the API key is fixed, the frontend will:
- ✅ Display 40 games with real team names
- ✅ Show mock bookmaker data (DraftKings, FanDuel, BetMGM, Caesars, Pinnacle)
- ✅ Allow testing of UI/UX functionality
- ⚠️ Not show real odds data

Once the API key is configured, real bookmaker odds will automatically replace the mock data.
