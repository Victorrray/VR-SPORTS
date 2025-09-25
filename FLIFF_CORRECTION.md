# Fliff Odds Correction

## Correction Made

We've corrected a misclassification in our code where Fliff was incorrectly treated as a DFS (Daily Fantasy Sports) app. This was causing its EV calculations to be processed differently than standard sportsbooks.

## Changes Implemented

1. **Removed Fliff from DFS App List**:
   ```javascript
   // Before:
   const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'prophetx', 'fliff'].includes(bookmakerKey);
   
   // After:
   const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'prophetx'].includes(bookmakerKey);
   ```

2. **Restored Standard EV Calculation for Fliff**:
   - Fliff will now use the standard EV calculation method for traditional sportsbooks
   - This ensures that Fliff's odds are evaluated correctly against the market consensus

## Correct Classification

- **DFS Apps**: PrizePicks, Underdog, Pick6, ProphetX
- **Traditional Sportsbooks**: Fliff, DraftKings, FanDuel, BetMGM, etc.

## Impact on EV Calculation

- DFS apps typically offer fixed odds (usually +100 or -110/-115)
- Traditional sportsbooks like Fliff offer variable odds based on market conditions
- By correctly classifying Fliff, its EV calculations will now properly reflect its true value compared to market consensus

## Why This Matters

- Accurate EV calculation is essential for identifying truly valuable betting opportunities
- Misclassifying a sportsbook can lead to incorrect EV values
- This correction ensures that Fliff bets are evaluated fairly against the market

## Next Steps

If you notice that Fliff's odds are consistently around -115 despite this correction, it may be worth investigating:

1. Whether Fliff actually does use a fixed-odds model despite not being a DFS app
2. If there might be other issues affecting how Fliff's odds are displayed or calculated

Please let us know if you notice any other inconsistencies with how Fliff's odds are displayed or calculated.
