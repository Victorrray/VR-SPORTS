// FINAL_EV_FIX.js
// This file contains the final implementation to fix the EV filtering logic
// in the OddsTable.js component of the VR-Odds platform

// ============================================================
// IMPLEMENTATION INSTRUCTIONS
// ============================================================
// 1. Open the file: /Users/victorray/Desktop/vr-odds/client/src/components/betting/OddsTable.js
// 2. Find the getEV function (around line 1207)
// 3. Replace it with the implementation below
// 4. Find the calculateSideEV function (around line 848)
// 5. Replace it with the implementation below
// 6. Add the debug logging useEffect after the state declarations
// 7. Update the EV column header with the visual indicator
// 8. Add the CSS for the filter badge to OddsTable.css

// ============================================================
// REPLACEMENT FOR getEV FUNCTION (around line 1207)
// ============================================================

const getEV = row => {
  const userOdds = Number(row?.out?.price ?? row?.out?.odds ?? 0);
  if (!userOdds) return null;
  
  // Get bookmaker key for DFS-specific EV calculation
  const bookmakerKey = row?.out?.bookmaker?.key || row?.out?.book?.toLowerCase();
  
  // FIXED: Filter books based on user selection before calculating consensus
  const filteredBooks = bookFilter && bookFilter.length > 0 
    ? (row.allBooks || []).filter(book => {
        const key = (book?.bookmaker?.key || book?.book || '').toLowerCase();
        return bookFilter.includes(key);
      })
    : (row.allBooks || []);
  
  // Only proceed if we have enough filtered books for a meaningful consensus
  if (filteredBooks.length < 2) return null;
  
  // For player props, use consensus probability from filtered books only
  if (row.isPlayerProp || (row.mkt?.key && row.mkt.key.includes('player_'))) {
    const probs = filteredBooks.map(b => americanToProb(b.price ?? b.odds))
      .filter(p => typeof p === "number" && p > 0 && p < 1);
    const consensusProb = median(probs);
    const uniqCnt = new Set(filteredBooks.map(b => b.bookmaker?.key || b.book || '')).size;
    
    if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 2) { // Lower threshold for props with filtered books
      const fairDec = 1 / consensusProb;
      return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
    }
    return null;
  }
  
  // Use devig method if available
  const pDevig = devigMap.get(row.key);
  const pairCnt = devigPairCount(row);
  if (pDevig && pDevig > 0 && pDevig < 1 && pairCnt > 2) { // Lower threshold with filtered books
    const fairDec = 1 / pDevig;
    return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
  }
  
  // Fallback to consensus method for regular markets using filtered books
  const probs = filteredBooks.map(b => americanToProb(b.price ?? b.odds))
    .filter(p => typeof p === "number" && p > 0 && p < 1);
  const consensusProb = median(probs);
  const uniqCnt = new Set(filteredBooks.map(b => b.bookmaker?.key || b.book || '')).size;
  
  if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 3) { // Lower threshold with filtered books
    const fairDec = 1 / consensusProb;
    return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
  }
  return null;
};

// ============================================================
// REPLACEMENT FOR calculateSideEV FUNCTION (around line 848)
// ============================================================

const calculateSideEV = (books, isOver = true) => {
  if (!books || books.length === 0) return null;
  
  // FIXED: Filter books based on user selection
  const filteredBooks = bookFilter && bookFilter.length > 0 
    ? books.filter(book => {
        const key = (book?.bookmaker?.key || book?.book || '').toLowerCase();
        return bookFilter.includes(key);
      })
    : books;
  
  // Only proceed if we have enough filtered books
  if (filteredBooks.length < 2) return null;
  
  // Use filtered books for probability calculation
  const probs = filteredBooks.map(b => americanToProb(b.price ?? b.odds))
    .filter(p => typeof p === "number" && p > 0 && p < 1);
  const consensusProb = median(probs);
  
  if (consensusProb && consensusProb > 0 && consensusProb < 1 && filteredBooks.length >= 2) {
    const fairDec = 1 / consensusProb;
    const fairLine = decimalToAmerican(fairDec);
    
    // Find best line + odds combination
    const bestBook = filteredBooks.reduce((best, book) => {
      if (!best) return book;
      
      const bookLine = parseFloat(book.point || book.line || 0);
      const bestLine = parseFloat(best.point || best.line || 0);
      
      const bookDecimal = americanToDecimal(book.price ?? book.odds);
      const bestDecimal = americanToDecimal(best.price ?? best.odds);
      
      // For OVER: prefer lower lines (easier to hit)
      if (isOver) {
        if (bookLine < bestLine) return book;
        if (bookLine > bestLine) return best;
      } else {
        // For UNDER: prefer higher lines (easier to hit)
        if (bookLine > bestLine) return book;
        if (bookLine < bestLine) return best;
      }
      
      // Same line: prefer better odds
      return bookDecimal > bestDecimal ? book : best;
    });
    
    const bookmakerKey = bestBook.bookmaker?.key || bestBook.book?.toLowerCase();
    return calculateEV(bestBook.price, fairLine, bookmakerKey);
  }
  return null;
};

// ============================================================
// ADD THIS DEBUG LOGGING (after state declarations)
// ============================================================

// Add this after your state declarations in the OddsTable component
useEffect(() => {
  if (bookFilter && bookFilter.length > 0) {
    console.log('🎯 EV Filtering active - calculating EV using only these books:', bookFilter);
  } else {
    console.log('🎯 EV Filtering inactive - using all available books for EV calculation');
  }
}, [bookFilter]);

// ============================================================
// UPDATE THE EV COLUMN HEADER (around line 1490)
// ============================================================

// Replace the EV column header with this:
<th className="ev-col sort-th" onClick={()=>setSort(s=>({ key:'ev', dir:s.key==='ev'&&s.dir==='desc'?'asc':'desc' }))}>
  <span className="sort-label">
    EV % {bookFilter && bookFilter.length > 0 && <span className="filter-badge" title="EV calculated using only selected sportsbooks">📊</span>}
    <span className="sort-indicator">{sort.key==='ev'?(sort.dir==='desc'?'▼':'▲'):''}</span>
  </span>
</th>

// ============================================================
// ADD THIS CSS TO OddsTable.css
// ============================================================

/*
.filter-badge {
  font-size: 10px;
  margin-left: 4px;
  color: var(--accent-color);
  cursor: help;
}
*/
