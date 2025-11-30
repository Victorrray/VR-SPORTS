# Filter Flow Analysis & Simplification Plan

## Current Architecture (Complex)

### State Management Complexity
The filter system currently has **DUPLICATE STATE** for every filter:

```
Applied State (Live)          Draft State (Modal)
├── picked                    ├── draftPicked
├── selectedDate              ├── draftSelectedDate
├── selectedBooks             ├── draftSelectedBooks
├── selectedPlayerPropsBooks  ├── draftSelectedPlayerPropsBooks
├── marketKeys                ├── draftMarketKeys
├── selectedPlayerPropMarkets ├── draftSelectedPlayerPropMarkets
├── dataPoints                ├── draftDataPoints
└── [more...]                 └── [more...]
```

**Problem**: This creates 16+ state variables that must be kept in sync manually.

### Current Data Flow

```
1. User opens filter modal
   ↓
2. Sync draft state with applied state (useEffect on mobileFiltersOpen)
   ↓
3. User changes filters in modal (updates draft state)
   ↓
4. User clicks "Apply"
   ↓
5. applyFilters() copies draft state → applied state
   ↓
6. useMarketsWithCache hook detects state change
   ↓
7. API call with new filters
   ↓
8. OddsTable re-renders with new data
```

**Issues**:
- Manual sync required when modal opens
- Easy to miss syncing a filter
- Confusing which state to use where
- Multiple sources of truth

### Auto-Selection Logic Complexity

```
useEffect (draftPicked changes)
  ↓
getAutoSelectedMarkets(draftPicked)
  ↓
Check userHasSelectedMarkets flag
  ↓
If false: Auto-select markets
If true: Keep user's selection
```

**Issues**:
- Flag-based logic is fragile
- Auto-selection can override user choices unexpectedly
- Multiple useEffects managing similar logic

---

## Simplified Architecture (Proposed)

### Single Source of Truth

Instead of draft + applied state, use **ONE filter state** with a "pending" flag:

```javascript
const [filters, setFilters] = useState({
  sports: ["americanfootball_nfl"],
  date: "",
  markets: ["h2h", "spreads", "totals"],
  sportsbooks: [],
  playerPropMarkets: ["player_pass_yds", "player_rush_yds", "player_receptions"],
  playerPropSportsbooks: [],
  dataPoints: 10,
  // ... other filters
  isPending: false  // True while modal is open
});
```

### Simplified Data Flow

```
1. User opens filter modal
   ↓
2. Set filters.isPending = true
   (No sync needed - we already have the state)
   ↓
3. User changes filters
   ↓
4. Update filters directly (no draft state)
   ↓
5. User clicks "Apply"
   ↓
6. Set filters.isPending = false
   ↓
7. useMarketsWithCache detects change
   ↓
8. API call with filters
   ↓
9. OddsTable re-renders
```

### Benefits

✅ **Single source of truth** - No sync issues
✅ **Fewer state variables** - 1 object instead of 16+
✅ **Clearer logic** - isPending flag replaces complex sync
✅ **Easier debugging** - All filter state in one place
✅ **Better performance** - Fewer state updates

---

## Implementation Steps

### Phase 1: Create Filter Context
```javascript
// contexts/FilterContext.js
const FilterContext = createContext();

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState({
    sports: ["americanfootball_nfl"],
    date: "",
    markets: ["h2h", "spreads", "totals"],
    sportsbooks: [],
    playerPropMarkets: ["player_pass_yds", "player_rush_yds", "player_receptions"],
    playerPropSportsbooks: [],
    dataPoints: 10,
    isPending: false
  });

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, isPending: false }));
  };

  const openFilterModal = () => {
    setFilters(prev => ({ ...prev, isPending: true }));
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilter, applyFilters, openFilterModal }}>
      {children}
    </FilterContext.Provider>
  );
}
```

### Phase 2: Update SportsbookMarkets.js
- Replace all draft state with context
- Remove manual sync logic
- Simplify applyFilters function

### Phase 3: Update MobileFiltersSheet
- Pass updateFilter callback
- Remove draft state management

### Phase 4: Update OddsTable
- Read filters from context
- Simplify prop passing

---

## Current Issues to Fix

### 1. **Auto-Selection Logic**
Current: Complex useEffect with flags
Proposed: Simple function in context

```javascript
// When sports change, auto-select appropriate markets
const handleSportChange = (newSports) => {
  const autoMarkets = getAutoSelectedMarkets(newSports);
  updateFilter('sports', newSports);
  updateFilter('markets', autoMarkets);
};
```

### 2. **Modal State Sync**
Current: Manual sync on modal open
Proposed: isPending flag handles it

```javascript
// Open modal
const handleOpenFilters = () => {
  openFilterModal(); // Sets isPending = true
};

// Apply filters
const handleApplyFilters = () => {
  applyFilters(); // Sets isPending = false, triggers API call
};
```

### 3. **Filter Persistence**
Current: Scattered localStorage calls
Proposed: Centralized in context

```javascript
// Save filters to localStorage when applied
useEffect(() => {
  if (!filters.isPending) {
    localStorage.setItem('appliedFilters', JSON.stringify(filters));
  }
}, [filters.isPending]);
```

---

## Migration Path

### Week 1: Create Context
- Create FilterContext.js
- Wrap app with FilterProvider
- Add useFilters hook

### Week 2: Update SportsbookMarkets
- Replace state with context
- Remove draft state
- Simplify applyFilters

### Week 3: Update Components
- Update MobileFiltersSheet
- Update OddsTable
- Update FilterMenu

### Week 4: Testing & Optimization
- Test all filter combinations
- Verify mobile/desktop parity
- Performance optimization

---

## Files to Modify

1. **Create**: `/client/src/contexts/FilterContext.js` (NEW)
2. **Update**: `/client/src/pages/SportsbookMarkets.js` (MAJOR)
3. **Update**: `/client/src/components/layout/MobileFiltersSheet.js` (MINOR)
4. **Update**: `/client/src/components/betting/OddsTable.js` (MINOR)
5. **Update**: `/client/src/components/layout/FilterMenu.js` (MINOR)

---

## Expected Outcomes

### Before
- 16+ state variables
- Manual sync logic
- Complex useEffects
- Difficult to debug
- Easy to break

### After
- 1 filter object
- Automatic sync
- Simple logic
- Easy to debug
- Robust and maintainable

---

## Rollback Plan

If issues arise:
1. Keep old state variables alongside context
2. Use context for new code
3. Gradually migrate old code
4. Remove old state after full migration

