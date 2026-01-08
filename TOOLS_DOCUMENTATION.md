# VR-Odds Tools Documentation

## Overview
Each tool in the VR-Odds platform serves a specific betting strategy purpose. This document explains what each tool does and how it works.

---

## 1. Straight Bets
**Purpose**: Find the best odds across sportsbooks for standard game markets.

**How it works**:
- Displays moneyline (h2h), spreads, and totals for games
- Compares odds across all available sportsbooks
- Calculates Expected Value (EV) based on weighted average implied probabilities
- Shows the "best book" with the highest odds for each bet

**Key Features**:
- Consensus line detection for spreads (only compares same lines)
- EV calculation using book weighting (sharp books weighted higher)
- Mini table shows all available sportsbooks with their odds

**Use Case**: Finding the best price for a standard bet you want to make.

---

## 2. Player Props
**Purpose**: Find +EV player prop bets by comparing DFS apps and traditional sportsbooks.

**How it works**:
- Fetches player prop markets (points, rebounds, assists, etc.)
- Groups props by player and market type
- Calculates consensus line from traditional sportsbooks
- Compares DFS app lines (PrizePicks, Underdog, etc.) against consensus
- Shows EV percentage for each prop

**Key Features**:
- Supports combo markets (Rebounds + Assists, Points + Rebounds + Assists)
- DFS apps use standard -119 odds
- Synthetic Under creation for DFS apps that only offer Over
- Weighted EV calculation based on book sharpness

**Use Case**: Finding player props where DFS apps offer better value than the market consensus.

---

## 3. Exchanges
**Purpose**: Find +EV opportunities by comparing sportsbook odds against sharp exchange books (Novig, ProphetX).

**How it works**:
- Uses Novig and ProphetX as "sharp" reference lines
- Finds bets where your filtered sportsbook has BETTER odds than the exchange
- Calculates edge as percentage difference in implied probabilities
- Only shows opportunities with 1%+ edge

**Key Features**:
- **One-Sided Market Detection**: When exchange only offers one side (e.g., Over but no Under), recommends betting the missing side (15% implied edge)
- Respects sportsbook filter - only shows picks where YOUR book beats the exchange
- Works for both straight bets AND player props
- Mini table only shows filtered book + exchange comparison

**Use Case**: Finding bets where you have an edge over sharp money.

**Example**:
- Novig offers Over 0.5 Threes at -232
- PrizePicks offers Over 0.5 Threes at +176
- Edge: +176 beats -232 = +EV opportunity

---

## 4. Arbitrage
**Purpose**: Find guaranteed profit opportunities by betting both sides across different sportsbooks.

**How it works**:
- Finds games where the combined implied probability of both sides < 100%
- Calculates ROI (Return on Investment) for each opportunity
- Only shows opportunities with 1%+ ROI

**Key Features**:
- Excludes Unibet (known for voiding arb bets)
- Shows both sides of the bet with recommended books
- Calculates exact ROI percentage

**Formula**:
```
Decimal Odds = American > 0 ? (American/100) + 1 : (100/|American|) + 1
Implied Prob = 1 / Decimal Odds
Total Implied = Prob1 + Prob2
ROI = (1 - Total Implied) * 100  (only if Total Implied < 1)
```

**Use Case**: Locking in guaranteed profit regardless of outcome.

**Example**:
- Team A ML at +150 (Book 1) = 40% implied
- Team B ML at +150 (Book 2) = 40% implied
- Total = 80% → 20% ROI (guaranteed profit)

---

## 5. Middles
**Purpose**: Find opportunities to bet both sides with different lines, creating a "middle" where both bets can win.

**How it works**:
- Groups bets by game and market type (spreads, totals, player props)
- Finds OVER at a LOWER line from one book
- Finds UNDER at a HIGHER line from a DIFFERENT book
- The gap between lines is the "middle"

**Key Features**:
- Excludes DFS apps (they don't offer traditional bets)
- Sorts by gap size (largest middle first)
- Shows both sides with their respective books and lines

**Use Case**: Creating a scenario where you can win both bets if the result lands in the middle.

**Example**:
- Over 232.5 at DraftKings
- Under 234.5 at FanDuel
- Middle = 2 points (if final total is 233 or 234, BOTH bets win)

---

## Filter Behavior by Tool

| Tool | Sportsbook Filter | Min Data Points | Fetches All Books |
|------|-------------------|-----------------|-------------------|
| Straight Bets | ✅ Applied | ✅ Applied | No |
| Player Props | ✅ Applied (client-side) | ✅ Applied | Yes |
| Exchanges | ✅ Applied (determines best book) | ❌ Hidden | Yes |
| Arbitrage | ✅ Display only | ❌ Hidden | Yes |
| Middles | ✅ Display only | ❌ Hidden | Yes |

---

## Mini Table Display by Tool

| Tool | What's Shown |
|------|--------------|
| Straight Bets | All sportsbooks with odds |
| Player Props | All sportsbooks with Over/Under odds |
| Exchanges | Filtered sportsbook + Exchange (Novig/ProphetX) only |
| Arbitrage | All sportsbooks for both sides |
| Middles | Books involved in the middle opportunity |

---

## Reset All Filters Behavior

When "Reset All Filters" is clicked:
- ✅ Resets: Sports, Market, Date, Sportsbooks, Min Data Points
- ❌ Preserves: Current tool selection (stays on Arbitrage if you were on Arbitrage)

---

## Technical Notes

### Exchange Books
- `novig`, `prophet`, `prophetx`, `prophet_exchange`

### DFS Apps
- `prizepicks`, `underdog`, `pick6`, `betr_us_dfs`, `dabble_au`, `sleeper`, `dabble`

### EV Calculation
```
Implied Prob = American > 0 ? 100/(American+100) : |American|/(|American|+100)
EV = ((Fair Prob - Book Prob) / Book Prob) * 100
```

### Book Weighting (for consensus)
- Sharp books (Pinnacle, Circa, Bookmaker): Higher weight
- Standard books: Medium weight
- DFS apps: Lower weight
