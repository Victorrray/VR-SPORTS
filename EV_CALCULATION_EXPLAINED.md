# EV Calculation Requirements

## 🎯 Why You're Seeing 0.00% EV

### **Minimum Books Required:**
- **Player Props:** Minimum **3 books** required
- **Game Odds:** Minimum **3 books** required

### **Why This Requirement Exists:**

**EV (Expected Value) calculation requires a "fair line":**
1. Collect odds from multiple books
2. Calculate consensus probability (fair line)
3. Compare your book's odds to fair line
4. Calculate EV = (Your Odds - Fair Line)

**With only 1 book:**
- No way to establish fair line
- Can't determine if odds are good or bad
- EV calculation impossible

---

## 📊 Your Specific Case:

**What you selected:**
- Only Dabble (1 DFS book)

**Result:**
- 0.00% EV (not enough books)

**To get EV:**
- Select at least 3 books total
- Example: Dabble + PrizePicks + Underdog = 3 books ✅

---

## 🔍 Why PrizePicks and Pick6 Are Missing

### **Possible Reasons:**

1. **The Odds API doesn't have data**
   - Not all books offer every player/market
   - Eagles vs Giants, Tyrone Tracy Jr. might not be on all books
   - This is normal for less popular players

2. **Books haven't posted lines yet**
   - Game is tomorrow (Oct 9)
   - Some books post lines later than others

3. **Market not offered**
   - "Reception Longest" is a niche market
   - Not all DFS apps offer this market

---

## ✅ How to Verify Coverage:

### **Test with Popular Player:**
Try a star player like:
- Saquon Barkley (Eagles RB)
- Daniel Jones (Giants QB)
- Popular markets (Rush Yards, Receiving Yards)

**Expected result:**
- 5-10+ books for popular players
- 2-4 books for role players
- 1-2 books for niche markets

### **Check All Available Books:**
In your sportsbook filter, make sure you have selected:
- ✅ PrizePicks
- ✅ Underdog
- ✅ Pick6 (DraftKings Pick6)
- ✅ Dabble
- ✅ Fliff
- ✅ ReBet

---

## 🎯 EV Calculation Logic:

### **Code Reference:**
```javascript
// File: OddsTable.js line 1874
if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 3) {
  // Calculate EV
  const fairDec = 1 / consensusProb;
  const ev = calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
  return ev;
}
```

### **Requirements:**
1. `consensusProb` exists (calculated from multiple books)
2. `consensusProb` is valid (between 0 and 1)
3. `uniqCnt >= 3` (at least 3 unique books)

### **If any requirement fails:**
- Returns `null`
- Shows 0.00% EV

---

## 📈 Expected Behavior:

### **Scenario A: 1 Book Selected**
```
Books: [Dabble]
Result: 0.00% EV
Reason: Need minimum 3 books
```

### **Scenario B: 2 Books Selected**
```
Books: [Dabble, PrizePicks]
Result: 0.00% EV
Reason: Need minimum 3 books
```

### **Scenario C: 3+ Books Selected**
```
Books: [Dabble, PrizePicks, Underdog]
Result: 2.45% EV ✅
Reason: Enough books to calculate fair line
```

### **Scenario D: Book Doesn't Have Line**
```
Books Selected: [PrizePicks, Underdog, Pick6, Dabble]
Books with Data: [Dabble]
Result: 0.00% EV
Reason: Only 1 book actually has this line
```

---

## 🚀 Recommendations:

### **For Best EV Calculations:**
1. **Select ALL DFS apps:**
   - PrizePicks
   - Underdog
   - Pick6
   - Dabble
   - Fliff

2. **Select major sportsbooks:**
   - DraftKings
   - FanDuel
   - BetMGM
   - Caesars

3. **Total: 9+ books selected**
   - More books = more accurate fair line
   - More accurate fair line = better EV calculations

### **For Popular Players:**
- Expect 8-15 books with data
- EV calculations very reliable

### **For Role Players:**
- Expect 3-6 books with data
- EV calculations moderately reliable

### **For Niche Markets:**
- Expect 1-3 books with data
- EV calculations may not be available

---

## 🔧 Troubleshooting:

### **"I selected 5 books but still see 0.00% EV"**
**Possible causes:**
1. Only 1-2 books actually have this specific line
2. The other books don't offer this player/market
3. Check browser console for EV calculation logs

### **"PrizePicks doesn't show up"**
**Possible causes:**
1. PrizePicks doesn't offer this specific player/market
2. The Odds API doesn't have PrizePicks data for this game
3. PrizePicks hasn't posted lines yet

### **"EV seems wrong"**
**Possible causes:**
1. Not enough books (need 3+ for reliable EV)
2. Books have very different lines (market disagreement)
3. One book has stale odds (not updated recently)

---

## ✅ Summary:

**Your 0.00% EV is correct behavior:**
- Only 1 book (Dabble) has data
- Need minimum 3 books for EV calculation
- This is working as designed

**To get EV:**
- Select more books in filter
- Or wait for more books to post lines
- Or try a more popular player/market

**The system is working correctly!** 🎉
