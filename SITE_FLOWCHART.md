# OddSightSeer Site Flowchart & Navigation Map

## 🌐 Site Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         OddSightSeer                             │
│                    (React Router App)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼──────┐          ┌────────▼────────┐
         │  NOT LOGGED │          │   LOGGED IN     │
         │     IN      │          │                 │
         └──────┬──────┘          └────────┬────────┘
                │                          │
         ┌──────▼──────┐          ┌────────▼────────┐
         │   Landing   │          │   Dashboard     │
         │  Page (/)   │          │   Page (/)      │
         └──────┬──────┘          └────────┬────────┘
                │                          │
         ┌──────▼──────────────────────────▼──────┐
         │         Header Component               │
         │  (Navigation + CTA Buttons)            │
         └──────┬──────────────────────────┬──────┘
                │                          │
         ┌──────▼──────┐          ┌────────▼────────┐
         │   Sign In   │          │   Dashboard     │
         │  (/login)   │          │   Navigation    │
         └─────────────┘          └────────┬────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
            ┌───────▼────────┐    ┌────────▼────────┐    ┌───────▼────────┐
            │ Sportsbooks    │    │  My Picks       │    │  Account       │
            │ (/sportsbooks) │    │  (/picks)       │    │  (/account)    │
            └────────────────┘    └─────────────────┘    └────────────────┘
                    │
            ┌───────▼────────┐
            │  OddsTable     │
            │  Component     │
            │  (NEW Design)  │
            └────────────────┘
```

---

## 📍 Route Map & Components

### **Public Routes (No Auth Required)**

| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/` | Landing OR Dashboard | ✅ | Conditional: shows Landing if not logged in, Dashboard if logged in |
| `/login` | Login Page | ✅ | Email/password auth + OAuth (Google/Apple) |
| `/signup` | Login Page | ✅ | Same component as login, toggle mode |
| `/auth/callback` | AuthCallback | ✅ | OAuth redirect handler |
| `/pricing` | Landing Page | ✅ | Reuses Landing component |
| `/terms` | Terms Page | ✅ | Static content |
| `/privacy` | Privacy Page | ✅ | Static content |
| `/theme-demo` | ThemeDemo | ✅ | Dev/testing only |

### **Protected Routes (Auth Required)**

| Route | Component | Guards | Status | Notes |
|-------|-----------|--------|--------|-------|
| `/dashboard` | Dashboard | PrivateRoute | ✅ | Main app entry point |
| `/sportsbooks` | SportsbookMarkets | PrivateRoute | ✅ | Odds comparison table |
| `/dfs` | DFSMarkets | PrivateRoute + PlanGuard | ✅ | DFS-specific markets |
| `/picks` | MyPicks | PrivateRoute | ✅ | User's saved picks |
| `/account` | Account | PrivateRoute | ✅ | User profile & settings |
| `/usage-plan` | UsagePlan | PrivateRoute | ✅ | API quota tracking |
| `/my-sportsbooks` | MySportsbooks | PrivateRoute | ✅ | Configured sportsbooks |
| `/subscribe` | Subscribe | PrivateRoute | ✅ | Upgrade plan |
| `/billing/success` | BillingSuccess | PrivateRoute | ✅ | Post-purchase redirect |
| `/billing/cancel` | BillingCancel | PrivateRoute | ✅ | Cancelled purchase |

---

## 🔗 Navigation Links & CTAs

### **Landing Page (/) - Not Logged In**

```
Header Component
├── Logo → / (home)
├── Navigation Links
│   ├── Dashboard → /login (redirects to /dashboard after auth)
│   ├── Features → #features (scroll)
│   ├── Pricing → #pricing (scroll)
│   └── FAQ → #faq (scroll)
├── Sign In Button → /login
└── Get Started Button → /login

Hero Section
└── Get Started Button → /login

Pricing Section
├── Gold Plan → /login
└── Platinum Plan → /login

Footer (if visible)
├── Terms → /terms
├── Privacy → /privacy
└── Social Links
```

### **Dashboard (/) - Logged In**

```
Sidebar Navigation
├── Dashboard → /dashboard
├── My Picks → /picks
├── Odds → /sportsbooks
├── Account → /account
├── Settings → /account
└── Sign Out → (logout + redirect to /)

Main Content
└── OddsPage Component (NEW)
    ├── Sport Filter Buttons → Filter by sport
    ├── Search Input → Filter by game/team
    ├── Market Type Dropdown → (TO IMPLEMENT)
    ├── Date Filter → (TO IMPLEMENT)
    ├── Refresh Button → Refresh odds
    └── Add Bet Button → Add to BetSlip
```

### **Login Page (/login)**

```
Left Side (Desktop)
├── Back to Home → /
├── Logo
└── Stats Display

Right Side (Form)
├── Login/Signup Toggle
├── Email Input
├── Password Input
├── Submit Button → Authenticate
├── Google OAuth → /auth/callback
└── Apple OAuth → /auth/callback
```

---

## 🔄 Data Flow & State Management

```
┌─────────────────────────────────────────────────────────┐
│              Authentication Flow                         │
└─────────────────────────────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
SimpleAuth Hook    Supabase Auth         OAuth Providers
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
                    ┌────▼────┐
                    │ useAuth  │
                    │ Context  │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    user state      session state    profile state
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────────┐
                    │ PrivateRoute│
                    │ Guard       │
                    └────┬────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ✅ ALLOW         ⏳ LOADING        ❌ REDIRECT
    Access          Spinner           to /login
```

```
┌─────────────────────────────────────────────────────────┐
│              Odds Data Flow                              │
└─────────────────────────────────────────────────────────┘
                         │
                    ┌────▼────────────┐
                    │ useMarketsWithCache
                    │ Hook            │
                    └────┬────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    API Call        Cache Check       Supabase
    (useMarkets)    (useCachedOdds)   (Fallback)
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────────┐
                    │ games array │
                    │ + books     │
                    └────┬────────┘
                         │
                    ┌────▼────────────┐
                    │ OddsPage        │
                    │ Component       │
                    └────┬────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    Transform       Filter/Sort      Render
    to topPicks     by sport/search   Table
```

```
┌─────────────────────────────────────────────────────────┐
│              Bet Slip Flow                               │
└─────────────────────────────────────────────────────────┘
                         │
                    ┌────▼────────┐
                    │ useBetSlip   │
                    │ Context      │
                    └────┬────────┘
                         │
                    ┌────▼────────┐
                    │ addBet()     │
                    │ Function     │
                    └────┬────────┘
                         │
                    ┌────▼────────┐
                    │ BetSlip      │
                    │ State        │
                    └────┬────────┘
                         │
                    ┌────▼────────┐
                    │ Display in   │
                    │ BetSlip UI   │
                    └──────────────┘
```

---

## ✅ What's Linked & Working

- ✅ **Header Navigation** - All buttons now navigate correctly
- ✅ **Login/Signup** - Full authentication flow
- ✅ **Dashboard Access** - Protected routes working
- ✅ **Odds Data** - API integration complete
- ✅ **Sport Filtering** - Buttons filter odds by sport
- ✅ **Search** - Real-time search filtering
- ✅ **Add to Bet Slip** - BetSlip integration ready
- ✅ **OAuth** - Google & Apple sign-in

---

## ⚠️ What Still Needs Implementation

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Market Type Dropdown | 🔴 TODO | HIGH | Filter by h2h/spreads/totals |
| Date Picker | 🔴 TODO | MEDIUM | Filter by game date |
| BetSlip UI | 🟡 PARTIAL | HIGH | Display & manage bets |
| Sportsbooks Page | 🟡 PARTIAL | MEDIUM | Needs new Design.3 UI |
| My Picks Page | 🟡 PARTIAL | MEDIUM | Needs new Design.3 UI |
| Account Page | 🟡 PARTIAL | MEDIUM | Needs new Design.3 UI |
| Mobile Responsiveness | 🟡 PARTIAL | MEDIUM | Fine-tune mobile layouts |
| Error Handling | 🟡 PARTIAL | LOW | Add more error states |

---

## 🎯 Next Steps (Priority Order)

1. **Market Type Dropdown** - Add filtering by market type
2. **Date Picker** - Add date filtering
3. **BetSlip UI** - Display and manage selected bets
4. **Sportsbooks Page** - Update with new Design.3 UI
5. **Mobile Testing** - Test all pages on mobile devices
6. **Error States** - Add better error messages and recovery

---

## 📝 File Structure Reference

```
client/src/
├── pages/
│   ├── Landing.js              ← Public landing page
│   ├── Login.js                ← Auth page
│   ├── Dashboard.js            ← Main app page
│   ├── Account.js              ← User account
│   ├── MySportsbooks.js        ← Configured books
│   ├── MyPicks.js              ← Saved picks
│   ├── SportsbookMarkets.js    ← Odds comparison
│   ├── DFSMarkets.js           ← DFS markets
│   └── ...
├── components/
│   ├── landing/
│   │   ├── Header.tsx          ← NEW navigation
│   │   ├── Hero.tsx            ← NEW hero section
│   │   ├── OddsPage.tsx        ← NEW odds table
│   │   ├── Pricing.tsx         ← NEW pricing
│   │   └── ...
│   ├── betting/
│   │   ├── OddsTable.js        ← OLD odds table
│   │   └── ...
│   ├── auth/
│   │   ├── PrivateRoute.js     ← Route guard
│   │   └── UsernameSetup.js    ← Username setup
│   └── ...
├── hooks/
│   ├── SimpleAuth.js           ← Auth context
│   ├── useMarkets.js           ← Odds API hook
│   ├── useMarketsWithCache.js  ← Cached odds hook
│   ├── useBetSlip.js           ← BetSlip hook
│   └── ...
├── contexts/
│   └── BetSlipContext.js       ← BetSlip state
├── App.js                      ← Main router
└── index.js                    ← Entry point
```

---

## 🔐 Authentication & Guards

```
PrivateRoute Guard
├── Check if user exists
├── If NO → Redirect to /login
├── If YES (loading) → Show spinner
└── If YES (loaded) → Render component

PlanGuard (for premium features)
├── Check user's plan level
├── If free plan → Show upgrade modal
└── If premium → Render component

MaintenanceGate (for maintenance mode)
├── Check if maintenance mode enabled
├── If enabled → Show password prompt
├── If /login → Allow bypass
└── If unlocked → Render component
```

---

## 📊 Current Status Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Authentication** | ✅ 100% | Login, signup, OAuth all working |
| **Navigation** | ✅ 95% | Header links working, minor polish needed |
| **Odds Display** | ✅ 90% | Data loading, filtering partially done |
| **Filtering** | 🟡 60% | Sport filter done, market/date TODO |
| **Bet Slip** | 🟡 50% | Context ready, UI needs work |
| **Mobile UI** | 🟡 70% | Responsive, needs testing |
| **Error Handling** | 🟡 60% | Basic errors handled, needs refinement |

