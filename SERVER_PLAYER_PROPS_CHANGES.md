# Server-Side Player Props Changes

## Changes Made

1. **Added Fallback Mechanism for Player Props**

Added a fallback mechanism to fetch games specifically for player props when no games are found in the regular API call:

```javascript
// If no games were found in the regular API call, fetch games specifically for player props
if (allGames.length === 0) {
  console.log('🎯 No games found in regular API call, fetching games specifically for player props');
  
  try {
    // Fetch games for the requested sports
    for (const sport of sportsArray) {
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      const bookmakerList = allowedBookmakers.join(',');
      
      const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=us,us_dfs&markets=h2h&oddsFormat=${oddsFormat}&bookmakers=${bookmakerList}`;
      console.log(`🌐 Fetching games for player props: ${url.replace(API_KEY, 'API_KEY_HIDDEN')}`);
      
      try {
        const response = await axios.get(url);
        if (response.data && Array.isArray(response.data)) {
          console.log(`🎯 Found ${response.data.length} games for sport ${sport}`);
          allGames.push(...response.data);
        }
      } catch (sportError) {
        console.error(`🚫 Error fetching games for sport ${sport}:`, sportError.message);
      }
    }
    
    console.log(`🎯 Total games found for player props: ${allGames.length}`);
  } catch (error) {
    console.error('🚫 Error fetching games for player props:', error.message);
  }
}
```

2. **Increased Timeout for Player Props API Calls**

Updated the timeout for player props API calls to prevent timeouts:

```javascript
// Before
const PLAYER_PROPS_REQUEST_TIMEOUT = 12000;

// After
const PLAYER_PROPS_REQUEST_TIMEOUT = Number(process.env.PLAYER_PROPS_REQUEST_TIMEOUT || 15000); // 15 seconds
```

Also updated all player props API calls to use this timeout:

```javascript
// Before
propsResponse = await axios.get(propsUrl, { timeout: 7000 });

// After
propsResponse = await axios.get(propsUrl, { timeout: PLAYER_PROPS_REQUEST_TIMEOUT });
```

## How These Changes Work

1. **Fallback Mechanism**:
   - When player props are requested, the server first checks if there are any games available from the regular API call
   - If no games are found (`allGames.length === 0`), it makes a separate API call to fetch games specifically for player props
   - It uses the `h2h` market to get the basic game information, which is then used to fetch player props

2. **Increased Timeout**:
   - The timeout for player props API calls has been increased from 7 seconds to 15 seconds
   - This gives the API more time to respond, especially when fetching player props for multiple games
   - The timeout is now configurable via the `PLAYER_PROPS_REQUEST_TIMEOUT` environment variable

## Expected Results

With these changes, the server should now:

1. Successfully fetch games for player props even when no games are returned in the regular API call
2. Have enough time to complete the player props API calls without timing out
3. Return player props data to the client

## Testing

To test these changes:

1. Restart the server to apply the changes
2. Switch to player props mode in the client
3. Check the server logs to see if games are being fetched for player props
4. Verify that player props data is being displayed in the client
