-- ============================================
-- SETUP AUTOMATIC PROFILE CREATION TRIGGER
-- This prevents orphaned users in the future
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_unified_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.on_auth_user_created_unified();

-- Create the function
CREATE OR REPLACE FUNCTION public.on_auth_user_created_unified()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || SUBSTRING(NEW.id::text, 1, 8)
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user record (if not exists)
  INSERT INTO public.users (id, plan, api_request_count, grandfathered, created_at, updated_at)
  VALUES (
    NEW.id,
    NULL,  -- New users must subscribe
    0,
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_unified_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_auth_user_created_unified();

-- Verify trigger was created
SELECT 
  '✅ TRIGGER CREATED' as status,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_unified_trigger';

-- Test message
SELECT '🎉 Trigger is now active! New users will automatically get profiles.' as message;
