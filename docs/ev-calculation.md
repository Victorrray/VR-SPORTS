# Expected Value (EV) Calculation

## Overview
Expected Value (EV) calculation helps bettors identify value in betting markets by comparing a bookmaker's odds against the market consensus.

## Requirements for EV Calculation

### Minimum Bookmakers Required
- **Player Props**: Minimum 3 bookmakers
- **Game Odds**: Minimum 3 bookmakers

## Why These Requirements Exist

EV calculation requires establishing a "fair line" by:
1. Collecting odds from multiple bookmakers
2. Calculating the consensus probability (fair line)
3. Comparing your bookmaker's odds to the fair line
4. Calculating EV = (Your Odds - Fair Line)

## Common Issues

### Zero EV (0.00%) Display
This typically occurs when:
- Fewer than 3 bookmakers are selected
- The selected bookmakers don't offer the specific market
- The player/market combination isn't widely covered

### Missing Data from Certain Bookmakers
Some bookmakers might be missing data because:
1. The bookmaker doesn't offer the specific market
2. Lines haven't been posted yet for upcoming games
3. The player/market combination isn't offered by that bookmaker

## Verifying Coverage

### Test with Popular Players
For more reliable results, try searching for:
- Star players (higher coverage)
- Popular markets (e.g., Rush Yards, Passing Yards)
- Mainstream sports (NFL, NBA, etc.)

### Expected Coverage
- **Star Players**: 5-10+ bookmakers
- **Role Players**: 2-4 bookmakers
- **Niche Markets**: 1-2 bookmakers

## Technical Implementation

### EV Calculation Logic
```javascript
if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 3) {
  // Calculate EV
  const fairDec = 1 / consensusProb;
  const ev = calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
  return ev;
}
```

### Requirements for EV Calculation
1. `consensusProb` exists (calculated from multiple bookmakers)
2. `consensusProb` is valid (between 0 and 1)
3. `uniqCnt >= 3` (at least 3 unique bookmakers)

## Troubleshooting

### If EV is 0.00%
1. Ensure you've selected at least 3 bookmakers
2. Try a more popular player/market combination
3. Check if the game is too far in the future (lines may not be posted yet)
4. Verify that the selected bookmakers offer the specific market

### Improving EV Accuracy
- Select more bookmakers (5+ recommended)
- Focus on widely available markets
- Check closer to game time for more accurate lines
