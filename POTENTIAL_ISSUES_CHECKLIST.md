# Potential Issues & Roadblocks Checklist

## 🔍 Pre-Flight Checklist

Run through this before going live or when debugging issues.

---

## 1️⃣ Supabase Configuration

### **Tables Exist:**
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cached_odds', 'cached_events', 'odds_update_log', 'sports_cache');
```

**Expected:** 4 tables  
**If missing:** Run migrations 005 and 006

### **Table Structure Correct:**
```sql
-- Check cached_odds columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cached_odds'
ORDER BY ordinal_position;
```

**Must have:**
- sport_key (TEXT)
- event_id (TEXT)
- bookmaker_key (TEXT)
- market_key (TEXT)
- odds_data (JSONB) ← Critical!
- expires_at (TIMESTAMPTZ)

**If wrong:** Drop and recreate table

### **Indexes Exist:**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'cached_odds';
```

**Expected:** 5-7 indexes  
**If missing:** Run migration again

---

## 2️⃣ Environment Variables

### **Backend (Render):**
```bash
# Required
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ ODDS_API_KEY
✅ NODE_ENV=production
✅ ENABLE_PLAYER_PROPS_V2=true

# Stripe (if using payments)
✅ STRIPE_SECRET_KEY
✅ STRIPE_PRICE_PLATINUM
✅ STRIPE_WEBHOOK_SECRET

# Optional
⚠️ SPORTSGAMEODDS_API_KEY (fallback)
⚠️ FRONTEND_URL
⚠️ AUTO_START_NFL_CACHE
```

**Verify:**
```bash
curl https://odds-backend-4e9q.onrender.com/healthz
```

**Should show:**
```json
{
  "hasSupabase": true,
  "hasStripe": true,
  "hasStripePrice": true
}
```

### **Frontend (Render):**
```bash
✅ REACT_APP_API_URL=https://odds-backend-4e9q.onrender.com
✅ REACT_APP_SUPABASE_URL
✅ REACT_APP_SUPABASE_ANON_KEY
```

---

## 3️⃣ API Connectivity

### **Test Backend Endpoints:**
```bash
# Health check
curl https://odds-backend-4e9q.onrender.com/healthz

# Sports list (should use Supabase cache)
curl https://odds-backend-4e9q.onrender.com/api/sports \
  -H "x-user-id: demo-user"

# Cached odds (should return empty or cached data)
curl https://odds-backend-4e9q.onrender.com/api/cached-odds/nfl \
  -H "x-user-id: demo-user"
```

**Expected:**
- Health: 200 OK with JSON
- Sports: 200 OK with array of sports
- Cached odds: 200 OK with array (may be empty)

**If fails:**
- Check Render deployment logs
- Verify environment variables
- Check Supabase connection

---

## 4️⃣ Cache Functionality

### **Test Cache Population:**
```bash
# Make request to populate cache
curl "https://odds-backend-4e9q.onrender.com/api/odds?sports=americanfootball_nfl&regions=us&markets=h2h" \
  -H "x-user-id: YOUR_USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check Render logs for:**
```
📦 Supabase cache MISS for americanfootball_nfl
🌐 API call for americanfootball_nfl
💾 Saving X games to Supabase cache
✅ Successfully cached X games in Supabase
```

### **Verify Data in Supabase:**
```sql
SELECT 
  sport_key,
  COUNT(*) as entries,
  COUNT(DISTINCT event_id) as games,
  MAX(created_at) as last_cached,
  MAX(expires_at) as expires
FROM cached_odds
GROUP BY sport_key;
```

**Should show:**
- sport_key: americanfootball_nfl
- entries: 90+ (30 games × 3 markets)
- games: 30
- last_cached: Recent timestamp
- expires: 5 minutes in future

---

## 5️⃣ Frontend Integration

### **Browser Console Checks:**
```javascript
// Should see these logs:
🔍 withApiBase (prod) returning: https://odds-backend-4e9q.onrender.com/api/odds
✅ Markets loaded: 30 games

// Should NOT see:
❌ Error: Unexpected token '<'
❌ Error: UNAUTHENTICATED
❌ Error: Network request failed
```

### **Network Tab:**
- Check API requests go to correct URL
- Check response is JSON, not HTML
- Check status codes are 200
- Check response times (<2s)

---

## 6️⃣ Performance Metrics

### **Cache Hit Rate:**
```sql
-- Check cache effectiveness
SELECT 
  sport_key,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
  ROUND(100.0 * COUNT(*) FILTER (WHERE expires_at > NOW()) / COUNT(*), 2) as active_percentage
FROM cached_odds
GROUP BY sport_key;
```

**Target:** >80% active entries

### **Response Times:**
- First request: 500-1000ms (API call)
- Cached request: 50-100ms (Supabase)
- Memory cached: 10-20ms (RAM)

**Monitor in Render logs:**
```
⏱️ Request completed in 87ms (cache hit)
⏱️ Request completed in 1243ms (cache miss)
```

---

## 7️⃣ Cost Monitoring

### **The Odds API Usage:**
```bash
# Check usage at: https://the-odds-api.com/account/
```

**Expected:**
- <500 requests/day with caching
- ~$15-30/month

**Warning signs:**
- >1000 requests/day
- >$50/month
- Rapid usage increase

### **Supabase Usage:**
```bash
# Check at: https://supabase.com/dashboard/project/_/settings/billing
```

**Expected:**
- <1GB database size
- <100k rows in cached_odds
- Free tier sufficient

---

## 8️⃣ Common Failure Scenarios

### **Scenario A: NFL Shows No Data**
**Symptoms:**
- Other sports work
- NFL returns empty array
- No errors in logs

**Diagnosis:**
```sql
SELECT COUNT(*) FROM cached_odds WHERE sport_key = 'americanfootball_nfl';
```

**Solutions:**
1. If 0: Cache never populated → Make request to populate
2. If >0 but expired: Cache expired → Make fresh request
3. If >0 and valid: Check sport key mapping in code

### **Scenario B: First Request Times Out**
**Symptoms:**
- Request takes >2 minutes
- Returns partial results or error
- Logs show many API calls

**Diagnosis:**
- Check game limit for sport
- Check timeout settings
- Check API response times

**Solutions:**
1. Reduce game limit (currently 30 for MLB)
2. Increase timeout (currently 2 minutes)
3. Implement pagination

### **Scenario C: Cache Never Hits**
**Symptoms:**
- Every request makes API call
- High API costs
- Slow response times

**Diagnosis:**
```sql
SELECT MAX(expires_at) FROM cached_odds;
```

**Solutions:**
1. If NULL: Cache not saving → Check Supabase connection
2. If past: TTL too short → Increase cache duration
3. If future: Cache key mismatch → Check query parameters

### **Scenario D: Supabase Connection Fails**
**Symptoms:**
- Logs show Supabase errors
- Falls back to memory cache
- Cache doesn't persist

**Diagnosis:**
```bash
curl https://odds-backend-4e9q.onrender.com/healthz
# Check hasSupabase: false
```

**Solutions:**
1. Check SUPABASE_URL is correct
2. Check SUPABASE_SERVICE_ROLE_KEY is valid
3. Check Supabase project is active
4. Check network connectivity

---

## 9️⃣ Security Checks

### **Authentication:**
- [ ] User tokens validated
- [ ] Demo user access controlled
- [ ] Plan limits enforced
- [ ] Rate limiting active

### **API Keys:**
- [ ] Not exposed in frontend
- [ ] Stored as environment variables
- [ ] Not committed to git
- [ ] Rotated periodically

### **CORS:**
- [ ] Only allowed origins configured
- [ ] Credentials handled properly
- [ ] Preflight requests work

---

## 🔟 Deployment Verification

### **After Each Deploy:**
```bash
# 1. Check health
curl https://odds-backend-4e9q.onrender.com/healthz

# 2. Check Supabase connection
# Should show hasSupabase: true

# 3. Test sports endpoint
curl https://odds-backend-4e9q.onrender.com/api/sports \
  -H "x-user-id: demo-user"

# 4. Check frontend loads
# Open https://odds-frontend-j2pn.onrender.com
# Should load without errors

# 5. Test end-to-end flow
# Select sport → Should load games
# Select player props → Should load props
```

---

## ✅ All Systems Go Checklist

Before marking as "production ready":

- [ ] All Supabase tables exist
- [ ] All migrations run successfully
- [ ] Environment variables set correctly
- [ ] Health endpoint shows all green
- [ ] Cache populates on first request
- [ ] Cache hits on subsequent requests
- [ ] All sports work (NFL, MLB, NBA, etc.)
- [ ] Player props work
- [ ] Frontend loads without errors
- [ ] API costs are reasonable (<$5/day)
- [ ] Response times are fast (<100ms cached)
- [ ] No errors in production logs
- [ ] Monitoring set up
- [ ] Backup plan for API failures

---

## 🚨 Emergency Procedures

### **If API Costs Spike:**
1. Check cache hit rate
2. Increase cache TTL
3. Reduce game limits
4. Disable auto-refresh

### **If Supabase Goes Down:**
1. System falls back to memory cache
2. Monitor for recovery
3. Cache repopulates automatically

### **If The Odds API Goes Down:**
1. Serve cached data only
2. Show "stale data" warning
3. Monitor for recovery

### **If Frontend Won't Load:**
1. Check Render deployment status
2. Check environment variables
3. Check CORS configuration
4. Redeploy if needed

---

## 📊 Success Metrics

**System is healthy when:**
- ✅ Cache hit rate >80%
- ✅ Response times <100ms (cached)
- ✅ API costs <$5/day
- ✅ Uptime >99%
- ✅ No critical errors in logs
- ✅ All sports working
- ✅ User satisfaction high

**Review this checklist weekly to catch issues early!** 🎯
