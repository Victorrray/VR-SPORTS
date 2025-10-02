# 📋 FINAL SPORTSBOOKS LIST - 23 BOOKS

## ✅ COMPLETE LIST

### Tier 1 - Must Have (4 Sportsbooks + 2 DFS):
1. ✅ **DraftKings** (`draftkings`)
2. ✅ **FanDuel** (`fanduel`)
3. ✅ **BetMGM** (`betmgm`)
4. ✅ **Caesars** (`caesars`)
5. ✅ **PrizePicks** (`prizepicks`) - DFS
6. ✅ **Underdog** (`underdog`) - DFS

### Tier 2 - Major Operators (9 Sportsbooks + 2 DFS):
7. ✅ **DK Pick6** (`pick6`) - DFS
8. ✅ **Dabble AU** (`dabble_au`) - DFS ⭐ NEW
9. ✅ **ESPN BET** (`espnbet`)
10. ✅ **Fanatics** (`fanatics`)
11. ✅ **Hard Rock** (`hardrock`)
12. ✅ **PointsBet** (`pointsbetus`)
13. ✅ **BetRivers** (`betrivers`)
14. ✅ **WynnBET** (`wynnbet`)
15. ✅ **Unibet** (`unibet_us`)
16. ✅ **Pinnacle** (`pinnacle`) - Sharp
17. ✅ **NoVig** (`novig`) - Low Vig

### Tier 3 - Specialty/Regional (2 Exchanges + 5 Others):
18. ✅ **ProphetX** (`prophetx`) - Exchange
19. ✅ **ReBet** (`rebet`) - Exchange ⭐ NEW
20. ✅ **Fliff** (`fliff`)
21. ✅ **Circa Sports** (`circasports`)
22. ✅ **Bovada** (`bovada`) - Offshore
23. ✅ **BetOnline** (`betonline`) - Offshore
24. ✅ **MyBookie** (`mybookieag`) - Offshore

---

## 🎮 DFS APPS (4 TOTAL)

1. **PrizePicks** - Fixed odds (-137)
2. **Underdog** - Fixed odds (-116)
3. **DK Pick6** - Fixed odds (-137)
4. **Dabble AU** - Australian DFS ⭐ NEW

---

## 🔄 EXCHANGES (2 TOTAL)

1. **ProphetX** - US Exchange
2. **ReBet** - US2 Region Exchange ⭐ NEW

---

## 📊 BREAKDOWN

**Total Books:** 23
- **Traditional Sportsbooks:** 17
- **DFS Apps:** 4
- **Exchanges:** 2

**By Tier:**
- **Tier 1:** 6 books (4 traditional + 2 DFS)
- **Tier 2:** 11 books (9 traditional + 2 DFS)
- **Tier 3:** 6 books (4 traditional + 2 exchanges)

**By Region:**
- **US (us):** 17 books
- **US DFS (us_dfs):** 4 books
- **US2 (us2):** 1 book (ReBet)
- **AU (au):** 1 book (Dabble AU)

---

## 🎯 PLAYER PROPS SUPPORT

### ✅ ALL 23 BOOKS CHECKED FOR PLAYER PROPS

**Server Configuration:**
- `PLAYER_PROPS_MAX_BOOKS_PER_REQUEST = 15`
- Up to 15 books shown in minitable
- All 23 books checked for data

**Priority Order (For Minitable):**

**Top 5 (DFS Apps First):**
1. Underdog (-116)
2. PrizePicks (-137)
3. DK Pick6 (-137)
4. Dabble AU ⭐ NEW
5. DraftKings

**Next 10 (Major Sportsbooks):**
6. FanDuel
7. BetMGM
8. Caesars
9. ESPN BET
10. Fanatics
11. Hard Rock
12. PointsBet
13. BetRivers
14. NoVig
15. Pinnacle

**Remaining 8 (If API returns data):**
16. WynnBET
17. Unibet
18. ProphetX
19. ReBet ⭐ NEW
20. Fliff
21. Circa Sports
22. Bovada
23. BetOnline

---

## 🆕 RECENT CHANGES

### Added (2):
- ✅ **ReBet** (`rebet`) - Exchange, us2 region
- ✅ **Dabble AU** (`dabble_au`) - DFS app, Australian

### Removed (9):
- ❌ Betfred US (per user request)
- ❌ SuperBook (per user request)
- ❌ William Hill (duplicate of Caesars)
- ❌ Barstool (duplicate of ESPN BET)
- ❌ BetOnline AG (duplicate key)
- ❌ FOX Bet (defunct)
- ❌ TwinSpires (rebranded to FanDuel)
- ❌ LowVig (low volume)
- ❌ Rebet (was listed as low volume, now added back as exchange)

---

## 🔧 API REGIONS NEEDED

### For Regular Odds:
```javascript
regions: ['us', 'us2']
```

### For Player Props:
```javascript
regions: ['us', 'us_dfs', 'us2']
```

### For International (Dabble AU):
```javascript
regions: ['us', 'us_dfs', 'us2', 'au']
```

---

## 📝 IMPLEMENTATION NOTES

### ReBet:
- **Key:** `rebet`
- **Region:** us2
- **Type:** Exchange
- **Tier:** 3
- **Player Props:** Yes (exchange pricing)

### Dabble AU:
- **Key:** `dabble_au`
- **Region:** au (Australian)
- **Type:** DFS App
- **Tier:** 2
- **Player Props:** Yes (DFS style)
- **Fixed Odds:** TBD (check API response)

---

## ✅ VERIFICATION

All books are now:
- ✅ Properly configured with correct keys
- ✅ Categorized by type (DFS, Exchange, Traditional)
- ✅ Organized by tier (1, 2, 3)
- ✅ Support player props
- ✅ Have correct region mappings

---

**Total: 23 sportsbooks ready for player props and regular odds!** 🎯
