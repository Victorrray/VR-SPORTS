# Odds Page Architecture - VR-Odds Platform

**Document**: Comprehensive architecture overview of the odds page and all its components  
**Last Updated**: October 27, 2025  
**Status**: Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Component Hierarchy](#component-hierarchy)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Key Features](#key-features)
7. [Component Details](#component-details)
8. [Hooks & Utilities](#hooks--utilities)
9. [Styling Architecture](#styling-architecture)
10. [Performance Optimizations](#performance-optimizations)

---

## Overview

The odds page (`SportsbookMarkets.js`) is the main betting interface for VR-Odds. It displays real-time odds from multiple sportsbooks, supports multiple betting modes (straight bets, player props, arbitrage, middles), and provides advanced filtering and analysis tools.

### Key Statistics
- **Main Page File**: 2,604 lines (SportsbookMarkets.js)
- **Supporting Components**: 26 betting components
- **Supported Sports**: 30+ sports and leagues
- **Player Prop Markets**: 150+ markets across all sports
- **Sportsbooks**: 15+ integrated sportsbooks

---

## Page Structure

### Main Page Component: `SportsbookMarkets.js`

```
SportsbookMarkets (Main Page)
├── SEOHelmet (Meta tags & SEO)
├── DesktopHeader (Navigation)
├── FilterMenu (Left sidebar filters)
├── SectionMenu (Top navigation tabs)
├── MobileBottomBar (Mobile navigation)
├── MobileFiltersSheet (Mobile filters modal)
├── MobileSearchModal (Mobile search)
├── Main Content Area
│   ├── OddsTable (Main odds display)
│   ├── ArbitrageDetector (Arbitrage mode)
│   ├── MiddlesDetector (Middles mode)
│   └── PlayerProps (Player props mode)
├── BetSlip (Right sidebar - bet management)
└── ApiErrorDisplay (Error handling)
```

### Layout Modes
- **Desktop**: 3-column layout (Filters | Content | BetSlip)
- **Tablet**: 2-column layout with collapsible filters
- **Mobile**: Full-width with bottom navigation and modal filters

---

## Component Hierarchy

### Core Components

#### 1. **OddsTable** (180,110 lines)
The largest and most complex component - displays all odds data.

**Responsibilities**:
- Render game odds in table format
- Handle market grouping and filtering
- Display bookmaker odds for each market
- Manage player props grouping
- Handle game reactions (emojis)
- Responsive table layout

**Props**:
```javascript
{
  games,                    // Array of game objects
  selectedBooks,            // Selected sportsbooks
  markets,                  // Selected markets
  minEV,                    // Minimum EV filter
  isPlayerPropsMode,        // Toggle player props
  onBetClick,              // Bet selection callback
  tableNonce,              // Force re-render trigger
  isArbitrageMode,         // Arbitrage mode toggle
  isMiddlesMode,           // Middles mode toggle
}
```

**Key Features**:
- Dynamic market grouping
- EV calculation and highlighting
- Player props line comparison
- Game reactions system
- Responsive design with desktop/mobile variants

---

#### 2. **BetSlip** (33,087 lines)
Manages bet selection and placement.

**Responsibilities**:
- Display selected bets
- Calculate parlay odds
- Handle bet placement
- Manage bet slip state
- Show bet history

**Props**:
```javascript
{
  bets,              // Array of selected bets
  isOpen,            // Visibility toggle
  onClose,           // Close callback
  onPlaceBets,       // Bet placement callback
  onRemoveBet,       // Remove bet callback
  onUpdateBet,       // Update bet callback
}
```

**Key Features**:
- Parlay calculation
- Bet slip persistence
- Bet history tracking
- Mobile-optimized interface

---

#### 3. **ArbitrageDetector** (26,787 lines)
Identifies arbitrage opportunities across sportsbooks.

**Responsibilities**:
- Scan for guaranteed profit opportunities
- Calculate arbitrage percentages
- Filter by profit threshold
- Display arbitrage opportunities
- Manage arbitrage-specific filters

**Props**:
```javascript
{
  games,              // Game data
  selectedBooks,      // Available sportsbooks
  sport,              // Selected sport
  minProfit,          // Minimum profit threshold
  maxStake,           // Maximum stake amount
}
```

**Key Features**:
- Real-time arbitrage detection
- Profit calculation
- Stake optimization
- Multi-sport support

---

#### 4. **MiddlesDetector** (16,237 lines)
Finds middle betting opportunities.

**Responsibilities**:
- Identify middle opportunities
- Calculate middle probability
- Filter by gap and probability
- Display middle opportunities
- Manage middle-specific filters

**Props**:
```javascript
{
  games,                    // Game data
  selectedBooks,            // Available sportsbooks
  minGap,                   // Minimum gap threshold
  minProbability,           // Minimum probability
  maxStake,                 // Maximum stake
}
```

**Key Features**:
- Middle detection algorithm
- Probability calculation
- Gap analysis
- Risk/reward visualization

---

#### 5. **SportMultiSelect** (24,672 lines)
Multi-sport selection component.

**Responsibilities**:
- Display available sports
- Handle sport selection
- Manage selected sports state
- Filter sports by category
- Search sports

**Props**:
```javascript
{
  selectedSports,    // Currently selected sports
  onSportsChange,    // Selection change callback
  availableSports,   // Available sports list
  mode,              // 'game' or 'props'
}
```

**Key Features**:
- Multi-select with checkboxes
- Sport categorization
- Search functionality
- Responsive grid layout

---

#### 6. **PlayerProps** (8,900 lines)
Dedicated player props display component.

**Responsibilities**:
- Display player prop odds
- Group props by player and market
- Show line comparisons
- Handle prop selection
- Filter by player and market

**Props**:
```javascript
{
  propData,          // Player props data
  selectedBooks,     // Available sportsbooks
  selectedMarkets,   // Selected prop markets
  onPropClick,       // Prop selection callback
}
```

**Key Features**:
- Player grouping
- Line comparison table
- EV highlighting
- Market categorization

---

#### 7. **FilterMenu** (Left Sidebar)
Main filter controls for odds page.

**Sub-components**:
- Sport selector
- Market selector
- Bookmaker selector
- Date picker
- EV threshold slider
- Mode toggles (Arbitrage, Middles, Player Props)

**State Management**:
- Draft state for filters
- Apply/Reset functionality
- Filter persistence

---

#### 8. **SectionMenu** (Top Navigation)
Tab-based navigation for different betting modes.

**Tabs**:
- Straight Bets (default)
- Player Props
- Arbitrage
- Middles
- Live Betting

---

### Supporting Components

#### Layout Components
- **DesktopHeader**: Top navigation bar
- **MobileBottomBar**: Mobile bottom navigation
- **MobileFiltersSheet**: Mobile filter modal
- **MobileSearchModal**: Mobile search interface

#### Utility Components
- **DatePicker**: Date selection for games
- **ApiErrorDisplay**: Error message display
- **OddsTableSkeleton**: Loading skeleton
- **GameReactions**: Emoji reactions system
- **EdgeCalculator**: EV calculation display
- **LiveBetting**: Live betting interface

---

## Data Flow

### 1. Initial Load Flow

```
SportsbookMarkets Component
  ↓
useMarketsWithCache Hook
  ↓
API Call: GET /api/odds
  ↓
Backend Processing
  ├── Fetch from The Odds API
  ├── Apply Supabase cache
  ├── Filter by user plan
  └── Return games data
  ↓
Frontend Cache (smartCache)
  ↓
OddsTable Component
  ↓
Render Games
```

### 2. Filter Application Flow

```
User Changes Filter
  ↓
Draft State Updated
  ↓
User Clicks "Apply"
  ↓
Applied State Updated
  ↓
API Call Triggered
  ↓
Games Re-fetched
  ↓
OddsTable Re-renders
```

### 3. Bet Selection Flow

```
User Clicks Odds
  ↓
BetSlip Context Updated
  ↓
Bet Added to Slip
  ↓
BetSlip Component Re-renders
  ↓
Parlay Odds Calculated
  ↓
User Places Bet
  ↓
Bet Confirmation
```

### 4. Player Props Flow

```
User Enables Player Props Mode
  ↓
Sports Selection Updated
  ↓
Market Selection Updated (Player Prop Markets)
  ↓
API Call: GET /api/odds with player prop markets
  ↓
Backend Fetches Player Props
  ↓
Frontend Groups by Player
  ↓
PlayerProps Component Renders
```

---

## State Management

### Context API
- **BetSlipContext**: Manages bet selection and placement
  - `bets`: Array of selected bets
  - `isOpen`: BetSlip visibility
  - `addBet()`: Add bet to slip
  - `removeBet()`: Remove bet from slip
  - `updateBet()`: Update bet details
  - `clearAllBets()`: Clear all bets
  - `placeBets()`: Submit bets

### Local Component State

#### Main Filters
```javascript
const [picked, setPicked] = useState(["americanfootball_nfl"]);
const [selectedBooks, setSelectedBooks] = useState([...]);
const [selectedDate, setSelectedDate] = useState("");
const [marketKeys, setMarketKeys] = useState([]);
const [minEV, setMinEV] = useState("");
```

#### Mode Toggles
```javascript
const [showPlayerProps, setShowPlayerProps] = useState(false);
const [showArbitrage, setShowArbitrage] = useState(false);
const [showMiddles, setShowMiddles] = useState(false);
```

#### Draft State (For Filter Modal)
```javascript
const [draftPicked, setDraftPicked] = useState([...]);
const [draftSelectedBooks, setDraftSelectedBooks] = useState([...]);
const [draftSelectedDate, setDraftSelectedDate] = useState("");
const [draftMarketKeys, setDraftMarketKeys] = useState([]);
```

#### UI State
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
const [navigationExpanded, setNavigationExpanded] = useState(false);
```

#### Performance State
```javascript
const [tableNonce, setTableNonce] = useState(0);  // Force re-render
const [playerPropsProcessing, setPlayerPropsProcessing] = useState(false);
const [filtersLoading, setFiltersLoading] = useState(false);
```

#### Auto-Refresh State
```javascript
const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
const [refreshCooldown, setRefreshCooldown] = useState(0);
const [isRefreshing, setIsRefreshing] = useState(false);
```

### Storage
- **localStorage**: User preferences
  - `autoRefreshEnabled`: Auto-refresh toggle
  - `userSelectedSportsbooks`: Game odds sportsbook selection
  - `userSelectedSportsbooks_props`: Player props sportsbook selection
  
- **smartCache**: API response caching
  - Cache key: `odds_${sport}_${markets}_${bookmakers}`
  - TTL: 5 minutes for regular odds, 30 seconds for player props

---

## Key Features

### 1. **Multiple Betting Modes**

#### Straight Bets (Default)
- Display all odds from selected sportsbooks
- Show spreads, totals, head-to-head
- EV highlighting for +EV bets
- Parlay support

#### Player Props
- 150+ player prop markets
- Organized by category (passing, rushing, receiving, etc.)
- Line comparison across sportsbooks
- DFS app integration (PrizePicks, Underdog, etc.)

#### Arbitrage Detection
- Automatic arbitrage opportunity detection
- Guaranteed profit calculation
- Stake optimization
- Multi-sport support

#### Middles Detection
- Middle opportunity identification
- Probability calculation
- Gap analysis
- Risk/reward visualization

### 2. **Advanced Filtering**

#### Sport Selection
- Multi-sport selection
- 30+ sports and leagues
- Sport categorization
- Search functionality

#### Market Selection
- Dynamic market filtering based on sport
- Regular markets (h2h, spreads, totals)
- Quarter/half/period markets
- Alternate markets
- Player prop markets

#### Bookmaker Selection
- Multi-sportsbook selection
- Plan-based restrictions
- DFS app filtering for player props
- Bookmaker categorization

#### Date Filtering
- Single date selection
- Game filtering by date
- Upcoming games view

#### EV Filtering
- Minimum EV threshold
- +EV highlighting
- EV calculation display

### 3. **Real-Time Updates**

#### Auto-Refresh
- Configurable auto-refresh interval
- Cooldown between refreshes
- User toggle for enable/disable
- Background refresh without interruption

#### Manual Refresh
- Refresh button in UI
- Immediate data update
- Cooldown enforcement

### 4. **Responsive Design**

#### Desktop
- 3-column layout
- Full filter menu
- Expanded odds table
- Side-by-side BetSlip

#### Tablet
- 2-column layout
- Collapsible filters
- Responsive odds table

#### Mobile
- Full-width layout
- Bottom navigation bar
- Modal filters
- Simplified BetSlip

### 5. **Performance Optimizations**

#### Caching
- API response caching (smartCache)
- Supabase persistent cache
- In-memory cache for frequent queries
- Cache invalidation on data changes

#### Lazy Loading
- Component code splitting
- On-demand component loading
- Image lazy loading

#### Memoization
- useMemo for expensive calculations
- useCallback for event handlers
- Component memoization

#### Debouncing
- Search query debouncing (300ms)
- Filter application debouncing
- Resize event debouncing

---

## Component Details

### OddsTable Component Structure

```javascript
OddsTable
├── Header Row
│   ├── Game Info (Time, Teams)
│   ├── Market Selector
│   └── Bookmaker Headers
├── Game Rows (for each game)
│   ├── Game Info Section
│   │   ├── Team Names
│   │   ├── Start Time
│   │   └── Game Reactions
│   ├── Market Rows (for each market)
│   │   ├── Market Name
│   │   └── Bookmaker Odds
│   │       ├── Odds Value
│   │       ├── EV Indicator
│   │       └── Bet Button
│   └── Player Props (if enabled)
│       ├── Player Name
│       ├── Prop Market
│       ├── Lines Comparison
│       └── Bookmaker Odds
└── Footer
    ├── Pagination
    └── Load More Button
```

### BetSlip Component Structure

```javascript
BetSlip
├── Header
│   ├── Title
│   └── Close Button
├── Bet List
│   ├── Individual Bets
│   │   ├── Bet Details
│   │   ├── Odds Display
│   │   ├── Stake Input
│   │   └── Remove Button
│   └── Add More Bets Button
├── Parlay Section
│   ├── Parlay Toggle
│   ├── Parlay Odds
│   └── Total Payout
├── Summary
│   ├── Total Stake
│   ├── Total Payout
│   └── Profit/Loss
└── Actions
    ├── Place Bets Button
    ├── Clear All Button
    └── Bet History Link
```

---

## Hooks & Utilities

### Custom Hooks

#### `useMarketsWithCache`
Fetches odds data with caching.
```javascript
const { games, loading, error, refetch } = useMarketsWithCache({
  sports,
  markets,
  bookmakers,
  regions
});
```

#### `useMe`
Gets current user profile.
```javascript
const { me, loading } = useMe();
```

#### `useAuth`
Gets authentication state.
```javascript
const { user, isAuthenticated } = useAuth();
```

#### `useBetSlip`
Manages bet slip state.
```javascript
const { bets, isOpen, addBet, removeBet, updateBet, clearAllBets, placeBets } = useBetSlip();
```

#### `useDebounce`
Debounces values.
```javascript
const debouncedQuery = useDebounce(query, 300);
```

### Utility Functions

#### `secureFetch`
Secure API calls with authentication.
```javascript
const response = await secureFetch('/api/odds', {
  sports: 'americanfootball_nfl',
  markets: 'h2h,spreads,totals'
});
```

#### `optimizedStorage`
Optimized localStorage wrapper.
```javascript
optimizedStorage.set('key', value);
const value = optimizedStorage.get('key');
```

#### `smartCache`
Smart caching system.
```javascript
const cached = smartCache.get(key);
smartCache.set(key, value, ttl);
```

---

## Styling Architecture

### CSS Files

#### Main Styles
- **SportsbookMarkets.css**: Main page styles
- **SportsbookMarkets.desktop.css**: Desktop-specific styles
- **SportsbookMarkets.sidebar.css**: Sidebar styles

#### Component Styles
- **OddsTable.css** (38,446 bytes): Main odds table styles
- **OddsTable.desktop.css**: Desktop table styles
- **OddsTable.soccer.css**: Soccer-specific styles
- **BetSlip.css** (19,451 bytes): Bet slip styles
- **ArbitrageDetector.css** (11,829 bytes): Arbitrage styles
- **MiddlesDetector.css** (5,857 bytes): Middles styles
- **SportMultiSelect.css** (13,665 bytes): Sport selector styles

#### Utility Styles
- **FormControls.css**: Form input styles
- **GameReactions.css**: Emoji reactions styles
- **LiveBetting.css**: Live betting styles

### Design System

#### Colors
- Primary: Blue (#0066CC)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Error: Red (#EF4444)
- Neutral: Gray (#6B7280)

#### Typography
- Headings: Inter, Bold
- Body: Inter, Regular
- Monospace: Courier, Regular (for odds)

#### Spacing
- Base unit: 4px
- Padding: 8px, 12px, 16px, 24px, 32px
- Margin: Same as padding
- Gap: 8px, 12px, 16px

#### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Performance Optimizations

### 1. **Caching Strategy**

**Multi-Layer Caching**:
1. Browser Cache (smartCache)
   - TTL: 5 minutes for regular odds
   - TTL: 30 seconds for player props
   - TTL: 30 minutes for alternate markets

2. Supabase Persistent Cache
   - Stores odds data in database
   - Shared across users
   - Automatic cleanup of expired data

3. The Odds API Cache
   - Server-side caching
   - Reduces API calls
   - Saves quota

### 2. **Code Splitting**

**Route-based Splitting**:
- Each page is a separate chunk
- Lazy loading of components
- Reduced initial bundle size

**Component-based Splitting**:
- Large components loaded on demand
- Modal components lazy loaded
- Utility components bundled

### 3. **Memoization**

**useMemo Usage**:
- Expensive calculations memoized
- Market filtering memoized
- EV calculations memoized

**useCallback Usage**:
- Event handlers memoized
- Filter callbacks memoized
- Bet callbacks memoized

### 4. **Debouncing & Throttling**

**Debounced Operations**:
- Search queries (300ms)
- Filter changes (500ms)
- Resize events (200ms)

**Throttled Operations**:
- Scroll events (100ms)
- Auto-refresh (configurable)

### 5. **Lazy Loading**

**Images**:
- Lazy load team logos
- Lazy load sportsbook logos
- Placeholder images

**Components**:
- Lazy load modals
- Lazy load filters
- Lazy load player props

### 6. **Bundle Optimization**

**Tree Shaking**:
- Remove unused code
- Optimize imports
- Reduce bundle size

**Compression**:
- Gzip compression
- Minification
- CSS optimization

---

## API Integration

### Main Endpoints

#### GET /api/odds
Fetch odds for selected sports and markets.

**Parameters**:
```javascript
{
  sports: 'americanfootball_nfl,basketball_nba',
  markets: 'h2h,spreads,totals',
  bookmakers: 'draftkings,fanduel,betmgm',
  regions: 'us,us_dfs'
}
```

**Response**:
```javascript
[
  {
    id: 'game_id',
    sport_key: 'americanfootball_nfl',
    sport_title: 'NFL',
    commence_time: '2025-10-27T20:00:00Z',
    home_team: 'Team A',
    away_team: 'Team B',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Team A', price: -110 },
              { name: 'Team B', price: -110 }
            ]
          }
        ]
      }
    ]
  }
]
```

#### GET /api/player-props
Fetch player prop odds.

**Parameters**:
```javascript
{
  league: 'americanfootball_nfl',
  date: '2025-10-27',
  markets: 'player_pass_yds,player_rush_yds',
  bookmakers: 'draftkings,fanduel'
}
```

#### GET /api/cached-odds/:sport
Fetch cached odds from Supabase.

---

## Error Handling

### Error Types

1. **API Errors**
   - Network errors
   - 4xx client errors
   - 5xx server errors
   - Timeout errors

2. **Validation Errors**
   - Invalid sport selection
   - Invalid market selection
   - Invalid bookmaker selection

3. **Authentication Errors**
   - Unauthorized access
   - Expired token
   - Invalid credentials

4. **Quota Errors**
   - Exceeded API quota
   - Plan limit reached

### Error Display

**ApiErrorDisplay Component**:
- Shows error message
- Provides retry button
- Links to help documentation
- Logs error details

**User Notifications**:
- Toast notifications for errors
- Modal dialogs for critical errors
- Inline error messages for form errors

---

## Future Enhancements

### Planned Features
1. **Live Betting**: Real-time odds updates
2. **Bet History**: Track past bets and performance
3. **Alerts**: Notify users of line movements
4. **Favorites**: Save favorite bets and sports
5. **Export**: CSV/PDF export of odds
6. **Mobile App**: Native mobile application
7. **API Access**: Public API for third-party integrations
8. **Advanced Analytics**: Detailed betting analytics

### Performance Improvements
1. **Virtual Scrolling**: For large odds tables
2. **Web Workers**: Offload calculations
3. **Service Worker**: Better offline support
4. **Streaming**: Real-time data streaming
5. **GraphQL**: Optimized data fetching

---

## Conclusion

The odds page is a sophisticated, multi-featured betting interface with advanced filtering, multiple betting modes, and comprehensive performance optimizations. The modular component architecture allows for easy maintenance and feature additions, while the multi-layer caching strategy ensures fast, responsive performance even with large datasets.

The architecture supports:
- ✅ Multiple betting modes (straight, props, arbitrage, middles)
- ✅ Advanced filtering and search
- ✅ Real-time data updates
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Performance optimization
- ✅ Error handling and recovery
- ✅ User preferences and persistence
- ✅ Accessibility and SEO

**Status**: Production-ready and actively maintained.
