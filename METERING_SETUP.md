# API Metering & Subscription Setup Guide

## Overview
This implementation adds per-user API metering and Stripe subscriptions to OddsSightSeer with:
- Free Trial: 1,000 API calls per month
- Platinum: $25/month unlimited access
- Automatic quota enforcement with graceful UI handling

## Environment Variables Required

Add these to your server `.env` file:

```bash
# Existing variables
ODDS_API_KEY=your_odds_api_key_here
SPORTSGAMEODDS_API_KEY=your_sportsgameodds_api_key_here
PORT=10000

# New Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PRICE_PLATINUM=price_your_platinum_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
APP_URL=http://localhost:3000
```

## Stripe Setup Steps

1. **Create Stripe Account** and get your secret key
2. **Create Platinum Product** in Stripe Dashboard:
   - Name: "Platinum Plan"
   - Price: $25/month recurring
   - Copy the Price ID (starts with `price_`)
3. **Setup Webhook Endpoint**:
   - URL: `https://yourdomain.com/api/billing/webhook`
   - Events: `checkout.session.completed`
   - Copy the webhook secret (starts with `whsec_`)

## Database Migration

Run the SQL migration to create the usage tracking table:

```sql
-- See server/migrations/001_user_usage_monthly.sql
-- This creates user_usage_monthly table and adds subscription_plan column
```

## Manual Test Plan

### Test 1: Free Trial Quota Enforcement
```bash
# Set a test user to free trial with 999 calls used
curl -X POST "http://localhost:10000/test/set-usage" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"calls_made": 999}'

# Make first call - should succeed (1000/1000)
curl "http://localhost:10000/api/player-props?sport=americanfootball_nfl&eventId=test-wrapper" \
  -H "x-user-id: test-user"

# Make second call - should return 403 quota exceeded
curl "http://localhost:10000/api/player-props?sport=americanfootball_nfl&eventId=test-wrapper" \
  -H "x-user-id: test-user"
```

### Test 2: Platinum Upgrade Flow
```bash
# Create checkout session
curl -X POST "http://localhost:10000/api/billing/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user"

# Simulate successful payment webhook (in production, Stripe sends this)
curl -X POST "http://localhost:10000/api/billing/webhook" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "client_reference_id": "test-user"
      }
    }
  }'

# Verify user is now platinum and can make unlimited calls
curl "http://localhost:10000/api/usage/me" -H "x-user-id: test-user"
```

### Test 3: Frontend Integration
1. Visit landing page - should show Pricing section
2. Click "Upgrade to Platinum" - should redirect to Stripe Checkout
3. When quota exceeded, should show modal with upgrade option
4. QuotaBadge should display remaining calls for free users

## API Endpoints Added

- `GET /api/usage/me` - Get current user's quota info
- `POST /api/billing/create-checkout-session` - Create Stripe checkout
- `POST /api/billing/webhook` - Handle Stripe webhooks

## Frontend Components Added

- `Pricing.jsx` - Pricing section for landing page
- `QuotaBadge.jsx` - Shows remaining API calls
- `QuotaExceededModal.jsx` - Upgrade prompt when quota exceeded
- `useQuotaHandler.js` - Hook for handling 403 responses

## Protected Routes

All routes that call external APIs now enforce usage limits:
- `/api/odds/*`
- `/api/player-props`
- `/api/sports`
- `/api/events`
- `/api/scores`
- `/api/reactions/*`

## Production Considerations

1. Replace in-memory storage with Supabase/PostgreSQL
2. Add proper user authentication (currently uses `x-user-id` header)
3. Set up Stripe webhook endpoint with HTTPS
4. Configure proper CORS for production domain
5. Add error tracking for failed payments
6. Implement usage analytics and monitoring

## Monthly Reset Logic

Usage automatically resets each month using UTC timezone:
- Period starts: 1st day of month at 00:00:00 UTC
- Period ends: 1st day of next month at 00:00:00 UTC
- Calls reset to 0 when new period begins
