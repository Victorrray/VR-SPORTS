-- Migration: Grandfather existing users to Gold plan
-- This upgrades all existing free/trial users to Gold plan
-- Run this BEFORE deploying the new Gold-only system

-- Update all existing users to Gold plan (grandfathered)
UPDATE public.users 
SET 
  plan = 'gold',
  updated_at = NOW(),
  -- Add a flag to track grandfathered users
  grandfathered = TRUE
WHERE plan IN ('free', 'free_trial', 'platinum');

-- Add grandfathered column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE;

-- Update the plan constraint to include 'gold'
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold'));

-- Create index for grandfathered users
CREATE INDEX IF NOT EXISTS idx_users_grandfathered ON public.users(grandfathered);

-- Log the migration
INSERT INTO public.migration_log (migration_name, executed_at, description) 
VALUES (
  '004_grandfather_existing_users', 
  NOW(), 
  'Grandfathered all existing users to Gold plan'
) ON CONFLICT DO NOTHING;

-- Create migration_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT
);
