-- Migration: Create user_usage_monthly table for API metering
-- This table tracks monthly API usage per user for quota enforcement

CREATE TABLE IF NOT EXISTS user_usage_monthly (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  calls_made INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per month
  UNIQUE(user_id, period_start)
);

-- Index for fast lookups by user and period
CREATE INDEX IF NOT EXISTS idx_user_usage_monthly_user_period 
ON user_usage_monthly(user_id, period_start);

-- Add subscription plan to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
    ALTER TABLE auth.users ADD COLUMN subscription_plan VARCHAR(20) DEFAULT 'free_trial';
  END IF;
END $$;

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_usage_monthly_updated_at ON user_usage_monthly;
CREATE TRIGGER update_user_usage_monthly_updated_at
  BEFORE UPDATE ON user_usage_monthly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
