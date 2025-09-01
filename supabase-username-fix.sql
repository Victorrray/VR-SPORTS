-- ============================================
-- FIXED Supabase Username Schema
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
