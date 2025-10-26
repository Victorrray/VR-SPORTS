# Webhook 500 Error - Diagnosis Report

**Date**: October 26, 2025  
**Subscriber**: Dominique oakman (6ac3f713-3fc6-4889-a1f2-6b894f96f794)  
**Status**: ✅ **MANUALLY FIXED** - Plan set to gold

---

## 📊 Current Situation

### Webhook Flow:
1. ✅ User completes checkout
2. ✅ Stripe processes payment successfully
3. ✅ Stripe sends webhook event
4. ✅ Signature verification passes (no more 400 error)
5. ❌ Webhook handler returns 500 error
6. ✅ **WORKAROUND**: Manually set plan to gold

### Subscriber Status:
```
✅ Plan: gold
✅ Subscription End: 2025-11-25
✅ Status: ACTIVE
✅ Can access all features
```

---

## 🔍 What's Failing

The webhook handler is catching an error but we can't see the details because:
1. Production logs are on Render (not accessible locally)
2. The enhanced error logging isn't showing up in our local logs
3. The 500 response doesn't include error details

---

## 🎯 Likely Root Causes

### Most Likely (80% probability):
**Supabase Connection Issue**
- SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set on Render
- Supabase connection timeout
- Database table permissions issue

**How to verify**:
```bash
# Check Render environment variables
# Go to: Render Dashboard → Your Service → Environment
# Look for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

### Possible (15% probability):
**Stripe API Issue**
- Invalid Stripe secret key on Render
- Stripe subscription retrieval failing
- Rate limiting from Stripe

**How to verify**:
```bash
# Check Stripe keys on Render
# Go to: Render Dashboard → Your Service → Environment
# Look for STRIPE_SECRET_KEY
```

### Unlikely (5% probability):
**Other Issue**
- Node.js version incompatibility
- Missing dependency
- Middleware issue

---

## ✅ Immediate Action Taken

**Manually set subscriber's plan to gold**:
```bash
node server/fix-subscriber-plan.js 6ac3f713-3fc6-4889-a1f2-6b894f96f794 gold
```

**Result**:
- ✅ Plan: gold
- ✅ Subscription End: 2025-11-25
- ✅ User can access all features

---

## 🔧 How to Fix the Webhook

### Step 1: Verify Environment Variables on Render

Go to: `https://dashboard.render.com`
1. Select your service: `vr-sports`
2. Click "Environment"
3. Verify these are set:
   - ✅ STRIPE_SECRET_KEY (starts with `sk_live_`)
   - ✅ STRIPE_WEBHOOK_SECRET (starts with `whsec_`)
   - ✅ SUPABASE_URL (https://xxxxx.supabase.co)
   - ✅ SUPABASE_SERVICE_ROLE_KEY (long string)

### Step 2: If Missing, Add Them

1. Click "Add Environment Variable"
2. Add each missing variable
3. Click "Deploy" to redeploy with new variables

### Step 3: Test the Webhook

```bash
# Local test
stripe listen --forward-to localhost:3001/api/billing/webhook
stripe trigger checkout.session.completed
```

### Step 4: Check Render Logs

1. Go to Render Dashboard
2. Select your service
3. Click "Logs"
4. Look for webhook error messages

---

## 📋 Webhook Debugging Checklist

- [ ] Verify STRIPE_SECRET_KEY on Render
- [ ] Verify STRIPE_WEBHOOK_SECRET on Render
- [ ] Verify SUPABASE_URL on Render
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY on Render
- [ ] Check Render logs for error messages
- [ ] Test webhook locally with Stripe CLI
- [ ] Verify Stripe webhook endpoint is active
- [ ] Check Stripe event delivery logs

---

## 🚀 For Future Subscribers

**Temporary Workaround** (until webhook is fixed):
```bash
# Manually set plan to gold
node server/fix-subscriber-plan.js <userId> gold
```

**Permanent Solution**:
Fix the webhook by verifying environment variables on Render (see Step 1 above)

---

## 📞 Next Steps

1. **Check Render environment variables** (5 min)
2. **Add any missing variables** (5 min)
3. **Test webhook locally** (5 min)
4. **Check Render logs** (5 min)
5. **Report findings** so we can fix the root cause

---

## ✅ Summary

- ✅ 2nd subscriber (Dominique oakman) has gold plan
- ✅ Can access all features
- ✅ Subscription valid until Nov 25, 2025
- ⚠️ Webhook still failing - needs environment variable verification
- 🔧 Temporary workaround: manually set plan using fix script

**Status**: Subscriber is ready to use! Webhook fix needed for automation.
