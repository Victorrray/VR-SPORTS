# VR-ODDS COMPLETE REBUILD ROADMAP
## Version 1.21.5 - Last Commit: d2d7b36
## Estimated Time: 3-4 months full-time

---

## 📦 TECH STACK

### Frontend
- React 19.1.0 + react-router-dom 7.6.2
- Supabase 2.39.0 (auth)
- Axios 1.10.0 (HTTP)
- Lucide-react 0.515.0 (icons)
- CSS3 with custom properties

### Backend
- Express 5.1.0 + Node.js
- node-cache 5.1.2 (caching)
- Stripe 18.5.0 (payments)
- helmet + cors (security)

### Database
- Supabase (PostgreSQL)
- Row Level Security (RLS)

### External APIs
- TheOddsAPI (primary odds)
- SportsGameOdds API (fallback)
- Stripe API (payments)

---

## 🏗 PROJECT STRUCTURE

```
vr-odds/
├── client/src/
│   ├── components/
│   │   ├── auth/          # Login, signup
│   │   ├── betting/       # OddsTable, ArbitrageDetector, MiddlesDetector
│   │   ├── billing/       # Stripe integration
│   │   ├── common/        # Reusable UI
│   │   ├── layout/        # Navbar, footer
│   │   └── modals/        # Popups
│   ├── hooks/
│   │   ├── useAuth.js     # Authentication
│   │   ├── useMarkets.js  # Odds data
│   │   └── usePlan.js     # Subscription
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── SportsbookMarkets.js
│   │   └── Scores.js
│   └── utils/
│       ├── calculations.js    # EV, arbitrage
│       └── oddsConverter.js   # Odds formats
│
└── server/
    ├── index.js           # Main server (107KB)
    └── config/
```

---

## 📅 REBUILD TIMELINE

### PHASE 1: FOUNDATION (Week 1-2)

**Day 1-2: Setup**
```bash
# Initialize projects
npx create-react-app client
mkdir server && cd server && npm init -y

# Install dependencies
cd client && npm install @supabase/supabase-js axios lucide-react react-router-dom
cd ../server && npm install express cors dotenv helmet node-cache stripe axios
```

**Day 3-4: Database**
```sql
-- Extend auth.users table
ALTER TABLE auth.users ADD COLUMN plan TEXT DEFAULT NULL;
ALTER TABLE auth.users ADD COLUMN api_request_count INTEGER DEFAULT 0;
ALTER TABLE auth.users ADD COLUMN grandfathered BOOLEAN DEFAULT FALSE;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

**Day 5-7: Basic Backend**
```javascript
// server/index.js
const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 300 });

app.use(cors({ origin: ['http://localhost:3001'], credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3000, () => console.log('Server running'));
```

**Day 8-10: Frontend Foundation**
```javascript
// client/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// client/src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Setup routing
```

### PHASE 2: CORE FEATURES (Week 3-6)

**Week 3: Authentication**
- Login/signup with Supabase
- Protected routes
- Session management

**Week 4: Odds Display**
```javascript
// Backend: Fetch from TheOddsAPI
app.get('/api/odds', async (req, res) => {
  const { sport, markets } = req.query;
  const response = await axios.get(
    `https://api.the-odds-api.com/v4/sports/${sport}/odds`,
    { params: { apiKey: ODDS_API_KEY, markets } }
  );
  res.json(response.data);
});

// Frontend: Display in table
<OddsTable games={games} />
```

**Week 5: Player Props**
```javascript
// CRITICAL: Individual event calls required!
app.get('/api/player-props', async (req, res) => {
  const games = await getGamesList(sport);
  const props = [];
  
  for (const game of games.slice(0, 10)) {
    const response = await axios.get(
      `https://api.the-odds-api.com/v4/sports/${sport}/events/${game.id}/odds`,
      { params: { markets: 'player_pass_yds,player_rush_yds' } }
    );
    props.push(response.data);
  }
  
  res.json(props);
});
```

**Week 6: EV Calculations**
```javascript
// utils/oddsConverter.js
export function toDec(american) {
  return american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
}

export function toProb(american) {
  return american > 0 ? 100 / (american + 100) : Math.abs(american) / (Math.abs(american) + 100);
}

// utils/calculations.js
export function calculateEV(userOdds, fairLine, bookmakerKey) {
  // DFS apps (PrizePicks, Underdog) use +100 payouts
  const DFS_APPS = ['prizepicks', 'underdog', 'pick6'];
  
  if (DFS_APPS.includes(bookmakerKey)) {
    const dfsDec = toDec(100); // Even money
    const fairDec = toDec(fairLine);
    return ((dfsDec / fairDec) - 1) * 100;
  }
  
  // Traditional sportsbooks
  const userDec = toDec(userOdds);
  const fairDec = toDec(fairLine);
  return ((userDec / fairDec) - 1) * 100;
}
```

### PHASE 3: ADVANCED FEATURES (Week 7-10)

**Week 7: Arbitrage Detection**
```javascript
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

**Week 8: Middle Detection**
- Find gaps between Over/Under lines
- Calculate middle probability
- Display opportunities

**Week 9: Dashboard**
- Personalized high EV bets
- User stats (win rate, ROI)
- Sportsbook preferences

**Week 10: Stripe Integration**
```javascript
// Backend
app.post('/api/billing/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRICE_PLATINUM, quantity: 1 }],
    success_url: `${FRONTEND_URL}/billing/success`,
    cancel_url: `${FRONTEND_URL}/billing/cancel`
  });
  res.json({ url: session.url });
});

// Webhook handler
app.post('/api/billing/webhook', async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  if (event.type === 'checkout.session.completed') {
    // Update user to platinum
  }
  res.json({ received: true });
});
```

### PHASE 4: POLISH & DEPLOY (Week 11-12)

**Week 11: UI/UX**
```css
/* Purple theme */
:root {
  --color-bg-primary: #0a0612;
  --color-purple-primary: #8b5cf6;
  --color-purple-secondary: #7c3aed;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-purple-primary), var(--color-purple-secondary));
}

.positive-ev { color: #10b981; }
.negative-ev { color: #ef4444; }
```

**Week 12: Deployment**
```yaml
# render.yaml
services:
  - type: web
    name: vr-odds-backend
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    
  - type: web
    name: vr-odds-frontend
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
```

---

## 🔑 CRITICAL BUSINESS LOGIC

### 1. DFS vs Traditional EV
```javascript
// DFS apps pay +100 regardless of displayed odds
if (isDFSApp) {
  return ((toDec(100) / toDec(fairLine)) - 1) * 100;
}
```

### 2. Line Shopping for Player Props
```javascript
// For OVER: prefer LOWER lines (easier to hit)
// For UNDER: prefer HIGHER lines (easier to hit)
if (outcomeType === 'Over') {
  return bookLine < bestLine ? book : best;
}
```

### 3. Player Props API Architecture
```javascript
// ❌ WRONG - Bulk endpoint
GET /sports/nfl/odds?markets=player_pass_yds

// ✅ CORRECT - Individual events
GET /sports/nfl/events/{eventId}/odds?markets=player_pass_yds
```

### 4. Market Name Migration
```javascript
const MIGRATION = {
  'player_receiving_yds': 'player_reception_yds',
  'player_receiving_tds': 'player_reception_tds',
  'player_2_plus_tds': null // Removed
};
```

### 5. Cost Optimization
```javascript
const CACHE_DURATION_MS = 300000; // 5 minutes
const MAX_GAMES_FOR_PROPS = 10;
const FOCUSED_BOOKMAKERS = ['draftkings', 'fanduel', 'betmgm', 'caesars'];
```

### 6. Date Filtering
```javascript
if (selectedDate === 'Live Games') {
  // Only started games
  filtered = games.filter(g => new Date(g.commence_time) <= new Date());
} else {
  // Only upcoming games
  filtered = games.filter(g => new Date(g.commence_time) > new Date());
}
```

---

## 🔐 ENVIRONMENT VARIABLES

### Server (.env)
```env
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
ODDS_API_KEY=xxx
SPORTSGAMEODDS_API_KEY=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PRICE_PLATINUM=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
ENABLE_PLAYER_PROPS_V2=true
CACHE_DURATION_MS=300000
MAX_GAMES_FOR_PROPS=10
```

### Client (.env)
```env
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxx
REACT_APP_API_BASE_URL=https://odds-backend-4e9q.onrender.com
```

---

## 🚀 DEPLOYMENT CHECKLIST

1. **Supabase Setup**
   - Create project
   - Run database migrations
   - Configure auth redirect URLs
   - Setup email templates

2. **API Keys**
   - TheOddsAPI account + key
   - SportsGameOdds account + key
   - Stripe account + keys + webhook

3. **Render Deployment**
   - Connect GitHub repo
   - Create backend web service
   - Create frontend static site
   - Add all environment variables
   - Deploy both services

4. **Post-Deployment**
   - Test authentication flow
   - Verify odds data loading
   - Test player props
   - Test Stripe checkout
   - Configure custom domain (optional)

---

## 📝 KEY FILES TO RECREATE

### Priority 1 (Critical)
1. `server/index.js` - Main backend logic
2. `client/src/pages/SportsbookMarkets.js` - Main odds page
3. `client/src/components/betting/OddsTable.js` - Odds display
4. `client/src/utils/calculations.js` - EV/arbitrage logic
5. `client/src/hooks/useMarkets.js` - Data fetching

### Priority 2 (Important)
6. `client/src/pages/Dashboard.js` - User dashboard
7. `client/src/components/betting/ArbitrageDetector.js`
8. `client/src/components/betting/MiddlesDetector.js`
9. `client/src/lib/supabase.js` - Auth client
10. `client/src/index.css` - Purple theme

### Priority 3 (Nice to Have)
11. Mobile responsive CSS
12. Loading states
13. Error boundaries
14. Service worker

---

## 🐛 KNOWN ISSUES & SOLUTIONS

### Issue: Player Props Not Loading
**Solution:** Use individual event API calls, not bulk endpoint

### Issue: DFS Apps Showing Wrong EV
**Solution:** Use +100 payout for DFS EV calculation

### Issue: "Today" Filter Shows Live Games
**Solution:** Filter by `commence_time > now()` for upcoming only

### Issue: Pagination Resets on Filter
**Solution:** Only reset page on `games`, `mode`, `pageSize` changes

### Issue: CORS Errors in Production
**Solution:** Add `x-user-id` to `allowedHeaders` in CORS config

### Issue: Service Worker 404
**Solution:** Move `sw.js` from `src/` to `public/` directory

---

## 📊 CURRENT FEATURE LIST (50+)

- ✅ Multi-sport odds display (NFL, NBA, MLB, NHL, etc.)
- ✅ Player props with dual API fallback
- ✅ EV calculations (DFS-aware)
- ✅ Line shopping optimization
- ✅ Arbitrage detection
- ✅ Middle detection
- ✅ Live scores
- ✅ Date filtering
- ✅ Sportsbook filtering
- ✅ Market filtering
- ✅ Personalized dashboard
- ✅ Stripe subscription system
- ✅ User authentication (Supabase)
- ✅ Mobile responsive design
- ✅ Purple brand theme
- ✅ API caching (5min)
- ✅ Cost optimization
- ✅ DFS apps support (PrizePicks, Underdog, Pick6)
- ✅ Traditional sportsbooks (30+)
- ✅ Pagination
- ✅ Search functionality
- ✅ Real-time odds updates

---

## 🎯 SUCCESS METRICS

**You'll know you're on track when:**
- Week 2: Can fetch and display odds
- Week 4: Player props working
- Week 6: EV calculations accurate
- Week 8: Arbitrage/middles detecting
- Week 10: Stripe payments working
- Week 12: Deployed and accessible

**Final validation:**
- User can sign up and log in
- Odds display for multiple sports
- Player props load correctly
- EV calculations match current platform
- Can upgrade to Platinum via Stripe
- Mobile responsive
- Production deployed

---

## 📞 SUPPORT RESOURCES

- **TheOddsAPI Docs:** https://the-odds-api.com/liveapi/guides/v4/
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **React Router:** https://reactrouter.com
- **Express.js:** https://expressjs.com

---

**Last Updated:** October 1, 2025  
**Current Version:** 1.21.5  
**Last Commit:** d2d7b36 "last chance"  
**Production URLs:**
- Frontend: https://odds-frontend-j2pn.onrender.com
- Backend: https://odds-backend-4e9q.onrender.com
