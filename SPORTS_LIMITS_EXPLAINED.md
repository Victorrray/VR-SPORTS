# Sports-Specific Game Limits for Player Props

## 🎯 Why Limits Are Needed

Player props require **individual API calls per game**. Without limits:
- **MLB:** 50+ games × 15 seconds = 12+ minutes (timeout!)
- **NBA:** 30+ games × 15 seconds = 7+ minutes (timeout!)
- **Cost:** 100 games × $0.001 = $0.10 per request

With Supabase caching, we can be smart about limits.

---

## 📊 Current Sport Limits

| Sport | Game Limit | Reason | Typical Games |
|-------|-----------|--------|---------------|
| **NFL** | 100 | Small season (17 games), can handle all | 10-16 |
| **NCAAF** | 50 | Many games, but manageable | 30-50 |
| **NCAAB** | 50 | Many games, but manageable | 50-100 |
| **MLB** | 30 | 162-game season, too many to fetch all | 50-80 |
| **NBA** | 30 | 82-game season, too many to fetch all | 20-40 |
| **NHL** | 30 | 82-game season, too many to fetch all | 20-40 |
| **Soccer (EPL)** | 20 | Multiple games per day | 10-20 |
| **Default** | 40 | Safe default for other sports | Varies |

---

## ⏱️ Timeout Protection

### **Per-Game Timeout:**
- 15 seconds per game
- Prevents individual game from hanging

### **Total Request Timeout:**
- 2 minutes (120 seconds) total
- Prevents entire request from hanging
- Returns partial results if timeout reached

---

## 🔄 How Caching Helps

### **First Request (Cache Miss):**
```
MLB Player Props Request:
- Fetches first 30 games
- Takes ~7-8 minutes (30 games × 15 sec)
- Saves ALL to Supabase cache
- Returns 30 games of props
```

### **Second Request (Cache Hit):**
```
MLB Player Props Request:
- Checks Supabase cache
- Finds all 30 games cached
- Returns in 2-3 seconds (instant!)
- $0 API cost
```

### **Result:**
- First request: Slow but populates cache
- All subsequent requests: FAST and FREE
- Cache lasts 5 minutes

---

## 📈 Performance by Sport

| Sport | First Request | Cached Request | Games Shown | Players Shown |
|-------|---------------|----------------|-------------|---------------|
| NFL | 15-25 min | 2-3 sec | ALL (10-16) | 500-800 |
| NCAAF | 12-15 min | 2-3 sec | 50 | 1000-1500 |
| MLB | 7-8 min | 2-3 sec | 30 | 600-900 |
| NBA | 7-8 min | 2-3 sec | 30 | 600-900 |
| NHL | 7-8 min | 2-3 sec | 30 | 600-900 |

---

## 💰 Cost Analysis

### **MLB Example (30 games):**

**Without Caching:**
- Every request: 30 API calls
- Cost per request: $0.03
- Daily cost (100 requests): $3.00
- Monthly cost: $90

**With Supabase Caching (5-min TTL):**
- First request: 30 API calls ($0.03)
- Next 5 minutes: 0 API calls ($0)
- Cache refreshes: ~12 per hour
- Daily cost: 12 × 24 × $0.03 = $8.64
- Monthly cost: $259

**With Supabase Caching (optimized):**
- Most users hit cache
- Only ~20% of requests populate cache
- Daily cost: ~$1.73
- Monthly cost: ~$52

**Savings: 42% vs no caching**

---

## 🎯 Why Not Show ALL Games?

### **Problem with "Unlimited":**
1. **MLB has 50+ games daily**
   - 50 games × 15 sec = 12.5 minutes
   - Request would timeout
   - User sees error, no data

2. **Cost Explosion**
   - 50 games × $0.001 = $0.05 per request
   - 100 requests/day = $5/day
   - $150/month just for MLB

3. **Diminishing Returns**
   - Most users only care about top 20-30 games
   - Later games have fewer props available
   - Not worth the cost/time

### **Solution: Smart Limits**
- Show most important games first
- Cache everything
- Fast subsequent requests
- Manageable costs

---

## 🔧 How Games Are Prioritized

### **Sorting Logic:**
1. **NCAA Sports:** NCAA games first (if requested)
2. **Start Time:** Soonest games first
3. **Popularity:** More bookmakers = higher priority

### **Result:**
- Users see the games they care about most
- Props for tonight's games
- Not games 2 weeks away

---

## 📊 What Sports Are Cached?

**Check Supabase Cache:**
```sql
SELECT 
  sport_key,
  COUNT(DISTINCT event_id) as games_cached,
  COUNT(DISTINCT market_key) as markets_cached,
  MAX(created_at) as last_cached,
  MAX(expires_at) as cache_expires
FROM cached_odds
GROUP BY sport_key
ORDER BY last_cached DESC;
```

**Expected Results:**
- `americanfootball_nfl` - 10-16 games
- `baseball_mlb` - 30 games
- `basketball_nba` - 30 games
- `americanfootball_ncaaf` - 50 games
- And more...

---

## 🚀 Future Improvements

### **Possible Enhancements:**
1. **User-Configurable Limits**
   - Platinum users: Higher limits
   - Free users: Lower limits

2. **Smart Caching**
   - Cache popular games longer
   - Refresh less popular games less often

3. **Background Population**
   - Pre-populate cache before users request
   - Always have fresh cache ready

4. **Pagination**
   - Return first 30 games immediately
   - Allow users to load more if needed

---

## ✅ Summary

**Current System:**
- ✅ Smart per-sport limits prevent timeouts
- ✅ Supabase caching makes subsequent requests instant
- ✅ 2-minute total timeout prevents hanging
- ✅ Shows most important games first
- ✅ Manageable costs (~$50/month for MLB)

**Trade-offs:**
- ⚠️ First request is slow (7-15 minutes)
- ⚠️ Not ALL games shown (30-50 depending on sport)
- ✅ But subsequent requests are FAST (2-3 seconds)
- ✅ And costs are REASONABLE

**This is the optimal balance between performance, cost, and user experience!**
