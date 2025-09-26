# DFS Apps Visibility Fix

## Problem Fixed

DFS apps (Daily Fantasy Sports apps) like PrizePicks, Underdog Fantasy, and DraftKings Pick6 were being displayed in both player props mode and game odds mode. However, these apps should only be visible in player props mode since they're not relevant for traditional game odds.

## Changes Made

We modified the `showDFSApps` prop for the SportMultiSelect components in the game odds mode to hide DFS apps:

```javascript
// Before: DFS apps were visible in game odds mode
<SportMultiSelect
  list={enhancedSportsbookList}
  selected={draftSelectedBooks || []}
  onChange={setDraftSelectedBooks}
  placeholderText="Select sportsbooks..."
  allLabel="All Sportsbooks"
  isSportsbook={true}
  enableCategories={true}
  showDFSApps={true}
/>

// After: DFS apps are hidden in game odds mode
<SportMultiSelect
  list={enhancedSportsbookList}
  selected={draftSelectedBooks || []}
  onChange={setDraftSelectedBooks}
  placeholderText="Select sportsbooks..."
  allLabel="All Sportsbooks"
  isSportsbook={true}
  enableCategories={true}
  showDFSApps={false} /* Hide DFS apps in game odds mode */
/>
```

We kept the `showDFSApps` prop set to `true` for the player props mode:

```javascript
// Player props mode still shows DFS apps
<SportMultiSelect
  list={enhancedSportsbookList}
  selected={draftSelectedPlayerPropsBooks || []}
  onChange={setDraftSelectedPlayerPropsBooks}
  placeholderText="Select sportsbooks..."
  allLabel="All Sportsbooks"
  isSportsbook={true}
  enableCategories={true}
  showDFSApps={true}
/>
```

## How This Works

The `SportMultiSelect` component has built-in categorization that organizes sportsbooks into different categories, including "DFS Apps". The `showDFSApps` prop controls whether this category is displayed:

```javascript
// From SportMultiSelect.js
// Skip DFS category if showDFSApps is false
if (key === 'dfs' && !showDFSApps) return;
```

By setting `showDFSApps={false}` for game odds mode, we ensure that DFS apps like PrizePicks, Underdog Fantasy, and DraftKings Pick6 are not displayed in the sportsbook selection dropdown for regular game odds.

## Benefits

1. **Improved User Experience**: Users now only see relevant sportsbooks in each mode.
2. **Reduced Confusion**: DFS apps are only shown in player props mode where they're actually useful.
3. **Cleaner Interface**: The sportsbook selection dropdown in game odds mode is now more focused and relevant.

## Note

This change only affects the UI display of the sportsbooks in the filter dropdown. It doesn't affect the actual data fetching or processing logic. If a user had previously selected DFS apps in game odds mode (before this change), those selections will still be honored, but the DFS apps category will no longer be visible in the dropdown for new selections.
