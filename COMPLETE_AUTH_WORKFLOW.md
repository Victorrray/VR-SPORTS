# Complete Authentication & Plan Verification Workflow

## Overview
This document traces the entire flow from user signup → payment → login → plan verification.

---

## Phase 1: User Signup

### Step 1.1: Frontend Signup Form
**File**: `client/src/pages/Login.js` (lines 183-189)
```javascript
// User clicks "Create account" button
onClick={() => go(signUp)}
// Calls: signUp(email, password)
```

### Step 1.2: Supabase Auth Signup
**File**: `client/src/hooks/SimpleAuth.js` (lines 78-86)
```javascript
const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }  // Optional user metadata
  });
  if (error) throw error;
  return data;
};
```

**What happens:**
- ✅ Supabase creates auth user in `auth.users` table
- ✅ Auth user gets a UUID (user.id)
- ✅ Email confirmation sent (if enabled)
- ❌ **NO user record created in `public.users` table yet**

### Step 1.3: Auth State Change Listener
**File**: `client/src/hooks/SimpleAuth.js` (lines 55-67)
```javascript
supabase.auth.onAuthStateChange((_event, session) => {
  console.log('🔐 Auth state changed:', _event);
  setSession(session);
  setUser(session?.user ?? null);
  if (session?.user) {
    console.log('👤 User logged in, fetching profile for user:', session.user.id);
    fetchProfile(session.user.id);  // Fetch from profiles table
  }
  setAuthLoading(false);
});
```

**What happens:**
- ✅ Auth state changes to SIGNED_IN
- ✅ Frontend fetches profile from `profiles` table
- ❌ **NO automatic user record creation in `users` table**

---

## Phase 2: User Makes First API Request

### Step 2.1: Frontend Makes API Call
**Example**: Fetching odds data
```javascript
const response = await fetch('/api/odds', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'x-user-id': user.id
  }
});
```

### Step 2.2: Backend Authenticate Middleware
**File**: `server/middleware/auth.js` (lines 231-263)
```javascript
async function authenticate(req, _res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const supabase = req.app.locals.supabase;
  
  if (token && supabase) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) {
      req.user = data.user;  // Set req.user from token
      console.log('✅ authenticate: User authenticated:', data.user.id);
    }
  }
  next();
}
```

**What happens:**
- ✅ Token verified
- ✅ `req.user` set from token
- ✅ Continues to next middleware

### Step 2.3: Backend checkPlanAccess Middleware
**File**: `server/middleware/auth.js` (lines 155-217)
```javascript
async function checkPlanAccess(req, res, next) {
  const userId = req.__userId;
  const supabase = req.app.locals.supabase;
  const userUsage = req.app.locals.userUsage;
  
  const profile = await getUserProfile(userId, supabase, userUsage);
  
  // Check plan
  if (profile.plan === 'gold' || profile.plan === 'platinum' || profile.grandfathered) {
    req.__userProfile = profile;
    return next();
  }
  
  // Allow new users (plan = NULL) limited access
  if (profile.plan === null) {
    console.log(`🆕 Allowing temporary access for new user: ${userId}`);
    req.__userProfile = profile;
    req.__limitedAccess = true;
    return next();
  }
  
  // No valid plan
  return res.status(402).json({
    error: "SUBSCRIPTION_REQUIRED",
    message: "Subscription required..."
  });
}
```

### Step 2.4: getUserProfile - User Creation
**File**: `server/middleware/auth.js` (lines 49-124)
```javascript
async function getUserProfile(userId, supabase, userUsage) {
  try {
    // Try to fetch existing user
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // User doesn't exist, CREATE THEM
      console.log(`🆕 Creating new user: ${userId}`);
      
      const newUser = {
        id: userId,
        plan: null,  // ⚠️ NEW USERS START WITH NULL PLAN
        api_request_count: 0,
        grandfathered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert(newUser)
        .select("*")
        .single();

      if (insertErr) {
        console.error('❌ Failed to create user:', insertErr);
        throw new Error(`Database error creating user: ${insertErr.message}`);
      }

      console.log(`✅ Successfully created user: ${userId}`);
      return inserted;  // ⚠️ Returns user with plan: null
    }

    if (error) {
      console.error('❌ Database error fetching user:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;  // Return existing user

  } catch (error) {
    console.error('❌ getUserProfile error:', error);
    throw error;
  }
}
```

**What happens:**
- ✅ User record created in `users` table
- ⚠️ **plan = NULL** (new users have no plan)
- ✅ User gets temporary limited access

---

## Phase 3: User Upgrades to Platinum

### Step 3.1: User Clicks "Upgrade to Platinum"
**File**: `client/src/pages/Account.js` (lines 302-348)
```javascript
const handleUpgradeToPlatinum = async () => {
  const response = await fetch(withApiBase('/api/billing/create-checkout-session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supabaseUserId: user.id })
  });
  
  const responseData = await response.json();
  window.location.href = responseData.url;  // Redirect to Stripe
};
```

### Step 3.2: Backend Creates Stripe Checkout Session
**File**: `server/routes/billing.js` (lines 187-245)
```javascript
router.post('/create-checkout-session', requireUser, async (req, res) => {
  const stripe = req.app.locals.stripe;
  const { plan = 'platinum' } = req.body;
  const userId = req.__userId;
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    metadata: { 
      userId,           // ✅ USER ID STORED
      plan: plan.toLowerCase()  // ✅ PLAN STORED
    }
  });
  
  res.json({ url: session.url });
});
```

**What happens:**
- ✅ Stripe checkout session created
- ✅ Metadata includes `userId` and `plan`
- ✅ User redirected to Stripe payment page

### Step 3.3: User Completes Payment
- ✅ User enters payment info
- ✅ Stripe processes payment
- ✅ Stripe sends webhook to backend

---

## Phase 4: Stripe Webhook Processing

### Step 4.1: Webhook Received
**File**: `server/routes/billing.js` (lines 17-40)
```javascript
router.post('/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const stripe = req.app.locals.stripe;
    const sig = req.headers['stripe-signature'];
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
      console.log(`📨 Webhook received: ${event.type}`);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
```

**What happens:**
- ✅ Webhook signature verified
- ✅ Event type checked

### Step 4.2: Process checkout.session.completed
**File**: `server/routes/billing.js` (lines 43-139)
```javascript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const userId = session.metadata?.userId;  // ✅ GET USER ID
  const planFromMetadata = session.metadata?.plan;  // ✅ GET PLAN
  
  console.log(`🔍 Processing checkout.session.completed:`, {
    sessionId: session.id,
    userId: userId,
    plan: planFromMetadata
  });
  
  // Get subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Calculate end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000);
  
  // Use plan from metadata, default to 'platinum'
  const planToSet = planFromMetadata || 'platinum';
  
  // UPDATE USER IN DATABASE
  const { error } = await supabase
    .from('users')
    .update({ 
      plan: planToSet,  // ✅ SET PLAN TO PLATINUM
      subscription_end_date: subscriptionEndDate.toISOString(),
      grandfathered: false,
      stripe_customer_id: subscription.customer,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  
  if (error) {
    console.error('❌ Failed to update user plan in Supabase:', error);
    throw error;
  }
  
  console.log(`✅ Plan set to ${planToSet} via webhook: ${userId}`);
}
```

**What happens:**
- ✅ User ID extracted from metadata
- ✅ Plan extracted from metadata
- ✅ Subscription details fetched from Stripe
- ✅ User record updated with:
  - `plan: 'platinum'`
  - `subscription_end_date: [date]`
  - `stripe_customer_id: [id]`
- ✅ Webhook returns 200 OK

---

## Phase 5: User Logs Out & Logs Back In

### Step 5.1: User Signs Out
**File**: `client/src/hooks/SimpleAuth.js` (lines 88-93)
```javascript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  setUser(null);
  setSession(null);
};
```

**What happens:**
- ✅ Auth session cleared
- ✅ Frontend state cleared
- ✅ User redirected to login

### Step 5.2: User Logs Back In
**File**: `client/src/pages/Login.js` (lines 72-112)
```javascript
const go = async (fn) => {
  const { data, error } = await fn(email, pw);  // Call signIn
  if (error) {
    setErr(error.message);
  } else {
    setTimeout(() => {
      navigate(next, { replace: true });
    }, 100);
  }
};
```

**File**: `client/src/hooks/SimpleAuth.js` (lines 72-76)
```javascript
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};
```

**What happens:**
- ✅ Auth credentials verified
- ✅ Session token generated
- ✅ Auth state changes to SIGNED_IN
- ✅ Frontend fetches profile

### Step 5.3: Frontend Fetches Plan
**File**: `client/src/hooks/SimplePlan.js` (lines 11-75)
```javascript
const fetchPlan = async () => {
  if (!user) {
    setPlan(null);
    setPlanLoading(false);
    return;
  }

  setPlanLoading(true);
  try {
    const { supabase } = await import('../lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const headers = { 
      'x-user-id': user.id,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await axios.get(`${API_BASE_URL}/api/me?t=${Date.now()}`, { headers });
    
    console.log('✅ Plan API response:', res.data);
    setPlan(res.data);
    setPlanLoading(false);
  } catch (err) {
    console.error('❌ Plan fetch error:', err.message);
    setPlan({ plan: 'free', remaining: 250, limit: 250 });
    setPlanLoading(false);
  }
};
```

**What happens:**
- ✅ Frontend calls `/api/me` endpoint
- ✅ Sends `x-user-id` header
- ✅ Sends auth token
- ✅ Cache-busting headers prevent stale data

### Step 5.4: Backend /api/me Endpoint
**File**: `server/routes/users.js` (lines 17-77)
```javascript
router.get('/me', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const supabase = req.app.locals.supabase;
  
  // Set cache-busting headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  if (!userId) {
    return res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
  }

  try {
    if (!supabase) {
      return res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
    }

    const { data, error } = await supabase
      .from('users')
      .select('plan, api_request_count, grandfathered')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('User not found, returning free plan');
      return res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
    }

    // Platinum or grandfathered = unlimited
    if (data.plan === 'platinum' || data.grandfathered) {
      console.log(`✅ User ${userId} has platinum plan`);
      return res.json({
        plan: 'platinum',
        remaining: null,
        limit: null,
        unlimited: true,
        used: data.api_request_count || 0
      });
    }

    // Free plan
    const limit = 250;
    const used = data.api_request_count || 0;
    const remaining = Math.max(0, limit - used);

    console.log(`📊 User ${userId} plan: ${data.plan || 'free'}`);
    res.json({
      plan: data.plan || 'free',
      remaining,
      limit,
      used,
      unlimited: false
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.json({ plan: 'free', remaining: 250, limit: 250, unlimited: false });
  }
});
```

**What happens:**
- ✅ Queries `users` table for user's plan
- ✅ If plan = 'platinum' → returns `unlimited: true`
- ✅ Sets cache-busting headers
- ✅ Returns plan data

### Step 5.5: Frontend useMe Hook
**File**: `client/src/hooks/SimplePlan.js` (lines 147-182)
```javascript
export function useMe() {
  const { user, authLoading } = useAuth();
  const { plan, planLoading, refreshPlan } = usePlan();

  const me = plan ? {
    plan: plan.plan || 'free',
    remaining: plan.remaining,
    limit: plan.limit,
    calls_made: plan.used || 0,
    unlimited: plan.unlimited || false
  } : {
    plan: 'free',
    remaining: 250,
    limit: 250,
    calls_made: 0,
    unlimited: false
  };

  console.log('🎯 useMe hook - returning me object:', {
    plan: me.plan,
    unlimited: me.unlimited,
    rawPlan: plan,
    loading: authLoading || planLoading,
    userId: user?.id
  });

  return {
    me,
    loading: authLoading || planLoading,
    error: null,
    refresh: refreshPlan
  };
}
```

**What happens:**
- ✅ Transforms API response to `me` object
- ✅ Sets `me.plan = 'platinum'`
- ✅ Sets `me.unlimited = true`
- ✅ Returns to components

### Step 5.6: Frontend Account Page Display
**File**: `client/src/pages/Account.js` (lines 399-416)
```javascript
<div className={`status-badge ${me?.plan === 'platinum' ? 'platinum' : me?.plan === 'gold' ? 'gold' : 'guest'}`}>
  {me?.plan === 'platinum' ? (
    <>
      <Crown size={12} />
      <span>Platinum</span>
    </>
  ) : me?.plan === 'gold' ? (
    <>
      <Crown size={12} />
      <span>Gold</span>
    </>
  ) : (
    <>
      <User size={12} />
      <span>Guest</span>
    </>
  )}
</div>
```

**What happens:**
- ✅ Checks `me?.plan === 'platinum'`
- ✅ Displays "Platinum" badge with Crown icon
- ✅ Applies platinum styling

---

## Possible Issues & Breakpoints

### Issue 1: Webhook Not Processing ❌
**Symptom**: User plan not updated after payment
**Cause**: 
- Stripe webhook not reaching backend
- Signature verification failing
- Stream not readable error

**Fix Applied**: Moved billing routes before express.json()

### Issue 2: Metadata Not Stored ❌
**Symptom**: Webhook processes but plan stays as "gold"
**Cause**: Hardcoded `plan: 'gold'` instead of using metadata

**Fix Applied**: Changed to use `session.metadata?.plan`

### Issue 3: API Returns Wrong Plan ❌
**Symptom**: `/api/me` returns `plan: 'free'` instead of `platinum`
**Cause**:
- User ID not in database
- Database query failing
- Wrong user ID being queried

**Diagnosis**: Check server logs for query errors

### Issue 4: Frontend Not Updating ❌
**Symptom**: API returns platinum but UI shows guest
**Cause**:
- Browser cache serving stale data
- localStorage caching old plan
- React state not re-rendering
- Component not re-fetching plan

**Diagnosis**: 
- Check browser console for logs
- Clear cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)

### Issue 5: Token Not Sent ❌
**Symptom**: `/api/me` returns free plan
**Cause**:
- Auth token not in request headers
- Token expired
- Token verification failing

**Diagnosis**: Check Network tab → `/api/me` request → Headers

### Issue 6: Session Not Created ❌
**Symptom**: User can't log in after signup
**Cause**:
- Email not confirmed
- Password too weak
- Supabase auth not configured

**Diagnosis**: Check Supabase auth logs

---

## Data Flow Diagram

```
SIGNUP
  ↓
User creates auth account (Supabase)
  ↓
Auth state changes → SIGNED_IN
  ↓
First API request
  ↓
Backend creates user record (plan = NULL)
  ↓
User upgrades to Platinum
  ↓
Clicks "Upgrade to Platinum"
  ↓
Backend creates Stripe checkout (metadata: userId, plan)
  ↓
User completes payment
  ↓
Stripe sends webhook
  ↓
Backend updates user: plan = 'platinum'
  ↓
User logs out
  ↓
User logs back in
  ↓
Frontend calls /api/me
  ↓
Backend queries users table
  ↓
Returns plan: 'platinum'
  ↓
Frontend updates me object
  ↓
Account page displays "Platinum" badge
```

---

## Verification Checklist

- [ ] User created in `auth.users` table
- [ ] User created in `public.users` table on first API call
- [ ] Stripe checkout session created with metadata
- [ ] Webhook received and processed
- [ ] User plan updated to 'platinum' in database
- [ ] `/api/me` returns `plan: 'platinum'`
- [ ] Frontend receives plan data
- [ ] useMe hook returns `me.plan = 'platinum'`
- [ ] Account page displays platinum badge
- [ ] Arbitrage/Middles sections enabled

---

## Testing Commands

### Check User in Database
```bash
node server/check-subscriber.js 27406e00-20cd-4ff2-a353-22cea581e741
```

### Test /api/me Endpoint
```bash
curl -H "x-user-id: 27406e00-20cd-4ff2-a353-22cea581e741" \
  http://localhost:5000/api/me
```

### Check Webhook Logs
```bash
grep "checkout.session.completed" server/logs/*.log
grep "Plan set to platinum" server/logs/*.log
```

### Check Browser Console
```javascript
// Look for these logs:
// 🔄 User changed - fetching plan for: [userId]
// ✅ Plan API response: [response]
// 🎯 useMe hook - returning me object: [object]
```

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for `/api/me` request
5. Check Response tab for `"plan": "platinum"`
