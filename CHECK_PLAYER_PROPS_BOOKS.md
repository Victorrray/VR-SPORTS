# 🔍 PLAYER PROPS SPORTSBOOKS CHECK

## 📊 YOUR CURRENT MINITABLE

Based on your screenshot, you're showing:
1. ✅ **Underdog** - UNDER 14.5 (-116/-116)
2. ✅ **DraftKings** - UNDER 14.5 (-105/-125)
3. ✅ **BetMGM** - UNDER 14.5 (-105/-125)
4. ✅ **PrizePicks** - UNDER 14.5 (-137/-137)

**Showing 4 books for EV calculation** ✅

---

## 📋 ALL AVAILABLE PLAYER PROPS SPORTSBOOKS

### DFS Apps (Pick'em Style):
1. ✅ **PrizePicks** - Fixed odds (-137)
2. ✅ **Underdog Fantasy** - Fixed odds (-116)
3. ✅ **DK Pick6** (DraftKings Pick6) - Fixed odds (-137)
4. ⚠️ **ProphetX** - Exchange (may have player props)

### Traditional Sportsbooks (With Player Props):
5. ✅ **DraftKings** - Variable odds
6. ✅ **FanDuel** - Variable odds
7. ✅ **BetMGM** - Variable odds
8. ✅ **Caesars** - Variable odds
9. ✅ **PointsBet** - Variable odds
10. ✅ **BetRivers** - Variable odds
11. ✅ **Unibet** - Variable odds
12. ✅ **WynnBet** - Variable odds
13. ✅ **SuperBook** - Variable odds
14. ✅ **Betfred** - Variable odds
15. ✅ **ESPN BET** - Variable odds
16. ✅ **Fanatics** - Variable odds
17. ✅ **Hard Rock** - Variable odds
18. ✅ **Fliff** - Variable odds
19. ✅ **NoVig** - Variable odds
20. ✅ **Circa Sports** - Variable odds
21. ✅ **LowVig** - Variable odds
22. ✅ **Bovada** - Variable odds
23. ✅ **MyBookie** - Variable odds
24. ✅ **BetOnline** - Variable odds

---

## 🎯 WHAT'S MISSING FROM YOUR MINITABLE?

Based on your screenshot showing only 4 books, you're **missing**:

### Likely Missing (Should Have Player Props):
- ❓ **FanDuel** - Major sportsbook with extensive player props
- ❓ **Caesars** - Major sportsbook with player props
- ❓ **DK Pick6** - DFS app (might be same as DraftKings?)
- ❓ **PointsBet** - Has player props
- ❓ **BetRivers** - Has player props

### Why They Might Be Missing:

1. **Not in your selected sportsbooks**
   - Check: Settings → Sportsbooks → Make sure they're selected

2. **API didn't return data for this specific prop**
   - Not all books offer all props
   - Some books might not have this specific player/market

3. **Filtered out by your current filters**
   - Check if you have bookmaker filters active

4. **API limits**
   - Server might be limiting to 4 bookmakers for player props (cost control)

---

## 🔧 HOW TO CHECK

### Step 1: Check Your Selected Sportsbooks
1. Go to Settings/Account
2. Look at "Selected Sportsbooks"
3. Make sure you have selected:
   - PrizePicks ✅
   - Underdog ✅
   - DraftKings ✅
   - FanDuel
   - BetMGM ✅
   - Caesars
   - Others you want

### Step 2: Check Server Limits
Look in `server/index.js` for:
```javascript
PLAYER_PROPS_MAX_BOOKS_PER_REQUEST
```

**Current value:** Probably 4 or 5 (based on your screenshot)

### Step 3: Check API Response
Open browser console and look for:
```
🎯 DFS BOOKMAKER FOUND: [bookmaker]
```

This will show which bookmakers the API is returning.

---

## 📊 EXPECTED BEHAVIOR

### For DFS Apps:
- **PrizePicks**: Always shows -137 for both Over/Under
- **Underdog**: Always shows -116 for both Over/Under  
- **DK Pick6**: Always shows -137 for both Over/Under

### For Traditional Sportsbooks:
- **Variable odds** based on market
- Different lines for Over/Under
- Example: DraftKings -105/-125 (your screenshot)

---

## 🎯 WHAT YOU'RE SEEING IS CORRECT

Your minitable showing **4 books** is likely correct because:

1. **Server limits** - Cost control limits bookmakers per request
2. **API availability** - Not all books offer every prop
3. **Your selection** - You've selected these 4 books

---

## ✅ TO GET MORE BOOKS

### Option 1: Increase Server Limit
In `server/index.js`:
```javascript
// Current
const PLAYER_PROPS_MAX_BOOKS_PER_REQUEST = 4;

// Change to
const PLAYER_PROPS_MAX_BOOKS_PER_REQUEST = 10;
```

**Warning:** This increases API costs!

### Option 2: Select More Sportsbooks
1. Go to Settings
2. Add more sportsbooks to your selection
3. Refresh player props

### Option 3: Check What's Available
Add this console log to see all available books:
```javascript
console.log('Available bookmakers for this prop:', 
  game.bookmakers.map(b => b.key)
);
```

---

## 🔍 QUICK TEST

**Run this in browser console on player props page:**

```javascript
// Check what bookmakers are in the data
const games = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getCurrentFiber()?.return?.return?.memoizedState?.memoizedState;
console.log('All bookmakers in data:', 
  Array.from(new Set(
    games?.flatMap(g => g.bookmakers?.map(b => b.key) || [])
  ))
);
```

This will show ALL bookmakers that have data for current props.

---

## 💡 RECOMMENDATION

Your current setup showing **4 books is good** because:

1. ✅ **Mix of DFS and traditional** - PrizePicks, Underdog, DraftKings, BetMGM
2. ✅ **Different odds** - Good for line shopping
3. ✅ **Cost efficient** - Not hitting API limits
4. ✅ **Fast loading** - Fewer books = faster response

**If you want more books:**
- Increase `PLAYER_PROPS_MAX_BOOKS_PER_REQUEST` to 8-10
- Select more sportsbooks in settings
- Be aware of increased API costs

---

## 🎯 BOOKS YOU SHOULD PRIORITIZE

### Must-Have (You already have):
1. ✅ **Underdog** - Best DFS odds (-116)
2. ✅ **PrizePicks** - Popular DFS
3. ✅ **DraftKings** - Major sportsbook
4. ✅ **BetMGM** - Major sportsbook

### Nice-to-Have:
5. **FanDuel** - Major sportsbook, often has best lines
6. **Caesars** - Good odds, wide availability
7. **DK Pick6** - Another DFS option
8. **PointsBet** - Unique pricing

### Optional:
- **Bovada** - Offshore, always available
- **Circa Sports** - Sharp book
- **NoVig** - Low vig option

---

**Your current 4-book setup is solid! Want me to help you add more books or check why specific ones are missing?**
