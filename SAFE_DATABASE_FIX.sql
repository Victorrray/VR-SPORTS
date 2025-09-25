-- SAFE DATABASE FIX FOR NEW USER CREATION
-- Handles existing triggers and functions safely

-- Step 1: Drop existing trigger first (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created_unified ON auth.users;

-- Step 2: Clean up any other conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user_profile ON auth.users;

-- Step 3: Drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user_unified();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_complete();
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- Step 4: Fix plan constraint to allow NULL
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold', 'platinum') OR plan IS NULL);

-- Step 5: Add missing columns (safe with IF NOT EXISTS)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS api_request_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 6: Create the unified trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_unified()
RETURNS trigger AS $$
BEGIN
  -- Create user record with plan = NULL (must subscribe)
  INSERT INTO public.users (
    id, 
    plan, 
    api_request_count, 
    grandfathered, 
    created_at, 
    updated_at
  ) 
  VALUES (
    new.id, 
    NULL,  -- New users must subscribe
    0, 
    FALSE, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create the trigger (now safe since we dropped it first)
CREATE TRIGGER on_auth_user_created_unified
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_unified();

-- Step 8: Verify the fix
SELECT 
  'Trigger created successfully!' as status,
  COUNT(*) as existing_users
FROM public.users;

-- Step 9: Show current trigger status
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgrelid = (
  SELECT oid 
  FROM pg_class 
  WHERE relname = 'users' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
);
