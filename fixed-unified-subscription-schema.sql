-- FIXED UNIFIED VR-ODDS SUBSCRIPTION TRACKING
-- This script works with your existing profiles table structure
-- Handles existing users table/view conflicts

-- ============================================
-- SUBSCRIPTION TRACKING FOR PROFILES TABLE
-- ============================================

-- Add subscription tracking columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz NULL,
ADD COLUMN IF NOT EXISTS stripe_customer_id text NULL,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text NULL;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end ON public.profiles(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles(stripe_subscription_id);

-- Update existing platinum users to have subscription end date (30 days from now)
UPDATE public.profiles 
SET subscription_end_date = now() + interval '30 days'
WHERE plan = 'platinum' AND subscription_end_date IS NULL;

-- Function to check if user has active subscription (using profiles table)
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND plan = 'platinum' 
    AND (subscription_end_date IS NULL OR subscription_end_date > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire subscriptions (run daily) - works with profiles table
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS integer AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.profiles 
  SET plan = 'free'
  WHERE plan = 'platinum' 
  AND subscription_end_date IS NOT NULL 
  AND subscription_end_date <= now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced API quota check with subscription awareness
CREATE OR REPLACE FUNCTION public.check_api_quota()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  used_quota int;
  max_quota int;
  sub_end_date timestamptz;
  result json;
BEGIN
  -- Get user's plan, usage, and subscription end date
  SELECT 
    p.plan, 
    p.api_request_count,
    p.subscription_end_date,
    CASE 
      WHEN p.plan = 'platinum' AND (p.subscription_end_date IS NULL OR p.subscription_end_date > now()) 
        THEN 2147483647 -- Unlimited for active platinum
      WHEN p.plan = 'pro' THEN 10000
      ELSE 250 -- Free tier (updated to match your system)
    END INTO user_plan, used_quota, sub_end_date, max_quota
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Check if platinum subscription expired
  IF user_plan = 'platinum' AND sub_end_date IS NOT NULL AND sub_end_date <= now() THEN
    -- Auto-downgrade expired platinum users
    UPDATE public.profiles 
    SET plan = 'free' 
    WHERE id = auth.uid();
    
    user_plan := 'free';
    max_quota := 250;
  END IF;

  -- Return quota information with subscription details
  SELECT json_build_object(
    'plan', COALESCE(user_plan, 'free'),
    'used', COALESCE(used_quota, 0),
    'remaining', GREATEST(0, max_quota - COALESCE(used_quota, 0)),
    'total', max_quota,
    'subscription_end_date', sub_end_date,
    'reset_date', (date_trunc('month', now()) + interval '1 month')::date
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_subscriptions() TO authenticated;

-- Update the existing check_api_quota permissions
GRANT EXECUTE ON FUNCTION public.check_api_quota() TO authenticated, anon;

-- ============================================
-- COMPATIBILITY LAYER FOR SERVER CODE
-- ============================================

-- Drop existing users view/table if it exists and recreate
DROP VIEW IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users view that maps to profiles for server compatibility
CREATE VIEW public.users AS
SELECT 
  id,
  plan,
  api_request_count,
  subscription_end_date,
  stripe_customer_id,
  stripe_subscription_id,
  trial_ends,
  created_at,
  updated_at
FROM public.profiles;

-- Make the view updatable with rules
CREATE OR REPLACE RULE users_insert AS
ON INSERT TO public.users
DO INSTEAD
INSERT INTO public.profiles (id, plan, api_request_count, subscription_end_date, stripe_customer_id, stripe_subscription_id, trial_ends)
VALUES (NEW.id, NEW.plan, NEW.api_request_count, NEW.subscription_end_date, NEW.stripe_customer_id, NEW.stripe_subscription_id, NEW.trial_ends)
ON CONFLICT (id) DO UPDATE SET
  plan = EXCLUDED.plan,
  api_request_count = EXCLUDED.api_request_count,
  subscription_end_date = EXCLUDED.subscription_end_date,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  trial_ends = EXCLUDED.trial_ends;

CREATE OR REPLACE RULE users_update AS
ON UPDATE TO public.users
DO INSTEAD
UPDATE public.profiles SET
  plan = NEW.plan,
  api_request_count = NEW.api_request_count,
  subscription_end_date = NEW.subscription_end_date,
  stripe_customer_id = NEW.stripe_customer_id,
  stripe_subscription_id = NEW.stripe_subscription_id,
  trial_ends = NEW.trial_ends,
  updated_at = now()
WHERE id = OLD.id;

-- Atomic increment function for usage tracking (works with profiles)
CREATE OR REPLACE FUNCTION public.increment_usage(uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET api_request_count = api_request_count + 1 WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_usage(uuid) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed unified subscription tracking completed!';
  RAISE NOTICE 'Your existing profiles table now supports:';
  RAISE NOTICE '- 30-day subscription tracking';
  RAISE NOTICE '- Stripe integration fields';
  RAISE NOTICE '- Automatic expiration handling';
  RAISE NOTICE '- Server compatibility via users view (recreated)';
END $$;
