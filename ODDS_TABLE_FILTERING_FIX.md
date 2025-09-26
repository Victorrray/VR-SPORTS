# OddsTable Filtering and Sorting Fix

## Problem Fixed

Users were experiencing issues where certain sports and sportsbooks weren't showing results in the OddsTable component, even when they were selected in the filters. Additionally, there was confusion about whether the table was always sorting by highest EV.

## Root Causes Identified

1. **Inconsistent Empty Filter Handling**: When no sportsbooks were explicitly selected, the `effectiveSelectedBooks` function was returning all available sportsbook keys from the current data, which might not include all possible sportsbooks.

2. **Lack of Debug Information**: There was insufficient logging to diagnose why certain sports or sportsbooks weren't appearing in the results.

3. **Unclear Sorting Logic**: While the OddsTable was defaulting to sorting by EV in descending order, there was no explicit logging to confirm this behavior.

## Changes Made

### 1. Improved Empty Filter Handling

Updated the `effectiveSelectedBooks` function in `SportsbookMarkets.js` to return an empty array when no books are selected, which signals to the OddsTable component to show all books:

```javascript
// Before
const result = (currentSelectedBooks && currentSelectedBooks.length)
  ? currentSelectedBooks
  : (Array.isArray(marketBooks) ? marketBooks.map(b => b.key) : []);

// After
const result = (currentSelectedBooks && currentSelectedBooks.length) 
  ? currentSelectedBooks 
  : [];
```

### 2. Enhanced Debug Logging

Added comprehensive logging throughout the filtering and sorting process:

1. **In SportsbookMarkets.js**:
   ```javascript
   console.log('🎯 Bookmaker Filtering Debug:', {
     mode: isPlayerPropsMode ? 'Player Props' : 'Game Odds',
     selectedBooks: selectedBooks,
     selectedPlayerPropsBooks: selectedPlayerPropsBooks,
     currentSelectedBooks: currentSelectedBooks,
     selectedBooksLength: currentSelectedBooks?.length || 0,
     marketBooks: marketBooks?.map(b => b.key) || [],
     effectiveSelectedBooks: result.length ? result : 'ALL BOOKS (empty filter)',
     effectiveLength: result.length,
     isShowingAllBooks: result.length === 0
   });
   ```

2. **In OddsTable.js**:
   ```javascript
   // Added detailed logging for input data
   useEffect(() => {
     if (games && games.length > 0) {
       // Log sports and bookmakers in the data
       const sportCounts = {};
       const bookmakerCounts = {};
       const marketCounts = {};
       
       // ... [counting logic] ...
       
       console.log(`🎯 OddsTable received ${games.length} games with:`);
       console.log('- Sports:', sportCounts);
       console.log('- Bookmakers:', bookmakerCounts);
       console.log('- Markets:', marketCounts);
       console.log('- BookFilter:', bookFilter && bookFilter.length ? bookFilter : 'ALL BOOKS');
       console.log('- MarketFilter:', marketFilter && marketFilter.length ? marketFilter : 'ALL MARKETS');
     }
   }, [games, bookFilter, marketFilter]);
   ```

3. **Added market processing logging**:
   ```javascript
   console.log(`🎯 Processing market ${marketKey} with ${allMarketOutcomes.length} outcomes. BookFilter:`, 
     bookFilter && bookFilter.length ? bookFilter : 'ALL BOOKS (no filter)');
   ```

### 3. Explicit Sorting Confirmation

Added logging to confirm the sorting behavior:

```javascript
// Always default to sorting by highest EV (desc) unless explicitly overridden
const [sort, setSort] = useState(initialSort || { key: "ev", dir: "desc" });

// Log sorting information for debugging
useEffect(() => {
  console.log(`🎯 OddsTable sorting by: ${sort.key} (${sort.dir === 'desc' ? 'highest to lowest' : 'lowest to highest'})`);
}, [sort]);
```

## Benefits

1. **Consistent Filtering Behavior**: When no sportsbooks are selected, the OddsTable now correctly shows results from all available sportsbooks, not just the ones in the current data.

2. **Better Diagnostics**: The enhanced logging makes it much easier to diagnose filtering issues by showing exactly what data is being received and how it's being filtered.

3. **Sorting Transparency**: Users can now be confident that the table is sorting by highest EV by default, with clear logging to confirm this behavior.

## Technical Details

The key insight was that the OddsTable component expects an empty `bookFilter` array to mean "show all books," but the `effectiveSelectedBooks` function was returning a non-empty array even when no books were explicitly selected. By returning an empty array instead, we ensure that all books are shown when none are selected.

Additionally, the comprehensive logging we added helps diagnose any remaining issues by showing exactly what data is available and how it's being filtered at each step of the process.

## How to Verify

1. Open the browser console and look for logs with the 🎯 emoji.
2. Check that when no sportsbooks are selected, the logs show `effectiveSelectedBooks: 'ALL BOOKS (empty filter)'`.
3. Verify that the OddsTable is sorting by highest EV by default with the log message `OddsTable sorting by: ev (highest to lowest)`.
4. When selecting specific sports or sportsbooks, check the logs to see exactly what data is available and how it's being filtered.
