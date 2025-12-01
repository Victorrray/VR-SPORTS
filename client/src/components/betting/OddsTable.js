import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './OddsTable.css';
import { useBetSlip } from '../../contexts/BetSlipContext';
import { TrendingUp, TrendingDown, Trophy, ChevronDown } from 'lucide-react';
import { getBestLink, supportsDeepLinking } from '../../utils/deepLinkBuilder';
import { useMe } from '../../hooks/useMe';
import EnhancedLoadingSpinner from '../common/EnhancedLoadingSpinner';
import OddsTableSkeleton, { OddsTableSkeletonMobile } from "./OddsTableSkeleton";
import "./OddsTable.desktop.css";
import "./OddsTable.soccer.css";
// Import team logo utilities
import { resolveTeamLogo } from "../../utils/logoResolver";
import { getTeamLogos } from "../../constants/teamLogos";

// Import player prop utilities
import { extractPlayerName, formatMarketName, getYesNoExplanation } from "../../utils/playerPropUtils";

// Import market name cache utility
import { getMarketDisplayName as getCachedMarketName } from "../../utils/marketNameCache";

// Use the imported utility function
const getYesBetExplanation = getYesNoExplanation;

// Sportsbook logos removed for compliance, but team logos are available
const logos = {};

// Centralized priority list for the mini-table comparison view
// These books appear first in the mini-table, in this order
const MINI_TABLE_PRIORITY_BOOKS = [
  'draftkings',
  'fanduel',
  'caesars',
  'betmgm',
  'pinnacle',
  'novig',
  'prophetx'
];

// Fallback books to fill the mini-table if priority books aren't available
// These appear after priority books, sorted by odds quality
const MINI_TABLE_FALLBACK_BOOKS = [
  'prizepicks',
  'underdog',
  'dabble_au',
  'espnbet',
  'betrivers',
  'unibet',
  'wynnbet',
  'pointsbet',
  'hardrock',
  'fanatics',
  'betonline',
  'bovada',
  'mybookie'
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

/* ---------- Market Status Detection ---------- */
function isMarketLikelyLocked(book, isDFSApp = false) {
  if (!book) return false;
  
  // Check for missing/invalid odds first
  const odds = Number(book.price ?? book.odds ?? 0);
  if (!odds || odds === 0) {
    console.log(`🔒 Market locked: ${book.bookmaker?.key} - missing or zero odds`);
    return true;
  }
  
  // Check for extreme odds that indicate locked market
  if (Math.abs(odds) > 5000) {
    console.log(`🔒 Market locked: ${book.bookmaker?.key} - extreme odds ${odds}`);
    return true;
  }
  
  // Only check timestamp if we have it (API may not always provide last_update)
  if (book.last_update) {
    // DFS apps lock markets much faster than traditional sportsbooks
    const staleThresholdMinutes = isDFSApp ? 5 : 15;
    
    const lastUpdate = new Date(book.last_update);
    const now = new Date();
    const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);
    
    if (minutesSinceUpdate > staleThresholdMinutes) {
      console.log(`🔒 Market locked: ${book.bookmaker?.key} - last update ${minutesSinceUpdate.toFixed(0)} minutes ago (threshold: ${staleThresholdMinutes}m)`);
      return true;
    }
  }
  
  // If no timestamp data, assume market is active (can't determine lock status)
  return false;
}

/* ---------- DFS Apps Odds Override (must be before calculateEV) ---------- */
// DFS apps (PrizePicks, Underdog, DraftKings Pick 6, Dabble) always have -119 odds
const DFS_APPS_LIST = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble', 'dabble_au'];
const DFS_FIXED_ODDS = -119;

function isDFSAppForEV(bookKey) {
  if (!bookKey) return false;
  const normalized = String(bookKey).toLowerCase();
  return DFS_APPS_LIST.some(app => normalized.includes(app) || app.includes(normalized));
}

/* ---------- Helpers (unchanged core math) ---------- */
function calculateEV(odds, fairLine, bookmakerKey = null) {
  if (!odds || !fairLine) return null;
  const toDec = o => (o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1);
  
  // Check if this is a DFS app - use fixed -119 odds for EV calculation
  if (isDFSAppForEV(bookmakerKey)) {
    // DFS apps always have -119 odds for EV calculation
    // This ensures EV is calculated based on the actual -119 payout, not API odds
    const dfsDec = toDec(DFS_FIXED_ODDS); // -119
    const fairDec = toDec(fairLine);
    
    // Calculate EV: Compare -119 payout to market consensus (fair line)
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
  
  // Quarter/Half/Period markets
  if (k === "h2h_q1") return "1st Quarter Moneyline";
  if (k === "h2h_q2") return "2nd Quarter Moneyline";
  if (k === "h2h_q3") return "3rd Quarter Moneyline";
  if (k === "h2h_q4") return "4th Quarter Moneyline";
  if (k === "h2h_h1") return "1st Half Moneyline";
  if (k === "h2h_h2") return "2nd Half Moneyline";
  if (k === "h2h_p1") return "1st Period Moneyline";
  if (k === "h2h_p2") return "2nd Period Moneyline";
  if (k === "h2h_p3") return "3rd Period Moneyline";
  
  // 3-way markets
  if (k === "h2h_3_way") return "3-Way Moneyline";
  if (k === "h2h_3_way_q1") return "1st Quarter 3-Way";
  if (k === "h2h_3_way_q2") return "2nd Quarter 3-Way";
  if (k === "h2h_3_way_q3") return "3rd Quarter 3-Way";
  if (k === "h2h_3_way_q4") return "4th Quarter 3-Way";
  if (k === "h2h_3_way_h1") return "1st Half 3-Way";
  if (k === "h2h_3_way_h2") return "2nd Half 3-Way";
  if (k === "h2h_3_way_p1") return "1st Period 3-Way";
  if (k === "h2h_3_way_p2") return "2nd Period 3-Way";
  if (k === "h2h_3_way_p3") return "3rd Period 3-Way";
  
  // Spread markets with periods
  if (k === "spreads_q1") return "1st Quarter Spread";
  if (k === "spreads_q2") return "2nd Quarter Spread";
  if (k === "spreads_q3") return "3rd Quarter Spread";
  if (k === "spreads_q4") return "4th Quarter Spread";
  if (k === "spreads_h1") return "1st Half Spread";
  if (k === "spreads_h2") return "2nd Half Spread";
  if (k === "spreads_p1") return "1st Period Spread";
  if (k === "spreads_p2") return "2nd Period Spread";
  if (k === "spreads_p3") return "3rd Period Spread";
  
  // Totals markets with periods
  if (k === "totals_q1") return "1st Quarter Total";
  if (k === "totals_q2") return "2nd Quarter Total";
  if (k === "totals_q3") return "3rd Quarter Total";
  if (k === "totals_q4") return "4th Quarter Total";
  if (k === "totals_h1") return "1st Half Total";
  if (k === "totals_h2") return "2nd Half Total";
  if (k === "totals_p1") return "1st Period Total";
  if (k === "totals_p2") return "2nd Period Total";
  if (k === "totals_p3") return "3rd Period Total";
  
  // Alternate markets with periods
  if (k === "alternate_spreads_q1") return "1st Quarter Alt Spread";
  if (k === "alternate_spreads_q2") return "2nd Quarter Alt Spread";
  if (k === "alternate_spreads_q3") return "3rd Quarter Alt Spread";
  if (k === "alternate_spreads_q4") return "4th Quarter Alt Spread";
  if (k === "alternate_totals_q1") return "1st Quarter Alt Total";
  if (k === "alternate_totals_q2") return "2nd Quarter Alt Total";
  if (k === "alternate_totals_q3") return "3rd Quarter Alt Total";
  if (k === "alternate_totals_q4") return "4th Quarter Alt Total";
  
  // Team totals with periods
  if (k === "team_totals_q1") return "1st Quarter Team Total";
  if (k === "team_totals_q2") return "2nd Quarter Team Total";
  if (k === "team_totals_q3") return "3rd Quarter Team Total";
  if (k === "team_totals_q4") return "4th Quarter Team Total";
  if (k === "team_totals_h1") return "1st Half Team Total";
  if (k === "team_totals_h2") return "2nd Half Team Total";
  
  // Base markets
  if (k === "h2h") return "MONEYLINE";
  if (k.includes("spread")) return "SPREAD";
  if (k.includes("total")) return "TOTAL";
  if (k === "draw_no_bet") return "Draw No Bet";
  if (k === "btts") return "Both Teams to Score";
  
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

// Generate fallback logo URLs for a team
const getLogoFallbackUrls = (league = '', espnId = '') => {
  if (!league || !espnId) return [];
  const leagueCode = league.toLowerCase() === "ncaaf" ? "college-football" : league.toLowerCase();
  return [
    `https://a.espncdn.com/media/motion/2024/logos/${leagueCode}/teams/${espnId}.png`,
    `https://a.espncdn.com/media/motion/2023/logos/${leagueCode}/teams/${espnId}.png`,
    `https://a.espncdn.com/media/motion/2022/logos/${leagueCode}/teams/${espnId}.png`,
    `https://a.espncdn.com/media/motion/2021/logos/${leagueCode}/teams/${espnId}.png`,
    `https://a.espncdn.com/media/motion/2024/logos/${leagueCode}/teams/500/${espnId}.png`,
    `https://a.espncdn.com/media/motion/2023/logos/${leagueCode}/teams/500/${espnId}.png`
  ];
};

const getTeamLogoForGame = (game = {}, teamName = '') => {
  const key = normalizeTeamKey(teamName);
  if (!key) return '';
  
  const homeKey = normalizeTeamKey(game?.home_team);
  const awayKey = normalizeTeamKey(game?.away_team);
  
  let logoUrl = '';
  let isHomeTeam = false;
  
  // Check if this is home or away team
  if (key === homeKey) {
    isHomeTeam = true;
  } else if (key === awayKey) {
    isHomeTeam = false;
  }
  
  // Extract league from sport_key (e.g., "americanfootball_nfl" -> "nfl")
  const league = game?.sport_key?.split('_').pop() || '';
  
  // Try logo resolver first (ESPN CDN)
  logoUrl = resolveTeamLogo({
    league: league,
    teamName: teamName,
    apiLogo: null
  });
  
  // Debug logging to see what logos we're resolving
  if (process.env.NODE_ENV === 'development') {
    console.log(`🏈 Logo resolved for ${teamName}:`, {
      game_id: game?.id,
      sport: game?.sport_key,
      league: league,
      home_team: game?.home_team,
      away_team: game?.away_team,
      resolved_logo: logoUrl,
      isHomeTeam
    });
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

/* ---------- DFS Apps Odds Override ---------- */
// DFS apps (PrizePicks, Underdog, DraftKings Pick 6, Dabble) always have -119 odds
const DFS_APPS = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble', 'dabble_au'];
function isDFSApp(bookKey) {
  if (!bookKey) return false;
  const normalized = String(bookKey).toLowerCase();
  return DFS_APPS.some(app => normalized.includes(app) || app.includes(normalized));
}
function getDFSFixedOdds() {
  return -119;
}
// Get the display odds - returns -119 for DFS apps, otherwise the actual odds
function getDisplayOdds(odds, bookKey) {
  if (isDFSApp(bookKey)) {
    return getDFSFixedOdds();
  }
  return odds;
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
  mode = "game", // "game" | "props" | "arbitrage" | "middles"
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
  dataPoints = 10, // Minimum number of sportsbooks for a bet to be shown
  // Additional filter props for comprehensive mode support
  minProfit = null, // For arbitrage mode
  maxStake = null, // For arbitrage/middles mode
  minMiddleGap = null, // For middles mode
  minMiddleProbability = null, // For middles mode
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
  const [expandedMiniTables, setExpandedMiniTables] = useState({});
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
    setExpandedMiniTables({});
  }, [games]);

  // Save dataPoints to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dataPoints', dataPoints.toString());
    }
  }, [dataPoints]);

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
  const toggleMiniTable = key => setExpandedMiniTables(exp => ({ ...exp, [key]: !exp[key] }));

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
            
            // In props mode: only show player prop markets (for ALL bookmakers including DFS)
            // In regular mode: only show regular markets (h2h, spreads, totals)
            if (mode === 'props') {
              // ALWAYS require player prop markets, even for DFS sites
              if (!isPlayerPropMarket) {
                console.log(`🚫 SKIPPING: ${bookmaker.key} market ${market.key} - not a player prop market`);
                return;
              }
              
              // Debug: Log what we're processing
              if (!isDFSSite && isPlayerPropMarket) {
                console.log(`✅ PROCESSING TRADITIONAL: ${bookmaker.key} market ${market.key} - has player props`);
              } else if (isDFSSite && isPlayerPropMarket) {
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
                    // Keep market key as-is to separate standard and alternate lines
                    // e.g., player_rush_yds and player_rush_yds_alternate will be separate rows
                    const isAlternate = market.key.endsWith('_alternate');
                    
                    // Group by player + market type + line value
                    // This keeps standard lines (70.5) separate from alternate lines (99.5)
                    const basePropKey = `${game.id}-${market.key}-${playerName}-${overOutcome.point}`;
                    console.log(`Creating combined prop for ${playerName}: ${market.key} line ${overOutcome.point} (${isAlternate ? 'ALTERNATE' : 'STANDARD'})`);
                    
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
                        isAlternate: isAlternate,
                        overBooks: [],
                        underBooks: []
                      });
                    }
                    
                    const propGroup = propGroups.get(basePropKey);
                    
                    // Add both Over and Under books to their respective arrays
                    // Include point/line value so we can show different lines in mini-table
                    propGroup.overBooks.push({
                      price: overOutcome.price,
                      odds: overOutcome.price,
                      point: overOutcome.point,
                      line: overOutcome.point,
                      book: bookmaker.title,
                      bookmaker: bookmaker,
                      market: market,
                      outcome: overOutcome,
                      outcomeName: 'Over',
                      last_update: market.last_update || bookmaker.last_update
                    });
                    
                    propGroup.underBooks.push({
                      price: underOutcome.price,
                      odds: underOutcome.price,
                      point: underOutcome.point,
                      line: underOutcome.point,
                      book: bookmaker.title,
                      bookmaker: bookmaker,
                      market: market,
                      outcome: underOutcome,
                      outcomeName: 'Under',
                      last_update: market.last_update || bookmaker.last_update
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
          
          // Define DFS apps list once for this scope
          const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au'];
          
          // Check allBooks for regular props
          if (propData.allBooks && propData.allBooks.length > 0) {
            console.log(`🎯 Available books for ${propKey}:`, propData.allBooks.map(b => ({
              key: b.bookmaker?.key,
              book: b.book,
              bookmaker: b.bookmaker
            })));
            
            // Check if we're filtering for DFS apps only
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
          
          // Determine which books to use based on filter
          // If bookFilter is active, only use books that match the filter
          const hasFilter = bookFilter && bookFilter.length > 0;
          let overBooksToUse, underBooksToUse;
          
          if (hasFilter) {
            // Filter overBooks and underBooks to only include books in the filter
            const normalizedFilter = bookFilter.map(f => f.toLowerCase());
            console.log(`🎯 FILTER DEBUG START: ${propData.playerName}`, {
              rawFilter: bookFilter,
              normalizedFilter: normalizedFilter,
              allOverBooksKeys: propData.overBooks.map(b => b.bookmaker?.key || b.book),
              allUnderBooksKeys: propData.underBooks.map(b => b.bookmaker?.key || b.book)
            });
            
            overBooksToUse = propData.overBooks.filter(b => {
              const bookKey = (b.bookmaker?.key || b.book || '').toLowerCase();
              // Check for exact match first
              if (normalizedFilter.includes(bookKey)) {
                console.log(`  🎯 Over book check: "${bookKey}" EXACT MATCH in filter`);
                return true;
              }
              // Check for partial match (for DFS apps that might have different key formats)
              const hasPartialMatch = normalizedFilter.some(filterKey => {
                return bookKey.includes(filterKey) || filterKey.includes(bookKey);
              });
              if (hasPartialMatch) {
                console.log(`  🎯 Over book check: "${bookKey}" PARTIAL MATCH in filter`);
                return true;
              }
              console.log(`  🎯 Over book check: "${bookKey}" NO MATCH in filter`);
              return false;
            });
            underBooksToUse = propData.underBooks.filter(b => {
              const bookKey = (b.bookmaker?.key || b.book || '').toLowerCase();
              // Check for exact match first
              if (normalizedFilter.includes(bookKey)) {
                console.log(`  🎯 Under book check: "${bookKey}" EXACT MATCH in filter`);
                return true;
              }
              // Check for partial match (for DFS apps that might have different key formats)
              const hasPartialMatch = normalizedFilter.some(filterKey => {
                return bookKey.includes(filterKey) || filterKey.includes(bookKey);
              });
              if (hasPartialMatch) {
                console.log(`  🎯 Under book check: "${bookKey}" PARTIAL MATCH in filter`);
                return true;
              }
              console.log(`  🎯 Under book check: "${bookKey}" NO MATCH in filter`);
              return false;
            });
            
            console.log(`🎯 FILTER DEBUG END: ${propData.playerName} - Filtering for ${bookFilter.join(', ')} - overBooks: ${overBooksToUse.length}/${propData.overBooks.length}, underBooks: ${underBooksToUse.length}/${propData.underBooks.length}`, {
              filter: normalizedFilter,
              overBooksFiltered: overBooksToUse.map(b => b.bookmaker?.key || b.book),
              underBooksFiltered: underBooksToUse.map(b => b.bookmaker?.key || b.book)
            });
          } else {
            overBooksToUse = propData.overBooks;
            underBooksToUse = propData.underBooks;
            console.log(`🎯 FILTER DEBUG: ${propData.playerName} - No filter (empty array), showing all books - overBooks: ${overBooksToUse.length}, underBooks: ${underBooksToUse.length}`);
          }
          
          // Skip this prop if no books match the filter
          if (hasFilter && overBooksToUse.length === 0 && underBooksToUse.length === 0) {
            console.log(`⏭️ Skipping ${propData.playerName} - no books match filter`);
            return; // Skip this prop entirely
          }
          
          // Find best line + odds combination for each side (from filtered books)
          const bestOverBook = overBooksToUse.length > 0 ? overBooksToUse.reduce((best, book) => {
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
          
          const bestUnderBook = underBooksToUse.length > 0 ? underBooksToUse.reduce((best, book) => {
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
          
          // Find the ABSOLUTE BEST book across both sides (best odds overall)
          let primaryBook;
          let showOver;
          
          if (bestOverBook && bestUnderBook) {
            // Compare odds directly - pick the book with best odds
            const overDec = americanToDecimal(bestOverBook.price);
            const underDec = americanToDecimal(bestUnderBook.price);
            
            if (overDec > underDec) {
              primaryBook = bestOverBook;
              showOver = true;
              console.log(`🎯 BEST ODDS: Over ${bestOverBook.price} (${overDec.toFixed(3)}) at ${bestOverBook.bookmaker?.key} beats Under ${bestUnderBook.price} (${underDec.toFixed(3)}) at ${bestUnderBook.bookmaker?.key}`);
            } else {
              primaryBook = bestUnderBook;
              showOver = false;
              console.log(`🎯 BEST ODDS: Under ${bestUnderBook.price} (${underDec.toFixed(3)}) at ${bestUnderBook.bookmaker?.key} beats Over ${bestOverBook.price} (${overDec.toFixed(3)}) at ${bestOverBook.bookmaker?.key}`);
            }
          } else {
            // Only one side available
            primaryBook = bestOverBook || bestUnderBook;
            showOver = !!bestOverBook;
          }
          
          console.log(`🎯 PRIMARY BOOK SELECTED: ${propData.playerName}`, {
            showOver: showOver,
            primaryBookKey: primaryBook?.bookmaker?.key,
            primaryBookTitle: primaryBook?.bookmaker?.title,
            bookFilter: bookFilter,
            hasFilter: hasFilter
          });
          
          // CRITICAL: Validate that primaryBook is actually from the filtered list
          if (hasFilter && primaryBook) {
            const primaryBookKey = (primaryBook.bookmaker?.key || '').toLowerCase();
            const normalizedFilter = bookFilter.map(f => f.toLowerCase());
            const isInFilter = normalizedFilter.some(filterKey => 
              primaryBookKey === filterKey || primaryBookKey.includes(filterKey) || filterKey.includes(primaryBookKey)
            );
            
            if (!isInFilter) {
              console.log(`⚠️ PRIMARY BOOK VALIDATION FAILED: ${primaryBookKey} is NOT in filter ${normalizedFilter.join(', ')} - SKIPPING PROP`);
              return; // Skip this prop - the primary book is not in the filter
            }
            console.log(`✅ PRIMARY BOOK VALIDATION PASSED: ${primaryBookKey} is in filter`);
          }
          
          // Check if primary book's market is locked - skip this row if locked
          if (primaryBook) {
            const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6'].includes(
              normalizeBookKey(primaryBook.bookmaker?.key)
            );
            
            // Log timestamp info for debugging
            if (isDFSApp) {
              console.log(`🔍 DFS Market Check: ${propData.playerName} ${propData.mkt?.key} at ${primaryBook.bookmaker?.key}`, {
                last_update: primaryBook.last_update,
                hasTimestamp: !!primaryBook.last_update,
                odds: primaryBook.price
              });
            }
            
            // Skip locked markets entirely - don't show them to user
            const isLocked = isMarketLikelyLocked(primaryBook, isDFSApp);
            if (isLocked) {
              console.log(`🔒 Skipping locked market: ${propData.playerName} ${propData.mkt?.key} at ${primaryBook.bookmaker?.key}`);
              return; // Skip this prop entirely if primary book is locked
            }
          }
          
          if (primaryBook) {
            // Check if market is locked
            const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6'].includes(
              normalizeBookKey(primaryBook.bookmaker?.key)
            );
            const isLocked = isMarketLikelyLocked(primaryBook, isDFSApp);
            
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
                point: primaryBook.point || primaryBook.line || propData.point, // Use best book's line
                bookmaker: primaryBook.bookmaker,
                book: primaryBook.bookmaker?.key
              },
              bk: primaryBook.bookmaker,
              sport: propData.sport,
              playerName: propData.playerName, // Add player name for display
              isPlayerProp: true,
              isCombinedProp: true, // Flag to indicate this has both sides
              overBooks: overBooksToUse,
              underBooks: underBooksToUse,
              // For mini-table: include ALL books for line shopping and comparison
              // Use UNFILTERED books (propData) for mini-table, not the filtered ones (overBooksToUse/underBooksToUse)
              // Even if main row is filtered, users need to see all available odds
              allBooks: [...(propData.overBooks || []), ...(propData.underBooks || [])],
              selectedBooks: propData.selectedBooks || [],
              nonSelectedBooks: propData.nonSelectedBooks || [],
              otherSideName: showOver ? 'Under' : 'Over'
            };
            
            propsRows.push(finalPropData);
          }
        } else {
          // Regular prop (not Over/Under pair)
          // NOTE: allBooks should ALWAYS contain ALL available books for the mini table
          // The main row display is filtered, but the mini table shows all books for line shopping
          
          // Skip if no books available at all
          if (!propData.allBooks || propData.allBooks.length === 0) {
            console.log(`Skipping regular prop ${propKey} - no books available`);
            return;
          }
          
          // NEW: If a bookFilter is applied, find the best book from the filtered list
          let bestFilteredBook = null;
          if (bookFilter && bookFilter.length > 0) {
            const normalizedFilter = bookFilter.map(f => f.toLowerCase());
            
            // Find all books that match the filter
            const matchingBooks = propData.allBooks.filter(book => {
              const bookKey = String(book?.bookmaker?.key || book?.book || '').toLowerCase();
              return normalizedFilter.some(filterKey => 
                bookKey === filterKey || bookKey.includes(filterKey) || filterKey.includes(bookKey)
              );
            });
            
            if (matchingBooks.length === 0) {
              console.log(`🎯 FILTERING OUT: Regular prop not available on selected bookmaker(s) - ${propKey}`);
              return; // Skip this prop entirely
            }
            
            // Find the best book from matching books (best odds)
            bestFilteredBook = matchingBooks.reduce((best, book) => {
              const bestDec = americanToDecimal(best.price || best.odds);
              const bookDec = americanToDecimal(book.price || book.odds);
              return bookDec > bestDec ? book : best;
            });
            
            console.log(`🎯 Regular prop ${propKey}: Using filtered book ${bestFilteredBook.bookmaker?.key} with odds ${bestFilteredBook.price}`);
          }
          
          // Update propData with the filtered book for main card display
          const finalPropData = {
            ...propData,
            // If filter is active, use the best filtered book for main card
            // Otherwise keep the original best book
            bk: bestFilteredBook ? bestFilteredBook.bookmaker : propData.bk,
            out: bestFilteredBook ? {
              ...propData.out,
              price: bestFilteredBook.price || bestFilteredBook.odds,
              odds: bestFilteredBook.price || bestFilteredBook.odds,
              point: bestFilteredBook.point || propData.out.point
            } : propData.out
          };
          
          propsRows.push(finalPropData);
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

    // Helper function to get market display name (uses cached version)
    const getMarketDisplayName = (market) => {
      return getCachedMarketName(market);
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
    console.log(`🎯 OddsTable: Processing ${games?.length || 0} games with marketFilter:`, marketFilter);
    games?.forEach((game) => {
      const baseKeys = ["h2h", "spreads", "totals"];
      const keys = (marketFilter && marketFilter.length) ? marketFilter : baseKeys;
      console.log(`🎯 OddsTable: Game ${game.home_team} - Using markets:`, keys);

      keys.forEach((mktKey) => {
        const allMarketOutcomes = [];
        game.bookmakers?.forEach(bk => {
          const mkt = bk.markets?.find(m => m.key === mktKey);
          // Only include bookmakers that have this specific market with outcomes
          if (mkt && mkt.outcomes && mkt.outcomes.length > 0) {
            mkt.outcomes.forEach(out => {
              allMarketOutcomes.push({ ...out, book: bk.title, bookmaker: bk, market: mkt });
            });
          }
        });
        // Skip this market if no bookmakers have it with actual odds
        if (!allMarketOutcomes.length) {
          console.log(`📊 No bookmakers have market ${mktKey} with outcomes for ${game.home_team} vs ${game.away_team}`);
          return;
        }

        // Enhanced logging for debugging bookFilter issues
        console.log(`🎯 Processing market ${mktKey} with ${allMarketOutcomes.length} outcomes. BookFilter:`, 
          bookFilter && bookFilter.length ? bookFilter : 'ALL BOOKS (no filter)');
        
        const candidates = allMarketOutcomes.filter(o => {
          const bookKey = o.bookmaker?.key?.toLowerCase() || '';
          const dfsOnlyApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'draftkings_pick6'];
          
          // ALWAYS exclude DFS apps from game mode, regardless of bookFilter
          if (mode === 'game' && (dfsOnlyApps.some(app => bookKey.includes(app)) || dfsOnlyApps.includes(bookKey))) {
            console.log(`🎯 Excluding DFS-only app "${bookKey}" from game odds (only offers player props)`);
            return false;
          }
          
          // If no bookFilter specified, include all remaining bookmakers
          if (!bookFilter || !bookFilter.length) {
            console.log(`🎯 Including bookmaker "${bookKey}" for market ${mktKey}`);
            return true;
          }
          
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
          
          // Debug logging for quarter markets
          if (mktKey.includes('_q') || mktKey.includes('_h') || mktKey.includes('_p')) {
            console.log(`🎯 QUARTER MARKET DEBUG: ${mktKey} - groupKey: ${groupKey}`);
            console.log(`   Total outcomes in market: ${allMarketOutcomes.length}`);
            console.log(`   Matching outcomes: ${allBooksForOutcome.length}`);
            if (allBooksForOutcome.length > 0) {
              console.log(`   Sample outcome:`, allBooksForOutcome[0]);
            }
          }
          
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
          
          // Debug logging for quarter markets
          if (mktKey.includes('_q') || mktKey.includes('_h') || mktKey.includes('_p')) {
            console.log(`🎯 QUARTER MARKET ROW: ${mktKey} - allBooks count: ${gameRow.allBooks.length}`);
          }

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

          // NEW: If a bookFilter is applied, verify the selected bookmaker actually has this bet
          let hasSelectedBookmakerBet = true;
          if (bookFilter && bookFilter.length > 0) {
            // Check if any of the selected bookmakers have this specific bet
            const normalizedFilter = bookFilter.map(f => f.toLowerCase());
            const hasSelectedBook = selectedBooks.some(book => {
              const bookKey = String(book?.bookmaker?.key || book?.book || '').toLowerCase();
              return normalizedFilter.includes(bookKey);
            });
            
            if (!hasSelectedBook) {
              console.log(`🎯 FILTERING OUT: Bet not available on selected bookmaker(s) - ${mktKey} ${groupKey}`);
              hasSelectedBookmakerBet = false;
            }
          }

          if (hasValidOdds && hasMinimumBooks && hasSelectedBookmakerBet) {
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
    
    // IMPORTANT: For fair line calculation, we use ALL books, not just filtered books
    // This ensures we have enough data to calculate an accurate fair line
    const allBooks = row.allBooks || [];
    
    // Check if this is a DFS app
    const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6'].includes(bookmakerKey);
    
    // Debug logging for EV calculation - log for ALL player props to see what's happening
    console.log(`🔍 EV DEBUG for ${row.playerName || 'unknown'} ${row.mkt?.key || 'unknown'}:`, {
      bookmakerKey,
      userOdds,
      allBooksCount: allBooks.length,
      isPlayerProp: row.isPlayerProp,
      allBooks: allBooks.map(b => ({ 
        book: b.bookmaker?.key || b.book, 
        odds: b.price || b.odds, 
        name: b.name,
        point: b.point,
        line: b.line
      }))
    });
    
    // Only proceed if we have enough books for a meaningful consensus
    // Note: allBooks should contain ALL available books from mini table, not just filtered ones
    if (allBooks.length < 3) {
      console.log(`⚠️ EV CALC FAILED: Not enough books in mini table for ${row.playerName || 'unknown'} ${row.mkt?.key || 'unknown'} - only ${allBooks.length} books (need 3+)`, {
        bookmakerKey,
        isDFSApp,
        userOdds,
        allBooks: allBooks.map(b => ({ book: b.bookmaker?.key || b.book, odds: b.price || b.odds })),
        note: 'EV uses ALL books from mini table, not just your filtered selection'
      });
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
      
      if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 3) { // Minimum 3 books for reliable EV
        const fairDec = 1 / consensusProb;
        const fairLine = decimalToAmerican(fairDec);
        const ev = calculateEV(userOdds, fairLine, bookmakerKey);
        
        // Debug: Verify the calculation
        const userDec = userOdds > 0 ? (userOdds / 100) + 1 : (100 / Math.abs(userOdds)) + 1;
        const fairDecCheck = fairLine > 0 ? (fairLine / 100) + 1 : (100 / Math.abs(fairLine)) + 1;
        const evCheck = ((userDec / fairDecCheck) - 1) * 100;
        
        console.log(`✅ EV CALC SUCCESS for ${row.playerName || 'unknown'} ${row.mkt?.key || 'unknown'}:`, {
          bookmakerKey,
          isDFSApp,
          userOdds,
          consensusProb: consensusProb.toFixed(4),
          fairLine,
          userDec: userDec.toFixed(4),
          fairDecCheck: fairDecCheck.toFixed(4),
          ev: ev?.toFixed(2) + '%',
          evCheck: evCheck.toFixed(2) + '%',
          uniqCnt
        });
        
        // Sanity check: if EV is showing as the implied probability, return the correct calculation
        if (Math.abs(ev - (consensusProb * 100)) < 1) {
          console.warn(`⚠️ EV CALCULATION ERROR: Returning implied probability instead of EV! Recalculating...`);
          return evCheck;
        }
        
        return ev;
      }
      
      // FALLBACK: If EV calculation fails, use simple odds comparison
      // Find the bet with the best odds in the mini table and compare
      console.log(`⚠️ EV CALC FAILED: Using fallback comparison for ${row.playerName || 'unknown'}`, {
        consensusProb,
        uniqCnt,
        allBooksCount: allBooks.length
      });
      
      if (allBooks.length >= 2) {
        // Find best odds in the mini table (excluding the user's book)
        const otherBooks = allBooks.filter(b => {
          const bookKey = (b.bookmaker?.key || b.book || '').toLowerCase();
          return bookKey !== bookmakerKey;
        });
        
        if (otherBooks.length > 0) {
          // Find the best odds among other books
          const bestOtherOdds = otherBooks.reduce((best, book) => {
            const odds = book.price || book.odds || 0;
            const bestOdds = best.price || best.odds || 0;
            const oddsDecimal = americanToDecimal(odds);
            const bestDecimal = americanToDecimal(bestOdds);
            return oddsDecimal > bestDecimal ? book : best;
          });
          
          const bestOtherOddsValue = bestOtherOdds.price || bestOtherOdds.odds;
          const userDecimal = americanToDecimal(userOdds);
          const bestDecimal = americanToDecimal(bestOtherOddsValue);
          
          // Simple comparison: if user's odds are better than best available, it's +EV
          const simplifiedEV = ((userDecimal / bestDecimal) - 1) * 100;
          
          console.log(`📊 FALLBACK EV for ${row.playerName || 'unknown'}: ${simplifiedEV.toFixed(2)}%`, {
            userOdds,
            bestOtherOdds: bestOtherOddsValue,
            booksCompared: allBooks.length
          });
          
          return simplifiedEV;
        }
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
    
    if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt >= 3) { // Minimum 3 books for reliable EV
      const fairDec = 1 / consensusProb;
      return calculateEV(userOdds, decimalToAmerican(fairDec), bookmakerKey);
    }
    return null;
  };
  const evMap = useMemo(() => {
    const m = new Map();
    allRows.forEach(r => {
      try {
        const ev = getEV(r);
        m.set(r.key, ev);
        // Debug logging for player props EV
        if (mode === 'props' && r.playerName) {
          console.log(`📊 EV for ${r.playerName} ${r.mkt?.key}:`, {
            ev: ev,
            allBooksCount: r.allBooks?.length || 0,
            userOdds: r.out?.price,
            bookmaker: r.bk?.key
          });
        }
      } catch (err) {
        console.warn('EV calculation error for row:', r.key, err);
        m.set(r.key, null);
      }
    });
    return m;
  }, [allRows, mode]);

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
    
    // ========== MODE-SPECIFIC FILTERING ==========
    // Apply mode-specific logic before other filters
    if (mode === 'arbitrage' && minProfit !== null) {
      console.log(`🎯 ARBITRAGE MODE: Filtering for minimum ${minProfit}% profit`);
      r = r.filter(row => {
        const ev = evMap.get(row.key);
        return ev != null && ev >= minProfit;
      });
    }
    
    if (mode === 'middles' && minMiddleGap !== null) {
      console.log(`🎪 MIDDLES MODE: Filtering for minimum ${minMiddleGap} point gap`);
      // Middles filtering logic would be applied here
      // This is typically handled by MiddlesDetector component
    }
    
    // ========== SPORTSBOOK FILTERING ==========
    // For player props mode, sportsbook filtering is already handled in allRows
    // where the primary book (row.bk) is selected from filtered books.
    // We skip the additional filtering here to avoid double-filtering.
    // For game mode, we apply the filter here.
    const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au'];
    const hasBookFilter = bookFilter && bookFilter.length > 0;
    
    console.log('🔍 SPORTSBOOK FILTER DEBUG: bookFilter =', bookFilter);
    console.log('🔍 SPORTSBOOK FILTER DEBUG: hasBookFilter =', hasBookFilter);
    console.log('🔍 SPORTSBOOK FILTER DEBUG: mode =', mode);
    console.log('🔍 SPORTSBOOK FILTER DEBUG: Number of rows before filtering:', r.length);
    
    // Log all available bookmakers in the data
    const allBookmakers = new Set();
    r.forEach(row => {
      const bookmakerKey = (row?.bk?.key || row?.out?.bookmaker?.key || row?.out?.book || '').toLowerCase();
      if (bookmakerKey) allBookmakers.add(bookmakerKey);
    });
    console.log('🔍 SPORTSBOOK FILTER DEBUG: All bookmakers in data =', Array.from(allBookmakers));
    
    // If any sportsbooks are selected, filter to only show those books
    // Skip for props mode since filtering is handled in allRows
    if (hasBookFilter && mode !== 'props') {
      console.log('🎯 Sportsbook filtering active - showing only selected books:', bookFilter);
      console.log('🎯 Before filtering: ' + r.length + ' rows');
      
      const normalizedFilter = bookFilter.map(b => b.toLowerCase());
      
      r = r.filter(row => {
        // For player props, bookmaker info is in row.bk, for game odds it's in row.out.bookmaker
        const bookmakerKey = (row?.bk?.key || row?.out?.bookmaker?.key || row?.out?.book || '').toLowerCase();
        
        // Check for exact match first
        if (normalizedFilter.includes(bookmakerKey)) {
          return true;
        }
        
        // Check for partial match (for DFS apps that might have different key formats)
        const hasPartialMatch = normalizedFilter.some(filterKey => {
          return bookmakerKey.includes(filterKey) || filterKey.includes(bookmakerKey);
        });
        
        if (hasPartialMatch) {
          return true;
        }
        
        return false;
      });
      
      console.log('🎯 After sportsbook filtering: ' + r.length + ' rows');
    } else if (hasBookFilter && mode === 'props') {
      console.log('🎯 Props mode: Sportsbook filtering already applied in allRows, skipping here');
    }
    
    // ========== MARKET FILTERING ==========
    // Apply market filter based on mode
    if (marketFilter && marketFilter.length > 0) {
      console.log(`🎯 MARKET FILTER: Filtering for markets:`, marketFilter);
      r = r.filter(row => {
        const marketKey = row.mkt?.key || '';
        
        // For player props mode, always include if it's a player prop market
        if (mode === 'props') {
          const isPlayerProp = marketKey.includes('player_') || marketKey.includes('batter_') || marketKey.includes('pitcher_');
          if (isPlayerProp) {
            // Check if specific market is selected
            const isSelected = marketFilter.includes(marketKey);
            if (!isSelected) {
              console.log(`🎯 MARKET FILTER: Excluding ${marketKey} - not in selected markets`);
              return false;
            }
          }
          return true;
        }
        
        // For straight bets mode, filter by selected markets
        if (mode === 'game') {
          const isSelected = marketFilter.includes(marketKey);
          if (!isSelected) {
            console.log(`🎯 MARKET FILTER: Excluding ${marketKey} - not in selected markets`);
          }
          return isSelected;
        }
        
        // For arbitrage/middles, apply market filter
        return marketFilter.includes(marketKey);
      });
      console.log(`🎯 MARKET FILTER: ${r.length} rows after market filtering`);
    }
    
    // Apply search query filter for both game odds and player props
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      console.log('🔍 SEARCH FILTER: Applying search query:', query);
      console.log('🔍 SEARCH FILTER: Rows before search:', r.length);
      
      r = r.filter(row => {
        const playerName = (row.playerName || '').toLowerCase();
        const teamName = (row.out?.name || '').toLowerCase();
        const homeTeam = (row.game?.home_team || '').toLowerCase();
        const awayTeam = (row.game?.away_team || '').toLowerCase();
        const marketKey = (row.mkt?.key || '').toLowerCase();
        const league = (row.game?.sport_title || '').toLowerCase();
        
        const matches = playerName.includes(query) || 
                       teamName.includes(query) || 
                       homeTeam.includes(query) || 
                       awayTeam.includes(query) ||
                       marketKey.includes(query) ||
                       league.includes(query);
        
        if (matches) {
          console.log(`🔍 SEARCH MATCH: ${playerName || teamName} - ${homeTeam} vs ${awayTeam}`);
        }
        
        return matches;
      });
      
      console.log('🔍 SEARCH FILTER: Rows after search:', r.length);
    }
    
    // Apply Data Points filter - filter bets by minimum number of available sportsbooks
    if (typeof dataPoints === 'number' && dataPoints > 0) {
      console.log(`🔍 DATA POINTS FILTER: Filtering for minimum ${dataPoints} sportsbooks`);
      r = r.filter(row => {
        // Count unique sportsbooks that have this specific bet
        const allBooks = row.allBooks || [];
        const uniqueBooks = new Set(allBooks.map(b => (b.bookmaker?.key || b.book || '').toLowerCase()));
        const bookCount = uniqueBooks.size;
        
        const hasEnoughBooks = bookCount >= dataPoints;
        if (!hasEnoughBooks) {
          console.log(`🔍 DATA POINTS FILTER: Filtering out ${row.playerName || row.out?.name} - only ${bookCount} books (need ${dataPoints})`);
        }
        return hasEnoughBooks;
      });
      console.log(`🔍 DATA POINTS FILTER: ${r.length} rows after filtering`);
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
    
    return r.slice().sort((a, b) => {
      // Always push locked markets to the bottom
      if (a.isLocked && !b.isLocked) return 1;
      if (!a.isLocked && b.isLocked) return -1;
      
      // If both locked or both unlocked, use normal sorting
      return sort.dir === 'asc' ? -sorter(a, b) : sorter(a, b);
    });
  }, [allRows, bookFilter, evOnlyPositive, evMin, sort.dir, sorter, evMap, searchQuery, mode, dataPoints, marketFilter, minProfit, maxStake, minMiddleGap, minMiddleProbability]);

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
      {/* Filters Menu - Odds Format */}
      {!oddsFormatProp && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:16, padding:'12px', background:'rgba(139, 92, 246, 0.08)', borderRadius:8, border:'1px solid rgba(139, 92, 246, 0.2)' }}>
          {/* Odds Format Toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
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
        </div>
      )}

      <table className="odds-grid" data-mode={mode}>
        <thead>
          <tr>
            <th className="ev-col">EV %</th>
            <th className="match-col">Match</th>
            <th className="team-line-col">Team / Line</th>
            <th className="book-col">Book</th>
            <th className="odds-col">Odds</th>
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
                      {row.mkt.name || formatMarket(row.mkt?.key)}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {typeof ev === "number" ? (<span className="ev-chip">{ev.toFixed(2)}%</span>) : ""}
                        <ChevronDown 
                          size={18} 
                          style={{ 
                            transition: 'transform 0.2s ease',
                            transform: expandedRows[row.key] ? 'rotate(180deg)' : 'rotate(0deg)',
                            opacity: 0.6,
                            flexShrink: 0
                          }} 
                        />
                      </div>
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
                      <span className="desktop-matchup-league" style={{ borderRadius: '16px' }}>
                        {(() => { 
                          const { sport, league } = getSportLeague(row.game?.sport_key, row.game?.sport_title); 
                          return league; 
                        })()}
                      </span>
                      <div className="desktop-teams">
                        <div className="desktop-team-row">
                          {(() => {
                            const awayLogo = getTeamLogoForGame(row.game, row.game?.away_team);
                            console.log(`🔍 Away team logo attempt: ${row.game?.away_team} -> ${awayLogo}`);
                            return awayLogo ? (
                              <img
                                src={awayLogo}
                                alt={`${row.game?.away_team || 'Away'} logo`}
                                className="desktop-team-logo"
                                loading="lazy"
                                onLoad={() => console.log(`✅ Loaded logo: ${awayLogo}`)}
                                onError={(e) => { 
                                  console.error(`❌ Failed to load logo: ${awayLogo}`, e);
                                  // Try fallback URLs
                                  const fallbacks = getLogoFallbackUrls(row.game?.sport_key?.split('_').pop(), '');
                                  if (fallbacks.length > 0) {
                                    e.target.src = fallbacks[0];
                                  } else {
                                    e.target.style.display = 'none';
                                  }
                                }}
                              />
                            ) : null;
                          })()}
                          <span>{row.game?.away_team || 'Away Team'}</span>
                        </div>
                        <div className="desktop-team-row">
                          {(() => {
                            const homeLogo = getTeamLogoForGame(row.game, row.game?.home_team);
                            console.log(`🔍 Home team logo attempt: ${row.game?.home_team} -> ${homeLogo}`);
                            return homeLogo ? (
                              <img
                                src={homeLogo}
                                alt={`${row.game?.home_team || 'Home'} logo`}
                                className="desktop-team-logo"
                                loading="lazy"
                                onLoad={() => console.log(`✅ Loaded logo: ${homeLogo}`)}
                                onError={(e) => { 
                                  console.error(`❌ Failed to load logo: ${homeLogo}`, e);
                                  // Try fallback URLs
                                  const fallbacks = getLogoFallbackUrls(row.game?.sport_key?.split('_').pop(), '');
                                  if (fallbacks.length > 0) {
                                    e.target.src = fallbacks[0];
                                  } else {
                                    e.target.style.display = 'none';
                                  }
                                }}
                              />
                            ) : null;
                          })()}
                          <span>{row.game?.home_team || 'Home Team'}</span>
                        </div>
                      </div>
                      <span className="desktop-matchup-time">{formatKickoffNice(row.game?.commence_time)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', flexDirection:'column', gap:2, textAlign:'left' }}>
                      {mode === "props" && (
                        <span style={{ fontWeight:800, fontSize:'1.05em', color: 'rgba(255,255,255,0.95)' }}>
                          {row.playerName || row.out?.description || 'Player'}
                        </span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span 
                          style={{ fontWeight:800 }}
                          title={mode === "props" ? getYesBetExplanation(row.mkt?.key, row.out?.name) : null}
                        >
                          {mode === "props" 
                            ? (row.out?.name || '')
                            : (row.mkt?.key || '') === 'h2h'
                              ? shortTeam(row.out?.name, row.game?.sport_key)
                              : (row.out?.name || '')}
                          {/* Add line inline with team name */}
                          {mode === "props" 
                            ? (row.out?.point ? ` ${row.out.point}` : '')
                            : ((row.mkt?.key || '') !== 'h2h' && row.out?.point ? ` ${formatLine(row.out.point, row.mkt.key, 'game')}` : '')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
                        <span>{formatMarket(row.mkt?.key || '')}</span>
                        {row.isAlternate && (
                          <span style={{
                            fontSize: '0.75em',
                            fontWeight: '700',
                            background: 'rgba(139, 92, 246, 0.3)',
                            color: '#a78bfa',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(139, 92, 246, 0.5)'
                          }}>
                            ALT
                          </span>
                        )}
                      </div>
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
                        // Use fixed -119 odds for DFS apps (PrizePicks, Underdog, Pick6, Dabble)
                        const rawOdds = Number(row.out.price ?? row.out.odds ?? 0);
                        const n = getDisplayOdds(rawOdds, row.bk?.key);
                        if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
                        if (currentOddsFormat === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                        const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                        const den = n > 0 ? 100 : Math.round(Math.abs(n));
                        const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                        return `${num/g}/${den/g}`;
                      })()}
                    </span>
                  </td>
                </tr>

                {/* ----- Mobile card (click to expand) ----- */}
                <tr className="mobile-card-row" aria-hidden={false}>
                  <td colSpan={5}>
                    <div
                      className={`mobile-odds-card as-button ${expandedRows[row.key] ? 'expanded' : ''}`}
                      onClick={()=>toggleRow(row.key)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e)=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); toggleRow(row.key); } }}
                    >
                      {/* League badge for props mode */}
                      {mode === "props" && (
                        <span style={{
                          display: 'inline-block',
                          background: 'rgba(139, 92, 246, 0.25)',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          padding: '5px 14px',
                          borderRadius: '20px',
                          fontSize: '0.8em',
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.9)',
                          marginBottom: '10px',
                          letterSpacing: '0.5px'
                        }}>
                          {getSportLeague(row.game?.sport_key, row.game?.sport_title).league}
                        </span>
                      )}
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
                            {typeof ev === 'number' ? `${ev.toFixed(2)}%` : 'N/A'}
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
                              {(() => {
                                // Hide outcome name for binary Yes/No markets (TD and Goal Scorer markets)
                                const marketKey = (row.mkt?.key || '').toLowerCase();
                                const isBinaryMarket = marketKey.includes('first_td') || 
                                                      marketKey.includes('1st_td') || 
                                                      marketKey.includes('first_touchdown') ||
                                                      marketKey.includes('anytime_td') || 
                                                      marketKey.includes('anytime_touchdown') ||
                                                      marketKey.includes('first_goal') ||
                                                      marketKey.includes('goal_scorer_first') ||
                                                      marketKey.includes('anytime_goal') ||
                                                      marketKey.includes('goal_scorer_anytime') ||
                                                      marketKey.includes('last_goal') ||
                                                      marketKey.includes('goal_scorer_last');
                                
                                if (isBinaryMarket && row.out.name === 'Yes') {
                                  // For binary markets with Yes outcome, don't show the outcome name
                                  return null;
                                }
                                
                                return (
                                  <span 
                                    className={`mob-prop-side ${row.out.name === 'Over' ? 'over' : 'under'}`}
                                    title={getYesBetExplanation(row.mkt?.key, row.out?.name)}
                                  >
                                    {row.out.name} {row.out.point}
                                  </span>
                                );
                              })()}
                            </div>
                          ) : (
                            <>
                              {String(row.mkt?.key).includes('total') ? (
                                <div className="mob-total-stack">
                                  <div className="mob-total-market">
                                    {row.out.name} {formatLine(row.out.point, row.mkt.key, 'game')}
                                  </div>
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
                          {(() => {
                            // Check if the primary book's market is locked
                            const isOverSide = row.out.name === 'Over';
                            const primaryBook = isOverSide 
                              ? row.overBooks?.find(book => normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(row.bk?.key))
                              : row.underBooks?.find(book => normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(row.bk?.key));
                            
                            const isDFSApp = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6'].includes(
                              normalizeBookKey(row.bk?.key)
                            );
                            
                            if (primaryBook && isMarketLikelyLocked(primaryBook, isDFSApp)) {
                              return (
                                <span style={{ 
                                  fontSize: '0.7em', 
                                  color: '#ef4444',
                                  fontWeight: '700',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  marginLeft: '6px'
                                }}>
                                  🔒 LOCKED
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="mob-right-section">
                          <div className={`mob-odds-container ${priceDelta[row.key] ? (priceDelta[row.key] === 'up' ? 'up' : 'down') : ''}`}>
                            <span className="mob-odds">
                              {(() => {
                                // Use fixed -119 odds for DFS apps (PrizePicks, Underdog, Pick6, Dabble)
                                const rawOdds = Number(row.out.price ?? row.out.odds ?? 0);
                                const n = getDisplayOdds(rawOdds, row.bk?.key);
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
                            // For player props, show more books for better EV calculations and line shopping
                            // For regular odds, limit to priority books for cleaner display
                            const maxMiniBooks = mode === "props" ? 20 : MINI_TABLE_PRIORITY_BOOKS.length;

                            // Mini-table should ALWAYS show all books for line shopping and comparison
                            // Even if main row is filtered, users need to see all available odds
                            let booksToProcess = row.allBooks || [];
                            
                            const dedupedBooks = (() => {
                              const seenKeys = new Set();
                              
                              console.log(`🎯 Mini table: Showing ${booksToProcess.length} books for line shopping and comparison`);
                              
                              // For combined props, collect all unique bookmakers from allBooks (which contains ALL books, not filtered)
                              if (mode === "props" && row.isCombinedProp) {
                                const allBookmakers = new Map();
                                
                                // Use row.allBooks which contains ALL unfiltered books for both Over and Under
                                // This ensures the mini-table shows all available odds regardless of main filter
                                (row.allBooks || []).forEach(book => {
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

                            // Find best odds across ALL books for this market (not just displayed ones)
                            const findBestOdds = (books) => {
                              if (!books || books.length === 0) return null;
                              
                              // For game mode, we need to find the best odds for the CURRENT outcome (row.out)
                              // For props, we just compare the single odds value
                              if (mode === "props") {
                                return books.reduce((best, current) => {
                                  const currentOdds = current.price ?? current.odds;
                                  const bestOdds = best.price ?? best.odds;
                                  
                                  if (!currentOdds || !bestOdds) return best;
                                  
                                  // Convert to decimal for comparison
                                  const currentDec = currentOdds > 0 ? (currentOdds / 100) + 1 : (100 / Math.abs(currentOdds)) + 1;
                                  const bestDec = bestOdds > 0 ? (bestOdds / 100) + 1 : (100 / Math.abs(bestOdds)) + 1;
                                  
                                  return currentDec > bestDec ? current : best;
                                });
                              }
                              
                              // For game mode (spreads/totals/moneyline), find best odds for the specific outcome
                              return books.reduce((best, current) => {
                                // Find the odds for the current outcome from this book
                                const currentOutcomeOdds = (() => {
                                  if (!current.market || !Array.isArray(current.market.outcomes)) return null;
                                  const outcome = current.market.outcomes.find(o => o.name === row.out.name);
                                  return outcome ? (outcome.price ?? outcome.odds) : null;
                                })();
                                
                                // Find the odds for the current outcome from the best book so far
                                const bestOutcomeOdds = (() => {
                                  if (!best.market || !Array.isArray(best.market.outcomes)) return null;
                                  const outcome = best.market.outcomes.find(o => o.name === row.out.name);
                                  return outcome ? (outcome.price ?? outcome.odds) : null;
                                })();
                                
                                if (!currentOutcomeOdds || !bestOutcomeOdds) return best;
                                
                                // Convert to decimal for comparison
                                const currentDec = currentOutcomeOdds > 0 ? (currentOutcomeOdds / 100) + 1 : (100 / Math.abs(currentOutcomeOdds)) + 1;
                                const bestDec = bestOutcomeOdds > 0 ? (bestOutcomeOdds / 100) + 1 : (100 / Math.abs(bestOutcomeOdds)) + 1;
                                
                                return currentDec > bestDec ? current : best;
                              });
                            };

                            // Use ALL books from row.allBooks to find true best odds, not just displayed books
                            const bestOddsBook = findBestOdds(row.allBooks || dedupedBooks);
                            const bestOddsKey = bestOddsBook ? normalizeBookKey(bestOddsBook.bookmaker?.key || bestOddsBook.book) : null;

                            const topEntry = row.bk ? {
                              price: row.out?.price,
                              odds: row.out?.price,
                              book: row.bk?.title,
                              bookmaker: row.bk,
                              market: row.mkt,
                              point: row.out?.point,
                              isBestOdds: bestOddsKey && normalizeBookKey(row.bk?.key) === bestOddsKey
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

                            // Sort combined books to put best odds first
                            const sortedCombined = combinedBooks.slice().sort((a, b) => {
                              const aKey = normalizeBookKeyForEntry(a);
                              const bKey = normalizeBookKeyForEntry(b);
                              
                              // Best odds book goes first
                              if (aKey === bestOddsKey && bKey !== bestOddsKey) return -1;
                              if (bKey === bestOddsKey && aKey !== bestOddsKey) return 1;
                              
                              // Then sort by priority and odds
                              const aPriority = getMiniTablePriorityIndex(a.bookmaker?.key || a.book);
                              const bPriority = getMiniTablePriorityIndex(b.bookmaker?.key || b.book);
                              const safeAPriority = aPriority === -1 ? 999 : aPriority;
                              const safeBPriority = bPriority === -1 ? 999 : bPriority;
                              
                              if (safeAPriority !== safeBPriority) {
                                return safeAPriority - safeBPriority;
                              }
                              return oddsCompare(a, b);
                            });

                            pushEntry(topEntry);
                            
                            // Calculate Best Odds and Average Odds summary cards
                            // Only show for player props mode with multiple books
                            if (mode === "props" && booksToProcess.length >= 2) {
                              const allOdds = booksToProcess
                                .map(book => {
                                  const bookKey = book.bookmaker?.key || book.book;
                                  // Use fixed -119 for DFS apps
                                  const rawOdds = book.price || book.odds;
                                  return isDFSApp(bookKey) ? getDFSFixedOdds() : rawOdds;
                                })
                                .filter(odds => odds != null && !isNaN(odds));
                              
                              if (allOdds.length >= 2) {
                                // Find best odds (highest decimal value = best payout)
                                const bestOddsValue = allOdds.reduce((best, current) => {
                                  const bestDec = best > 0 ? (best / 100) + 1 : (100 / Math.abs(best)) + 1;
                                  const currDec = current > 0 ? (current / 100) + 1 : (100 / Math.abs(current)) + 1;
                                  return currDec > bestDec ? current : best;
                                });
                                
                                // Calculate average odds
                                const avgOddsValue = Math.round(allOdds.reduce((sum, odds) => sum + odds, 0) / allOdds.length);
                                
                                // Insert summary cards at the beginning (after topEntry)
                                orderedBooks.splice(1, 0, {
                                  book: '⭐ BEST',
                                  bookmaker: { key: 'best_odds_summary', title: 'Best Odds' },
                                  price: bestOddsValue,
                                  odds: bestOddsValue,
                                  isSummaryCard: true,
                                  summaryType: 'best',
                                  _rowId: 'best-odds-card'
                                });
                                
                                orderedBooks.splice(2, 0, {
                                  book: '📊 AVG',
                                  bookmaker: { key: 'avg_odds_summary', title: 'Average Odds' },
                                  price: avgOddsValue,
                                  odds: avgOddsValue,
                                  isSummaryCard: true,
                                  summaryType: 'avg',
                                  _rowId: 'avg-odds-card'
                                });
                              }
                            }
                            
                            sortedCombined.forEach(book => {
                              const entry = {
                                ...book,
                                isBestOdds: normalizeBookKeyForEntry(book) === bestOddsKey
                              };
                              pushEntry(entry);
                            });

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
                              
                              // For spreads/totals, we need to look up the correct outcome
                              // ob.price/ob.odds is for the PRIMARY outcome (first column)
                              // For the second column, we need to find the opposite outcome
                              
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

                              // If we still don't have outcomes, try to find the full bookmaker data from the original games
                              if (outs.length === 0 && games && games.length > 0) {
                                const gameData = games.find(g => g.id === row.game.id);
                                if (gameData && gameData.bookmakers) {
                                  const bookmakerData = gameData.bookmakers.find(b => 
                                    normalizeBookKey(b.key) === normalizeBookKey(ob.bookmaker?.key || ob.book)
                                  );
                                  if (bookmakerData) {
                                    const marketData = bookmakerData.markets.find(m => m.key === row.mkt?.key);
                                    if (marketData && Array.isArray(marketData.outcomes)) {
                                      outs = marketData.outcomes;
                                      console.log(`🎯 GRAB: Found outcomes from original games data for ${ob.bookmaker?.key}`);
                                    }
                                  }
                                }
                              }

                              // Special handling for spreads - we want to match the exact point spread
                              if (isSpreads && outs.length > 0) {
                                // Determine which team this column represents
                                const teamName = top ? row.game.home_team : row.game.away_team;
                                const teamLower = String(teamName).toLowerCase();
                                const within = (a, b) => Math.abs(Number(a) - Number(b)) < 0.11; // small tolerance

                                // For spreads, find the outcome for this specific team
                                // Don't worry about the point value - just match the team name
                                let match = outs.find(o => o && String(o.name).toLowerCase() === teamLower);

                                if (match) {
                                  const result = match.price ?? match.odds ?? '';
                                  console.log(`🎯 SPREAD GRAB: Team=${teamName}, Column=${top ? 'Home' : 'Away'}, Result=${result}`);
                                  return result;
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

                            // Format odds with DFS app override (-119 for PrizePicks, Underdog, Pick6, Dabble)
                            const formatOddsWithBook = (n, bookKey) => {
                              // Apply DFS fixed odds if applicable
                              const displayOdds = getDisplayOdds(n, bookKey);
                              if (!displayOdds && displayOdds !== 0) return '';
                              if (currentOddsFormat === 'american') return displayOdds > 0 ? `+${displayOdds}` : `${displayOdds}`;
                              if (currentOddsFormat === 'decimal') { const d = toDecimal(displayOdds); return d ? d.toFixed(2) : ''; }
                              const num = displayOdds > 0 ? Math.round(Math.abs(displayOdds)) : 100;
                              const den = displayOdds > 0 ? 100 : Math.round(Math.abs(displayOdds));
                              const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                              return `${num/g}/${den/g}`;
                            };
                            // Keep original formatOdds for backward compatibility
                            const formatOdds = (n) => formatOddsWithBook(n, null);

                            return (
                              <>
                                {cols.map((ob, i) => (
                                <div 
                                  className={`mini-swipe-row ${ob.isSummaryCard ? 'summary-card' : ''} ${ob.summaryType === 'best' ? 'best-odds-card' : ''} ${ob.summaryType === 'avg' ? 'avg-odds-card' : ''}`} 
                                  key={ob._rowId || i}
                                >
                                  <div className="mini-book-col">
                                    {mode === "props" ? (
                                      // For summary cards, use simple horizontal layout like game mode
                                      ob.isSummaryCard ? (
                                        <div style={{ display: 'flex', alignItems: 'center', fontWeight: '700', fontSize: '0.85em', letterSpacing: '0.5px' }}>
                                          {cleanBookTitle(ob.book)}
                                        </div>
                                      ) : (
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
                                            {(() => {
                                            
                                            // Hide outcome name for binary Yes/No markets (TD and Goal Scorer markets)
                                            const marketKey = (row.mkt?.key || '').toLowerCase();
                                            const isBinaryMarket = marketKey.includes('first_td') || 
                                                                  marketKey.includes('1st_td') || 
                                                                  marketKey.includes('first_touchdown') ||
                                                                  marketKey.includes('anytime_td') || 
                                                                  marketKey.includes('anytime_touchdown') ||
                                                                  marketKey.includes('first_goal') ||
                                                                  marketKey.includes('goal_scorer_first') ||
                                                                  marketKey.includes('anytime_goal') ||
                                                                  marketKey.includes('goal_scorer_anytime') ||
                                                                  marketKey.includes('last_goal') ||
                                                                  marketKey.includes('goal_scorer_last');
                                            
                                            if (isBinaryMarket && row.out.name === 'Yes') {
                                              // For binary markets with Yes outcome, don't show the outcome name
                                              return null;
                                            }
                                            
                                            // Show the actual line this sportsbook offers from allBooks (unfiltered)
                                            const isOverSide = row.out.name === 'Over';
                                            const relevantBook = isOverSide 
                                              ? (row.allBooks || []).find(book => 
                                                  normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(ob.bookmaker?.key) &&
                                                  (book.outcomeName === 'Over' || String(book.line || '').includes('Over'))
                                                )
                                              : (row.allBooks || []).find(book => 
                                                  normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(ob.bookmaker?.key) &&
                                                  (book.outcomeName === 'Under' || String(book.line || '').includes('Under'))
                                                );
                                            
                                            if (relevantBook) {
                                              const line = relevantBook.point || relevantBook.line;
                                              return `${row.out.name.toUpperCase()} ${line}`;
                                            }
                                            return `${row.out.name} ${row.out.point}`;
                                          })()}
                                        </div>
                                      </div>
                                      )
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
                                          <div className="mini-swipe-odds" style={ob.isBestOdds ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px' } : {}}>
                                            {(() => {
                                              // Find Over odds for this bookmaker from allBooks (unfiltered)
                                              const overBook = (row.allBooks || []).find(book => 
                                                normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(ob.bookmaker?.key) &&
                                                (book.outcomeName === 'Over' || String(book.line || '').includes('Over'))
                                              );
                                              if (!overBook) return '-';
                                              // Show only odds, line is displayed under sportsbook name
                                              // Use formatOddsWithBook to apply DFS fixed odds
                                              return formatOddsWithBook(Number(overBook.price ?? overBook.odds ?? 0), ob.bookmaker?.key);
                                            })()}
                                          </div>
                                        </div>
                                        <div className="mini-odds-col">
                                          <div className="mini-swipe-odds" style={ob.isBestOdds ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px' } : {}}>
                                            {(() => {
                                              // Find Under odds for this bookmaker from allBooks (unfiltered)
                                              const underBook = (row.allBooks || []).find(book => 
                                                normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(ob.bookmaker?.key) &&
                                                (book.outcomeName === 'Under' || String(book.line || '').includes('Under'))
                                              );
                                              if (!underBook) return '-';
                                              // Show only odds, line is displayed under sportsbook name
                                              // Use formatOddsWithBook to apply DFS fixed odds
                                              return formatOddsWithBook(Number(underBook.price ?? underBook.odds ?? 0), ob.bookmaker?.key);
                                            })()}
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      // Regular props - show single odds column
                                      <>
                                        <div className="mini-odds-col">
                                          <div className="mini-swipe-odds" style={ob.isBestOdds ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px' } : {}}>
                                            {formatOddsWithBook(Number(ob.price ?? ob.odds ?? 0), ob.bookmaker?.key)}
                                            {(() => {
                                              // Debug logging for bet limits
                                              if (ob.bookmaker?.key === 'novig' || ob.bookmaker?.key === 'prophetx') {
                                                console.log(`🔍 BET LIMIT DEBUG for ${ob.bookmaker?.key}:`, {
                                                  bet_limit: ob.bet_limit,
                                                  betLimit: ob.betLimit,
                                                  fullObject: ob
                                                });
                                              }
                                              
                                              const betLimit = ob.bet_limit || ob.betLimit;
                                              if (betLimit) {
                                                return (
                                                  <span className="bet-limit-indicator" title={`Max bet: $${betLimit}`}>
                                                    💰${betLimit}
                                                  </span>
                                                );
                                              }
                                              return null;
                                            })()}
                                          </div>
                                        </div>
                                      </>
                                    )
                                  ) : (
                                    // For regular games, show odds columns
                                    ob.isSummaryCard ? (
                                      // Summary cards show single centered odds (matching regular card layout)
                                      <>
                                        <div className="mini-odds-col">
                                          <div className="mini-swipe-odds" style={{ fontSize: '1.1em', fontWeight: '700' }}>
                                            {formatOdds(Number(ob.price ?? ob.odds ?? 0))}
                                          </div>
                                        </div>
                                        <div className="mini-odds-col">
                                          {/* Empty column for layout consistency */}
                                        </div>
                                      </>
                                    ) : (
                                      // Regular books show two odds columns (home/away)
                                      <>
                                        <div className="mini-odds-col">
                                          <div className="mini-swipe-odds" style={ob.isBestOdds ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px' } : {}}>
                                            {formatOdds(Number(grab(ob, true)))}
                                          </div>
                                        </div>
                                        <div className="mini-odds-col">
                                          <div className="mini-swipe-odds" style={ob.isBestOdds ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px' } : {}}>
                                            {formatOdds(Number(grab(ob, false)))}
                                          </div>
                                        </div>
                                      </>
                                    )
                                  )}
                                  <div className="mini-pick-col">
                                    {(() => {
                                      // Debug logging for links and source IDs
                                      if (i === 0) {
                                        console.log(`🔗 LINK & SID DEBUG for ${ob.bookmaker?.key}:`, {
                                          bookmaker_link: ob.bookmaker_link,
                                          market_link: ob.market_link,
                                          betslip_link: ob.betslip_link,
                                          event_sid: ob.event_sid,
                                          market_sid: ob.market_sid,
                                          outcome_sid: ob.outcome_sid,
                                          fullObject: ob
                                        });
                                      }
                                      
                                      if (ob.bookmaker_link || ob.market_link || ob.event_sid) {
                                        const hasDeepLinking = supportsDeepLinking(ob.bookmaker?.key);
                                        const title = hasDeepLinking 
                                          ? "Bet Now (Smart Link)" 
                                          : "Bet Now at Sportsbook";
                                        
                                        return (
                                          <a 
                                            href={ob.market_link || ob.bookmaker_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bet-now-btn"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              // Try to get enhanced deep link
                                              if (hasDeepLinking) {
                                                e.preventDefault();
                                                const bestLink = await getBestLink(ob);
                                                if (bestLink) {
                                                  window.open(bestLink, '_blank', 'noopener,noreferrer');
                                                } else {
                                                  window.open(ob.market_link || ob.bookmaker_link, '_blank', 'noopener,noreferrer');
                                                }
                                              }
                                            }}
                                            title={title}
                                          >
                                            {hasDeepLinking ? '🚀' : '🎯'}
                                          </a>
                                        );
                                      }
                                      return (
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
                                      );
                                    })()}
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
                {expandedRows[row.key] && (row.allBooks && row.allBooks.length > 0) && (
                  <tr className="desktop-mini-wrap">
                    <td colSpan={8}>
                      <div className="mini-odds-container">
                        <table className="mini-odds-table">
                          <thead>
                            <tr>
                              <th>Sportsbook</th>
                              {mode === "props" ? (
                                <>
                                  <th>Over</th>
                                  <th>Under</th>
                                </>
                              ) : (
                                <>
                                  <th>{shortTeam(row.game.home_team, row.game.sport_key)}</th>
                                  {row.game.sport_key?.includes('soccer') && <th>Draw</th>}
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
                                // Pin the main card's book to the top
                                const aIsMainBook = normalizeBookKey(a.bookmaker?.key || a.book) === normalizeBookKey(row.bk?.key || row.bk?.title);
                                const bIsMainBook = normalizeBookKey(b.bookmaker?.key || b.book) === normalizeBookKey(row.bk?.key || row.bk?.title);
                                if (aIsMainBook && !bIsMainBook) return -1;
                                if (!aIsMainBook && bIsMainBook) return 1;
                                
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
                                // Pin the main card's book to the top
                                const aIsMainBook = normalizeBookKey(a.bookmaker?.key || a.book) === normalizeBookKey(row.bk?.key || row.bk?.title);
                                const bIsMainBook = normalizeBookKey(b.bookmaker?.key || b.book) === normalizeBookKey(row.bk?.key || row.bk?.title);
                                if (aIsMainBook && !bIsMainBook) return -1;
                                if (!aIsMainBook && bIsMainBook) return 1;
                                
                                const aPriority = getBookPriority(a.bookmaker?.key || a.book);
                                const bPriority = getBookPriority(b.bookmaker?.key || b.book);
                                if (aPriority !== bPriority) {
                                  return aPriority - bPriority;
                                }
                                return compareOdds(a, b);
                              });

                              // For player props, show more books for better EV calculations and line shopping
                              // For straight bets, use the dataPoints slider value
                              // Filter out locked/stale markets to avoid showing unavailable bets
                              const maxDesktopBooks = mode === "props" ? 20 : dataPoints;
                              const allBooksUnsorted = [...sortedPrioritizedDesktop, ...sortedFallbackDesktop];
                              
                              // Ensure main card book is always at the top
                              const mainBookKey = normalizeBookKey(row.bk?.key || row.bk?.title);
                              const mainBook = allBooksUnsorted.find(book => 
                                normalizeBookKey(book.bookmaker?.key || book.book) === mainBookKey
                              );
                              const otherBooks = allBooksUnsorted.filter(book => 
                                normalizeBookKey(book.bookmaker?.key || book.book) !== mainBookKey
                              );
                              const allBooks = mainBook ? [mainBook, ...otherBooks] : allBooksUnsorted;
                              
                              // Check if mini table is expanded to show all books
                              const isMiniTableExpanded = expandedMiniTables[row.key];
                              const displayBooks = isMiniTableExpanded ? allBooks : allBooks.slice(0, maxDesktopBooks);
                              const hasMoreBooks = allBooks.length > maxDesktopBooks;

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
                                    <>
                                      <td className="mini-odds-cell" style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.7)' }}>
                                        {p.point || p.line || '-'}
                                      </td>
                                      <td className="mini-odds-cell">
                                        {(() => {
                                          const overBook = (row.allBooks || []).find(book => 
                                            normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(p.bookmaker?.key) &&
                                            (book.outcomeName === 'Over' || String(book.line || '').includes('Over'))
                                          );
                                          // Check if this is the best odds for Over (same line only)
                                          const isBestOver = overBook && row.allBooks && row.allBooks.some(book => 
                                            book.outcomeName === 'Over' && 
                                            (book.point || book.line) === (overBook.point || overBook.line) &&
                                            americanToDecimal(book.price) > americanToDecimal(overBook.price)
                                          ) === false;
                                          return overBook ? (
                                            <span style={isBestOver ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px', display: 'inline-block' } : {}}>
                                              {formatOdds(Number(overBook.price ?? overBook.odds ?? 0))}
                                            </span>
                                          ) : '-';
                                        })()}
                                      </td>
                                      <td className="mini-odds-cell">
                                        {(() => {
                                          const underBook = (row.allBooks || []).find(book => 
                                            normalizeBookKey(book.bookmaker?.key) === normalizeBookKey(p.bookmaker?.key) &&
                                            (book.outcomeName === 'Under' || String(book.line || '').includes('Under'))
                                          );
                                          // Check if this is the best odds for Under (same line only)
                                          const isBestUnder = underBook && row.allBooks && row.allBooks.some(book => 
                                            book.outcomeName === 'Under' && 
                                            (book.point || book.line) === (underBook.point || underBook.line) &&
                                            americanToDecimal(book.price) > americanToDecimal(underBook.price)
                                          ) === false;
                                          return underBook ? (
                                            <span style={isBestUnder ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px', display: 'inline-block' } : {}}>
                                              {formatOdds(Number(underBook.price ?? underBook.odds ?? 0))}
                                            </span>
                                          ) : '-';
                                        })()}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="mini-odds-cell">
                                        {(() => {
                                          const homeOdds = Number(grab(p, true));
                                          // Check if this is the best odds for home team (higher decimal = better odds)
                                          const homeDecimal = americanToDecimal(homeOdds);
                                          const isBestHome = (row.allBooks || []).every(book => {
                                            const bookHomeOdds = americanToDecimal(Number(grab(book, true)));
                                            return bookHomeOdds <= homeDecimal;
                                          });
                                          return (
                                            <span style={isBestHome ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px', display: 'inline-block' } : {}}>
                                              {formatOdds(homeOdds)}
                                            </span>
                                          );
                                        })()}
                                      </td>
                                      {row.game.sport_key?.includes('soccer') && p.outcomes && p.outcomes.length >= 3 && (
                                        <td className="mini-odds-cell">
                                          {(() => {
                                            const drawOdds = Number(p.outcomes[2]?.price ?? p.outcomes[2]?.odds ?? 0);
                                            // Check if this is the best odds for draw
                                            const isBestDraw = (row.allBooks || []).some(book => 
                                              book.outcomes && book.outcomes.length >= 3 &&
                                              americanToDecimal(Number(book.outcomes[2]?.price ?? book.outcomes[2]?.odds ?? 0)) > americanToDecimal(drawOdds)
                                            ) === false;
                                            return (
                                              <span style={isBestDraw ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px', display: 'inline-block' } : {}}>
                                                {formatOdds(drawOdds)}
                                              </span>
                                            );
                                          })()}
                                        </td>
                                      )}
                                      <td className="mini-odds-cell">
                                        {(() => {
                                          const awayOdds = Number(grab(p, false));
                                          // Check if this is the best odds for away team (higher decimal = better odds)
                                          const awayDecimal = americanToDecimal(awayOdds);
                                          const isBestAway = (row.allBooks || []).every(book => {
                                            const bookAwayOdds = americanToDecimal(Number(grab(book, false)));
                                            return bookAwayOdds <= awayDecimal;
                                          });
                                          return (
                                            <span style={isBestAway ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '2px 6px', display: 'inline-block' } : {}}>
                                              {formatOdds(awayOdds)}
                                            </span>
                                          );
                                        })()}
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
                                  
                                  {/* Show book count or View All Books button */}
                                  {displayBooks.length > 0 && (
                                    <tr>
                                      <td colSpan={mode === "props" ? 5 : 4} style={{
                                        textAlign: 'center',
                                        padding: '12px 8px',
                                        fontSize: '11px',
                                        color: 'var(--text-secondary)',
                                        borderTop: '1px solid var(--border-color)',
                                        background: 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%'
                                      }}>
                                        {hasMoreBooks && !isMiniTableExpanded ? (
                                          <button
                                            onClick={() => toggleMiniTable(row.key)}
                                            style={{
                                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                              color: '#fff',
                                              border: 'none',
                                              padding: '8px 16px',
                                              borderRadius: '6px',
                                              cursor: 'pointer',
                                              fontSize: '12px',
                                              fontWeight: '600',
                                              transition: 'all 0.2s ease',
                                              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.5)';
                                              e.target.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
                                              e.target.style.transform = 'translateY(0)';
                                            }}
                                          >
                                            View All {allBooks.length} Books
                                          </button>
                                        ) : hasMoreBooks && isMiniTableExpanded ? (
                                          <button
                                            onClick={() => toggleMiniTable(row.key)}
                                            style={{
                                              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                              color: '#fff',
                                              border: 'none',
                                              padding: '8px 16px',
                                              borderRadius: '6px',
                                              cursor: 'pointer',
                                              fontSize: '12px',
                                              fontWeight: '600',
                                              transition: 'all 0.2s ease',
                                              boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.5)';
                                              e.target.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.3)';
                                              e.target.style.transform = 'translateY(0)';
                                            }}
                                          >
                                            Show Less
                                          </button>
                                        ) : (
                                          <>Showing {displayBooks.length} available book{displayBooks.length !== 1 ? 's' : ''}</>
                                        )}
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
