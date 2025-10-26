# How to Check Render Logs for Webhook Errors

**Status**: Enhanced logging deployed to production  
**Commit**: `592db3b`

---

## 🔍 Enhanced Logging Added

The webhook handler now logs:
1. ✅ Entry point: `🔵 Webhook endpoint hit`
2. ✅ Supabase update: `🔍 About to update Supabase`
3. ✅ Error details: Full error object with message, code, and stack

---

## 📋 How to View Render Logs

### Option 1: Render Dashboard (Easiest)

1. Go to: `https://dashboard.render.com`
2. Select service: `vr-sports`
3. Click "Logs" tab
4. Look for recent entries with:
   - `🔵 Webhook endpoint hit`
   - `🔍 About to update Supabase`
   - `❌ Webhook handling error`

### Option 2: Render CLI

```bash
# Install Render CLI (if not already installed)
npm install -g @render-com/cli

# Login to Render
render login

# View logs for your service
render logs --service vr-sports --tail
```

### Option 3: SSH into Render

```bash
# Get SSH connection string from Render dashboard
# Then SSH in and check logs
ssh render-user@your-service.onrender.com
tail -f logs/combined.log | grep -i webhook
```

---

## 🎯 What to Look For

### Success Logs (If working):
```
🔵 Webhook endpoint hit: { path: '/api/billing/webhook', method: 'POST', hasBody: true }
📨 Webhook received: checkout.session.completed
🔍 Processing checkout.session.completed: { sessionId: '...', userId: '...', hasSubscription: true, supabaseConnected: true }
🔍 About to update Supabase for user: 6ac3f713-3fc6-4889-a1f2-6b894f96f794
✅ Plan set to gold via webhook: 6ac3f713-3fc6-4889-a1f2-6b894f96f794
```

### Error Logs (If failing):

**If Stripe fails**:
```
❌ Webhook handling error: {
  message: "Invalid API Key provided",
  code: "invalid_request_error",
  stack: "..."
}
```

**If Supabase fails**:
```
❌ Webhook handling error: {
  message: "Cannot connect to database",
  code: "ECONNREFUSED",
  stack: "..."
}
```

**If userId is missing**:
```
❌ userId missing from checkout session metadata
```

**If Supabase not connected**:
```
❌ Supabase not configured
```

---

## 🔧 Troubleshooting Based on Logs

### If you see: "Cannot connect to database"
**Problem**: Supabase connection failing  
**Solution**:
1. Check SUPABASE_URL on Render
2. Check SUPABASE_SERVICE_ROLE_KEY on Render
3. Verify Supabase project is active
4. Check Supabase network access settings

### If you see: "Invalid API Key"
**Problem**: Stripe key is wrong  
**Solution**:
1. Check STRIPE_SECRET_KEY on Render (should start with `sk_live_`)
2. Verify it matches your Stripe dashboard
3. Redeploy after fixing

### If you see: "userId missing"
**Problem**: Frontend not sending userId in metadata  
**Solution**:
1. Check frontend checkout code
2. Verify metadata includes `userId: user.id`
3. Redeploy frontend

### If webhook endpoint is not being hit
**Problem**: Webhook URL might be wrong in Stripe  
**Solution**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Verify endpoint URL: `https://odds-backend-4e9q.onrender.com/api/billing/webhook`
3. Check endpoint status is "Active"

---

## 📊 Steps to Diagnose

1. **Trigger webhook manually** (from Stripe dashboard)
   - Go to: Stripe Dashboard → Developers → Webhooks → Your Endpoint
   - Click "Send test event"
   - Select "checkout.session.completed"

2. **Check Render logs immediately after**
   - Look for `🔵 Webhook endpoint hit`
   - Look for error messages

3. **Share the logs** with me so I can identify the issue

---

## 🚀 Next Steps

1. **Check Render logs** using one of the methods above
2. **Look for error messages** matching the patterns above
3. **Share the error log** with me
4. **I'll identify and fix** the root cause

---

## 📞 Quick Reference

```bash
# Check if webhook is being called
grep "Webhook endpoint hit" logs/combined.log

# Check for errors
grep "Webhook handling error" logs/combined.log

# Check Supabase updates
grep "About to update Supabase" logs/combined.log

# Get last 50 lines of webhook activity
grep -i webhook logs/combined.log | tail -50
```

---

## ✅ Summary

- ✅ Enhanced logging deployed
- ✅ Webhook handler now logs entry point
- ✅ Supabase update now logged
- ✅ Error details now fully logged
- 🔍 **Next**: Check Render logs and share error details

**Commit**: `592db3b`  
**Status**: Ready to diagnose!
