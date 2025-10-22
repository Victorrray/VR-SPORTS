# Arbitrage System

## Overview
The arbitrage tool identifies betting opportunities where you can place bets on all possible outcomes of an event to guarantee a profit, regardless of the result.

## Key Features

- **Real-time Detection**: Scans for arbitrage opportunities across multiple sports and bookmakers
- **Multi-level Caching**: Optimizes performance and reduces API costs
- **Live Game Support**: Detects opportunities in both upcoming and in-progress games
- **Independent Operation**: Functions separately from the main sportsbook interface

## Data Flow

### 1. Frontend Component (ArbitrageDetector.js)
- Manages the user interface for displaying arbitrage opportunities
- Handles sport selection and user preferences
- Implements a 5-minute frontend cache to reduce API calls

### 2. API Endpoint (/api/odds)
- Processes arbitrage requests
- Implements backend caching layers
- Handles communication with The Odds API

### 3. Caching Layers
1. **Frontend Cache** (5 minutes)
   - Stores API responses in memory
   - Prevents duplicate requests

2. **Backend In-Memory Cache** (5 minutes)
   - Shared across all users
   - Reduces database queries

3. **Supabase Persistent Cache**
   - Long-term storage of odds data
   - Helps reduce API costs

## Supported Sports
- NFL
- NBA
- NHL
- MLB
- NCAAF
- NCAAB
- EPL
- And more

## How It Works

1. **Data Collection**
   - Fetches odds from multiple bookmakers
   - Handles different market types (h2h, spreads, totals)
   - Processes both pre-game and live odds

2. **Opportunity Detection**
   - Calculates implied probabilities
   - Identifies discrepancies between bookmakers
   - Filters out completed games

3. **User Interface**
   - Displays profitable opportunities
   - Shows potential returns and profit margins
   - Allows filtering by sport and bookmaker

## Performance Considerations

- **API Efficiency**: Uses batching and caching to minimize API calls
- **Real-time Updates**: Polls for updates every 2 minutes when auto-refresh is enabled
- **Error Handling**: Gracefully handles API timeouts and errors

## Cost Management

- **Caching**: Reduces the number of API calls
- **Selective Updates**: Only updates odds when necessary
- **Efficient Data Fetching**: Minimizes redundant data retrieval
