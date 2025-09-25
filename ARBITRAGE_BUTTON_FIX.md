# Arbitrage Button Fix

## Problem Fixed

We've fixed an issue where the arbitrage button wasn't working correctly on the first click. When users clicked the arbitrage button, it would send them to the dashboard on the first click, but would work correctly on subsequent clicks.

## Root Cause

The issue was caused by a race condition in the state management of the SportsbookMarkets component. When the arbitrage button was clicked:

1. The state was updated (`setShowArbitrage(true)`)
2. But the component didn't fully re-render with the new state before any navigation happened
3. This caused the first click to appear to do nothing or redirect to the dashboard

## Changes Made

### 1. Enhanced Click Handlers for All Mode Buttons

We updated all mode buttons (Game Odds, Player Props, Arbitrage, Middles) with improved click handlers that:

- Prevent default event behavior
- Update all mode states at once to avoid race conditions
- Force a re-render by updating the table nonce
- Update the URL with a mode parameter for persistence
- Use history.replaceState to avoid breaking browser history

### 2. Added URL Parameter Support

We added URL parameter support to maintain the selected mode across page refreshes:

```javascript
// Update URL with mode parameter
const searchParams = new URLSearchParams(location.search);
searchParams.set('mode', 'arbitrage'); // or 'props', 'middles', or delete for game odds
window.history.replaceState(
  null, 
  '', 
  `${location.pathname}?${searchParams.toString()}`
);
```

### 3. Added Mode Initialization from URL

We added an initialization effect that checks for a mode parameter in the URL and sets the appropriate mode:

```javascript
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
```

## Benefits

1. **Reliable Mode Switching**: All mode buttons now work correctly on the first click
2. **Persistent Mode Selection**: The selected mode is preserved in the URL, so it persists across page refreshes
3. **Improved User Experience**: Users can bookmark specific modes or share URLs that open directly to a specific mode
4. **Consistent Behavior**: All mode buttons now use the same pattern for consistency

## Technical Details

- The `tableNonce` state is used to force a re-render when the mode changes
- URL parameters are used to persist the selected mode
- The initialization effect runs when the URL parameters change
- Event handlers prevent default behavior to avoid any navigation issues
