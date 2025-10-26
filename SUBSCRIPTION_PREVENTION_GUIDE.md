# Subscription Plan Issue - Prevention & Monitoring Guide

## 🔴 What Happened

Your first subscriber's plan **was NOT automatically set to gold** after completing Stripe checkout.

**Root Cause**: The Stripe webhook that should have automatically updated the plan either:
1. ❌ Was not triggered by Stripe
2. ❌ Failed to deliver to your server
3. ❌ Was rejected due to signature verification failure
4. ❌ Failed to update the database

**Result**: User had `plan = NULL` instead of `plan = 'gold'`

---

## ✅ How We Fixed It

1. Created verification script to check subscriber status
2. Created fix script to manually set plan to gold
3. Fixed subscriber's plan (now expires Nov 25, 2025)
4. Added enhanced logging to webhook handler
5. Created comprehensive analysis document

---

## 🛡️ Prevention for Future Subscriptions

### Critical: Verify Webhook Configuration

**This is the #1 thing to check:**

```bash
# 1. Go to Stripe Dashboard
https://dashboard.stripe.com/webhooks

# 2. Verify your endpoint:
URL: https://your-domain.com/api/billing/webhook
Status: ✅ Active
Events: 
  ✅ checkout.session.completed
  ✅ customer.subscription.deleted
  ✅ customer.subscription.updated

# 3. Copy the Signing Secret
# 4. Add to .env:
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Verify Frontend Code

Check that checkout session includes userId:

```javascript
// In your checkout code, make sure it includes:
const session = await stripe.redirectToCheckout({
  sessionId: checkoutSession.id,
  metadata: {
    userId: user.id  // ← CRITICAL: Must be included
  }
});
```

### Test Webhook Locally

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to localhost
stripe listen --forward-to localhost:3001/api/billing/webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

---

## 📊 Monitoring Checklist

### Daily:
- [ ] Check logs for webhook errors
  ```bash
  tail -f logs/combined.log | grep -i webhook
  ```

### Weekly:
- [ ] Verify webhook delivery in Stripe dashboard
  ```
  Developers → Webhooks → Your Endpoint → Events
  Look for any "Failed" events
  ```

### Monthly:
- [ ] Review subscription metrics
  ```bash
  node server/check-subscriber.js <userId>
  ```

---

## 🚨 What to Do If It Happens Again

### Immediate (< 5 minutes):

1. **Identify the issue**
   ```bash
   # Check if webhook was received
   tail -f logs/combined.log | grep "Webhook received"
   
   # Check if plan was updated
   node server/check-subscriber.js <userId>
   ```

2. **Manually fix the subscriber**
   ```bash
   node server/fix-subscriber-plan.js <userId> gold
   ```

3. **Notify the subscriber**
   - Apologize for the delay
   - Confirm their plan is now active
   - Offer a free month as compensation

### Short-term (< 1 hour):

1. **Investigate root cause**
   - Check Stripe webhook delivery status
   - Check server logs for errors
   - Verify webhook secret in .env
   - Test webhook locally with Stripe CLI

2. **Document the issue**
   - When it happened
   - What the error was
   - How you fixed it
   - What you'll do to prevent it

### Long-term (< 1 week):

1. **Implement safeguards**
   - Add webhook event audit trail
   - Create webhook monitoring dashboard
   - Add automated retry logic
   - Add email alerts on webhook failure

---

## 📈 Webhook Event Flow (with new logging)

```
User Completes Checkout
         ↓
📨 Webhook received: checkout.session.completed
         ↓
🔍 Processing checkout.session.completed:
   - sessionId: cs_test_xxxxx
   - userId: 598347f4-66a9-447d-9421-0523eeb1dc94
   - hasSubscription: true
   - supabaseConnected: true
         ↓
💳 Subscription retrieved:
   - subscriptionId: sub_xxxxx
   - status: active
   - endDate: 2025-11-25T...
         ↓
✅ Plan set to gold via webhook: 598347f4-66a9-447d-9421-0523eeb1dc94
         ↓
✅ User Now Has Gold Plan
```

---

## 🔧 Troubleshooting Guide

### Problem: Webhook not received

**Check**:
1. Is webhook endpoint registered in Stripe?
2. Is it the correct URL?
3. Is the server running?
4. Can Stripe reach your server? (check firewall)

**Fix**:
```bash
# Test locally with Stripe CLI
stripe listen --forward-to localhost:3001/api/billing/webhook
stripe trigger checkout.session.completed
```

### Problem: Webhook received but plan not updated

**Check**:
1. Is userId in checkout metadata?
2. Is Supabase connected?
3. Are there database errors?

**Fix**:
```bash
# Check logs
tail -f logs/combined.log | grep -i "userId missing\|supabase\|failed"

# Manually fix
node server/fix-subscriber-plan.js <userId> gold
```

### Problem: Webhook signature verification failed

**Check**:
1. Is STRIPE_WEBHOOK_SECRET correct?
2. Is it the right secret for the endpoint?

**Fix**:
```bash
# Get correct secret from Stripe dashboard
# Developers → Webhooks → Your Endpoint → Signing Secret

# Update .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Restart server
npm start
```

---

## 📋 Webhook Configuration Checklist

### Environment Variables (.env):
```
✅ STRIPE_PUBLIC_KEY=pk_...
✅ STRIPE_SECRET_KEY=sk_...
✅ STRIPE_WEBHOOK_SECRET=whsec_...  ← CRITICAL
✅ SUPABASE_URL=...
✅ SUPABASE_SERVICE_ROLE_KEY=...
```

### Stripe Dashboard:
```
✅ Webhooks → Add Endpoint
   ├─ URL: https://your-domain.com/api/billing/webhook
   ├─ Events:
   │  ├─ checkout.session.completed
   │  ├─ customer.subscription.deleted
   │  └─ customer.subscription.updated
   └─ Status: Active
```

### Frontend Code:
```javascript
✅ Checkout session includes userId in metadata
✅ userId is valid UUID format
✅ userId matches authenticated user
```

### Server Code:
```javascript
✅ Webhook handler at /api/billing/webhook
✅ Signature verification enabled
✅ Error logging enabled
✅ Supabase update logic correct
```

---

## 📞 Quick Reference Commands

```bash
# Check subscriber status
node server/check-subscriber.js <userId>

# Fix subscriber plan
node server/fix-subscriber-plan.js <userId> gold

# Watch webhook logs
tail -f logs/combined.log | grep -i webhook

# Test webhook locally
stripe listen --forward-to localhost:3001/api/billing/webhook

# View Stripe events
# https://dashboard.stripe.com/events
```

---

## 🎯 Summary

| Item | Status | Action |
|------|--------|--------|
| Webhook Handler | ✅ Implemented | Monitor logs |
| Enhanced Logging | ✅ Added | Check for errors |
| Verification Scripts | ✅ Created | Use for debugging |
| Fix Scripts | ✅ Created | Use for manual fixes |
| Stripe Config | ⚠️ Verify | Check dashboard |
| Frontend Code | ⚠️ Verify | Check metadata |
| Testing | ⚠️ Recommended | Use Stripe CLI |

---

## 🚀 Next Steps

1. **This Week**:
   - [ ] Verify webhook configuration in Stripe
   - [ ] Test webhook with Stripe CLI
   - [ ] Add webhook event logging to database

2. **Next Week**:
   - [ ] Create webhook monitoring dashboard
   - [ ] Add automated retry logic
   - [ ] Add email alerts on failure

3. **Next Month**:
   - [ ] Review subscription metrics
   - [ ] Optimize webhook handling
   - [ ] Add webhook audit trail

---

**Commit**: `fcaf56b`  
**Files Modified**: `server/index.js`, `SUBSCRIPTION_ISSUE_ANALYSIS.md`  
**Files Created**: `server/check-subscriber.js`, `server/fix-subscriber-plan.js`

