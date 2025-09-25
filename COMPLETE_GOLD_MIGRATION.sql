-- =====================================================
-- COMPLETE GOLD PLAN MIGRATION
-- =====================================================
-- This migration converts your platform to Gold-only plan
-- with grandfathering for existing users
-- 
-- BACKUP YOUR DATA BEFORE RUNNING THIS!
-- =====================================================

-- Step 1: Create backup table (CRITICAL SAFETY MEASURE)
CREATE TABLE IF NOT EXISTS users_backup_before_gold_migration AS 
SELECT * FROM public.users;

-- Step 2: Add grandfathered column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE;

-- Step 3: Add subscription_end_date column if it doesn't exist (for paid subscriptions)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ NULL;

-- Step 4: FIRST - Remove existing plan constraint that blocks 'gold'
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

-- Step 5: Add new constraint that allows 'gold' and NULL
ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold') OR plan IS NULL);

-- Step 6: NOW - GRANDFATHER ALL EXISTING USERS TO GOLD PLAN
-- This gives all current users free Gold access forever
UPDATE public.users 
SET 
  plan = 'gold',
  updated_at = NOW(),
  grandfathered = TRUE
WHERE plan IN ('free', 'free_trial', 'platinum') OR plan IS NULL;

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_grandfathered ON public.users(grandfathered);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON public.users(subscription_end_date);

-- Step 8: Update the user creation trigger to not set a default plan
-- New users will have plan = NULL and must subscribe to Gold
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, plan, api_request_count, grandfathered) 
  VALUES (new.id, NULL, 0, FALSE)  -- No default plan for new users
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 9: Create migration log entry
CREATE TABLE IF NOT EXISTS public.migration_log (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  affected_rows INTEGER
);

-- Log this migration
INSERT INTO public.migration_log (migration_name, executed_at, description, affected_rows) 
VALUES (
  'COMPLETE_GOLD_MIGRATION', 
  NOW(), 
  'Converted platform to Gold-only plan with grandfathering for existing users',
  (SELECT COUNT(*) FROM public.users WHERE grandfathered = TRUE)
) ON CONFLICT (migration_name) DO UPDATE SET
  executed_at = NOW(),
  affected_rows = (SELECT COUNT(*) FROM public.users WHERE grandfathered = TRUE);

-- Step 10: Verification queries (run these after migration)
-- Uncomment to see results:

-- SELECT 'Migration Results:' as status;
-- SELECT 
--   plan,
--   grandfathered,
--   COUNT(*) as user_count,
--   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
-- FROM public.users 
-- GROUP BY plan, grandfathered
-- ORDER BY user_count DESC;

-- SELECT 'Grandfathered Users:' as status;
-- SELECT COUNT(*) as total_grandfathered_users 
-- FROM public.users 
-- WHERE grandfathered = TRUE;

-- SELECT 'New Users (will need to pay):' as status;
-- SELECT COUNT(*) as new_users_requiring_payment
-- FROM public.users 
-- WHERE grandfathered = FALSE OR grandfathered IS NULL;

-- =====================================================
-- ROLLBACK PLAN (Emergency Use Only)
-- =====================================================
-- If something goes wrong, run this to restore:
-- 
-- DROP TABLE public.users;
-- ALTER TABLE users_backup_before_gold_migration RENAME TO users;
-- 
-- =====================================================

-- Migration Complete!
-- All existing users now have Gold plan for free (grandfathered = TRUE)
-- New users will have plan = NULL and must subscribe to Gold plan ($10/month)
