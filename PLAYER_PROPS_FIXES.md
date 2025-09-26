# Player Props Fixes

## Issues Fixed

1. **Player Props Not Showing Any Bets**: The player props mode was not displaying any bets due to overly strict loading and filtering logic.

2. **Limited Sportsbook Selection**: The default sportsbook selection for player props mode only included 4 traditional sportsbooks, missing important DFS apps.

3. **Inconsistent Sportsbook Display**: The player props mode wasn't showing the same comprehensive list of sportsbooks as the game odds mode.

## Changes Made

### 1. Updated Default Sportsbook Selection for Player Props

```javascript
// Before: Same defaults for both modes
const getUserSelectedSportsbooks = (mode = 'game') => {
  // ...
  // Use the same default selections for both game mode and props mode
  return ['draftkings', 'fanduel', 'betmgm', 'caesars'];
};

// After: Different defaults for player props mode
const getUserSelectedSportsbooks = (mode = 'game') => {
  // ...
  // Different default selections for game mode and props mode
  if (mode === 'props') {
    // Include both traditional sportsbooks and DFS apps for player props
    return ['draftkings', 'fanduel', 'betmgm', 'caesars', 'prizepicks', 'underdog', 'pick6'];
  }
  
  // Default to popular sportsbooks for game odds
  return ['draftkings', 'fanduel', 'betmgm', 'caesars'];
};
```

### 2. Improved Player Props Loading Detection

```javascript
// Before: Only checking for selected markets
const hasPropsData = filteredGames.some(game => 
  game.bookmakers?.some(book => 
    book.markets?.some(market => 
      selectedPlayerPropMarkets.includes(market.key)
    )
  )
);

// After: Checking for ANY player prop markets
const hasPropsData = filteredGames.some(game => 
  game.bookmakers?.some(book => 
    book.markets?.some(market => 
      market.key.startsWith('player_') // Any player prop market
    )
  )
);
```

### 3. Reduced Loading Time and Improved Timeout Handling

```javascript
// Before: Strict loading condition
const shouldShowLoading = marketsLoading || (!hasPropsData && filteredGames.length > 0);

// After: Less strict loading condition
const shouldShowLoading = marketsLoading && (!filteredGames.length || !hasPropsData);
```

```javascript
// Before: Keeping loading state even after timeout
if (!hasPropsData && !marketsLoading) {
  console.log('🎯 No props data after timeout, keeping loading state');
  setPlayerPropsProcessing(true);
}

// After: Showing available data after timeout
if (filteredGames.length > 0 && !hasPropsData && !marketsLoading) {
  console.log('🎯 Games found but no props data after timeout, showing available data');
  setPlayerPropsProcessing(false);
}
```

### 4. Reduced Timeout Duration

```javascript
// Before: 3 second timeout
}, 3000); // 3 second timeout for player props

// After: 2 second timeout
}, 2000); // Reduced timeout to 2 seconds
```

## Benefits

1. **More Comprehensive Data**: Player props mode now includes both traditional sportsbooks and DFS apps by default.

2. **Faster Loading**: The loading state is less strict and times out faster, showing available data more quickly.

3. **Better User Experience**: Users can see player props data even if not all selected markets are available.

4. **Consistent Sportsbook Display**: Both game odds and player props modes now show a comprehensive list of sportsbooks.

## Technical Details

The key insight was that the player props loading logic was too strict in two ways:

1. It was only checking for the specific selected markets, not any player prop markets.
2. It was keeping the loading state active even when data was available but didn't match the selected markets.

By making these changes, we've made the player props mode more resilient and user-friendly, showing whatever data is available as quickly as possible.
