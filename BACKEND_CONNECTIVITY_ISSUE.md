# Backend Connectivity Issue - Production

## Problem
Frontend at `https://oddsightseer.com/` cannot reach backend at `https://odds-backend-4e9q.onrender.com/`

## Error Details
```
Failed to load 'https://odds-backend-4e9q.onrender.com/api/me?t=1762226845519&_=1762226845519'
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
(Reason: CORS request did not succeed). Status code: (null).
```

## Root Cause
The backend server is **not responding** to requests. This could be due to:

1. **Backend is down** - Server not running on Render
2. **Network connectivity issue** - Render deployment having issues
3. **Backend crashed** - Application error causing crash
4. **Port not exposed** - Server not listening on correct port
5. **Environment variables missing** - Backend can't initialize

## Affected User
- User ID: `936581d3-507b-4a25-9fce-2217f52a177c`
- Username: `cowbeeyo`
- Plan: Just upgraded to platinum
- Issue: Cannot fetch plan from backend

## Console Logs Show
```
🔄 Fetching plan for user: 936581d3-507b-4a25-9fce-2217f52a177c
🔄 API URL: https://odds-backend-4e9q.onrender.com/api/me
🔐 Session token available: true
🔐 Session user: 936581d3-507b-4a25-9fce-2217f52a177c
🔄 Request headers: { "x-user-id": "936581d3-507b-4a25-9fce-2217f52a177c", hasAuth: true, cacheBuster: 1762226845519 }

❌ Plan fetch error: Network Error
❌ Error details: undefined
❌ Error status: undefined
❌ Full error: { message: "Network Error", name: "AxiosError", code: "ERR_NETWORK" }
```

## What's Working
- ✅ Frontend loads at `https://oddsightseer.com/`
- ✅ User authentication works (OAuth, email/password)
- ✅ User can log in
- ✅ CORS is configured correctly
- ✅ Cache clearing works
- ✅ Plan was upgraded in database

## What's NOT Working
- ❌ Backend API calls fail
- ❌ `/api/me` endpoint unreachable
- ❌ Plan data cannot be fetched
- ❌ User sees "free" plan instead of "platinum"

## CORS Configuration
CORS is properly configured in `server/index.js` (lines 49-62):
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://oddsightseer.com',
    'https://www.oddsightseer.com',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
```

## Required Actions

### 1. Check Backend Status
- [ ] Verify backend is running on Render
- [ ] Check Render dashboard for deployment status
- [ ] Look for error logs in Render
- [ ] Verify environment variables are set

### 2. Backend Environment Variables Required
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_PLATINUM=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=https://oddsightseer.com
NODE_ENV=production
```

### 3. Restart Backend
- [ ] Redeploy backend on Render
- [ ] Or manually restart if available

### 4. Verify Connectivity
Once backend is up, test:
```bash
curl -H "x-user-id: 936581d3-507b-4a25-9fce-2217f52a177c" \
  https://odds-backend-4e9q.onrender.com/api/me
```

Should return:
```json
{
  "plan": "platinum",
  "unlimited": true,
  "used": 0
}
```

## User Impact
- User `cowbeeyo` upgraded to platinum but cannot access features
- Frontend shows "free" plan instead of "platinum"
- All API calls fail with network errors
- User experience is broken

## Next Steps
1. Check Render backend deployment status
2. Review backend logs for errors
3. Verify all environment variables are set
4. Restart or redeploy backend
5. Test `/api/me` endpoint
6. Confirm user can now see platinum plan
