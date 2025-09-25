# Alternate Markets Optimization

## Changes Implemented

We've made two key optimizations to improve the handling of alternate markets in the VR-Odds platform:

### 1. Added Team Totals to Default Market Selection

**File Changed**: `/client/src/pages/SportsbookMarkets.js`

```javascript
// Before
const [marketKeys, setMarketKeys] = useState(["h2h", "spreads", "totals"]);

// After
const [marketKeys, setMarketKeys] = useState(["h2h", "spreads", "totals", "team_totals"]);
```

**Benefit**: Team Totals are now included by default in the market selection, providing users with more comprehensive data without requiring manual selection. This market is commonly used and doesn't significantly increase response size.

### 2. Implemented Enhanced Caching for Alternate Markets

**File Changed**: `/server/index.js`

We've implemented a specialized caching strategy for alternate markets that:

1. **Extends Cache Duration**: Alternate markets now have a 30-minute cache duration (vs. 5 minutes for regular markets)
2. **Split Caching**: Separates regular and alternate markets into different cache entries
3. **Smart Cache Retrieval**: Intelligently combines cached data from both sources when available

```javascript
// Added constants for alternate markets
const ALTERNATE_MARKETS_CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes for alternate markets
const ALTERNATE_MARKETS = [
  'alternate_spreads',
  'alternate_totals',
  'team_totals',
  'alternate_team_totals'
];
```

**Benefits**:
- Reduced API calls for alternate markets (which change less frequently)
- Improved performance by reusing cached alternate market data
- Better user experience with faster loading of alternate markets
- Reduced API usage costs by minimizing redundant calls

## Technical Details

### Cache Splitting Logic

The system now splits markets into regular and alternate categories:

```javascript
const regularMarkets = marketsToFetch.filter(market => !ALTERNATE_MARKETS.includes(market));
const alternateMarkets = marketsToFetch.filter(market => ALTERNATE_MARKETS.includes(market));
```

### Enhanced Cache Keys

We create separate cache keys for regular and alternate markets:

```javascript
const regularCacheKey = getCacheKey('odds', { sport, regions, markets: regularMarkets, bookmakers: bookmakerList });
const alternateCacheKey = getCacheKey('odds_alternate', { sport, regions, markets: alternateMarkets, bookmakers: bookmakerList });
```

### Smart Cache Duration

The `getCachedResponse` function now determines the appropriate cache duration based on market type:

```javascript
const isAlternateMarket = ALTERNATE_MARKETS.some(market => cacheKey.includes(market));
const cacheDuration = isAlternateMarket ? ALTERNATE_MARKETS_CACHE_DURATION_MS : CACHE_DURATION_MS;
```

### Response Splitting

When caching API responses, the system now splits the data by market type:

```javascript
const regularData = responseData.map(game => ({
  ...game,
  bookmakers: game.bookmakers.map(bookmaker => ({
    ...bookmaker,
    markets: bookmaker.markets.filter(market => !ALTERNATE_MARKETS.includes(market.key))
  })).filter(bookmaker => bookmaker.markets.length > 0)
})).filter(game => game.bookmakers.length > 0);

const alternateData = responseData.map(game => ({
  ...game,
  bookmakers: game.bookmakers.map(bookmaker => ({
    ...bookmaker,
    markets: bookmaker.markets.filter(market => ALTERNATE_MARKETS.includes(market.key))
  })).filter(bookmaker => bookmaker.markets.length > 0)
})).filter(game => game.bookmakers.length > 0);
```

## Why This Matters

1. **Performance**: Alternate markets (especially Alt Spreads and Alt Totals) contain large amounts of data that change infrequently. By caching them longer, we reduce API calls and improve load times.

2. **User Experience**: Including Team Totals by default provides users with more comprehensive data without requiring manual selection.

3. **API Cost Reduction**: By reducing redundant API calls for alternate markets, we lower the overall API usage costs.

4. **Scalability**: This approach scales better as more users access the platform simultaneously, as it reduces the load on both our server and The Odds API.

## Monitoring

The system now includes enhanced logging to track cache performance:

- Logs when alternate markets are cached with extended TTL
- Logs when alternate markets are retrieved from cache
- Tracks which markets are being requested and cached separately
