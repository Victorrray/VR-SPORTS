# Supabase Migrations

This directory contains SQL migrations for the VR-Odds platform's Supabase database.

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the migration SQL
5. Click **Run** to execute

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push
```

## Migration Files

### 005_sports_cache.sql
**Purpose:** Create sports cache table to reduce API calls to The Odds API

**What it does:**
- Creates `sports_cache` table to store sports list
- Creates indexes for performance
- Creates `get_active_sports()` function to retrieve cached sports
- Creates `refresh_sports_cache()` function to update cache
- Inserts initial popular sports data

**Tables Created:**
- `sports_cache` - Main cache table with 24-hour expiry

**Functions Created:**
- `get_active_sports()` - Returns active sports from cache
- `refresh_sports_cache(sport_key, title, group_name, active)` - Upserts sport into cache
- `update_sports_cache_timestamp()` - Auto-updates timestamp on changes

**How the API uses it:**
1. `/api/sports` endpoint first checks Supabase cache
2. If cache miss, fetches from The Odds API
3. Updates Supabase cache with fresh data
4. Cache expires after 24 hours

**Benefits:**
- Reduces API calls to The Odds API (saves money)
- Faster response times (database is faster than external API)
- Automatic cache invalidation after 24 hours
- Fallback to memory cache if Supabase is unavailable

## Running the Sports Cache Migration

```bash
# Copy the SQL from 005_sports_cache.sql
cat server/migrations/005_sports_cache.sql

# Then paste into Supabase SQL Editor and run
```

## Verifying the Migration

After running the migration, verify it worked:

```sql
-- Check if table exists
SELECT * FROM sports_cache LIMIT 5;

-- Check if function works
SELECT * FROM get_active_sports();

-- Test refresh function
SELECT refresh_sports_cache('test_sport', 'Test Sport', 'Test Group', true);
```

## Rollback (if needed)

```sql
-- Drop functions
DROP FUNCTION IF EXISTS get_active_sports();
DROP FUNCTION IF EXISTS refresh_sports_cache(TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS update_sports_cache_timestamp();

-- Drop trigger
DROP TRIGGER IF EXISTS sports_cache_updated_at ON sports_cache;

-- Drop table
DROP TABLE IF EXISTS sports_cache;
```
