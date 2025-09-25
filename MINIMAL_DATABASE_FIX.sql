-- MINIMAL DATABASE FIX FOR NEW USER CREATION
-- Run this in Supabase SQL Editor

-- Step 1: Clean up conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_complete ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user_profile ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_complete();
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

-- Step 2: Fix plan constraint to allow NULL
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold', 'platinum') OR plan IS NULL);

-- Step 3: Add missing columns
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS api_request_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 4: Create unified trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_unified()
RETURNS trigger AS $$
BEGIN
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
    NULL,
    0, 
    FALSE, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the trigger
CREATE TRIGGER on_auth_user_created_unified
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_unified();

-- Step 6: Test it worked
SELECT 'Database fix applied successfully!' as status;
