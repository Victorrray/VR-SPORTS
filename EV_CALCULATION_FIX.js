// EV_CALCULATION_FIX.js
// This file contains fixes for the EV calculation to ensure proper +EV detection for Fliff

// ============================================================
// ISSUES IDENTIFIED
// ============================================================
// 1. EV Calculation with Filtered Books: When only one sportsbook is selected, we don't have enough data to calculate a fair line
// 2. Minimum EV Threshold: The evMin parameter might be filtering out some +EV bets
// 3. Book-specific EV Calculation: Fliff isn't included in the DFS app list for special EV calculation

// ============================================================
// FIX 1: Update the getEV function to use all books for fair line calculation
// ============================================================

const getEV = row => {
  const userOdds = Number(row?.out?.price ?? row?.out?.odds ?? 0);
  if (!userOdds) return null;
  
  // Get bookmaker key for DFS-specific EV calculation
  const bookmakerKey = row?.out?.bookmaker?.key || row?.out?.book?.toLowerCase();
  
  // IMPORTANT: For fair line calculation, we use ALL books, not just filtered books
  // This ensures we have enough data to calculate an accurate fair line
  const allBooks = row.allBooks || [];
  
  // Only proceed if we have enough books for a meaningful consensus
  if (allBooks.length < 2) return null;
  
  // For player props, use consensus probability from all available books
  if (row.isPlayerProp || (row.mkt?.key && row.mkt.key.includes('player_'))) {
    const probs = allBooks.map(b => americanToProb(b.price ?? b.odds))
      .filter(p => typeof p === "number" && p > 0 && p < 1);
    const consensusProb = median(probs);
    const uniqCnt = new Set(allBooks.map(b => b.bookmaker?.key || b.book || '')).size;
    
    if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 2) {
      const fairDec = 1 / consensusProb;
      return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
    }
    return null;
  }
  
  // Use devig method if available
  const pDevig = devigMap.get(row.key);
  const pairCnt = devigPairCount(row);
  if (pDevig && pDevig > 0 && pDevig < 1 && pairCnt > 2) {
    const fairDec = 1 / pDevig;
    return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
  }
  
  // Fallback to consensus method for regular markets using all books
  const probs = allBooks.map(b => americanToProb(b.price ?? b.odds))
    .filter(p => typeof p === "number" && p > 0 && p < 1);
  const consensusProb = median(probs);
  const uniqCnt = new Set(allBooks.map(b => b.bookmaker?.key || b.book || '')).size;
  
  if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 3) {
    const fairDec = 1 / consensusProb;
    return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
  }
  return null;
};

// ============================================================
// FIX 2: Update the calculateEV function to include Fliff in the DFS app list
// ============================================================

function calculateEV(odds, fairLine, bookmakerKey = null) {
  if (!odds || !fairLine) return null;
  const toDec = o => (o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1);
  
  // Special EV calculation for DFS apps and Fliff
  const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'prophetx', 'fliff'].includes(bookmakerKey);
  
  if (isDFSApp) {
    // DFS apps typically pay even money (+100) or close to it
    // We compare their effective payout against market consensus
    const dfsPayoutOdds = +100; // Even money payout for DFS
    const dfsDec = toDec(dfsPayoutOdds);
    const fairDec = toDec(fairLine);
    
    // For DFS: +EV when market odds are worse than -100 (more negative)
    // Example: If market is -140, DFS +100 is +EV
    return ((dfsDec / fairDec) - 1) * 100;
  }
  
  // Standard EV calculation for traditional sportsbooks
  const userDec = toDec(odds);
  const fairDec = toDec(fairLine);
  return ((userDec / fairDec) - 1) * 100;
}

// ============================================================
// FIX 3: Add debug logging to show EV values for Fliff bets
// ============================================================

// Add this useEffect to the OddsTable component
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

// ============================================================
// IMPLEMENTATION INSTRUCTIONS
// ============================================================
// 1. Open the file: /Users/victorray/Desktop/vr-odds/client/src/components/betting/OddsTable.js
// 2. Find the getEV function (around line 1207) and replace it with the implementation above
// 3. Find the calculateEV function (around line 137) and update it to include Fliff in the DFS app list
// 4. Add the debug logging useEffect after the state declarations
// 5. Test by selecting only Fliff as your sportsbook and check the console for +EV bets
