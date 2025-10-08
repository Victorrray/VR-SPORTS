-- Migration: Cached Odds System for NFL
-- This migration creates tables and functions for caching odds data from The Odds API

-- Create cached_odds table for storing odds data
CREATE TABLE IF NOT EXISTS cached_odds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_key TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  commence_time TIMESTAMPTZ NOT NULL,
  bookmaker_key TEXT NOT NULL,
  market_key TEXT NOT NULL,
  outcomes JSONB NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Composite unique constraint to prevent duplicates
  UNIQUE(sport_key, event_id, bookmaker_key, market_key)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cached_odds_sport_event ON cached_odds(sport_key, event_id);
CREATE INDEX IF NOT EXISTS idx_cached_odds_expires ON cached_odds(expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_odds_bookmaker ON cached_odds(bookmaker_key);
CREATE INDEX IF NOT EXISTS idx_cached_odds_market ON cached_odds(market_key);
CREATE INDEX IF NOT EXISTS idx_cached_odds_commence ON cached_odds(commence_time);

-- Create cached_events table for event metadata
CREATE TABLE IF NOT EXISTS cached_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_key TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  commence_time TIMESTAMPTZ NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for cached_events
CREATE INDEX IF NOT EXISTS idx_cached_events_sport ON cached_events(sport_key);
CREATE INDEX IF NOT EXISTS idx_cached_events_commence ON cached_events(commence_time);
CREATE INDEX IF NOT EXISTS idx_cached_events_expires ON cached_events(expires_at);

-- Create odds_update_log table for tracking updates
CREATE TABLE IF NOT EXISTS odds_update_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_key TEXT NOT NULL,
  update_type TEXT NOT NULL, -- 'main_lines', 'player_props', 'full_refresh'
  events_updated INTEGER DEFAULT 0,
  odds_updated INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for update log
CREATE INDEX IF NOT EXISTS idx_odds_update_log_sport ON odds_update_log(sport_key);
CREATE INDEX IF NOT EXISTS idx_odds_update_log_started ON odds_update_log(started_at DESC);

-- Function to clean up expired odds
CREATE OR REPLACE FUNCTION cleanup_expired_odds()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cached_odds WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM cached_events WHERE expires_at < NOW();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cached odds for a sport
CREATE OR REPLACE FUNCTION get_cached_odds(
  p_sport_key TEXT,
  p_market_keys TEXT[] DEFAULT NULL,
  p_bookmaker_keys TEXT[] DEFAULT NULL,
  p_include_expired BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  event_id TEXT,
  event_name TEXT,
  commence_time TIMESTAMPTZ,
  bookmaker_key TEXT,
  market_key TEXT,
  outcomes JSONB,
  last_updated TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    co.event_id,
    co.event_name,
    co.commence_time,
    co.bookmaker_key,
    co.market_key,
    co.outcomes,
    co.last_updated
  FROM cached_odds co
  WHERE co.sport_key = p_sport_key
    AND (p_market_keys IS NULL OR co.market_key = ANY(p_market_keys))
    AND (p_bookmaker_keys IS NULL OR co.bookmaker_key = ANY(p_bookmaker_keys))
    AND (p_include_expired OR co.expires_at > NOW())
  ORDER BY co.commence_time, co.event_id, co.bookmaker_key, co.market_key;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert odds data
CREATE OR REPLACE FUNCTION upsert_cached_odds(
  p_sport_key TEXT,
  p_event_id TEXT,
  p_event_name TEXT,
  p_commence_time TIMESTAMPTZ,
  p_bookmaker_key TEXT,
  p_market_key TEXT,
  p_outcomes JSONB,
  p_expires_at TIMESTAMPTZ,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO cached_odds (
    sport_key, event_id, event_name, commence_time,
    bookmaker_key, market_key, outcomes, expires_at, metadata
  ) VALUES (
    p_sport_key, p_event_id, p_event_name, p_commence_time,
    p_bookmaker_key, p_market_key, p_outcomes, p_expires_at, p_metadata
  )
  ON CONFLICT (sport_key, event_id, bookmaker_key, market_key)
  DO UPDATE SET
    event_name = EXCLUDED.event_name,
    commence_time = EXCLUDED.commence_time,
    outcomes = EXCLUDED.outcomes,
    last_updated = NOW(),
    expires_at = EXCLUDED.expires_at,
    metadata = EXCLUDED.metadata
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE cached_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds_update_log ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (odds are public data)
CREATE POLICY "Public read access to cached odds"
  ON cached_odds FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access to cached events"
  ON cached_events FOR SELECT
  TO public
  USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access to cached odds"
  ON cached_odds FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to cached events"
  ON cached_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to update log"
  ON odds_update_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON cached_odds TO anon, authenticated;
GRANT SELECT ON cached_events TO anon, authenticated;
GRANT ALL ON cached_odds TO service_role;
GRANT ALL ON cached_events TO service_role;
GRANT ALL ON odds_update_log TO service_role;
