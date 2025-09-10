-- ============================================
-- COMPLETE VR-ODDS SCHEMA UPGRADE
-- Combines username fixes, plan management, and API usage tracking
-- ============================================

-- ============================================
-- PART 1: DATABASE HELPER FUNCTIONS
-- ============================================

-- Function to get table columns
CREATE OR REPLACE FUNCTION get_columns(table_name text)
RETURNS TABLE (column_name text, data_type text) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    a.attname::text as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type
  FROM 
    pg_catalog.pg_attribute a
  WHERE 
    a.attnum > 0 
    AND NOT a.attisdropped
    AND a.attrelid = (SELECT oid FROM pg_catalog.pg_class WHERE relname = get_columns.table_name);
END;
$$ LANGUAGE plpgsql;

-- Function to safely add columns
CREATE OR REPLACE FUNCTION alter_table_add_column(
  table_name text,
  column_name text,
  column_type text
) RETURNS void AS $$
DECLARE
  column_exists integer;
  alter_sql text;
BEGIN
  -- Check if column exists
  SELECT count(*) INTO column_exists
  FROM information_schema.columns 
  WHERE table_name = $1 AND column_name = $2;
  
  -- Add column if it doesn't exist
  IF column_exists = 0 THEN
    alter_sql := format('ALTER TABLE %I ADD COLUMN %I %s', $1, $2, $3);
    EXECUTE alter_sql;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 2: USERNAME SCHEMA FIXES
-- ============================================

-- 1) Remove problematic triggers and functions
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

-- 3) Ensure clean profiles table structure with plan and usage columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS api_request_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS api_cycle_start timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_ends timestamptz DEFAULT (now() + interval '14 days');

-- 4) Username validation function (allows changes)
CREATE OR REPLACE FUNCTION public.validate_username(u text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    u ~ '^[A-Za-z0-9_]{3,20}$'   -- allowed chars & length
    AND u !~ '^_'                 -- no leading underscore
    AND u !~ '_$'                 -- no trailing underscore
    AND lower(u) NOT IN (         -- reserved names
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
  INSERT INTO public.profiles (id, plan, trial_ends)
  VALUES (new.id, 'free', (now() + interval '14 days'))
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
-- PART 3: API USAGE TRACKING
-- ============================================

-- Function to increment API usage
CREATE OR REPLACE FUNCTION public.increment_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset counter if it's a new cycle (start of month)
  IF EXTRACT(DAY FROM now()) = 1 AND EXTRACT(HOUR FROM now()) < 1 THEN
    NEW.api_request_count := 1;
    NEW.api_cycle_start := now();
  ELSE
    NEW.api_request_count := COALESCE(NEW.api_request_count, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to update API usage
DROP TRIGGER IF EXISTS trg_increment_usage ON public.profiles;
CREATE TRIGGER trg_increment_usage
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_usage();

-- Function to check API quota
CREATE OR REPLACE FUNCTION public.check_api_quota()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  used_quota int;
  max_quota int;
  result json;
BEGIN
  -- Get user's plan and usage
  SELECT 
    p.plan, 
    p.api_request_count,
    CASE 
      WHEN p.plan = 'platinum' THEN 2147483647 -- Unlimited for platinum
      WHEN p.plan = 'pro' THEN 10000
      ELSE 1000 -- Free tier
    END INTO user_plan, used_quota, max_quota
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Return quota information
  SELECT json_build_object(
    'plan', COALESCE(user_plan, 'free'),
    'used', COALESCE(used_quota, 0),
    'remaining', GREATEST(0, max_quota - COALESCE(used_quota, 0)),
    'total', max_quota,
    'reset_date', (date_trunc('month', now()) + interval '1 month')::date
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_api_quota() TO authenticated, anon;

-- ============================================
-- PART 4: FINALIZE UPGRADES
-- ============================================

-- Create default admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@vrodds.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, email, encrypted_password, 
      email_confirmed_at, recovery_sent_at, last_sign_in_at, 
      created_at, updated_at, confirmation_token, email_change, 
      email_change_token_new, recovery_token, raw_app_meta_data, 
      raw_user_meta_data, is_super_admin
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 
      'admin@vrodds.com', 
      crypt('admin123', gen_salt('bf')), -- Change this password immediately after first login
      now(), now(), now(), now(), now(), '', '', '', '', 
      '{"provider": "email", "providers": ["email"]}', 
      '{"full_name": "Admin User"}', 
      true
    );

    -- Set admin user as platinum
    UPDATE public.profiles 
    SET 
      plan = 'platinum',
      api_request_count = 0,
      trial_ends = NULL
    WHERE id IN (
      SELECT id FROM auth.users WHERE email = 'admin@vrodds.com'
    );
  END IF;
END $$;

-- Output completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema upgrade completed successfully!';
  RAISE NOTICE 'Admin user: admin@vrodds.com';
  RAISE NOTICE 'Please change the admin password immediately after login.';
END $$;
