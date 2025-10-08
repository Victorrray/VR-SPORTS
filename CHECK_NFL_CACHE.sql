-- Check what's in the cached_odds table for NFL
-- Run this in Supabase SQL Editor

-- 1. Check if NFL data exists
SELECT 
  sport_key,
  COUNT(*) as total_entries,
  COUNT(DISTINCT event_id) as unique_games,
  COUNT(DISTINCT market_key) as unique_markets,
  MIN(created_at) as first_cached,
  MAX(created_at) as last_cached,
  MAX(expires_at) as cache_expires,
  CASE 
    WHEN MAX(expires_at) > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as cache_status
FROM cached_odds
WHERE sport_key = 'americanfootball_nfl'
GROUP BY sport_key;

-- 2. Check all sports in cache
SELECT 
  sport_key,
  COUNT(*) as entries,
  COUNT(DISTINCT event_id) as games,
  MAX(expires_at) as expires,
  CASE 
    WHEN MAX(expires_at) > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as status
FROM cached_odds
GROUP BY sport_key
ORDER BY MAX(created_at) DESC;

-- 3. Check if there's any NFL data (even expired)
SELECT 
  event_id,
  home_team,
  away_team,
  market_key,
  bookmaker_key,
  created_at,
  expires_at,
  CASE 
    WHEN expires_at > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as status
FROM cached_odds
WHERE sport_key = 'americanfootball_nfl'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cached_odds'
ORDER BY ordinal_position;
