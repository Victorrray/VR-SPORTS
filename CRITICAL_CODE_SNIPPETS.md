# CRITICAL CODE SNIPPETS FOR REBUILD
## Copy-paste ready code for key functionality

---

## 🔧 BACKEND: Player Props Endpoint

```javascript
// server/index.js - Player Props with Dual API Fallback
app.get('/api/player-props', async (req, res) => {
  try {
    const { sport, markets } = req.query;
    const marketsList = markets ? markets.split(',') : ['player_pass_yds', 'player_rush_yds'];
    
    // Step 1: Get list of games
    const gamesResponse = await axios.get(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds`,
      {
        params: {
          apiKey: process.env.ODDS_API_KEY,
          regions: 'us,us_dfs',
          markets: 'h2h'
        }
      }
    );

    const games = gamesResponse.data.slice(0, parseInt(process.env.MAX_GAMES_FOR_PROPS) || 10);
    const playerPropsData = [];

    // Step 2: Fetch player props for each game individually
    for (const game of games) {
      try {
        const propsResponse = await axios.get(
          `https://api.the-odds-api.com/v4/sports/${sport}/events/${game.id}/odds`,
          {
            params: {
              apiKey: process.env.ODDS_API_KEY,
              regions: 'us,us_dfs',
              markets: marketsList.join(','),
              bookmakers: 'draftkings,fanduel,betmgm,caesars',
              oddsFormat: 'american'
            },
            timeout: 12000
          }
        );
        
        if (propsResponse.data) {
          playerPropsData.push(propsResponse.data);
        }
      } catch (error) {
        console.error(`Error fetching props for game ${game.id}:`, error.message);
      }
    }

    // If TheOddsAPI failed or returned no data, try SportsGameOdds fallback
    if (playerPropsData.length === 0 && process.env.SPORTSGAMEODDS_API_KEY) {
      console.log('Falling back to SportsGameOdds API...');
      
      try {
        const fallbackResponse = await axios.get(
          'https://api.sportsgameodds.com/v1/odds',
          {
            headers: {
              'x-api-key': process.env.SPORTSGAMEODDS_API_KEY
            },
            params: {
              sport: sport,
              market_type: 'player_props'
            }
          }
        );
        
        // Transform SportsGameOdds format to TheOddsAPI format
        const transformed = transformSportsGameOddsData(fallbackResponse.data);
        return res.json(transformed);
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError.message);
      }
    }

    res.json(playerPropsData);
  } catch (error) {
    console.error('Error fetching player props:', error);
    res.status(500).json({ error: 'Failed to fetch player props' });
  }
});

function transformSportsGameOddsData(sgoData) {
  // Transform SportsGameOdds format to match TheOddsAPI structure
  return sgoData.map(event => ({
    id: event.event_id,
    sport_key: event.sport,
    commence_time: event.start_time,
    home_team: event.home,
    away_team: event.away,
    bookmakers: event.odds.map(book => ({
      key: book.bookmaker,
      title: book.bookmaker_name,
      markets: book.markets.map(market => ({
        key: market.market_key,
        outcomes: market.outcomes
      }))
    }))
  }));
}
```

---

## 🎯 FRONTEND: EV Calculation with DFS Support

```javascript
// client/src/utils/oddsConverter.js
export function toDec(american) {
  if (american > 0) return (american / 100) + 1;
  return (100 / Math.abs(american)) + 1;
}

export function toProb(american) {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

export function fairOdds(prob) {
  if (prob >= 0.5) return -1 * (prob / (1 - prob)) * 100;
  return ((1 - prob) / prob) * 100;
}

// client/src/utils/calculations.js
import { toDec, toProb, fairOdds } from './oddsConverter';

export function calculateEV(userOdds, fairLine, bookmakerKey = '') {
  // DFS apps use pick'em model with ~+100 payouts
  const DFS_APPS = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'prophetx'];
  const isDFSApp = DFS_APPS.includes(bookmakerKey.toLowerCase());

  if (isDFSApp) {
    // DFS apps pay even money (+100) regardless of displayed odds
    const dfsPayoutOdds = +100;
    const dfsDec = toDec(dfsPayoutOdds);
    const fairDec = toDec(fairLine);
    return ((dfsDec / fairDec) - 1) * 100;
  }

  // Traditional sportsbook EV calculation
  const userDec = toDec(userOdds);
  const fairDec = toDec(fairLine);
  return ((userDec / fairDec) - 1) * 100;
}

export function calculateConsensus(outcomes) {
  // Calculate no-vig fair odds from all bookmaker odds
  const totalProb = outcomes.reduce((sum, o) => sum + toProb(o.price), 0);
  const fairProbs = outcomes.map(o => toProb(o.price) / totalProb);
  return fairProbs.map(p => fairOdds(p));
}

export function findBestLine(books, outcomeType) {
  // For player props: line value > odds value
  return books.reduce((best, book) => {
    const bookLine = parseFloat(book.point || book.line || 0);
    const bestLine = parseFloat(best.point || best.line || 0);
    const bookDecimal = toDec(book.price);
    const bestDecimal = toDec(best.price);

    if (outcomeType === 'Over') {
      // For OVER: prefer lower lines (easier to hit)
      if (bookLine < bestLine) return book;
      if (bookLine > bestLine) return best;
      // Same line: prefer better odds
      return bookDecimal > bestDecimal ? book : best;
    } else {
      // For UNDER: prefer higher lines (easier to hit)
      if (bookLine > bestLine) return book;
      if (bookLine < bestLine) return best;
      // Same line: prefer better odds
      return bookDecimal > bestDecimal ? book : best;
    }
  });
}

export function calculateArbitrage(odds1, odds2) {
  const prob1 = toProb(odds1);
  const prob2 = toProb(odds2);
  const totalProb = prob1 + prob2;
  
  if (totalProb < 1) {
    return {
      isArbitrage: true,
      profit: ((1 / totalProb) - 1) * 100,
      stake1: prob1 / totalProb,
      stake2: prob2 / totalProb
    };
  }
  
  return { isArbitrage: false };
}
```

---

## 🔐 SUPABASE: Database Setup

```sql
-- Run this in Supabase SQL Editor

-- Step 1: Extend auth.users table
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT NULL;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS trial_ends TIMESTAMPTZ;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS api_request_count INTEGER DEFAULT 0;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS api_cycle_start TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS grandfathered BOOLEAN DEFAULT FALSE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

-- Create index for plan queries
CREATE INDEX IF NOT EXISTS idx_users_plan ON auth.users(plan);

-- Step 2: Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Step 3: Create unified user creation trigger
CREATE OR REPLACE FUNCTION public.on_auth_user_created_unified()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_unified_trigger ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created_unified_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_auth_user_created_unified();

-- Step 4: Create API usage tracking function
CREATE OR REPLACE FUNCTION increment_usage(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET api_request_count = api_request_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎨 PURPLE THEME CSS

```css
/* client/src/index.css */
:root {
  /* Purple Brand Colors */
  --color-bg-primary: #0a0612;
  --color-bg-secondary: #0f0b1a;
  --color-bg-tertiary: #1a1025;
  
  --color-purple-primary: #8b5cf6;
  --color-purple-secondary: #7c3aed;
  --color-purple-light: #a78bfa;
  --color-purple-dark: #6d28d9;
  
  --color-text-primary: #ffffff;
  --color-text-secondary: #e5e7eb;
  --color-text-muted: #9ca3af;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Glass Morphism Effect */
.glass {
  background: rgba(139, 92, 246, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: var(--radius-lg);
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, var(--color-purple-primary), var(--color-purple-secondary));
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(139, 92, 246, 0.3);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: var(--color-purple-primary);
  background: rgba(139, 92, 246, 0.1);
}

/* Cards */
.card {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

/* EV Colors */
.positive-ev {
  color: var(--color-success);
  font-weight: 600;
}

.negative-ev {
  color: var(--color-error);
}

/* Loading Animation */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.loading-skeleton {
  background: linear-gradient(90deg, #1a1025 25%, #2a1f3f 50%, #1a1025 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
  
  .btn-primary, .btn-secondary {
    padding: 10px 20px;
    font-size: 14px;
  }
  
  .card {
    padding: var(--spacing-md);
  }
}
```

---

## 🔒 AUTH: Supabase Client Setup

```javascript
// client/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// client/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, signIn, signUp, signOut };
}
```

---

## 💳 STRIPE: Checkout Integration

```javascript
// server/index.js - Stripe endpoints
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/billing/create-checkout-session', async (req, res) => {
  try {
    const { supabaseUserId } = req.body;

    if (!supabaseUserId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_PLATINUM) {
      return res.status(500).json({ 
        error: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe is not configured on the server'
      });
    }

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      limit: 1,
      email: supabaseUserId
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        metadata: { supabase_user_id: supabaseUserId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: supabaseUserId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_PLATINUM,
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler
app.post('/api/billing/webhook', 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;
        
        // Update user to platinum plan in Supabase
        console.log(`User ${userId} upgraded to platinum`);
        // TODO: Implement Supabase update
        break;
        
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log(`Subscription cancelled for ${subscription.customer}`);
        // TODO: Implement plan downgrade
        break;
        
      case 'invoice.payment_failed':
        console.log('Payment failed');
        break;
    }

    res.json({ received: true });
  }
);
```

---

## 📊 PLAYER PROP MARKETS BY SPORT

```javascript
// client/src/constants/playerPropMarkets.js
export const PLAYER_PROP_MARKETS_BY_SPORT = {
  americanfootball_nfl: [
    { key: 'player_pass_yds', name: 'Passing Yards' },
    { key: 'player_pass_tds', name: 'Passing TDs' },
    { key: 'player_pass_completions', name: 'Pass Completions' },
    { key: 'player_pass_attempts', name: 'Pass Attempts' },
    { key: 'player_pass_interceptions', name: 'Interceptions' },
    { key: 'player_pass_longest_completion', name: 'Longest Completion' },
    { key: 'player_rush_yds', name: 'Rushing Yards' },
    { key: 'player_rush_attempts', name: 'Rush Attempts' },
    { key: 'player_rush_longest', name: 'Longest Rush' },
    { key: 'player_receptions', name: 'Receptions' },
    { key: 'player_reception_yds', name: 'Receiving Yards' },
    { key: 'player_reception_longest', name: 'Longest Reception' },
    { key: 'player_reception_tds', name: 'Receiving TDs' },
    { key: 'player_kicking_points', name: 'Kicking Points' }
  ],
  
  basketball_nba: [
    { key: 'player_points', name: 'Points' },
    { key: 'player_rebounds', name: 'Rebounds' },
    { key: 'player_assists', name: 'Assists' },
    { key: 'player_threes', name: '3-Pointers Made' },
    { key: 'player_blocks', name: 'Blocks' },
    { key: 'player_steals', name: 'Steals' },
    { key: 'player_turnovers', name: 'Turnovers' },
    { key: 'player_points_rebounds_assists', name: 'Pts + Rebs + Asts' }
  ],
  
  baseball_mlb: [
    { key: 'player_hits', name: 'Hits' },
    { key: 'player_total_bases', name: 'Total Bases' },
    { key: 'player_rbis', name: 'RBIs' },
    { key: 'player_runs_scored', name: 'Runs Scored' },
    { key: 'player_home_runs', name: 'Home Runs' },
    { key: 'player_stolen_bases', name: 'Stolen Bases' },
    { key: 'player_strikeouts', name: 'Pitcher Strikeouts' },
    { key: 'player_hits_allowed', name: 'Hits Allowed' },
    { key: 'player_walks', name: 'Walks' },
    { key: 'player_earned_runs', name: 'Earned Runs' }
  ],
  
  icehockey_nhl: [
    { key: 'player_points', name: 'Points' },
    { key: 'player_power_play_points', name: 'Power Play Points' },
    { key: 'player_assists', name: 'Assists' },
    { key: 'player_shots_on_goal', name: 'Shots on Goal' },
    { key: 'player_blocked_shots', name: 'Blocked Shots' },
    { key: 'player_goalie_saves', name: 'Goalie Saves' },
    { key: 'player_goalie_goals_against', name: 'Goals Against' }
  ]
};

export function getPlayerPropMarketsBySport(sportKey) {
  return PLAYER_PROP_MARKETS_BY_SPORT[sportKey] || [];
}
```

---

## 🎯 SPORTSBOOK DEFINITIONS

```javascript
// client/src/constants/sportsbooks.js
export const AVAILABLE_SPORTSBOOKS = [
  // Popular US Sportsbooks
  { key: 'draftkings', name: 'DraftKings', popular: true },
  { key: 'fanduel', name: 'FanDuel', popular: true },
  { key: 'betmgm', name: 'BetMGM', popular: true },
  { key: 'caesars', name: 'Caesars', popular: true },
  
  // DFS Apps
  { key: 'prizepicks', name: 'PrizePicks', isDFS: true, popular: true },
  { key: 'underdog', name: 'Underdog Fantasy', isDFS: true, popular: true },
  { key: 'draftkings_pick6', name: 'DraftKings Pick6', isDFS: true, popular: true },
  { key: 'prophetx', name: 'ProphetX', isDFS: true },
  
  // Other US Sportsbooks
  { key: 'pointsbet', name: 'PointsBet' },
  { key: 'betrivers', name: 'BetRivers' },
  { key: 'unibet', name: 'Unibet' },
  { key: 'wynnbet', name: 'WynnBet' },
  { key: 'superbook', name: 'SuperBook' },
  { key: 'betfred_us', name: 'Betfred' },
  { key: 'espnbet', name: 'ESPN BET' },
  { key: 'fanatics', name: 'Fanatics' },
  { key: 'hardrock', name: 'Hard Rock' },
  { key: 'fliff', name: 'Fliff' },
  { key: 'novig', name: 'NoVig' },
  { key: 'circasports', name: 'Circa Sports' },
  { key: 'lowvig', name: 'LowVig' },
  
  // Offshore/International
  { key: 'bovada', name: 'Bovada' },
  { key: 'mybookie', name: 'MyBookie' },
  { key: 'betonline', name: 'BetOnline' },
  { key: 'pinnacle', name: 'Pinnacle' }
];

export function getDFSApps() {
  return AVAILABLE_SPORTSBOOKS.filter(book => book.isDFS);
}

export function getTraditionalSportsbooks() {
  return AVAILABLE_SPORTSBOOKS.filter(book => !book.isDFS);
}

export function isDFSApp(bookKey) {
  const book = AVAILABLE_SPORTSBOOKS.find(b => b.key === bookKey);
  return book?.isDFS || false;
}

export function getPopularSportsbooks() {
  return AVAILABLE_SPORTSBOOKS.filter(book => book.popular);
}
```

---

## 🚀 DEPLOYMENT: render.yaml

```yaml
# render.yaml
services:
  # Backend API
  - type: web
    name: vr-odds-backend
    env: node
    region: oregon
    plan: starter
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: FRONTEND_URL
        value: https://odds-frontend-j2pn.onrender.com
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: ODDS_API_KEY
        sync: false
      - key: SPORTSGAMEODDS_API_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_PRICE_PLATINUM
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: ENABLE_PLAYER_PROPS_V2
        value: true
      - key: CACHE_DURATION_MS
        value: 300000
      - key: MAX_GAMES_FOR_PROPS
        value: 10

  # Frontend
  - type: web
    name: vr-odds-frontend
    env: static
    region: oregon
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
    pullRequestPreviewsEnabled: true
    envVars:
      - key: REACT_APP_SUPABASE_URL
        sync: false
      - key: REACT_APP_SUPABASE_ANON_KEY
        sync: false
      - key: REACT_APP_API_BASE_URL
        value: https://odds-backend-4e9q.onrender.com
```

---

**Save this file alongside REBUILD_ROADMAP.md for quick reference during rebuild!**
