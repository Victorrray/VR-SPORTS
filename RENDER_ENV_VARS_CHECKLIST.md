# Render Environment Variables Checklist

## 🔍 Backend Service (odds-backend-4e9q.onrender.com)

### ✅ Required for Supabase Integration (NEW)
These are **CRITICAL** for the new caching system to work:

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `SUPABASE_URL` | ✅ YES | `https://xxx.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ YES | `eyJhbGc...` | Supabase service role key (secret) |

**⚠️ Without these, Supabase caching won't work and you'll hit API limits!**

---

### ✅ Required for Basic Functionality

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `NODE_ENV` | ✅ YES | `production` | Environment mode |
| `PORT` | ⚠️ Auto | `10000` | Server port (Render sets this) |
| `ODDS_API_KEY` | ✅ YES | `abc123...` | The Odds API key |

---

### ✅ Required for Player Props

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ENABLE_PLAYER_PROPS_V2` | ✅ YES | `true` | Enable player props feature |
| `SPORTSGAMEODDS_API_KEY` | ⚠️ Optional | `null` | Fallback API for player props |

---

### ✅ Required for Stripe Payments

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `STRIPE_SECRET_KEY` | ✅ YES | `sk_live_...` | Stripe secret key |
| `STRIPE_PRICE_PLATINUM` | ✅ YES | `price_...` | Platinum plan price ID |
| `STRIPE_WEBHOOK_SECRET` | ✅ YES | `whsec_...` | Stripe webhook secret |

---

### ⚙️ Optional Configuration

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `FRONTEND_URL` | ⚠️ Recommended | `https://odds-frontend-j2pn.onrender.com` | Frontend URL for CORS |
| `ALLOW_DEMO_USER` | ⚠️ Optional | `false` | Allow demo user access |
| `AUTO_START_NFL_CACHE` | ⚠️ Optional | `false` | Auto-populate NFL cache on startup |
| `ADMIN_API_KEY` | ⚠️ Optional | `null` | Admin API access key |

---

## 🎨 Frontend Service (odds-frontend-j2pn.onrender.com)

### ✅ Required Variables

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `REACT_APP_API_URL` | ✅ YES | `https://odds-backend-4e9q.onrender.com` | Backend API URL |
| `REACT_APP_SUPABASE_URL` | ✅ YES | `https://xxx.supabase.co` | Supabase URL (for auth) |
| `REACT_APP_SUPABASE_ANON_KEY` | ✅ YES | `eyJhbGc...` | Supabase anon key (public) |

**Note:** Frontend uses `REACT_APP_` prefix for Create React App environment variables.

---

## 🧪 How to Verify in Render Dashboard

### Backend Service:
1. Go to https://dashboard.render.com
2. Click on **odds-backend-4e9q** (or your backend service)
3. Go to **Environment** tab
4. Check that ALL variables above are set

### Frontend Service:
1. Click on **odds-frontend-j2pn** (or your frontend service)
2. Go to **Environment** tab
3. Check that ALL frontend variables are set

---

## ✅ Quick Verification Commands

### Test Backend Health:
```bash
curl https://odds-backend-4e9q.onrender.com/healthz
```

**Should return:**
```json
{
  "ok": true,
  "env": "production",
  "hasStripe": true,
  "hasStripePrice": true,
  "hasStripeWebhook": true,
  "hasSupabase": true,  // ← Should be TRUE!
  "frontendUrl": "https://odds-frontend-j2pn.onrender.com"
}
```

**⚠️ If `hasSupabase: false`, the Supabase variables are missing!**

---

## 🚨 Common Issues

### Issue 1: "HTML instead of JSON" Error
**Cause:** Frontend environment variables not set or frontend not redeployed
**Fix:** 
1. Verify `REACT_APP_API_URL` is set in frontend
2. Trigger frontend redeploy
3. Hard refresh browser (Cmd+Shift+R)

### Issue 2: Supabase Cache Not Working
**Cause:** Missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in backend
**Fix:**
1. Add both variables to backend environment
2. Redeploy backend service
3. Check `/healthz` endpoint shows `hasSupabase: true`

### Issue 3: Player Props Not Showing
**Cause:** `ENABLE_PLAYER_PROPS_V2` not set to `true`
**Fix:**
1. Set `ENABLE_PLAYER_PROPS_V2=true` in backend
2. Redeploy backend
3. Check server logs for "Player props enabled"

---

## 📋 Copy-Paste Checklist

Use this to verify in Render dashboard:

### Backend Environment Variables:
```
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ NODE_ENV=production
✅ ODDS_API_KEY
✅ ENABLE_PLAYER_PROPS_V2=true
✅ STRIPE_SECRET_KEY
✅ STRIPE_PRICE_PLATINUM
✅ STRIPE_WEBHOOK_SECRET
✅ FRONTEND_URL=https://odds-frontend-j2pn.onrender.com
```

### Frontend Environment Variables:
```
✅ REACT_APP_API_URL=https://odds-backend-4e9q.onrender.com
✅ REACT_APP_SUPABASE_URL
✅ REACT_APP_SUPABASE_ANON_KEY
```

---

## 🎯 What Changed with Supabase Integration

### New Variables Added:
- `SUPABASE_URL` (backend)
- `SUPABASE_SERVICE_ROLE_KEY` (backend)

### Variables That Should Already Exist:
- All other variables should already be configured
- No changes needed to existing variables

### What Happens if Supabase Variables Missing:
- ❌ Supabase caching won't work
- ❌ Will fall back to memory cache only
- ❌ Higher API costs (no persistent cache)
- ⚠️ Server will still work, just without caching benefits

---

## ✅ Final Verification

After setting all variables:
1. **Redeploy both services** (backend and frontend)
2. **Wait 5-10 minutes** for deployment
3. **Test the health endpoint:**
   ```bash
   curl https://odds-backend-4e9q.onrender.com/healthz
   ```
4. **Check for `hasSupabase: true`**
5. **Open frontend and check browser console** for API logs
6. **Should NOT see "HTML instead of JSON" errors**

---

**If you see `hasSupabase: false`, the Supabase variables are NOT set correctly!**
