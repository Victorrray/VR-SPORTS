# OddsTable Integration Guide

## Overview
The OddsTable component has been enhanced to support comprehensive filtering across all modes (Straight Bets, Player Props, Arbitrage, and Middles) with full compliance to tool filters.

## Supported Modes

### 1. **Straight Bets Mode** (`mode="game"`)
- Displays regular game odds (h2h, spreads, totals, etc.)
- Filters:
  - **Sportsbook Filter**: Select which traditional sportsbooks to display
  - **Market Filter**: Choose which market types (h2h, spreads, totals, etc.)
  - **Date Filter**: Filter games by date
  - **EV Filter**: Show only +EV bets or minimum EV threshold
  - **Data Points**: Minimum number of sportsbooks offering the bet
  - **Search**: Filter by team name, game, or market

### 2. **Player Props Mode** (`mode="props"`)
- Displays player prop markets from all bookmakers (traditional + DFS)
- Filters:
  - **Sportsbook Filter**: Select sportsbooks/DFS apps
  - **Market Filter**: Choose specific player prop markets (passing yards, points, rebounds, etc.)
  - **EV Filter**: Show only +EV props
  - **Data Points**: Minimum number of books offering the prop
  - **Search**: Filter by player name, team, or market type

### 3. **Arbitrage Mode** (`mode="arbitrage"`)
- Detects guaranteed profit opportunities
- Filters:
  - **Minimum Profit %**: Only show arbitrage with profit >= threshold
  - **Max Stake**: Maximum amount to risk per arbitrage
  - **Market Filter**: Select which markets to analyze
  - **Sportsbook Filter**: Choose which books to include

### 4. **Middles Mode** (`mode="middles"`)
- Finds middle betting opportunities (win both bets when result lands between lines)
- Filters:
  - **Minimum Gap**: Minimum point gap between lines (0.5-20)
  - **Min Probability %**: Minimum probability of hitting the middle
  - **Max Stake**: Maximum stake per middle
  - **Market Filter**: Select markets to analyze

## Filter Props

### Core Filters (All Modes)
```javascript
{
  // Sportsbook selection
  bookFilter: [],  // Array of sportsbook keys to include
  
  // Market selection
  marketFilter: [],  // Array of market keys to include
  
  // Search functionality
  searchQuery: "",  // Text search for teams/players/markets
  
  // Data quality
  dataPoints: 10,  // Minimum number of sportsbooks for a bet
  
  // EV filtering
  evOnlyPositive: false,  // Only show +EV bets
  evMin: null,  // Minimum EV threshold (e.g., 2.5 for +2.5% EV)
}
```

### Mode-Specific Filters
```javascript
{
  // Arbitrage mode
  minProfit: 0.5,  // Minimum profit percentage (0.5% = guaranteed 0.5% profit)
  maxStake: 1000,  // Maximum stake per arbitrage
  
  // Middles mode
  minMiddleGap: 3,  // Minimum gap between lines (points)
  minMiddleProbability: 15,  // Minimum probability of hitting middle (%)
  maxStake: 1000,  // Maximum stake per middle
}
```

## Filter Application Order

1. **Mode-Specific Filtering** - Apply arbitrage/middles thresholds
2. **Sportsbook Filtering** - Filter by selected books
3. **Market Filtering** - Filter by selected markets
4. **Search Filtering** - Apply text search
5. **Data Points Filtering** - Ensure minimum book coverage
6. **EV Filtering** - Apply EV thresholds
7. **Best Odds Selection** - Keep only best odds per game/market/point
8. **Sorting** - Sort by selected criteria (EV, odds, time, etc.)

## Usage Examples

### Straight Bets with Filters
```javascript
<OddsTable
  games={games}
  mode="game"
  bookFilter={['draftkings', 'fanduel', 'betmgm']}
  marketFilter={['spreads', 'totals']}
  evMin={2.5}  // Only +2.5% EV or better
  dataPoints={5}  // At least 5 books offering the bet
  searchQuery="NFL"
/>
```

### Player Props with DFS Apps
```javascript
<OddsTable
  games={games}
  mode="props"
  bookFilter={['prizepicks', 'underdog']}  // DFS apps only
  marketFilter={['player_points', 'player_rebounds', 'player_assists']}
  evOnlyPositive={true}  // Only +EV props
  dataPoints={3}
/>
```

### Arbitrage Detection
```javascript
<OddsTable
  games={games}
  mode="arbitrage"
  minProfit={0.5}  // Only 0.5%+ guaranteed profit
  maxStake={500}
  marketFilter={['h2h', 'spreads', 'totals']}
  bookFilter={['draftkings', 'fanduel', 'betmgm', 'caesars']}
/>
```

### Middles Finder
```javascript
<OddsTable
  games={games}
  mode="middles"
  minMiddleGap={2}  // At least 2 point gap
  minMiddleProbability={20}  // 20%+ probability
  maxStake={1000}
  marketFilter={['spreads', 'totals']}
/>
```

## Key Features

### 1. **Intelligent Market Filtering**
- Automatically detects player prop markets (player_*, batter_*, pitcher_*)
- Respects mode-specific market requirements
- Prevents invalid market combinations

### 2. **DFS App Handling**
- Recognizes DFS-only apps (PrizePicks, Underdog, etc.)
- Applies fixed odds (-119) for DFS apps
- Separates DFS from traditional sportsbooks

### 3. **EV Calculation**
- Uses weighted consensus probability from all available books
- Minimum 3 books required for reliable EV
- Fallback comparison method when consensus unavailable
- Special handling for DFS apps

### 4. **Data Points Filter**
- Ensures minimum book coverage for each bet
- Counts unique sportsbooks offering the specific bet
- Improves reliability of EV calculations

### 5. **Search Functionality**
- Searches across player names, team names, markets
- Case-insensitive matching
- Works across all modes

### 6. **Best Odds Selection**
- Automatically selects best odds per game/market/point
- Compares across filtered sportsbooks
- Uses EV as tiebreaker when odds are equal

## Debugging

### Enable Console Logging
All filters include comprehensive console logging:
- `🎯 ARBITRAGE MODE` - Arbitrage filtering
- `🎪 MIDDLES MODE` - Middles filtering
- `🔍 DFS FILTER DEBUG` - DFS app filtering
- `🎯 MARKET FILTER` - Market selection
- `🔍 SEARCH FILTER` - Search results
- `🔍 DATA POINTS FILTER` - Data point filtering
- `✅ EV CALC SUCCESS` - EV calculation details

### Common Issues

**No results showing:**
1. Check if marketFilter is empty (should be empty array for all markets)
2. Verify bookFilter includes available sportsbooks
3. Check EV threshold isn't too high
4. Ensure dataPoints threshold isn't too strict

**Wrong odds displaying:**
1. Verify bookFilter is correctly set
2. Check if DFS apps are being filtered correctly
3. Ensure best odds selection is working (check console logs)

**EV not calculating:**
1. Need minimum 3 unique sportsbooks for reliable EV
2. Check if odds data is valid
3. Verify book weights are configured correctly

## Integration with SportsbookMarkets

The OddsTable is integrated into SportsbookMarkets.js with:
- Filter state management
- Mode switching (Straight Bets ↔ Player Props ↔ Arbitrage ↔ Middles)
- Filter application/reset buttons
- Mobile and desktop filter panels
- Real-time filter updates

## Future Enhancements

1. **Advanced Filtering**
   - Time-based filters (game starts in X hours)
   - Confidence scores for arbitrage/middles
   - Historical EV tracking

2. **Performance Optimization**
   - Memoize filter functions
   - Lazy load large datasets
   - Implement virtual scrolling

3. **User Preferences**
   - Save filter presets
   - Default filter configurations
   - Filter history

## Related Files

- `/client/src/pages/SportsbookMarkets.js` - Main page with filter UI
- `/client/src/components/betting/OddsTable.js` - Core table component
- `/client/src/components/betting/ArbitrageDetector.js` - Arbitrage logic
- `/client/src/components/betting/MiddlesDetector.js` - Middles logic
- `/client/src/components/betting/PlayerProps.js` - Player props handling
