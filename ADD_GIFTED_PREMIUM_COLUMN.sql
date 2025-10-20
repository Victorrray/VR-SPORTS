-- Add is_gifted column to users table for tracking gifted premium memberships
-- Run this in your Supabase SQL Editor

-- Add is_gifted column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_gifted'
  ) THEN
    ALTER TABLE users ADD COLUMN is_gifted BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN users.is_gifted IS 'Indicates if the user has been gifted a premium membership';
  END IF;
END $$;

-- Create an index for faster queries on gifted users
CREATE INDEX IF NOT EXISTS idx_users_is_gifted ON users(is_gifted) WHERE is_gifted = TRUE;

-- Example: How to gift premium to a user
-- Replace 'user@example.com' with the actual user's email

/*
UPDATE users 
SET 
  plan = 'platinum',
  is_gifted = TRUE,
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '30 days'
WHERE email = 'user@example.com';
*/

-- To gift premium to multiple users at once:
/*
UPDATE users 
SET 
  plan = 'platinum',
  is_gifted = TRUE,
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '30 days'
WHERE email IN (
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
);
*/

-- To check all users with gifted premium:
-- SELECT email, plan, is_gifted, subscription_start_date, subscription_end_date 
-- FROM users 
-- WHERE is_gifted = TRUE;

-- To remove gifted status after expiration (run periodically or via cron):
/*
UPDATE users 
SET 
  plan = NULL,
  is_gifted = FALSE
WHERE 
  is_gifted = TRUE 
  AND subscription_end_date < NOW();
*/
