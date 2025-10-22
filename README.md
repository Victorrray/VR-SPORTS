# VR-Odds Platform

A comprehensive sports betting odds comparison and analysis platform.

## Features

- Real-time sports odds from multiple bookmakers
- Player props with advanced filtering
- DFS integration (DraftKings Pick6, PrizePicks, Underdog)
- Advanced analytics and EV calculations
- Responsive design for desktop and mobile

## Sports Coverage

- **NFL**: Full coverage with all teams and markets
- **NBA**: Comprehensive odds and player props
- **MLB**: Extensive game and player markets
- **NHL**: Complete hockey coverage
- **NCAAF/NCAAB**: College sports with deep market data
- **Soccer**: Major leagues including EPL, LaLiga, and more

## Sports-Specific Game Limits for Player Props

### 🎯 Why Limits Are Needed

Player props require **individual API calls per game**. Without limits:
- **MLB:** 50+ games × 15 seconds = 12+ minutes (timeout!)
- **NBA:** 30+ games × 15 seconds = 7+ minutes (timeout!)
- **Cost:** 100 games × $0.001 = $0.10 per request

With Supabase caching, we can be smart about limits.

### 📊 Current Sport Limits

| Sport | Game Limit | Reason | Typical Games |
|-------|-----------|--------|---------------|
| **NFL** | 100 | Small season (17 games), can handle all | 10-16 |
| **NCAAF** | 50 | Many games, but manageable | 30-50 |
| **NCAAB** | 50 | Many games, but manageable | 50-100 |
| **MLB** | 30 | 162-game season, too many to fetch all | 50-80 |
| **NBA** | 30 | 82-game season, too many to fetch all | 20-40 |
| **NHL** | 30 | 82-game season, too many to fetch all | 20-40 |
| **Soccer (EPL)** | 20 | Multiple games per day | 10-20 |
| **Default** | 40 | Safe default for other sports | Varies |

### ⏱️ Timeout Protection

- **Per-Game Timeout:** 15 seconds per game
- **Total Request Timeout:** 2 minutes (120 seconds) total
- Returns partial results if timeout reached

### 🔄 How Caching Helps

- **First Request (Cache Miss):** Fetches and caches data (slower)
- **Subsequent Requests (Cache Hit):** Returns cached data (instant)
- **Cache Duration:** 5 minutes

## 📈 Performance by Sport

| Sport | First Request | Cached Request | Games Shown | Players Shown |
|-------|---------------|----------------|-------------|---------------|
| NFL | 15-25 min | 2-3 sec | ALL (10-16) | 500-800 |
| NCAAF | 12-15 min | 2-3 sec | 50 | 1000-1500 |
| MLB | 7-8 min | 2-3 sec | 30 | 600-900 |
| NBA | 7-8 min | 2-3 sec | 30 | 600-900 |
| NHL | 7-8 min | 2-3 sec | 30 | 600-900 |

## 💰 Cost Analysis

### MLB Example (30 games)
- **Without Caching:** ~$90/month
- **With Caching (5-min TTL):** ~$259/month
- **Optimized Caching:** ~$50/month

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start development server: `npm run dev`

## Environment Variables

Required environment variables:
- `ENABLE_PLAYER_PROPS_V2=true`
- `ODDS_API_KEY`
- `SPORTSGAMEODDS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`

## Deployment

Deploy using Render or your preferred platform. Ensure all environment variables are set in production.
