# Sportsbooks Consistency Fix

## Problem Fixed

Previously, the VR-Odds platform was showing different sportsbooks in Player Props mode compared to Game Odds mode. This inconsistency was confusing for users who expected to see the same sportsbooks in both modes.

In Player Props mode, users were only seeing a limited set of sportsbooks (primarily DFS apps like PrizePicks, Underdog Fantasy, and DraftKings Pick6), while Game Odds mode showed all traditional sportsbooks.

## Changes Made

We've made two key changes to ensure consistency between Game Odds mode and Player Props mode:

### 1. Removed Sportsbook Filtering in Player Props Mode

**File Changed**: `/client/src/pages/SportsbookMarkets.js`

```javascript
// Before: Player Props mode filtered sportsbooks based on a whitelist
if (showPlayerProps) {
  const playerPropsBookmakers = [
    'draftkings', 'fanduel', 'betmgm', 'caesars', /* and many more */
  ];
  
  const filteredMarketBooks = (marketBooks || []).filter(book => 
    playerPropsBookmakers.includes(book.key)
  );
  
  // Add missing DFS apps that support player props
  const dfsApps = getDFSApps().filter(dfs => 
    playerPropsBookmakers.includes(dfs.key)
  );
  const missingDFSApps = dfsApps.filter(dfs => !marketBookKeys.has(dfs.key));
  
  const enhancedBooks = [
    ...filteredMarketBooks,
    ...missingDFSApps.map(dfs => ({ key: dfs.key, title: dfs.name }))
  ];
  
  return enhancedBooks;
}

// After: Player Props mode shows all sportsbooks plus DFS apps
if (showPlayerProps) {
  // For Player Props mode, include all sportsbooks AND DFS apps
  const enhancedBooks = [
    ...(marketBooks || []),
    ...missingDFSApps.map(dfs => ({ key: dfs.key, title: dfs.name }))
  ];
  
  console.log('🎯 Player Props Sportsbooks:', {
    totalAvailable: enhancedBooks.length,
    regularBooks: marketBooks?.length || 0,
    dfsApps: missingDFSApps.length,
    allBooks: enhancedBooks.map(b => b.key)
  });
  
  return enhancedBooks;
}
```

### 2. Unified Default Sportsbook Selections

**File Changed**: `/client/src/pages/SportsbookMarkets.js`

```javascript
// Before: Different default selections for game mode and props mode
if (mode === 'props') {
  // Only include bookmakers that actually support player props
  return ['prizepicks', 'underdog', 'pick6', 'novig']; // Default DFS apps + NoVig for player props
}
// Default to popular sportsbooks if nothing saved for game mode
return ['draftkings', 'fanduel', 'betmgm', 'caesars'];

// After: Same default selections for both modes
// Use the same default selections for both game mode and props mode
// Default to popular sportsbooks if nothing saved
return ['draftkings', 'fanduel', 'betmgm', 'caesars'];
```

## Benefits

1. **Consistent User Experience**: Users now see the same sportsbooks in both Game Odds and Player Props modes, creating a more intuitive and predictable experience.

2. **Improved Data Access**: Users can now access player props data from all sportsbooks, not just a limited subset.

3. **Simplified Code**: The code is now simpler and more maintainable without the complex filtering logic.

4. **Better User Control**: Users have full control over which sportsbooks they want to see in both modes through their saved preferences.

## Technical Details

The fix addresses two separate filtering mechanisms that were previously in place:

1. **Runtime Filtering**: The `enhancedSportsbookList` function was filtering sportsbooks based on a predefined whitelist in Player Props mode.

2. **Default Selection Filtering**: The `getUserSelectedSportsbooks` function was providing different default sportsbook selections for Game Odds mode versus Player Props mode.

Both of these filtering mechanisms have been removed to ensure consistency between the two modes.

## Note on API Behavior

While the UI now shows all sportsbooks in both modes, it's important to note that some sportsbooks may not return player props data from the API. This is a limitation of the data source, not our application. However, we've decided that it's better to show all sportsbooks and let the API determine which ones have data, rather than pre-filtering based on assumptions about which sportsbooks support player props.
