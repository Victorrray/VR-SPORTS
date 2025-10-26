# Subscription Plan Issue - Root Cause Analysis

**Date**: October 26, 2025  
**Subscriber ID**: `598347f4-66a9-447d-9421-0523eeb1dc94`  
**Issue**: Plan not automatically set to "gold" after Stripe checkout

---

## 🔍 Root Cause

The Stripe webhook handler exists and is correctly configured, but the plan was **NOT automatically set** because:

### Possible Causes (in order of likelihood):

1. **Webhook Not Received** ⚠️ **MOST LIKELY**
   - Stripe webhook may not have been triggered
   - Webhook endpoint may not be registered in Stripe dashboard
   - Network connectivity issue between Stripe and your server
   - Webhook secret (`STRIPE_WEBHOOK_SECRET`) mismatch

2. **Webhook Received But Not Processed**
   - Webhook signature verification failed (line 1918)
   - `userId` not included in checkout session metadata (line 1927)
   - Supabase connection failed silently (line 1929)
   - Error occurred but wasn't logged properly (line 1945)

3. **Metadata Not Passed**
   - Frontend didn't include `userId` in Stripe checkout session
   - Checkout session created without proper metadata

---

## 📋 Current Webhook Implementation

**Location**: `server/index.js` lines 1906-1996

### What Should Happen:

```
1. Stripe sends webhook event → checkout.session.completed
2. Extract userId from session.metadata
3. Get subscription details from Stripe
4. Update user plan to "gold" in Supabase
5. Set subscription_end_date
6. Log success
```

### Code Flow:

```javascript
// Line 1925: Check for checkout.session.completed event
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const userId = session.metadata?.userId;  // ← CRITICAL: userId must be here
  
  if (userId && supabase) {
    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Update Supabase
    await supabase.from('users').update({ 
      plan: 'gold',
      subscription_end_date: subscriptionEndDate.toISOString()
    }).eq('id', userId);
  }
}
```

---

## ✅ Improvements & Fixes

I've added enhanced logging and error handling to prevent this in the future:

### 1. **Better Logging** (Added)
```javascript
console.log('📨 Webhook received:', event.type);
console.log('👤 User ID from metadata:', userId);
console.log('✅ Plan set to gold via webhook: ${userId}');
```

### 2. **Enhanced Error Handling** (Added)
- Log when userId is missing
- Log when Supabase connection fails
- Log webhook signature verification failures
- Log subscription retrieval errors

### 3. **Webhook Verification Script** (New)
Created `server/verify-webhook.js` to test webhook setup

### 4. **Monitoring Dashboard** (New)
Created `server/webhook-monitor.js` to track webhook events

---

## 🛠️ Prevention for Future Subscriptions

### Checklist:

- [ ] **Verify Webhook Endpoint in Stripe Dashboard**
  1. Go to https://dashboard.stripe.com/webhooks
  2. Confirm endpoint is: `https://your-domain.com/api/billing/webhook`
  3. Confirm events subscribed: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
  4. Confirm webhook secret is set in `.env` as `STRIPE_WEBHOOK_SECRET`

- [ ] **Verify Frontend Passes userId**
  1. Check that checkout session includes `metadata: { userId: user.id }`
  2. Verify userId is valid UUID format

- [ ] **Test Webhook Locally**
  ```bash
  # Use Stripe CLI to forward webhooks to localhost
  stripe listen --forward-to localhost:3001/api/billing/webhook
  ```

- [ ] **Monitor Webhook Logs**
  ```bash
  # Watch for webhook events
  tail -f logs/combined.log | grep -i webhook
  ```

- [ ] **Check Stripe Dashboard**
  1. Go to https://dashboard.stripe.com/events
  2. Look for `checkout.session.completed` events
  3. Check if they show "Delivered" or "Failed"

---

## 📊 Webhook Event Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Completes Stripe Checkout                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Stripe Creates Subscription & Sends Webhook                 │
│ Event: checkout.session.completed                           │
│ Metadata: { userId: "598347f4-..." }                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Server Receives Webhook at /api/billing/webhook             │
│ 1. Verify signature                                         │
│ 2. Extract userId from metadata                             │
│ 3. Get subscription from Stripe                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Update Supabase                                             │
│ SET plan = 'gold'                                           │
│ SET subscription_end_date = <date>                          │
│ WHERE id = userId                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ User Now Has Gold Plan Access                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Debugging Steps for Future Issues

If a subscription doesn't get set automatically:

### Step 1: Check Webhook Delivery
```bash
# In Stripe Dashboard:
# 1. Go to Developers → Webhooks
# 2. Click on your endpoint
# 3. Scroll to "Events" section
# 4. Look for checkout.session.completed
# 5. Click on event to see request/response
```

### Step 2: Check Server Logs
```bash
tail -f logs/combined.log | grep -i "webhook\|plan\|stripe"
```

### Step 3: Check User in Database
```bash
node server/check-subscriber.js <userId>
```

### Step 4: Manually Fix (Temporary)
```bash
node server/fix-subscriber-plan.js <userId> gold
```

### Step 5: Investigate Root Cause
- [ ] Is webhook endpoint registered in Stripe?
- [ ] Is webhook secret correct?
- [ ] Is userId in checkout metadata?
- [ ] Is Supabase connection working?
- [ ] Are there network issues?

---

## 📝 Webhook Configuration Checklist

### Required Environment Variables:
```bash
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...  # ← CRITICAL
```

### Required Stripe Dashboard Settings:
```
Webhooks → Add Endpoint
├─ URL: https://your-domain.com/api/billing/webhook
├─ Events:
│  ├─ checkout.session.completed
│  ├─ customer.subscription.deleted
│  └─ customer.subscription.updated
└─ Signing Secret: whsec_...
```

### Required Frontend Code:
```javascript
// When creating checkout session:
const session = await stripe.redirectToCheckout({
  sessionId: checkoutSession.id,
  metadata: {
    userId: user.id  // ← MUST BE INCLUDED
  }
});
```

---

## 🚨 Will This Happen Again?

### Likelihood: **MEDIUM** (if webhook not properly configured)

### Prevention:

1. **✅ Added Enhanced Logging**
   - Now logs all webhook events
   - Logs errors with full context
   - Easier to debug future issues

2. **✅ Added Monitoring Scripts**
   - `check-subscriber.js` - Verify plan status
   - `fix-subscriber-plan.js` - Manual override
   - `verify-webhook.js` - Test webhook setup

3. **✅ Added Error Handling**
   - Better error messages
   - More detailed logging
   - Graceful failure handling

4. **⚠️ Still Need To Verify**
   - Webhook endpoint registered in Stripe
   - Webhook secret correct in `.env`
   - Frontend includes userId in metadata
   - Network connectivity between Stripe and server

---

## 🎯 Action Items

### Immediate:
- [x] Fixed subscriber's plan to gold
- [x] Created verification scripts
- [x] Added monitoring tools

### Short-term (This Week):
- [ ] Verify webhook configuration in Stripe dashboard
- [ ] Test webhook with Stripe CLI locally
- [ ] Add webhook event logging to database
- [ ] Create webhook monitoring dashboard

### Medium-term (Next 2 Weeks):
- [ ] Add automated webhook retry logic
- [ ] Add webhook event audit trail
- [ ] Create admin dashboard to view webhook events
- [ ] Add email notification on webhook failure

---

## 📞 Support

If future subscriptions don't get set automatically:

1. Run verification script:
   ```bash
   node server/check-subscriber.js <userId>
   ```

2. Check logs:
   ```bash
   tail -f logs/combined.log
   ```

3. Manually fix (if needed):
   ```bash
   node server/fix-subscriber-plan.js <userId> gold
   ```

4. Investigate root cause using debugging steps above

---

**Summary**: The webhook infrastructure is in place, but the first subscriber's plan wasn't set because the webhook likely wasn't triggered or wasn't properly configured. Enhanced logging and monitoring tools have been added to prevent and quickly diagnose future issues.
