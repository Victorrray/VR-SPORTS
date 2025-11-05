# Game Period Markets Audit

## Summary
✅ **Game period markets are properly configured on both backend and frontend**

## Backend Configuration
**File**: `/server/routes/odds.js` (Lines 27-122)

### Supported Markets by Sport:

#### NFL (americanfootball_nfl)
- **Quarter Markets**: h2h_q1, h2h_q2, h2h_q3, h2h_q4
- **Quarter Spreads**: spreads_q1, spreads_q2, spreads_q3, spreads_q4
- **Quarter Totals**: totals_q1, totals_q2, totals_q3, totals_q4
- **Half Markets**: h2h_h1, h2h_h2
- **Half Spreads**: spreads_h1, spreads_h2
- **Half Totals**: totals_h1, totals_h2
- **Alternate variants** for all above

#### NCAA Football (americanfootball_ncaaf)
- **Quarter Markets**: h2h_q1, h2h_q2, h2h_q3, h2h_q4
- **Quarter Spreads**: spreads_q1, spreads_q2, spreads_q3, spreads_q4
- **Quarter Totals**: totals_q1, totals_q2, totals_q3, totals_q4
- **Half Markets**: h2h_h1, h2h_h2
- **Half Spreads**: spreads_h1, spreads_h2
- **Half Totals**: totals_h1, totals_h2

#### NBA (basketball_nba)
- **Quarter Markets**: h2h_q1, h2h_q2, h2h_q3, h2h_q4
- **Quarter Spreads**: spreads_q1, spreads_q2, spreads_q3, spreads_q4
- **Quarter Totals**: totals_q1, totals_q2, totals_q3, totals_q4
- **Alternate variants** for all above

#### NCAA Basketball (basketball_ncaab)
- **Quarter Markets**: h2h_q1, h2h_q2, h2h_q3, h2h_q4
- **Quarter Spreads**: spreads_q1, spreads_q2, spreads_q3, spreads_q4
- **Quarter Totals**: totals_q1, totals_q2, totals_q3, totals_q4

#### MLB (baseball_mlb)
- **Half Markets**: h2h_h1, h2h_h2
- **Half Spreads**: spreads_h1, spreads_h2
- **Half Totals**: totals_h1, totals_h2
- **Inning Markets**: h2h_1st_1_innings, h2h_1st_3_innings, h2h_1st_5_innings, h2h_1st_7_innings
- **Inning Spreads**: spreads_1st_1_innings, spreads_1st_3_innings, spreads_1st_5_innings, spreads_1st_7_innings
- **Inning Totals**: totals_1st_1_innings, totals_1st_3_innings, totals_1st_5_innings, totals_1st_7_innings
- **Alternate variants** for all above

#### NHL (icehockey_nhl)
- **Period Markets**: h2h_p1, h2h_p2, h2h_p3
- **Period Spreads**: spreads_p1, spreads_p2, spreads_p3
- **Period Totals**: totals_p1, totals_p2, totals_p3
- **Alternate variants** for all above

#### Soccer (All leagues)
- No period/half markets (games are continuous)

### Backend Market Filtering Logic
**File**: `/server/routes/odds.js` (Lines 152-173)

1. **Sport-specific validation**: Markets are validated against `SPORT_MARKET_SUPPORT` for each sport
2. **Market separation**: 
   - Base markets (h2h, spreads, totals, alternates)
   - Quarter/Half/Period markets (identified by patterns: `_q1`, `_q2`, `_q3`, `_q4`, `_h1`, `_h2`, `_p1`, `_p2`, `_p3`, `_1st_`)
3. **Separate API calls**: Base and period markets are fetched separately to optimize API usage

## Frontend Configuration
**File**: `/client/src/pages/SportsbookMarkets.js` (Lines 1056-1175)

### Market Definitions by Sport:

#### Football (NFL & NCAAF)
- Quarter Moneylines: h2h_q1, h2h_q2, h2h_q3, h2h_q4
- Quarter Spreads: spreads_q1, spreads_q2, spreads_q3, spreads_q4
- Quarter Totals: totals_q1, totals_q2, totals_q3, totals_q4
- Half Moneylines: h2h_h1, h2h_h2
- Half Spreads: spreads_h1, spreads_h2
- Half Totals: totals_h1, totals_h2

#### Basketball (NBA & NCAAB)
- Quarter Moneylines: h2h_q1, h2h_q2, h2h_q3, h2h_q4
- Quarter Spreads: spreads_q1, spreads_q2, spreads_q3, spreads_q4
- Quarter Totals: totals_q1, totals_q2, totals_q3, totals_q4

#### Baseball (MLB)
- Inning Moneylines: h2h_1st_1_innings, h2h_1st_3_innings, h2h_1st_5_innings, h2h_1st_7_innings
- Inning Spreads: spreads_1st_1_innings, spreads_1st_3_innings, spreads_1st_5_innings, spreads_1st_7_innings
- Inning Totals: totals_1st_1_innings, totals_1st_3_innings, totals_1st_5_innings, totals_1st_7_innings

#### Hockey (NHL)
- Period Moneylines: h2h_p1, h2h_p2, h2h_p3
- Period Spreads: spreads_p1, spreads_p2, spreads_p3
- Period Totals: totals_p1, totals_p2, totals_p3

### Frontend Market Categories
Markets are organized by category:
- **core**: Base markets (h2h, spreads, totals)
- **alternates**: Alternate lines
- **team**: Team-specific totals
- **special**: Period/Quarter/Half/Inning markets

## API Endpoint Behavior
**Endpoint**: `GET /api/odds`

**Query Parameters**:
- `sports`: Comma-separated sport keys (e.g., `americanfootball_nfl,basketball_nba`)
- `markets`: Comma-separated market keys (e.g., `h2h,spreads,totals,h2h_q1,spreads_q1`)
- `regions`: Bookmaker regions (default: `us`)
- `oddsFormat`: Odds format (default: `american`)
- `date`: Optional date filter

**Example Request**:
```
GET /api/odds?sports=americanfootball_nfl&markets=h2h,spreads,totals,h2h_q1,spreads_q1,totals_q1&regions=us&oddsFormat=american
```

## Verification Checklist

✅ **Backend**:
- [x] SPORT_MARKET_SUPPORT defined for all sports
- [x] Quarter/Half/Period markets listed for applicable sports
- [x] Market filtering logic validates against sport support
- [x] Separate handling for base vs period markets

✅ **Frontend**:
- [x] CORE_MARKETS_BY_SPORT includes period markets
- [x] Markets organized by category
- [x] Market titles and descriptions provided
- [x] Category system (core, alternates, team, special)

✅ **API Integration**:
- [x] Markets parameter properly parsed
- [x] Sport-specific validation applied
- [x] Separate API calls for base and period markets

## Recommendations

1. **Testing**: Test period markets with a specific sport (e.g., NFL quarter markets)
2. **UI Display**: Ensure period markets appear in the market filter dropdown
3. **Data Validation**: Monitor API responses to confirm period market data is being returned
4. **Performance**: Period markets may require additional API calls - monitor quota usage

## TheOddsAPI Documentation Reference
https://the-odds-api.com/sports-odds-data/betting-markets.html

Supported period markets:
- **Football**: Quarter (Q1-Q4) and Half (H1-H2) markets
- **Basketball**: Quarter (Q1-Q4) markets
- **Baseball**: Inning (1st, 1-3, 1-5, 1-7) markets
- **Hockey**: Period (P1-P3) markets
