// MARKET_FILTER_FIX.js
// This file contains the fix for the market filtering issue in the VR-Odds platform

// ============================================================
// PROBLEM IDENTIFIED
// ============================================================
// When multiple sports with different market types are selected (e.g., MLB, NHL, NFL, NCAA),
// the current implementation has two issues:
//
// 1. The marketsForMode variable combines regular markets and player prop markets incorrectly:
//    const marketsForMode = isPlayerPropsMode ? [...marketKeys, ...selectedPlayerPropMarkets] : marketKeys;
//
// 2. The auto-selected markets are based on the combined markets from all selected sports,
//    but when the API is called, it might reject some sports if their markets don't match.

// ============================================================
// SOLUTION
// ============================================================
// 1. Fix the marketsForMode variable to use the appropriate markets for each mode
// 2. Modify the useMarkets hook call to include all relevant markets for the selected sports
// 3. Update the auto-select logic to be more inclusive of different sports' markets

// ============================================================
// FIX 1: Update marketsForMode to use appropriate markets for each mode
// ============================================================
// Replace line 247 in SportsbookMarkets.js with:

// Use only player prop markets in player props mode, regular markets otherwise
const marketsForMode = isPlayerPropsMode ? selectedPlayerPropMarkets : marketKeys;

// ============================================================
// FIX 2: Modify the useEffect for auto-selecting markets when sports change
// ============================================================
// Replace the useEffect around line 464 with:

// Auto-select all relevant markets when applied sports change
useEffect(() => {
  if (picked && picked.length > 0) {
    // Get all relevant markets for the selected sports
    const autoSelectedMarkets = getAutoSelectedMarkets(picked);
    
    // If we already have some markets selected, merge them with the auto-selected ones
    // to ensure we don't lose any markets when adding new sports
    if (marketKeys && marketKeys.length > 0) {
      // Create a Set to avoid duplicates
      const combinedMarkets = new Set([...marketKeys, ...autoSelectedMarkets]);
      setMarketKeys(Array.from(combinedMarkets));
      console.log('🎯 Combined markets for sports:', picked, '→', Array.from(combinedMarkets));
    } else {
      // If no markets are selected yet, use the auto-selected ones
      setMarketKeys(autoSelectedMarkets);
      console.log('🎯 Auto-selected markets for sports:', picked, '→', autoSelectedMarkets);
    }
  }
}, [picked]);

// ============================================================
// FIX 3: Update the getRelevantMarkets function to be more inclusive
// ============================================================
// Replace the getRelevantMarkets function around line 819 with:

// Function to get relevant markets based on selected sports
const getRelevantMarkets = (selectedSports) => {
  if (!selectedSports || selectedSports.length === 0) {
    return organizeMarketsByCategory(MARKETS_BY_SPORT.default);
  }

  // If multiple sports selected, combine all relevant markets
  const allMarkets = new Map();
  
  // Always include default markets for better compatibility
  MARKETS_BY_SPORT.default.forEach(market => {
    allMarkets.set(market.key, market);
  });
  
  selectedSports.forEach(sport => {
    let sportCategory = 'default';
    
    if (sport.includes('football')) sportCategory = 'americanfootball';
    else if (sport.includes('basketball')) sportCategory = 'basketball';
    else if (sport.includes('baseball')) sportCategory = 'baseball';
    else if (sport.includes('hockey')) sportCategory = 'hockey';
    else if (sport.includes('soccer')) sportCategory = 'soccer';
    
    const markets = MARKETS_BY_SPORT[sportCategory] || MARKETS_BY_SPORT.default;
    markets.forEach(market => {
      allMarkets.set(market.key, market);
    });
  });

  return organizeMarketsByCategory(Array.from(allMarkets.values()));
};

// ============================================================
// ADDITIONAL IMPROVEMENT: Update the marketsForMode calculation
// ============================================================
// Add this function before the useMarkets hook call:

// Function to get all compatible markets for the selected sports
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

// Then replace the useMarkets hook call with:
const { 
  games: marketGames = [], 
  books: marketBooks = [], 
  isLoading: marketsLoading, 
  error: marketsError, 
  bookmakers 
} = useMarkets(
  sportsForMode,
  regionsForMode,
  getAllCompatibleMarkets(sportsForMode),
  { date: selectedDate }
);
