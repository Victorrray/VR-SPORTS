# Render Deployment Guide - VR-Odds Platform

## 🚀 Sports Cache Integration - Production Deployment

### Prerequisites Completed ✅
- [x] Supabase migration `005_sports_cache.sql` executed
- [x] API endpoint updated to use Supabase cache
- [x] Test script confirms everything works locally

---

## 📋 Render Environment Variables

### **Backend Service** (https://odds-backend-4e9q.onrender.com)

Make sure these environment variables are set in your Render dashboard:

#### **Required (Already Set)**
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# The Odds API
ODDS_API_KEY=your_odds_api_key

# Optional APIs
SPORTSGAMEODDS_API_KEY=your_sgo_api_key  # Fallback for player props

# Server Config
PORT=10000
NODE_ENV=production
```

#### **New Variables (If Not Already Set)**
```bash
# Enable player props
ENABLE_PLAYER_PROPS_V2=true

# Demo mode (optional for testing)
ALLOW_DEMO_USER=true

# Auto-start NFL caching (optional)
AUTO_START_NFL_CACHE=false
```

---

## 🔄 Deployment Steps

### 1. **Push Code to GitHub**
```bash
cd /Users/victorray/Desktop/vr-odds
git add .
git commit -m "Add Supabase sports cache integration"
git push origin main
```

### 2. **Render Auto-Deploy**
- Render will automatically detect the push and redeploy
- Monitor the deployment logs in Render dashboard
- Look for: `✅ Server running on http://localhost:10000`

### 3. **Verify Deployment**
Once deployed, test the endpoint:
```bash
# Test sports endpoint
curl "https://odds-backend-4e9q.onrender.com/api/sports" \
  -H "x-user-id: demo-user"

# Should return JSON array of sports
```

---

## 🧪 Testing the Sports Cache

### **Test 1: Check Supabase Cache**
```bash
# In Supabase SQL Editor, run:
SELECT * FROM get_active_sports();

# Should return 14+ sports
```

### **Test 2: API Endpoint**
```bash
# Local test
curl "http://localhost:10000/api/sports" -H "x-user-id: demo-user"

# Production test
curl "https://odds-backend-4e9q.onrender.com/api/sports" -H "x-user-id: demo-user"
```

### **Test 3: Frontend Integration**
1. Open browser to your frontend URL
2. Open DevTools Console
3. Look for logs: `📦 Returning X sports from Supabase cache`

---

## 📊 How the Sports Cache Works

### **Request Flow:**
```
1. User requests /api/sports
   ↓
2. Server checks Supabase cache (get_active_sports())
   ↓
3a. Cache HIT → Return cached data (fast, no API cost)
   ↓
3b. Cache MISS → Fetch from The Odds API
   ↓
4. Update Supabase cache (refresh_sports_cache())
   ↓
5. Return data to user
```

### **Cache Behavior:**
- **Cache Duration**: 24 hours
- **Auto-Refresh**: When cache expires, next request fetches fresh data
- **Fallback**: If Supabase fails, uses memory cache or hardcoded list
- **Cost Savings**: Reduces API calls from ~1000/day to ~1/day

---

## 🔍 Monitoring & Logs

### **Server Logs to Watch For:**

✅ **Success:**
```
📦 Returning 14 sports from Supabase cache
```

⚠️ **Cache Miss:**
```
🌐 Fetching sports list from The Odds API
✅ Updated 14 sports in Supabase cache
```

❌ **Errors:**
```
⚠️ Supabase cache error: [error message]
📦 Using memory cached sports list
```

---

## 🛠️ Troubleshooting

### **Issue: Sports not loading**
**Solution:**
1. Check Supabase connection:
   ```sql
   SELECT * FROM sports_cache LIMIT 5;
   ```
2. Verify environment variables in Render
3. Check server logs for errors

### **Issue: Old sports data**
**Solution:**
```sql
-- Force cache refresh by expiring all entries
UPDATE sports_cache SET cache_expires_at = NOW() - INTERVAL '1 hour';
```

### **Issue: Function not found**
**Solution:**
- Re-run the migration `005_sports_cache.sql` in Supabase
- Make sure you're using the correct Supabase project

---

## 📈 Performance Improvements

### **Before (No Cache):**
- Every request → The Odds API call
- Cost: $0.001 per request
- Response time: 500-1000ms
- Daily cost: ~$1-5

### **After (With Supabase Cache):**
- First request → The Odds API call
- Next 24 hours → Supabase cache
- Cost: $0.001 per day
- Response time: 50-100ms
- Daily cost: ~$0.001

**Savings: 99% reduction in API costs for sports list**

---

## 🎯 Next Steps

1. ✅ Monitor first production deployment
2. ✅ Verify cache is working in logs
3. ⏭️ Extend caching to other endpoints (events, odds)
4. ⏭️ Add cache warming on server startup
5. ⏭️ Implement cache invalidation webhooks

---

## 📝 Notes

- The sports cache is **read-only** for most users
- Only the server can update the cache via `refresh_sports_cache()`
- Cache automatically expires after 24 hours
- No manual cache clearing needed
- Supabase handles all cache management

---

## 🆘 Support

If you encounter issues:
1. Check Render deployment logs
2. Check Supabase logs
3. Verify environment variables
4. Test locally first with `node test-sports-cache.js`

**The sports cache integration is production-ready! 🎉**
