-- SAFE TRIGGER CLEANUP - Only removes our custom triggers
-- Leaves Supabase system triggers intact
-- Run this in Supabase SQL Editor

-- Step 1: Remove only our custom triggers (not system triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_unified ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user_profile ON auth.users;

-- Step 2: Remove our custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_complete() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_unified() CASCADE;

-- Step 3: Fix the users table constraint to allow NULL
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold', 'platinum') OR plan IS NULL);

-- Step 4: Add required columns safely
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS api_request_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 5: Ensure RLS policies exist (required for Supabase)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;

-- Create proper RLS policies
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 6: Create profiles table if needed
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

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;

CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 7: Test that it worked
SELECT 'Safe cleanup complete - ready for user signup!' as status;

-- Show remaining custom triggers (should be none)
SELECT 
  tgname as custom_trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
AND tgname LIKE '%user%'  -- Only show our user-related triggers
AND tgname NOT LIKE 'RI_%'  -- Exclude system constraint triggers
AND tgname NOT LIKE 'pg_%'; -- Exclude PostgreSQL system triggers
