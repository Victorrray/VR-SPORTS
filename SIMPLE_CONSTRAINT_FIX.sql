-- SIMPLE CONSTRAINT FIX
-- Just fix the plan constraint to allow NULL values
-- Run this in Supabase SQL Editor

-- Remove the restrictive constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

-- Add a constraint that allows NULL (new users can have no plan)
ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold', 'platinum') OR plan IS NULL);

-- Add missing columns if they don't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS api_request_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Test that it worked
SELECT 'Constraint fixed - new users can now be created!' as status;
