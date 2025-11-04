# Possible Issues Causing Plan Not to Display - Comprehensive Checklist

## Critical Path Issues (Most Likely)

### Issue #1: Browser Cache Serving Stale Data ⚠️ MOST LIKELY
**Symptom**: API returns platinum but UI shows guest
**Root Cause**: Browser cache not respecting cache-busting headers

**Diagnosis**:
```bash
# Check browser cache
1. Open DevTools (F12)
2. Go to Application tab
3. Look for cached responses
4. Check if /api/me is cached

# Check cache headers
1. Network tab
2. Find /api/me request
3. Click on it
4. Check Response Headers:
   - Cache-Control: no-cache, no-store, must-revalidate, max-age=0
   - Pragma: no-cache
   - Expires: 0
```

**Fix**:
```bash
# Hard refresh to bypass cache
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear cache completely
Ctrl+Shift+Delete
Select "All time"
Check "Cookies and other site data"
Click "Clear data"
```

---

### Issue #2: localStorage Caching Old Plan ⚠️ LIKELY
**Symptom**: User upgrades but UI still shows old plan
**Root Cause**: Frontend caches plan in localStorage

**Diagnosis**:
```javascript
// In browser console:
localStorage.getItem('userPlan')
localStorage.getItem('me')
localStorage.getItem('plan')
localStorage.getItem('user')
```

**Fix**:
```javascript
// Clear localStorage
localStorage.clear()

// Or specific keys:
localStorage.removeItem('userPlan')
localStorage.removeItem('me')
localStorage.removeItem('plan')
localStorage.removeItem('userSelectedSportsbooks')
```

---

### Issue #3: React State Not Re-rendering ⚠️ LIKELY
**Symptom**: API returns platinum but component doesn't update
**Root Cause**: useMe hook fetches data but doesn't trigger re-render

**Diagnosis**:
```javascript
// In browser console, check if logs appear:
// 🔄 User changed - fetching plan for: [userId]
// ✅ Plan API response: [response]
// 🎯 useMe hook - returning me object: [object]

// If logs don't appear, hook isn't running
// If logs show platinum but UI shows guest, React isn't re-rendering
```

**Check**:
1. Open DevTools Console
2. Refresh page
3. Look for logs with 🔄, ✅, 🎯 prefixes
4. Check if `plan: 'platinum'` appears in logs

**Fix**:
```javascript
// In SimplePlan.js, add useEffect dependency:
useEffect(() => {
  console.log('🔄 Plan changed:', plan);
  // This should trigger when plan updates
}, [plan]);
```

---

### Issue #4: Token Not Sent in Request ⚠️ POSSIBLE
**Symptom**: `/api/me` returns free plan
**Root Cause**: Auth token not included in request headers

**Diagnosis**:
```bash
# Check Network tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Find /api/me request
5. Click on it
6. Go to Headers tab
7. Look for:
   - Authorization: Bearer [token]
   - x-user-id: [userId]
```

**Fix**: Ensure SimplePlan.js includes token:
```javascript
const headers = { 
  'x-user-id': user.id,
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

---

### Issue #5: API Returning Wrong User ID ⚠️ POSSIBLE
**Symptom**: `/api/me` queries wrong user in database
**Root Cause**: User ID mismatch between frontend and backend

**Diagnosis**:
```bash
# Check Network tab
1. Find /api/me request
2. Check Headers → x-user-id
3. Should be: 27406e00-20cd-4ff2-a353-22cea581e741
4. If different, that's the problem
```

**Fix**: Verify user ID is correct:
```javascript
console.log('User ID:', user.id);
// Should match: 27406e00-20cd-4ff2-a353-22cea581e741
```

---

### Issue #6: Database Query Returning Wrong Data ⚠️ POSSIBLE
**Symptom**: Backend queries database but gets wrong plan
**Root Cause**: User record in database has wrong plan

**Diagnosis**:
```bash
# Run diagnostic script
node server/test-user-auth.js 27406e00-20cd-4ff2-a353-22cea581e741

# Check output for:
# Plan: platinum ✅
# If shows "Plan: gold" or "Plan: null" → database issue
```

**Fix**: Manually update user plan:
```bash
# In Supabase SQL Editor:
UPDATE users 
SET plan = 'platinum' 
WHERE id = '27406e00-20cd-4ff2-a353-22cea581e741';
```

---

### Issue #7: Webhook Never Processed ⚠️ POSSIBLE
**Symptom**: User paid but plan never updated
**Root Cause**: Stripe webhook didn't reach backend

**Diagnosis**:
```bash
# Check server logs for:
grep "checkout.session.completed" server/logs/*.log
grep "Plan set to platinum" server/logs/*.log

# If not found, webhook didn't process
```

**Fix**: Check Stripe dashboard:
1. Go to Stripe Dashboard
2. Developers → Webhooks
3. Look for `checkout.session.completed` events
4. Check if they're marked as "Delivered" or "Failed"
5. If failed, check error message

---

### Issue #8: Session Token Expired ⚠️ POSSIBLE
**Symptom**: Auth token is invalid
**Root Cause**: Session expired or token corrupted

**Diagnosis**:
```javascript
// In browser console:
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Token:', session?.access_token);
console.log('Expires:', session?.expires_at);
```

**Fix**: Force re-authentication:
1. Sign out (click Sign Out button)
2. Sign back in
3. Check if plan now shows correctly

---

### Issue #9: Supabase Connection Failing ⚠️ POSSIBLE
**Symptom**: `/api/me` returns error or free plan
**Root Cause**: Backend can't connect to Supabase

**Diagnosis**:
```bash
# Check server logs for:
grep "Supabase" server/logs/*.log
grep "SUPABASE_URL" server/logs/*.log
grep "Database error" server/logs/*.log
```

**Fix**: Verify Supabase credentials:
```bash
# In server/.env:
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

### Issue #10: Component Not Using useMe Hook ⚠️ POSSIBLE
**Symptom**: Account page doesn't show plan
**Root Cause**: Component not calling useMe hook

**Diagnosis**:
```bash
# Check Account.js for:
const { me, refresh } = useMe();

# If missing, component won't get plan data
```

**Fix**: Ensure Account.js imports and uses useMe:
```javascript
import { useMe } from "../hooks/useMe";

export default function Account() {
  const { me, refresh } = useMe();
  // Now me.plan should be available
}
```

---

## Secondary Issues (Less Likely)

### Issue #11: Stripe Metadata Not Stored
**Symptom**: Webhook processes but plan stays as "gold"
**Root Cause**: Hardcoded plan instead of using metadata

**Status**: ✅ FIXED in commit 6732a10

---

### Issue #12: Webhook Stream Not Readable
**Symptom**: Webhook returns 500 error
**Root Cause**: express.json() middleware consuming stream

**Status**: ✅ FIXED in commit 41c6c53

---

### Issue #13: User Record Not Created
**Symptom**: First API call fails with 402 error
**Root Cause**: getUserProfile not creating user record

**Diagnosis**:
```bash
# Check if user exists in database:
node server/check-subscriber.js 27406e00-20cd-4ff2-a353-22cea581e741

# If "User not found" → user record wasn't created
```

---

### Issue #14: Plan Badge Component Not Rendering
**Symptom**: Account page doesn't show badge
**Root Cause**: Component logic error

**Diagnosis**:
```javascript
// Check Account.js line 399:
<div className={`status-badge ${me?.plan === 'platinum' ? 'platinum' : ...}`}>

// If me?.plan is undefined, badge won't render
```

---

## Debugging Workflow

### Step 1: Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Refresh page
4. Look for logs with 🔄, ✅, 🎯 prefixes
5. Screenshot all logs
```

### Step 2: Check Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Find /api/me request
5. Check:
   - Status code (should be 200)
   - Response body (should show plan: platinum)
   - Headers (should have cache-busting headers)
```

### Step 3: Check Application Tab
```
1. Open DevTools (F12)
2. Go to Application tab
3. Check Local Storage for stale data
4. Check Cookies for session info
5. Check Cache Storage for cached responses
```

### Step 4: Run Diagnostic Script
```bash
node server/test-user-auth.js 27406e00-20cd-4ff2-a353-22cea581e741
```

### Step 5: Check Server Logs
```bash
# Look for relevant logs:
grep "checkout.session.completed" server/logs/*.log
grep "Plan set to platinum" server/logs/*.log
grep "User ${userId}" server/logs/*.log
```

---

## Quick Fix Checklist

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Clear localStorage (`localStorage.clear()` in console)
- [ ] Sign out and sign back in
- [ ] Check `/api/me` response in Network tab
- [ ] Check browser console for diagnostic logs
- [ ] Run `node server/test-user-auth.js [userId]`
- [ ] Check server logs for webhook processing
- [ ] Verify user record in database
- [ ] Verify Stripe webhook was delivered

---

## If Still Not Working

1. **Share these items**:
   - Browser console logs (screenshot)
   - Network tab `/api/me` response (screenshot)
   - Output of `node server/test-user-auth.js` (copy/paste)
   - Server logs showing webhook processing (copy/paste)

2. **Check these files**:
   - `/Users/victorray/Desktop/vr-odds/AUTH_VERIFICATION_REPORT.md`
   - `/Users/victorray/Desktop/vr-odds/COMPLETE_AUTH_WORKFLOW.md`

3. **Verify these components**:
   - SimplePlan.js is fetching plan
   - Account.js is displaying plan
   - useMe hook is returning correct data
   - Database has correct plan value

---

## Summary Table

| Issue | Symptom | Likelihood | Fix Time |
|-------|---------|------------|----------|
| Browser cache | API returns platinum, UI shows guest | 🔴 HIGH | 1 min |
| localStorage cache | Old plan persists | 🔴 HIGH | 1 min |
| React not re-rendering | Logs show platinum, UI doesn't update | 🟡 MEDIUM | 5 min |
| Token not sent | API returns free plan | 🟡 MEDIUM | 5 min |
| Wrong user ID | API queries wrong user | 🟡 MEDIUM | 5 min |
| Database wrong data | User record has wrong plan | 🟡 MEDIUM | 10 min |
| Webhook not processed | User paid but plan not updated | 🟡 MEDIUM | 30 min |
| Session expired | Auth token invalid | 🟡 MEDIUM | 2 min |
| Supabase connection | Backend can't reach database | 🟠 LOW | 15 min |
| Component not using hook | Account page blank | 🟠 LOW | 5 min |
