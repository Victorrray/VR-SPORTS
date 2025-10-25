# Team Logos Cache - Setup Checklist

## Quick Start (5 minutes)

### ✅ Phase 1: Database Setup (2 minutes)

- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Create new query
- [ ] Copy contents of `server/migrations/007_team_logos_cache.sql`
- [ ] Execute the migration
- [ ] Verify table created: `SELECT COUNT(*) FROM team_logos_cache;` (should return 0)

### ✅ Phase 2: Server Integration (2 minutes)

- [ ] Copy `server/utils/logoCache.js` to your server utils directory
- [ ] Verify file location: `/server/utils/logoCache.js`
- [ ] Check that Supabase client is available in `server/config/supabase.js`

### ✅ Phase 3: API Endpoint (1 minute)

Add this to `server/index.js`:

```javascript
// Team Logo Cache Endpoint
app.get('/api/team-logo/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { sport } = req.query;
  
  if (!teamId || !sport) {
    return res.status(400).json({ error: 'Missing teamId or sport' });
  }
  
  try {
    const LogoCache = require('./utils/logoCache');
    const logo = await LogoCache.getLogoWithFallback(teamId, sport);
    res.json(logo);
  } catch (error) {
    console.error('Error fetching logo:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## Integration with Scores Endpoint

### ✅ Phase 4: Auto-Cache Logos (3 minutes)

In `server/index.js`, find your scores endpoint and add logo caching:

**Before:**
```javascript
app.get('/api/scores/:sport', async (req, res) => {
  const games = await fetchFromESPN(sport);
  res.json(games);
});
```

**After:**
```javascript
app.get('/api/scores/:sport', async (req, res) => {
  const LogoCache = require('./utils/logoCache');
  const games = await fetchFromESPN(sport);
  
  // Cache logos in background (don't wait)
  LogoCache.batchStoreLogo(games, sport).catch(err => {
    console.error('Logo caching error:', err);
  });
  
  res.json(games);
});
```

## Verification Steps

### ✅ Test Database

```sql
-- Check table exists
SELECT COUNT(*) FROM team_logos_cache;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%logo%';
```

### ✅ Test Server

```bash
# Start server
npm start

# Test logo endpoint
curl "http://localhost:3000/api/team-logo/nfl_team_123?sport=americanfootball_nfl"

# Should return:
# {"url":null,"source":"none","verified":false}
```

### ✅ Test Caching

```javascript
// In Node REPL or test file
const LogoCache = require('./utils/logoCache');

// Test upsert
await LogoCache.upsertLogo({
  teamId: 'test_team_123',
  teamName: 'Test Team',
  teamDisplayName: 'TT',
  sportKey: 'americanfootball_nfl',
  logoUrl: 'https://example.com/logo.png'
});

// Test retrieve
const logo = await LogoCache.getLogo('test_team_123', 'americanfootball_nfl');
console.log(logo);
```

## Monitoring Setup

### ✅ Phase 5: Add Monitoring Endpoints (Optional)

Add these endpoints to `server/index.js` for debugging:

```javascript
// Get logo statistics
app.get('/api/admin/logo-stats/:sport?', async (req, res) => {
  const { sport } = req.params;
  try {
    const LogoCache = require('./utils/logoCache');
    const stats = await LogoCache.getLogoStatistics(sport || null);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get missing logos
app.get('/api/admin/missing-logos/:sport?', async (req, res) => {
  const { sport } = req.params;
  const { limit = 100 } = req.query;
  try {
    const LogoCache = require('./utils/logoCache');
    const missing = await LogoCache.getMissingLogos(sport || null, parseInt(limit));
    res.json(missing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### ✅ Test Monitoring

```bash
# Check statistics
curl "http://localhost:3000/api/admin/logo-stats/americanfootball_nfl"

# Check missing logos
curl "http://localhost:3000/api/admin/missing-logos/americanfootball_nfl?limit=10"
```

## Frontend Integration (Optional)

### ✅ Phase 6: Use in React Components

```javascript
// TeamLogo.jsx
import { useEffect, useState } from 'react';

export function TeamLogo({ teamId, sportKey, size = 'medium' }) {
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(
          `/api/team-logo/${teamId}?sport=${sportKey}`
        );
        const data = await response.json();
        setLogo(data.url);
      } catch (error) {
        console.error('Error fetching logo:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogo();
  }, [teamId, sportKey]);
  
  if (loading) return <div className="logo-skeleton" />;
  
  return logo ? (
    <img 
      src={logo} 
      alt={`${teamId} logo`}
      className={`team-logo team-logo-${size}`}
    />
  ) : (
    <div className="logo-placeholder">No Logo</div>
  );
}
```

## Troubleshooting

### Issue: Table not created

**Solution:**
```sql
-- Check if table exists
\dt team_logos_cache

-- If not, re-run migration
-- Copy and paste contents of server/migrations/007_team_logos_cache.sql
```

### Issue: Functions not found

**Solution:**
```sql
-- List all functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- If missing, re-run migration
```

### Issue: Logo endpoint returns 500 error

**Solution:**
```javascript
// Check Supabase connection
const supabase = require('./config/supabase');
console.log('Supabase connected:', !!supabase);

// Check LogoCache import
const LogoCache = require('./utils/logoCache');
console.log('LogoCache loaded:', !!LogoCache);
```

### Issue: Logos not being cached

**Solution:**
```javascript
// Check if batchStoreLogo is being called
console.log('Calling batchStoreLogo...');
const result = await LogoCache.batchStoreLogo(games, sport);
console.log('Result:', result);

// Check database
SELECT COUNT(*) FROM team_logos_cache;
```

## Performance Checklist

- [ ] All 6 indexes created successfully
- [ ] Logo retrieval queries execute in <10ms
- [ ] Batch operations process 100+ logos/second
- [ ] Statistics queries complete in <100ms
- [ ] Cache expiration set to 30 days

## Deployment Checklist

- [ ] Migration applied to production database
- [ ] `logoCache.js` deployed to production server
- [ ] API endpoints tested in production
- [ ] Monitoring endpoints accessible
- [ ] Logo caching working for all sports
- [ ] Coverage statistics showing >90% for major sports

## Next Steps

1. **Immediate**: Run migration and test endpoints
2. **Short-term**: Integrate with scores endpoint
3. **Medium-term**: Add monitoring dashboard
4. **Long-term**: Add logo validation and CDN integration

## Support Resources

- **Migration**: `server/migrations/007_team_logos_cache.sql`
- **Utility**: `server/utils/logoCache.js`
- **Guide**: `TEAM_LOGOS_CACHE_IMPLEMENTATION.md`
- **Supabase Docs**: https://supabase.com/docs
- **ESPN API**: https://developer.espn.com/

## Questions?

Refer to the comprehensive implementation guide:
`TEAM_LOGOS_CACHE_IMPLEMENTATION.md`
