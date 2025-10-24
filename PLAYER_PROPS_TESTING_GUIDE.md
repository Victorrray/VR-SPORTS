# Player Props Testing Guide

## Quick Reference: Sportsbook Coverage & Alternate Markets

### What Was Added

#### 1. Comprehensive Sportsbook Logging
- Server now logs all sportsbooks being pulled for player props
- Distinguishes between US sportsbooks and DFS apps
- Shows market counts per bookmaker
- Tracks which books are filtered/skipped

#### 2. New Basketball Alternate Markets (15 total)
**Individual Alternates:**
- player_points_alternate
- player_rebounds_alternate
- player_assists_alternate
- player_blocks_alternate
- player_steals_alternate
- player_turnovers_alternate
- player_threes_alternate

**Combination Alternates:**
- player_points_assists_alternate
- player_points_rebounds_alternate
- player_rebounds_assists_alternate
- player_points_rebounds_assists_alternate

---

## Testing Steps

### 1. Verify Sportsbook Coverage

**In Browser:**
```
1. Go to Sportsbooks page
2. Click "Player Props" tab
3. Select "NBA" sport
4. Select "Today" or specific date
5. Open browser DevTools (F12)
6. Go to Console tab
```

**In Server Logs:**
```
Look for messages like:
📊 SPORTSBOOK COVERAGE FOR PLAYER PROPS (Game: abc123)
📊 Total bookmakers in response: 12
📊 US Sportsbooks: 10 - draftkings, fanduel, betmgm, caesars, pointsbet, betrivers...
📊 DFS Apps: 2 - prizepicks, underdog
```

### 2. Verify Alternate Markets Load

**In Browser:**
```
1. Select NBA player props
2. Click on Player Prop Markets filter
3. Scroll down to see all available markets
4. Look for "Alternate" markets:
   - Alternate Points (Over/Under)
   - Alternate Rebounds (Over/Under)
   - Alternate Assists (Over/Under)
   - etc.
5. Select one and apply filter
6. Verify data loads
```

### 3. Check Sportsbook Filtering

**Expected Behavior:**
- All US sportsbooks should appear in the sportsbook filter
- All DFS apps should appear in the sportsbook filter
- When you select a sportsbook, only that book's lines appear
- When you select multiple books, all their lines appear

**If Books Are Missing:**
1. Check server logs for "Skipping {bookmaker}" messages
2. Verify user plan allows access to that book
3. Check if book is in `allowedBookmakers` list
4. Verify TheOddsAPI account has access

---

## Expected Sportsbooks by Plan

### Free Plan
- DraftKings
- FanDuel
- Caesars

### Gold Plan ($10/mo)
- All free plan books
- Plus: BetMGM, PointsBet, BetRivers, Unibet, WynnBet
- DFS: PrizePicks, Underdog, Pick6

### Platinum Plan ($25/mo)
- All Gold plan books
- Plus: Superbook, TwinSpires, BetFred US, ESPN Bet, Fanatics, Hard Rock, Fliff, NoVig, Circa Sports, LowVig
- DFS: All DFS apps (ProphetX, Dabble AU, etc.)

---

## Debugging Commands

### Check if Alternate Markets Are in Response
```javascript
// In browser console
// After loading player props, check the games data
console.log(window.__gamesData?.bookmakers?.map(b => b.markets?.map(m => m.key)));
```

### Monitor Sportsbook Filtering
```javascript
// Check which books are being filtered
console.log('Effective selected books:', window.__effectiveSelectedBooks);
console.log('Book filter:', window.__bookFilter);
```

### Check Market Selection
```javascript
// Verify selected markets
console.log('Selected markets:', window.__selectedPlayerPropMarkets);
```

---

## Common Issues & Solutions

### Issue: Only 2-3 Sportsbooks Appearing
**Possible Causes:**
1. Date filter showing only games with limited coverage
2. User plan doesn't include all books
3. TheOddsAPI not returning all bookmakers

**Solution:**
- Check server logs for sportsbook coverage
- Verify user plan in database
- Try different date or "All Dates" filter

### Issue: Alternate Markets Not Showing
**Possible Causes:**
1. Markets not in PLAYER_PROP_MARKETS array
2. Sport not set to basketball
3. Markets not requested from API

**Solution:**
- Verify markets are in SportsbookMarkets.js lines 105-126
- Ensure basketball is selected
- Check server logs for market requests

### Issue: DFS Apps Not Appearing
**Possible Causes:**
1. `regions=us_dfs` not in API call
2. DFS apps filtered out by plan restrictions
3. No DFS app data available for that date

**Solution:**
- Verify server uses `regions=us,us_dfs`
- Check user plan includes DFS apps
- Try different date with more games

---

## Performance Notes

- Player props requests include up to 15 markets per request
- Server processes up to 10 games per request
- Timeout: 12 seconds for full response
- Early response: 2 seconds (partial data)
- Supabase caching: 5 minutes per game/market combination

---

## Files Modified

1. `/client/src/pages/SportsbookMarkets.js` (lines 105-126)
   - Added 15 new basketball alternate markets

2. `/server/index.js` (lines 2844-2872)
   - Added comprehensive sportsbook logging
   - Enhanced bookmaker tracking

---

## Next Steps

1. ✅ Test sportsbook coverage in development
2. ✅ Verify alternate markets appear in filter
3. ✅ Monitor server logs for any issues
4. ✅ Deploy to production
5. ✅ Monitor production logs for coverage
