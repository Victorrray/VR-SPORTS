// ARBITRAGE_BUTTON_FIX.js
// Fix for the arbitrage button not working correctly on first click

// The issue is that when the arbitrage button is clicked, it sets the state but doesn't
// ensure the component fully re-renders with the new state before any navigation happens.
// This causes the first click to appear to do nothing (or redirect to dashboard), while
// the second click works correctly.

// Here's the current implementation in SportsbookMarkets.js:
/*
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('🔍 Arbitrage button clicked - setting arbitrage mode');
  setShowPlayerProps(false);
  setShowArbitrage(true);
  setShowMiddles(false);
  setNavigationExpanded(false);
}}
*/

// SOLUTION:
// We need to modify the click handler to ensure the state is properly updated and
// the component re-renders before any navigation occurs. We'll also add a URL parameter
// to ensure the mode persists across page refreshes.

// Replace the onClick handler with this improved version:
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('🔍 Arbitrage button clicked - setting arbitrage mode');
  
  // Update all mode states at once to avoid race conditions
  setShowPlayerProps(false);
  setShowArbitrage(true);
  setShowMiddles(false);
  setNavigationExpanded(false);
  
  // Force a re-render by updating the table nonce
  setTableNonce(prev => prev + 1);
  
  // Update URL with mode parameter (optional, for persistence)
  const searchParams = new URLSearchParams(location.search);
  searchParams.set('mode', 'arbitrage');
  
  // Use replace state to avoid breaking browser history
  window.history.replaceState(
    null, 
    '', 
    `${location.pathname}?${searchParams.toString()}`
  );
}}

// Additionally, add an initialization effect to handle URL parameters:
// Add this useEffect near the other initialization effects:

useEffect(() => {
  // Check for mode parameter in URL
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode');
  
  if (mode === 'arbitrage') {
    console.log('🔍 Initializing arbitrage mode from URL parameter');
    setShowPlayerProps(false);
    setShowArbitrage(true);
    setShowMiddles(false);
  } else if (mode === 'props') {
    console.log('🎯 Initializing player props mode from URL parameter');
    setShowPlayerProps(true);
    setShowArbitrage(false);
    setShowMiddles(false);
  } else if (mode === 'middles') {
    console.log('🎪 Initializing middles mode from URL parameter');
    setShowPlayerProps(false);
    setShowArbitrage(false);
    setShowMiddles(true);
  }
}, [location.search]); // Only run when URL parameters change
