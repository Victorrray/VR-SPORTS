# Market Filtering Fix for Multiple Sports

## Problem Fixed

We identified and fixed an issue where the VR-Odds platform was not properly showing odds for multiple sports with different market types (MLB, NHL, NFL, NCAA). The market filtering logic was rejecting some sports entirely because their markets didn't match the currently selected markets.

## Issue Details

There were several issues in the market filtering logic:

1. **Incorrect Market Combination**: The `marketsForMode` variable was incorrectly combining regular markets and player prop markets:
   ```javascript
   const marketsForMode = isPlayerPropsMode ? [...marketKeys, ...selectedPlayerPropMarkets] : marketKeys;
   ```

2. **Limited Market Selection**: When multiple sports were selected, the auto-selected markets didn't include all necessary markets for each sport.

3. **Market Overwriting**: When adding a new sport, the previously selected markets were being overwritten rather than merged.

## Solution Implemented

We've made several changes to fix these issues:

1. **Fixed marketsForMode Variable**:
   ```javascript
   // Use only player prop markets in player props mode, regular markets otherwise
   const marketsForMode = isPlayerPropsMode ? selectedPlayerPropMarkets : marketKeys;
   ```

2. **Added getAllCompatibleMarkets Function**:
   ```javascript
   const getAllCompatibleMarkets = (sports) => {
     // Core markets that work across all sports
     const coreMarkets = ['h2h', 'spreads', 'totals'];
     
     // If no sports selected or in player props mode, return default
     if (!sports || sports.length === 0) {
       return coreMarkets;
     }
     
     // For player props mode, return the selected player prop markets
     if (isPlayerPropsMode) {
       return selectedPlayerPropMarkets;
     }
     
     // For regular mode with selected markets, use those
     if (marketKeys && marketKeys.length > 0) {
       return marketKeys;
     }
     
     // Fallback to core markets
     return coreMarkets;
   };
   ```

3. **Updated getRelevantMarkets Function**:
   ```javascript
   const getRelevantMarkets = (selectedSports) => {
     // ... existing code ...
     
     // Always include default markets for better compatibility
     MARKETS_BY_SPORT.default.forEach(market => {
       allMarkets.set(market.key, market);
     });
     
     // ... rest of the function ...
   };
   ```

4. **Improved Auto-Select Logic**:
   ```javascript
   useEffect(() => {
     if (picked && picked.length > 0) {
       // Get all relevant markets for the selected sports
       const autoSelectedMarkets = getAutoSelectedMarkets(picked);
       
       // If we already have some markets selected, merge them with the auto-selected ones
       if (marketKeys && marketKeys.length > 0) {
         const combinedMarkets = new Set([...marketKeys, ...autoSelectedMarkets]);
         setMarketKeys(Array.from(combinedMarkets));
       } else {
         setMarketKeys(autoSelectedMarkets);
       }
     }
   }, [picked]);
   ```

5. **Updated useMarkets Hook Call**:
   ```javascript
   useMarkets(
     sportsForMode,
     regionsForMode,
     getAllCompatibleMarkets(sportsForMode),
     { date: selectedDate }
   );
   ```

## Benefits

- You can now see odds for multiple sports with different market types (MLB, NHL, NFL, NCAA)
- Adding a new sport won't overwrite your existing market selections
- The platform will use the most compatible markets for each sport
- Core markets (h2h, spreads, totals) are always included for better compatibility

## Testing

To verify the fix:
1. Select multiple sports with different market types (e.g., MLB, NHL, NFL, NCAA)
2. You should now see games from all selected sports
3. Try adding and removing sports to ensure your market selections are preserved
4. Switch between regular mode and player props mode to ensure both work correctly

## Additional Notes

This fix complements the multi-sport selection fix we implemented earlier. Now you can:
- Select multiple sports to see a wider range of betting opportunities
- See odds for sports with different market types
- Get a more comprehensive overview of all available betting options
