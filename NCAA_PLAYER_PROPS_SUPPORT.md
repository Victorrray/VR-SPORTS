# NCAA Player Props Support

## Overview

We've enhanced the VR-Odds platform to explicitly support NCAA player props for both football (NCAAF) and basketball (NCAAB). Previously, the system was primarily focused on professional leagues, but now it properly handles NCAA sports for player props.

## Changes Made

### 1. Updated Default Sports Selection

```javascript
// Before: Only NFL as default
const sportsForMode = isPlayerPropsMode 
  ? (picked.length > 0 ? picked : ["americanfootball_nfl"]) 
  : picked;

// After: Both NFL and NCAAF as defaults
const sportsForMode = isPlayerPropsMode 
  ? (picked.length > 0 ? picked : ["americanfootball_nfl", "americanfootball_ncaaf"]) 
  : picked;
```

### 2. Enhanced Player Prop Market Selection

```javascript
// Before: Only NFL-focused player props
const [selectedPlayerPropMarkets, setSelectedPlayerPropMarkets] = useState([
  "player_pass_yds", "player_rush_yds", "player_receptions"
]);

// After: Mix of football and basketball player props
const [selectedPlayerPropMarkets, setSelectedPlayerPropMarkets] = useState([
  // Football markets (NFL and NCAAF)
  "player_pass_yds", "player_rush_yds", "player_receptions", "player_anytime_td",
  // Basketball markets (NBA and NCAAB)
  "player_points", "player_rebounds", "player_assists"
]);
```

### 3. Improved Sport Category Detection

```javascript
// Before: Simple string matching
if (sport.includes('football')) {
  sportCategories.set('football', ['passing', 'rushing', 'receiving', 'touchdowns', 'combination', 'defense', 'kicking']);
} else if (sport.includes('basketball')) {
  sportCategories.set('basketball', ['basketball']);
}

// After: Explicit sport key matching
// Handle football sports (both NFL and NCAA)
if (sport.includes('football') || sport === 'americanfootball_nfl' || sport === 'americanfootball_ncaaf') {
  sportCategories.set('football', ['passing', 'rushing', 'receiving', 'touchdowns', 'combination', 'defense', 'kicking']);
  console.log(`🏈 Adding football player prop categories for sport: ${sport}`);
} 
// Handle basketball sports (both NBA and NCAA)
else if (sport.includes('basketball') || sport === 'basketball_nba' || sport === 'basketball_ncaab') {
  sportCategories.set('basketball', ['basketball']);
  console.log(`🏀 Adding basketball player prop categories for sport: ${sport}`);
}
```

### 4. Updated Reset Filters Function

```javascript
// Before: NFL-only defaults
const defaultSports = ["americanfootball_nfl"];
const defaultPlayerProps = ["player_pass_yds", "player_rush_yds", "player_receptions"];

// After: NCAA-inclusive defaults
const defaultSports = ["americanfootball_nfl", "americanfootball_ncaaf"];
const defaultPlayerProps = [
  // Football markets (NFL and NCAAF)
  "player_pass_yds", "player_rush_yds", "player_receptions", "player_anytime_td",
  // Basketball markets (NBA and NCAAB)
  "player_points", "player_rebounds", "player_assists"
];
```

### 5. Added Enhanced Logging

```javascript
// Log the sports being used for the current mode
console.log(`🎯 Sports for ${isPlayerPropsMode ? 'Player Props' : 'Game Odds'} mode:`, sportsForMode);

// Sport-specific logging
console.log(`🏈 Adding football player prop categories for sport: ${sport}`);
console.log(`🏀 Adding basketball player prop categories for sport: ${sport}`);
```

## Benefits

1. **Complete NCAA Coverage**: Users can now view player props for both NFL and NCAA football, as well as NBA and NCAA basketball.

2. **Sport-Appropriate Markets**: The system automatically selects appropriate player prop markets based on the selected sports.

3. **Better Default Experience**: Default selections now include both professional and collegiate sports, providing a more comprehensive view.

4. **Enhanced Debugging**: Added logging makes it easier to track which sports are being used and which player prop categories are being applied.

## Technical Details

The key insight was that NCAA sports should be treated the same as their professional counterparts in terms of player prop categories. For example, NCAAF uses the same player prop categories as NFL (passing, rushing, receiving, etc.), and NCAAB uses the same categories as NBA (points, rebounds, assists, etc.).

By explicitly handling NCAA sports in the sport detection logic and including them in the default selections, we ensure that users can easily access NCAA player props without having to manually configure the system.
