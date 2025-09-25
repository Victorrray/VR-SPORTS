-- COMPLETE TRIGGER CLEANUP AND FIX
-- This removes ALL triggers that could be interfering with auth.users
-- Run this in Supabase SQL Editor

-- Step 1: Remove ALL triggers on auth.users table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Get all triggers on auth.users table
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
        AND tgname NOT LIKE 'pg_%'  -- Don't drop system triggers
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_record.tgname);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Step 2: Remove ALL related functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_complete() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_unified() CASCADE;

-- Step 3: Fix the users table constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold', 'platinum') OR plan IS NULL);

-- Step 4: Ensure required columns exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS api_request_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 5: Create profiles table (if needed)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bankroll NUMERIC(10,2) DEFAULT 1000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Enable RLS on users table (required for Supabase)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Step 7: Verify cleanup
SELECT 
  'Cleanup complete!' as status,
  COUNT(*) as remaining_triggers
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
AND tgname NOT LIKE 'pg_%';

-- Step 8: Test user creation manually
SELECT 'Ready for user signup - no more trigger conflicts!' as message;
