# Sports List Cleanup

## Problem Fixed

We've cleaned up the sports list in the VR-Odds platform by removing championship winners and other less popular sports. This makes the sports selection dropdown cleaner and more focused on the most relevant sports.

## Changes Made

### 1. Removed Championship Winners

Championship winner markets have been removed from the sports list:
- NCAAF Championship Winner
- NFL Super Bowl Winner
- MLB World Series Winner
- NBA Championship Winner
- NHL Championship Winner
- Soccer league winners

### 2. Removed Less Popular Leagues

Less popular leagues have been removed:
- AFL (Australian Football League)
- KBO (Korean Baseball Organization)
- MiLB (Minor League Baseball)
- NPB (Nippon Professional Baseball)
- Various cricket leagues
- Rugby leagues

### 3. Added Grouping

Sports are now organized into logical groups:
- **Major US Sports**: NFL, NCAAF, NBA, NCAAB, MLB, NHL
- **Soccer**: EPL, Champions League, MLS
- **Combat Sports**: MMA, Boxing

### 4. Implementation Details

1. **Server-side Filtering**:
   - Added a `filterSportsList` function to filter out unwanted sports
   - Applied filtering to both cached and API responses
   - Updated the fallback sports list with proper grouping

2. **Client-side Fallback**:
   - Updated the client-side fallback sports list to match the server
   - Added group information for better organization

## Benefits

- **Cleaner UI**: The sports dropdown is now more focused and less cluttered
- **Better Organization**: Sports are grouped logically for easier navigation
- **Consistent Experience**: Both server and client use the same filtered list
- **Improved Performance**: Less data to process and render

## How It Works

The server now filters the sports list from The Odds API before sending it to the client. If a sport matches any of these criteria, it's excluded:

1. It's in the explicit list of championship winners
2. It starts with any of the prefixes in the less popular leagues list

This ensures that only relevant sports appear in the dropdown, making it easier for users to find what they're looking for.
