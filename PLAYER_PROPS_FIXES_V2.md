# Player Props Fixes V2

## Issues Fixed

1. **Sportsbook Selection in Player Props Filter**: The player props filter menu wasn't showing all available sportsbooks, limiting users to only a few options.

2. **Player Props Not Populating**: The player props feature was disabled on the server side, resulting in 0 games being returned.

## Changes Made

### 1. Fixed Sportsbook Selection in Player Props Filter

```javascript
// Before: Limited default sportsbooks for player props mode
if (mode === 'props') {
  // Include both traditional sportsbooks and DFS apps for player props
  return ['draftkings', 'fanduel', 'betmgm', 'caesars', 'prizepicks', 'underdog', 'pick6'];
}

// After: Show ALL available sportsbooks in player props mode
if (mode === 'props') {
  // Return empty array to show ALL sportsbooks (no filtering)
  return [];
}
```

By returning an empty array for player props mode, we're telling the system to show all available sportsbooks without any filtering. This ensures that users can see and select from the complete list of sportsbooks when in player props mode.

### 2. Documented How to Enable Player Props

Created a new file `ENABLE_PLAYER_PROPS.md` with detailed instructions on how to enable player props on the server side:

1. Set `ENABLE_PLAYER_PROPS_V2=true` in the server's `.env` file
2. Configure additional environment variables for optimal performance
3. Restart the server

## Benefits

1. **Complete Sportsbook Selection**: Users can now see and select from all available sportsbooks in player props mode, not just a limited subset.

2. **Clear Path to Enable Player Props**: The documentation provides a clear and simple way to enable player props on the server side.

3. **Improved User Experience**: With these changes, users will have a more consistent and comprehensive experience when using player props.

## Technical Details

The key insight was that the player props feature was disabled at the server level (`ENABLE_PLAYER_PROPS_V2` environment variable not set to 'true'), and the sportsbook selection in player props mode was unnecessarily limited.

By returning an empty array for the sportsbook selection in player props mode, we leverage the existing logic in the `effectiveSelectedBooks` function that treats an empty array as "show all books":

```javascript
// If no books are explicitly selected, return an EMPTY ARRAY to signal "show all books"
const result = (currentSelectedBooks && currentSelectedBooks.length) 
  ? currentSelectedBooks 
  : [];
```

This ensures that all available sportsbooks are shown in the player props filter menu.
