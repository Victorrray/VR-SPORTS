-- ============================================
-- UPDATED VR-ODDS SCHEMA FOR GOLD PLAN SYSTEM
-- Compatible with Gold-only migration
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
-- PART 2: GOLD PLAN COMPATIBLE USER SYSTEM
-- ============================================

-- Ensure users table has Gold-compatible structure
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS api_request_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update plan constraint for Gold-only system
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold') OR plan IS NULL);

-- ============================================
-- PART 3: USER CREATION FOR GOLD SYSTEM
-- ============================================

-- Updated user creation function for Gold system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- New users get NO plan by default - must subscribe to Gold
  INSERT INTO public.users (id, plan, api_request_count, grandfathered, created_at, updated_at)
  VALUES (new.id, NULL, 0, FALSE, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- PART 4: PROFILES TABLE (Optional - for usernames)
-- ============================================

-- Create profiles table if it doesn't exist (for usernames/display names)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Username validation function (allows changes)
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

-- Add validation constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_valid_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_valid_chk
  CHECK (username IS NULL OR public.validate_username(username));

-- Case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_ci
  ON public.profiles (lower(username));

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Username availability RPC
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

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (new.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_user_profile ON auth.users;
CREATE TRIGGER trg_handle_new_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();

-- Updated_at maintenance for profiles
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
-- PART 5: RLS POLICIES FOR USERS TABLE
-- ============================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (for subscription management)
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================
-- PART 6: PERFORMANCE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_grandfathered ON public.users(grandfathered);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON public.users(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- ============================================
-- PART 7: ADMIN USER (GRANDFATHERED GOLD)
-- ============================================

-- Create admin user with grandfathered Gold access
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@vrodds.com';
  
  IF admin_user_id IS NULL THEN
    -- Create admin user
    INSERT INTO auth.users (
      id, instance_id, aud, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 
      'admin@vrodds.com', 
      crypt('ChangeMe123!', gen_salt('bf')), -- CHANGE THIS PASSWORD!
      now(), now(), now(),
      '{"provider": "email", "providers": ["email"]}', 
      '{"full_name": "Admin User"}'
    ) RETURNING id INTO admin_user_id;
  END IF;

  -- Set admin user as grandfathered Gold user
  INSERT INTO public.users (id, plan, grandfathered, api_request_count, created_at, updated_at)
  VALUES (admin_user_id, 'gold', TRUE, 0, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    plan = 'gold',
    grandfathered = TRUE,
    updated_at = NOW();

  -- Create admin profile
  INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
  VALUES (admin_user_id, 'admin', 'Admin User', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    username = 'admin',
    full_name = 'Admin User',
    updated_at = NOW();

END $$;

-- ============================================
-- PART 8: COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Gold Plan Schema Setup Complete!';
  RAISE NOTICE '🥇 New users require Gold subscription ($10/month)';
  RAISE NOTICE '👤 Admin user: admin@vrodds.com (password: ChangeMe123!)';
  RAISE NOTICE '🔒 CHANGE ADMIN PASSWORD IMMEDIATELY!';
  RAISE NOTICE '📊 Run your Gold migration next to grandfather existing users';
END $$;
