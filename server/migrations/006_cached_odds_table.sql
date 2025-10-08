-- Migration: Cached Odds Table
-- Purpose: Cache odds data from The Odds API to reduce API calls and improve performance

-- Create cached_odds table
CREATE TABLE IF NOT EXISTS cached_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sport and event identification
  sport_key TEXT NOT NULL,
  event_id TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  commence_time TIMESTAMPTZ,
  
  -- Bookmaker and market
  bookmaker_key TEXT NOT NULL,
  bookmaker_title TEXT,
  market_key TEXT NOT NULL,
  
  -- Odds data (stored as JSONB for flexibility)
  odds_data JSONB NOT NULL,
  
  -- Metadata
  last_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  
  -- Composite unique constraint to prevent duplicates
  CONSTRAINT cached_odds_unique UNIQUE (sport_key, event_id, bookmaker_key, market_key)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cached_odds_sport ON cached_odds(sport_key);
CREATE INDEX IF NOT EXISTS idx_cached_odds_event ON cached_odds(event_id);
CREATE INDEX IF NOT EXISTS idx_cached_odds_expires ON cached_odds(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_odds_sport_event ON cached_odds(sport_key, event_id);
CREATE INDEX IF NOT EXISTS idx_cached_odds_market ON cached_odds(market_key);

-- Create index for active (non-expired) odds
CREATE INDEX IF NOT EXISTS idx_cached_odds_active 
  ON cached_odds(sport_key, expires_at) 
  WHERE expires_at > NOW();

-- Add comment
COMMENT ON TABLE cached_odds IS 'Cached odds data from The Odds API with 5-minute TTL';
COMMENT ON COLUMN cached_odds.odds_data IS 'JSONB array of outcomes with name, price, point, etc.';
COMMENT ON COLUMN cached_odds.expires_at IS 'Cache expiration time (default 5 minutes from creation)';

-- Create function to clean up expired cache entries (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_odds()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cached_odds
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_odds() IS 'Removes cached odds older than 1 hour past expiration';

-- Create cached_events table for event metadata
CREATE TABLE IF NOT EXISTS cached_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  commence_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT cached_events_unique UNIQUE (sport_key, event_id)
);

-- Create indexes for cached_events
CREATE INDEX IF NOT EXISTS idx_cached_events_sport ON cached_events(sport_key);
CREATE INDEX IF NOT EXISTS idx_cached_events_commence ON cached_events(commence_time);

COMMENT ON TABLE cached_events IS 'Cached event metadata from The Odds API';

-- Create odds_update_log table for tracking updates
CREATE TABLE IF NOT EXISTS odds_update_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key TEXT NOT NULL,
  update_type TEXT NOT NULL, -- 'full_refresh', 'incremental', 'player_props'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  events_updated INTEGER DEFAULT 0,
  odds_updated INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for update logs
CREATE INDEX IF NOT EXISTS idx_odds_update_log_sport ON odds_update_log(sport_key);
CREATE INDEX IF NOT EXISTS idx_odds_update_log_started ON odds_update_log(started_at DESC);

COMMENT ON TABLE odds_update_log IS 'Log of odds cache update operations';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON cached_odds TO authenticated;
-- GRANT SELECT ON cached_events TO authenticated;
-- GRANT SELECT ON odds_update_log TO authenticated;
