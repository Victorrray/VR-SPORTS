# Gifted Premium Membership Guide

## Overview
This feature allows you to gift Platinum memberships to selected users. When a user logs in with a gifted membership, they'll see a beautiful notification informing them of their upgrade.

## Setup Instructions

### 1. Add Database Column
Run the SQL script in your Supabase SQL Editor:
```bash
# File: ADD_GIFTED_PREMIUM_COLUMN.sql
```

This adds the `is_gifted` column to your users table.

### 2. How to Gift Premium to a User

#### Option A: Via Supabase Dashboard
1. Go to your Supabase project
2. Navigate to Table Editor → users
3. Find the user you want to gift premium to
4. Update their row with:
   - `plan` = `platinum`
   - `is_gifted` = `TRUE`
   - `subscription_start_date` = Current date
   - `subscription_end_date` = 30 days from now

#### Option B: Via SQL Query
```sql
UPDATE users 
SET 
  plan = 'platinum',
  is_gifted = TRUE,
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '30 days'
WHERE email = 'user@example.com';
```

#### Option C: Gift to Multiple Users
```sql
UPDATE users 
SET 
  plan = 'platinum',
  is_gifted = TRUE,
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '30 days'
WHERE email IN (
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
);
```

## How It Works

### User Experience Flow
1. **Admin Action**: You update a user's plan to platinum with `is_gifted = TRUE` in Supabase
2. **User Login**: User logs into the platform
3. **Notification Appears**: Beautiful full-screen notification shows:
   - Gift icon with sparkles animation
   - "Premium Membership Gifted!" message
   - List of premium features they now have access to
   - Expiration date (30 days from start)
   - CTA button to start exploring
4. **One-time Display**: Notification only shows once per user (tracked in localStorage)
5. **Premium Access**: User has full platinum features until expiration date

### Notification Features
- ✨ Animated gift icon with pulsing glow effect
- 🎁 Sparkle animations
- 👑 Crown icon with golden gradient
- 📊 Grid of premium features (Unlimited API, Advanced Analytics, etc.)
- 📅 Clear expiration date display
- 🎨 Purple gradient theme matching your brand
- 📱 Fully responsive (mobile & desktop)
- ⚡ Smooth animations and transitions

### Technical Details
- **Detection**: Checks `me.plan === 'platinum' && me.is_gifted === true`
- **Storage**: Uses localStorage key `hasSeenGiftNotification_{userId}`
- **Persistence**: Won't show again even if user logs out/in
- **Reset**: To show notification again, clear localStorage or delete the key

## Managing Gifted Memberships

### Check All Gifted Users
```sql
SELECT 
  email, 
  plan, 
  is_gifted, 
  subscription_start_date, 
  subscription_end_date,
  CASE 
    WHEN subscription_end_date > NOW() THEN 'Active'
    ELSE 'Expired'
  END as status
FROM users 
WHERE is_gifted = TRUE
ORDER BY subscription_end_date DESC;
```

### Extend a Gifted Membership
```sql
UPDATE users 
SET subscription_end_date = subscription_end_date + INTERVAL '30 days'
WHERE email = 'user@example.com' AND is_gifted = TRUE;
```

### Remove Expired Gifted Memberships
```sql
UPDATE users 
SET 
  plan = NULL,
  is_gifted = FALSE
WHERE 
  is_gifted = TRUE 
  AND subscription_end_date < NOW();
```

### Convert Gifted to Paid
If a gifted user decides to subscribe:
```sql
UPDATE users 
SET 
  is_gifted = FALSE,
  subscription_end_date = NOW() + INTERVAL '1 year'
WHERE email = 'user@example.com';
```

## Testing the Notification

### Test Locally
1. Find a test user in your Supabase users table
2. Update their record:
   ```sql
   UPDATE users 
   SET 
     plan = 'platinum',
     is_gifted = TRUE,
     subscription_start_date = NOW(),
     subscription_end_date = NOW() + INTERVAL '30 days'
   WHERE email = 'your-test-email@example.com';
   ```
3. Clear localStorage for that user: `localStorage.removeItem('hasSeenGiftNotification_{userId}')`
4. Log in as that user
5. You should see the notification appear!

### Reset Notification for Testing
To see the notification again:
```javascript
// In browser console
localStorage.removeItem('hasSeenGiftNotification_' + userId);
// Then refresh the page
```

## Customization Options

### Change Gift Duration
In the SQL update, modify the interval:
```sql
subscription_end_date = NOW() + INTERVAL '60 days'  -- 2 months
subscription_end_date = NOW() + INTERVAL '90 days'  -- 3 months
```

### Change Notification Text
Edit `/client/src/components/PremiumGiftNotification.js`:
- Line 52: Main title
- Line 55-57: Description message
- Line 60-75: Feature list
- Line 87: CTA button text

### Change Notification Styling
Edit `/client/src/components/PremiumGiftNotification.css`:
- Colors, gradients, animations
- Mobile responsiveness
- Icon sizes and effects

## Automation Ideas

### Auto-expire Cron Job
Set up a Supabase Edge Function or cron job to automatically expire gifted memberships:
```sql
-- Run daily
UPDATE users 
SET 
  plan = NULL,
  is_gifted = FALSE
WHERE 
  is_gifted = TRUE 
  AND subscription_end_date < NOW();
```

### Welcome Email Integration
When gifting premium, also send a welcome email:
```javascript
// In your backend
await sendEmail({
  to: user.email,
  subject: '🎁 You\'ve Been Gifted Premium!',
  body: 'Congratulations! You now have 30 days of Platinum access...'
});
```

## Troubleshooting

### Notification Not Showing
1. Check user's plan in database: `SELECT plan, is_gifted FROM users WHERE email = 'user@example.com'`
2. Verify both `plan = 'platinum'` AND `is_gifted = TRUE`
3. Check browser console for logs (look for "Gift notification check:")
4. Clear localStorage and try again
5. Ensure user is logged in and `me` data is loaded

### Notification Shows Every Time
- localStorage key might not be saving
- Check browser console for errors
- Verify `user.id` is available when saving to localStorage

### Styling Issues
- Check that CSS file is imported correctly
- Verify no conflicting global styles
- Test on different screen sizes

## Support

If you encounter any issues:
1. Check browser console for error messages
2. Verify database columns exist and have correct values
3. Test with a fresh user account
4. Clear browser cache and localStorage
