-- Migration: Team Logos Cache Table
-- Purpose: Store team logos from ESPN API to ensure we always have them available
-- Benefits: Reduces API calls, ensures logo availability, tracks missing logos

-- Create team_logos_cache table
CREATE TABLE IF NOT EXISTS team_logos_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Team identification
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_display_name TEXT,
  sport_key TEXT NOT NULL, -- e.g., 'americanfootball_nfl', 'basketball_nba'
  
  -- Logo data
  logo_url TEXT,
  logo_url_alt TEXT, -- Alternative logo URL if primary fails
  logo_format TEXT, -- 'png', 'svg', 'jpg'
  logo_size_small TEXT, -- URL for small logo (80x80)
  logo_size_medium TEXT, -- URL for medium logo (200x200)
  logo_size_large TEXT, -- URL for large logo (500x500)
  
  -- Logo status tracking
  is_available BOOLEAN DEFAULT true,
  has_been_verified BOOLEAN DEFAULT false,
  verification_attempts INTEGER DEFAULT 0,
  last_verification_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_fetched_from_api TIMESTAMPTZ,
  
  -- Caching info
  cache_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(team_id, sport_key)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_logos_team_id ON team_logos_cache(team_id);
CREATE INDEX IF NOT EXISTS idx_team_logos_sport ON team_logos_cache(sport_key);
CREATE INDEX IF NOT EXISTS idx_team_logos_available ON team_logos_cache(is_available);
CREATE INDEX IF NOT EXISTS idx_team_logos_missing ON team_logos_cache(is_available, logo_url) WHERE logo_url IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_logos_expires ON team_logos_cache(cache_expires_at);
CREATE INDEX IF NOT EXISTS idx_team_logos_sport_available ON team_logos_cache(sport_key, is_available);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_logos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS team_logos_updated_at ON team_logos_cache;
CREATE TRIGGER team_logos_updated_at
  BEFORE UPDATE ON team_logos_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_team_logos_timestamp();

-- Function to store or update team logo
CREATE OR REPLACE FUNCTION upsert_team_logo(
  p_team_id TEXT,
  p_team_name TEXT,
  p_team_display_name TEXT,
  p_sport_key TEXT,
  p_logo_url TEXT,
  p_logo_url_alt TEXT DEFAULT NULL,
  p_logo_format TEXT DEFAULT 'png'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO team_logos_cache (
    team_id,
    team_name,
    team_display_name,
    sport_key,
    logo_url,
    logo_url_alt,
    logo_format,
    last_fetched_from_api
  ) VALUES (
    p_team_id,
    p_team_name,
    p_team_display_name,
    p_sport_key,
    p_logo_url,
    p_logo_url_alt,
    p_logo_format,
    NOW()
  )
  ON CONFLICT (team_id, sport_key)
  DO UPDATE SET
    team_name = COALESCE(EXCLUDED.team_name, team_logos_cache.team_name),
    team_display_name = COALESCE(EXCLUDED.team_display_name, team_logos_cache.team_display_name),
    logo_url = COALESCE(EXCLUDED.logo_url, team_logos_cache.logo_url),
    logo_url_alt = COALESCE(EXCLUDED.logo_url_alt, team_logos_cache.logo_url_alt),
    logo_format = COALESCE(EXCLUDED.logo_format, team_logos_cache.logo_format),
    last_fetched_from_api = NOW(),
    cache_expires_at = NOW() + INTERVAL '30 days',
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get team logo by ID and sport
CREATE OR REPLACE FUNCTION get_team_logo(
  p_team_id TEXT,
  p_sport_key TEXT
)
RETURNS TABLE (
  team_id TEXT,
  team_name TEXT,
  team_display_name TEXT,
  logo_url TEXT,
  logo_url_alt TEXT,
  is_available BOOLEAN,
  has_been_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tlc.team_id,
    tlc.team_name,
    tlc.team_display_name,
    tlc.logo_url,
    tlc.logo_url_alt,
    tlc.is_available,
    tlc.has_been_verified
  FROM team_logos_cache tlc
  WHERE tlc.team_id = p_team_id
    AND tlc.sport_key = p_sport_key;
END;
$$ LANGUAGE plpgsql;

-- Function to find missing logos (for monitoring)
CREATE OR REPLACE FUNCTION get_missing_team_logos(
  p_sport_key TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  team_id TEXT,
  team_name TEXT,
  sport_key TEXT,
  verification_attempts INTEGER,
  last_verification_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tlc.team_id,
    tlc.team_name,
    tlc.sport_key,
    tlc.verification_attempts,
    tlc.last_verification_at,
    tlc.created_at
  FROM team_logos_cache tlc
  WHERE (p_sport_key IS NULL OR tlc.sport_key = p_sport_key)
    AND (tlc.logo_url IS NULL OR tlc.logo_url = '')
  ORDER BY tlc.verification_attempts DESC, tlc.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to mark logo as verified
CREATE OR REPLACE FUNCTION mark_logo_verified(
  p_team_id TEXT,
  p_sport_key TEXT,
  p_is_available BOOLEAN
)
RETURNS void AS $$
BEGIN
  UPDATE team_logos_cache
  SET 
    has_been_verified = true,
    is_available = p_is_available,
    last_verification_at = NOW(),
    verification_attempts = verification_attempts + 1
  WHERE team_id = p_team_id
    AND sport_key = p_sport_key;
END;
$$ LANGUAGE plpgsql;

-- Function to get logo statistics by sport
CREATE OR REPLACE FUNCTION get_logo_statistics(
  p_sport_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  sport_key TEXT,
  total_teams INTEGER,
  teams_with_logos INTEGER,
  teams_missing_logos INTEGER,
  verified_logos INTEGER,
  unverified_logos INTEGER,
  coverage_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(tlc.sport_key, p_sport_key) as sport_key,
    COUNT(*)::INTEGER as total_teams,
    COUNT(CASE WHEN tlc.logo_url IS NOT NULL AND tlc.logo_url != '' THEN 1 END)::INTEGER as teams_with_logos,
    COUNT(CASE WHEN tlc.logo_url IS NULL OR tlc.logo_url = '' THEN 1 END)::INTEGER as teams_missing_logos,
    COUNT(CASE WHEN tlc.has_been_verified = true THEN 1 END)::INTEGER as verified_logos,
    COUNT(CASE WHEN tlc.has_been_verified = false THEN 1 END)::INTEGER as unverified_logos,
    ROUND((COUNT(CASE WHEN tlc.logo_url IS NOT NULL AND tlc.logo_url != '' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as coverage_percentage
  FROM team_logos_cache tlc
  WHERE p_sport_key IS NULL OR tlc.sport_key = p_sport_key
  GROUP BY tlc.sport_key;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
-- GRANT SELECT ON team_logos_cache TO authenticated;
-- GRANT EXECUTE ON FUNCTION upsert_team_logo(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_team_logo(TEXT, TEXT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_missing_team_logos(TEXT, INTEGER) TO authenticated;
-- GRANT EXECUTE ON FUNCTION mark_logo_verified(TEXT, TEXT, BOOLEAN) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_logo_statistics(TEXT) TO authenticated;

-- Add comments
COMMENT ON TABLE team_logos_cache IS 'Cached team logos from ESPN API with verification tracking';
COMMENT ON FUNCTION upsert_team_logo(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Insert or update team logo in cache';
COMMENT ON FUNCTION get_team_logo(TEXT, TEXT) IS 'Retrieve team logo by team ID and sport';
COMMENT ON FUNCTION get_missing_team_logos(TEXT, INTEGER) IS 'Find teams with missing logos for monitoring';
COMMENT ON FUNCTION mark_logo_verified(TEXT, TEXT, BOOLEAN) IS 'Mark a logo as verified or unavailable';
COMMENT ON FUNCTION get_logo_statistics(TEXT) IS 'Get logo coverage statistics by sport';
