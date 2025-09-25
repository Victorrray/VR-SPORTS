// FLIFF_ODDS_DEBUG.js
// Add this code to OddsTable.js to debug Fliff's odds distribution

// Add this useEffect to the OddsTable component to analyze Fliff's odds distribution
useEffect(() => {
  // Only run this analysis if we have Fliff bets
  const fliffRows = allRows.filter(row => 
    (row?.out?.bookmaker?.key === 'fliff' || row?.out?.book?.toLowerCase() === 'fliff')
  );
  
  if (fliffRows.length > 0) {
    console.log(`🔍 Analyzing ${fliffRows.length} Fliff bets`);
    
    // Collect all odds values
    const oddsValues = fliffRows.map(row => Number(row?.out?.price ?? row?.out?.odds ?? 0));
    
    // Count occurrences of each odds value
    const oddsCounts = {};
    oddsValues.forEach(odds => {
      if (!oddsCounts[odds]) {
        oddsCounts[odds] = 0;
      }
      oddsCounts[odds]++;
    });
    
    // Sort by frequency
    const sortedOdds = Object.entries(oddsCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([odds, count]) => ({ odds: Number(odds), count, percentage: (count / fliffRows.length * 100).toFixed(1) + '%' }));
    
    console.log('🔍 Fliff odds distribution:', sortedOdds);
    
    // Check if most odds are around -115
    const around115 = oddsValues.filter(odds => odds >= -120 && odds <= -110).length;
    const percentAround115 = (around115 / fliffRows.length * 100).toFixed(1);
    
    console.log(`🔍 Odds around -115 (between -120 and -110): ${around115} bets (${percentAround115}%)`);
    
    // Compare with other books
    const otherBooks = allRows.filter(row => 
      row?.out?.bookmaker?.key !== 'fliff' && row?.out?.book?.toLowerCase() !== 'fliff'
    );
    
    if (otherBooks.length > 0) {
      const otherOddsValues = otherBooks.map(row => Number(row?.out?.price ?? row?.out?.odds ?? 0));
      const otherAround115 = otherOddsValues.filter(odds => odds >= -120 && odds <= -110).length;
      const otherPercentAround115 = (otherAround115 / otherBooks.length * 100).toFixed(1);
      
      console.log(`🔍 Other books odds around -115: ${otherAround115} bets (${otherPercentAround115}%)`);
    }
  }
}, [allRows]);

// Instructions:
// 1. Add this useEffect to the OddsTable component
// 2. Open the browser console (F12)
// 3. Look for the logs that analyze Fliff's odds distribution
// 4. This will help determine if Fliff actually does use predominantly -115 odds
