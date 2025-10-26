# Stripe Webhook Verification Checklist - For 2nd Subscriber

**Goal**: Ensure your 2nd subscriber gets their gold plan automatically after checkout.

**Urgency**: HIGH - Do this BEFORE they complete checkout!

---

## ✅ STEP 1: Verify Environment Variables (5 min)

### Check Your `.env` File

```bash
# Open your .env file
cat /Users/victorray/Desktop/vr-odds/.env
```

You should see:
```
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxx
```

### ✅ Checklist:
- [ ] STRIPE_PUBLIC_KEY present (starts with `pk_`)
- [ ] STRIPE_SECRET_KEY present (starts with `sk_`)
- [ ] STRIPE_WEBHOOK_SECRET present (starts with `whsec_`)
- [ ] SUPABASE_URL present
- [ ] SUPABASE_SERVICE_ROLE_KEY present

**If any are missing**: Add them from your Stripe dashboard and Supabase console.

---

## ✅ STEP 2: Verify Stripe Webhook Configuration (5 min)

### Go to Stripe Dashboard

```
https://dashboard.stripe.com/webhooks
```

### Check Your Webhook Endpoint

Look for: `https://odds-backend-4e9q.onrender.com/api/billing/webhook`

**Verify**:
- [ ] URL is correct
- [ ] Status shows "Active" (green checkmark)
- [ ] Events include:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.deleted`
  - [ ] `customer.subscription.updated`

### Get Your Signing Secret

```
Click on your endpoint → Signing Secret → Copy
```

**Verify**:
- [ ] Secret starts with `whsec_`
- [ ] Secret matches your `.env` file

---

## ✅ STEP 3: Verify Frontend Code (5 min)

### Find Checkout Code

Search for where you create Stripe checkout sessions.

**Look for**:
```javascript
const session = await stripe.redirectToCheckout({
  sessionId: checkoutSession.id,
  metadata: {
    userId: user.id  // ← CRITICAL: Must be here
  }
});
```

**Verify**:
- [ ] `metadata` object exists
- [ ] `userId` is included in metadata
- [ ] `userId` is a valid UUID format

---

## ✅ STEP 4: Verify Server Code (5 min)

### Check Webhook Handler

File: `/Users/victorray/Desktop/vr-odds/server/index.js` lines 1906-1996

**Verify**:
- [ ] Webhook handler exists at `/api/billing/webhook`
- [ ] Signature verification enabled
- [ ] Extracts `userId` from metadata
- [ ] Updates database with `plan='gold'`
- [ ] Logs success message

---

## ✅ STEP 5: Test Locally (10 min)

### Start Stripe CLI

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

You'll see:
```
> Ready! Your webhook signing secret is: whsec_test_xxxxxxxxxxxxx
```

### In Another Terminal, Start Your Server

```bash
cd /Users/victorray/Desktop/vr-odds
npm start
```

### In Another Terminal, Trigger Test Event

```bash
stripe trigger checkout.session.completed
```

### Check Logs

You should see:
```
📨 Webhook received: checkout.session.completed
🔍 Processing checkout.session.completed:
💳 Subscription retrieved:
✅ Plan set to gold via webhook: <userId>
```

**Verify**:
- [ ] Webhook received message appears
- [ ] No errors in logs
- [ ] Plan set to gold message appears

---

## ✅ STEP 6: Verify Production Configuration (5 min)

### Check Render Environment Variables

```
Render Dashboard → Your Service → Environment
```

**Verify all are set**:
- [ ] STRIPE_PUBLIC_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY

---

## ✅ STEP 7: Test with Real Checkout (10 min)

### Create Test Checkout

1. Go to your app
2. Click "Upgrade to Gold" or similar
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `12/25`
5. CVC: `123`
6. Click "Pay"

### Verify in Database

```bash
# Get the test user ID from your app
node server/check-subscriber.js <test-userId>
```

**Should show**:
```
✅ GOLD PLAN - Correctly assigned!
✅ Full access to odds data
✅ API requests enabled
✅ Subscription valid for 31 more days
```

**Verify**:
- [ ] Plan shows "gold"
- [ ] Subscription end date is set
- [ ] Status shows "ACTIVE"

---

## 🚨 TROUBLESHOOTING

### Problem: Webhook Not Received

**Check**:
1. Is Stripe webhook endpoint registered?
   ```
   Stripe Dashboard → Developers → Webhooks
   ```

2. Is URL correct?
   ```
   https://odds-backend-4e9q.onrender.com/api/billing/webhook
   ```

3. Is server running?
   ```
   Check Render dashboard
   ```

**Fix**:
- Re-register endpoint if needed
- Restart server after adding environment variables

### Problem: Webhook Received But Plan Not Updated

**Check**:
1. Are logs showing errors?
   ```bash
   tail -f logs/combined.log | grep -i "webhook\|error"
   ```

2. Is userId in metadata?
   ```javascript
   // Should have: metadata: { userId: user.id }
   ```

3. Is Supabase connected?
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

**Fix**:
- Check frontend code for metadata
- Verify Supabase environment variables
- Manually fix if needed:
  ```bash
  node server/fix-subscriber-plan.js <userId> gold
  ```

### Problem: Signature Verification Failed

**Check**:
1. Is webhook secret correct?
   ```
   Stripe Dashboard → Developers → Webhooks → Your Endpoint → Signing Secret
   ```

2. Does it match `.env`?
   ```bash
   grep STRIPE_WEBHOOK_SECRET /Users/victorray/Desktop/vr-odds/.env
   ```

**Fix**:
- Copy correct secret from Stripe
- Update `.env` file
- Restart server

---

## 📋 Pre-Checkout Verification

Before your 2nd subscriber completes checkout:

- [ ] All environment variables set
- [ ] Webhook endpoint registered and active
- [ ] Frontend includes userId in metadata
- [ ] Server code verified
- [ ] Local testing successful
- [ ] Production environment variables set
- [ ] Test checkout successful

---

## 🎯 What Should Happen

1. **User clicks "Upgrade to Gold"**
   - Redirected to Stripe checkout

2. **User completes payment**
   - Stripe processes payment

3. **Stripe sends webhook** (within 5 seconds)
   - Server receives event
   - Logs: "📨 Webhook received: checkout.session.completed"

4. **Server processes webhook**
   - Extracts userId from metadata
   - Gets subscription from Stripe
   - Updates database: `plan='gold'`
   - Logs: "✅ Plan set to gold via webhook"

5. **User has gold plan**
   - Can access all features
   - Full API access
   - Subscription valid for 30 days

---

## 📞 Quick Commands

```bash
# Check subscriber plan
node server/check-subscriber.js <userId>

# Fix subscriber plan (if needed)
node server/fix-subscriber-plan.js <userId> gold

# Watch webhook logs
tail -f logs/combined.log | grep -i webhook

# Test webhook locally
stripe listen --forward-to localhost:3001/api/billing/webhook

# View Stripe events
# https://dashboard.stripe.com/events
```

---

## ✅ Final Checklist Before 2nd Subscriber Checks Out

- [ ] Environment variables verified
- [ ] Stripe webhook endpoint active
- [ ] Frontend code includes userId in metadata
- [ ] Server code verified
- [ ] Local test successful
- [ ] Production environment variables set
- [ ] Test checkout successful
- [ ] Database shows plan='gold' for test user
- [ ] Ready for real subscriber!

---

**Commit**: `acbfded`  
**Status**: Ready to process 2nd subscriber's payment! 🚀
