-- Add plan and trial_ends columns to users table
-- Run this migration in Supabase SQL editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends TIMESTAMPTZ NULL;

-- Create index for plan queries
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- Update existing users to have free plan if null
UPDATE users SET plan = 'free' WHERE plan IS NULL;
