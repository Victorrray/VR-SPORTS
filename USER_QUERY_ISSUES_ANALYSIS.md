# Supabase User Query Issues - Comprehensive Analysis

## Overview
The backend makes several types of user requests to Supabase. This document identifies potential issues and how to diagnose them.

---

## User Query Endpoints

### 1. **GET /api/me** (lines 17-77 in routes/users.js)
**Purpose**: Get user's plan info (public endpoint, no auth required)

**Query Made**:
```javascript
const { data, error } = await supabase
  .from('users')
  .select('plan, api_request_count, grandfathered')
  .eq('id', userId)
  .single();
```

**Potential Issues**:
- ❌ User ID not found → Returns free plan (graceful fallback)
- ❌ Missing columns (plan, api_request_count, grandfathered) → Error
- ❌ RLS policy blocks query → Error
- ❌ Supabase connection unavailable → Returns free plan

**Expected Response**:
```json
{
  "plan": "platinum",
  "remaining": null,
  "limit": null,
  "unlimited": true,
  "used": 0
}
```

---

### 2. **GET /api/me/usage** (lines 83-123 in routes/users.js)
**Purpose**: Get user's quota info (requires authentication)

**Query Made**:
```javascript
const profile = await getUserProfile(userId, supabase, userUsage);
```

**Calls getUserProfile** which:
1. Tries to fetch existing user
2. If not found (PGRST116 error), creates new user with NULL plan
3. Returns user data

**Potential Issues**:
- ❌ Database constraint prevents NULL plan → Error 23514
- ❌ Missing columns → Error 42703
- ❌ RLS policy blocks insert → Error
- ❌ Trigger prevents creation → Error

**Expected Response**:
```json
{
  "id": "user-id",
  "plan": "free",
  "used": 0,
  "quota": 250,
  "source": "live"
}
```

---

### 3. **GET /api/usage/me** (lines 129-181 in routes/users.js)
**Purpose**: Legacy usage endpoint

**Query Made**:
```javascript
const { data: user, error } = await supabase
  .from('users')
  .select('plan')
  .eq('id', userId)
  .single();
```

**Potential Issues**:
- ❌ User not found → Defaults to 'free_trial'
- ❌ Missing plan column → Error
- ❌ RLS policy blocks query → Error

---

### 4. **POST /api/users/plan** (lines 187-227 in routes/users.js)
**Purpose**: Set user plan (for free trial)

**Query Made**:
```javascript
const { error } = await supabase
  .from('users')
  .upsert({ 
    id: userId, 
    plan: 'free_trial',
    updated_at: new Date().toISOString()
  });
```

**Potential Issues**:
- ❌ RLS policy blocks upsert → Error
- ❌ Constraint prevents 'free_trial' value → Error
- ❌ Missing columns → Error

---

### 5. **POST /api/billing/webhook** (lines 115-170 in routes/billing.js)
**Purpose**: Handle Stripe webhook for plan updates

**Query Made**:
```javascript
const { error } = await supabase
  .from('users')
  .update({ 
    plan: planToSet,
    subscription_end_date: subscriptionEndDate.toISOString(),
    grandfathered: false,
    stripe_customer_id: subscription.customer,
    updated_at: new Date().toISOString()
  })
  .eq('id', userId);
```

**Potential Issues**:
- ❌ User not found → Silent failure (no error)
- ❌ RLS policy blocks update → Error
- ❌ Missing columns → Error
- ❌ Constraint on plan values → Error

---

### 6. **POST /api/admin/set-plan** (lines 63-97 in routes/admin.js)
**Purpose**: Admin override to set user plan

**Query Made**:
```javascript
const { error } = await supabase.from("users").update({ plan }).eq("id", userId);
```

**Potential Issues**:
- ❌ User not found → Silent failure
- ❌ RLS policy blocks update → Error
- ❌ Invalid plan value → Constraint error

---

## Critical Database Schema Requirements

### Users Table Must Have:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  plan TEXT,  -- Can be NULL, 'free', 'gold', 'platinum'
  api_request_count INTEGER DEFAULT 0,
  grandfathered BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Critical Constraints to AVOID:
```sql
-- ❌ DON'T DO THIS - prevents new user creation
ALTER TABLE users ADD CONSTRAINT plan_not_null CHECK (plan IS NOT NULL);

-- ❌ DON'T DO THIS - restricts plan values
ALTER TABLE users ADD CONSTRAINT valid_plan CHECK (plan IN ('gold', 'platinum'));

-- ❌ DON'T DO THIS - prevents NULL for new users
ALTER TABLE users ALTER COLUMN plan SET NOT NULL;
```

---

## Common Error Codes

| Error Code | Meaning | Solution |
|-----------|---------|----------|
| PGRST116 | Row not found | Expected when creating new user |
| 23514 | Check constraint violation | Plan constraint too restrictive |
| 42703 | Column doesn't exist | Missing required columns |
| 42P01 | Table doesn't exist | Users table not created |
| 42501 | Permission denied | RLS policy blocks operation |

---

## Diagnostic Steps

### Step 1: Check Table Schema
Run in Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

**Expected Output**:
- id (uuid, not null)
- plan (text, nullable)
- api_request_count (integer, nullable)
- grandfathered (boolean, nullable)
- stripe_customer_id (text, nullable)
- stripe_subscription_id (text, nullable)
- subscription_end_date (timestamp, nullable)
- created_at (timestamp, not null)
- updated_at (timestamp, not null)

### Step 2: Check Constraints
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users';
```

**Expected Output**:
- Only PRIMARY KEY on id
- No CHECK constraints on plan
- No NOT NULL on plan

### Step 3: Check RLS Policies
```sql
SELECT policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'users';
```

**Expected Output**:
- Should allow service role to bypass RLS
- Or policies should allow all operations

### Step 4: Test User Creation
```sql
INSERT INTO users (id, plan, api_request_count, grandfathered, created_at, updated_at)
VALUES ('test-' || gen_random_uuid()::text, NULL, 0, false, NOW(), NOW())
RETURNING id, plan;
```

**Should succeed** with NULL plan value

### Step 5: Test User Query
```sql
SELECT id, plan, api_request_count, grandfathered
FROM users
WHERE id = '936581d3-507b-4a25-9fce-2217f52a177c'
LIMIT 1;
```

**Should return** user data or empty set (not error)

---

## Known Issues & Fixes

### Issue 1: Plan Column Has NOT NULL Constraint
**Symptom**: Error 23514 when creating new user
**Root Cause**: `ALTER TABLE users ALTER COLUMN plan SET NOT NULL;`
**Fix**:
```sql
ALTER TABLE users ALTER COLUMN plan DROP NOT NULL;
```

### Issue 2: Plan Column Has CHECK Constraint
**Symptom**: Error 23514 with message about check constraint
**Root Cause**: `ALTER TABLE users ADD CONSTRAINT valid_plan CHECK (plan IN ('gold', 'platinum'));`
**Fix**:
```sql
ALTER TABLE users DROP CONSTRAINT valid_plan;
```

### Issue 3: Missing Columns
**Symptom**: Error 42703 "column does not exist"
**Root Cause**: Schema migration not run
**Fix**: Run database migration to add missing columns

### Issue 4: RLS Policy Blocks Queries
**Symptom**: Error 42501 "permission denied"
**Root Cause**: RLS policy too restrictive
**Fix**: Update RLS policy or use service role key

### Issue 5: Triggers Prevent Operations
**Symptom**: Silent failure or unexpected errors
**Root Cause**: Trigger with problematic logic
**Fix**: Review trigger code or disable if necessary

---

## How to Run Diagnostics

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy SUPABASE_USER_QUERY_CHECK.sql** content
3. **Run each query section** and review output
4. **Compare results** with expected output above
5. **Identify issues** using error codes table
6. **Apply fixes** as needed

---

## Testing User Requests

### Test 1: Create New User
```javascript
// In browser console or test script
const response = await fetch('http://localhost:3001/api/me/usage', {
  headers: {
    'x-user-id': 'test-user-' + Date.now()
  }
});
console.log(await response.json());
```

**Expected**: User created, returns free plan

### Test 2: Get Existing User
```javascript
const response = await fetch('http://localhost:3001/api/me', {
  headers: {
    'x-user-id': '936581d3-507b-4a25-9fce-2217f52a177c'
  }
});
console.log(await response.json());
```

**Expected**: Returns user's plan (platinum, gold, or free)

### Test 3: Update User Plan (Admin)
```javascript
const response = await fetch('http://localhost:3001/api/admin/set-plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': process.env.ADMIN_KEY
  },
  body: JSON.stringify({
    userId: '936581d3-507b-4a25-9fce-2217f52a177c',
    plan: 'platinum'
  })
});
console.log(await response.json());
```

**Expected**: Plan updated, cache cleared

---

## Production Checklist

- [ ] Users table exists with correct schema
- [ ] No NOT NULL constraint on plan column
- [ ] No restrictive CHECK constraints on plan
- [ ] RLS policies allow service role operations
- [ ] No problematic triggers on users table
- [ ] All required columns present
- [ ] Indexes on id, stripe_customer_id for performance
- [ ] Database backups configured
- [ ] Error logging enabled
- [ ] Monitoring alerts set up

---

## Next Steps

1. Run SUPABASE_USER_QUERY_CHECK.sql in SQL Editor
2. Document any errors found
3. Apply fixes from "Known Issues & Fixes" section
4. Test user requests using "Testing User Requests" section
5. Verify production deployment works correctly
