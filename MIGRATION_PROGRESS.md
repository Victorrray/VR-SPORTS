# Filter System Migration Progress

## Completed ✅

### Step 1: Add FilterProvider to App.js ✅
- [x] Imported FilterProvider from FilterContext
- [x] Added FilterProvider wrapper in provider stack (between BetSlipProvider and AccessibilityProvider)
- [x] FilterContext now available to all components
- **Commit**: 7183a79

### Step 2A: Add useFilters Hook to SportsbookMarkets ✅
- [x] Imported useFilters from FilterContext
- [x] Added hook call with renamed methods:
  - `contextApplyFilters` (renamed from `applyFilters` to avoid conflict)
  - `contextResetFilters` (renamed from `resetFilters` to avoid conflict)
- [x] Ready to start replacing state variables
- **Commit**: a5077da

---

## In Progress 🔄

### Step 2B: Replace State Variables with Filters Object

**Current State Variables to Replace**:
```javascript
// Applied state (currently used)
const [picked, setPicked] = useState([...]);
const [selectedDate, setSelectedDate] = useState("");
const [selectedBooks, setSelectedBooks] = useState([...]);
const [selectedPlayerPropsBooks, setSelectedPlayerPropsBooks] = useState([...]);
const [marketKeys, setMarketKeys] = useState([...]);
const [selectedPlayerPropMarkets, setSelectedPlayerPropMarkets] = useState([...]);
const [dataPoints, setDataPoints] = useState(10);
const [minEV, setMinEV] = useState("");

// Draft state (modal state - to be removed)
const [draftPicked, setDraftPicked] = useState([...]);
const [draftSelectedDate, setDraftSelectedDate] = useState([...]);
const [draftSelectedBooks, setDraftSelectedBooks] = useState([...]);
const [draftSelectedPlayerPropsBooks, setDraftSelectedPlayerPropsBooks] = useState([...]);
const [draftMarketKeys, setDraftMarketKeys] = useState([...]);
const [draftSelectedPlayerPropMarkets, setDraftSelectedPlayerPropMarkets] = useState([...]);
const [draftDataPoints, setDraftDataPoints] = useState(10);
const [draftMinProfit, setDraftMinProfit] = useState(0.5);
const [draftMaxStake, setDraftMaxStake] = useState(100);
const [draftMinMiddleGap, setDraftMinMiddleGap] = useState(3);
const [draftMinMiddleProbability, setDraftMinMiddleProbability] = useState(15);
const [draftMaxMiddleStake, setDraftMaxMiddleStake] = useState(1000);
```

**Replacement Mapping**:
```javascript
// OLD → NEW (from filters object)
picked → filters.sports
selectedDate → filters.date
selectedBooks → filters.sportsbooks
selectedPlayerPropsBooks → filters.playerPropSportsbooks
marketKeys → filters.markets
selectedPlayerPropMarkets → filters.playerPropMarkets
dataPoints → filters.dataPoints
minEV → filters.minEV
draftPicked → filters.sports (no draft state needed)
draftSelectedDate → filters.date (no draft state needed)
// ... etc (all draft state removed)
```

---

## Next Steps 📋

### Step 2B: Replace State References Throughout File

**Locations to Update**:

1. **Lines 231-320**: Remove all state variable declarations
   - Remove `picked`, `selectedDate`, `selectedBooks`, etc.
   - Remove all `draft*` variables
   - Keep only UI state like `mobileFiltersOpen`, `showPlayerProps`, etc.

2. **Lines 1120-1132**: Remove manual sync logic
   - Remove the `useEffect` that syncs draft state when modal opens
   - Replace with simple `openFilterModal()` call

3. **Lines 1134-1197**: Update `applyFilters` function
   - Rename existing `applyFilters` to `handleApplyFilters`
   - Call `contextApplyFilters()` instead of manual state updates
   - Simplify from ~60 lines to ~10 lines

4. **Lines 1199-1207**: Update `resetDraftFilters` function
   - Rename to `handleResetFilters`
   - Call `contextResetFilters()` instead of manual state updates

5. **Lines 1209-1240**: Update `resetAllFilters` function
   - Call `contextResetFilters()` instead of manual state updates

6. **Throughout file**: Replace all references
   - `picked` → `filters.sports`
   - `selectedDate` → `filters.date`
   - `selectedBooks` → `filters.sportsbooks`
   - `marketKeys` → `filters.markets`
   - `draftPicked` → `filters.sports`
   - `draftMarketKeys` → `filters.markets`
   - etc.

### Step 2C: Update Filter Handlers

**Modal Open/Close**:
```javascript
// OLD
const handleOpenFilters = () => {
  setMobileFiltersOpen(true);
};

// NEW
const handleOpenFilters = () => {
  openFilterModal();
  setMobileFiltersOpen(true);
};
```

**Filter Application**:
```javascript
// OLD
const applyFilters = () => {
  setFiltersLoading(true);
  setPicked(draftPicked);
  setMarketKeys(draftMarketKeys);
  // ... 50+ more lines ...
  setMobileFiltersOpen(false);
};

// NEW
const handleApplyFilters = () => {
  setFiltersLoading(true);
  contextApplyFilters(); // Handles everything
  setMobileFiltersOpen(false);
  setFiltersLoading(false);
};
```

---

## Testing Checklist

After each step, verify:
- [ ] App compiles without errors
- [ ] No console warnings
- [ ] Filters modal opens
- [ ] Can change filters
- [ ] Apply button works
- [ ] Filters persist after refresh
- [ ] OddsTable updates with new filters
- [ ] Mobile and desktop work

---

## Files Modified So Far

1. **App.js** - Added FilterProvider ✅
2. **SportsbookMarkets.js** - Added useFilters hook ✅

## Files to Modify Next

1. **SportsbookMarkets.js** - Replace all state variables (IN PROGRESS)
2. **MobileFiltersSheet.js** - Use context instead of props
3. **OddsTable.js** - Read filters from context
4. **FilterMenu.js** - Use context for updates

---

## Estimated Time Remaining

- Step 2B (Replace state): 1-2 hours
- Step 2C (Update handlers): 30 minutes
- Step 3 (Update components): 1-2 hours
- Step 4 (Testing): 1 hour
- **Total**: ~4-5 hours

---

## Key Insights

1. **Naming Conflict**: `applyFilters` already exists in SportsbookMarkets, so we renamed context methods to `contextApplyFilters` and `contextResetFilters`

2. **Modal State**: The `mobileFiltersOpen` state should remain separate - it controls UI visibility, not filter values

3. **Draft State**: All draft state variables can be removed - the context handles pending changes with `isPending` flag

4. **Sync Logic**: The complex `useEffect` that syncs draft state can be completely removed

---

## Rollback Plan

If issues arise:
```bash
git revert <commit-hash>
```

All changes are atomic and can be reverted individually.

