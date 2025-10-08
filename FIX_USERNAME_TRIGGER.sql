-- Fix Username Trigger Issue
-- The trigger is trying to insert into username_history table that doesn't exist

-- Option 1: Create the missing username_history table
CREATE TABLE IF NOT EXISTS username_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_username_history_user_id ON username_history(user_id);
CREATE INDEX IF NOT EXISTS idx_username_history_changed_at ON username_history(changed_at DESC);

-- OR Option 2: Drop the problematic trigger (if you don't need username history)
-- Uncomment these lines if you prefer to remove the trigger instead:

-- DROP TRIGGER IF EXISTS log_username_changes ON profiles;
-- DROP FUNCTION IF EXISTS log_username_change();

-- Verify the fix
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
