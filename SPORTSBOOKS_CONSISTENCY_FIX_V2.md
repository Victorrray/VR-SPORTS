# Sportsbooks Consistency Fix V2

## Problem Fixed

After implementing the initial fix to make sportsbooks consistent between Game Odds and Player Props modes, we discovered that only 4 sportsbooks were still showing in Player Props mode. This was due to additional filtering mechanisms in the code that we needed to address.

## Root Causes Identified

1. **Different Default Selections**: The `getUserSelectedSportsbooks` function was using different default sportsbooks for Game Odds mode (`['draftkings', 'fanduel', 'betmgm', 'caesars']`) and Player Props mode (`['prizepicks', 'underdog', 'pick6', 'novig']`).

2. **DFS Apps Filtering**: The `SportMultiSelect` component had a `showDFSApps` prop that was set to `false` for Game Odds mode and `true` for Player Props mode, causing different filtering behavior.

3. **Game Odds Mode Filtering**: The `enhancedSportsbookList` function was explicitly filtering out DFS apps in Game Odds mode with this code:
   ```javascript
   // For Game Odds mode, only return traditional sportsbooks (no DFS apps)
   return (marketBooks || []).filter(book => {
     const dfsAppKeys = ['prizepicks', 'underdog', 'sleeper', 'prophetx', 'pick6'];
     return !dfsAppKeys.includes(book.key);
   });
   ```

## Changes Made

### 1. Unified Default Sportsbook Selections

Updated the `getUserSelectedSportsbooks` function to use the same default sportsbooks for both modes:

```javascript
// Before
if (mode === 'props') {
  return ['prizepicks', 'underdog', 'pick6', 'novig']; // Default DFS apps + NoVig
}
return ['draftkings', 'fanduel', 'betmgm', 'caesars'];

// After
return ['draftkings', 'fanduel', 'betmgm', 'caesars'];
```

### 2. Enabled DFS Apps in All SportMultiSelect Components

Updated all instances of the `SportMultiSelect` component to show DFS apps:

```javascript
// Before (Game Odds mode)
<SportMultiSelect
  list={enhancedSportsbookList}
  selected={draftSelectedBooks || []}
  onChange={setDraftSelectedBooks}
  placeholderText="Select sportsbooks..."
  allLabel="All Sportsbooks"
  isSportsbook={true}
  enableCategories={true}
  showDFSApps={false}
/>

// After (Game Odds mode)
<SportMultiSelect
  list={enhancedSportsbookList}
  selected={draftSelectedBooks || []}
  onChange={setDraftSelectedBooks}
  placeholderText="Select sportsbooks..."
  allLabel="All Sportsbooks"
  isSportsbook={true}
  enableCategories={true}
  showDFSApps={true}
/>
```

### 3. Removed Filtering in enhancedSportsbookList

Completely rewrote the `enhancedSportsbookList` function to use the same logic for both modes:

```javascript
// Before
const enhancedSportsbookList = useMemo(() => {
  const marketBookKeys = new Set((marketBooks || []).map(book => book.key));
  
  if (showPlayerProps) {
    // Player Props mode logic...
  }
  
  // For Game Odds mode, only return traditional sportsbooks (no DFS apps)
  return (marketBooks || []).filter(book => {
    const dfsAppKeys = ['prizepicks', 'underdog', 'sleeper', 'prophetx', 'pick6'];
    return !dfsAppKeys.includes(book.key);
  });
}, [marketBooks, showPlayerProps]);

// After
const enhancedSportsbookList = useMemo(() => {
  const marketBookKeys = new Set((marketBooks || []).map(book => book.key));
  
  // Get all available DFS apps
  const dfsApps = getDFSApps();
  const missingDFSApps = dfsApps.filter(dfs => !marketBookKeys.has(dfs.key));
  
  // For both Game Odds and Player Props modes, include all sportsbooks AND DFS apps
  const enhancedBooks = [
    ...(marketBooks || []),
    ...missingDFSApps.map(dfs => ({ key: dfs.key, title: dfs.name }))
  ];
  
  // Log different messages based on mode
  if (showPlayerProps) {
    console.log('🎯 Player Props Sportsbooks:', {
      totalAvailable: enhancedBooks.length,
      regularBooks: marketBooks?.length || 0,
      dfsApps: missingDFSApps.length,
      allBooks: enhancedBooks.map(b => b.key)
    });
  } else {
    console.log('📈 Game Odds Sportsbooks:', {
      totalAvailable: enhancedBooks.length,
      regularBooks: marketBooks?.length || 0,
      dfsApps: missingDFSApps.length,
      allBooks: enhancedBooks.map(b => b.key)
    });
  }
  
  return enhancedBooks;
}, [marketBooks, showPlayerProps]);
```

## Benefits

1. **Truly Consistent Experience**: Users now see exactly the same sportsbooks in both Game Odds and Player Props modes.

2. **Complete Sportsbook Selection**: All sportsbooks, including DFS apps, are now available in both modes.

3. **Simplified Code**: The code is now more maintainable with a single consistent approach for handling sportsbooks.

4. **Better Debugging**: Enhanced logging shows the complete list of sportsbooks available in each mode.

## Technical Notes

- The `SportMultiSelect` component has built-in categorization that organizes sportsbooks into "Popular Sportsbooks", "DFS Apps", "Premium Options", and "Regional & Others" categories.

- The `showDFSApps` prop in `SportMultiSelect` controls whether the "DFS Apps" category is displayed. We've set this to `true` for all instances to ensure consistency.

- We've kept the separate storage keys for Game Odds mode (`userSelectedSportsbooks`) and Player Props mode (`userSelectedSportsbooks_props`) to allow users to have different sportsbook selections for each mode if they wish, but the default selections are now the same.
