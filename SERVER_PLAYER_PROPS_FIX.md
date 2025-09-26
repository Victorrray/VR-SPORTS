# Server-Side Player Props Fix

## Issue Identified

The server is correctly configured with `ENABLE_PLAYER_PROPS_V2=true`, but it's still not returning any games for player props. The logs show:

```
🎯 Processing 0 games for player props
🎯 Total games available for props: 0
```

This indicates that the server is not finding any games to process for player props.

## Required Server-Side Changes

To fix this issue, you need to make the following changes to the server code:

1. **Add a Fallback for Empty Games List**

In `/server/index.js`, locate the player props processing section (around line 2040) and modify it to fetch games specifically for player props if the regular games list is empty:

```javascript
// Step 2: Fetch player props if requested and enabled
console.log(`🔍 Player props check: playerPropMarkets.length=${playerPropMarkets.length}, ENABLE_PLAYER_PROPS_V2=${ENABLE_PLAYER_PROPS_V2}`);

if (playerPropMarkets.length > 0 && ENABLE_PLAYER_PROPS_V2) {
  console.log('🎯 Fetching player props for markets:', playerPropMarkets);
  
  // If no games were found in the regular API call, fetch games specifically for player props
  if (allGames.length === 0) {
    console.log('🎯 No games found in regular API call, fetching games specifically for player props');
    
    try {
      // Fetch games for the requested sports
      for (const sport of sportsArray) {
        const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=us,us_dfs&markets=h2h&oddsFormat=${oddsFormat}`;
        console.log(`🌐 Fetching games for player props: ${url.replace(API_KEY, 'API_KEY_HIDDEN')}`);
        
        const response = await axios.get(url);
        if (response.data && Array.isArray(response.data)) {
          console.log(`🎯 Found ${response.data.length} games for sport ${sport}`);
          allGames.push(...response.data);
        }
      }
      
      console.log(`🎯 Total games found for player props: ${allGames.length}`);
    } catch (error) {
      console.error('🚫 Error fetching games for player props:', error.message);
    }
  }
  
  console.log(`🎯 Processing ${Math.min(allGames.length, 10)} games for player props`);
  console.log(`🎯 Total games available for props: ${allGames.length}`);
  
  // Continue with the existing player props processing...
}
```

2. **Increase Timeouts and Limits**

Also update these constants at the top of the file:

```javascript
const PLAYER_PROPS_MAX_MARKETS_PER_REQUEST = Number(process.env.PLAYER_PROPS_MAX_MARKETS || 15);
const PLAYER_PROPS_REQUEST_TIMEOUT = Number(process.env.PLAYER_PROPS_REQUEST_TIMEOUT || 12000); // 12 seconds
```

## How to Apply These Changes

Since we can't directly edit the server code through this interface, you'll need to:

1. SSH into your server or access it through your deployment platform
2. Edit the `/server/index.js` file to add the fallback for empty games list
3. Update the timeout and limits constants
4. Restart your server

## Expected Result

After making these changes, the server should:

1. First try to use the games from the regular API call
2. If no games are found, fetch games specifically for player props
3. Process those games for player props with the requested markets
4. Return the player props data to the client

This should resolve the issue of no games being returned for player props.
