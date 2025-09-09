-- Add API usage tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_request_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_cycle_start TIMESTAMPTZ NULL;

-- Create index for efficient usage queries
CREATE INDEX IF NOT EXISTS idx_users_api_usage ON users(api_request_count);

-- Create atomic increment function for usage tracking
CREATE OR REPLACE FUNCTION increment_usage(uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE users SET api_request_count = api_request_count + 1 WHERE id = uid;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing users with default values
UPDATE users SET api_request_count = 0 WHERE api_request_count IS NULL;
