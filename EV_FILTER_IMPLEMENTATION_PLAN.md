# EV Filtering Implementation Plan

## Problem Statement

Currently, the EV (Expected Value) calculation in the VR-Odds platform uses ALL available bookmakers' odds to determine the "fair line" (market consensus), regardless of which bookmakers the user has selected. This means:

1. If a user selects only certain bookmakers (e.g., DraftKings, FanDuel), the EV calculation still uses odds from ALL bookmakers
2. This creates inconsistency between what the user sees (filtered bookmakers) and what the EV calculation is based on
3. Users have no way to change this behavior - it's hardcoded in the EV calculation logic

## Solution Overview

We will modify the EV calculation logic to respect the user's selected bookmakers by:

1. Filtering the list of bookmakers before calculating consensus probabilities
2. Applying this filtering consistently across all EV calculations (regular markets, player props)
3. Adding visual indicators to show that EV is being calculated based on filtered books

## Implementation Steps

### 1. Update the `getEV` function in OddsTable.js

This is the main function that calculates EV for each row in the odds table.

```javascript
const getEV = row => {
  const userOdds = Number(row?.out?.price ?? row?.out?.odds ?? 0);
  if (!userOdds) return null;
  
  // Get bookmaker key for DFS-specific EV calculation
  const bookmakerKey = row?.out?.bookmaker?.key || row?.out?.book?.toLowerCase();
  
  // FIXED: Filter books based on user selection before calculating consensus
  const filteredBooks = bookFilter && bookFilter.length > 0 
    ? (row.allBooks || []).filter(book => {
        const key = (book?.bookmaker?.key || book?.book || '').toLowerCase();
        return bookFilter.includes(key);
      })
    : (row.allBooks || []);
  
  // Only proceed if we have enough filtered books for a meaningful consensus
  if (filteredBooks.length < 2) return null;
  
  // Rest of the function using filteredBooks instead of row.allBooks
  // ...
}
```

### 2. Update the `calculateSideEV` function for player props

This function is used for calculating EV for player props with over/under markets.

```javascript
const calculateSideEV = (books, isOver = true) => {
  if (!books || books.length === 0) return null;
  
  // FIXED: Filter books based on user selection
  const filteredBooks = bookFilter && bookFilter.length > 0 
    ? books.filter(book => {
        const key = (book?.bookmaker?.key || book?.book || '').toLowerCase();
        return bookFilter.includes(key);
      })
    : books;
  
  // Only proceed if we have enough filtered books
  if (filteredBooks.length < 2) return null;
  
  // Rest of the function using filteredBooks instead of books
  // ...
}
```

### 3. Add Debug Logging

Add debug logging to help track how the EV filtering is working:

```javascript
useEffect(() => {
  if (bookFilter && bookFilter.length > 0) {
    console.log('🎯 EV Filtering active - calculating EV using only these books:', bookFilter);
  } else {
    console.log('🎯 EV Filtering inactive - using all available books for EV calculation');
  }
}, [bookFilter]);
```

### 4. Add Visual Indicator

Add a visual indicator to the EV column header to show that EV is being calculated based on filtered books:

```javascript
<th className="ev-col sort-th" onClick={()=>setSort(s=>({ key:'ev', dir:s.key==='ev'&&s.dir==='desc'?'asc':'desc' }))}>
  <span className="sort-label">
    EV % {bookFilter && bookFilter.length > 0 && <span className="filter-badge" title="EV calculated using only selected sportsbooks">📊</span>}
    <span className="sort-indicator">{sort.key==='ev'?(sort.dir==='desc'?'▼':'▲'):''}</span>
  </span>
</th>
```

### 5. Add CSS for Visual Indicator

Add CSS for the filter badge:

```css
.filter-badge {
  font-size: 10px;
  margin-left: 4px;
  color: var(--accent-color);
}
```

## Testing Plan

1. **Basic Functionality**: Select a single sportsbook (e.g., FanDuel) and verify that EV calculations only use odds from that sportsbook
2. **Multiple Books**: Select multiple sportsbooks and verify EV calculations use only those books
3. **No Selection**: Verify that when no books are selected, all books are used for EV calculation
4. **Edge Cases**: Test with various combinations of books, including those with limited market coverage
5. **Visual Indicator**: Verify that the visual indicator appears when books are filtered

## Expected Results

- EV calculations will now be based only on the user's selected sportsbooks
- Users will see more accurate and personalized EV values
- The visual indicator will make it clear when EV is being calculated based on filtered books
- Debug logging will help track how the EV filtering is working

## Potential Issues

1. **Insufficient Data**: With fewer books, there may not be enough data for reliable EV calculation
   - Solution: We've added checks to only calculate EV when there are enough filtered books

2. **Performance Impact**: Filtering books adds a small overhead to EV calculation
   - Solution: The overhead is minimal and worth the improved accuracy

3. **User Confusion**: Users might not understand why EV values change when they filter books
   - Solution: The visual indicator and tooltip will help explain this
