# Database Error Saving New User - Complete Solution

## Problem Summary

The VR-Odds platform was experiencing "Database error saving new user" issues due to **conflicting database triggers and functions** that were trying to handle new user creation in different ways.

## Root Causes Identified

### 1. Multiple Conflicting Triggers
- `COMPLETE_NEW_USER_FIX.sql` created `on_auth_user_created_complete` trigger
- `UPDATED_GOLD_SCHEMA.sql` created `on_auth_user_created` trigger  
- Both tried to handle the same `AFTER INSERT ON auth.users` event
- This caused conflicts and duplicate execution attempts

### 2. Inconsistent Plan Constraints
- Some migrations expected `plan IN ('gold')` only
- Others expected `plan IN ('gold', 'platinum')` or `plan IS NULL`
- Server's `getUserProfile` function tried to insert with `plan: null` but constraints rejected it

### 3. Missing Profiles Table Integration
- Server's `getUserProfile` function only handled the `users` table
- Database triggers also tried to create `profiles` records
- This caused foreign key or constraint violations

## Complete Solution

### Step 1: Apply Database Fix

Run the `DATABASE_FIX_NEW_USERS.sql` file in your Supabase SQL editor. This script:

✅ **Cleans up all conflicting triggers and functions**
- Removes duplicate triggers: `on_auth_user_created`, `on_auth_user_created_complete`, etc.
- Removes conflicting functions: `handle_new_user()`, `handle_new_user_complete()`, etc.

✅ **Creates unified user creation system**
- Single trigger: `on_auth_user_created_unified`
- Single function: `handle_new_user_unified()`
- Handles both `users` and `profiles` table creation

✅ **Fixes plan constraints**
- Allows `plan IN ('gold', 'platinum') OR plan IS NULL`
- New users get `plan = NULL` (must subscribe)
- Existing users remain grandfathered

✅ **Ensures proper table structure**
- Both `users` and `profiles` tables with correct columns
- Proper RLS policies and permissions
- Username validation and availability checking

### Step 2: Server Code Updates

The server code has been updated with better error handling:

```javascript
// Enhanced getUserProfile function with:
- Better error logging and messages
- Fallback manual user creation if triggers fail
- Proper error propagation with descriptive messages
- Includes all required fields (grandfathered, timestamps)
```

### Step 3: Testing

Use the `test_database_fix.js` script to verify everything works:

```bash
cd /Users/victorray/Desktop/vr-odds
node test_database_fix.js
```

## New User Flow (After Fix)

1. **User Signs Up**: Creates record in `auth.users` table
2. **Database Trigger Fires**: `on_auth_user_created_unified` executes
3. **Users Record Created**: `plan = NULL, grandfathered = FALSE`
4. **Profile Record Created**: Empty profile for username setting
5. **Server Access**: `getUserProfile()` finds existing user record
6. **Subscription Required**: User must subscribe to Gold/Platinum for API access

## Plan System

- **New Users**: `plan = NULL` (must subscribe)
- **Grandfathered Users**: `plan = 'gold'` + `grandfathered = TRUE`
- **Active Subscribers**: `plan = 'gold'` or `'platinum'` with subscription dates
- **Expired Subscriptions**: Automatically reset to `plan = NULL`

## Verification Checklist

After applying the fix, verify:

- [ ] Database triggers exist and are unique
- [ ] Plan constraints allow NULL values
- [ ] Both users and profiles tables exist
- [ ] Username validation functions work
- [ ] New user signup creates both records
- [ ] Server logs show successful user creation
- [ ] No more "Database error saving new user" messages

## Monitoring

Watch for these log messages:

✅ **Good**: `✅ Created user manually (trigger should have done this)`
❌ **Bad**: `❌ User not found in users table - database trigger may not be working`

If you see the bad message, the database triggers aren't working and need to be reapplied.

## Support

If issues persist:

1. Check Supabase logs for trigger execution errors
2. Verify all environment variables are set
3. Ensure RLS policies allow user creation
4. Test with the provided test script
5. Check server logs for detailed error messages

The fix addresses all known causes of the database error and provides comprehensive error handling and logging for future debugging.
