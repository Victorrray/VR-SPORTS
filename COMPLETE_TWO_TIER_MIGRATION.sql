-- =====================================================
-- COMPLETE TWO-TIER GOLD + PLATINUM MIGRATION
-- =====================================================
-- Gold Plan: $10/month (replaces free trial)
-- Platinum Plan: $25/month (premium tier)
-- All existing users get grandfathered
-- =====================================================

-- Step 1: Create backup table (CRITICAL SAFETY MEASURE)
CREATE TABLE IF NOT EXISTS users_backup_before_two_tier_migration AS 
SELECT * FROM public.users;

-- Step 2: Add required columns if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ NULL;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT NULL;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT NULL;

-- Step 3: Remove existing plan constraints that might block updates
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

-- Step 4: GRANDFATHER ALL EXISTING USERS
-- Free/trial users → Gold (grandfathered)
-- Platinum users → Keep Platinum (grandfathered)
UPDATE public.users 
SET 
  plan = CASE 
    WHEN plan = 'platinum' THEN 'platinum'  -- Keep existing platinum users
    ELSE 'gold'  -- Upgrade all free/trial users to gold
  END,
  grandfathered = TRUE,
  updated_at = NOW()
WHERE plan IS NOT NULL;

-- Handle users with NULL plans (upgrade to gold, grandfathered)
UPDATE public.users 
SET 
  plan = 'gold',
  grandfathered = TRUE,
  updated_at = NOW()
WHERE plan IS NULL;

-- Step 5: Add new constraint for two-tier system
ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('gold', 'platinum') OR plan IS NULL);

-- Step 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_grandfathered ON public.users(grandfathered);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON public.users(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON public.users(stripe_subscription_id);

-- Step 7: Update user creation trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- New users get NO plan by default - must subscribe to Gold or Platinum
  INSERT INTO public.users (id, plan, api_request_count, grandfathered, created_at, updated_at) 
  VALUES (new.id, NULL, 0, FALSE, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 8: Create helper functions for plan management
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND (plan = 'gold' OR plan = 'platinum')
    AND (grandfathered = TRUE OR subscription_end_date IS NULL OR subscription_end_date > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription expiration
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS integer AS $$
DECLARE
  expired_count integer;
BEGIN
  -- Only expire non-grandfathered users whose subscriptions have ended
  UPDATE public.users 
  SET plan = NULL, updated_at = NOW()
  WHERE (plan = 'gold' OR plan = 'platinum')
  AND grandfathered = FALSE
  AND subscription_end_date IS NOT NULL 
  AND subscription_end_date <= NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create RLS policies for security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (for subscription management)
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Step 10: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_subscriptions() TO authenticated;

-- Step 11: Create migration log
CREATE TABLE IF NOT EXISTS public.migration_log (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  affected_rows INTEGER,
  details JSONB
);

-- Log this migration with details
INSERT INTO public.migration_log (migration_name, executed_at, description, affected_rows, details) 
VALUES (
  'COMPLETE_TWO_TIER_MIGRATION', 
  NOW(), 
  'Implemented Gold ($10) + Platinum ($25) two-tier system with grandfathering',
  (SELECT COUNT(*) FROM public.users WHERE grandfathered = TRUE),
  jsonb_build_object(
    'gold_users', (SELECT COUNT(*) FROM public.users WHERE plan = 'gold'),
    'platinum_users', (SELECT COUNT(*) FROM public.users WHERE plan = 'platinum'),
    'grandfathered_users', (SELECT COUNT(*) FROM public.users WHERE grandfathered = TRUE),
    'new_users_no_plan', (SELECT COUNT(*) FROM public.users WHERE plan IS NULL AND grandfathered = FALSE)
  )
) ON CONFLICT (migration_name) DO UPDATE SET
  executed_at = NOW(),
  affected_rows = (SELECT COUNT(*) FROM public.users WHERE grandfathered = TRUE),
  details = jsonb_build_object(
    'gold_users', (SELECT COUNT(*) FROM public.users WHERE plan = 'gold'),
    'platinum_users', (SELECT COUNT(*) FROM public.users WHERE plan = 'platinum'),
    'grandfathered_users', (SELECT COUNT(*) FROM public.users WHERE grandfathered = TRUE),
    'new_users_no_plan', (SELECT COUNT(*) FROM public.users WHERE plan IS NULL AND grandfathered = FALSE)
  );

-- Step 12: Verification and Results
SELECT '🎯 MIGRATION COMPLETE - RESULTS:' as status;

SELECT 
  '📊 User Distribution by Plan:' as section,
  plan,
  grandfathered,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.users 
GROUP BY plan, grandfathered
ORDER BY plan NULLS LAST, grandfathered DESC;

SELECT 
  '💰 Revenue Impact:' as section,
  CASE 
    WHEN plan = 'gold' AND grandfathered = FALSE THEN 'Gold Paying ($10/month)'
    WHEN plan = 'platinum' AND grandfathered = FALSE THEN 'Platinum Paying ($25/month)'
    WHEN plan = 'gold' AND grandfathered = TRUE THEN 'Gold Grandfathered (Free)'
    WHEN plan = 'platinum' AND grandfathered = TRUE THEN 'Platinum Grandfathered (Free)'
    ELSE 'No Plan (Must Subscribe)'
  END as user_type,
  COUNT(*) as count
FROM public.users 
GROUP BY plan, grandfathered
ORDER BY plan NULLS LAST, grandfathered DESC;

SELECT 
  '✅ System Status:' as section,
  'Two-tier system active' as status,
  'Gold: $10/month, Platinum: $25/month' as pricing,
  COUNT(*) as total_users
FROM public.users;

-- =====================================================
-- ROLLBACK PLAN (Emergency Use Only)
-- =====================================================
-- If something goes wrong, run this to restore:
-- 
-- DROP TABLE public.users CASCADE;
-- ALTER TABLE users_backup_before_two_tier_migration RENAME TO users;
-- 
-- =====================================================

-- 🎯 MIGRATION COMPLETE!
-- ✅ Gold Plan: $10/month (replaces free trial)
-- ✅ Platinum Plan: $25/month (premium tier)  
-- ✅ All existing users grandfathered
-- ✅ New users must subscribe to Gold or Platinum
