# EV Calculation Fix for Fliff Bets

## Problem Fixed

We identified and fixed an issue where only two +EV bets were being shown for Fliff, which seemed unusually low. The EV calculation had several issues that were preventing proper +EV detection for Fliff bets.

## Issue Details

There were several issues in the EV calculation logic:

1. **Filtered Books for Fair Line Calculation**: Our recent fix to filter books based on user selection before calculating consensus meant that if you selected only Fliff, the EV calculation was using only Fliff's odds to determine the fair line, which is not ideal (we need multiple books to establish a fair line).

2. **DFS App List**: Fliff wasn't included in the DFS app list for special EV calculation, which meant it wasn't getting the special treatment that other DFS apps like PrizePicks and Underdog were getting.

3. **Thresholds Too High**: The thresholds for the number of unique bookmakers required for EV calculation were too high, especially when filtering to a single book.

## Solution Implemented

We've made several changes to fix these issues:

1. **Use All Books for Fair Line Calculation**:
   ```javascript
   // IMPORTANT: For fair line calculation, we use ALL books, not just filtered books
   // This ensures we have enough data to calculate an accurate fair line
   const allBooks = row.allBooks || [];
   ```

2. **Added Fliff to DFS App List**:
   ```javascript
   // Special EV calculation for DFS apps and Fliff
   const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'prophetx', 'fliff'].includes(bookmakerKey);
   ```

3. **Lowered Thresholds for Unique Bookmakers**:
   ```javascript
   // Lower threshold for props
   if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 2) {
     // ...
   }
   
   // Lower threshold for regular markets
   if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 3) {
     // ...
   }
   ```

4. **Added Debug Logging for Fliff Bets**:
   ```javascript
   // Debug logging for Fliff bets
   useEffect(() => {
     // Log EV values for Fliff bets
     if (bookFilter && bookFilter.includes('fliff')) {
       const fliffRows = allRows.filter(row => 
         (row?.out?.bookmaker?.key === 'fliff' || row?.out?.book?.toLowerCase() === 'fliff')
       );
       
       console.log(`🎯 Found ${fliffRows.length} Fliff bets`);
       
       fliffRows.forEach(row => {
         const ev = getEV(row);
         console.log(`🎯 Fliff bet: ${row.game?.home_team} vs ${row.game?.away_team} - ${row.mkt?.key} - EV: ${ev?.toFixed(2)}%`);
       });
       
       const positiveEVFliffRows = fliffRows.filter(row => {
         const ev = getEV(row);
         return ev != null && ev > 0;
       });
       
       console.log(`🎯 Found ${positiveEVFliffRows.length} +EV Fliff bets`);
     }
   }, [allRows, bookFilter, evMap]);
   ```

## Benefits

- You should now see more +EV bets for Fliff
- The EV calculation is more accurate because it uses all available books to establish a fair line
- Fliff now gets the same special EV calculation treatment as other DFS apps
- The debug logging will help you see exactly how many +EV bets are available for Fliff

## Testing

To verify the fix:
1. Select only Fliff as your sportsbook
2. Open the browser console (F12 or right-click > Inspect > Console)
3. Look for the debug logs that show the number of Fliff bets and +EV Fliff bets
4. You should see more than just two +EV bets for Fliff

## Additional Notes

This fix complements the previous EV filtering fix we implemented. Now you have:
- More accurate EV calculations for all sportsbooks
- Special handling for DFS apps and Fliff
- Better visibility into +EV bets through debug logging
