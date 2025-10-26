# Stripe Webhook Setup - Complete Step-by-Step Guide

**Goal**: Ensure that when users complete checkout, their plan is automatically set to "gold" in the database.

**Urgency**: HIGH - Your 2nd subscriber needs this working!

---

## 📋 Overview

The webhook flow:
```
User Completes Checkout
         ↓
Stripe Sends Event to Your Server
         ↓
Your Server Verifies Signature
         ↓
Your Server Updates Database
         ↓
✅ User Has Gold Plan
```

---

## ✅ STEP 1: Get Your Stripe Keys

### 1.1 Go to Stripe Dashboard
```
https://dashboard.stripe.com
```

### 1.2 Navigate to API Keys
```
Developers (top right) → API Keys
```

You'll see:
- **Publishable Key** (starts with `pk_`)
- **Secret Key** (starts with `sk_`)

### 1.3 Copy Your Keys
```
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

### 1.4 Add to Your `.env` File
```bash
# In /Users/victorray/Desktop/vr-odds/.env
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

**⚠️ IMPORTANT**: Keep `STRIPE_SECRET_KEY` secret! Never commit it to git.

---

## ✅ STEP 2: Create Webhook Endpoint

### 2.1 Go to Webhooks Section
```
Stripe Dashboard → Developers → Webhooks
```

### 2.2 Click "Add Endpoint"

### 2.3 Enter Your Webhook URL

**For Production (Render)**:
```
https://odds-backend-4e9q.onrender.com/api/billing/webhook
```

**For Local Testing** (we'll do this later):
```
http://localhost:3001/api/billing/webhook
```

### 2.4 Select Events to Listen For

Click "Select events" and choose:
- ✅ `checkout.session.completed` (when user completes checkout)
- ✅ `customer.subscription.deleted` (when user cancels)
- ✅ `customer.subscription.updated` (when subscription changes)

### 2.5 Create Endpoint

Click "Add Endpoint" button.

---

## ✅ STEP 3: Get Your Webhook Secret

### 3.1 View Your Webhook
```
Stripe Dashboard → Developers → Webhooks → Click Your Endpoint
```

### 3.2 Copy the Signing Secret
```
Signing secret: whsec_xxxxxxxxxxxxx
```

### 3.3 Add to `.env`
```bash
# In /Users/victorray/Desktop/vr-odds/.env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**⚠️ IMPORTANT**: This must match exactly!

---

## ✅ STEP 4: Verify Frontend Sends userId

### 4.1 Find Checkout Code
Search for where you create the Stripe checkout session.

### 4.2 Verify userId is in Metadata

**Correct Code** ✅:
```javascript
const session = await stripe.redirectToCheckout({
  sessionId: checkoutSession.id,
  metadata: {
    userId: user.id  // ← CRITICAL: Must be here
  }
});
```

**Wrong Code** ❌:
```javascript
const session = await stripe.redirectToCheckout({
  sessionId: checkoutSession.id
  // ← Missing metadata!
});
```

### 4.3 If Missing, Add It

Find the checkout creation code and add `metadata: { userId: user.id }`.

---

## ✅ STEP 5: Verify Server Configuration

### 5.1 Check Environment Variables

```bash
cd /Users/victorray/Desktop/vr-odds
echo "STRIPE_PUBLIC_KEY=$STRIPE_PUBLIC_KEY"
echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
```

All three should show values (not empty).

### 5.2 Check Server Code

The webhook handler is at: `server/index.js` lines 1906-1996

It should:
1. ✅ Verify webhook signature
2. ✅ Extract userId from metadata
3. ✅ Get subscription from Stripe
4. ✅ Update database with plan='gold'

**Current code is correct** ✅

---

## ✅ STEP 6: Test Locally with Stripe CLI

### 6.1 Install Stripe CLI

**Mac**:
```bash
brew install stripe/stripe-cli/stripe
```

**Linux**:
```bash
curl https://files.stripe.com/stripe-cli/install.sh -o install.sh && bash install.sh
```

**Windows**:
```
Download from: https://github.com/stripe/stripe-cli/releases
```

### 6.2 Authenticate Stripe CLI

```bash
stripe login
```

This will:
1. Open browser
2. Ask you to authorize
3. Give you a restricted API key for local testing

### 6.3 Start Webhook Forwarding

In one terminal:
```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

You'll see:
```
> Ready! Your webhook signing secret is: whsec_test_xxxxxxxxxxxxx
```

**Save this secret!** You'll use it for local testing.

### 6.4 Start Your Server

In another terminal:
```bash
cd /Users/victorray/Desktop/vr-odds
npm start
```

### 6.5 Trigger a Test Webhook

In a third terminal:
```bash
stripe trigger checkout.session.completed
```

### 6.6 Check the Logs

Watch your server logs for:
```
📨 Webhook received: checkout.session.completed
🔍 Processing checkout.session.completed:
💳 Subscription retrieved:
✅ Plan set to gold via webhook: <userId>
```

If you see these, the webhook is working! ✅

---

## ✅ STEP 7: Test with Real Checkout

### 7.1 Create a Test Product

```
Stripe Dashboard → Products → Add Product
Name: Test Gold Plan
Price: $10
```

### 7.2 Create Checkout Session

Use your frontend to start a checkout with a test card:
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

### 7.3 Complete Checkout

Click "Pay" button.

### 7.4 Check Logs

You should see webhook logs in your terminal.

### 7.5 Verify in Database

```bash
node server/check-subscriber.js <userId>
```

Should show:
```
Plan: gold
Subscription valid for 31 more days
```

---

## ✅ STEP 8: Deploy to Production

### 8.1 Update Environment Variables on Render

```
Render Dashboard → Your Service → Environment
```

Add/Update:
```
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 8.2 Verify Webhook URL

```
Stripe Dashboard → Developers → Webhooks → Your Endpoint
```

Should show:
```
URL: https://odds-backend-4e9q.onrender.com/api/billing/webhook
Status: ✅ Active
```

### 8.3 Test with Real Checkout

Have your 2nd subscriber complete checkout.

### 8.4 Verify Plan Was Set

```bash
node server/check-subscriber.js <userId>
```

Should show:
```
✅ GOLD PLAN - Correctly assigned!
✅ Full access to odds data
✅ API requests enabled
✅ Subscription valid for 31 more days
```

---

## 🔍 TROUBLESHOOTING

### Problem: Webhook Not Received

**Check 1: Is endpoint registered?**
```
Stripe Dashboard → Developers → Webhooks
Look for your endpoint URL
```

**Check 2: Is URL correct?**
```
Should be: https://odds-backend-4e9q.onrender.com/api/billing/webhook
```

**Check 3: Is server running?**
```
Check Render dashboard for errors
```

**Check 4: Can Stripe reach your server?**
```
Stripe Dashboard → Developers → Webhooks → Your Endpoint → Events
Look for "Failed" events
Click to see error details
```

### Problem: Webhook Received But Plan Not Updated

**Check 1: Is userId in metadata?**
```javascript
// Should have:
metadata: { userId: user.id }
```

**Check 2: Check server logs**
```bash
tail -f logs/combined.log | grep -i "webhook\|plan\|sentry"
```

**Check 3: Is Supabase connected?**
```bash
# Check .env
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Check 4: Manually verify**
```bash
node server/check-subscriber.js <userId>
```

### Problem: Webhook Signature Verification Failed

**Check 1: Is secret correct?**
```bash
# Local testing:
stripe listen --forward-to localhost:3001/api/billing/webhook
# Copy the signing secret shown

# Production:
Stripe Dashboard → Developers → Webhooks → Your Endpoint → Signing Secret
# Copy this secret to .env
```

**Check 2: Restart server after updating secret**
```bash
npm start
```

---

## 📊 Webhook Event Flow (with Logging)

When user completes checkout:

```
1. User clicks "Pay" button
   ↓
2. Stripe processes payment
   ↓
3. Stripe sends webhook event to your server
   📨 Webhook received: checkout.session.completed
   ↓
4. Server verifies webhook signature
   ✅ Signature verified
   ↓
5. Server extracts userId from metadata
   🔍 Processing checkout.session.completed:
      - userId: 598347f4-66a9-447d-9421-0523eeb1dc94
   ↓
6. Server gets subscription from Stripe
   💳 Subscription retrieved:
      - subscriptionId: sub_xxxxx
      - status: active
   ↓
7. Server updates database
   UPDATE users SET plan='gold' WHERE id=userId
   ↓
8. ✅ User now has gold plan!
   ✅ Plan set to gold via webhook: 598347f4-66a9-447d-9421-0523eeb1dc94
```

---

## 📋 Checklist Before Going Live

- [ ] **Stripe Keys Added**
  - [ ] STRIPE_PUBLIC_KEY in .env
  - [ ] STRIPE_SECRET_KEY in .env
  - [ ] Keys are from production (pk_live_, sk_live_)

- [ ] **Webhook Configured**
  - [ ] Endpoint registered in Stripe
  - [ ] URL is correct: https://odds-backend-4e9q.onrender.com/api/billing/webhook
  - [ ] Events selected: checkout.session.completed, customer.subscription.deleted, customer.subscription.updated
  - [ ] Status shows "Active"

- [ ] **Webhook Secret Added**
  - [ ] STRIPE_WEBHOOK_SECRET in .env
  - [ ] Secret matches Stripe dashboard
  - [ ] Server restarted after adding secret

- [ ] **Frontend Code**
  - [ ] Checkout includes metadata: { userId: user.id }
  - [ ] userId is valid UUID format
  - [ ] userId matches authenticated user

- [ ] **Server Code**
  - [ ] Webhook handler exists at /api/billing/webhook
  - [ ] Signature verification enabled
  - [ ] Error logging enabled
  - [ ] Database update logic correct

- [ ] **Environment Variables on Render**
  - [ ] STRIPE_PUBLIC_KEY set
  - [ ] STRIPE_SECRET_KEY set
  - [ ] STRIPE_WEBHOOK_SECRET set
  - [ ] SUPABASE_URL set
  - [ ] SUPABASE_SERVICE_ROLE_KEY set

- [ ] **Testing**
  - [ ] Tested locally with Stripe CLI
  - [ ] Tested with real checkout
  - [ ] Verified plan was set in database
  - [ ] Checked logs for errors

---

## 🚀 Quick Commands

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

## 📞 Support

If webhook still doesn't work after following these steps:

1. **Check Stripe Dashboard**
   ```
   Developers → Webhooks → Your Endpoint → Events
   ```
   Look for the event and see if it shows "Delivered" or "Failed"

2. **Check Server Logs**
   ```bash
   tail -f logs/combined.log | grep -i "webhook\|error"
   ```

3. **Manually Fix (Temporary)**
   ```bash
   node server/fix-subscriber-plan.js <userId> gold
   ```

4. **Debug with Stripe CLI**
   ```bash
   stripe logs tail
   ```

---

## ✅ Success Indicators

When webhook is working correctly, you should see:

✅ User completes checkout  
✅ Webhook event appears in Stripe dashboard within 5 seconds  
✅ Server logs show "Plan set to gold via webhook"  
✅ Database shows plan='gold' for user  
✅ User can access all features  

---

**Commit**: Ready to deploy  
**Status**: Follow these steps to ensure 2nd subscriber gets plan correctly!
