# Component Interaction Map - VR-Odds Odds Page

**Visual Reference**: Component relationships and data flow  
**Last Updated**: October 27, 2025

## Component Tree

```
App
└── SportsbookMarkets (Main Page - 2,604 lines)
    ├── SEOHelmet
    ├── DesktopHeader
    ├── Layout Container
    │   ├── LEFT SIDEBAR (Filters)
    │   │   └── FilterMenu
    │   │       ├── SportMultiSelect (24,672 lines)
    │   │       │   ├── Sport List
    │   │       │   └── Search Input
    │   │       ├── Market Selector
    │   │       │   ├── Market Checkboxes
    │   │       │   └── Market Search
    │   │       ├── Bookmaker Selector
    │   │       │   ├── Bookmaker Checkboxes
    │   │       │   └── DFS App Filter
    │   │       ├── DatePicker
    │   │       ├── EV Threshold Slider
    │   │       ├── Mode Toggles
    │   │       │   ├── Player Props Toggle
    │   │       │   ├── Arbitrage Toggle
    │   │       │   └── Middles Toggle
    │   │       └── Apply/Reset Buttons
    │   │
    │   ├── CENTER CONTENT (Main Display)
    │   │   ├── SectionMenu (Tab Navigation)
    │   │   │   ├── Straight Bets Tab
    │   │   │   ├── Player Props Tab
    │   │   │   ├── Arbitrage Tab
    │   │   │   ├── Middles Tab
    │   │   │   └── Live Betting Tab
    │   │   │
    │   │   └── Content Display (Mode-Dependent)
    │   │       ├── OddsTable (180,110 lines) [Default Mode]
    │   │       │   ├── Table Header
    │   │       │   │   ├── Game Info Column
    │   │       │   │   ├── Market Selector
    │   │       │   │   └── Bookmaker Headers
    │   │       │   ├── Game Rows
    │   │       │   │   ├── Game Info Section
    │   │       │   │   │   ├── Team Names
    │   │       │   │   │   ├── Start Time
    │   │       │   │   │   └── GameReactions (8,112 lines)
    │   │       │   │   │       ├── Emoji Buttons
    │   │       │   │   │       └── Reaction Count
    │   │       │   │   ├── Market Rows
    │   │       │   │   │   ├── Market Name
    │   │       │   │   │   └── Bookmaker Odds
    │   │       │   │   │       ├── Odds Value
    │   │       │   │   │       ├── EV Indicator
    │   │       │   │   │       └── Bet Button
    │   │       │   │   └── Player Props Section
    │   │       │   │       ├── Player Name
    │   │       │   │       ├── Prop Market
    │   │       │   │       ├── Lines Comparison
    │   │       │   │       └── Bookmaker Odds
    │   │       │   └── Table Footer
    │   │       │       ├── Pagination
    │   │       │       └── Load More
    │   │       │
    │   │       ├── PlayerProps (8,900 lines) [Player Props Mode]
    │   │       │   ├── Props Filter
    │   │       │   ├── Player List
    │   │       │   ├── Prop Markets
    │   │       │   └── Lines Comparison Table
    │   │       │
    │   │       ├── ArbitrageDetector (26,787 lines) [Arbitrage Mode]
    │   │       │   ├── Arbitrage Filter Panel
    │   │       │   │   ├── Sport Selector
    │   │       │   │   ├── Min Profit Slider
    │   │       │   │   └── Max Stake Input
    │   │       │   ├── Arbitrage Opportunities List
    │   │       │   │   ├── Opportunity Card
    │   │       │   │   │   ├── Game Info
    │   │       │   │   │   ├── Bookmaker Odds
    │   │       │   │   │   ├── Profit Calculation
    │   │       │   │   │   └── Stake Optimization
    │   │       │   │   └── Add to Bet Slip Button
    │   │       │   └── Arbitrage Statistics
    │   │       │
    │   │       └── MiddlesDetector (16,237 lines) [Middles Mode]
    │   │           ├── Middles Filter Panel
    │   │           │   ├── Sport Selector
    │   │           │   ├── Min Gap Slider
    │   │           │   ├── Min Probability Slider
    │   │           │   └── Max Stake Input
    │   │           ├── Middles Opportunities List
    │   │           │   ├── Opportunity Card
    │   │           │   │   ├── Game Info
    │   │           │   │   ├── Bookmaker Odds
    │   │           │   │   ├── Gap Analysis
    │   │           │   │   ├── Probability Calculation
    │   │           │   │   └── Risk/Reward Visualization
    │   │           │   └── Add to Bet Slip Button
    │   │           └── Middles Statistics
    │   │
    │   └── RIGHT SIDEBAR (Bet Slip)
    │       └── BetSlip (33,087 lines)
    │           ├── Header
    │           │   ├── Title
    │           │   └── Close Button
    │           ├── Bet List
    │           │   ├── Individual Bet Item
    │           │   │   ├── Bet Details
    │           │   │   ├── Odds Display
    │           │   │   ├── Stake Input
    │           │   │   └── Remove Button
    │           │   └── Add More Bets Button
    │           ├── Parlay Section
    │           │   ├── Parlay Toggle
    │           │   ├── Parlay Odds
    │           │   └── Total Payout
    │           ├── Summary
    │           │   ├── Total Stake
    │           │   ├── Total Payout
    │           │   └── Profit/Loss
    │           └── Actions
    │               ├── Place Bets Button
    │               ├── Clear All Button
    │               └── Bet History Link
    │
    ├── MobileBottomBar (Mobile Only)
    │   ├── Home Tab
    │   ├── Odds Tab
    │   ├── Props Tab
    │   ├── Account Tab
    │   └── Menu Tab
    │
    ├── MobileFiltersSheet (Mobile Only)
    │   └── [Same as FilterMenu]
    │
    ├── MobileSearchModal (Mobile Only)
    │   ├── Search Input
    │   └── Search Results
    │
    └── ApiErrorDisplay
        ├── Error Message
        ├── Retry Button
        └── Help Link
```

---

## Data Flow Diagram

### 1. Initial Page Load

```
User Navigates to /odds
    ↓
SportsbookMarkets Component Mounts
    ↓
useMarketsWithCache Hook Initializes
    ↓
Check smartCache for existing data
    ├─ Cache HIT → Use cached data
    └─ Cache MISS → Fetch from API
        ↓
    secureFetch('/api/odds', params)
        ↓
    Backend Processing
    ├── Check Supabase cache
    ├── Fetch from The Odds API (if needed)
    ├── Filter by user plan
    └── Return games data
        ↓
    Store in smartCache (5 min TTL)
        ↓
    Update Component State
        ↓
    OddsTable Component Renders
        ↓
    Display Games & Odds
```

### 2. Filter Application Flow

```
User Modifies Filter
    ↓
Draft State Updated (draftPicked, draftSelectedBooks, etc.)
    ↓
User Clicks "Apply Filters"
    ↓
Applied State Updated (picked, selectedBooks, etc.)
    ↓
useMarketsWithCache Dependency Changed
    ↓
Invalidate smartCache
    ↓
Fetch New Data from API
    ↓
Update Component State
    ↓
OddsTable Re-renders with New Data
```

### 3. Bet Selection Flow

```
User Clicks Odds Value
    ↓
OddsTable onClick Handler
    ↓
BetSlip Context: addBet(bet)
    ↓
BetSlipContext State Updated
    ↓
BetSlip Component Re-renders
    ↓
Display Bet in Slip
    ↓
Calculate Parlay Odds
    ↓
Update Summary (Stake, Payout, Profit)
    ↓
User Clicks "Place Bets"
    ↓
API Call: POST /api/bets
    ↓
Backend Processing
    ├── Validate Bets
    ├── Check User Plan
    ├── Store in Database
    └── Return Confirmation
        ↓
    Show Success Message
    ↓
    Clear Bet Slip
```

### 4. Player Props Mode Flow

```
User Clicks "Player Props" Tab
    ↓
setShowPlayerProps(true)
    ↓
SectionMenu Updates Active Tab
    ↓
marketKeys Updated to Player Prop Markets
    ↓
useMarketsWithCache Dependency Changed
    ↓
Fetch Player Props Data
    ├── API Call: GET /api/odds
    ├── Markets: player_pass_yds, player_rush_yds, etc.
    └── Regions: us, us_dfs
        ↓
    Backend Fetches Player Props
        ↓
    Frontend Groups by Player
        ↓
    PlayerProps Component Renders
        ↓
    Display Player Props Table
```

### 5. Arbitrage Detection Flow

```
User Clicks "Arbitrage" Tab
    ↓
setShowArbitrage(true)
    ↓
SectionMenu Updates Active Tab
    ↓
sportsForMode Updated (all major sports)
    ↓
useMarketsWithCache Fetches All Sports Data
    ↓
ArbitrageDetector Component Renders
    ↓
Scan All Games for Arbitrage Opportunities
    ├── For each game:
    │   ├── For each market:
    │   │   ├── For each bookmaker pair:
    │   │   │   ├── Calculate implied probabilities
    │   │   │   ├── Check if sum < 100%
    │   │   │   ├── Calculate guaranteed profit
    │   │   │   └── Optimize stake allocation
    │   │   └── Store if profit > minProfit threshold
    │   └── Continue to next game
    └── Display Opportunities
        ↓
    User Selects Opportunity
        ↓
    Add to Bet Slip
```

### 6. Auto-Refresh Flow

```
autoRefreshEnabled = true
    ↓
Set Interval (configurable, default 30s)
    ↓
Check refreshCooldown
    ├─ Cooldown Active → Skip refresh
    └─ Cooldown Inactive → Proceed
        ↓
    Invalidate smartCache
        ↓
    Fetch New Data
        ↓
    Update Component State
        ↓
    OddsTable Re-renders
        ↓
    Set Cooldown (prevent rapid refreshes)
        ↓
    Wait for Next Interval
```

---

## State Management Architecture

### Context API (BetSlipContext)

```
BetSlipContext
├── State
│   ├── bets: Bet[]
│   ├── isOpen: boolean
│   └── history: BetHistory[]
├── Actions
│   ├── addBet(bet: Bet)
│   ├── removeBet(betId: string)
│   ├── updateBet(betId: string, updates: Partial<Bet>)
│   ├── clearAllBets()
│   ├── openBetSlip()
│   ├── closeBetSlip()
│   └── placeBets()
└── Consumers
    ├── OddsTable (addBet)
    ├── BetSlip (all actions)
    ├── ArbitrageDetector (addBet)
    └── MiddlesDetector (addBet)
```

### Local Component State (SportsbookMarkets)

```
Filters State
├── picked: string[] (selected sports)
├── selectedBooks: string[] (selected sportsbooks)
├── selectedDate: string
├── marketKeys: string[]
├── selectedPlayerPropMarkets: string[]
└── minEV: number

Mode State
├── showPlayerProps: boolean
├── showArbitrage: boolean
└── showMiddles: boolean

Draft State (for filter modal)
├── draftPicked: string[]
├── draftSelectedBooks: string[]
├── draftSelectedDate: string
├── draftMarketKeys: string[]
└── draftSelectedPlayerPropMarkets: string[]

UI State
├── loading: boolean
├── error: Error | null
├── isDesktop: boolean
├── mobileFiltersOpen: boolean
├── navigationExpanded: boolean
└── showMobileSearch: boolean

Performance State
├── tableNonce: number (force re-render)
├── playerPropsProcessing: boolean
└── filtersLoading: boolean

Auto-Refresh State
├── autoRefreshEnabled: boolean
├── refreshCooldown: number
└── isRefreshing: boolean
```

### Storage

```
localStorage
├── autoRefreshEnabled: 'true' | 'false'
├── userSelectedSportsbooks: string[] (JSON)
└── userSelectedSportsbooks_props: string[] (JSON)

smartCache (In-Memory)
├── odds_${sport}_${markets}_${bookmakers}: CacheEntry
│   ├── data: Game[]
│   ├── timestamp: number
│   └── ttl: number
└── player_props_${league}_${date}: CacheEntry

Supabase Database
├── cached_odds
│   ├── sport_key
│   ├── event_id
│   ├── bookmaker_key
│   ├── market_key
│   ├── odds_data
│   └── expires_at
└── odds_update_log
    ├── sport_key
    ├── started_at
    ├── completed_at
    ├── events_updated
    ├── odds_updated
    └── api_calls_made
```

---

## Component Communication Patterns

### Parent → Child (Props)

```
SportsbookMarkets → OddsTable
├── games: Game[]
├── selectedBooks: string[]
├── markets: string[]
├── minEV: number
├── isPlayerPropsMode: boolean
├── onBetClick: (bet: Bet) => void
└── tableNonce: number

SportsbookMarkets → BetSlip
├── bets: Bet[]
├── isOpen: boolean
├── onClose: () => void
└── onPlaceBets: () => void

SportsbookMarkets → ArbitrageDetector
├── games: Game[]
├── selectedBooks: string[]
├── minProfit: number
└── maxStake: number
```

### Child → Parent (Callbacks)

```
OddsTable → SportsbookMarkets
├── onBetClick(bet: Bet)
├── onRefresh()
└── onError(error: Error)

BetSlip → SportsbookMarkets
├── onClose()
├── onPlaceBets()
└── onClearAll()

FilterMenu → SportsbookMarkets
├── onApplyFilters(filters: Filters)
└── onResetFilters()
```

### Sibling Communication (Context)

```
OddsTable ←→ BetSlip (via BetSlipContext)
├── OddsTable: Calls addBet()
├── BetSlip: Displays bets
└── Both: Subscribe to context changes

ArbitrageDetector ←→ BetSlip (via BetSlipContext)
├── ArbitrageDetector: Calls addBet()
└── BetSlip: Displays bets

MiddlesDetector ←→ BetSlip (via BetSlipContext)
├── MiddlesDetector: Calls addBet()
└── BetSlip: Displays bets
```

---

## Performance Optimization Points

### Memoization

```
useMemo
├── Expensive Calculations
│   ├── Market filtering based on sport
│   ├── EV calculations for all games
│   ├── Arbitrage opportunity detection
│   └── Parlay odds calculation
└── Data Transformations
    ├── Game grouping by sport
    ├── Odds sorting and filtering
    └── Player props grouping

useCallback
├── Event Handlers
│   ├── onBetClick
│   ├── onApplyFilters
│   ├── onResetFilters
│   └── onRefresh
└── Callbacks
    ├── addBet
    ├── removeBet
    └── updateBet
```

### Caching

```
Multi-Layer Cache
├── Browser Cache (smartCache)
│   ├── TTL: 5 minutes (regular odds)
│   ├── TTL: 30 seconds (player props)
│   └── TTL: 30 minutes (alternate markets)
├── Supabase Cache
│   ├── Persistent storage
│   ├── Shared across users
│   └── Auto-cleanup
└── The Odds API Cache
    ├── Server-side caching
    ├── Reduces quota usage
    └── Faster responses
```

### Debouncing & Throttling

```
Debounced Operations
├── Search queries (300ms)
├── Filter changes (500ms)
└── Resize events (200ms)

Throttled Operations
├── Scroll events (100ms)
├── Auto-refresh (configurable)
└── Window resize (200ms)
```

---

## Error Handling Flow

```
API Call
    ↓
Error Occurs
    ├─ Network Error
    ├─ 4xx Client Error
    ├─ 5xx Server Error
    └─ Timeout Error
        ↓
    Catch Error
        ↓
    Log Error Details
        ↓
    Update Error State
        ↓
    ApiErrorDisplay Component
        ├── Show Error Message
        ├── Show Retry Button
        └── Show Help Link
            ↓
        User Clicks Retry
            ↓
        Retry API Call
```

---

## Responsive Design Breakpoints

```
Mobile (< 640px)
├── Full-width layout
├── Bottom navigation
├── Modal filters
├── Simplified odds table
└── Stacked bet slip

Tablet (640px - 1024px)
├── 2-column layout
├── Collapsible filters
├── Responsive odds table
└── Side-by-side bet slip

Desktop (> 1024px)
├── 3-column layout
├── Expanded filters
├── Full odds table
└── Full bet slip
```

---

## Summary

This component interaction map provides a complete visual reference for:
- ✅ Component hierarchy and relationships
- ✅ Data flow between components
- ✅ State management patterns
- ✅ Communication patterns
- ✅ Performance optimization points
- ✅ Error handling flow
- ✅ Responsive design strategy

Combined with the ODDS_PAGE_ARCHITECTURE.md document, this provides a comprehensive technical reference for understanding and maintaining the odds page.
