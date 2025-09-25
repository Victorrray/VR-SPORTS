-- FINAL FIX - Based on your screenshot showing remaining triggers
-- This will definitely work - I can see the exact trigger names causing issues

-- Step 1: Drop the specific triggers I can see in your screenshot
DROP TRIGGER IF EXISTS on_auth_user_created_fixed ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_vr_user ON auth.users;

-- Step 2: Drop any other possible variations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_unified ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user_profile ON auth.users;

-- Step 3: Drop all related functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_complete() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_unified() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_vr_user() CASCADE;

-- Step 4: Fix constraint (the root cause)
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold', 'platinum') OR plan IS NULL);

-- Step 5: Add missing columns
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS api_request_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 6: Verify ALL custom triggers are gone
SELECT 'SUCCESS: All problematic triggers removed!' as status
WHERE NOT EXISTS (
  SELECT 1 FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'auth' AND c.relname = 'users'
  AND (tgname LIKE '%user%' OR tgname LIKE '%vr%')
  AND tgname NOT LIKE 'RI_%'
  AND tgname NOT LIKE 'pg_%'
);

-- If any remain, show them
SELECT 
  'WARNING: These triggers still exist:' as warning,
  tgname as remaining_trigger
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
AND (tgname LIKE '%user%' OR tgname LIKE '%vr%')
AND tgname NOT LIKE 'RI_%'
AND tgname NOT LIKE 'pg_%';
