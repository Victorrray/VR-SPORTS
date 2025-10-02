# 🔍 DATABASE AUDIT GUIDE

## 📋 How to Run the Audit

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Navigate to SQL Editor
- Click on your project
- Click "SQL Editor" in the left sidebar
- Click "New Query"

### 3. Run the Audit
- Copy all contents from `supabase-audit.sql`
- Paste into SQL Editor
- Click "Run" or press `Cmd/Ctrl + Enter`

### 4. Review Results
Scroll through the results to see:
- ✅ Green checkmarks = Good
- ❌ Red X = Needs fixing
- ⚠️ Warning = Optional improvement

---

## 🎯 What the Audit Checks

### Critical Checks:
1. **Tables Exist** - users and profiles tables
2. **Required Columns** - id, plan, api_request_count, grandfathered
3. **Plan Constraint** - Should allow NULL values
4. **RLS Status** - Row Level Security enabled
5. **Triggers** - Auto-create user records
6. **Orphaned Records** - Users without profiles

### Data Checks:
7. **User Summary** - Count by plan type
8. **Profile Summary** - Usernames and emails
9. **Indexes** - Performance optimization
10. **Sample Data** - First 5 users

### Security Checks:
11. **RLS Policies** - Access control rules
12. **Functions** - Database functions

---

## ✅ Expected Results

### Healthy Database:
```
📋 TABLES CHECK: ✅ PASS - 2 tables found
✅ USERS REQUIRED COLUMNS: ✅ PASS
🔒 PLAN CONSTRAINT CHECK: ✅ PASS - Plan can be NULL
🔐 RLS STATUS: ✅ ENABLED
👥 USER DATA SUMMARY: Shows your users
🎯 FINAL AUDIT SUMMARY: ✅ DATABASE READY
```

### Issues to Fix:
```
❌ FAIL - Missing tables
❌ FAIL - Missing required columns
❌ FAIL - Plan constraint too restrictive
⚠️ WARNING - Some users missing profiles
```

---

## 🔧 Common Fixes

### If Tables Missing:
```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT,
  api_request_count INTEGER DEFAULT 0,
  grandfathered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### If Plan Constraint Too Restrictive:
```sql
-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;

-- Add new constraint that allows NULL
ALTER TABLE users ADD CONSTRAINT users_plan_check 
  CHECK (plan IS NULL OR plan IN ('free', 'gold', 'platinum'));
```

### If Missing RLS Policies:
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### If Orphaned Users:
```sql
-- Create missing profiles
INSERT INTO profiles (id, username)
SELECT u.id, COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1))
FROM users u
JOIN auth.users au ON u.id = au.id
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

---

## 📊 Understanding the Results

### User Plan Distribution:
- **platinum_users** - Unlimited access
- **gold_users** - Legacy plan (if any)
- **no_plan_users** - Need to subscribe
- **grandfathered_users** - Legacy unlimited access

### API Usage:
- **total_api_calls** - Sum of all API requests
- **api_request_count** - Per user usage

### Orphaned Records:
- **Orphaned users** - Users without profiles (bad)
- **Orphaned profiles** - Profiles without users (very bad)

---

## 🚨 Red Flags

### Critical Issues:
1. ❌ Tables don't exist
2. ❌ Required columns missing
3. ❌ Plan constraint blocks NULL
4. ❌ Many orphaned records

### Warnings (Not Critical):
1. ⚠️ RLS disabled (security risk)
2. ⚠️ No RLS policies (security risk)
3. ⚠️ Few orphaned records (cleanup needed)
4. ⚠️ Missing indexes (performance)

---

## 🎯 Quick Health Check

Run this simple query to check if everything is working:

```sql
-- Quick health check
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE plan = 'platinum') as platinum_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM users) = (SELECT COUNT(*) FROM profiles)
    THEN '✅ Users and profiles match'
    ELSE '⚠️ Mismatch between users and profiles'
  END as status;
```

---

## 📝 After Running Audit

### If Everything Passes:
✅ Your database is healthy!
✅ No action needed
✅ SimpleAuth will work correctly

### If Issues Found:
1. Note which checks failed
2. Use the "Common Fixes" section above
3. Run the audit again to verify
4. Test login/signup to confirm

---

## 🔄 When to Run Audit

- **After initial setup** - Verify everything is configured
- **Before deployment** - Ensure production is ready
- **After schema changes** - Verify migrations worked
- **When auth issues occur** - Debug database problems
- **Monthly** - Regular health check

---

## 💡 Pro Tips

1. **Save audit results** - Screenshot or export for reference
2. **Run before and after fixes** - Verify improvements
3. **Check regularly** - Catch issues early
4. **Monitor user growth** - Track plan distribution
5. **Clean orphaned records** - Keep database tidy

---

**Your database is the foundation of auth - keep it healthy!** 🏗️
