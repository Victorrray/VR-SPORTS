# Team Logos Cache Implementation Guide

## Overview

This implementation adds a persistent team logos cache to the VR-Odds platform. It ensures that team logos from the ESPN API are stored in Supabase, preventing data loss and enabling quick retrieval without repeated API calls.

## Problem Statement

Currently, team logos are fetched from the ESPN API on every request but are not persisted. This means:
- ❌ Logos can be lost if ESPN API is unavailable
- ❌ Repeated API calls waste bandwidth and quota
- ❌ No way to track which teams are missing logos
- ❌ No fallback if ESPN changes their logo URLs

## Solution

A comprehensive logo caching system with:
- ✅ Persistent storage in Supabase
- ✅ Automatic logo verification and tracking
- ✅ Coverage statistics and monitoring
- ✅ Batch processing for efficiency
- ✅ Fallback mechanisms for missing logos

## Architecture

### Database Schema

**Table: `team_logos_cache`**

```sql
- id (UUID): Primary key
- team_id (TEXT): Unique team identifier
- team_name (TEXT): Team name
- team_display_name (TEXT): Display name
- sport_key (TEXT): Sport identifier (e.g., 'americanfootball_nfl')
- logo_url (TEXT): Primary logo URL
- logo_url_alt (TEXT): Alternative logo URL
- logo_format (TEXT): Format (png, svg, jpg)
- logo_size_small (TEXT): 80x80 logo URL
- logo_size_medium (TEXT): 200x200 logo URL
- logo_size_large (TEXT): 500x500 logo URL
- is_available (BOOLEAN): Whether logo is available
- has_been_verified (BOOLEAN): Whether logo has been verified
- verification_attempts (INTEGER): Number of verification attempts
- last_verification_at (TIMESTAMPTZ): Last verification time
- created_at (TIMESTAMPTZ): Creation timestamp
- updated_at (TIMESTAMPTZ): Last update timestamp
- last_fetched_from_api (TIMESTAMPTZ): Last API fetch time
- cache_expires_at (TIMESTAMPTZ): Cache expiration (30 days)
```

### Key Functions

#### `upsert_team_logo()`
Inserts or updates a team logo in the cache.

```sql
SELECT upsert_team_logo(
  'nfl_team_123',
  'New York Giants',
  'NYG',
  'americanfootball_nfl',
  'https://a.espncdn.com/media/motion/2022/1201/dm_221201_nfl_giants_logo.png'
);
```

#### `get_team_logo()`
Retrieves a cached team logo.

```sql
SELECT * FROM get_team_logo('nfl_team_123', 'americanfootball_nfl');
```

#### `get_missing_team_logos()`
Finds teams with missing logos for monitoring.

```sql
SELECT * FROM get_missing_team_logos('americanfootball_nfl', 100);
```

#### `get_logo_statistics()`
Gets coverage statistics by sport.

```sql
SELECT * FROM get_logo_statistics('americanfootball_nfl');
```

#### `mark_logo_verified()`
Marks a logo as verified or unavailable.

```sql
SELECT mark_logo_verified('nfl_team_123', 'americanfootball_nfl', true);
```

## Implementation Steps

### Step 1: Run Migration

Execute the migration to create the table and functions:

```bash
# In Supabase SQL Editor, run:
-- Copy contents of server/migrations/007_team_logos_cache.sql
```

Or via command line:
```bash
psql -h [HOST] -U [USER] -d [DB] -f server/migrations/007_team_logos_cache.sql
```

### Step 2: Update Server Code

In `server/index.js`, integrate logo caching when fetching scores:

```javascript
const LogoCache = require('./utils/logoCache');

// When processing ESPN scores
app.get('/api/scores/:sport', async (req, res) => {
  const { sport } = req.params;
  
  try {
    // Fetch from ESPN
    const games = await fetchFromESPN(sport);
    
    // Cache logos
    await LogoCache.batchStoreLogo(games, sport);
    
    // Return games with logos
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 3: Use Logo Cache in Frontend

In React components, retrieve logos from cache:

```javascript
import { useEffect, useState } from 'react';

function TeamLogo({ teamId, sportKey }) {
  const [logo, setLogo] = useState(null);
  
  useEffect(() => {
    const fetchLogo = async () => {
      const response = await fetch(
        `/api/team-logo/${teamId}?sport=${sportKey}`
      );
      const data = await response.json();
      setLogo(data.logo_url);
    };
    
    fetchLogo();
  }, [teamId, sportKey]);
  
  return logo ? (
    <img src={logo} alt="Team Logo" />
  ) : (
    <div>No Logo</div>
  );
}
```

### Step 4: Add API Endpoint for Logo Retrieval

In `server/index.js`:

```javascript
app.get('/api/team-logo/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { sport } = req.query;
  
  try {
    const LogoCache = require('./utils/logoCache');
    const logo = await LogoCache.getLogoWithFallback(teamId, sport);
    
    res.json(logo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Usage Examples

### JavaScript/Node.js

```javascript
const LogoCache = require('./utils/logoCache');

// Store a logo
await LogoCache.upsertLogo({
  teamId: 'nfl_team_123',
  teamName: 'New York Giants',
  teamDisplayName: 'NYG',
  sportKey: 'americanfootball_nfl',
  logoUrl: 'https://a.espncdn.com/media/...'
});

// Retrieve a logo
const logo = await LogoCache.getLogo('nfl_team_123', 'americanfootball_nfl');

// Get missing logos
const missing = await LogoCache.getMissingLogos('americanfootball_nfl');

// Get statistics
const stats = await LogoCache.getLogoStatistics('americanfootball_nfl');

// Log coverage report
await LogoCache.logCoverageReport();
```

## Monitoring & Debugging

### Check Logo Coverage

```sql
SELECT * FROM get_logo_statistics();
```

Output:
```
sport_key              | total_teams | teams_with_logos | coverage_percentage
-----------------------+-------------+------------------+--------------------
americanfootball_nfl   |      32     |        32        |      100.00
basketball_nba         |      30     |        30        |      100.00
baseball_mlb           |      30     |        30        |      100.00
```

### Find Missing Logos

```sql
SELECT * FROM get_missing_team_logos('americanfootball_nfl');
```

### View Cache Statistics

```javascript
const stats = await LogoCache.getLogoStatistics();
console.table(stats);
```

### Log Coverage Report

```javascript
await LogoCache.logCoverageReport();
```

Output:
```
📊 TEAM LOGO COVERAGE REPORT
════════════════════════════════════════════════════════

americanfootball_nfl
  Total Teams: 32
  With Logos: 32/32
  Missing: 0
  Verified: 32
  Coverage: 100% [████████████████████]

basketball_nba
  Total Teams: 30
  With Logos: 30/30
  Missing: 0
  Verified: 30
  Coverage: 100% [████████████████████]
```

## Cache Expiration

- **Default TTL**: 30 days
- **Automatic Refresh**: When `upsert_team_logo()` is called
- **Manual Refresh**: Update `cache_expires_at` to extend

```sql
UPDATE team_logos_cache
SET cache_expires_at = NOW() + INTERVAL '30 days'
WHERE sport_key = 'americanfootball_nfl';
```

## Performance Considerations

### Indexes
- `idx_team_logos_team_id`: Fast lookup by team
- `idx_team_logos_sport`: Fast lookup by sport
- `idx_team_logos_available`: Fast filtering of available logos
- `idx_team_logos_missing`: Fast identification of missing logos
- `idx_team_logos_sport_available`: Combined sport + availability filter

### Query Performance
- **Get Logo**: O(1) - Indexed lookup
- **Get Missing**: O(n) - Full table scan with filter
- **Get Statistics**: O(n) - Aggregation query
- **Batch Store**: O(n) - Multiple inserts with upsert

## Troubleshooting

### No Logos Appearing

1. Check if migration was applied:
```sql
SELECT COUNT(*) FROM team_logos_cache;
```

2. Verify logos are being cached:
```sql
SELECT * FROM get_missing_team_logos() LIMIT 5;
```

3. Check API endpoint is working:
```bash
curl http://localhost:3000/api/team-logo/nfl_team_123?sport=americanfootball_nfl
```

### Logos Not Updating

1. Check `last_fetched_from_api` timestamp:
```sql
SELECT team_id, last_fetched_from_api FROM team_logos_cache LIMIT 5;
```

2. Verify `cache_expires_at` hasn't passed:
```sql
SELECT * FROM team_logos_cache WHERE cache_expires_at < NOW();
```

3. Manually refresh cache:
```sql
UPDATE team_logos_cache
SET cache_expires_at = NOW()
WHERE sport_key = 'americanfootball_nfl';
```

## Future Enhancements

1. **Logo Validation**: Verify URLs are still valid (HTTP HEAD requests)
2. **CDN Integration**: Store logos on CDN for faster delivery
3. **Batch Verification**: Periodic verification of all cached logos
4. **Logo Variants**: Store light/dark mode variants
5. **Analytics**: Track logo usage and popularity
6. **Automatic Cleanup**: Remove expired entries automatically

## Related Files

- **Migration**: `server/migrations/007_team_logos_cache.sql`
- **Utility**: `server/utils/logoCache.js`
- **Server Integration**: `server/index.js` (scores endpoint)
- **Frontend**: React components using logo cache

## Support

For issues or questions about the logo cache implementation, refer to:
- Database schema: `team_logos_cache` table
- Functions: `upsert_team_logo()`, `get_team_logo()`, etc.
- Utility: `LogoCache` class in `server/utils/logoCache.js`
