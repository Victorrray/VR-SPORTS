# Figma Design.4 Integration Plan

## 📋 Overview

Design.4 is a complete redesign with:
- ✅ All UI components built (Header, Dashboard, OddsPage, etc.)
- ✅ Theme system (light/dark mode)
- ✅ Dropdown filters (Market Type, Sport, Bet Type, Date)
- ✅ Responsive design
- ⚠️ Mock data (needs real API integration)
- ⚠️ No auth integration (needs SimpleAuth hook)
- ⚠️ No real user data (needs context integration)

---

## 🎯 Integration Checklist

### Phase 1: Component Migration (Copy to Client)

- [ ] **Copy Core Components**
  ```bash
  # Copy main page components
  cp "Figma Design.4/src/components/Header.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/Dashboard.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/OddsPage.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/PicksPage.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/AccountPage.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/SettingsPage.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/LoginPage.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/SignUpPage.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/ForgotPasswordPage.tsx" client/src/components/landing/
  
  # Copy landing page components
  cp "Figma Design.4/src/components/Hero.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/Features.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/Pricing.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/HowItWorks.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/FAQ.tsx" client/src/components/landing/
  cp "Figma Design.4/src/components/Footer.tsx" client/src/components/landing/
  
  # Copy UI components (shadcn/ui)
  cp -r "Figma Design.4/src/components/ui" client/src/components/
  
  # Copy context
  cp "Figma Design.4/src/contexts/ThemeContext.tsx" client/src/contexts/
  ```

- [ ] **Copy Styles**
  ```bash
  cp "Figma Design.4/src/index.css" client/src/styles/design4.css
  cp -r "Figma Design.4/src/styles" client/src/styles/design4/
  ```

---

### Phase 2: Hook Integration

#### OddsPage.tsx Updates

**Current (Mock Data):**
```typescript
const topPicks = [
  { id: 1, ev: '+78.07%', sport: 'NBA', ... },
  { id: 2, ev: '+35.41%', sport: 'NBA', ... },
  // ... more mock data
];
```

**Needs to be:**
```typescript
import { useMarketsWithCache } from '../../hooks/useMarketsWithCache';
import { useMe } from '../../hooks/useMe';
import { useBetSlip } from '../../contexts/BetSlipContext';

export function OddsPage() {
  const { me } = useMe();
  const { games, loading, error, refresh } = useMarketsWithCache(
    ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl'],
    ['us'],
    ['h2h', 'spreads', 'totals']
  );
  const { addBet } = useBetSlip();
  
  // Transform games to topPicks format
  const topPicks = useMemo(() => {
    if (!games || games.length === 0) return [];
    // ... transform logic from Design.3 OddsPage
  }, [games]);
  
  // ... rest of component
}
```

**Tasks:**
- [ ] Add `useMarketsWithCache` hook
- [ ] Add `useMe` hook
- [ ] Add `useBetSlip` hook
- [ ] Transform mock data to real API data
- [ ] Add loading state
- [ ] Add error state with retry
- [ ] Wire up `addBet` to button clicks

#### Dashboard.tsx Updates

**Needs:**
```typescript
import { useAuth } from '../../hooks/SimpleAuth';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  
  // Use real user data instead of mock stats
  // Use real bets from context/API
  // Wire up sign out
}
```

**Tasks:**
- [ ] Add `useAuth` hook
- [ ] Replace mock stats with real user data
- [ ] Replace mock bets with real bets from context
- [ ] Wire up sign out functionality
- [ ] Add loading states

#### LoginPage.tsx & SignUpPage.tsx Updates

**Needs:**
```typescript
import { useAuth } from '../../hooks/SimpleAuth';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (email, password) => {
    try {
      const result = await signIn(email, password);
      if (!result.error) navigate('/dashboard');
    } catch (err) {
      // Show error
    }
  };
}
```

**Tasks:**
- [ ] Add `useAuth` hook
- [ ] Add `useNavigate` hook
- [ ] Wire up email/password login
- [ ] Wire up Google OAuth
- [ ] Wire up Apple OAuth
- [ ] Add error handling
- [ ] Add loading states
- [ ] Redirect on success

#### AccountPage.tsx Updates

**Needs:**
```typescript
import { useAuth } from '../../hooks/SimpleAuth';

export function AccountPage() {
  const { user, profile, setUsername } = useAuth();
  
  // Display real user data
  // Allow editing profile
  // Wire up save functionality
}
```

**Tasks:**
- [ ] Add `useAuth` hook
- [ ] Display real user email
- [ ] Display real user profile
- [ ] Wire up username update
- [ ] Wire up profile picture upload
- [ ] Add save functionality

---

### Phase 3: Routing Integration

**Update App.js:**

```typescript
// Import new Design.4 components
import { Header } from './components/landing/Header';
import { Dashboard } from './components/landing/Dashboard';
import { OddsPage } from './components/landing/OddsPage';
import { PicksPage } from './components/landing/PicksPage';
import { AccountPage } from './components/landing/AccountPage';
import { SettingsPage } from './components/landing/SettingsPage';
import { LoginPage } from './components/landing/LoginPage';
import { SignUpPage } from './components/landing/SignUpPage';
import { ForgotPasswordPage } from './components/landing/ForgotPasswordPage';

// Update routes
<Routes>
  <Route path="/" element={user ? <Dashboard /> : <Landing />} />
  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
  <Route path="/odds" element={<PrivateRoute><OddsPage /></PrivateRoute>} />
  <Route path="/picks" element={<PrivateRoute><PicksPage /></PrivateRoute>} />
  <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
  <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignUpPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  {/* ... rest of routes */}
</Routes>
```

**Tasks:**
- [ ] Update imports in App.js
- [ ] Update route definitions
- [ ] Test all navigation flows
- [ ] Verify PrivateRoute guards work
- [ ] Check redirect logic

---

### Phase 4: Context Integration

#### ThemeContext

**Design.4 has its own ThemeContext:**
```typescript
// Figma Design.4/src/contexts/ThemeContext.tsx
export const useTheme = () => { ... }
export const themeConfig = { ... }
```

**Options:**
1. **Use Design.4's ThemeContext** - Copy it to client
2. **Merge with existing context** - If client has theme system
3. **Create adapter** - Wrap both systems

**Recommendation:** Copy Design.4's ThemeContext as-is

**Tasks:**
- [ ] Copy ThemeContext to client/src/contexts/
- [ ] Add ThemeProvider to App.js
- [ ] Wrap app with theme provider
- [ ] Test theme switching

#### BetSlipContext

**Already exists in client:**
```typescript
// client/src/contexts/BetSlipContext.js
export const useBetSlip = () => { ... }
```

**Design.4 OddsPage needs to integrate:**
```typescript
const { addBet } = useBetSlip();

const handleAddBet = (pick) => {
  addBet({
    id: pick.id,
    matchup: pick.game,
    selection: pick.pick,
    market: 'MONEYLINE',
    americanOdds: parseInt(pick.bestOdds),
    bookmaker: pick.bestBook,
    sport: pick.sport,
    edge: parseFloat(pick.ev),
  });
};
```

**Tasks:**
- [ ] Import useBetSlip in OddsPage
- [ ] Wire up addBet to button clicks
- [ ] Test bet slip integration

---

### Phase 5: Styling & Tailwind

**Design.4 uses Tailwind CSS:**
- Check if client/src/index.css has Tailwind
- If not, add Tailwind configuration
- Import Design.4 styles

**Tasks:**
- [ ] Verify Tailwind is configured
- [ ] Import Design.4 CSS
- [ ] Test styling on all pages
- [ ] Fix any style conflicts

---

### Phase 6: Testing & Validation

#### Navigation Testing
- [ ] Landing page → Login → Dashboard flow
- [ ] Dashboard → Odds → Add Bet → BetSlip
- [ ] Dashboard → Picks page
- [ ] Dashboard → Account page
- [ ] Dashboard → Settings page
- [ ] Sign out → Landing page

#### Data Flow Testing
- [ ] OddsPage loads real odds data
- [ ] OddsPage filters by sport
- [ ] OddsPage filters by market type
- [ ] OddsPage filters by date
- [ ] Add bet adds to BetSlip
- [ ] Dashboard shows real user stats
- [ ] Account page shows real user data

#### Mobile Testing
- [ ] Header responsive on mobile
- [ ] Dashboard sidebar collapses
- [ ] OddsPage table responsive
- [ ] All buttons clickable on mobile
- [ ] Forms work on mobile

#### Error Handling
- [ ] Login with wrong credentials shows error
- [ ] API errors show retry button
- [ ] Network errors handled gracefully
- [ ] 404 pages redirect properly

---

## 📊 Integration Status Tracker

| Component | Status | Notes |
|-----------|--------|-------|
| Header | 🟡 READY | Needs navigation wiring |
| Dashboard | 🟡 READY | Needs real data integration |
| OddsPage | 🟡 READY | Needs API integration |
| PicksPage | 🟡 READY | Needs real picks data |
| AccountPage | 🟡 READY | Needs user data integration |
| SettingsPage | 🟡 READY | Needs settings API |
| LoginPage | 🟡 READY | Needs auth integration |
| SignUpPage | 🟡 READY | Needs auth integration |
| ForgotPasswordPage | 🟡 READY | Needs password reset API |
| Hero | ✅ READY | Landing page component |
| Features | ✅ READY | Landing page component |
| Pricing | ✅ READY | Landing page component |
| HowItWorks | ✅ READY | Landing page component |
| FAQ | ✅ READY | Landing page component |
| Footer | ✅ READY | Landing page component |
| UI Components | ✅ READY | shadcn/ui library |
| ThemeContext | 🟡 READY | Needs to be copied |

---

## 🚀 Implementation Order

1. **Week 1: Core Setup**
   - Copy all components
   - Set up ThemeContext
   - Update App.js routing
   - Test basic navigation

2. **Week 2: Auth Integration**
   - Integrate LoginPage with SimpleAuth
   - Integrate SignUpPage with SimpleAuth
   - Test login/signup flow
   - Test OAuth flows

3. **Week 3: Data Integration**
   - Integrate OddsPage with useMarketsWithCache
   - Integrate Dashboard with real user data
   - Integrate AccountPage with user profile
   - Test all data flows

4. **Week 4: Polish & Testing**
   - Mobile testing
   - Error handling
   - Performance optimization
   - Final QA

---

## 📝 Notes

- Design.4 uses mock data - all needs to be replaced with real API calls
- Design.4 has its own ThemeContext - decide whether to use or merge
- Design.4 includes 30+ UI components from shadcn/ui - may need to install dependencies
- Design.4 has responsive design - test on all screen sizes
- Design.4 has dropdown filters - ensure they work with real data

---

## 🔗 Related Files

- Current OddsPage: `/client/src/components/landing/OddsPage.tsx`
- Current Dashboard: `/client/src/pages/Dashboard.js`
- Current App.js: `/client/src/App.js`
- Design.4 folder: `/Figma Design.4/src/components/`
- Site Flowchart: `/SITE_FLOWCHART.md`

