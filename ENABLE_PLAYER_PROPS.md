# How to Enable Player Props

## Issue Identified

The player props feature is currently disabled on the server side. This is why you're seeing the following log messages:

```
🚫 Player props requested but ENABLE_PLAYER_PROPS_V2 is not enabled
🔍 Final response - returning 0 games total
```

## Solution

To enable player props, you need to set the `ENABLE_PLAYER_PROPS_V2` environment variable to `true` in your server's environment.

### Steps to Enable Player Props:

1. Open your server's `.env` file:
   ```
   /Users/victorray/Desktop/vr-odds/server/.env
   ```

2. Add or update the following line:
   ```
   ENABLE_PLAYER_PROPS_V2=true
   ```

3. Save the file and restart your server.

## Additional Environment Variables for Player Props

For optimal player props performance, you may also want to configure these additional environment variables:

```
# Player Props Cache TTL (default: 30000 ms = 30 seconds)
PLAYER_PROPS_CACHE_TTL_MS=30000

# Maximum number of retry attempts for player props API calls (default: 2)
PLAYER_PROPS_RETRY_ATTEMPTS=2

# Maximum number of markets per player props request (default: 15)
PLAYER_PROPS_MAX_MARKETS=15

# Maximum number of bookmakers per player props request (default: 15)
PLAYER_PROPS_MAX_BOOKS=15

# Timeout for player props API requests (default: 12000 ms = 12 seconds)
PLAYER_PROPS_REQUEST_TIMEOUT=12000
```

## Verification

After enabling player props and restarting your server, you should see the following log messages:

```
[player-props] flag: true default_state: ...
🎯 Fetching player props for markets: [...]
🎯 Processing X games for player props
```

And you should start seeing player props data in your application.
