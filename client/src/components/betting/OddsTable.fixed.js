import React, { useState, useRef, useEffect, useMemo } from "react";
import { Trophy, TrendingUp, TrendingDown, Filter } from "lucide-react";
import OddsTableSkeleton, { OddsTableSkeletonMobile } from "./OddsTableSkeleton";
import { useMe } from "../../hooks/useMe";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import MarketTypeSelector, { MARKET_TYPES } from "./MarketTypeSelector";
import "./OddsTable.css";
import "./MarketTypeSelector.css";

// Helper function to get bookmaker priority for sorting
function getBookPriority(bookmakerKey) {
  const priorityMap = {
    'fanduel': 1,
    'draftkings': 2,
    'betmgm': 3,
    'caesars': 4,
    'pointsbet': 5,
    'barstool': 6,
    'betrivers': 7,
    'superbook': 8,
    'wynn': 9,
    'unibet': 10,
    'twinspires': 11,
    'bovada': 12,
    'lowvig': 13,
    'betonlineag': 14,
    'williamhill_us': 15,
    'sugarhouse': 16,
    'foxbet': 17,
    'betfair': 18,
    'draftkings_atlantic': 19,
    'betmgm_atlantic': 20,
    'fanduel_atlantic': 21,
    'betway': 22,
    'bet365': 23,
    'pinnacle': 24,
    'mybookieag': 25,
    'gtbets': 26,
    'intertops': 27,
    'youwager': 28,
    'betus': 29,
    'sportsbetting': 30,
    'bovada_lv': 31,
    'betnow': 32,
    'bookmaker': 33,
    '5dimes': 34,
    'heritage': 35
  };
  return priorityMap[bookmakerKey?.toLowerCase()] || 99;
}

// Format odds with proper sign and decimal places
function formatOdds(odds) {
  if (odds === null || odds === undefined) return '';
  const num = Number(odds);
  if (isNaN(num)) return odds;
  if (num > 0) return `+${num}`;
  return num.toString();
}

// Helper to grab home/away odds from a bookmaker's odds object
function grab(bookmaker, isHome) {
  if (!bookmaker) return '';
  if (bookmaker.price !== undefined) return bookmaker.price;
  if (bookmaker.odds !== undefined) return bookmaker.odds;
  if (bookmaker.outcomes && bookmaker.outcomes.length >= 2) {
    return isHome ? bookmaker.outcomes[0].price || bookmaker.outcomes[0].odds : 
                    bookmaker.outcomes[1].price || bookmaker.outcomes[1].odds;
  }
  return '';
}

// Helper functions for odds calculations
function calculateEV(odds, fairLine) {
  if (!odds || !fairLine) return null;
  const toDec = o => (o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1);
  const userDec = toDec(odds);
  const fairDec = toDec(fairLine);
  return ((userDec / fairDec) - 1) * 100;
}

function americanToProb(odds) {
  const o = Number(odds);
  if (!o) return null;
  return o > 0 ? 100 / (o + 100) : (-o) / ((-o) + 100);
}

function americanToDecimal(odds) {
  const o = Number(odds);
  if (!o) return null;
  return o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1;
}

function decimalToAmerican(dec) {
  if (!dec || dec <= 1) return 0;
  return dec >= 2 ? Math.round((dec - 1) * 100) : Math.round(-100 / (dec - 1));
}

function median(nums) {
  const a = nums.slice().sort((x, y) => x - y);
  const n = a.length;
  if (!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function formatLine(line, marketKey, mode = "game") {
  if (line === undefined || line === null) return '';
  if (marketKey === 'h2h') return ''; // No line for moneyline
  if (marketKey === 'spreads' || marketKey.includes('spread')) {
    return line > 0 ? `+${line}` : line.toString();
  }
  if (marketKey === 'totals' || marketKey.includes('total')) {
    return `O/U ${line}`;
  }
  return line;
}

function formatMarket(key = "") {
  if (!key) return '';
  if (key === 'h2h') return 'Moneyline';
  if (key === 'spreads') return 'Spread';
  if (key === 'totals') return 'Total';
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function marketTypeLabel(key = "") {
  if (!key) return '';
  if (key === 'h2h') return 'Moneyline';
  if (key === 'spreads') return 'Spread';
  if (key === 'totals') return 'Total';
  return key;
}

function cleanBookTitle(t) {
  if (!t) return '';
  return t
    .replace(/\s*\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/\s*\[[^\]]*\]/g, '')  // Remove anything in brackets
    .trim();
}

const TEAM_NICKNAMES = { 
  americanfootball_ncaaf: { 
    'St. Francis (PA) Red Flash': 'Red Flash' 
  } 
};

// Team location abbreviations for duplicate names
const TEAM_LOCATIONS = {
  nba: {
    'Lakers': 'LAL',
    'Clippers': 'LAC',
    'Knicks': 'NYK',
    'Nets': 'BKN',
    'Bulls': 'CHI',
    'Warriors': 'GSW'
  },
  nfl: {
    'Giants': 'NYG',
    'Jets': 'NYJ',
    'Rams': 'LAR',
    'Chargers': 'LAC',
    '49ers': 'SF'
  }
};

function shortTeam(name = "", sportKey = "") {
  if (!name) return '';
  
  // Try to get from TEAM_NICKNAMES first
  const sportNicknames = TEAM_NICKNAMES[sportKey];
  if (sportNicknames && sportNicknames[name]) {
    return sportNicknames[name];
  }
  
  // Try to get from TEAM_LOCATIONS
  const sportLocations = TEAM_LOCATIONS[sportKey];
  if (sportLocations) {
    for (const [team, abbr] of Object.entries(sportLocations)) {
      if (name.includes(team)) {
        return abbr;
      }
    }
  }
  
  // Default: return the last word
  const parts = name.trim().split(' ');
  return parts[parts.length - 1];
}

function formatKickoffNice(commence) {
  if (!commence) return '';
  
  try {
    const date = new Date(commence);
    if (isNaN(date.getTime())) return commence;
    
    const now = new Date();
    const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Final';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'short' });
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return commence;
  }
}

function getSportLeague(sportKey = '', sportTitle = '') {
  const leagues = {
    'basketball': {
      nba: 'NBA',
      ncaab: 'NCAAB',
      euroleague: 'EuroLeague'
    },
    'football': {
      nfl: 'NFL',
      ncaaf: 'NCAAF',
      cfl: 'CFL'
    },
    'baseball': {
      mlb: 'MLB',
      npb: 'NPB',
      kbo: 'KBO'
    },
    'hockey': {
      nhl: 'NHL',
      khl: 'KHL',
      shl: 'SHL'
    }
  };
  
  for (const [sport, leagueMap] of Object.entries(leagues)) {
    if (sportKey.includes(sport) || sportTitle.toLowerCase().includes(sport)) {
      for (const [key, league] of Object.entries(leagueMap)) {
        if (sportKey.includes(key) || sportTitle.toLowerCase().includes(key)) {
          return league;
        }
      }
      return Object.values(leagueMap)[0];
    }
  }
  
  return sportKey.toUpperCase();
}

/* ---------- De-vig helpers ---------- */
function consensusDevigProb(row) {
  if (!row || !row.bookmakers) return null;
  
  const outcomes = [];
  const seenBooks = new Set();
  
  // Collect all outcomes from all bookmakers
  row.bookmakers.forEach(bookmaker => {
    const bookKey = String(bookmaker.key || '').toLowerCase();
    if (seenBooks.has(bookKey)) return;
    seenBooks.add(bookKey);
    
    const markets = bookmaker.markets || [];
    markets.forEach(market => {
      if (!market.outcomes) return;
      
      market.outcomes.forEach(outcome => {
        const odds = outcome.price || outcome.odds;
        if (odds !== undefined && odds !== null) {
          outcomes.push({
            name: outcome.name,
            point: outcome.point,
            price: Number(odds),
            book: bookKey
          });
        }
      });
    });
  });
  
  // Group by outcome name and point
  const groups = {};
  outcomes.forEach(outcome => {
    const key = `${outcome.name}_${outcome.point || ''}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(outcome.price);
  });
  
  // Calculate implied probabilities for each group
  const probs = [];
  Object.values(groups).forEach(group => {
    const bestPrice = Math.max(...group);
    probs.push(americanToProb(bestPrice));
  });
  
  // Calculate no-vig probability
  const totalProb = probs.reduce((sum, p) => sum + p, 0);
  if (totalProb <= 0) return null;
  
  return 1 / totalProb;
}

function devigPairCount(row) {
  if (!row || !row.bookmakers) return 0;
  
  const books = new Set();
  let count = 0;
  
  row.bookmakers.forEach(bookmaker => {
    const bookKey = String(bookmaker.key || '').toLowerCase();
    if (books.has(bookKey)) return;
    
    const markets = bookmaker.markets || [];
    markets.forEach(market => {
      if (!market.outcomes || market.outcomes.length < 2) return;
      
      const odds1 = market.outcomes[0].price || market.outcomes[0].odds;
      const odds2 = market.outcomes[1].price || market.outcomes[1].odds;
      
      if (odds1 !== undefined && odds2 !== undefined) {
        count++;
        books.add(bookKey);
      }
    });
  });
  
  return count;
}

function uniqueBookCount(row) {
  if (!row || !row.bookmakers) return 0;
  
  const books = new Set();
  row.bookmakers.forEach(bookmaker => {
    const bookKey = String(bookmaker.key || '').toLowerCase();
    if (bookKey) {
      books.add(bookKey);
    }
  });
  
  return books.size;
}

export default function OddsTable({
  games,
  mode = "game",
  pageSize = 15,
  initialSort = { key: "ev", dir: "desc" },
  marketFilter = [],
  bookFilter = [],
  onAddBet,
  loading = false
}) {
  const { user } = useMe();
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort);
  const [showMarketFilter, setShowMarketFilter] = useState(false);
  const [selectedMarketTypes, setSelectedMarketTypes] = useLocalStorage('selectedMarketTypes', ['spreads', 'h2h', 'totals']);
  const [favoriteBooks, setFavoriteBooks] = useLocalStorage('favoriteBooks', ['fanduel', 'draftkings', 'betmgm']);
  
  // Price change detection for flash animations
  const prevPriceRef = useRef({});
  const [priceDelta, setPriceDelta] = useState({});
  
  // Filter games based on selected market types
  const filteredGames = useMemo(() => {
    if (!games) return [];
    if (!marketFilter?.length) return games;
    
    return games.filter(game => {
      if (!game.bookmakers?.length) return false;
      
      return game.bookmakers.some(bookmaker => {
        return bookmaker.markets?.some(market => {
          return marketFilter.includes(market.key);
        });
      });
    });
  }, [games, marketFilter]);
  
  // Process rows for display
  const allRows = useMemo(() => {
    if (!filteredGames) return [];
    
    const rows = [];
    
    filteredGames.forEach(game => {
      if (!game.bookmakers?.length) return;
      
      const baseKeys = ["h2h", "spreads", "totals"];
      const keys = (marketFilter && marketFilter.length) ? marketFilter : baseKeys;
      
      keys.forEach(marketKey => {
        const allMarketOutcomes = [];
        
        // Collect all outcomes for this market
        game.bookmakers.forEach(bookmaker => {
          const market = (bookmaker.markets || []).find(m => m.key === marketKey);
          if (!market?.outcomes?.length) return;
          
          market.outcomes.forEach(outcome => {
            allMarketOutcomes.push({
              ...outcome,
              bookmaker: {
                key: bookmaker.key,
                title: bookmaker.title
              },
              market_key: market.key,
              game: game,
              commence_time: game.commence_time,
              sport_key: game.sport_key,
              sport_title: game.sport_title
            });
          });
        });
        
        // Group by outcome name and point
        const grouped = {};
        allMarketOutcomes.forEach(outcome => {
          const key = `${outcome.name || outcome.text || ''}_${outcome.point || ''}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(outcome);
        });
        
        // Create rows for each outcome
        Object.entries(grouped).forEach(([key, outcomes]) => {
          if (!outcomes.length) return;
          
          // Sort by bookmaker priority
          outcomes.sort((a, b) => {
            const aPriority = getBookPriority(a.bookmaker?.key);
            const bPriority = getBookPriority(b.bookmaker?.key);
            return aPriority - bPriority;
          });
          
          // Use the best available odds for this outcome
          const bestOutcome = outcomes[0];
          
          rows.push({
            key: `${game.id}_${marketKey}_${key}`,
            game: game,
            market_key: marketKey,
            out: bestOutcome,
            all_books: outcomes,
            commence_time: game.commence_time,
            sport_key: game.sport_key
          });
        });
      });
    });
    
    return rows;
  }, [filteredGames, marketFilter]);
  
  // Calculate EV and fair odds for each row
  const { evMap, fairDevigMap } = useMemo(() => {
    const evMap = new Map();
    const fairDevigMap = new Map();
    
    allRows.forEach(row => {
      const fair = consensusDevigProb(row);
      fairDevigMap.set(row.key, fair);
      
      if (fair && row.out) {
        const odds = row.out.price || row.out.odds;
        if (odds) {
          const ev = calculateEV(odds, decimalToAmerican(1 / fair));
          evMap.set(row.key, ev);
        }
      }
    });
    
    return { evMap, fairDevigMap };
  }, [allRows]);
  
  // Sort rows
  const sortedRows = useMemo(() => {
    const rows = [...allRows];
    
    if (!sort?.key) return rows;
    
    return rows.sort((a, b) => {
      let valA, valB;
      
      switch (sort.key) {
        case 'ev':
          valA = evMap.get(a.key) || -Infinity;
          valB = evMap.get(b.key) || -Infinity;
          break;
          
        case 'match':
          valA = `${a.game.home_team} vs ${a.game.away_team}`;
          valB = `${b.game.home_team} vs ${b.game.away_team}`;
          break;
          
        case 'line':
          valA = a.out.point || 0;
          valB = b.out.point || 0;
          break;
          
        case 'book':
          valA = a.out.bookmaker?.title || '';
          valB = b.out.bookmaker?.title || '';
          break;
          
        case 'odds':
          valA = a.out.price || a.out.odds || 0;
          valB = b.out.price || b.out.odds || 0;
          break;
          
        case 'time':
          valA = new Date(a.commence_time).getTime();
          valB = new Date(b.commence_time).getTime();
          break;
          
        case 'market':
          valA = marketTypeLabel(a.market_key);
          valB = marketTypeLabel(b.market_key);
          break;
          
        default:
          return 0;
      }
      
      if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
      if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allRows, sort, evMap]);
  
  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);
  
  // Handle page changes
  useEffect(() => {
    setPage(1); // Reset to first page when sort or filters change
  }, [sort, marketFilter, bookFilter]);
  
  // Handle price changes for flash animations
  useEffect(() => {
    const newDeltas = {};
    
    allRows.forEach(row => {
      const prevPrice = prevPriceRef.current[row.key];
      const currentPrice = row.out.price || row.out.odds;
      
      if (prevPrice !== undefined && currentPrice !== undefined) {
        if (currentPrice > prevPrice) {
          newDeltas[row.key] = 'up';
        } else if (currentPrice < prevPrice) {
          newDeltas[row.key] = 'down';
        }
      }
      
      prevPriceRef.current[row.key] = currentPrice;
    });
    
    if (Object.keys(newDeltas).length > 0) {
      setPriceDelta(newDeltas);
      
      // Clear the flash after animation completes
      const timer = setTimeout(() => {
        setPriceDelta({});
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [allRows]);
  
  // Toggle row expansion
  const toggleRow = (key) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Add to bet slip handler
  const addToBetSlip = (row, book, buttonElement) => {
    if (!onAddBet) return;
    
    const bet = {
      id: `${row.game.id}_${row.market_key}_${book.name || book.text || ''}_${book.point || ''}_${Date.now()}`,
      game: row.game,
      market_key: row.market_key,
      selection: book,
      price: book.price || book.odds,
      point: book.point,
      name: book.name || book.text,
      bookmaker: book.bookmaker || row.out.bookmaker,
      timestamp: new Date().toISOString(),
      user_id: user?.id
    };
    
    onAddBet(bet);
    
    // Add visual feedback
    if (buttonElement) {
      buttonElement.classList.add('added');
      setTimeout(() => {
        buttonElement.classList.remove('added');
      }, 1000);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="odds-table-container">
        <div className="market-filter-container">
          <button 
            className={`market-filter-button ${showMarketFilter ? 'active' : ''}`}
            onClick={() => setShowMarketFilter(!showMarketFilter)}
            aria-label="Filter markets"
            aria-expanded={showMarketFilter}
          >
            <Filter size={16} />
            <span>Markets</span>
          </button>
          {showMarketFilter && (
            <div className="market-filter-dropdown">
              <MarketTypeSelector 
                value={selectedMarketTypes}
                onChange={setSelectedMarketTypes}
              />
            </div>
          )}
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading odds...</div>
          <div className="loading-subtext">This may take a moment</div>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!paginatedRows.length) {
    return (
      <div className="odds-table-container">
        <div className="market-filter-container">
          <button 
            className={`market-filter-button ${showMarketFilter ? 'active' : ''}`}
            onClick={() => setShowMarketFilter(!showMarketFilter)}
            aria-label="Filter markets"
            aria-expanded={showMarketFilter}
          >
            <Filter size={16} />
            <span>Markets</span>
          </button>
          {showMarketFilter && (
            <div className="market-filter-dropdown">
              <MarketTypeSelector 
                value={selectedMarketTypes}
                onChange={setSelectedMarketTypes}
              />
            </div>
          )}
        </div>
        <div className="empty-state">
          <p>No odds available matching your criteria.</p>
          <button 
            className="clear-filters"
            onClick={() => {
              setSelectedMarketTypes(['spreads', 'h2h', 'totals']);
              setPage(1);
            }}
          >
            Clear filters
          </button>
        </div>
      </div>
    );
  }
  
  // Main render
  return (
    <div className="odds-table-container">
      <div className="market-filter-container">
        <button 
          className={`market-filter-button ${showMarketFilter ? 'active' : ''}`}
          onClick={() => setShowMarketFilter(!showMarketFilter)}
          aria-label="Filter markets"
          aria-expanded={showMarketFilter}
        >
          <Filter size={16} />
          <span>Markets</span>
        </button>
        {showMarketFilter && (
          <div className="market-filter-dropdown">
            <MarketTypeSelector 
              value={selectedMarketTypes}
              onChange={setSelectedMarketTypes}
            />
          </div>
        )}
      </div>
      
      <div className="odds-table-wrapper">
        <table className="odds-grid" data-mode={mode}>
          <thead>
            <tr>
              <th 
                className="ev-col sort-th" 
                onClick={() => setSort(s => ({ 
                  key: 'ev', 
                  dir: s.key === 'ev' && s.dir === 'desc' ? 'asc' : 'desc' 
                })}
              >
                <span className="sort-label">
                  EV% 
                  <span className="sort-indicator">
                    {sort.key === 'ev' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}
                  </span>
                </span>
              </th>
              <th 
                className="sort-th" 
                onClick={() => setSort(s => ({ 
                  key: 'match', 
                  dir: s.key === 'match' && s.dir === 'desc' ? 'asc' : 'desc' 
                })}
              >
                <span className="sort-label">
                  Match 
                  <span className="sort-indicator">
                    {sort.key === 'match' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}
                  </span>
                </span>
              </th>
              <th>Team</th>
              <th 
                className="sort-th" 
                onClick={() => setSort(s => ({ 
                  key: 'line', 
                  dir: s.key === 'line' && s.dir === 'desc' ? 'asc' : 'desc' 
                })}
              >
                <span className="sort-label">
                  Line 
                  <span className="sort-indicator">
                    {sort.key === 'line' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}
                  </span>
                </span>
              </th>
              <th 
                className="sort-th" 
                onClick={() => setSort(s => ({ 
                  key: 'book', 
                  dir: s.key === 'book' && s.dir === 'desc' ? 'asc' : 'desc' 
                })}
              >
                <span className="sort-label">
                  Book 
                  <span className="sort-indicator">
                    {sort.key === 'book' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}
                  </span>
                </span>
              </th>
              <th 
                className="sort-th" 
                onClick={() => setSort(s => ({ 
                  key: 'odds', 
                  dir: s.key === 'odds' && s.dir === 'desc' ? 'asc' : 'desc' 
                })}
              >
                <span className="sort-label">
                  Odds 
                  <span className="sort-indicator">
                    {sort.key === 'odds' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}
                  </span>
                </span>
              </th>
              <th>De-Vig</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => {
              const ev = evMap.get(row.key);
              const fair = fairDevigMap.get(row.key);
              const oddsChange = priceDelta[row.key];
              
              return (
                <React.Fragment key={row.key}>
                  <tr 
                    className={`odds-row${expandedRows[row.key] ? ' expanded' : ''}`} 
                    onClick={() => toggleRow(row.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className={`ev-col ${ev > 0 ? 'positive' : 'negative'}`}>
                      {typeof ev === 'number' ? `${ev.toFixed(1)}%` : '-'}
                    </td>
                    <td className="match-col">
                      <div className="teams">
                        <div className="team home">
                          <span className="team-name">{row.game.home_team}</span>
                        </div>
                        <div className="team-divider">vs</div>
                        <div className="team away">
                          <span className="team-name">{row.game.away_team}</span>
                        </div>
                      </div>
                      <div className="game-meta">
                        {row.game.commence_time && (
                          <span className="game-time">
                            {new Date(row.game.commence_time).toLocaleString()}
                          </span>
                        )}
                        {row.game.sport_key && (
                          <span className="sport-badge">
                            {getSportLeague(row.game.sport_key, row.game.sport_title)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="team-col">
                      {row.out.name || row.out.point ? (
                        <>
                          <div className="player-name">{row.out.name || row.out.text}</div>
                          {row.out.point && (
                            <div className="player-points">
                              {row.out.point > 0 ? `+${row.out.point}` : row.out.point}
                            </div>
                          )}
                        </>
                      ) : '-'}
                    </td>
                    <td className="line-col">
                      {formatLine(row.out.point, row.market_key, mode)}
                    </td>
                    <td className="book-col">
                      {row.out.bookmaker?.title || 'N/A'}
                    </td>
                    <td className={`odds-col ${oddsChange ? `flash-${oddsChange}` : ''}`}>
                      {formatOdds(Number(row.out.price || row.out.odds))}
                    </td>
                    <td className="devig-col">
                      {fair ? `${(fair * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="action-col">
                      <button 
                        className="add-pick-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAddBet) {
                            addToBetSlip(row, row.out, e.target);
                          }
                        }}
                        title="Add to Bet Slip"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                  
                  {expandedRows[row.key] && (
                    <tr className="expanded-details">
                      <td colSpan="8">
                        <div className="expanded-content">
                          <div className="all-odds">
                            <h4>All Odds for {row.out.name || row.out.text || 'Selection'}</h4>
                            <div className="odds-grid">
                              {row.all_books.map((book, index) => (
                                <div key={index} className="odds-row">
                                  <span className="book">{book.bookmaker?.title}</span>
                                  <span className="odds">{formatOdds(book.price || book.odds)}</span>
                                  <button 
                                    className="add-odds-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToBetSlip(row, book, e.target);
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="market-info">
                            <div className="info-row">
                              <span className="label">Market:</span>
                              <span className="value">{formatMarket(row.market_key)}</span>
                            </div>
                            <div className="info-row">
                              <span className="label">Fair Odds:</span>
                              <span className="value">
                                {fair ? formatOdds(decimalToAmerican(1 / fair)) : 'N/A'}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="label">EV:</span>
                              <span className={`value ${ev > 0 ? 'positive' : 'negative'}`}>
                                {typeof ev === 'number' ? `${ev.toFixed(1)}%` : 'N/A'}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="label">Implied Probability:</span>
                              <span className="value">
                                {fair ? `${(fair * 100).toFixed(1)}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
