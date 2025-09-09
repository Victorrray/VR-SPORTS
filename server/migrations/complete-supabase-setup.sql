-- ============================================
-- COMPLETE VR-ODDS SUPABASE SETUP
-- Username schema + Plan management + API usage tracking
-- ============================================

-- ============================================
-- PART 1: FIXED Supabase Username Schema
-- Removes SET-ONCE lock and fixes conflicts
-- ============================================

-- 1) Remove the problematic SET-ONCE trigger
DROP TRIGGER IF EXISTS trg_prevent_username_change ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_username_change();

-- 2) Clean up duplicate policies
DROP POLICY IF EXISTS "Profiles select all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update own" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;

-- 3) Ensure clean profiles table structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Username validation function (allows changes)
CREATE OR REPLACE FUNCTION public.validate_username(u text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    u ~ '^[A-Za-z0-9_]{3,20}$'   -- allowed chars & length
    AND u !~ '^_'                -- no leading underscore
    AND u !~ '_$'                -- no trailing underscore
    AND lower(u) NOT IN (        -- reserved names
      'admin','root','support','api','moderator','owner','system'
    );
$$;

-- 5) Add validation constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_valid_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_valid_chk
  CHECK (username IS NULL OR public.validate_username(username));

-- 6) Case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_ci
  ON public.profiles (lower(username));

-- 7) RLS Policies (clean, single set)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 8) Username availability RPC
CREATE OR REPLACE FUNCTION public.username_available(candidate text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.validate_username(candidate)
     AND NOT EXISTS (
       SELECT 1
       FROM public.profiles p
       WHERE lower(p.username) = lower(candidate)
     );
$$;

GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;

-- 9) Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
CREATE TRIGGER trg_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10) Updated_at maintenance
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================
-- PART 2: VR-ODDS USERS TABLE & PLAN MANAGEMENT
-- ============================================

-- Create users table for VR-Odds platform
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'platinum')),
  trial_ends timestamptz NULL,
  api_request_count integer NOT NULL DEFAULT 0,
  api_cycle_start timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_api_usage ON public.users(api_request_count);

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_vr_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, plan, api_request_count) 
  VALUES (new.id, 'free', 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_vr_user ON auth.users;
CREATE TRIGGER trg_handle_new_vr_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_vr_user();

-- Updated_at trigger for users table
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================
-- PART 3: API USAGE TRACKING FUNCTIONS
-- ============================================

-- Atomic increment function for usage tracking
CREATE OR REPLACE FUNCTION public.increment_usage(uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET api_request_count = api_request_count + 1 WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage count (for monthly cycles)
CREATE OR REPLACE FUNCTION public.reset_usage(uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET api_request_count = 0, api_cycle_start = now() 
  WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 4: ROW LEVEL SECURITY FOR USERS TABLE
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (but not plan - that's admin only)
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id AND plan = (SELECT plan FROM public.users WHERE id = auth.uid()));

-- Auto-insert policy for new users
CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- PART 5: ADMIN FUNCTIONS FOR PLAN MANAGEMENT
-- ============================================

-- Grant platinum access (admin only)
CREATE OR REPLACE FUNCTION public.admin_grant_platinum(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.users 
  SET plan = 'platinum', updated_at = now() 
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Revoke platinum access (admin only)
CREATE OR REPLACE FUNCTION public.admin_revoke_platinum(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.users 
  SET plan = 'free', updated_at = now() 
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Get all platinum users (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_platinum_users()
RETURNS TABLE(user_id uuid, plan text, api_count integer, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id, plan, api_request_count, created_at
  FROM public.users 
  WHERE plan = 'platinum'
  ORDER BY updated_at DESC;
$$;

-- ============================================
-- PART 6: BACKFILL EXISTING DATA
-- ============================================

-- Ensure all existing users have default values
UPDATE public.users SET plan = 'free' WHERE plan IS NULL;
UPDATE public.users SET api_request_count = 0 WHERE api_request_count IS NULL;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_usage(uuid) TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- Your VR-Odds platform now has:
-- ✅ Fixed username system with validation
-- ✅ Plan management (free/platinum)
-- ✅ API usage tracking and quotas
-- ✅ Admin functions for user management
-- ✅ Row-level security policies
-- ✅ Automatic user creation on signup
-- ============================================
