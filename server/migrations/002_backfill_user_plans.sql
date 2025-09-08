-- Backfill legacy users with free_trial plan
-- This migration sets plan = 'free_trial' for all users where plan is NULL

UPDATE public.users 
SET plan = 'free_trial', updated_at = NOW()
WHERE plan IS NULL;

-- Add index on plan column for better query performance
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
