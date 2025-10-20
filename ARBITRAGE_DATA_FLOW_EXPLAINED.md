# Arbitrage Tool - Data Flow & Caching Explained

## 🎯 Quick Answers to Your Questions

### Q1: Will arbitrage opportunities show up if they exist?
**YES** - After the fix I just made, the tool will now detect arbitrage opportunities in:
- ✅ Upcoming games (not started yet)
- ✅ Live games (in progress) - **NEWLY ENABLED**
- ❌ Completed games (filtered out)

### Q2: Is it checking for games you don't have cached?
**YES** - The arbitrage tool fetches its OWN data independently. Here's how:

### Q3: Will it use caches?
**YES** - Multi-level caching system:
1. **Frontend cache** (5 minutes)
2. **Backend in-memory cache** (5 minutes)
3. **Supabase persistent cache** (longer term)

### Q4: If you haven't loaded NHL, will it still check and cache it?
**YES** - The arbitrage tool is INDEPENDENT from the main sportsbooks page.

---

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   ARBITRAGE DETECTOR COMPONENT                   │
│                  (ArbitrageDetector.js)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              SPORT SELECTION (User Controlled)                   │
│  Default: NFL only                                               │
│  User can select: NFL, NBA, NHL, MLB, NCAAF, NCAAB, EPL, etc.  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   useCachedFetch Hook                            │
│  Endpoint: /api/odds                                             │
│  Params:                                                         │
│    - sports: "americanfootball_nfl,icehockey_nhl,..."          │
│    - markets: "h2h,spreads,totals,player_..."                  │
│    - regions: "us,uk,eu,au"                                     │
│  Polling: Every 2 minutes (when auto-refresh ON)                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND CACHE CHECK                            │
│  Cache Key: Generated from URL + params                         │
│  TTL: 5 minutes (default)                                       │
│  Location: oddsCacheManager (in-memory)                         │
│                                                                  │
│  IF CACHE HIT: Return cached data immediately ✅                 │
│  IF CACHE MISS: Continue to backend API call ⬇️                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND /api/odds ENDPOINT                     │
│                    (server/index.js)                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND IN-MEMORY CACHE CHECK                       │
│  Cache Duration: 5 minutes                                       │
│  Cache Key: Based on sport + markets + bookmakers               │
│                                                                  │
│  IF CACHE HIT: Return cached data ✅                             │
│  IF CACHE MISS: Check Supabase cache ⬇️                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│               SUPABASE PERSISTENT CACHE CHECK                    │
│  Table: odds_cache                                               │
│  Indexed by: sport_key, event_id, bookmaker_key                 │
│                                                                  │
│  IF CACHE HIT: Return cached data ✅                             │
│  IF CACHE MISS: Call The Odds API ⬇️                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    THE ODDS API CALL                             │
│  URL: https://api.the-odds-api.com/v4/sports/{sport}/odds       │
│  Params:                                                         │
│    - regions: us,us_dfs                                          │
│    - markets: h2h,spreads,totals                                │
│    - bookmakers: (filtered by user plan)                        │
│                                                                  │
│  Returns: ALL games (upcoming + live + completed)               │
│  Cost: 💰 API call counted against quota                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CACHE THE RESPONSE                            │
│  1. Save to Supabase (persistent)                               │
│  2. Save to backend in-memory cache (5 min)                     │
│  3. Return to frontend                                           │
│  4. Frontend caches it (5 min)                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              ARBITRAGE CALCULATION (Frontend)                    │
│  1. Filter out completed games                                   │
│  2. Filter out DFS apps                                          │
│  3. Apply bookmaker filter (if any)                             │
│  4. Find best odds for each outcome                             │
│  5. Calculate implied probabilities                             │
│  6. Detect arbitrage (total probability < 1)                    │
│  7. Calculate optimal stakes                                     │
│  8. Display opportunities                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Key Points About Your Specific Questions

### 1. **NHL Example - Will it fetch if not cached?**

**Scenario:** You haven't visited the NHL page, but you select NHL in arbitrage tool.

**What Happens:**
1. ✅ Arbitrage tool makes its OWN request to `/api/odds?sports=icehockey_nhl`
2. ✅ Backend checks its cache (likely MISS since you haven't loaded NHL)
3. ✅ Backend calls The Odds API for NHL games
4. ✅ Backend caches the response (in-memory + Supabase)
5. ✅ Frontend receives NHL data and caches it
6. ✅ Arbitrage calculation runs on NHL games
7. ✅ Any arbitrage opportunities will display

**Result:** YES, it will fetch and cache NHL data even if you've never visited the NHL page.

---

### 2. **Cache Independence**

The arbitrage tool's cache is SEPARATE from the main sportsbooks page:

| Page | Cache Key | Data Source |
|------|-----------|-------------|
| Sportsbooks Page | Based on selected sport + date + filters | `/api/odds` with specific params |
| Arbitrage Tool | Based on selected sports + markets | `/api/odds` with different params |

**They can share backend cache** if the parameters match, but frontend caches are separate.

---

### 3. **Current Sport Selection in Arbitrage Tool**

**Default:** NFL only (`americanfootball_nfl`)

**Available Sports:**
- NFL (americanfootball_nfl)
- NCAAF (americanfootball_ncaaf)
- NBA (basketball_nba)
- NCAAB (basketball_ncaab)
- MLB (baseball_mlb)
- NHL (icehockey_nhl) ← **YES, NHL is available!**
- EPL (soccer_epl)
- Champions League (soccer_uefa_champs_league)

**To check NHL arbitrage:**
1. Open arbitrage tool
2. Click "Apply Filters" or sport selector
3. Select NHL
4. Click "Apply Filters"
5. Tool will fetch NHL data and check for arbitrage

---

## 🚨 Why You Might Not See Arbitrage Opportunities

### 1. **Not Enough Bookmakers**
- Arbitrage requires at least 2 bookmakers with different odds
- DFS apps are excluded (PrizePicks, Underdog, etc.)
- Check if you have multiple traditional sportsbooks selected

### 2. **Markets Don't Match**
- For spreads: Lines must be EXACT opposites (e.g., +3.5 and -3.5)
- For totals: Lines must be EXACT same (e.g., Over 45.5 and Under 45.5)
- Middles (line gaps) are NOT counted as arbitrage

### 3. **Minimum Profit Filter**
- Default: 0.5% minimum profit
- Try setting to 0% to see ALL opportunities
- Real arbitrage is rare (usually 0.5% - 3%)

### 4. **Sport Selection**
- Default is NFL only
- NFL might not have arbitrage right now
- Try NBA or NHL (higher liquidity = more opportunities)

### 5. **No Games Available**
- Check if there are games scheduled for selected sports
- Live games are now included (after my fix)
- Completed games are excluded

### 6. **API Rate Limits**
- Check browser console for errors
- Check if API quota is exceeded
- Free plan has limited bookmakers

### 7. **Bookmaker Filter**
- If you have bookmaker filter applied, it might exclude key books
- Try with no bookmaker filter to see all opportunities

---

## 🔧 Debugging Steps

### Step 1: Check Browser Console
```javascript
// Look for these logs:
"🎯 Found X real arbitrage opportunities"
"Total games received: X"
"Games with bookmakers: X"
```

### Step 2: Check Network Tab
- Look for `/api/odds` request
- Check response - should have games array
- Verify each game has `bookmakers` array with 2+ entries

### Step 3: Verify Sport Selection
- Make sure you've selected sports with active games
- Try multiple sports at once (NFL + NBA + NHL)

### Step 4: Check Filters
- Set min profit to 0%
- Remove bookmaker filters
- Select all markets (h2h, spreads, totals)

### Step 5: Check Data Structure
Add this to browser console while on arbitrage page:
```javascript
// Check what data is being received
console.log('Arbitrage data:', window.__arbitrageDebug);
```

---

## 📈 Expected Behavior After Fix

### Before Fix:
- ❌ Only upcoming games checked
- ❌ Missing live arbitrage opportunities
- ❌ Limited arbitrage detection window

### After Fix:
- ✅ Both upcoming AND live games checked
- ✅ Captures rapid line movements during games
- ✅ Maximum arbitrage opportunity detection
- ✅ Only excludes completed games

---

## 💡 Pro Tips

### 1. **Multi-Sport Selection**
Select multiple sports to increase chances:
```
NFL + NBA + NHL + MLB = More games = More opportunities
```

### 2. **Auto-Refresh**
Keep auto-refresh ON (2-minute polling) to catch new opportunities

### 3. **Lower Minimum Profit**
Start with 0% to see if ANY arbitrage exists, then increase

### 4. **Check During Live Games**
Live games have the MOST arbitrage due to rapid odds changes

### 5. **Multiple Bookmakers**
More bookmakers = more arbitrage opportunities
- Free plan: 4 bookmakers
- Trial plan: 10 bookmakers  
- Platinum plan: All bookmakers

---

## 🎯 Summary

**YES to all your questions:**
1. ✅ Arbitrage opportunities WILL show up if they exist
2. ✅ Tool checks for games you don't have cached
3. ✅ Tool WILL use caches (3-level caching system)
4. ✅ If you haven't loaded NHL, tool will fetch and cache it

**The tool is INDEPENDENT and will fetch whatever sports you select, regardless of what you've viewed on other pages.**
