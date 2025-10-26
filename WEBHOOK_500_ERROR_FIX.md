# Webhook 500 Error - Diagnosis & Fix

## 🔴 Current Issue

**Error**: `HTTP 500 - Webhook handler failed`

**What's happening**:
1. ✅ Signature verification now works (no more 400 error)
2. ✅ Webhook is being received correctly
3. ❌ Something inside the handler is throwing an error
4. ❌ Error is being caught but not giving us details

## 🔍 Root Cause

The webhook handler is catching errors but not logging them with enough detail. We need to know:
- Is Stripe subscription retrieval failing?
- Is Supabase update failing?
- What's the exact error message?

## ✅ Solution

I've created an enhanced webhook handler with **detailed error logging** at:
```
/Users/victorray/Desktop/vr-odds/server/webhook-handler-fixed.js
```

### Key Improvements:

1. **Better Stripe error logging**:
   ```javascript
   try {
     subscription = await stripe.subscriptions.retrieve(session.subscription);
   } catch (stripeError) {
     console.error('❌ Failed to retrieve subscription from Stripe:', {
       message: stripeError.message,
       code: stripeError.code,
       type: stripeError.type,
       subscriptionId: session.subscription
     });
     return res.status(500).json({ error: 'Failed to retrieve subscription' });
   }
   ```

2. **Better Supabase error logging**:
   ```javascript
   if (error) {
     console.error('❌ Failed to update user plan in Supabase:', {
       message: error.message,
       code: error.code,
       userId: userId
     });
     return res.status(500).json({ error: 'Failed to update user plan' });
   }
   ```

3. **Better catch block**:
   ```javascript
   catch (error) {
     console.error('❌ Webhook handling error:', {
       message: error.message,
       code: error.code,
       stack: error.stack
     });
     res.status(500).json({ error: 'Webhook handler failed', detail: error.message });
   }
   ```

## 🚀 How to Apply the Fix

### Option 1: Manual Copy-Paste (Recommended)

1. Open `/Users/victorray/Desktop/vr-odds/server/webhook-handler-fixed.js`
2. Copy the entire webhook handler code
3. Open `/Users/victorray/Desktop/vr-odds/server/index.js`
4. Find lines 42-154 (the webhook handler)
5. Replace with the fixed version
6. Save and commit

### Option 2: Use the File Directly

```bash
cd /Users/victorray/Desktop/vr-odds/server
# Backup original
cp index.js index.js.backup

# Replace webhook handler (lines 42-154) with content from webhook-handler-fixed.js
```

## 📊 What the Enhanced Logging Will Show

After applying the fix, when the webhook fails, you'll see logs like:

**If Stripe fails**:
```
❌ Failed to retrieve subscription from Stripe: {
  message: "Invalid API Key provided",
  code: "invalid_request_error",
  type: "invalid_request_error",
  subscriptionId: "sub_1SMZFUEHk2NK0sdYmbmQ0Zo5"
}
```

**If Supabase fails**:
```
❌ Failed to update user plan in Supabase: {
  message: "Invalid user ID format",
  code: "PGRST116",
  userId: "6ac3f713-3fc6-4889-a1f2-6b894f96f794"
}
```

**If something else fails**:
```
❌ Webhook handling error: {
  message: "Cannot read property 'customer' of undefined",
  code: undefined,
  stack: "at ... (line numbers)"
}
```

## 🎯 Next Steps

1. **Apply the fix** using Option 1 or 2 above
2. **Commit the changes**:
   ```bash
   git add server/index.js
   git commit -m "Enhance webhook error logging for better diagnostics"
   git push
   ```
3. **Test with Stripe CLI**:
   ```bash
   stripe listen --forward-to localhost:3001/api/billing/webhook
   stripe trigger checkout.session.completed
   ```
4. **Check logs** for detailed error messages
5. **Share the error logs** with me so we can fix the actual issue

## 📝 Common Issues & Solutions

### Issue 1: "Invalid API Key provided"
**Cause**: STRIPE_SECRET_KEY is wrong or not set  
**Fix**: Verify `STRIPE_SECRET_KEY` in `.env`

### Issue 2: "Invalid user ID format"
**Cause**: userId in metadata is not a valid UUID  
**Fix**: Check that frontend is sending valid UUID in metadata

### Issue 3: "Cannot read property 'customer' of undefined"
**Cause**: Subscription object is missing customer field  
**Fix**: Verify Stripe subscription is valid

### Issue 4: Supabase connection error
**Cause**: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set  
**Fix**: Verify Supabase credentials in `.env`

## 🔗 Files

- **Fixed handler**: `/Users/victorray/Desktop/vr-odds/server/webhook-handler-fixed.js`
- **Original**: `/Users/victorray/Desktop/vr-odds/server/index.js` (lines 42-154)

## ✅ Once Fixed

After you apply the enhanced logging and test:
1. Share the error logs with me
2. I'll identify the exact issue
3. We'll fix it
4. Your 2nd subscriber will get their gold plan automatically! 🎉

---

**Status**: Ready to diagnose - apply the fix and run the test!
