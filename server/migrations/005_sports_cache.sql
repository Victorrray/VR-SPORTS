-- Migration: Sports Cache Table
-- Purpose: Cache sports list from The Odds API to reduce API calls and improve performance

-- Create sports_cache table
CREATE TABLE IF NOT EXISTS sports_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  has_outrights BOOLEAN DEFAULT false,
  group_name TEXT, -- e.g., "Major US Sports", "Soccer", "Combat Sports"
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Caching info
  cache_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sports_cache_active ON sports_cache(active);
CREATE INDEX IF NOT EXISTS idx_sports_cache_group ON sports_cache(group_name);
CREATE INDEX IF NOT EXISTS idx_sports_cache_expires ON sports_cache(cache_expires_at);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sports_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS sports_cache_updated_at ON sports_cache;
CREATE TRIGGER sports_cache_updated_at
  BEFORE UPDATE ON sports_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_sports_cache_timestamp();

-- Insert initial popular sports data
INSERT INTO sports_cache (sport_key, title, group_name, active) VALUES
  -- Major US Sports
  ('americanfootball_nfl', 'NFL', 'Major US Sports', true),
  ('americanfootball_ncaaf', 'NCAAF', 'Major US Sports', true),
  ('basketball_nba', 'NBA', 'Major US Sports', true),
  ('basketball_ncaab', 'NCAAB', 'Major US Sports', true),
  ('baseball_mlb', 'MLB', 'Major US Sports', true),
  ('icehockey_nhl', 'NHL', 'Major US Sports', true),
  
  -- Soccer
  ('soccer_epl', 'EPL', 'Soccer', true),
  ('soccer_uefa_champs_league', 'Champions League', 'Soccer', true),
  ('soccer_mls', 'MLS', 'Soccer', true),
  ('soccer_spain_la_liga', 'La Liga', 'Soccer', true),
  ('soccer_germany_bundesliga', 'Bundesliga', 'Soccer', true),
  ('soccer_italy_serie_a', 'Serie A', 'Soccer', true),
  
  -- Combat Sports
  ('mma_mixed_martial_arts', 'MMA', 'Combat Sports', true),
  ('boxing_boxing', 'Boxing', 'Combat Sports', true)
ON CONFLICT (sport_key) DO NOTHING;

-- Create function to get active sports
CREATE OR REPLACE FUNCTION get_active_sports()
RETURNS TABLE (
  sport_key TEXT,
  title TEXT,
  group_name TEXT,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.sport_key,
    sc.title,
    sc.group_name,
    sc.active
  FROM sports_cache sc
  WHERE sc.active = true
    AND (sc.cache_expires_at IS NULL OR sc.cache_expires_at > NOW())
  ORDER BY 
    CASE sc.group_name
      WHEN 'Major US Sports' THEN 1
      WHEN 'Soccer' THEN 2
      WHEN 'Combat Sports' THEN 3
      ELSE 4
    END,
    sc.title;
END;
$$ LANGUAGE plpgsql;

-- Create function to refresh sports cache
CREATE OR REPLACE FUNCTION refresh_sports_cache(
  p_sport_key TEXT,
  p_title TEXT,
  p_group_name TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
  INSERT INTO sports_cache (sport_key, title, group_name, active, last_fetched_at, cache_expires_at)
  VALUES (p_sport_key, p_title, p_group_name, p_active, NOW(), NOW() + INTERVAL '24 hours')
  ON CONFLICT (sport_key) 
  DO UPDATE SET
    title = EXCLUDED.title,
    group_name = COALESCE(EXCLUDED.group_name, sports_cache.group_name),
    active = EXCLUDED.active,
    last_fetched_at = NOW(),
    cache_expires_at = NOW() + INTERVAL '24 hours',
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust role name as needed)
-- GRANT SELECT ON sports_cache TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_active_sports() TO authenticated;
-- GRANT EXECUTE ON FUNCTION refresh_sports_cache(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

COMMENT ON TABLE sports_cache IS 'Cached sports list from The Odds API to reduce API calls';
COMMENT ON FUNCTION get_active_sports() IS 'Returns list of active sports with valid cache';
COMMENT ON FUNCTION refresh_sports_cache(TEXT, TEXT, TEXT, BOOLEAN) IS 'Upserts a sport into the cache with 24-hour expiry';
