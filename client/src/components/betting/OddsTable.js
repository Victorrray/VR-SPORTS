import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useMe } from '../../hooks/useMe';
import EnhancedLoadingSpinner from '../common/EnhancedLoadingSpinner';
import { TrendingUp, TrendingDown } from "lucide-react";
import OddsTableSkeleton, { OddsTableSkeletonMobile } from "./OddsTableSkeleton";
import "./OddsTable.css";
import "./OddsTable.desktop.css";
import "./OddsTable.soccer.css";

// Import team logo utilities
import { resolveTeamLogo } from "../../utils/logoResolver";
import { getTeamLogos } from "../../constants/teamLogos";

// Import player prop utilities
import { extractPlayerName, formatMarketName, getYesNoExplanation } from "../../utils/playerPropUtils";

// Use the imported utility function
const getYesBetExplanation = getYesNoExplanation;

// Sportsbook logos removed for compliance, but team logos are available
const logos = {};

// Centralized priority list for the mini-table comparison view
const MINI_TABLE_PRIORITY_BOOKS = [
  'fanduel',
  'draftkings',
  'pinnacle',
  'betmgm',
  'betonline',
  'bovada'
];

const normalizeBookKey = (bookKeyOrName = '') => String(bookKeyOrName).toLowerCase();

const isMiniTablePriorityBook = (bookKeyOrName = '') => {
  const key = normalizeBookKey(bookKeyOrName);
  return MINI_TABLE_PRIORITY_BOOKS.some(priority => key.includes(priority));
};

const getMiniTablePriorityIndex = (bookKeyOrName = '') => {
  const key = normalizeBookKey(bookKeyOrName);
  return MINI_TABLE_PRIORITY_BOOKS.findIndex(priority => key.includes(priority));
};

// Helper function to get bookmaker priority for sorting
function getBookPriority(bookmakerKey) {
  const key = normalizeBookKey(bookmakerKey);

  const miniIndex = getMiniTablePriorityIndex(key);
  if (miniIndex !== -1) return miniIndex + 1;

  const priorityMap = {
    'caesars': 7,
    'williamhill_us': 8,
    'pointsbet': 9,
    'pointsbetus': 9,
    'barstool': 10,
    'espnbet': 10,
    'betrivers': 11,
    'superbook': 12,
    'wynn': 13,
    'wynnbet': 13,
    'unibet': 14,
    'unibet_us': 14,
    'twinspires': 15,
    'lowvig': 16,
    'novig': 17,
    'betonline': 18,
    'betonlineag': 18,
    'mybookieag': 19,
    'betfair': 20,
    'betfred_us': 21,
    'bet365': 22,
    'betway': 23,
    'circasports': 24,
    'foxbet': 25,
    'sugarhouse': 26,
    'draftkings_atlantic': 27,
    'betmgm_atlantic': 28,
    'fanduel_atlantic': 29,
    'pinnacle': 30,
    'mybookie': 31,
    'gtbets': 32,
    'intertops': 33,
    'youwager': 34,
    'betus': 35,
    'sportsbetting': 36,
    'bovada_lv': 37,
    'betnow': 38,
    'bookmaker': 39,
    '5dimes': 40,
    'heritage': 41,
    'rebet': 42,
    'fliff': 43
  };

  return priorityMap[key] || 99;
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

/* ---------- Helpers (unchanged core math) ---------- */
function calculateEV(odds, fairLine, bookmakerKey = null) {
  if (!odds || !fairLine) return null;
  const toDec = o => (o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1);
  
  // Special EV calculation for DFS apps only
  const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'dabble_au'].includes(bookmakerKey);
  
  if (isDFSApp) {
    // DFS apps use fixed odds for player props
    // All DFS apps now use -119
    const dfsOdds = -119;
    const dfsDec = toDec(dfsOdds);
    const fairDec = toDec(fairLine);
    
    // Calculate EV using the fixed DFS odds
    // Higher EV means better value compared to market consensus
    return ((dfsDec / fairDec) - 1) * 100;
  }
  
  // Standard EV calculation for traditional sportsbooks
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
  const n = a.length; if (!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

// Book weighting for more accurate fair line calculation
// Sharp books and low-vig books get higher weights
const BOOK_WEIGHTS = {
  // Tier 1: Sharp books (highest weight)
  'pinnacle': 3.0,
  'circa': 2.5,
  'circasports': 2.5,
  
  // Tier 2: Low-vig books
  'novig': 2.5,
  'lowvig': 2.0,
  'prophet_exchange': 2.5,
  'rebet': 1.25,
  
  // Tier 3: Major sportsbooks
  'draftkings': 1.5,
  'fanduel': 1.5,
  'betmgm': 1.5,
  'caesars': 1.5,
  'pointsbet': 1.5,
  'betrivers': 1.5,
  
  // Tier 4: DFS apps (standard weight)
  'prizepicks': 1.0,
  'underdog': 1.0,
  'pick6': 1.0,
  'prophetx': 1.0,
  
  // Tier 5: Other books (lower weight)
  'default': 1.0
};

function getBookWeight(bookKey) {
  if (!bookKey) return BOOK_WEIGHTS.default;
  const key = bookKey.toLowerCase();
  return BOOK_WEIGHTS[key] || BOOK_WEIGHTS.default;
}

function weightedMedian(values, weights) {
  if (!values || !values.length) return null;
  if (!weights || weights.length !== values.length) {
    return median(values); // Fallback to regular median
  }
  
  // Sort by value, keeping weights aligned
  const sorted = values.map((val, i) => ({ val, weight: weights[i] }))
    .sort((a, b) => a.val - b.val);
  
  // Calculate cumulative weights
  const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);
  const halfWeight = totalWeight / 2;
  
  let cumWeight = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumWeight += sorted[i].weight;
    if (cumWeight >= halfWeight) {
      // If exactly at half, average with next value
      if (cumWeight === halfWeight && i < sorted.length - 1) {
        return (sorted[i].val + sorted[i + 1].val) / 2;
      }
      return sorted[i].val;
    }
  }
  
  return sorted[sorted.length - 1].val;
}
function formatLine(line, marketKey, mode="game") {
  if (line == null || line === "") return "";
  const n = Number(line); if (isNaN(n)) return line;
  if (mode === "props") return n;
  if (String(marketKey).toLowerCase() === "totals") return n;
  return n > 0 ? `+${n}` : `${n}`;
}
function formatMarket(key="") {
  const k = String(key).toLowerCase();
  if (k === "h2h") return "MONEYLINE";
  if (k.includes("spread")) return "SPREAD";
  if (k.includes("total")) return "TOTAL";
  
  // Use our utility function for player props
  if (k.startsWith('player_') || k.startsWith('batter_') || k.startsWith('pitcher_')) {
    return formatMarketName(key);
  }
  
  return key.toUpperCase();
}
function marketTypeLabel(key="") {
  const k = String(key).toLowerCase();
  if (k === "h2h" || k.endsWith("moneyline")) return "ML";
  if (k.includes("spread")) return "Spread";
  if (k.includes("total")) return "Totals";
  return formatMarket(key);
}
function cleanBookTitle(t){ return t ? String(t).replace(/\.?ag\b/gi,"").trim() : ""; }

const TEAM_NICKNAMES = { americanfootball_ncaaf: { 'St. Francis (PA) Red Flash': 'Red Flash' } };

// Team location abbreviations for duplicate names
const TEAM_LOCATIONS = {
  'Aggies': { 'Texas A&M': 'TAM', 'Utah State': 'USU', 'New Mexico State': 'NMSU' },
  'Badgers': { 'Wisconsin': 'WIS' },
  'Blue Raiders': { 'Middle Tennessee': 'MTSU' },
  'Panthers': { 'Pittsburgh': 'PITT', 'Central Michigan': 'CMU' },
  'Eagles': { 'Boston College': 'BC', 'Eastern Michigan': 'EMU' },
  'Tigers': { 'LSU': 'LSU', 'Auburn': 'AUB', 'Missouri': 'MIZ', 'Memphis': 'MEM' },
  'Bulldogs': { 'Georgia': 'UGA', 'Mississippi State': 'MSU', 'Fresno State': 'FRES' }
};

function shortTeam(name="", sportKey="") {
  const n = String(name).trim(); if (!n) return "";
  const mapped = TEAM_NICKNAMES[sportKey]?.[n]; if (mapped) return mapped;
  const paren = n.lastIndexOf(')'); if (paren !== -1 && paren + 1 < n.length) {
    const after = n.slice(paren + 1).trim(); if (after) return after;
  }
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length-1], prev = parts[parts.length-2];
    const ADJ = new Set(['Red','Blue','Green','Black','White','Golden','Fighting','Crimson','Scarlet','Orange','Mean','Yellow','Purple','Silver','Gold','Cardinal','Tar',"Ragin'"]);
    if (ADJ.has(prev)) return `${prev} ${last}`;
  }
  
  const nickname = parts[parts.length-1];
  
  // Check if this nickname needs location disambiguation
  if (TEAM_LOCATIONS[nickname]) {
    // Find the school/location in the full name
    const fullName = parts.slice(0, -1).join(' ');
    for (const [school, abbrev] of Object.entries(TEAM_LOCATIONS[nickname])) {
      if (fullName.includes(school)) {
        return `${nickname} (${abbrev})`;
      }
    }
  }
  
  return nickname;
}

const normalizeTeamKey = (name = '') => String(name).toLowerCase().replace(/[^a-z0-9]/gi, '').trim();

const getTeamLogoForGame = (game = {}, teamName = '') => {
  const key = normalizeTeamKey(teamName);
  if (!key) return '';
  
  const homeKey = normalizeTeamKey(game?.home_team);
  const awayKey = normalizeTeamKey(game?.away_team);
  
  let logoUrl = '';
  let isHomeTeam = false;
  
  // Check if this is home or away team and get API logo
  if (key === homeKey) {
    logoUrl = game?.home_logo || '';
    isHomeTeam = true;
  } else if (key === awayKey) {
    logoUrl = game?.away_logo || '';
    isHomeTeam = false;
  }
  
  // Debug logging to see what logos we're getting from API
  if (process.env.NODE_ENV === 'development') {
    console.log(`🏈 Logo check for ${teamName}:`, {
      game_id: game?.id,
      sport: game?.sport_key,
      home_team: game?.home_team,
      away_team: game?.away_team,
      home_logo: game?.home_logo,
      away_logo: game?.away_logo,
      resolved_logo: logoUrl,
      isHomeTeam
    });
  }
  
  // If API didn't provide logo, try logo resolution utilities
  if (!logoUrl) {
    // Extract league from sport_key (e.g., "americanfootball_nfl" -> "nfl")
    const league = game?.sport_key?.split('_').pop() || '';
    
    // Try logo resolver first
    logoUrl = resolveTeamLogo({
      league: league,
      teamName: teamName,
      apiLogo: null
    });
    
    // If that fails, try the team logos constants
    if (!logoUrl || logoUrl.includes('unknown')) {
      const teamLogos = getTeamLogos(league, game?.home_team, game?.away_team);
      logoUrl = isHomeTeam ? teamLogos.home : teamLogos.away;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏈 Fallback logo for ${teamName}:`, {
        league,
        fallback_logo: logoUrl
      });
    }
  }
  
  return logoUrl || '';
};
function formatKickoffNice(commence){
  try{
    const d = new Date(commence);
    const gameStart = d.getTime();
    const now = Date.now();
    const gameEnd = gameStart + (3.5 * 60 * 60 * 1000); // Assume 3.5 hours max game duration
    const isLive = now >= gameStart && now <= gameEnd;
    
    if (isLive) {
      return "🔴 LIVE";
    }
    
    const date = d.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });
    const time = d.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
    return `${date} at ${time}`;
  }catch{return String(commence);}
}
function getSportLeague(sportKey='', sportTitle=''){
  const key = String(sportKey).toLowerCase();
  const map = {
    americanfootball_nfl:{sport:'Football',league:'NFL'},
    americanfootball_ncaaf:{sport:'Football',league:'NCAAF'},
    basketball_nba:{sport:'Basketball',league:'NBA'},
    basketball_ncaab:{sport:'Basketball',league:'NCAAB'},
    baseball_mlb:{sport:'Baseball',league:'MLB'},
    icehockey_nhl:{sport:'Hockey',league:'NHL'},
    soccer_epl:{sport:'Soccer',league:'EPL'},
    soccer_uefa_champs_league:{sport:'Soccer',league:'UCL'},
    tennis_atp:{sport:'Tennis',league:'ATP'},
    tennis_wta:{sport:'Tennis',league:'WTA'},
  };
  if (map[key]) return map[key];
  const part = key.split('_')[0];
  const sportGuess = {americanfootball:'Football',basketball:'Basketball',baseball:'Baseball',icehockey:'Hockey',soccer:'Soccer',tennis:'Tennis'}[part] || (sportTitle || 'Sport');
  const league = (sportTitle || key.split('_')[1] || '').toUpperCase() || 'LEAGUE';
  return { sport: sportGuess, league };
}

/* ---------- De-vig helpers ---------- */
function consensusDevigProb(row) {
  try {
    const marketKey = row?.mkt?.key;
    const pointStr = String(row?.out?.point ?? "");
    const sideName = row?.out?.name;
    const game = row?.game;
    if (!game || !marketKey) return null;

    // Skip devig calculation for player props - they don't have paired outcomes
    if (marketKey && marketKey.includes('player_')) return null;

    const isH2H = marketKey === "h2h";
    const isTotals = marketKey === "totals";
    const isSpreads = marketKey === "spreads";

    const pairs = [];
    (game.bookmakers || []).forEach(bk => {
      const mkt = (bk.markets || []).find(m => m.key === marketKey);
      if (!mkt || !mkt.outcomes) return;
      if (isH2H) {
        const home = mkt.outcomes.find(o => o && o.name === game.home_team);
        const away = mkt.outcomes.find(o => o && o.name === game.away_team);
        if (!home || !away) return;
        const pHome = americanToProb(home.price ?? home.odds);
        const pAway = americanToProb(away.price ?? away.odds);
        if (!(pHome > 0 && pHome < 1 && pAway > 0 && pAway < 1)) return;
        const denom = pHome + pAway; if (denom <= 0) return;
        const pSel = sideName === game.home_team ? (pHome / denom) : (pAway / denom);
        if (pSel > 0 && pSel < 1) pairs.push(pSel);
      } else if (isTotals || isSpreads) {
        const over = mkt.outcomes.find(o => o && o.name === "Over" && String(o.point ?? "") === pointStr);
        const under = mkt.outcomes.find(o => o && o.name === "Under" && String(o.point ?? "") === pointStr);
        if (!over || !under) return;
        const pOver = americanToProb(over.price ?? over.odds);
        const pUnder = americanToProb(under.price ?? under.odds);
        if (!(pOver > 0 && pOver < 1 && pUnder > 0 && pUnder < 1)) return;
        const denom = pOver + pUnder; if (denom <= 0) return;
        const pSel = sideName === "Under" ? (pUnder / denom) : (pOver / denom);
        if (pSel > 0 && pSel < 1) pairs.push(pSel);
      }
    });
    if (!pairs.length) return null;
    return median(pairs);
  } catch { return null; }
}
function devigPairCount(row) {
  try {
    const marketKey = row?.mkt?.key;
    const pointStr = String(row?.out?.point ?? "");
    const game = row?.game;
    if (!game || !marketKey) return 0;
    
    // Skip devig calculation for player props - they don't have paired outcomes
    if (marketKey && marketKey.includes('player_')) return 0;
    
    const isH2H = marketKey === "h2h";
    const isTotals = marketKey === "totals";
    const isSpreads = marketKey === "spreads";
    let count = 0;
    (game.bookmakers || []).forEach(bk => {
      const mkt = (bk.markets || []).find(m => m.key === marketKey);
      if (!mkt || !mkt.outcomes) return;
      if (isH2H) {
        const home = mkt.outcomes.find(o => o && o.name === game.home_team);
        const away = mkt.outcomes.find(o => o && o.name === game.away_team);
        const pHome = americanToProb(home?.price ?? home?.odds);
        const pAway = americanToProb(away?.price ?? away?.odds);
        if (pHome > 0 && pHome < 1 && pAway > 0 && pAway < 1) count += 1;
      } else if (isTotals || isSpreads) {
        const over = mkt.outcomes.find(o => o && o.name === "Over" && String(o.point ?? "") === pointStr);
        const under = mkt.outcomes.find(o => o && o.name === "Under" && String(o.point ?? "") === pointStr);
        const pOver = americanToProb(over?.price ?? over?.odds);
        const pUnder = americanToProb(under?.price ?? under?.odds);
        if (pOver > 0 && pOver < 1 && pUnder > 0 && pUnder < 1) count += 1;
      }
    });
    return count;
  } catch { return 0; }
}
function uniqueBookCount(row) {
  try {
    const set = new Set();
    (row.allBooks || []).forEach(b => {
      const key = String(b?.bookmaker?.key || b?.book || '').toLowerCase();
      if (key) set.add(key);
    });
    return set.size;
  } catch { return 0; }
}

export default function OddsTable({
  games,
  mode = "game",
  pageSize = 15,
  loading = false,
  error = null,
  oddsFormat: oddsFormatProp = null,
  bookFilter = [],
  initialSort = { key: "ev", dir: "desc" },
  marketFilter = [],
  evOnlyPositive = false,
  evMin = null,
  allCaps = false,
  onAddBet = null,
  betSlipCount = 0,
  onOpenBetSlip = null,
  searchQuery = "", // Add search query prop
}) {
  
  // Get user plan information for free trial restrictions
  const { me } = useMe();
  
  // State for minimum loading time
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const minLoadingTimeRef = useRef(null);
  
  // Bet Slip functionality
  const addToBetSlip = (row, book, buttonElement) => {
    if (!onAddBet) return;
    
    const odds = row.out.price || row.out.odds;
    const americanOdds = typeof odds === 'string' ? parseInt(odds) : odds;
    
    // Use the same EV calculation as the odds table display
    const edge = getEV(row);
    
    const bet = {
      id: `${row.key}-${book?.bookmaker?.key || book?.book}-${Date.now()}`,
      matchup: `${row.game.away_team} @ ${row.game.home_team}`,
      selection: `${row.out.name}${row.out.point ? ` ${row.out.point}` : ''}`,
      market: formatMarket(row.mkt?.key || ''),
      americanOdds,
      bookmaker: book?.bookmaker?.title || book?.title || 'Unknown',
      sport: getSportLeague(row.game.sport_key).sport,
      league: getSportLeague(row.game.sport_key).league,
      edge: edge,
      gameTime: row.game.commence_time,
    };
    
    onAddBet(bet);
    
    // Open bet slip automatically
    if (onOpenBetSlip) {
      onOpenBetSlip();
    }
    
    // Show feedback
    if (buttonElement) {
      const originalText = buttonElement.textContent;
      const originalBg = buttonElement.style.background;
      buttonElement.textContent = 'Added!';
      buttonElement.style.background = 'var(--success)';
      buttonElement.style.fontSize = '10px';
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.style.background = originalBg;
        buttonElement.style.fontSize = '';
      }, 1500);
    }
  };

  // Legacy My Picks functionality (keeping for backward compatibility)
  const addToPicks = (row, book, isHome, buttonElement) => {
    const existingPicks = JSON.parse(localStorage.getItem('oss_my_picks_v1') || '[]');
    
    // Check if this exact pick already exists
    const isDuplicate = existingPicks.some(p => 
      p.game === `${row.game.away_team} @ ${row.game.home_team}` &&
      p.market === formatMarket(row.mkt?.key || '') &&
      p.selection.includes(row.out.name)
    );
    
    if (isDuplicate) {
      // Show already added feedback
      if (buttonElement) {
        const originalText = buttonElement.textContent;
        const originalBg = buttonElement.style.background;
        buttonElement.textContent = 'Already Added';
        buttonElement.style.background = 'var(--warning)';
        buttonElement.style.fontSize = '10px';
        setTimeout(() => {
          buttonElement.textContent = originalText;
          buttonElement.style.background = originalBg;
          buttonElement.style.fontSize = '';
        }, 2000);
      }
      return;
    }
    
    const pick = {
      id: `${row.key}-${book?.bookmaker?.key || book?.book}-${Date.now()}`,
      game: `${row.game.away_team} @ ${row.game.home_team}`,
      league: getSportLeague(row.game.sport_key).league,
      market: formatMarket(row.mkt?.key || ''),
      selection: `${row.out.name} ${row.out.point ? row.out.point : ''} ${row.out.price || row.out.odds}`,
      odds: row.out.price || row.out.odds,
      note: `${cleanBookTitle(book?.book || book?.bookmaker?.title)} - ${getSportLeague(row.game.sport_key).sport}`,
      dateAdded: new Date().toISOString(),
      status: 'pending'
    };
    
    const updatedPicks = [...existingPicks, pick];
    localStorage.setItem('oss_my_picks_v1', JSON.stringify(updatedPicks));
    
    // Show success feedback with enhanced confirmation
    if (buttonElement) {
      const originalText = buttonElement.textContent;
      const originalBg = buttonElement.style.background;
      buttonElement.textContent = '✓ Added';
      buttonElement.style.background = 'var(--success)';
      buttonElement.style.color = 'white';
      buttonElement.style.fontSize = '10px';
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.style.background = originalBg;
        buttonElement.style.color = '';
        buttonElement.style.fontSize = '';
      }, 2000);
    }
  };
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(1);
  // Always default to sorting by highest EV (desc) unless explicitly overridden
  const [sort, setSort] = useState(initialSort || { key: "ev", dir: "desc" });
  
  // Log sorting information for debugging
  useEffect(() => {
    console.log(`🎯 OddsTable sorting by: ${sort.key} (${sort.dir === 'desc' ? 'highest to lowest' : 'lowest to highest'})`);
  }, [sort]);

  // Reset expanded rows when games change to ensure clean state
  useEffect(() => {
    setExpandedRows({});
  }, [games]);
  const [oddsFormatState, setOddsFormat] = useState(() => {
    if (typeof window === 'undefined') return 'american';
    return localStorage.getItem('oddsFormat') || 'american';
  });

  useEffect(() => {
    if (oddsFormatProp) return;
    if (typeof window !== 'undefined') localStorage.setItem('oddsFormat', oddsFormatState);
  }, [oddsFormatProp, oddsFormatState]);

  const currentOddsFormat = oddsFormatProp || oddsFormatState;
  const toDecimal = (o) => {
    const n = Number(o);
    if (!Number.isFinite(n) || n === 0) return null;
    return n > 0 ? (n / 100) + 1 : (100 / Math.abs(n)) + 1;
  };
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const americanToFractional = (o) => {
    const n = Number(o);
    if (!Number.isFinite(n) || n === 0) return null;
    const num = n > 0 ? Math.round(Math.abs(n)) : 100;
    const den = n > 0 ? 100 : Math.round(Math.abs(n));
    const g = gcd(num, den) || 1;
    return `${num / g}/${den / g}`;
  };

  const toggleRow = key => setExpandedRows(exp => ({ ...exp, [key]: !exp[key] }));

  // Add debug logging for input data
  useEffect(() => {
    if (games && games.length > 0) {
      // Log sports and bookmakers in the data
      const sportCounts = {};
      const bookmakerCounts = {};
      const marketCounts = {};
      
      games.forEach(game => {
        // Count sports
        const sport = game.sport_key || 'unknown';
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
        
        // Count bookmakers
        if (game.bookmakers && Array.isArray(game.bookmakers)) {
          game.bookmakers.forEach(bk => {
            const key = bk.key || 'unknown';
            bookmakerCounts[key] = (bookmakerCounts[key] || 0) + 1;
            
            // Count markets
            if (bk.markets && Array.isArray(bk.markets)) {
              bk.markets.forEach(mkt => {
                const mktKey = mkt.key || 'unknown';
                marketCounts[mktKey] = (marketCounts[mktKey] || 0) + 1;
              });
            }
          });
        }
      });
      
      console.log(`🎯 OddsTable received ${games.length} games with:`);
      console.log('- Sports:', sportCounts);
      console.log('- Bookmakers:', bookmakerCounts);
      console.log('- Markets:', marketCounts);
      console.log('- BookFilter:', bookFilter && bookFilter.length ? bookFilter : 'ALL BOOKS');
      console.log('- MarketFilter:', marketFilter && marketFilter.length ? marketFilter : 'ALL MARKETS');
    }
  }, [games, bookFilter, marketFilter]);

  /* ---------- Build rows (game mode) ---------- */
  const allRows = useMemo(() => {
    // Debug: Check if we have any DFS app data
    const dfsApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au'];
    let dfsAppCount = 0;
    let dfsMarketCount = 0;
    let dfsOutcomeCount = 0;
    let dfsAppGames = new Set();
    
    console.log('🔍 DFS DEBUG: Starting allRows calculation with bookFilter:', bookFilter);
    console.log('🔍 DFS DEBUG: Mode:', mode);
    console.log('🔍 DFS DEBUG: Market filter:', marketFilter);
    console.log('🔍 DFS DEBUG: Games count:', games?.length || 0);
    
    // Check if games is empty or undefined
    if (!games || games.length === 0) {
      console.log('🔍 DFS DEBUG: No games data available!');
      return [];
    }
    
    if (games && games.length > 0) {
      games.forEach(game => {
        if (game.bookmakers) {
          game.bookmakers.forEach(bookmaker => {
            const bookmakerKeyLower = bookmaker.key?.toLowerCase() || '';
            if (dfsApps.some(app => bookmakerKeyLower.includes(app))) {
              dfsAppCount++;
              dfsAppGames.add(game.id);
              
              console.log(`🔍 DFS DEBUG: Found DFS app ${bookmaker.key} for game ${game.home_team} vs ${game.away_team}`);
              
              // Count markets and outcomes
              if (bookmaker.markets && bookmaker.markets.length > 0) {
                console.log(`🔍 DFS DEBUG: ${bookmaker.key} has ${bookmaker.markets.length} markets`);
                
                bookmaker.markets.forEach(market => {
                  dfsMarketCount++;
                  console.log(`🔍 DFS DEBUG: Market ${market.key} has ${market.outcomes?.length || 0} outcomes`);
                  
                  if (market.outcomes && market.outcomes.length > 0) {
                    dfsOutcomeCount += market.outcomes.length;
                    console.log(`🔍 DFS DEBUG: Sample outcome:`, market.outcomes[0]);
                  }
                });
              }
              
              console.log(`🎯 Found DFS app ${bookmaker.key} for game ${game.home_team} vs ${game.away_team} with ${bookmaker.markets?.length || 0} markets`);
              
              // Log first few markets to see what's available
              if (bookmaker.markets && bookmaker.markets.length > 0) {
                console.log(`🎯 Sample markets for ${bookmaker.key}:`, 
                  bookmaker.markets.slice(0, 3).map(m => ({ 
                    key: m.key, 
                    outcomes: m.outcomes?.length || 0,
                    sample: m.outcomes?.[0]?.name
                  }))
                );
              }
            }
          });
        }
      });
    }
    
    console.log(`🎯 DFS app summary: ${dfsAppCount} bookmakers across ${dfsAppGames.size} games with ${dfsMarketCount} markets and ${dfsOutcomeCount} outcomes`);

    try {
      if (mode === "props") {
        const propsRows = [];
        const propGroups = new Map(); // Group props by player+market+point
        
        // First pass: collect all props and group them
        console.log('Processing games for props mode. Total games:', games?.length);
        console.log('🔍 PROPS DEBUG: bookFilter =', bookFilter);
        console.log('🔍 PROPS DEBUG: marketFilter =', marketFilter);
        
        // Check if we're filtering for DFS apps only
        const propsDfsApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au'];
        const propsFilteringForDFSOnly = bookFilter && bookFilter.length > 0 && bookFilter.every(book => propsDfsApps.includes(book));
        console.log('🔍 PROPS DEBUG: propsFilteringForDFSOnly =', propsFilteringForDFSOnly);
      
      // Log what markets we're looking for
      console.log('Looking for player prop markets containing: player_, batter_, pitcher_');
      console.log('Looking for DFS sites:', ['prizepicks', 'underdog', 'pick6', 'dabble_au']);
      
      // Special handling for DFS apps in props mode
      if (propsFilteringForDFSOnly) {
        console.log('🔍 PROPS DEBUG: Special handling for DFS-only filtering in props mode');
        
        // Force create some player prop rows for DFS apps if none are found
        let hasDFSPlayerProps = false;
        
        // Check if we have any DFS apps with player props
        games?.forEach(game => {
          if (game.bookmakers) {
            game.bookmakers.forEach(bookmaker => {
              if (propsDfsApps.some(app => (bookmaker.key || '').toLowerCase().includes(app))) {
                console.log(`🔍 PROPS DEBUG: Found DFS app ${bookmaker.key} for game ${game.home_team} vs ${game.away_team}`);
                if (bookmaker.markets && bookmaker.markets.some(m => m._isDFSProcessed)) {
                  hasDFSPlayerProps = true;
                  console.log(`🔍 PROPS DEBUG: Found processed DFS markets for ${bookmaker.key}`);
                }
              }
            });
          }
        });
        
        console.log('🔍 PROPS DEBUG: hasDFSPlayerProps =', hasDFSPlayerProps);
        
        // No synthetic data creation - only use real API data
      }
      
      // Debug: Log raw games data to see what's actually being received
      const allBookmakers = new Set();
      const dfsBookmakers = new Set();
      const tyreekHillBookmakers = new Set();
      
      games?.forEach((game, idx) => {
        console.log(`Game ${idx + 1} (${game.id}):`, {
          sport: game.sport_key,
          teams: `${game.away_team} @ ${game.home_team}`,
          bookmakers: game.bookmakers?.length || 0,
          bookmakerKeys: game.bookmakers?.map(b => b.key) || [],
          totalMarkets: game.bookmakers?.reduce((sum, b) => sum + (b.markets?.length || 0), 0) || 0,
          marketKeys: game.bookmakers?.flatMap(b => b.markets?.map(m => m.key) || []) || []
        });
        
        // Collect all bookmakers
        if (game.bookmakers) {
          console.log(`📊 GAME: ${game.home_team} vs ${game.away_team} has ${game.bookmakers.length} bookmakers:`, 
            game.bookmakers.map(b => b.key));
          
          game.bookmakers.forEach(bookmaker => {
            allBookmakers.add(bookmaker.key);
            if (['prizepicks', 'underdog', 'draftkings_pick6', 'pick6', 'dabble_au'].includes(bookmaker.key?.toLowerCase())) {
              dfsBookmakers.add(bookmaker.key);
              console.log(`🎯 DFS BOOKMAKER FOUND: ${bookmaker.key}`);
            } else {
              console.log(`📈 TRADITIONAL BOOKMAKER FOUND: ${bookmaker.key} with ${bookmaker.markets?.length || 0} markets`);
            }
            
            // Check for Tyreek Hill specifically
            if (bookmaker.markets) {
              bookmaker.markets.forEach(market => {
                if (market.outcomes) {
                  market.outcomes.forEach(outcome => {
                    if (outcome.name && outcome.name.toLowerCase().includes('tyreek') && outcome.name.toLowerCase().includes('hill')) {
                      tyreekHillBookmakers.add(bookmaker.key);
                    }
                  });
                }
              });
            }
          });
        }
      });
      
      console.log(`🎯 ALL BOOKMAKERS AVAILABLE:`, Array.from(allBookmakers));
      console.log(`🎯 DFS BOOKMAKERS AVAILABLE:`, Array.from(dfsBookmakers));
      console.log(`🎯 TYREEK HILL BOOKMAKERS:`, Array.from(tyreekHillBookmakers));
      
      
      games?.forEach(game => {
        if (!game.bookmakers) {
          console.log('Game has no bookmakers:', game.id);
          return;
        }
        
        console.log(`Game ${game.id} (${game.home_team} vs ${game.away_team}) has ${game.bookmakers.length} bookmakers`);
        game.bookmakers.forEach(bookmaker => {
          if (!bookmaker.markets) {
            console.log(`Bookmaker ${bookmaker.key} has no markets`);
            return;
          }
          
          console.log(`Bookmaker ${bookmaker.key} has ${bookmaker.markets.length} markets:`, bookmaker.markets.map(m => m.key));
          bookmaker.markets.forEach(market => {
            // Filter markets based on mode
            const isDFSSite = ['prizepicks', 'underdog', 'pick6', 'dabble_au'].includes(bookmaker.key?.toLowerCase());
            const isPlayerPropMarket = market.key?.includes('player_') || market.key?.includes('batter_') || market.key?.includes('pitcher_');
            const isRegularMarket = ['h2h', 'spreads', 'totals'].includes(market.key);
            
            // In props mode: only show player prop markets or DFS sites, and respect marketFilter
            // In regular mode: only show regular markets (h2h, spreads, totals)
            if (mode === 'props') {
              if (!isDFSSite && !isPlayerPropMarket) {
                console.log(`🚫 SKIPPING: ${bookmaker.key} market ${market.key} - not DFS (${isDFSSite}) and not player prop (${isPlayerPropMarket})`);
                return;
              }
              
              // Debug: Log what we're processing
              if (!isDFSSite && isPlayerPropMarket) {
                console.log(`✅ PROCESSING TRADITIONAL: ${bookmaker.key} market ${market.key} - has player props`);
              } else if (isDFSSite) {
                console.log(`✅ PROCESSING DFS: ${bookmaker.key} market ${market.key}`);
              }
              
              // For DFS sites, ensure we're using fixed odds
              if (isDFSSite) {
                const dfsOdds = -119;
                console.log(`Processing DFS site ${bookmaker.key} with fixed ${dfsOdds} odds for market ${market.key}`);
                // Force fixed odds for all DFS app outcomes
                if (market.outcomes && market.outcomes.length > 0) {
                  console.log(`DFS site ${bookmaker.key} has ${market.outcomes.length} outcomes for market ${market.key}`);
                  
                  // Only process real DFS data - no synthetic outcomes
                  
                  market.outcomes.forEach(outcome => {
                    console.log(`Setting ${dfsOdds} odds for ${outcome.name} in ${market.key}`);
                    outcome.price = dfsOdds;
                    
                    // Keep original name for clean display
                    outcome._originalName = outcome.name;
                    // Don't modify the name - keep it clean (e.g., just "Over" instead of "Over (DFS)")
                  });
                } else {
                  console.log(`WARNING: DFS site ${bookmaker.key} has no outcomes for market ${market.key}`);
                }
              }
              
              // Apply marketFilter for player props
              if (marketFilter && marketFilter.length > 0 && isPlayerPropMarket) {
                // Special debug for DFS apps
                if (isDFSSite) {
                  console.log(`🔍 DFS MARKET FILTER CHECK: market ${market.key} for ${bookmaker.key}`);
                  console.log(`🔍 DFS MARKET FILTER CHECK: marketFilter =`, marketFilter);
                  console.log(`🔍 DFS MARKET FILTER CHECK: includes? =`, marketFilter.includes(market.key));
                  
                  // ALWAYS show DFS apps regardless of market filter
                  console.log(`🔍 DFS MARKET FILTER BYPASS: Allowing DFS app ${bookmaker.key} regardless of market filter`);
                  // Continue processing this market for DFS apps
                } else if (!marketFilter.includes(market.key)) {
                  // Only apply market filter to non-DFS apps
                  console.log(`Skipping market ${market.key} for ${bookmaker.key} - not in marketFilter:`, marketFilter);
                  return;
                }
              }
            } else {
              if (!isRegularMarket) {
                console.log(`Skipping market ${market.key} for ${bookmaker.key} - not regular market (game mode)`);
                return;
              }
            }
            
            console.log(`Processing market ${market.key} for bookmaker ${bookmaker.key} with ${market.outcomes?.length || 0} outcomes`);
            
            if (!market.outcomes || !Array.isArray(market.outcomes)) {
              console.log(`Market ${market.key} has no outcomes`);
              return;
            }
            
            // Handle TheOddsAPI player props format (Over/Under with description)
            if (isPlayerPropMarket && market.outcomes.some(o => o.name === 'Over' || o.name === 'Under')) {
              console.log(`Processing TheOddsAPI format for ${market.key}`);
              console.log(`🔍 DFS DEBUG: Processing outcomes for ${bookmaker.key} - ${market.key}:`, market.outcomes);
              
              // Group Over/Under pairs by player (description field)
              const playerGroups = {};
              market.outcomes.forEach(outcome => {
                // Use the utility function to extract player name
                const playerName = extractPlayerName(outcome, market.key, game.sport_key);
                if (!playerGroups[playerName]) {
                  playerGroups[playerName] = [];
                }
                playerGroups[playerName].push(outcome);
              });
              
              console.log(`🔍 DFS DEBUG: Player groups for ${market.key}:`, playerGroups);
              
              Object.entries(playerGroups).forEach(([playerName, outcomes]) => {
                console.log(`🔍 DFS DEBUG: Processing player ${playerName} with ${outcomes.length} outcomes`);
                if (outcomes.length >= 2) { // Need both Over and Under
                  const overOutcome = outcomes.find(o => o.name === 'Over');
                  const underOutcome = outcomes.find(o => o.name === 'Under');
                  console.log(`🔍 DFS DEBUG: Found over/under outcomes:`, { over: overOutcome, under: underOutcome });
                  
                  if (overOutcome && underOutcome && overOutcome.point !== undefined) {
                    // Create combined Over/Under row - we'll determine which to show after collecting all books
                    const basePropKey = `${game.id}-${market.key}-${playerName}-${overOutcome.point}`;
                    console.log(`Creating combined prop for ${playerName}: ${market.key} ${overOutcome.point}`);
                    
                    if (!propGroups.has(basePropKey)) {
                      propGroups.set(basePropKey, {
                        key: basePropKey,
                        game,
                        mkt: { 
                          key: market.key, 
                          name: formatMarketName(market.key)
                        },
                        playerName: playerName,
                        point: overOutcome.point,
                        sport: game.sport_key,
                        isPlayerProp: true,
                        overBooks: [],
                        underBooks: []
                      });
                    }
                    
                    const propGroup = propGroups.get(basePropKey);
                    
                    // Add both Over and Under books to their respective arrays
                    propGroup.overBooks.push({
                      price: overOutcome.price,
                      odds: overOutcome.price,
                      book: bookmaker.title,
                      bookmaker: bookmaker,
                      market: market,
                      outcome: overOutcome
                    });
                    
                    propGroup.underBooks.push({
                      price: underOutcome.price,
                      odds: underOutcome.price,
                      book: bookmaker.title,
                      bookmaker: bookmaker,
                      market: market,
                      outcome: underOutcome
                    });
                  }
                }
              });
              
              return; // Skip the old processing for this market
            }
            
            // Original processing for other formats
            market.outcomes?.forEach(outcome => {
              // Extract player name for grouping
              const playerName = extractPlayerName(outcome, market.key, game.sport_key);
              
              // Group by player + market type (ignore specific point values and Over/Under)
              // This allows different lines for the same player/market to be grouped together
              const propKey = `${game.id}-${market.key}-${playerName}`;
              
              // Log detailed prop creation for debugging
              if (isDFSSite) {
                console.log(`Creating prop key: ${propKey} for ${bookmaker.key}`);
                console.log(`Player: ${playerName}, Outcome details:`, {
                  name: outcome.name,
                  point: outcome.point,
                  price: outcome.price,
                  marketKey: market.key
                });
              }
              
              if (!propGroups.has(propKey)) {
                propGroups.set(propKey, {
                  key: propKey, // Add unique key for row expansion
                  game,
                  mkt: { 
                    key: market.key, 
                    name: formatMarketName(market.key)
                  },
                  out: { 
                    name: outcome.name, 
                    price: outcome.price, 
                    odds: outcome.price, 
                    point: outcome.point || null 
                  },
                  bk: bookmaker,
                  sport: game.sport_key,
                  isPlayerProp: true,
                  playerName: playerName, // Store player name for display
                  allBooks: [],
                  selectedBooks: [],
                  nonSelectedBooks: [],
                  // Track different lines for the same player/market
                  lines: new Map() // Map of point values to book arrays
                });
              }
              
              // Add this bookmaker's odds to the group
              const bookData = {
                price: outcome.price, 
                odds: outcome.price,
                book: bookmaker.title,
                bookmaker: bookmaker,
                market: market,
                point: outcome.point || null,
                outcomeName: outcome.name, // Over/Under
                line: `${outcome.name} ${outcome.point || ''}`.trim() // "Over 13", "Under 12", etc.
              };
              
              // Track this line in the lines map
              const propGroup = propGroups.get(propKey);
              const lineKey = `${outcome.name} ${outcome.point || ''}`.trim();
              if (!propGroup.lines.has(lineKey)) {
                propGroup.lines.set(lineKey, []);
              }
              propGroup.lines.get(lineKey).push(bookData);
              
              // Add to allBooks (will deduplicate later)
              propGroups.get(propKey).allBooks.push(bookData);
              
              // Also categorize as selected or non-selected for mini table filtering
              const bookKey = bookmaker.key?.toLowerCase() || '';
              const normalizedFilter = bookFilter ? bookFilter.map(f => f.toLowerCase()) : [];
              const isSelected = !bookFilter || !bookFilter.length || normalizedFilter.includes(bookKey);
              
              console.log(`🎯 CATEGORIZING: ${bookKey} - Selected: ${isSelected} (Filter: ${JSON.stringify(normalizedFilter)})`);
              
              // Enhanced debugging for DFS apps
              if (['prizepicks', 'underdog', 'draftkings_pick6', 'pick6'].includes(bookKey)) {
                console.log(`🎯 DFS APP FOUND: ${bookKey} (${bookmaker.title}) - Selected: ${isSelected}`, {
                  bookmakerKey: bookmaker.key,
                  bookmakerTitle: bookmaker.title,
                  playerName: playerName,
                  outcomeName: outcome.name,
                  point: outcome.point,
                  price: outcome.price
                });
              }
              
              if (!propGroups.get(propKey).selectedBooks) propGroups.get(propKey).selectedBooks = [];
              if (!propGroups.get(propKey).nonSelectedBooks) propGroups.get(propKey).nonSelectedBooks = [];
              
              // Check if this bookmaker is already in the appropriate array to avoid duplicates
              const existingSelectedBook = propGroups.get(propKey).selectedBooks.find(b => b.bookmaker?.key === bookmaker.key);
              const existingNonSelectedBook = propGroups.get(propKey).nonSelectedBooks.find(b => b.bookmaker?.key === bookmaker.key);
              
              if (isSelected && !existingSelectedBook) {
                propGroups.get(propKey).selectedBooks.push(bookData);
                console.log(`🎯 Added ${bookKey} to selectedBooks`);
              } else if (!isSelected && !existingNonSelectedBook) {
                propGroups.get(propKey).nonSelectedBooks.push(bookData);
                console.log(`🎯 Added ${bookKey} to nonSelectedBooks`);
              } else {
                console.log(`🎯 Skipping duplicate ${bookKey} (already categorized)`);
              }
            });
          });
        });
      });
      
      // Deduplicate allBooks arrays before processing
      propGroups.forEach((propData, propKey) => {
        if (propData.allBooks && propData.allBooks.length > 0) {
          // Deduplicate by bookmaker key, keeping the first occurrence
          const seenBookmakers = new Set();
          propData.allBooks = propData.allBooks.filter(book => {
            const bookKey = book.bookmaker?.key;
            if (seenBookmakers.has(bookKey)) {
              console.log(`🎯 Removing duplicate ${bookKey} from allBooks for ${propKey}`);
              return false;
            }
            seenBookmakers.add(bookKey);
            return true;
          });
          console.log(`🎯 Deduplicated allBooks for ${propKey}: ${propData.allBooks.length} unique books`);
        }
      });

      // Second pass: include all props and apply sportsbook filter
      console.log(`Total prop groups collected: ${propGroups.size}`);
      propGroups.forEach((propData, propKey) => {
        const bookCount = propData.allBooks?.length || (propData.overBooks?.length || 0) + (propData.underBooks?.length || 0);
        console.log(`Processing prop group: ${propKey} with ${bookCount} books`);
        
        // Apply sportsbook filter if active
        if (bookFilter && bookFilter.length > 0) {
          let hasMatchingBook = false;
          
          // Debug logging for sportsbook filtering
          console.log(`🎯 Filtering prop ${propKey} with bookFilter:`, bookFilter);
          
          // Check allBooks for regular props
          if (propData.allBooks && propData.allBooks.length > 0) {
            console.log(`🎯 Available books for ${propKey}:`, propData.allBooks.map(b => ({
              key: b.bookmaker?.key,
              book: b.book,
              bookmaker: b.bookmaker
            })));
            
            // Check if we're filtering for DFS apps only
            const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au'];
            const filteringForDFSOnly = bookFilter.every(book => dfsApps.includes(book));
            
            hasMatchingBook = propData.allBooks.some(book => {
              const bookKey = book.bookmaker?.key?.toLowerCase() || '';
              const normalizedFilter = bookFilter.map(f => f.toLowerCase());
              
              console.log(`🎯 Checking book: "${bookKey}" vs normalized filter:`, normalizedFilter);
              
              // Check if this bookmaker key is in the filter (case-insensitive)
              const keyMatch = normalizedFilter.includes(bookKey);
              
              // Also check for DFS apps with partial matching
              const isDFSMatch = dfsApps.some(app => bookKey.includes(app));
              const filteringForDFS = normalizedFilter.some(f => dfsApps.includes(f));
              
              if (keyMatch) {
                console.log(`🎯 ✅ MATCH: ${bookKey} found in filter`);
                return true;
              }
              
              if (filteringForDFS && isDFSMatch) {
                console.log(`🎯 ✅ DFS MATCH: ${bookKey} matches DFS filter`);
                return true;
              }
              
              console.log(`🎯 ❌ NO MATCH: ${bookKey} not in filter`);
              return false;
            });
          }
          
          // Check overBooks and underBooks for combined Over/Under props
          if (!hasMatchingBook && (propData.overBooks || propData.underBooks)) {
            const allCombinedBooks = [...(propData.overBooks || []), ...(propData.underBooks || [])];
            console.log(`🎯 Combined books for ${propKey}:`, allCombinedBooks.map(b => ({
              key: b.bookmaker?.key,
              book: b.book,
              bookmaker: b.bookmaker
            })));
            
            // Check if we're filtering for DFS apps only
            const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au'];
            const filteringForDFSOnly = bookFilter.every(book => dfsApps.includes(book));
            
            hasMatchingBook = allCombinedBooks.some(book => {
              const bookKey = book.bookmaker?.key?.toLowerCase() || '';
              const normalizedFilter = bookFilter.map(f => f.toLowerCase());
              
              console.log(`🎯 Checking combined book: "${bookKey}" vs normalized filter:`, normalizedFilter);
              
              // Check if this bookmaker key is in the filter (case-insensitive)
              const keyMatch = normalizedFilter.includes(bookKey);
              
              // Also check for DFS apps with partial matching
              const isDFSMatch = dfsApps.some(app => bookKey.includes(app));
              const filteringForDFS = normalizedFilter.some(f => dfsApps.includes(f));
              
              if (keyMatch) {
                console.log(`🎯 ✅ COMBINED MATCH: ${bookKey} found in filter`);
                return true;
              }
              
              if (filteringForDFS && isDFSMatch) {
                console.log(`🎯 ✅ COMBINED DFS MATCH: ${bookKey} matches DFS filter`);
                return true;
              }
              
              console.log(`🎯 ❌ COMBINED NO MATCH: ${bookKey} not in filter`);
              return false;
            });
          }
          
          if (!hasMatchingBook) {
            console.log(`Skipping prop ${propKey} - no matching sportsbook`);
            return; // Skip this prop if no matching sportsbook
          }
        }
        
        // Handle combined Over/Under props - create a unified row showing both sides
        if (propData.overBooks && propData.underBooks) {
          // Calculate EV for both Over and Under with line shopping consideration
          const calculateSideEV = (books, isOver = true) => {
            if (!books || books.length === 0) return null;
            const probs = books.map(b => americanToProb(b.price ?? b.odds)).filter(p => typeof p === "number" && p > 0 && p < 1);
            const consensusProb = median(probs);
            if (consensusProb && consensusProb > 0 && consensusProb < 1 && books.length >= 3) {
              const fairDec = 1 / consensusProb;
              
              // Find best line + odds combination (same logic as above)
              const bestBook = books.reduce((best, book) => {
                const bestLine = parseFloat(best.point || best.line || 0);
                const bookLine = parseFloat(book.point || book.line || 0);
                
                // For OVER: prefer lower lines, for UNDER: prefer higher lines
                const lineIsBetter = isOver ? (bookLine < bestLine) : (bookLine > bestLine);
                const lineIsWorse = isOver ? (bookLine > bestLine) : (bookLine < bestLine);
                
                if (lineIsBetter) return book;
                if (lineIsWorse) return best;
                
                // Same line: prefer better odds
                const bestDecimal = americanToDecimal(best.price);
                const bookDecimal = americanToDecimal(book.price);
                return bookDecimal > bestDecimal ? book : best;
              });
              
              const bookmakerKey = bestBook.bookmaker?.key || bestBook.book?.toLowerCase();
              return calculateEV(bestBook.price, decimalToAmerican(fairDec), bookmakerKey);
            }
            return null;
          };
          
          const overEV = calculateSideEV(propData.overBooks, true);
          const underEV = calculateSideEV(propData.underBooks, false);
          
          // Find best line + odds combination for each side
          const bestOverBook = propData.overBooks.length > 0 ? propData.overBooks.reduce((best, book) => {
            const bestLine = parseFloat(best.point || best.line || 0);
            const bookLine = parseFloat(book.point || book.line || 0);
            
            // For OVER: prefer lower lines (easier to hit)
            if (bookLine < bestLine) {
              console.log(`🎯 Line Shopping OVER: Found better line ${bookLine} vs ${bestLine} at ${book.bookmaker?.key || book.book}`);
              return book;
            }
            if (bookLine > bestLine) return best;
            
            // Same line: prefer better odds
            const bestDecimal = americanToDecimal(best.price);
            const bookDecimal = americanToDecimal(book.price);
            return bookDecimal > bestDecimal ? book : best;
          }) : null;
          
          const bestUnderBook = propData.underBooks.length > 0 ? propData.underBooks.reduce((best, book) => {
            const bestLine = parseFloat(best.point || best.line || 0);
            const bookLine = parseFloat(book.point || book.line || 0);
            
            // For UNDER: prefer higher lines (easier to hit)
            if (bookLine > bestLine) {
              console.log(`🎯 Line Shopping UNDER: Found better line ${bookLine} vs ${bestLine} at ${book.bookmaker?.key || book.book}`);
              return book;
            }
            if (bookLine < bestLine) return best;
            
            // Same line: prefer better odds
            const bestDecimal = americanToDecimal(best.price);
            const bookDecimal = americanToDecimal(book.price);
            return bookDecimal > bestDecimal ? book : best;
          }) : null;
          
          // Choose the side with better EV for the main display
          const showOver = !underEV || (overEV && overEV >= (underEV || 0));
          const primaryBook = showOver ? bestOverBook : bestUnderBook;
          
          if (primaryBook) {
            // Create the main row with both sides data
            const finalPropData = {
              key: propData.key,
              game: propData.game,
              mkt: propData.mkt,
              out: {
                name: showOver ? 'Over' : 'Under',
                description: propData.playerName,
                price: primaryBook.price,
                odds: primaryBook.price,
                point: propData.point
              },
              bk: primaryBook.bookmaker,
              sport: propData.sport,
              isPlayerProp: true,
              isCombinedProp: true, // Flag to indicate this has both sides
              overBooks: propData.overBooks,
              underBooks: propData.underBooks,
              allBooks: [...propData.overBooks, ...propData.underBooks], // Combined for mini-table
              selectedBooks: propData.selectedBooks || [],
              nonSelectedBooks: propData.nonSelectedBooks || [],
              otherSideName: showOver ? 'Under' : 'Over'
            };
            
            propsRows.push(finalPropData);
          }
        } else {
          // Regular prop (not Over/Under pair)
          propsRows.push(propData);
        }
      });
      
      console.log(`Total prop groups created: ${propGroups.size}`);
      console.log(`Total props rows after filtering: ${propsRows.length}`);
      if (propsRows.length > 0) {
        console.log('Sample prop row:', propsRows[0]);
      }
      
      return propsRows;
    }

    // Regular game mode processing
    // Helper function to get odds movement indicator
    const getOddsMovement = (currentOdds, previousOdds) => {
      if (!previousOdds || !currentOdds) return null;
      const diff = currentOdds - previousOdds;
      if (Math.abs(diff) < 5) return { trend: 'stable', icon: '→', color: '#6b7280' };
      return diff > 0 ? 
        { trend: 'up', icon: '↗', color: '#10b981', diff: `+${diff}` } : 
        { trend: 'down', icon: '↘', color: '#ef4444', diff: `${diff}` };
    };

    // Helper function to find best odds for highlighting
    const findBestOdds = (odds, market) => {
      if (!odds || odds.length === 0) return null;
      
      // For positive odds (underdog), higher is better
      // For negative odds (favorite), closer to 0 is better (less negative)
      let bestOdds = odds[0];
      let bestValue = americanToDecimal(odds[0]);
      
      odds.forEach(odd => {
        const decimal = americanToDecimal(odd);
        if (decimal > bestValue) {
          bestValue = decimal;
          bestOdds = odd;
        }
      });
      
      return bestOdds;
    };

    // Helper function to detect arbitrage opportunities
    const detectArbitrage = (gameData, marketKey) => {
      if (!gameData.bookmakers || gameData.bookmakers.length < 2) return null;
      
      const market = gameData.bookmakers
        .map(b => b.markets?.find(m => m.key === marketKey))
        .filter(Boolean);
      
      if (market.length < 2) return null;
      
      // For H2H markets, check if we can bet both sides profitably
      if (marketKey === 'h2h') {
        const allOutcomes = market.flatMap(m => m.outcomes || []);
        const homeOdds = allOutcomes.filter(o => o.name === gameData.home_team).map(o => o.price);
        const awayOdds = allOutcomes.filter(o => o.name === gameData.away_team).map(o => o.price);
        
        if (homeOdds.length && awayOdds.length) {
          const bestHome = Math.max(...homeOdds);
          const bestAway = Math.max(...awayOdds);
          
          // Convert to implied probabilities
          const homeProb = bestHome > 0 ? 100 / (bestHome + 100) : Math.abs(bestHome) / (Math.abs(bestHome) + 100);
          const awayProb = bestAway > 0 ? 100 / (bestAway + 100) : Math.abs(bestAway) / (Math.abs(bestAway) + 100);
          
          const totalProb = homeProb + awayProb;
          
          // Arbitrage exists if total probability < 1 (100%)
          if (totalProb < 0.98) { // 2% margin for profit
            return {
              profit: ((1 - totalProb) * 100).toFixed(2),
              homeOdds: bestHome,
              awayOdds: bestAway,
              homeStake: (1 / (bestHome > 0 ? (bestHome/100 + 1) : (100/Math.abs(bestHome) + 1))).toFixed(2),
              awayStake: (1 / (bestAway > 0 ? (bestAway/100 + 1) : (100/Math.abs(bestAway) + 1))).toFixed(2)
            };
          }
        }
      }
      
      return null;
    };

    // Helper function to get market display name
    const getMarketDisplayName = (market) => {
      const marketNames = {
        h2h: "Moneyline",
        spreads: "Spread", 
        totals: "Total",
        player_points: "Player Points",
        player_rebounds: "Player Rebounds",
        player_assists: "Player Assists"
      };
      return marketNames[market] || market;
    };

    // Helper function to format selection text
    const formatSelection = (market, name, point) => {
      if (market === 'h2h') return name;
      if (market === 'spreads') return `${name} ${point > 0 ? '+' : ''}${point}`;
      if (market === 'totals') return `${name} ${point}`;
      return `${name} ${point || ''}`;
    };

    // Helper function to get edge color
    const getEdgeColor = (edge) => {
      if (edge >= 5) return '#10b981'; // green
      if (edge >= 2) return '#f59e0b'; // yellow
      return '#6b7280'; // gray
    };

    const gameRows = [];
    games?.forEach((game) => {
      const baseKeys = ["h2h", "spreads", "totals"];
      const keys = (marketFilter && marketFilter.length) ? marketFilter : baseKeys;

      keys.forEach((mktKey) => {
        const allMarketOutcomes = [];
        game.bookmakers?.forEach(bk => {
          const mkt = bk.markets?.find(m => m.key === mktKey);
          if (mkt && mkt.outcomes) {
            mkt.outcomes.forEach(out => {
              allMarketOutcomes.push({ ...out, book: bk.title, bookmaker: bk, market: mkt });
            });
          }
        });
        if (!allMarketOutcomes.length) return;

        // Enhanced logging for debugging bookFilter issues
        console.log(`🎯 Processing market ${mktKey} with ${allMarketOutcomes.length} outcomes. BookFilter:`, 
          bookFilter && bookFilter.length ? bookFilter : 'ALL BOOKS (no filter)');
        
        const candidates = allMarketOutcomes.filter(o => {
          // If no bookFilter specified, include all bookmakers
          if (!bookFilter || !bookFilter.length) {
            console.log(`🎯 Including all bookmakers for market ${mktKey}`);
            return true;
          }
          
          const bookKey = o.bookmaker?.key?.toLowerCase() || '';
          const normalizedFilter = bookFilter.map(f => f.toLowerCase());
          
          console.log(`🎯 Game odds - Checking book: "${bookKey}" vs normalized filter:`, normalizedFilter);
          
          // Check if this bookmaker key is in the filter (case-insensitive)
          const keyMatch = normalizedFilter.includes(bookKey);
          
          // Also check for DFS apps with partial matching
          const dfsApps = ['prizepicks', 'underdog', 'pick6'];
          const isDFSMatch = dfsApps.some(app => bookKey.includes(app));
          const filteringForDFS = normalizedFilter.some(f => dfsApps.includes(f));
          
          if (keyMatch) {
            console.log(`🎯 ✅ GAME ODDS MATCH: ${bookKey} found in filter for market ${mktKey}`);
            return true;
          }
          
          if (filteringForDFS && isDFSMatch) {
            console.log(`🎯 ✅ GAME ODDS DFS MATCH: ${bookKey} matches DFS filter for market ${mktKey}`);
            return true;
          }
          
          console.log(`🎯 ❌ GAME ODDS NO MATCH: ${bookKey} not in filter for market ${mktKey}`);
          return false;
        });

        if (!candidates.length) return;

        const marketKeyLower = String(mktKey || '').toLowerCase();
        const isSpreadMarket = marketKeyLower.includes('spread');
        const isTotalMarket = marketKeyLower.includes('total');

        const outcomeGroupKey = (outcome) => {
          const base = outcome?.name || '';
          if (isSpreadMarket || isTotalMarket) {
            const pt = outcome?.point != null ? Number(outcome.point).toFixed(2) : 'NA';
            return `${base}@@${pt}`;
          }
          return base;
        };

        const grouped = candidates.reduce((acc, outcome) => {
          const key = outcomeGroupKey(outcome);
          if (!acc[key]) acc[key] = [];
          acc[key].push(outcome);
          return acc;
        }, {});

        Object.entries(grouped).forEach(([groupKey, outcomes]) => {
          if (!outcomes.length) return;

          const filteredOutcome = outcomes.reduce((best, current) => {
            if (!best) return current;
            const bestOdds = Number(best.price ?? best.odds ?? 0);
            const currentOdds = Number(current.price ?? current.odds ?? 0);
            const bestDecimal = americanToDecimal(bestOdds) || -Infinity;
            const currentDecimal = americanToDecimal(currentOdds) || -Infinity;
            return currentDecimal > bestDecimal ? current : best;
          }, outcomes[0]);

          const basePoint = filteredOutcome?.point != null ? Number(filteredOutcome.point) : null;
          const tolerance = 0.051;

          const matchesPoint = (entry) => {
            if (!(isSpreadMarket || isTotalMarket)) return true;
            if (basePoint == null) return entry?.point == null;
            const entryPoint = entry?.point != null ? Number(entry.point) : null;
            if (entryPoint == null) return false;
            return Math.abs(entryPoint - basePoint) < tolerance;
          };

          const allBooksForOutcome = allMarketOutcomes.filter(o => outcomeGroupKey(o) === groupKey && matchesPoint(o));
          if (!allBooksForOutcome.length) return;

          // Separate selected bookmakers from non-selected ones for mini table
          const selectedBooks = [];
          const nonSelectedBooks = [];
          
          allBooksForOutcome.forEach(o => {
            const bookData = {
              price: o.price,
              odds: o.price,
              book: o.book,
              bookmaker: o.bookmaker,
              market: o.market,
              point: o.point
            };
            
            // Check if this bookmaker is in the filter (case-insensitive)
            const bookKey = o.bookmaker.key?.toLowerCase() || '';
            const normalizedFilter = bookFilter ? bookFilter.map(f => f.toLowerCase()) : [];
            const isSelected = !bookFilter || !bookFilter.length || normalizedFilter.includes(bookKey);
            
            console.log(`🎯 GAME CATEGORIZING: ${bookKey} - Selected: ${isSelected} (Filter: ${JSON.stringify(normalizedFilter)})`);
            
            if (isSelected) {
              selectedBooks.push(bookData);
            } else {
              nonSelectedBooks.push(bookData);
            }
          });

          const gameRow = {
            key: `${game.id}-${mktKey}-${groupKey}`,
            game,
            mkt: filteredOutcome.market,
            out: filteredOutcome,
            bk: filteredOutcome.bookmaker,
            allBooks: allBooksForOutcome.map(o => ({
              price: o.price,
              odds: o.price,
              book: o.book,
              bookmaker: o.bookmaker,
              market: o.market,
              point: o.point
            })),
            // Add separate arrays for filtering
            selectedBooks: selectedBooks,
            nonSelectedBooks: nonSelectedBooks,
            sport: game.sport_key
          };

          const hasValidOdds = Number(filteredOutcome.price || filteredOutcome.odds || 0) !== 0;
          const uniqueBooksWithOdds = new Set();
          allBooksForOutcome.forEach(book => {
            const key = String(book?.bookmaker?.key || book?.book || '').toLowerCase();
            const odds = Number(book?.price || book?.odds || 0);
            if (key && odds !== 0) {
              uniqueBooksWithOdds.add(key);
            }
          });
          // Require fewer distinct books so the table populates even when only a handful report odds.
          const minimumBooksRequired = (isSpreadMarket || isTotalMarket) ? 2 : 3;
          const hasMinimumBooks = uniqueBooksWithOdds.size >= minimumBooksRequired;

          if (hasValidOdds && hasMinimumBooks) {
            gameRows.push(gameRow);
          }
        });
      });
    });
    
    return gameRows;
    } catch (error) {
      console.error('Error processing games data:', error);
      return [];
    }
  }, [games, mode, marketFilter, bookFilter]);

  // Price change detection for flash animations
  const prevPriceRef = useRef({});
  const [priceDelta, setPriceDelta] = useState({});

  useEffect(() => {
    // Skip price change animations for player props mode to prevent glitter effect
    if (mode === "props") return;
    
    const prev = prevPriceRef.current || {};
    const nextMap = {}, deltas = {};
    let hasChanges = false;
    
    allRows.forEach(row => {
      const curr = Number(row?.out?.price ?? row?.out?.odds ?? 0);
      const prevVal = Number(prev[row.key] ?? 0);
      nextMap[row.key] = curr;
      if (prevVal && curr && curr !== prevVal) {
        deltas[row.key] = curr > prevVal ? 'up' : 'down';
        hasChanges = true;
      }
    });
    prevPriceRef.current = nextMap;
    if (hasChanges) {
      setPriceDelta(deltas);
      const t = setTimeout(() => setPriceDelta({}), 900);
      return () => clearTimeout(t);
    }
  }, [allRows, mode]);

  /* ---------- EV / fair maps ---------- */
  const getEV = row => {
    const userOdds = Number(row?.out?.price ?? row?.out?.odds ?? 0);
    if (!userOdds) return null;
    
    // Get bookmaker key for DFS-specific EV calculation
    const bookmakerKey = row?.out?.bookmaker?.key || row?.out?.book?.toLowerCase();
    
    // Check if this is a DFS app
    const isDFSApp = ['prizepicks', 'underdog', 'pick6'].includes(bookmakerKey);
    
    // For DFS apps, we want to prioritize them in EV sorting
    if (isDFSApp && mode === 'props') {
      const dfsOdds = -119;
      console.log(`Calculating EV for DFS app ${bookmakerKey} with fixed ${dfsOdds} odds`);
      // Force the odds to be fixed for EV calculation
      return calculateEV(dfsOdds, fairDevigMap.get(row.key), bookmakerKey);
    }
    
    // IMPORTANT: For fair line calculation, we use ALL books, not just filtered books
    // This ensures we have enough data to calculate an accurate fair line
    const allBooks = row.allBooks || [];
    
    // Debug logging for EV calculation
    if (row.playerName === 'Breece Hall' && row.mkt?.key?.includes('reception')) {
      console.log(`🔍 EV DEBUG for ${row.playerName} ${row.mkt?.key}:`, {
        bookmakerKey,
        userOdds,
        allBooksCount: allBooks.length,
        allBooks: allBooks.map(b => ({ book: b.bookmaker?.key || b.book, odds: b.price || b.odds, name: b.name }))
      });
    }
    
    // Only proceed if we have enough books for a meaningful consensus
    if (allBooks.length < 4) {
      if (row.playerName === 'Breece Hall' && row.mkt?.key?.includes('reception')) {
        console.log(`🔍 EV DEBUG: Not enough books (${allBooks.length} < 4) - returning null`);
      }
      return null;
    }
    
    // For player props, use weighted consensus probability from all available books
    if (row.isPlayerProp || (row.mkt?.key && row.mkt.key.includes('player_'))) {
      // Calculate probabilities and weights for each book
      const bookData = allBooks
        .map(b => ({
          prob: americanToProb(b.price ?? b.odds),
          weight: getBookWeight(b.bookmaker?.key || b.book),
          book: b.bookmaker?.key || b.book
        }))
        .filter(d => typeof d.prob === "number" && d.prob > 0 && d.prob < 1);
      
      if (bookData.length === 0) return null;
      
      const probs = bookData.map(d => d.prob);
      const weights = bookData.map(d => d.weight);
      const consensusProb = weightedMedian(probs, weights);
      const uniqCnt = new Set(allBooks.map(b => b.bookmaker?.key || b.book || '')).size;
      
      // Debug logging for weighted calculation
      if (row.playerName === 'Kendrick Bourne' && row.mkt?.key?.includes('reception')) {
        console.log(`🔍 WEIGHTED EV for ${row.playerName}:`, {
          bookData: bookData.map(d => ({ book: d.book, prob: d.prob.toFixed(4), weight: d.weight })),
          consensusProb: consensusProb?.toFixed(4),
          unweightedMedian: median(probs)?.toFixed(4),
          difference: consensusProb && median(probs) ? ((consensusProb - median(probs)) * 100).toFixed(2) + '%' : 'N/A'
        });
      }
      
      if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 4) { // Minimum 4 books for reliable EV
        const fairDec = 1 / consensusProb;
        return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
      }
      return null;
    }
    
    // Use devig method if available
    const pDevig = consensusDevigProb(row);
    const pairCnt = devigPairCount(row);
    if (pDevig && pDevig > 0 && pDevig < 1 && pairCnt >= 4) { // Minimum 4 books for reliable EV
      const fairDec = 1 / pDevig;
      return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
    }
    
    // Fallback to weighted consensus method for regular markets using all books
    const bookData = allBooks
      .map(b => ({
        prob: americanToProb(b.price ?? b.odds),
        weight: getBookWeight(b.bookmaker?.key || b.book),
        book: b.bookmaker?.key || b.book
      }))
      .filter(d => typeof d.prob === "number" && d.prob > 0 && d.prob < 1);
    
    if (bookData.length === 0) return null;
    
    const probs = bookData.map(d => d.prob);
    const weights = bookData.map(d => d.weight);
    const consensusProb = weightedMedian(probs, weights);
    const uniqCnt = new Set(allBooks.map(b => b.bookmaker?.key || b.book || '')).size;
    
    if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 4) { // Minimum 4 books for reliable EV
      const fairDec = 1 / consensusProb;
      return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
    }
    return null;
  };
  const evMap = useMemo(() => {
    const m = new Map();
    allRows.forEach(r => {
      try {
        m.set(r.key, getEV(r));
      } catch (err) {
        console.warn('EV calculation error for row:', r.key, err);
        m.set(r.key, null);
      }
    });
    return m;
  }, [allRows]);

  const fairDevigMap = useMemo(() => {
    const m = new Map();
    allRows.forEach(r => {
      const p = consensusDevigProb(r);
      const pairCnt = devigPairCount(r);
      if (p && p > 0 && p < 1 && pairCnt > 4) {
        const fairDec = 1 / p;
        m.set(r.key, decimalToAmerican(fairDec));
      } else {
        m.set(r.key, null);
      }
    });
    return m;
  }, [allRows]);

  /* ---------- sorting / paging ---------- */
  const sorters = {
    ev: (a, b) => ((evMap.get(b.key) ?? -999) - (evMap.get(a.key) ?? -999)),
    match: (a, b) => String(`${a.game.home_team} ${a.game.away_team}`).localeCompare(`${b.game.home_team} ${b.game.away_team}`),
    line: (a, b) => Number(a.out?.point ?? 0) - Number(b.out?.point ?? 0),
    book: (a, b) => cleanBookTitle(a.bk?.title ?? "").localeCompare(cleanBookTitle(b.bk?.title ?? "")),
    odds: (a, b) => Number(a.out?.price ?? a.out?.odds ?? 0) - Number(b.out?.price ?? b.out?.odds ?? 0),
    time: (a, b) => new Date(a.game?.commence_time || 0) - new Date(b.game?.commence_time || 0),
    market: (a, b) => String(a.mkt?.key).localeCompare(String(b.mkt?.key)),
  };
  const sorter = sorters[sort.key] || sorters.ev;

  let rows = useMemo(() => {
    let r = allRows;
    
    // Check if we're filtering for DFS apps only
    const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au'];
    const filteringForDFSOnly = bookFilter && bookFilter.length > 0 && bookFilter.every(book => dfsApps.includes(book));
    
    console.log('🔍 DFS FILTER DEBUG: bookFilter =', bookFilter);
    console.log('🔍 DFS FILTER DEBUG: bookFilter type =', typeof bookFilter, 'length =', bookFilter?.length);
    console.log('🔍 DFS FILTER DEBUG: filteringForDFSOnly =', filteringForDFSOnly);
    console.log('🔍 DFS FILTER DEBUG: Number of rows before filtering:', r.length);
    console.log('🔍 DFS FILTER DEBUG: dfsApps array =', dfsApps);
    console.log('🔍 DFS FILTER DEBUG: bookFilter.every check =', bookFilter?.map(book => ({ book, isDFS: dfsApps.includes(book) })));
    
    // Log all available bookmakers in the data
    const allBookmakers = new Set();
    r.forEach(row => {
      const bookmakerKey = (row?.bk?.key || row?.out?.bookmaker?.key || row?.out?.book || '').toLowerCase();
      if (bookmakerKey) allBookmakers.add(bookmakerKey);
    });
    console.log('🔍 DFS FILTER DEBUG: All bookmakers in data =', Array.from(allBookmakers));
    
    // If filtering for DFS apps only, strictly filter to only show DFS apps
    if (filteringForDFSOnly) {
      console.log('🎯 DFS-only filtering active - strictly showing only DFS apps');
      console.log('🎯 Before filtering: ' + r.length + ' rows');
      
      // Count DFS app rows before filtering
      const dfsRowsBefore = r.filter(row => {
        const bookmakerKey = (row?.bk?.key || row?.out?.bookmaker?.key || row?.out?.book || '').toLowerCase();
        return dfsApps.some(app => bookmakerKey.includes(app));
      }).length;
      
      console.log('🎯 DFS app rows before filtering: ' + dfsRowsBefore);
      
      // Log all DFS app rows for debugging
      r.forEach(row => {
        const bookmakerKey = (row?.bk?.key || row?.out?.bookmaker?.key || row?.out?.book || '').toLowerCase();
        if (dfsApps.some(app => bookmakerKey.includes(app))) {
          console.log(`🎯 DFS app row found: ${bookmakerKey} - ${row.game?.home_team} vs ${row.game?.away_team} - ${row.mkt?.key} - ${row.out?.name}`);
        }
      });
      
      r = r.filter(row => {
        // For player props, bookmaker info is in row.bk, for game odds it's in row.out.bookmaker
        const bookmakerKey = (row?.bk?.key || row?.out?.bookmaker?.key || row?.out?.book || '').toLowerCase();
        
        // Debug each filter check
        const matchResults = bookFilter.map(selectedBook => {
          const filterKey = selectedBook.toLowerCase();
          const matches = bookmakerKey.includes(filterKey);
          console.log(`🔍 FILTER CHECK: "${bookmakerKey}" includes "${filterKey}"? ${matches}`);
          return matches;
        });
        
        const isSelectedDFSApp = matchResults.some(match => match);
        
        if (!isSelectedDFSApp) {
          console.log(`🎯 EXCLUDING: "${bookmakerKey}" (not in filter: ${JSON.stringify(bookFilter)})`);
        } else {
          console.log(`🎯 INCLUDING: "${bookmakerKey}" (matches filter: ${JSON.stringify(bookFilter)})`);
        }
        return isSelectedDFSApp;
      });
      
      console.log('🎯 After filtering: ' + r.length + ' rows');
    }
    
    // Apply search query filter for player props
    if (searchQuery && searchQuery.trim() && mode === 'props') {
      const query = searchQuery.trim().toLowerCase();
      console.log('🔍 SEARCH FILTER: Applying search query:', query);
      console.log('🔍 SEARCH FILTER: Rows before search:', r.length);
      
      r = r.filter(row => {
        const playerName = (row.playerName || '').toLowerCase();
        const teamName = (row.out?.name || '').toLowerCase();
        const homeTeam = (row.game?.home_team || '').toLowerCase();
        const awayTeam = (row.game?.away_team || '').toLowerCase();
        const marketKey = (row.mkt?.key || '').toLowerCase();
        
        const matches = playerName.includes(query) || 
                       teamName.includes(query) || 
                       homeTeam.includes(query) || 
                       awayTeam.includes(query) ||
                       marketKey.includes(query);
        
        if (matches) {
          console.log(`🔍 SEARCH MATCH: ${playerName} - ${homeTeam} vs ${awayTeam}`);
        }
        
        return matches;
      });
      
      console.log('🔍 SEARCH FILTER: Rows after search:', r.length);
    }
    
    // Apply EV filter if specified, but always show DFS app bets
    if (evOnlyPositive || (typeof evMin === 'number' && !Number.isNaN(evMin))) {
      r = r.filter(row => {
        // Check if this is a DFS app - always show DFS app bets regardless of EV
        const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au'];
        const bookmakerKey = (row?.bk?.key || row?.out?.bookmaker?.key || row?.out?.book || '').toLowerCase();
        const isDFSApp = dfsApps.some(app => bookmakerKey.includes(app));
        
        // If it's a DFS app, always show it
        if (isDFSApp) {
          console.log(`🎯 Always showing DFS app bet: ${bookmakerKey} for ${row.game?.home_team} vs ${row.game?.away_team}`);
          return true;
        }
        
        // For non-DFS apps, apply normal EV filtering
        const ev = evMap.get(row.key);
        if (ev == null || Number.isNaN(ev)) return false;
        if (evOnlyPositive && ev <= 0) return false;
        if (typeof evMin === 'number' && ev < evMin) return false;
        return true;
      });
    }
    // keep only best odds per game/market/point bucket (most favorable for bettor)
    // Note: When DFS filtering is active, this will only compare odds among the filtered DFS apps
    const bestBy = new Map();
    const groupKey = (r) => {
      const mk = String(r?.mkt?.key || '').toLowerCase();
      const rawPt = r?.out?.point;
      const ptKey = mk.includes('spread')
        ? (Number.isFinite(Number(rawPt)) ? Math.abs(Number(rawPt)).toString() : String(rawPt ?? ''))
        : String(rawPt ?? '');
      return mk === 'h2h' ? `${r.game.id}:${mk}` : `${r.game.id}:${mk}:${ptKey}`;
    };
    
    const isBetterOdds = (newOdds, currentOdds) => {
      // For positive odds (+200), higher is better
      // For negative odds (-150), closer to 0 is better (less negative)
      console.log(`🎯 Comparing odds: ${newOdds} vs ${currentOdds}`);
      
      if (newOdds > 0 && currentOdds > 0) {
        const result = newOdds > currentOdds;
        console.log(`🎯 Both positive: ${newOdds} > ${currentOdds} = ${result}`);
        return result;
      }
      if (newOdds < 0 && currentOdds < 0) {
        const result = newOdds > currentOdds; // -120 > -150
        console.log(`🎯 Both negative: ${newOdds} > ${currentOdds} = ${result}`);
        return result;
      }
      if (newOdds > 0 && currentOdds < 0) {
        console.log(`🎯 New positive vs current negative: ${newOdds} vs ${currentOdds} = true`);
        return true; // positive always better than negative
      }
      if (newOdds < 0 && currentOdds > 0) {
        console.log(`🎯 New negative vs current positive: ${newOdds} vs ${currentOdds} = false`);
        return false; // negative never better than positive
      }
      console.log(`🎯 Default case: ${newOdds} vs ${currentOdds} = false`);
      return false;
    };
    
    r.forEach(rr => {
      const gk = groupKey(rr);
      const odds = Number(rr?.out?.price ?? rr?.out?.odds ?? 0);
      const ev = evMap.get(rr.key) ?? -999;
      const cur = bestBy.get(gk);
      
      // Debug logging for best odds selection
      const bookmakerKey = (rr?.bk?.key || rr?.out?.bookmaker?.key || rr?.out?.book || '').toLowerCase();
      console.log(`🎯 BEST ODDS: Evaluating ${bookmakerKey} with odds ${odds} for group ${gk}`);
      
      if (!cur) {
        console.log(`🎯 BEST ODDS: Setting initial best for group ${gk}: ${bookmakerKey} (${odds})`);
        bestBy.set(gk, { row: rr, odds, ev });
      } else {
        // Prioritize best odds, but use EV as tiebreaker
        if (isBetterOdds(odds, cur.odds) || (odds === cur.odds && ev > cur.ev)) {
          const currentBookmaker = (cur.row?.bk?.key || cur.row?.out?.bookmaker?.key || cur.row?.out?.book || '').toLowerCase();
          console.log(`🎯 BEST ODDS: Updating best for group ${gk}: ${currentBookmaker} (${cur.odds}) → ${bookmakerKey} (${odds})`);
          bestBy.set(gk, { row: rr, odds, ev });
        } else {
          console.log(`🎯 BEST ODDS: Keeping current best for group ${gk}: ${bookmakerKey} (${odds}) not better than current`);
        }
      }
    });
    r = Array.from(bestBy.values()).map(v => v.row);
    
    // Debug final results
    console.log(`🎯 FINAL RESULTS: ${r.length} rows after best odds selection`);
    r.forEach(row => {
      const bookmakerKey = (row?.bk?.key || row?.out?.bookmaker?.key || row?.out?.book || '').toLowerCase();
      const odds = Number(row?.out?.price ?? row?.out?.odds ?? 0);
      console.log(`🎯 FINAL ROW: ${bookmakerKey} - ${row.game?.home_team} vs ${row.game?.away_team} - ${row.mkt?.key} - ${row.out?.name} - ${odds}`);
    });
    
    return r.slice().sort((a, b) => (sort.dir === 'asc' ? -sorter(a, b) : sorter(a, b)));
  }, [allRows, bookFilter, evOnlyPositive, evMin, sort.dir, sorter, evMap, searchQuery, mode]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const paginatedRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  // Reset page only when fundamental data changes, not when filters change
  useEffect(() => setPage(1), [games, mode, pageSize]);
  
  // Reset page only if current page exceeds total pages after filtering
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Debug logging for Fliff bets
  useEffect(() => {
    // Log EV values for Fliff bets
    if (bookFilter && bookFilter.includes('fliff')) {
      const fliffRows = allRows.filter(row => 
        (row?.out?.bookmaker?.key === 'fliff' || row?.out?.book?.toLowerCase() === 'fliff')
      );
      
      console.log(`🎯 Found ${fliffRows.length} Fliff bets`);
      
      fliffRows.forEach(row => {
        const ev = getEV(row);
        console.log(`🎯 Fliff bet: ${row.game?.home_team} vs ${row.game?.away_team} - ${row.mkt?.key} - EV: ${ev?.toFixed(2)}%`);
      });
      
      const positiveEVFliffRows = fliffRows.filter(row => {
        const ev = getEV(row);
        return ev != null && ev > 0;
      });
      
      console.log(`🎯 Found ${positiveEVFliffRows.length} +EV Fliff bets`);
    }
  }, [allRows, bookFilter, evMap]);

  useEffect(() => {
    // Skip price change animations for player props mode to prevent glitter effect
    if (mode === "props") return;
    
    const prev = prevPriceRef.current || {};
    const nextMap = {}, deltas = {};
    let hasChanges = false;
    
    allRows.forEach(row => {
      const curr = Number(row?.out?.price ?? row?.out?.odds ?? 0);
      const prevVal = Number(prev[row.key] ?? 0);
      nextMap[row.key] = curr;
      
      // Only trigger flash if there's a meaningful price change (avoid micro-changes)
      if (prevVal && curr && Math.abs(curr - prevVal) > 5) {
        deltas[row.key] = curr > prevVal ? 'up' : 'down';
        hasChanges = true;
      }
    });
    
    prevPriceRef.current = nextMap;
    if (hasChanges) {
      setPriceDelta(deltas);
      const t = setTimeout(() => setPriceDelta({}), 900);
      return () => clearTimeout(t);
    }
  }, [allRows, mode]);

  /* ---------- Minimum loading time effect ---------- */
  useEffect(() => {
    // Clear any existing timer
    if (minLoadingTimeRef.current) {
      clearTimeout(minLoadingTimeRef.current);
    }
    
    // Adaptive loading state management
    if (loading) {
      setMinLoadingComplete(false);
      
      // Set different wait times based on mode
      // Player props need more time due to individual event API calls
      const maxWaitTime = mode === 'props' ? 45000 : 15000; // 45s for props, 15s for regular odds
      minLoadingTimeRef.current = setTimeout(() => {
        console.log(`🎯 Maximum loading time (${maxWaitTime/1000}s) reached for ${mode} mode`);
        setMinLoadingComplete(true);
      }, maxWaitTime);
    } else {
      // Loading finished - but for player props, add extra delay if no data found
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
        minLoadingTimeRef.current = null;
      }
      
      if (mode === 'props' && allRows.length === 0) {
        // For player props with no initial data, wait an additional 10 seconds
        console.log('🎯 Player props loading finished but no data - waiting additional 10s for individual event calls');
        minLoadingTimeRef.current = setTimeout(() => {
          console.log('🎯 Additional player props wait time completed');
          setMinLoadingComplete(true);
        }, 10000); // Additional 10 seconds for player props
      } else {
        setMinLoadingComplete(true);
        console.log('🎯 Loading completed - data ready for display');
      }
    }
    
    return () => {
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
    };
  }, [loading, mode, allRows.length]);

  // Additional effect: If data loads quickly, immediately allow display
  useEffect(() => {
    if (!loading && allRows.length > 0 && !minLoadingComplete) {
      console.log('🎯 Data loaded quickly - showing results immediately');
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
        minLoadingTimeRef.current = null;
      }
      setMinLoadingComplete(true);
    }
  }, [loading, allRows.length, minLoadingComplete]);
  
  /* ---------- Render ---------- */
  // Show loading spinner if actively loading OR if we have no data and haven't reached minimum display time
  // This allows immediate display when data loads quickly
  if (loading || (!allRows.length && !minLoadingComplete)) {
    return (
      <EnhancedLoadingSpinner
        message={mode === "props" ? "Loading player props..." : "Refreshing odds data..."}
        subMessage={mode === "props" 
          ? "Processing player prop data from DFS sites and sportsbooks" 
          : "Getting the latest odds from all sportsbooks"
        }
        size="large"
        type={mode === "props" ? "player-props" : "odds-table"}
      />
    );
  }
  
  // Debug the rows before showing no bets message
  console.log('🔍 FINAL DEBUG: Mode =', mode);
  console.log('🔍 FINAL DEBUG: bookFilter =', bookFilter);
  console.log('🔍 FINAL DEBUG: marketFilter =', marketFilter);
  console.log('🔍 FINAL DEBUG: allRows.length =', allRows.length);
  console.log('🔍 FINAL DEBUG: minLoadingComplete =', minLoadingComplete);
  
  // Log unique bookmakers in the data
  const uniqueBookmakers = [...new Set(allRows.map(row => row.book))];
  console.log('🔍 FINAL DEBUG: Unique bookmakers in data =', uniqueBookmakers);
  console.log('🔍 FINAL DEBUG: Has pick6 data? =', uniqueBookmakers.includes('pick6'));
  
  // Check if we're filtering for DFS apps only
  const finalDfsApps = ['prizepicks', 'underdog', 'pick6'];
  const finalFilteringForDFSOnly = bookFilter && bookFilter.length > 0 && bookFilter.every(book => finalDfsApps.includes(book));
  console.log('🔍 FINAL DEBUG: finalFilteringForDFSOnly =', finalFilteringForDFSOnly);
  
  // Show no bets message only after loading is complete AND minimum loading time has passed
  if (!allRows.length && minLoadingComplete) {
    // Show a helpful message when no bets are available
    const isDFSOnly = bookFilter && bookFilter.length > 0 && 
      bookFilter.every(book => ['prizepicks', 'underdog', 'pick6'].includes(book));
      
    return (
      <div className="odds-table-card revamp no-bets-container">
        <div className="no-bets-content">
          {/* Icon based on filter type */}
          <div className="no-bets-icon">
            {isDFSOnly ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 12h8"></path>
                <path d="M12 8v8"></path>
              </svg>
            )}
          </div>
          
          <h3 className="no-bets-title">
            {isDFSOnly ? 'No DFS App Bets Found' : 'No Bets Available'}
          </h3>
          
          <p className="no-bets-message">
            {bookFilter && bookFilter.length > 0 ? (
              // Check if filtering for DFS apps only
              isDFSOnly ? (
                <>The API may not be returning data for DFS apps at this time.<br />Try selecting traditional sportsbooks instead.</>
              ) : (
                <>No bets found for the selected sportsbooks.<br />Try selecting different sportsbooks or markets.</>
              )
            ) : (
              <>No bets available at this time.<br />Try selecting different sports or markets.</>
            )}
          </p>
          
          <div className="no-bets-details">
            <div className="details-row">
              <span className="details-label">Selected books:</span>
              <span className="details-value">{bookFilter && bookFilter.length > 0 ? bookFilter.join(', ') : 'All books'}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Mode:</span>
              <span className="details-value">{mode}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Total games:</span>
              <span className="details-value">{games?.length || 0}</span>
            </div>
            <div className="details-row">
              <span className="details-label">Markets:</span>
              <span className="details-value">{marketFilter && marketFilter.length > 0 ? marketFilter.join(', ') : 'All markets'}</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="no-bets-actions">
            <button 
              className="action-button primary"
              onClick={() => window.location.reload()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
              Refresh Data
            </button>
            <button 
              className="action-button secondary"
              onClick={() => {
                // Reset filters - this would need to be implemented via a callback prop
                if (window.dispatchEvent) {
                  window.dispatchEvent(new CustomEvent('resetOddsFilters'));
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h6l6 18h6"></path>
                <path d="M14 3h7v7"></path>
                <path d="M21 3l-9 9"></path>
              </svg>
              Reset Filters
            </button>
          </div>
        </div>
        
        {/* Add CSS styles */}
        <style jsx>{`
          .no-bets-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            background: rgba(139, 92, 246, 0.03);
            border: 1px solid rgba(139, 92, 246, 0.1);
            border-radius: 12px;
            margin: 20px 0;
            overflow: hidden;
          }
          
          .no-bets-content {
            max-width: 500px;
            padding: 40px 20px;
            text-align: center;
          }
          
          .no-bets-icon {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            animation: pulse 2s infinite ease-in-out;
          }
          
          .no-bets-title {
            color: var(--text-primary);
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 16px;
          }
          
          .no-bets-message {
            color: var(--text-secondary);
            margin-bottom: 24px;
            font-size: 16px;
            line-height: 1.5;
          }
          
          .no-bets-details {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: left;
          }
          
          .details-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 8px;
          }
          
          .details-row:last-child {
            margin-bottom: 0;
            border-bottom: none;
            padding-bottom: 0;
          }
          
          .details-label {
            font-weight: 600;
            color: var(--text-secondary);
          }
          
          .details-value {
            color: var(--text-primary);
            max-width: 250px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .no-bets-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
          }
          
          .action-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
          }
          
          .action-button.primary {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
          }
          
          .action-button.secondary {
            background: rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
            border: 1px solid rgba(139, 92, 246, 0.3);
          }
          
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          @keyframes pulse {
            0% { opacity: 0.6; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1.02); }
            100% { opacity: 0.6; transform: scale(0.98); }
          }
          
          @media (max-width: 640px) {
            .no-bets-actions {
              flex-direction: column;
            }
            
            .action-button {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`odds-table-card revamp${allCaps ? ' all-caps' : ''}`}>
      {/* format toggle (uncontrolled) */}
      {!oddsFormatProp && (
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:8 }}>
          <span style={{ opacity:.8, fontWeight:700, fontSize:'0.92em' }}>Odds:</span>
          {['american','decimal','fractional'].map(fmt => (
            <button key={fmt} type="button" onClick={()=>setOddsFormat(fmt)}
              style={{ padding:'4px 10px', borderRadius:8, border:'1px solid #334c',
                background: (oddsFormatState===fmt)?'var(--accent)':'#1c2238',
                color:(oddsFormatState===fmt)?'#fff':'#e7ecff', fontWeight:700 }}>
              {fmt[0].toUpperCase()+fmt.slice(1)}
            </button>
          ))}
        </div>
      )}

      <table className="odds-grid" data-mode={mode}>
        <thead>
          <tr>
            <th className="ev-col sort-th" onClick={()=>setSort(s=>({ key:'ev', dir:s.key==='ev'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">EV % <span className="sort-indicator">{sort.key==='ev'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'match', dir:s.key==='match'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Match <span className="sort-indicator">{sort.key==='match'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th>Team / Line</th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'book', dir:s.key==='book'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Book <span className="sort-indicator">{sort.key==='book'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'odds', dir:s.key==='odds'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Odds <span className="sort-indicator">{sort.key==='odds'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th>De-Vig</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row) => {
            const ev = evMap.get(row.key);
            const fair = fairDevigMap.get(row.key);
            const oddsChange = priceDelta[row.key];
            const renderMobileTeam = () => {
              if (mode === "props") {
                return (
                  <div 
                    className="mob-player-prop" 
                    data-sport={row.game?.sport_key?.split('_')[0] || ''}
                  >
                    <div className="mob-player-name">
                      {/* For soccer props and other props where player name might be in different fields */}
                      {row.playerName || row.out.description || 
                       (row.game?.sport_key?.includes('soccer') && row.out.name !== 'Yes' && row.out.name !== 'No' && 
                        row.out.name !== 'Over' && row.out.name !== 'Under' ? row.out.name : null) || 
                       'Player'}
                      
                      {/* Add Yes/No indicator for goal scorer markets */}
                      {row.game?.sport_key?.includes('soccer') && 
                       (row.out.name === 'Yes' || row.out.name === 'No') && 
                       row.mkt?.key?.includes('goal_scorer') && (
                        <span className={`yes-no-prop ${row.out.name.toLowerCase()}`}>
                          {row.out.name}
                        </span>
                      )}
                    </div>
                    <div 
                      className="mob-prop-type"
                      data-market={row.mkt?.key?.replace(/player_|_/g, '_').toUpperCase()}
                    >
                      {row.mkt.name}
                    </div>
                  </div>
                );
              }

              if (String(row.mkt?.key || '').includes('total')) {
                return null;
              }

              const originalName = row.out?.name || '';
              if (!originalName) return null;

              const logoSrc = getTeamLogoForGame(row.game, originalName);

              const teamNameDisplay = (() => {
                const baseName = (row.mkt?.key || '') === 'h2h'
                  ? shortTeam(originalName, row.game?.sport_key)
                  : shortTeam(originalName, row.game?.sport_key) || originalName;

                const homeShort = shortTeam(row.game?.home_team, row.game?.sport_key);
                const awayShort = shortTeam(row.game?.away_team, row.game?.sport_key);

                if (homeShort === awayShort && baseName === homeShort) {
                  const isHome = originalName === row.game?.home_team;
                  return `${baseName} ${isHome ? '(H)' : '(A)'}`;
                }

                return baseName;
              })();

              return (
                <div className="mob-team-row">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={`${originalName} logo`}
                      className="mob-team-logo"
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : null}
                  <span>{teamNameDisplay}</span>
                </div>
              );
            };

            return (
              <React.Fragment key={row.key}>
                {/* Desktop / tablet row (unchanged) */}
                <tr className={`odds-row${expandedRows[row.key] ? " expanded" : ""}`} onClick={()=>toggleRow(row.key)} style={{ cursor:"pointer" }}>
                  <td className={`ev-col ${ev && ev > 0 ? 'positive' : 'negative'}`}>
                    <div className="ev-col-content">
                      {typeof ev === "number" ? (<span className="ev-chip">{ev.toFixed(2)}%</span>) : ""}
                      <button 
                        className="desktop-add-pick-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAddBet) {
                            addToBetSlip(row, { bookmaker: row.bk, book: row.bk?.title }, e.target);
                          } else {
                            addToPicks(row, { bookmaker: row.bk, book: row.bk?.title }, false, e.target);
                          }
                        }}
                        title={onAddBet ? "Add to Bet Slip" : "Add to My Picks"}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="desktop-matchup">
                      <span className="desktop-matchup-time">{formatKickoffNice(row.game?.commence_time)}</span>
                      <div className="desktop-teams">
                        <div className="desktop-team-row">
                          {(() => {
                            const awayLogo = getTeamLogoForGame(row.game, row.game?.away_team);
                            return awayLogo ? (
                              <img
                                src={awayLogo}
                                alt={`${row.game?.away_team || 'Away'} logo`}
                                className="desktop-team-logo"
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : null;
                          })()}
                          <span>{row.game?.away_team || 'Away Team'}</span>
                        </div>
                        <div className="desktop-team-row">
                          {(() => {
                            const homeLogo = getTeamLogoForGame(row.game, row.game?.home_team);
                            return homeLogo ? (
                              <img
                                src={homeLogo}
                                alt={`${row.game?.home_team || 'Home'} logo`}
                                className="desktop-team-logo"
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : null;
                          })()}
                          <span>{row.game?.home_team || 'Home Team'}</span>
                        </div>
                      </div>
                      <span className="desktop-matchup-league">
                        {(() => { 
                          const { sport, league } = getSportLeague(row.game?.sport_key, row.game?.sport_title); 
                          return `${sport} | ${league}`; 
                        })()}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', flexDirection:'column', gap:2, textAlign:'left' }}>
                      <span 
                        style={{ fontWeight:800 }}
                        title={mode === "props" ? getYesBetExplanation(row.mkt?.key, row.out?.name) : null}
                      >
                        {mode === "props" 
                          ? (row.out?.description || row.out?.name || '')
                          : (row.mkt?.key || '') === 'h2h'
                            ? shortTeam(row.out?.name, row.game?.sport_key)
                            : (row.out?.name || '')}
                        {/* Add line inline with team name */}
                        {mode === "props" 
                          ? (row.out?.point ? ` ${row.out.point}` : '')
                          : ((row.mkt?.key || '') !== 'h2h' && row.out?.point ? ` ${formatLine(row.out.point, row.mkt.key, 'game')}` : '')}
                      </span>
                      <span style={{ opacity:.9 }}>
                        {formatMarket(row.mkt?.key || '')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {logos[row.bk?.key] && (
                        <img 
                          src={logos[row.bk.key]} 
                          alt={cleanBookTitle(row.bk.title)}
                          className="bookmaker-logo"
                          style={{
                            width: '20px',
                            height: '20px',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                      {cleanBookTitle(row.bk.title)}
                    </div>
                  </td>
                  <td className={oddsChange ? (oddsChange === 'up' ? 'flash-up' : 'flash-down') : ''}>
                    <span className="odds-main odds-best">
                      {(() => {
                        const n = Number(row.out.price ?? row.out.odds ?? 0);
                        if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
                        if (currentOddsFormat === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                        const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                        const den = n > 0 ? 100 : Math.round(Math.abs(n));
                        const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                        return `${num/g}/${den/g}`;
                      })()}
                    </span>
                  </td>
                  <td>{fair != null ? (Number(fair) > 0 ? `+${fair}` : `${fair}`) : ''}</td>
                </tr>

                {/* ----- Mobile card (click to expand) ----- */}
                <tr className="mobile-card-row" aria-hidden={false}>
                  <td colSpan={6}>
                    <div
                      className={`mobile-odds-card as-button ${expandedRows[row.key] ? 'expanded' : ''}`}
                      onClick={()=>toggleRow(row.key)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e)=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); toggleRow(row.key); } }}
                    >
                      <div className="mob-top">
                        <div className="mob-top-left">
                          <div className="mob-match-title">
                            <div className="team-line">
                              {(() => {
                                const awayLogo = getTeamLogoForGame(row.game, row.game?.away_team);
                                return awayLogo ? (
                                  <img
                                    src={awayLogo}
                                    alt={`${row.game?.away_team || 'Away'} logo`}
                                    className="mob-team-logo"
                                    loading="lazy"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : null;
                              })()}
                              <span>{row.game?.away_team || 'Away Team'}</span>
                            </div>
                            <div className="team-line">
                              {(() => {
                                const homeLogo = getTeamLogoForGame(row.game, row.game?.home_team);
                                return homeLogo ? (
                                  <img
                                    src={homeLogo}
                                    alt={`${row.game?.home_team || 'Home'} logo`}
                                    className="mob-team-logo"
                                    loading="lazy"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : null;
                              })()}
                              <span>{row.game?.home_team || 'Home Team'}</span>
                            </div>
                          </div>
                          <div className="mob-meta">
                            {formatKickoffNice(row.game.commence_time)} • {(() => {
                              const { sport, league } = getSportLeague(row.game.sport_key, row.game.sport_title);
                              return `${sport} | ${league}`;
                            })()}
                          </div>
                        </div>
                        <div className="mob-ev-section">
                          <div className={`mob-ev ${ev && ev > 0 ? 'pos' : 'neg'}`}>
                            {typeof ev === 'number' ? `${ev.toFixed(2)}%` : ''}
                          </div>
                          <button 
                            className="mob-add-pick-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onAddBet) {
                                addToBetSlip(row, { bookmaker: row.bk, book: row.bk?.title }, e.target);
                              } else {
                                addToPicks(row, { bookmaker: row.bk, book: row.bk?.title }, false, e.target);
                              }
                            }}
                            title={onAddBet ? "Add to Bet Slip" : "Add to My Picks"}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Team name or Player name for props */}
                      {(() => {
                        const teamNode = renderMobileTeam();
                        if (!teamNode) return null;
                        return (
                          <div className="mob-team">
                            {teamNode}
                          </div>
                        );
                      })()}

                      {/* Market type and line - now appears below team */}
                      <div className="mob-market-row">
                        <div className="mob-market">
                          {mode === "props" ? (
                            // For player props, show Over/Under with line
                            <div className="mob-prop-bet">
                              <span 
                                className={`mob-prop-side ${row.out.name === 'Over' ? 'over' : 'under'}`}
                                title={getYesBetExplanation(row.mkt?.key, row.out?.name)}
                              >
                                {row.out.name} {row.out.point}
                              </span>
                            </div>
                          ) : (
                            <>
                              {String(row.mkt?.key).includes('total') ? (
                                <div className="mob-total-stack">
                                  <div className="mob-total-market">TOTAL</div>
                                </div>
                              ) : (
                                formatMarket(row.mkt?.key || '')
                              )}
                            </>
                          )}
                        </div>
                        <div className="mob-line">{mode === "props" ? '' : ((row.mkt.key || '') === 'h2h' ? '' : formatLine(row.out.point, row.mkt.key, 'game'))}</div>
                      </div>

                      {/* Bottom row: Sportsbook name left, odds and pick button right */}
                      <div className="mob-bottom-row">
                        <div className="mob-book">
                          {logos[row.bk?.key] && (
                            <img 
                              src={logos[row.bk?.key]} 
                              alt={cleanBookTitle(row.bk?.title)}
                              className="bookmaker-logo"
                              style={{
                                width: '20px',
                                height: '20px',
                                marginRight: '6px',
                                objectFit: 'contain'
                              }}
                            />
                          )}
                          {cleanBookTitle(row.bk?.title)}
                        </div>
                        <div className="mob-right-section">
                          <div className={`mob-odds-container ${priceDelta[row.key] ? (priceDelta[row.key] === 'up' ? 'up' : 'down') : ''}`}>
                            <span className="mob-odds">
                              {(() => {
                                const n = Number(row.out.price ?? row.out.odds ?? 0);
                                if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
                                if (currentOddsFormat === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                                const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                                const den = n > 0 ? 100 : Math.round(Math.abs(n));
                                const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                                return `${num/g}/${den/g}`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>


                      {/* ---- MOBILE VERTICAL MINI-TABLE (expands downward only) ---- */}
                      {expandedRows[row.key] && (
                        <div className="mini-swipe" role="region" aria-label="Compare books">
                          {/* Header row */}
                          <div className="mini-swipe-header">
                            <div className="mini-header-book">Book</div>
                            {mode === "props" ? (
                              row.isCombinedProp ? (
                                <>
                                  <div className="mini-header-odds">Over</div>
                                  <div className="mini-header-odds">Under</div>
                                </>
                              ) : (
                                <div className="mini-header-odds mini-props-header">Odds</div>
                              )
                            ) : (
                              <>
                                <div className="mini-header-odds">
                                  {String(row.mkt?.key).includes('total') ? 'Over' : shortTeam(row.game.home_team, row.game.sport_key)}
                                </div>
                                <div className="mini-header-odds">
                                  {String(row.mkt?.key).includes('total') ? 'Under' : shortTeam(row.game.away_team, row.game.sport_key)}
                                </div>
                              </>
                            )}
                            <div className="mini-header-pick">Pick</div>
                          </div>

                          {/* Book rows */}
                          {(() => {
                            const toDec = (n) => {
                              const v = Number(n || 0);
                              if (!v) return 0;
                              return v > 0 ? (v / 100) + 1 : (100 / Math.abs(v)) + 1;
                            };
                            const mkRow = String(row?.mkt?.key || '').toLowerCase();
                            const isML = (mkRow === 'h2h' || mkRow.endsWith('moneyline'));
                            const isTotals = mkRow.includes('total');
                            const isSpreads = mkRow.includes('spread');
                            const oPointStr = String(row.out.point ?? '');

                            // Priority bookmakers to show in the mini-table
                            // For player props, show ALL books for better EV calculations
                            // For regular odds, limit to priority books for cleaner display
                            const maxMiniBooks = mode === "props" ? 50 : MINI_TABLE_PRIORITY_BOOKS.length;

                            const dedupedBooks = (() => {
                              const seenKeys = new Set();
                              
                              // Mini-table should ALWAYS show all available books for comparison
                              // The main table filter should NOT affect the mini-table
                              let booksToProcess = row.allBooks || [];
                              
                              console.log(`🎯 Mini table: Always showing all ${booksToProcess.length} available books for comparison`);
                              
                              // Debug logging for Matthew Stafford prop
                              if (row.playerName === 'Matthew Stafford' && row.mkt?.key?.includes('pass_attempts')) {
                                console.log(`🔍 MINI TABLE DEBUG for ${row.playerName} ${row.mkt?.key}:`, {
                                  allBooksCount: row.allBooks?.length || 0,
                                  allBooks: row.allBooks?.map(b => ({ 
                                    book: b.bookmaker?.key || b.book, 
                                    odds: b.price || b.odds,
                                    name: b.name 
                                  })),
                                  overBooksCount: row.overBooks?.length || 0,
                                  underBooksCount: row.underBooks?.length || 0,
                                  isCombinedProp: row.isCombinedProp
                                });
                              }
                              
                              console.log(`🎯 Mini table for ${row.key}: Using ${booksToProcess.length} books (${mode === "props" && bookFilter && bookFilter.length > 0 ? 'non-selected' : 'all'} books)`);
                              if (mode === "props" && bookFilter && bookFilter.length > 0) {
                                console.log(`🎯 Selected books: ${row.selectedBooks?.length || 0}, Non-selected books: ${row.nonSelectedBooks?.length || 0}`);
                                console.log(`🎯 All books available: ${row.allBooks?.length || 0}`);
                                console.log(`🎯 BookFilter:`, bookFilter);
                                if (row.nonSelectedBooks?.length === 0 && row.allBooks?.length > 0) {
                                  console.log(`🎯 WARNING: No non-selected books found, but ${row.allBooks.length} total books available`);
                                  console.log(`🎯 All books:`, row.allBooks.map(b => b.bookmaker?.key || b.book));
                                }
                              }
                              
                              // For combined props, ensure we get all unique bookmakers from both sides
                              if (mode === "props" && row.isCombinedProp) {
                                const allBookmakers = new Map();
                                
                                // Collect all unique bookmakers from both Over and Under
                                [...(row.overBooks || []), ...(row.underBooks || [])].forEach(book => {
                                  const key = normalizeBookKey(book.bookmaker?.key);
                                  if (key && !allBookmakers.has(key)) {
                                    allBookmakers.set(key, {
                                      bookmaker: book.bookmaker,
                                      book: book.book || book.bookmaker?.title,
                                      price: book.price || book.odds, // Use first found price as placeholder
                                      odds: book.odds || book.price
                                    });
                                  }
                                });
                                
                                booksToProcess = Array.from(allBookmakers.values());
                              }
                              
                              return booksToProcess.filter(item => {
                                const rawKey = item?.bookmaker?.key || item?.book || '';
                                const key = normalizeBookKey(rawKey);
                                if (!key || seenKeys.has(key)) return false;
                                seenKeys.add(key);
                                return true;
                              });
                            })();

                            const prioritizedBooks = [];
                            const fallbackBooks = [];
                            dedupedBooks.forEach(item => {
                              const keySource = item?.bookmaker?.key || item?.book;
                              if (isMiniTablePriorityBook(keySource)) {
                                prioritizedBooks.push(item);
                              } else {
                                fallbackBooks.push(item);
                              }
                            });

                            const oddsCompare = (a, b) => toDec(b.price ?? b.odds) - toDec(a.price ?? a.odds);

                            const sortedPrioritized = prioritizedBooks.slice().sort((a, b) => {
                              const aPriority = getMiniTablePriorityIndex(a.bookmaker?.key || a.book);
                              const bPriority = getMiniTablePriorityIndex(b.bookmaker?.key || b.book);
                              const safeAPriority = aPriority === -1 ? 999 : aPriority;
                              const safeBPriority = bPriority === -1 ? 999 : bPriority;
                              if (safeAPriority !== safeBPriority) {
                                return safeAPriority - safeBPriority;
                              }
                              return oddsCompare(a, b);
                            });

                            const sortedFallback = fallbackBooks.slice().sort((a, b) => {
                              const aPriority = getBookPriority(a.bookmaker?.key || a.book);
                              const bPriority = getBookPriority(b.bookmaker?.key || b.book);
                              if (aPriority !== bPriority) {
                                return aPriority - bPriority;
                              }
                              return oddsCompare(a, b);
                            });

                            const combinedBooks = [...sortedPrioritized, ...sortedFallback].slice(0, maxMiniBooks);

                            const normalizeBookKeyForEntry = (entry) => normalizeBookKey(entry?.bookmaker?.key || entry?.book || '');

                            const topEntry = row.bk ? {
                              price: row.out?.price,
                              odds: row.out?.price,
                              book: row.bk?.title,
                              bookmaker: row.bk,
                              market: row.mkt,
                              point: row.out?.point
                            } : null;

                            const orderedBooks = [];
                            const seenBookKeys = new Set();

                            const pushEntry = (entry) => {
                              if (!entry) return;
                              const key = normalizeBookKeyForEntry(entry);
                              if (!key || seenBookKeys.has(key)) return;
                              seenBookKeys.add(key);
                              orderedBooks.push(entry);
                            };

                            pushEntry(topEntry);
                            combinedBooks.forEach(pushEntry);

                            let cols = orderedBooks;
                            
                            // For combined Over/Under props, add the other side books to mini-table
                            if (mode === "props" && row.otherSideBooks && row.otherSideBooks.length > 0) {
                              const otherSideEntries = row.otherSideBooks.map(book => ({
                                price: book.price,
                                odds: book.price,
                                book: `${book.book} (${row.otherSideName})`,
                                bookmaker: book.bookmaker,
                                market: book.market,
                                isOtherSide: true,
                                otherSideName: row.otherSideName
                              }));
                              
                              // Add other side books to the mini-table, avoiding duplicates
                              otherSideEntries.forEach(entry => {
                                const key = normalizeBookKeyForEntry(entry);
                                if (key && !seenBookKeys.has(key + '-other')) {
                                  seenBookKeys.add(key + '-other');
                                  cols.push(entry);
                                }
                              });
                            }

                            const grab = (ob, top) => {
                              // For player props mode, return the odds directly
                              if (mode === "props") {
                                return ob.price ?? ob.odds ?? '';
                              }
                              
                              // Get all possible outcomes
                              let outs = [];
                              if (Array.isArray(ob?.market?.outcomes)) {
                                outs = ob.market.outcomes;
                              } else if (Array.isArray(ob?.outcomes)) {
                                outs = ob.outcomes;
                              } else if (ob?.bookmaker && Array.isArray(ob.bookmaker.markets)) {
                                const market = ob.bookmaker.markets.find(m => m.key === row.mkt?.key);
                                if (market && Array.isArray(market.outcomes)) {
                                  outs = market.outcomes;
                                }
                              }

                              // Special handling for spreads - we want to match the exact point spread
                              if (isSpreads && outs.length > 0) {
                                // Determine which team this column represents and what point to expect
                                const teamName = top ? row.game.home_team : row.game.away_team;
                                const rowPoint = Number(row.out.point ?? 0) || 0;
                                // If this column is for the same team as the base row outcome,
                                // use the same point; otherwise use the opposite sign.
                                const expectedPoint = (row.out.name === teamName) ? rowPoint : -rowPoint;
                                const teamLower = String(teamName).toLowerCase();
                                const within = (a, b) => Math.abs(Number(a) - Number(b)) < 0.11; // small tolerance

                                // 1) Exact match on team and point
                                let match = outs.find(o => o && String(o.name).toLowerCase() === teamLower && within(o.point, expectedPoint));

                                // 2) If not found, try matching same team with opposite point sign (books can invert sides)
                                if (!match) {
                                  match = outs.find(o => o && String(o.name).toLowerCase() === teamLower && within(o.point, -expectedPoint));
                                }

                                // 3) If still not found, match on team only
                                if (!match) {
                                  match = outs.find(o => o && String(o.name).toLowerCase() === teamLower);
                                }

                                if (match) {
                                  return match.price ?? match.odds ?? '';
                                }
                              }
                              if (isML) {
                                const name = top ? row.game.home_team : row.game.away_team;
                                const f = outs.find(x => x && x.name === name);
                                const result = f ? (f.price ?? f.odds) : '';
                                console.log('ML result:', { name, found: f, result });
                                return result;
                              }
                              if (isTotals) {
                                const name = top ? 'Over' : 'Under';
                                const f = outs.find(x => x && x.name === name && String(x.point ?? '') === oPointStr);
                                const result = f ? (f.price ?? f.odds) : '';
                                console.log('Totals result:', { name, point: oPointStr, found: f, result });
                                return result;
                              }
                              // Spreads handling is now done in the main grab function
                              return '';
                            };

                            const formatOdds = (n) => {
                              if (!n && n !== 0) return '';
                              if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
                              if (currentOddsFormat === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                              const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                              const den = n > 0 ? 100 : Math.round(Math.abs(n));
                              const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                              return `${num/g}/${den/g}`;
                            };

                            return (
                              <>
                                {cols.map((ob, i) => (
                                <div className="mini-swipe-row" key={ob._rowId || i}>
                                  <div className="mini-book-col">
                                    {mode === "props" ? (
                                      <div className="mini-prop-info">
                                        <div className="mini-prop-book">
                                          {logos[ob.bookmaker?.key] && (
                                            <img 
                                              src={logos[ob.bookmaker?.key]} 
                                              alt={cleanBookTitle(ob.book)}
                                              className="bookmaker-logo"
                                              style={{
                                                width: '16px',
                                                height: '16px',
                                                marginRight: '4px',
                                                objectFit: 'contain'
                                              }}
                                            />
                                          )}
                                          {cleanBookTitle(ob.book)}
                                        </div>
                                        <div className="mini-prop-side">
                                          {row.out.name} {row.out.point}
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {logos[ob.bookmaker?.key] && (
                                          <img 
                                            src={logos[ob.bookmaker?.key]} 
                                            alt={cleanBookTitle(ob.book)}
                                            className="bookmaker-logo"
                                            style={{
                                              width: '16px',
                                              height: '16px',
                                              marginRight: '4px',
                                              objectFit: 'contain'
                                            }}
                                          />
                                        )}
                                        {cleanBookTitle(ob.book)}
                                      </div>
                                    )}
                                  </div>
                                  {mode === "props" ? (
                                    // For props, show appropriate columns based on type
                                    row.isCombinedProp ? (
                                      // Combined Over/Under props - show both columns
                                      <>
                                        <div className="mini-odds-col">
                                          <div className="mini-swipe-odds">
                                            {(() => {
                                              // Find Over odds for this bookmaker
                                              const overBook = row.overBooks?.find(book => 
                                                normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(ob.bookmaker?.key)
                                              );
                                              return overBook ? formatOdds(Number(overBook.price ?? overBook.odds ?? 0)) : '-';
                                            })()}
                                          </div>
                                        </div>
                                        <div className="mini-odds-col">
                                          <div className="mini-swipe-odds">
                                            {(() => {
                                              // Find Under odds for this bookmaker
                                              const underBook = row.underBooks?.find(book => 
                                                normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(ob.bookmaker?.key)
                                              );
                                              return underBook ? formatOdds(Number(underBook.price ?? underBook.odds ?? 0)) : '-';
                                            })()}
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      // Regular props - show single odds column
                                      <>
                                        <div className="mini-odds-col">
                                          <div className="mini-swipe-odds">
                                            {formatOdds(Number(ob.price ?? ob.odds ?? 0))}
                                          </div>
                                        </div>
                                      </>
                                    )
                                  ) : (
                                    // For regular games, show two odds columns
                                    <>
                                      <div className="mini-odds-col">
                                        <div className="mini-swipe-odds">
                                          {formatOdds(Number(grab(ob, true)))}
                                        </div>
                                      </div>
                                      <div className="mini-odds-col">
                                        <div className="mini-swipe-odds">
                                          {formatOdds(Number(grab(ob, false)))}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  <div className="mini-pick-col">
                                    <button 
                                      className="add-pick-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onAddBet) {
                                          addToBetSlip(row, ob, e.target);
                                        } else {
                                          addToPicks(row, ob, true, e.target);
                                        }
                                      }}
                                      title={onAddBet ? "Add to Bet Slip" : "Add to My Picks"}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                ))}
                                
                                {/* Show book count for player props */}
                                {mode === "props" && cols.length > 0 && (
                                  <div style={{
                                    textAlign: 'center',
                                    padding: '8px',
                                    fontSize: '11px',
                                    color: 'var(--text-secondary)',
                                    borderTop: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)'
                                  }}>
                                    Showing {cols.length} book{cols.length !== 1 ? 's' : ''} for EV calculation
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Desktop/Tablet mini-table (hide on mobile via CSS) */}
                {expandedRows[row.key] && ((mode === "props" && bookFilter && bookFilter.length > 0) 
                  ? (row.nonSelectedBooks && row.nonSelectedBooks.length > 0)
                  : (row.allBooks && row.allBooks.length > 0)) && (
                  <tr className="desktop-mini-wrap">
                    <td colSpan={8}>
                      <div className="mini-odds-container">
                        <table className="mini-odds-table">
                          <thead>
                            <tr>
                              <th>Sportsbook</th>
                              {mode === "props" ? (
                                <th>Odds</th>
                              ) : (
                                <>
                                  <th>{shortTeam(row.game.home_team, row.game.sport_key)}</th>
                                  <th>{shortTeam(row.game.away_team, row.game.sport_key)}</th>
                                </>
                              )}
                              <th>Add Pick</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const seenMiniBooks = new Set();
                              const dedupedBooks = (row.allBooks || []).filter(book => {
                                const rawKey = book?.bookmaker?.key || book?.book || '';
                                const key = normalizeBookKey(rawKey);
                                if (!key || seenMiniBooks.has(key)) return false;
                                seenMiniBooks.add(key);
                                return true;
                              });

                              const prioritizedDesktop = [];
                              const fallbackDesktop = [];
                              dedupedBooks.forEach(book => {
                                const sourceKey = book?.bookmaker?.key || book?.book;
                                if (isMiniTablePriorityBook(sourceKey)) {
                                  prioritizedDesktop.push(book);
                                } else {
                                  fallbackDesktop.push(book);
                                }
                              });

                              const toDec = (n) => {
                                const v = Number(n || 0);
                                if (!v) return 0;
                                return v > 0 ? (v / 100) + 1 : (100 / Math.abs(v)) + 1;
                              };
                              const compareOdds = (a, b) => toDec(b.price ?? b.odds) - toDec(a.price ?? a.odds);

                              const sortedPrioritizedDesktop = prioritizedDesktop.slice().sort((a, b) => {
                                const aPriority = getMiniTablePriorityIndex(a.bookmaker?.key || a.book);
                                const bPriority = getMiniTablePriorityIndex(b.bookmaker?.key || b.book);
                                const safeAPriority = aPriority === -1 ? 999 : aPriority;
                                const safeBPriority = bPriority === -1 ? 999 : bPriority;
                                if (safeAPriority !== safeBPriority) {
                                  return safeAPriority - safeBPriority;
                                }
                                return compareOdds(a, b);
                              });

                              const sortedFallbackDesktop = fallbackDesktop.slice().sort((a, b) => {
                                const aPriority = getBookPriority(a.bookmaker?.key || a.book);
                                const bPriority = getBookPriority(b.bookmaker?.key || b.book);
                                if (aPriority !== bPriority) {
                                  return aPriority - bPriority;
                                }
                                return compareOdds(a, b);
                              });

                              // For player props, show ALL books for better EV calculations
                              // For regular odds, limit to priority books for cleaner display
                              const maxDesktopBooks = mode === "props" ? 50 : MINI_TABLE_PRIORITY_BOOKS.length;
                              const displayBooks = [...sortedPrioritizedDesktop, ...sortedFallbackDesktop]
                                .slice(0, maxDesktopBooks);

                              return (
                                <>
                                  {displayBooks.map((p, i) => (
                                <tr key={p._rowId || i}>
                                  <td className="mini-book-cell">
                                    {logos[p.bookmaker?.key] && (
                                      <img 
                                        src={logos[p.bookmaker?.key]} 
                                        alt={cleanBookTitle(p.book)}
                                        className="mini-book-logo"
                                      />
                                    )}
                                    <span>{cleanBookTitle(p.book)}</span>
                                  </td>
                                  
                                  {mode === "props" ? (
                                    <td className="mini-odds-cell">
                                      {formatOdds(Number(p.price ?? p.odds ?? 0))}
                                    </td>
                                  ) : (
                                    <>
                                      <td className="mini-odds-cell">
                                        {formatOdds(Number(grab(p, true)))}
                                      </td>
                                      <td className="mini-odds-cell">
                                        {formatOdds(Number(grab(p, false)))}
                                      </td>
                                    </>
                                  )}
                                  
                                  <td className="mini-pick-col">
                                    <button 
                                      className="add-pick-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onAddBet) {
                                          addToBetSlip(row, p, e.target);
                                        } else {
                                          addToPicks(row, p, true, e.target);
                                        }
                                      }}
                                      title={onAddBet ? "Add to Bet Slip" : "Add to My Picks"}
                                    >
                                      +
                                    </button>
                                  </td>
                                </tr>
                                  ))}
                                  
                                  {/* Show book count for player props - add as last row */}
                                  {mode === "props" && displayBooks.length > 0 && (
                                    <tr>
                                      <td colSpan={mode === "props" ? 2 : 3} style={{
                                        textAlign: 'center',
                                        padding: '8px',
                                        fontSize: '11px',
                                        color: 'var(--text-secondary)',
                                        borderTop: '1px solid var(--border-color)',
                                        background: 'var(--bg-secondary)'
                                      }}>
                                        Showing {displayBooks.length} book{displayBooks.length !== 1 ? 's' : ''} for EV calculation
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
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
        <div className="pagination-bar" style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:".4em", margin:"2em 0" }}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:"0.45em 1.2em", borderRadius:8, border:"none", background: page===1?"#aaa":"var(--accent)", color:"#fff", fontWeight:600 }}>Prev</button>
          {Array.from({length:Math.min(5,totalPages)}).map((_,i)=>{
            const num = Math.max(1, page-2)+i;
            if (num>totalPages) return null;
            return <button key={num} onClick={()=>setPage(num)} disabled={num===page} style={{ padding:"0.45em 1.1em", borderRadius:8, border:"none", background:num===page?"var(--accent)":"#222c", color:"#fff", fontWeight:600 }}>{num}</button>;
          })}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:"0.45em 1.2em", borderRadius:8, border:"none", background: page===totalPages?"#aaa":"var(--accent)", color:"#fff", fontWeight:600 }}>Next</button>
        </div>
      )}
    </div>
  );
}
