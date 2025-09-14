-- Fix subscription tracking to properly handle 30-day periods
-- Add subscription_end_date field to track when platinum access expires

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz NULL;

-- Add index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON public.users(subscription_end_date);

-- Update existing platinum users to have a subscription end date (30 days from now)
UPDATE public.users 
SET subscription_end_date = now() + interval '30 days'
WHERE plan = 'platinum' AND subscription_end_date IS NULL;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND plan = 'platinum' 
    AND (subscription_end_date IS NULL OR subscription_end_date > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire subscriptions (run daily)
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS integer AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.users 
  SET plan = 'free'
  WHERE plan = 'platinum' 
  AND subscription_end_date IS NOT NULL 
  AND subscription_end_date <= now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_subscriptions() TO authenticated;
