# Filter Integration Guide - Simplified Flow

## Overview

The new `FilterContext` provides a **single source of truth** for all filter state, eliminating the need for duplicate draft/applied state variables.

## Key Concepts

### Single Filter Object
```javascript
filters = {
  // Game mode
  sports: ['americanfootball_nfl'],
  date: '',
  markets: ['h2h', 'spreads', 'totals'],
  sportsbooks: [],
  dataPoints: 10,
  
  // Player props
  playerPropMarkets: ['player_pass_yds', ...],
  playerPropSportsbooks: [],
  
  // Arbitrage/Middles
  minProfit: 0.5,
  maxStake: 100,
  
  // UI state
  isPending: false  // True while modal is open
}
```

### isPending Flag
- **true**: User has filter modal open, changes are pending
- **false**: Filters are applied and active

This replaces the complex draft/applied state sync logic.

## Usage in Components

### 1. SportsbookMarkets.js (Main Page)

**Before** (Complex):
```javascript
// 16+ state variables
const [picked, setPicked] = useState(...);
const [draftPicked, setDraftPicked] = useState(...);
const [marketKeys, setMarketKeys] = useState(...);
const [draftMarketKeys, setDraftMarketKeys] = useState(...);
// ... many more ...

// Manual sync on modal open
useEffect(() => {
  if (mobileFiltersOpen) {
    setDraftPicked([...picked]);
    setDraftMarketKeys([...marketKeys]);
    // ... sync all other state ...
  }
}, [mobileFiltersOpen]);
```

**After** (Simple):
```javascript
const { filters, updateFilter, applyFilters, openFilterModal } = useFilters();

// Use filters directly
const { sports, markets, sportsbooks, isPending } = filters;

// Open modal
const handleOpenFilters = () => {
  openFilterModal(); // Just set isPending = true
};

// Apply filters
const handleApplyFilters = () => {
  applyFilters(); // Set isPending = false, save to localStorage
};
```

### 2. MobileFiltersSheet (Filter Modal)

**Before** (Passes many props):
```javascript
<MobileFiltersSheet
  open={mobileFiltersOpen}
  onClose={() => setMobileFiltersOpen(false)}
  onApply={applyFilters}
  draftPicked={draftPicked}
  setDraftPicked={setDraftPicked}
  draftMarketKeys={draftMarketKeys}
  setDraftMarketKeys={setDraftMarketKeys}
  // ... many more props ...
/>
```

**After** (Uses context):
```javascript
<MobileFiltersSheet
  open={filters.isPending}
  onClose={closeFilterModal}
  onApply={applyFilters}
/>
```

### 3. Filter Controls (Inside Modal)

**Before** (Updates draft state):
```javascript
<SportMultiSelect
  selected={draftMarketKeys}
  onChange={(newMarkets) => {
    setDraftMarketKeys(newMarkets);
    setUserHasSelectedMarkets(true);
  }}
/>
```

**After** (Updates context):
```javascript
<SportMultiSelect
  selected={filters.markets}
  onChange={(newMarkets) => {
    updateFilter('markets', newMarkets);
  }}
/>
```

### 4. OddsTable (Display Component)

**Before** (Receives many props):
```javascript
<OddsTable
  games={filteredGames}
  marketFilter={marketKeys}
  bookFilter={selectedBooks}
  // ... many more props ...
/>
```

**After** (Reads from context):
```javascript
const { filters } = useFilters();

<OddsTable
  games={filteredGames}
  marketFilter={filters.markets}
  bookFilter={filters.sportsbooks}
/>
```

## Migration Checklist

### Phase 1: Setup
- [x] Create FilterContext.js
- [ ] Add FilterProvider to App.js
- [ ] Verify context loads correctly

### Phase 2: SportsbookMarkets Migration
- [ ] Import useFilters hook
- [ ] Replace all state variables with filters object
- [ ] Remove manual sync logic
- [ ] Update applyFilters function
- [ ] Update resetFilters function
- [ ] Test filter application

### Phase 3: Component Updates
- [ ] Update MobileFiltersSheet to use context
- [ ] Update FilterMenu to use context
- [ ] Update OddsTable prop passing
- [ ] Remove draft state from all components

### Phase 4: Testing
- [ ] Test sports filter
- [ ] Test date filter
- [ ] Test market filter
- [ ] Test sportsbook filter
- [ ] Test player props filters
- [ ] Test arbitrage/middles filters
- [ ] Test mobile/desktop parity
- [ ] Test localStorage persistence
- [ ] Test filter reset

## Benefits

✅ **Reduced Complexity**: 16+ state variables → 1 context
✅ **Automatic Sync**: No manual sync logic needed
✅ **Clearer Intent**: isPending flag is obvious
✅ **Easier Debugging**: All state in one place
✅ **Better Performance**: Fewer state updates
✅ **Maintainability**: Simpler to add new filters

## Example: Adding a New Filter

### Old Way
```javascript
// Add state variable
const [newFilter, setNewFilter] = useState(defaultValue);
const [draftNewFilter, setDraftNewFilter] = useState(defaultValue);

// Add to sync logic
useEffect(() => {
  if (mobileFiltersOpen) {
    setDraftNewFilter(newFilter);
  }
}, [mobileFiltersOpen]);

// Add to applyFilters
const applyFilters = () => {
  setNewFilter(draftNewFilter);
  // ... other updates ...
};

// Add to reset
const resetFilters = () => {
  setNewFilter(defaultValue);
  setDraftNewFilter(defaultValue);
};
```

### New Way
```javascript
// Add to FilterContext defaults
newFilter: defaultValue,

// Use in component
const { filters, updateFilter } = useFilters();
updateFilter('newFilter', newValue);

// That's it! No sync, no reset logic needed.
```

## Troubleshooting

### Filter changes not appearing
- Check if `isPending` is true (modal is open)
- Verify `applyFilters()` is being called
- Check browser console for errors

### Changes lost after page refresh
- Verify FilterProvider wraps entire app
- Check localStorage in DevTools
- Ensure optimizedStorage is working

### Filter not updating OddsTable
- Verify OddsTable uses `useFilters()` hook
- Check if filters object is being passed correctly
- Verify OddsTable re-renders when filters change

## Next Steps

1. Add FilterProvider to App.js
2. Start migrating SportsbookMarkets.js
3. Update MobileFiltersSheet
4. Update OddsTable
5. Remove old state variables
6. Test thoroughly
7. Deploy

