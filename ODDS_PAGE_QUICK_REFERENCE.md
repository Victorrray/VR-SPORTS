# Odds Page - Quick Reference Guide

**Quick lookup for common tasks and components**  
**Last Updated**: October 27, 2025

## File Locations

### Main Page
- **SportsbookMarkets.js** (2,604 lines)
  - Location: `/client/src/pages/SportsbookMarkets.js`
  - Main odds page component
  - Handles all filtering, mode switching, and layout

### Core Components
- **OddsTable.js** (180,110 lines)
  - Location: `/client/src/components/betting/OddsTable.js`
  - Displays all odds data in table format
  - Largest component in the app

- **BetSlip.js** (33,087 lines)
  - Location: `/client/src/components/betting/BetSlip.js`
  - Manages bet selection and placement

- **ArbitrageDetector.js** (26,787 lines)
  - Location: `/client/src/components/betting/ArbitrageDetector.js`
  - Identifies arbitrage opportunities

- **SportMultiSelect.js** (24,672 lines)
  - Location: `/client/src/components/betting/SportMultiSelect.js`
  - Multi-sport selection component

- **MiddlesDetector.js** (16,237 lines)
  - Location: `/client/src/components/betting/MiddlesDetector.js`
  - Identifies middle opportunities

### Styling
- **SportsbookMarkets.css** - Main page styles
- **OddsTable.css** (38,446 bytes) - Odds table styles
- **BetSlip.css** (19,451 bytes) - Bet slip styles
- **ArbitrageDetector.css** (11,829 bytes) - Arbitrage styles

### Hooks
- **useMarketsWithCache.js** - Fetch odds with caching
- **useMe.js** - Get current user profile
- **useAuth.js** - Get authentication state
- **useBetSlip.js** - Manage bet slip state
- **useDebounce.js** - Debounce values

### Contexts
- **BetSlipContext.js** - Bet slip state management

---

## Common Tasks

### Add a New Sport

1. **Add to AVAILABLE_SPORTS array** (SportsbookMarkets.js, line 263)
```javascript
{ key: 'new_sport_key', title: 'Sport Name' }
```

2. **Add market support** (odds.js backend)
```javascript
SPORT_MARKET_SUPPORT['new_sport_key'] = [
  'h2h', 'spreads', 'totals', ...
];
```

3. **Test with API**
```javascript
const response = await secureFetch('/api/odds', {
  sports: 'new_sport_key',
  markets: 'h2h,spreads,totals'
});
```

### Add a New Betting Mode

1. **Create new component** in `/components/betting/`
```javascript
// NewBettingMode.js
export default function NewBettingMode({ games, selectedBooks }) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

2. **Add state to SportsbookMarkets.js**
```javascript
const [showNewMode, setShowNewMode] = useState(false);
```

3. **Add tab to SectionMenu**
```javascript
<button onClick={() => setShowNewMode(!showNewMode)}>
  New Mode
</button>
```

4. **Add conditional rendering**
```javascript
{showNewMode && <NewBettingMode games={games} selectedBooks={selectedBooks} />}
```

### Add a New Filter

1. **Add state to SportsbookMarkets.js**
```javascript
const [newFilter, setNewFilter] = useState('');
const [draftNewFilter, setDraftNewFilter] = useState('');
```

2. **Add to FilterMenu component**
```javascript
<div className="filter-section">
  <label>New Filter</label>
  <input 
    value={draftNewFilter}
    onChange={(e) => setDraftNewFilter(e.target.value)}
  />
</div>
```

3. **Add to apply/reset logic**
```javascript
const applyFilters = () => {
  setNewFilter(draftNewFilter);
  // Trigger API call
};

const resetFilters = () => {
  setDraftNewFilter('');
  setNewFilter('');
};
```

### Modify Odds Display

1. **Edit OddsTable.js** (lines 1-500 for structure)
2. **Update CSS** in OddsTable.css
3. **Test responsive design** at different breakpoints

### Add Player Prop Market

1. **Add to PLAYER_PROP_MARKETS** (SportsbookMarkets.js, line 40)
```javascript
{
  key: 'new_prop_market',
  title: 'New Prop',
  sport: 'football'
}
```

2. **Update backend** (server/routes/odds.js)
3. **Test with API call**

---

## Key State Variables

### Filters
```javascript
picked                    // Selected sports
selectedBooks            // Selected sportsbooks
selectedDate             // Selected date
marketKeys               // Selected markets
selectedPlayerPropMarkets // Selected player prop markets
minEV                    // Minimum EV threshold
```

### Modes
```javascript
showPlayerProps          // Player props mode toggle
showArbitrage            // Arbitrage mode toggle
showMiddles              // Middles mode toggle
```

### UI
```javascript
loading                  // Loading state
error                    // Error state
isDesktop                // Desktop/mobile flag
mobileFiltersOpen        // Mobile filters visibility
```

### Performance
```javascript
tableNonce               // Force OddsTable re-render
autoRefreshEnabled       // Auto-refresh toggle
refreshCooldown          // Cooldown timer
```

---

## API Endpoints

### Main Endpoints

**GET /api/odds**
```javascript
const response = await secureFetch('/api/odds', {
  sports: 'americanfootball_nfl,basketball_nba',
  markets: 'h2h,spreads,totals',
  bookmakers: 'draftkings,fanduel',
  regions: 'us,us_dfs'
});
```

**GET /api/player-props**
```javascript
const response = await secureFetch('/api/player-props', {
  league: 'americanfootball_nfl',
  date: '2025-10-27',
  markets: 'player_pass_yds,player_rush_yds',
  bookmakers: 'draftkings,fanduel'
});
```

**GET /api/cached-odds/:sport**
```javascript
const response = await secureFetch('/api/cached-odds/americanfootball_nfl', {
  markets: 'h2h,spreads',
  bookmakers: 'draftkings'
});
```

**POST /api/bets**
```javascript
const response = await secureFetch('/api/bets', {
  method: 'POST',
  body: JSON.stringify({
    bets: [
      {
        game_id: 'game_123',
        bookmaker: 'draftkings',
        market: 'h2h',
        outcome: 'Team A',
        odds: -110,
        stake: 100
      }
    ]
  })
});
```

---

## Component Props Reference

### OddsTable
```javascript
<OddsTable
  games={games}                    // Game data
  selectedBooks={selectedBooks}    // Selected sportsbooks
  markets={markets}                // Selected markets
  minEV={minEV}                    // Min EV filter
  isPlayerPropsMode={showPlayerProps}
  onBetClick={handleBetClick}
  tableNonce={tableNonce}
  isArbitrageMode={showArbitrage}
  isMiddlesMode={showMiddles}
/>
```

### BetSlip
```javascript
<BetSlip
  bets={bets}
  isOpen={isOpen}
  onClose={closeBetSlip}
  onPlaceBets={placeBets}
  onRemoveBet={removeBet}
  onUpdateBet={updateBet}
/>
```

### ArbitrageDetector
```javascript
<ArbitrageDetector
  games={games}
  selectedBooks={selectedBooks}
  sport={picked[0]}
  minProfit={minProfit}
  maxStake={maxStake}
/>
```

### MiddlesDetector
```javascript
<MiddlesDetector
  games={games}
  selectedBooks={selectedBooks}
  minGap={minGap}
  minProbability={minProbability}
  maxStake={maxStake}
/>
```

---

## Debugging Tips

### Check Component State
```javascript
// Add to component
console.log('Current state:', {
  picked,
  selectedBooks,
  showPlayerProps,
  loading,
  error
});
```

### Check API Response
```javascript
const response = await secureFetch('/api/odds', params);
console.log('API Response:', response);
console.log('Games count:', response.length);
```

### Check Cache
```javascript
// In browser console
const cached = smartCache.get('odds_americanfootball_nfl_h2h,spreads,totals_draftkings,fanduel');
console.log('Cached data:', cached);
```

### Check BetSlip Context
```javascript
// Add to component
const { bets, isOpen } = useBetSlip();
console.log('Bets:', bets);
console.log('BetSlip open:', isOpen);
```

### Monitor Performance
```javascript
// Add performance markers
console.time('odds-fetch');
const response = await secureFetch('/api/odds', params);
console.timeEnd('odds-fetch');
```

---

## Common Issues & Solutions

### Issue: Odds not loading
**Solution**:
1. Check API key in backend
2. Check network tab for API errors
3. Check browser console for errors
4. Clear cache: `smartCache.clear()`

### Issue: Player props not showing
**Solution**:
1. Verify ENABLE_PLAYER_PROPS_V2 is true
2. Check selected markets include player prop markets
3. Verify backend has player props enabled
4. Check API response for player props data

### Issue: Bet slip not updating
**Solution**:
1. Check BetSlipContext is properly initialized
2. Verify addBet callback is being called
3. Check browser console for errors
4. Verify bet data structure

### Issue: Filters not applying
**Solution**:
1. Check draft state is being updated
2. Verify apply button is calling setters
3. Check useMarketsWithCache dependencies
4. Verify API call is being triggered

### Issue: Mobile layout broken
**Solution**:
1. Check responsive CSS media queries
2. Verify component uses isDesktop flag
3. Check MobileBottomBar is rendering
4. Test at actual mobile breakpoints

---

## Performance Optimization Checklist

- [ ] API responses are cached (smartCache)
- [ ] Components use useMemo for expensive calculations
- [ ] Event handlers use useCallback
- [ ] Search/filter inputs are debounced
- [ ] Images are lazy loaded
- [ ] Unused code is removed
- [ ] Bundle size is optimized
- [ ] Database queries are indexed
- [ ] Auto-refresh has cooldown
- [ ] Error boundaries are in place

---

## Testing Checklist

- [ ] All sports load correctly
- [ ] All markets display properly
- [ ] Bookmaker filtering works
- [ ] Date filtering works
- [ ] EV highlighting works
- [ ] Bet slip adds/removes bets
- [ ] Parlay odds calculate correctly
- [ ] Player props mode works
- [ ] Arbitrage detection works
- [ ] Middles detection works
- [ ] Mobile layout responsive
- [ ] Error handling works
- [ ] Auto-refresh works
- [ ] Caching works

---

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance optimized
- [ ] API endpoints working
- [ ] Database migrations complete
- [ ] Environment variables set
- [ ] Sentry configured
- [ ] Logging configured
- [ ] CORS configured
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Mobile tested
- [ ] Desktop tested
- [ ] Tablet tested

---

## Resources

### Documentation
- [ODDS_PAGE_ARCHITECTURE.md](./ODDS_PAGE_ARCHITECTURE.md) - Complete architecture
- [COMPONENT_INTERACTION_MAP.md](./COMPONENT_INTERACTION_MAP.md) - Visual reference

### External Resources
- [The Odds API Docs](https://the-odds-api.com/docs/)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Context API Guide](https://react.dev/reference/react/useContext)

### Team Resources
- Backend API: `/server/routes/odds.js`
- Frontend Hooks: `/client/src/hooks/`
- Component Library: `/client/src/components/betting/`

---

## Contact & Support

For questions about the odds page architecture:
1. Check ODDS_PAGE_ARCHITECTURE.md
2. Check COMPONENT_INTERACTION_MAP.md
3. Review component source code
4. Check git history for recent changes
5. Contact development team

---

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Maintained By**: Development Team
