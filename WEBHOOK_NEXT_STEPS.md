# Webhook Debugging - Next Steps

**Date**: October 26, 2025  
**Status**: Enhanced logging deployed and ready for diagnosis

---

## 🎯 Current Situation

✅ **Environment variables**: Set correctly on Render  
✅ **Signature verification**: Fixed (no more 400 errors)  
✅ **Enhanced logging**: Deployed to production  
❌ **Webhook handler**: Still returning 500 error  
✅ **2nd subscriber**: Manually fixed - has gold plan

---

## 📊 What We've Done

1. ✅ Fixed signature verification (moved webhook handler before express.json)
2. ✅ Added detailed error logging to webhook handler
3. ✅ Deployed enhanced logging to production
4. ✅ Created guide to check Render logs

---

## 🔍 What We Need to Do Now

### Step 1: Trigger Webhook (2 min)

Go to Stripe Dashboard:
1. **Developers** → **Webhooks**
2. Find your endpoint: `https://odds-backend-4e9q.onrender.com/api/billing/webhook`
3. Click on it
4. Scroll to "Events" section
5. Find the failed event: `evt_1SMZFWEHk2NK0sdYBczj0Ndj`
6. Click **"Resend"** button

### Step 2: Check Render Logs (2 min)

Go to Render Dashboard:
1. Select service: `vr-sports`
2. Click **"Logs"** tab
3. Look for entries with:
   - `🔵 Webhook endpoint hit`
   - `❌ Webhook handling error`
4. **Copy the error message**

### Step 3: Share the Error (1 min)

Share the error log with me. It will look like:

```
❌ Webhook handling error: {
  message: "...",
  code: "...",
  stack: "..."
}
```

---

## 📋 Expected Error Scenarios

### Scenario 1: Supabase Connection Error
```
❌ Webhook handling error: {
  message: "Cannot connect to database",
  code: "ECONNREFUSED",
  ...
}
```
**Fix**: Check Supabase credentials on Render

### Scenario 2: Stripe API Error
```
❌ Webhook handling error: {
  message: "Invalid API Key provided",
  code: "invalid_request_error",
  ...
}
```
**Fix**: Check STRIPE_SECRET_KEY on Render

### Scenario 3: Missing Metadata
```
❌ userId missing from checkout session metadata
```
**Fix**: Check frontend sends userId in metadata

### Scenario 4: Supabase Update Error
```
❌ Failed to update user plan in Supabase: {
  message: "...",
  code: "...",
  ...
}
```
**Fix**: Check database permissions or table structure

---

## 🔧 Temporary Workaround (Until Fixed)

For any new subscribers, manually set their plan:

```bash
node server/fix-subscriber-plan.js <userId> gold
```

This will:
- ✅ Set plan to gold
- ✅ Set subscription end date
- ✅ Enable all features
- ✅ User can access platform immediately

---

## 📚 Documentation Files

- ✅ `CHECK_RENDER_LOGS.md` - How to view Render logs
- ✅ `WEBHOOK_DIAGNOSIS.md` - Diagnosis report
- ✅ `WEBHOOK_500_ERROR_FIX.md` - Error logging guide
- ✅ `WEBHOOK_SIGNATURE_FIX.md` - Signature verification fix
- ✅ `STRIPE_WEBHOOK_SETUP.md` - Complete setup guide

---

## 🚀 Action Items

**Immediate (Now)**:
1. [ ] Trigger webhook from Stripe dashboard
2. [ ] Check Render logs
3. [ ] Copy error message
4. [ ] Share error with me

**Once I See Error**:
1. [ ] Identify root cause
2. [ ] Apply fix
3. [ ] Test webhook
4. [ ] Verify it works

---

## ✅ Success Criteria

When webhook is working:
- ✅ Webhook returns 200 status
- ✅ Logs show: `✅ Plan set to gold via webhook`
- ✅ User plan automatically set to gold
- ✅ No manual intervention needed

---

## 📞 Summary

**Current Status**:
- ✅ 2nd subscriber has gold plan (manually set)
- ✅ Can use platform immediately
- ✅ Enhanced logging deployed
- 🔍 Waiting for error logs to diagnose

**Next Step**: Check Render logs and share error message

**Commit**: `78b4ae7`

---

## 🎯 Timeline

- **Oct 26, 12:05 PM**: Webhook first failed
- **Oct 26, 12:20 PM**: Signature verification fixed
- **Oct 26, 12:30 PM**: Subscriber manually fixed
- **Oct 26, 12:41 PM**: Enhanced logging deployed
- **Now**: Ready to diagnose with logs

---

**Status**: ✅ Ready for diagnosis - check Render logs!
