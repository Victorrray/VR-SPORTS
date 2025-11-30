# Filter System Simplification - Next Steps

## Current Status

✅ **Analysis Complete**
- Identified 16+ duplicate state variables
- Designed single-source-of-truth solution
- Created FilterContext.js
- Documented architecture and migration path

## Immediate Actions (This Week)

### Step 1: Add FilterProvider to App.js
**File**: `/client/src/App.js`

**Location**: Around line 11 where other providers are imported

```javascript
// Add import
import { FilterProvider } from './contexts/FilterContext';

// Wrap the app (around line 107-116)
<FilterProvider>
  <BetSlipProvider>
    <BankrollProvider>
      <ToastProvider>
        <HelmetProvider>
          <ThemeProvider>
            <AccessibilityProvider>
              {/* ... rest of app ... */}
            </AccessibilityProvider>
          </ThemeProvider>
        </HelmetProvider>
      </ToastProvider>
    </BankrollProvider>
  </BetSlipProvider>
</FilterProvider>
```

**Why**: Makes FilterContext available to all components

### Step 2: Test FilterContext Works
**Command**:
```bash
npm start
```

**Check**:
- App loads without errors
- No console warnings about missing context
- DevTools shows FilterProvider in component tree

### Step 3: Start SportsbookMarkets Migration
**File**: `/client/src/pages/SportsbookMarkets.js`

**Phase 1 - Add useFilters Hook** (Lines 1-30):
```javascript
import { useFilters } from '../contexts/FilterContext';

export default function SportsbookMarkets() {
  const { filters, updateFilter, updateFilters, applyFilters, openFilterModal, closeFilterModal, resetFilters } = useFilters();
  
  // Remove these lines (they're now in FilterContext):
  // const [picked, setPicked] = useState(...);
  // const [draftPicked, setDraftPicked] = useState(...);
  // const [marketKeys, setMarketKeys] = useState(...);
  // ... etc
}
```

**Phase 2 - Replace State References** (Throughout file):
```javascript
// OLD
const [picked, setPicked] = useState([...]);
// NEW
// Use filters.sports instead

// OLD
const [marketKeys, setMarketKeys] = useState([...]);
// NEW
// Use filters.markets instead

// OLD
const [selectedBooks, setSelectedBooks] = useState([...]);
// NEW
// Use filters.sportsbooks instead
```

**Phase 3 - Update Filter Handlers**:
```javascript
// OLD
const handleOpenFilters = () => {
  setMobileFiltersOpen(true);
};

// NEW
const handleOpenFilters = () => {
  openFilterModal();
};

// OLD
const applyFilters = () => {
  setPicked(draftPicked);
  setMarketKeys(draftMarketKeys);
  // ... sync all state ...
  setMobileFiltersOpen(false);
};

// NEW
const handleApplyFilters = () => {
  applyFilters(); // That's it!
};
```

---

## Migration Checklist

### Phase 1: Setup (Today)
- [ ] Add FilterProvider to App.js
- [ ] Test app loads
- [ ] Verify no console errors

### Phase 2: SportsbookMarkets (Tomorrow)
- [ ] Import useFilters hook
- [ ] Replace state variables with filters object
- [ ] Update filter handlers
- [ ] Remove manual sync logic
- [ ] Test filter application

### Phase 3: Components (Next Day)
- [ ] Update MobileFiltersSheet
- [ ] Update FilterMenu
- [ ] Update OddsTable
- [ ] Remove prop drilling

### Phase 4: Testing (Next Day)
- [ ] Test sports filter
- [ ] Test date filter
- [ ] Test market filter
- [ ] Test sportsbook filter
- [ ] Test player props filters
- [ ] Test mobile/desktop
- [ ] Test localStorage persistence

### Phase 5: Cleanup (Next Day)
- [ ] Remove old state variables
- [ ] Remove manual sync logic
- [ ] Clean up useEffects
- [ ] Remove unused imports

---

## Key Files to Modify

### 1. App.js
**Action**: Add FilterProvider wrapper
**Complexity**: Easy (1 import, 1 wrapper)
**Time**: 5 minutes

### 2. SportsbookMarkets.js
**Action**: Replace state with context
**Complexity**: Medium (many references to update)
**Time**: 1-2 hours
**Lines affected**: ~300 lines

### 3. MobileFiltersSheet.js
**Action**: Use context instead of props
**Complexity**: Easy (fewer props)
**Time**: 30 minutes

### 4. OddsTable.js
**Action**: Read filters from context
**Complexity**: Easy (prop changes)
**Time**: 30 minutes

### 5. FilterMenu.js
**Action**: Use context for filter updates
**Complexity**: Easy (update callbacks)
**Time**: 30 minutes

---

## Testing Strategy

### Unit Tests
```javascript
// Test FilterContext methods
test('updateFilter updates single property', () => {
  const { result } = renderHook(() => useFilters());
  act(() => {
    result.current.updateFilter('sports', ['nfl']);
  });
  expect(result.current.filters.sports).toEqual(['nfl']);
});
```

### Integration Tests
```javascript
// Test filter flow
test('applying filters closes modal and triggers API call', () => {
  // Open modal
  // Change filters
  // Apply filters
  // Verify isPending = false
  // Verify API called
});
```

### Manual Testing
- [ ] Open filter modal
- [ ] Change each filter type
- [ ] Apply filters
- [ ] Verify OddsTable updates
- [ ] Refresh page
- [ ] Verify filters persist
- [ ] Test on mobile
- [ ] Test on desktop

---

## Rollback Plan

If issues arise:
1. Keep old state variables alongside context
2. Use context for new code
3. Gradually migrate old code
4. Remove old state after full migration

**Revert Command**:
```bash
git revert <commit-hash>
```

---

## Success Criteria

✅ App loads without errors
✅ All filters work correctly
✅ Mobile and desktop parity
✅ Filters persist after refresh
✅ No console warnings
✅ Performance improved
✅ Code is cleaner and simpler

---

## Questions?

Refer to:
- `FILTER_SIMPLIFICATION_SUMMARY.md` - Overview
- `FILTER_INTEGRATION_GUIDE.md` - Detailed guide
- `FILTER_FLOW_ANALYSIS.md` - Technical analysis
- `FilterContext.js` - Source code

---

## Timeline

**Today**: Add FilterProvider to App.js
**Tomorrow**: Migrate SportsbookMarkets.js
**Next Day**: Update components
**Next Day**: Testing
**Next Day**: Cleanup and deploy

**Total Time**: ~5 hours of development

