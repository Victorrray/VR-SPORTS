# 🚀 VR-Odds Platform - Deployment Debug Checklist

## **Pre-Deployment Checklist**

### ✅ Environment Variables (Backend)
- [ ] `STRIPE_SECRET_KEY` - Set in Render dashboard
- [ ] `STRIPE_PRICE_PLATINUM` - Set in Render dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - Set in Render dashboard
- [ ] `ODDS_API_KEY` - Set in Render dashboard
- [ ] `SPORTSGAMEODDS_API_KEY` - Set in Render dashboard
- [ ] `SUPABASE_URL` - Set in Render dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set in Render dashboard
- [ ] `FRONTEND_URL` - Set in Render dashboard
- [ ] `ADMIN_API_KEY` - Set in Render dashboard
- [ ] `ENABLE_PLAYER_PROPS_V2=true` - Set in Render dashboard

### ✅ Environment Variables (Frontend)
- [ ] `REACT_APP_API_BASE_URL` - Set in Render dashboard
- [ ] `REACT_APP_DEBUG=true` - Set in Render dashboard (for debugging)

### ✅ Build & Deploy
- [ ] Frontend build completed successfully
- [ ] Backend deployment triggered
- [ ] Services restarted after env var changes

---

## **Post-Deployment Debug Guide**

### **1. Health Check**
```bash
# Test basic connectivity
curl -I https://vr-sports.onrender.com/health
curl -I https://my-react-frontend-021i.onrender.com/

# Test API endpoints
curl https://vr-sports.onrender.com/api/sports
curl https://vr-sports.onrender.com/api/me/usage
```

### **2. Enable Debug Mode**
- Press **Ctrl+Shift+D** to open debug panel
- Check browser console for errors
- Monitor network tab for failed requests

### **3. Authentication Flow**
- [ ] Sign in with demo user
- [ ] Check console for: "🎯 Demo user detected"
- [ ] Verify platinum plan shows immediately
- [ ] Check Account page loads correctly
- [ ] Test sign out/sign in cycle

### **4. Core Features**
- [ ] Navigate to `/sportsbooks` - odds load?
- [ ] Navigate to `/dfs` - player props load?
- [ ] Navigate to `/scores` - scores load?
- [ ] Test search functionality
- [ ] Test filtering by sport/bookmaker

### **5. Stripe Integration**
- [ ] Visit Account page
- [ ] Click "Upgrade to Platinum"
- [ ] Verify Stripe checkout opens
- [ ] Check console for API errors
- [ ] Test webhook handling

### **6. Performance Monitoring**
- [ ] Check API response times (< 2s)
- [ ] Monitor for rate limiting errors
- [ ] Check for memory leaks
- [ ] Verify caching is working

### **7. Error Scenarios to Test**

#### **Network Issues**
- [ ] Disable network - check offline handling
- [ ] Slow connection - verify timeouts
- [ ] API failures - check fallback systems

#### **Authentication Issues**
- [ ] Invalid tokens - proper error handling
- [ ] Expired sessions - redirect to login
- [ ] Missing permissions - graceful degradation

#### **API Issues**
- [ ] TheOddsAPI down - fallback to SportsGameOdds
- [ ] Rate limiting - show user message
- [ ] Invalid data - error boundaries catch

#### **Payment Issues**
- [ ] Stripe unavailable - proper error message
- [ ] Webhook failures - manual plan updates
- [ ] Cancelled payments - state cleanup

---

## **Common Debug Commands**

### **Browser Console Commands**
```javascript
// Check API connectivity
fetch('/api/sports').then(r => r.json()).then(console.log)

// Check user authentication
console.log('User:', window.__userId)

// Check plan status
console.log('Plan:', window.__planData)

// Enable detailed logging
localStorage.setItem('debug', 'true')
location.reload()

// Check API error tracking
console.log('API Errors:', APIErrorTracker.getSummary())
```

### **Server Monitoring**
```bash
# Check server logs
heroku logs --tail -a vr-sports

# Monitor specific endpoints
curl -w "@curl-format.txt" -o /dev/null -s "https://vr-sports.onrender.com/api/sports"

# Test with different user agents
curl -H "User-Agent: VR-Odds/1.0" https://vr-sports.onrender.com/api/sports
```

---

## **Debug Panel Usage**

### **Tabs Available**
1. **Logs** - Real-time console output
2. **Errors** - API error tracking
3. **Actions** - User interaction tracking

### **Key Indicators**
- 🔴 **Red** - Critical errors
- 🟡 **Yellow** - Warnings
- 🔵 **Blue** - Info messages
- 🟢 **Green** - Success/API calls

### **Network Status**
- Online/Offline indicator
- API response times
- Failed request tracking

---

## **Troubleshooting Guide**

### **Problem: User not getting platinum access**
- Check: Demo user ID in logs
- Check: Plan cache cleared properly
- Check: `/api/me/usage` returns correct data

### **Problem: Odds not loading**
- Check: CORS headers correct
- Check: API keys configured
- Check: Rate limiting not exceeded
- Check: Fallback systems working

### **Problem: Player props not showing**
- Check: `/api/player-props` endpoint accessible
- Check: `ENABLE_PLAYER_PROPS_V2=true`
- Check: SportsGameOdds API working
- Check: DFS route accessible

### **Problem: Stripe checkout failing**
- Check: Environment variables set
- Check: `/api/billing/create-checkout-session` working
- Check: Frontend URL configured correctly

---

## **Performance Benchmarks**

| Feature | Expected Time | Max Acceptable |
|---------|---------------|----------------|
| Page Load | < 2s | < 5s |
| API Calls | < 1s | < 3s |
| Odds Refresh | < 3s | < 8s |
| Player Props | < 2s | < 5s |

---

## **Quick Fix Commands**

### **Clear All Caches**
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### **Reset User State**
```javascript
// In browser console
fetch('/api/logout', { method: 'POST', credentials: 'include' })
.then(() => location.reload())
```

### **Force Plan Refresh**
```javascript
// In browser console
fetch('/api/me/usage', { credentials: 'include' })
.then(r => r.json())
.then(data => console.log('Plan data:', data))
```

---

## **Emergency Rollback Plan**

1. **Frontend Issues**: Switch to previous deployment
2. **Backend Issues**: Check Render dashboard for quick restart
3. **Database Issues**: Verify Supabase connection
4. **API Issues**: Temporarily disable problematic features

---

## **Contact Information**

- **Frontend URL**: https://my-react-frontend-021i.onrender.com/
- **Backend URL**: https://vr-sports.onrender.com/
- **Render Dashboard**: https://dashboard.render.com/
- **Debug Key**: Ctrl+Shift+D (development only)

---

## **Success Metrics**

✅ All pages load without errors
✅ Authentication flow works
✅ Odds display correctly
✅ Player props accessible
✅ Stripe integration functional
✅ No console errors in production
✅ Performance within acceptable limits

**Ready for deployment! 🚀**
