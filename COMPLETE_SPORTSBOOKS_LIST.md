# 📋 COMPLETE SPORTSBOOKS LIST

## 🎯 ALL SPORTSBOOKS IN YOUR SYSTEM

### 🔥 POPULAR US SPORTSBOOKS (8)
1. ✅ **DraftKings** (`draftkings`)
2. ✅ **FanDuel** (`fanduel`)
3. ✅ **BetMGM** (`betmgm`)
4. ✅ **Caesars Sportsbook** (`caesars`)
5. ✅ **PointsBet US** (`pointsbetus`)
6. ✅ **WynnBET** (`wynnbet`)
7. ✅ **BetRivers** (`betrivers`)
8. ✅ **Unibet US** (`unibet_us`)

### 🎮 DFS APPS (3)
9. ✅ **PrizePicks** (`prizepicks`) - Fixed odds -137
10. ✅ **Underdog Fantasy** (`underdog`) - Fixed odds -116
11. ✅ **DK Pick6** (`pick6`) - Fixed odds -137

### 🔄 EXCHANGE BOOKS (1)
12. ✅ **ProphetX** (`prophetx`)

### 🌟 OTHER POPULAR BOOKS (10)
13. ✅ **ESPN BET** (`espnbet`)
14. ✅ **Fanatics Sportsbook** (`fanatics`)
15. ✅ **NoVig** (`novig`)
16. ✅ **Fliff** (`fliff`)
17. ✅ **BetOnline** (`betonline`)
18. ✅ **Hard Rock Bet** (`hardrock`)
19. ✅ **Pinnacle** (`pinnacle`)
20. ✅ **SuperBook** (`superbook`)
21. ✅ **TwinSpires** (`twinspires`)
22. ✅ **Betfred US** (`betfred_us`)

### 📊 ADDITIONAL BOOKS (11)
23. ⚠️ **Caesars (William Hill)** (`williamhill_us`) - Duplicate of Caesars
24. ⚠️ **ESPN BET (Barstool)** (`barstool`) - Duplicate of ESPN BET
25. ⚠️ **FOX Bet** (`foxbet`) - May be defunct
26. ⚠️ **Circa Sports** (`circasports`)
27. ⚠️ **LowVig** (`lowvig`)
28. ⚠️ **Bovada** (`bovada`) - Offshore
29. ⚠️ **BetOnline** (`betonlineag`) - Duplicate key
30. ⚠️ **MyBookie** (`mybookieag`) - Offshore
31. ⚠️ **Rebet** (`rebet`)

---

## 🗑️ RECOMMENDED TO REMOVE

### Duplicates:
- ❌ **`williamhill_us`** - Same as Caesars
- ❌ **`barstool`** - Same as ESPN BET
- ❌ **`betonlineag`** - Duplicate of `betonline`

### Defunct/Inactive:
- ❌ **`foxbet`** - FOX Bet shut down
- ❌ **`twinspires`** - Rebranded to FanDuel

### Offshore (If you don't want them):
- ❓ **`bovada`** - Offshore
- ❓ **`mybookieag`** - Offshore
- ❓ **`betonline`** - Offshore (but popular)

### Low Volume:
- ❓ **`rebet`** - Small exchange
- ❓ **`lowvig`** - Small book
- ❓ **`circasports`** - Nevada only

---

## ✅ RECOMMENDED TO KEEP

### Must-Have (Top Tier):
1. ✅ **DraftKings** - #1 US sportsbook
2. ✅ **FanDuel** - #2 US sportsbook
3. ✅ **BetMGM** - #3 US sportsbook
4. ✅ **Caesars** - Major operator
5. ✅ **PrizePicks** - #1 DFS app
6. ✅ **Underdog** - #2 DFS app

### Should Keep (Second Tier):
7. ✅ **ESPN BET** - Growing fast
8. ✅ **Fanatics** - New but big
9. ✅ **Hard Rock** - Solid operator
10. ✅ **PointsBet** - Good odds
11. ✅ **BetRivers** - Wide availability
12. ✅ **DK Pick6** - DFS option

### Nice to Have (Third Tier):
13. ✅ **Pinnacle** - Sharp book (best odds)
14. ✅ **NoVig** - Low vig option
15. ✅ **Fliff** - Social betting
16. ✅ **ProphetX** - Exchange
17. ✅ **SuperBook** - Vegas book
18. ✅ **Betfred** - UK operator in US

---

## 🔧 CLEAN SPORTSBOOKS LIST

Here's a cleaned-up list with duplicates removed:

```javascript
export const AVAILABLE_SPORTSBOOKS = [
  // Top Tier - Must Have
  { key: 'draftkings', name: 'DraftKings', popular: true },
  { key: 'fanduel', name: 'FanDuel', popular: true },
  { key: 'betmgm', name: 'BetMGM', popular: true },
  { key: 'caesars', name: 'Caesars Sportsbook', popular: true },
  
  // DFS Apps
  { key: 'prizepicks', name: 'PrizePicks', popular: true, isDFS: true },
  { key: 'underdog', name: 'Underdog Fantasy', popular: true, isDFS: true },
  { key: 'pick6', name: 'DK Pick6', popular: true, isDFS: true },
  
  // Second Tier
  { key: 'espnbet', name: 'ESPN BET', popular: true },
  { key: 'fanatics', name: 'Fanatics Sportsbook', popular: true },
  { key: 'hardrock', name: 'Hard Rock Bet', popular: true },
  { key: 'pointsbetus', name: 'PointsBet US', popular: true },
  { key: 'betrivers', name: 'BetRivers', popular: true },
  { key: 'wynnbet', name: 'WynnBET', popular: true },
  { key: 'unibet_us', name: 'Unibet US', popular: true },
  
  // Sharp/Low Vig Books
  { key: 'pinnacle', name: 'Pinnacle', popular: true },
  { key: 'novig', name: 'NoVig', popular: true },
  
  // Exchange
  { key: 'prophetx', name: 'ProphetX', popular: true, isExchange: true },
  
  // Regional/Specialty
  { key: 'fliff', name: 'Fliff', popular: false },
  { key: 'superbook', name: 'SuperBook', popular: false },
  { key: 'betfred_us', name: 'Betfred US', popular: false },
  { key: 'circasports', name: 'Circa Sports', popular: false },
  
  // Offshore (Optional - Remove if you don't want)
  { key: 'bovada', name: 'Bovada', popular: false },
  { key: 'betonline', name: 'BetOnline', popular: false },
  { key: 'mybookieag', name: 'MyBookie', popular: false },
];
```

---

## 📊 CURRENT PLAYER PROPS SETTINGS

**Server Configuration:**
```javascript
PLAYER_PROPS_MAX_BOOKS_PER_REQUEST = 15
```

This means you can show up to **15 bookmakers** in player props minitable.

---

## 🎯 RECOMMENDED PLAYER PROPS BOOKS

### Priority Order (For Player Props):

**Tier 1 - Must Include:**
1. **Underdog** - Best DFS odds (-116)
2. **PrizePicks** - Most popular DFS
3. **DraftKings** - Best traditional book for props
4. **FanDuel** - Second best for props
5. **BetMGM** - Good prop coverage

**Tier 2 - Should Include:**
6. **Caesars** - Wide prop selection
7. **DK Pick6** - Another DFS option
8. **ESPN BET** - Growing prop market
9. **PointsBet** - Unique pricing
10. **BetRivers** - Good prop odds

**Tier 3 - Nice to Have:**
11. **Fanatics** - New props market
12. **Hard Rock** - Solid coverage
13. **ProphetX** - Exchange pricing
14. **NoVig** - Low vig props
15. **Pinnacle** - Sharp props (if available)

---

## 🔧 TO INCREASE PLAYER PROPS BOOKS

### Option 1: Already at Max (15)
Your server is already configured for 15 books, which is good!

### Option 2: Ensure Books Are Selected
Make sure users have these books selected in their settings.

### Option 3: Check API Response
Some books might not offer the specific prop you're viewing.

---

## 📝 SUMMARY

**Total Sportsbooks:** 31 (with duplicates)
**Recommended to Keep:** 23
**Recommended to Remove:** 8 (duplicates + defunct)

**Player Props Limit:** 15 books (already configured)

**Your current 4-book minitable** is probably because:
- Only 4 books have data for that specific prop
- Or user has only selected 4 books

---

**Want me to:**
1. ✅ Clean up the sportsbooks list (remove duplicates)?
2. ✅ Increase player props display to show all 15 available?
3. ✅ Create a priority system for which books to show first?
