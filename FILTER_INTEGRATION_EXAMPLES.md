# Filter Integration Examples

## Complete Examples for Each Mode

### 1. Straight Bets Mode - Complete Implementation

```javascript
// In SportsbookMarkets.js
<OddsTable
  key={tableNonce}
  games={filteredGames}
  pageSize={15}
  mode="game"
  bookFilter={effectiveSelectedBooks}  // User's selected sportsbooks
  marketFilter={marketKeys}             // User's selected markets
  evMin={minEV}                         // Minimum EV threshold
  evOnlyPositive={evOnlyPositive}       // Only +EV bets
  loading={filtersLoading || marketsLoading}
  error={error || marketsError}
  oddsFormat={oddsFormat}
  allCaps={false}
  onAddBet={addBet}
  betSlipCount={bets.length}
  onOpenBetSlip={openBetSlip}
  searchQuery={debouncedQuery}
  dataPoints={dataPoints}               // Minimum books offering bet
/>
```

**Filter State Management:**
```javascript
// Draft state (before applying)
const [draftSelectedBooks, setDraftSelectedBooks] = useState(getUserSelectedSportsbooks('game'));
const [draftMarketKeys, setDraftMarketKeys] = useState(marketKeys);
const [draftDataPoints, setDraftDataPoints] = useState(10);

// Applied state
const [effectiveSelectedBooks, setEffectiveSelectedBooks] = useState(draftSelectedBooks);
const [marketKeys, setMarketKeys] = useState(draftMarketKeys);
const [dataPoints, setDataPoints] = useState(draftDataPoints);

// Apply filters
const applyFilters = () => {
  setEffectiveSelectedBooks(draftSelectedBooks);
  setMarketKeys(draftMarketKeys);
  setDataPoints(draftDataPoints);
};

// Reset filters
const resetAllFilters = () => {
  setDraftSelectedBooks(getUserSelectedSportsbooks('game'));
  setDraftMarketKeys(getAvailableMarkets(draftPicked));
  setDraftDataPoints(10);
  applyFilters();
};
```

**Filter UI (Desktop):**
```javascript
{/* Straight Bets Filters */}
{!showPlayerProps && !showArbitrage && !showMiddles && (
  <>
    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>📅</span> Date
      </div>
      <DatePicker
        value={draftSelectedDate}
        onChange={setDraftSelectedDate}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>🏈</span> Sports
      </div>
      <SportMultiSelect
        list={sportList || []}
        selected={draftPicked || []}
        onChange={setDraftPicked}
        placeholderText="Select sports..."
        allLabel="All Sports"
        enableCategories={true}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>📊</span> Markets
      </div>
      <SportMultiSelect
        list={getAvailableMarkets(draftPicked)}
        selected={draftMarketKeys || []}
        onChange={setDraftMarketKeys}
        placeholderText="Select markets..."
        allLabel="All Markets"
        enableCategories={true}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>🏪</span> Sportsbooks
      </div>
      <SportMultiSelect
        list={enhancedSportsbookList}
        selected={draftSelectedBooks || []}
        onChange={setDraftSelectedBooks}
        placeholderText="Select sportsbooks..."
        allLabel="All Sportsbooks"
        isSportsbook={true}
        enableCategories={true}
        showDFSApps={false}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>💰</span> Min EV %
      </div>
      <input
        type="number"
        min="0"
        max="50"
        step="0.5"
        value={minEV || ""}
        onChange={(e) => setMinEV(e.target.value ? Number(e.target.value) : null)}
        placeholder="Leave empty for all"
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>📈</span> Data Points (Min Books)
      </div>
      <input
        type="number"
        min="1"
        max="20"
        value={draftDataPoints}
        onChange={(e) => setDraftDataPoints(Number(e.target.value))}
      />
    </div>
  </>
)}
```

---

### 2. Player Props Mode - Complete Implementation

```javascript
// In SportsbookMarkets.js
<OddsTable
  key={`props-${tableNonce}`}
  games={filteredGames}
  pageSize={15}
  mode="props"
  bookFilter={effectiveSelectedBooks}  // DFS apps + traditional books
  marketFilter={selectedPlayerPropMarkets}  // Player prop markets
  evOnlyPositive={true}                // Usually only +EV props
  loading={filtersLoading || playerPropsProcessing || marketsLoading}
  error={error || marketsError}
  oddsFormat={oddsFormat}
  allCaps={false}
  onAddBet={addBet}
  betSlipCount={bets.length}
  onOpenBetSlip={openBetSlip}
  searchQuery={debouncedQuery}
  dataPoints={dataPoints}
/>
```

**Filter State Management:**
```javascript
// Player props specific state
const [draftPicked, setDraftPicked] = useState(["americanfootball_nfl"]);
const [draftSelectedPlayerPropMarkets, setDraftSelectedPlayerPropMarkets] = useState([
  "player_pass_yds", "player_pass_tds", "player_rush_yds", 
  "player_receptions", "player_reception_yds", "player_anytime_td",
  "player_points", "player_rebounds", "player_assists", "player_threes",
  "player_hits", "player_total_bases", "player_strikeouts"
]);
const [draftSelectedPlayerPropsBooks, setDraftSelectedPlayerPropsBooks] = useState(
  selectedPlayerPropsBooks
);

// Applied state
const [picked, setPicked] = useState(draftPicked);
const [selectedPlayerPropMarkets, setSelectedPlayerPropMarkets] = useState(
  draftSelectedPlayerPropMarkets
);
const [selectedPlayerPropsBooks, setSelectedPlayerPropsBooks] = useState(
  draftSelectedPlayerPropsBooks
);

// Apply filters
const applyPlayerPropsFilters = () => {
  setPicked(draftPicked);
  setSelectedPlayerPropMarkets(draftSelectedPlayerPropMarkets);
  setSelectedPlayerPropsBooks(draftSelectedPlayerPropsBooks);
};

// Reset filters
const resetPlayerPropsFilters = () => {
  setDraftPicked(["americanfootball_nfl"]);
  setDraftSelectedPlayerPropMarkets([
    "player_pass_yds", "player_pass_tds", "player_rush_yds",
    "player_receptions", "player_reception_yds", "player_anytime_td",
    "player_points", "player_rebounds", "player_assists", "player_threes",
    "player_hits", "player_total_bases", "player_strikeouts"
  ]);
  setDraftSelectedPlayerPropsBooks(getFreePlanSportsbooks('props'));
  applyPlayerPropsFilters();
};
```

**Filter UI (Desktop):**
```javascript
{/* Player Props Filters */}
{showPlayerProps && (
  <>
    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>🏈</span> Sports
      </div>
      <SportMultiSelect
        list={sportList || []}
        selected={draftPicked || []}
        onChange={setDraftPicked}
        placeholderText="Select sports..."
        allLabel="All Sports"
        enableCategories={true}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>👤</span> Prop Markets
      </div>
      <SportMultiSelect
        list={getPlayerPropMarkets(draftPicked)}
        selected={draftSelectedPlayerPropMarkets || []}
        onChange={setDraftSelectedPlayerPropMarkets}
        placeholderText="Select prop markets..."
        allLabel="All Props"
        enableCategories={true}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>🏪</span> Books (Props)
      </div>
      <SportMultiSelect
        list={enhancedSportsbookList}
        selected={draftSelectedPlayerPropsBooks || []}
        onChange={setDraftSelectedPlayerPropsBooks}
        placeholderText="Select sportsbooks..."
        allLabel="All Books"
        isSportsbook={true}
        enableCategories={true}
        showDFSApps={true}  // Include DFS apps for props
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>📈</span> Data Points (Min Books)
      </div>
      <input
        type="number"
        min="1"
        max="20"
        value={draftDataPoints}
        onChange={(e) => setDraftDataPoints(Number(e.target.value))}
      />
    </div>
  </>
)}
```

---

### 3. Arbitrage Mode - Complete Implementation

```javascript
// In SportsbookMarkets.js
{isArbitrageMode && hasPlatinum ? (
  <ArbitrageDetector 
    sport={picked.length > 0 ? picked : ['americanfootball_nfl', 'americanfootball_ncaaf', 'basketball_nba', 'basketball_ncaab', 'icehockey_nhl']}
    games={filteredGames}
    bookFilter={effectiveSelectedBooks}
    compact={false}
    minProfit={draftMinProfit}
    maxStake={draftMaxStake}
    selectedMarkets={draftMarketKeys}
  />
) : null}
```

**Filter State Management:**
```javascript
// Arbitrage specific state
const [draftMinProfit, setDraftMinProfit] = useState(0.5);  // 0.5% minimum
const [draftMaxStake, setDraftMaxStake] = useState(100);
const [draftSelectedMarkets, setDraftSelectedMarkets] = useState([
  'h2h', 'spreads', 'totals', 'team_totals', 'alternate_spreads', 'alternate_totals'
]);

// Applied state
const [minProfit, setMinProfit] = useState(0.5);
const [maxStake, setMaxStake] = useState(100);
const [arbitrageMarkets, setArbitrageMarkets] = useState(draftSelectedMarkets);

// Apply filters
const applyArbitrageFilters = () => {
  setMinProfit(draftMinProfit);
  setMaxStake(draftMaxStake);
  setArbitrageMarkets(draftSelectedMarkets);
};

// Reset filters
const resetArbitrageFilters = () => {
  setDraftMinProfit(0.5);
  setDraftMaxStake(100);
  setDraftSelectedMarkets(['h2h', 'spreads', 'totals']);
  applyArbitrageFilters();
};
```

**Filter UI (Desktop):**
```javascript
{/* Arbitrage Filters */}
{showArbitrage && (
  <>
    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>💰</span> Minimum Profit %
      </div>
      <input
        type="number"
        min="0.1"
        max="50"
        step="0.1"
        value={draftMinProfit}
        onChange={(e) => setDraftMinProfit(Number(e.target.value))}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>💵</span> Max Stake
      </div>
      <input
        type="number"
        min="10"
        max="10000"
        step="10"
        value={draftMaxStake}
        onChange={(e) => setDraftMaxStake(Number(e.target.value))}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>📊</span> Markets
      </div>
      <SportMultiSelect
        list={getAvailableMarkets(picked)}
        selected={draftSelectedMarkets || []}
        onChange={setDraftSelectedMarkets}
        placeholderText="Select markets..."
        allLabel="All Markets"
        enableCategories={true}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>🏪</span> Sportsbooks
      </div>
      <SportMultiSelect
        list={enhancedSportsbookList}
        selected={draftSelectedBooks || []}
        onChange={setDraftSelectedBooks}
        placeholderText="Select sportsbooks..."
        allLabel="All Sportsbooks"
        isSportsbook={true}
        enableCategories={true}
        showDFSApps={false}  // Exclude DFS for arbitrage
      />
    </div>
  </>
)}
```

---

### 4. Middles Mode - Complete Implementation

```javascript
// In SportsbookMarkets.js
{isMiddlesMode && hasPlatinum ? (
  <MiddlesDetector 
    sport={picked.length > 0 ? picked : ['americanfootball_nfl', 'americanfootball_ncaaf', 'basketball_nba', 'basketball_ncaab', 'icehockey_nhl']}
    games={filteredGames}
    bookFilter={effectiveSelectedBooks}
    compact={false}
    autoRefresh={autoRefreshEnabled}
  />
) : null}
```

**Filter State Management:**
```javascript
// Middles specific state
const [draftMinMiddleGap, setDraftMinMiddleGap] = useState(3);
const [draftMinMiddleProbability, setDraftMinMiddleProbability] = useState(15);
const [draftMaxMiddleStake, setDraftMaxMiddleStake] = useState(1000);

// Applied state
const [minMiddleGap, setMinMiddleGap] = useState(3);
const [minMiddleProbability, setMinMiddleProbability] = useState(15);
const [maxMiddleStake, setMaxMiddleStake] = useState(1000);

// Apply filters
const applyMiddlesFilters = () => {
  setMinMiddleGap(draftMinMiddleGap);
  setMinMiddleProbability(draftMinMiddleProbability);
  setMaxMiddleStake(draftMaxMiddleStake);
};

// Reset filters
const resetMiddlesFilters = () => {
  setDraftMinMiddleGap(3);
  setDraftMinMiddleProbability(15);
  setDraftMaxMiddleStake(1000);
  applyMiddlesFilters();
};
```

**Filter UI (Desktop):**
```javascript
{/* Middles Filters */}
{showMiddles && (
  <>
    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>📏</span> Minimum Gap (Points)
      </div>
      <input
        type="number"
        min="0.5"
        max="20"
        step="0.5"
        value={draftMinMiddleGap}
        onChange={(e) => setDraftMinMiddleGap(Number(e.target.value))}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>📊</span> Min Probability %
      </div>
      <input
        type="number"
        min="5"
        max="50"
        step="1"
        value={draftMinMiddleProbability}
        onChange={(e) => setDraftMinMiddleProbability(Number(e.target.value))}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>💵</span> Max Stake
      </div>
      <input
        type="number"
        min="10"
        max="10000"
        step="10"
        value={draftMaxMiddleStake}
        onChange={(e) => setDraftMaxMiddleStake(Number(e.target.value))}
      />
    </div>

    <div className="desktop-filter-section">
      <div className="desktop-filter-label">
        <span>🏪</span> Sportsbooks
      </div>
      <SportMultiSelect
        list={enhancedSportsbookList}
        selected={draftSelectedBooks || []}
        onChange={setDraftSelectedBooks}
        placeholderText="Select sportsbooks..."
        allLabel="All Sportsbooks"
        isSportsbook={true}
        enableCategories={true}
        showDFSApps={false}
      />
    </div>
  </>
)}
```

---

## Mobile Filter Integration

### Mobile Filters Sheet

```javascript
<MobileFiltersSheet
  isOpen={mobileFiltersOpen}
  onClose={() => setMobileFiltersOpen(false)}
  onApply={applyFilters}
  onReset={resetAllFilters}
  mode={showPlayerProps ? 'props' : showArbitrage ? 'arbitrage' : showMiddles ? 'middles' : 'game'}
  filters={{
    // Straight Bets
    selectedDate: draftSelectedDate,
    selectedSports: draftPicked,
    selectedMarkets: draftMarketKeys,
    selectedBooks: draftSelectedBooks,
    minEV: minEV,
    dataPoints: draftDataPoints,
    
    // Player Props
    selectedPlayerPropMarkets: draftSelectedPlayerPropMarkets,
    selectedPlayerPropsBooks: draftSelectedPlayerPropsBooks,
    
    // Arbitrage
    minProfit: draftMinProfit,
    maxStake: draftMaxStake,
    
    // Middles
    minMiddleGap: draftMinMiddleGap,
    minMiddleProbability: draftMinMiddleProbability,
    maxMiddleStake: draftMaxMiddleStake,
  }}
  onFilterChange={{
    setSelectedDate: setDraftSelectedDate,
    setSports: setDraftPicked,
    setMarkets: setDraftMarketKeys,
    setBooks: setDraftSelectedBooks,
    setMinEV: setMinEV,
    setDataPoints: setDraftDataPoints,
    setPlayerPropMarkets: setDraftSelectedPlayerPropMarkets,
    setPlayerPropsBooks: setDraftSelectedPlayerPropsBooks,
    setMinProfit: setDraftMinProfit,
    setMaxStake: setDraftMaxStake,
    setMinMiddleGap: setDraftMinMiddleGap,
    setMinMiddleProbability: setDraftMinMiddleProbability,
    setMaxMiddleStake: setDraftMaxMiddleStake,
  }}
/>
```

---

## Filter Application Workflow

```
User selects filters in UI
    ↓
Draft state updated (draftSelectedBooks, draftMarketKeys, etc.)
    ↓
User clicks "Apply" button
    ↓
applyFilters() called
    ↓
Applied state updated (effectiveSelectedBooks, marketKeys, etc.)
    ↓
OddsTable receives new props
    ↓
useMemo recalculates with new filters
    ↓
Filter pipeline executes in order
    ↓
Results displayed
```

---

## Common Filter Combinations

### High EV Bets
```javascript
{
  mode: "game",
  evMin: 5,  // Only +5% EV or better
  dataPoints: 8,  // At least 8 books
  bookFilter: ['draftkings', 'fanduel', 'betmgm', 'caesars']
}
```

### DFS Player Props
```javascript
{
  mode: "props",
  bookFilter: ['prizepicks', 'underdog'],
  evOnlyPositive: true,
  dataPoints: 2
}
```

### Safe Arbitrage
```javascript
{
  mode: "arbitrage",
  minProfit: 1.0,  // Only 1%+ guaranteed profit
  maxStake: 500,
  bookFilter: ['draftkings', 'fanduel', 'betmgm']
}
```

### Aggressive Middles
```javascript
{
  mode: "middles",
  minMiddleGap: 1.5,  // Small gaps
  minMiddleProbability: 10,  // Lower probability
  maxStake: 2000
}
```

---

## Testing Filters

### Test Cases

1. **No Filters Applied**
   - All games/props displayed
   - All markets shown
   - All sportsbooks included

2. **Single Filter**
   - Apply only sportsbook filter
   - Apply only market filter
   - Apply only EV filter

3. **Multiple Filters**
   - Combine sportsbook + market
   - Combine EV + data points
   - Combine all filters

4. **Mode Switching**
   - Switch from game to props
   - Switch from props to arbitrage
   - Switch from arbitrage to middles

5. **Filter Reset**
   - Reset individual filters
   - Reset all filters
   - Reset after mode switch

6. **Edge Cases**
   - No results with strict filters
   - Single result
   - All results filtered out
   - Invalid filter combinations
