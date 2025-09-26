# Temporary Market Filter Removal

## Changes Made

We've temporarily modified the SportsbookMarkets.js file to remove the market filter functionality and automatically select all markets for both regular odds mode and player props mode. This change was made to ensure users can see all available markets without having to manually select them.

### 1. Modified Market Selection Logic

```javascript
// TEMPORARY CHANGE: For regular odds mode, include ALL markets
// For player props mode, use all available player prop markets
const marketsForMode = isPlayerPropsMode 
  ? PLAYER_PROP_MARKET_KEYS // Use all available player prop markets
  : ["h2h", "spreads", "totals", "team_totals", "alternate_spreads", "alternate_totals", "alternate_team_totals"]; // Include all regular markets
```

### 2. Modified OddsTable Component Calls

For player props mode:
```javascript
<OddsTable
  key={`props-${tableNonce}`}
  games={filteredGames}
  pageSize={15}
  mode="props"
  bookFilter={effectiveSelectedBooks}
  marketFilter={[]} // Empty array to show ALL player prop markets
  // ...other props
/>
```

For regular odds mode:
```javascript
<OddsTable
  key={tableNonce}
  games={filteredGames}
  pageSize={15}
  mode="game"
  bookFilter={effectiveSelectedBooks}
  marketFilter={[]} // Empty array to show ALL markets
  // ...other props
/>
```

### 3. Hidden Market Filter UI

We've temporarily hidden the market filter UI in the mobile filters sheet:

```javascript
{/* Markets Filter - TEMPORARILY HIDDEN */}
{/* All markets are automatically selected */}
{false && (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
      📊 Markets
    </label>
    <SportMultiSelect
      list={getRelevantMarkets(draftPicked)}
      selected={draftMarketKeys || []}
      onChange={setDraftMarketKeys}
      placeholderText="Select markets..."
      allLabel="All Markets"
    />
  </div>
)}
```

## How This Works

1. By setting `marketFilter={[]}` in the OddsTable component calls, we're telling the component to show all available markets. This is because the OddsTable component has logic that treats an empty array as "show all markets".

2. By modifying the `marketsForMode` variable, we're ensuring that all markets are included in the API requests to fetch odds data.

3. By hiding the market filter UI, we're preventing users from manually selecting markets, which ensures they always see all available markets.

## Note

This is a temporary change. When you're ready to restore the market filter functionality, you can:

1. Remove the `// TEMPORARY CHANGE` comments and restore the original code
2. Restore the market filter UI by removing the `{false && (` condition
3. Restore the original `marketFilter` props in the OddsTable component calls

The arbitrage and middles modes are unaffected by these changes and will continue to work as before.
