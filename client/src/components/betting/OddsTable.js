import React, { useState, useRef, useEffect, useMemo } from "react";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import OddsTableSkeleton, { OddsTableSkeletonMobile } from "./OddsTableSkeleton";
import { useMe } from "../../hooks/useMe";
import "./OddsTable.css";

// Removed logos import for compliance
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
  const n = a.length; if (!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
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
  return key.replace("player_", "").toUpperCase();
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
  if (key === homeKey) {
    return game?.home_logo || '';
  }
  const awayKey = normalizeTeamKey(game?.away_team);
  if (key === awayKey) {
    return game?.away_logo || '';
  }
  return '';
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
}) {
  
  // Get user plan information for free trial restrictions
  const { me } = useMe();
  
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
  const [sort, setSort] = useState(initialSort || { key: "ev", dir: "desc" });

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

  /* ---------- Build rows (game mode) ---------- */
  const allRows = useMemo(() => {
    try {
      if (mode === "props") {
        const propsRows = [];
        const propGroups = new Map(); // Group props by player+market+point
        
        // First pass: collect all props and group them
        console.log('Processing games for props mode. Total games:', games?.length);
      
      // Log what markets we're looking for
      console.log('Looking for player prop markets containing: player_, batter_, pitcher_');
      console.log('Looking for DFS sites:', ['prizepicks', 'underdog', 'sleeper']);
      
      // Debug: Log raw games data to see what's actually being received
      games?.forEach((game, idx) => {
        console.log(`Game ${idx + 1} (${game.id}):`, {
          sport: game.sport_key,
          teams: `${game.away_team} @ ${game.home_team}`,
          bookmakers: game.bookmakers?.length || 0,
          bookmakerKeys: game.bookmakers?.map(b => b.key) || [],
          totalMarkets: game.bookmakers?.reduce((sum, b) => sum + (b.markets?.length || 0), 0) || 0,
          marketKeys: game.bookmakers?.flatMap(b => b.markets?.map(m => m.key) || []) || []
        });
      });
      
      
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
            const isDFSSite = ['prizepicks', 'underdog', 'sleeper'].includes(bookmaker.key?.toLowerCase());
            const isPlayerPropMarket = market.key?.includes('player_') || market.key?.includes('batter_') || market.key?.includes('pitcher_');
            const isRegularMarket = ['h2h', 'spreads', 'totals'].includes(market.key);
            
            // In props mode: only show player prop markets or DFS sites
            // In regular mode: only show regular markets (h2h, spreads, totals)
            if (mode === 'props') {
              if (!isDFSSite && !isPlayerPropMarket) {
                console.log(`Skipping market ${market.key} for ${bookmaker.key} - not DFS and not player prop (props mode)`);
                return;
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
              
              // Group Over/Under pairs by player (description field)
              const playerGroups = {};
              market.outcomes.forEach(outcome => {
                const playerName = outcome.description || outcome.name;
                if (!playerGroups[playerName]) {
                  playerGroups[playerName] = [];
                }
                playerGroups[playerName].push(outcome);
              });
              
              Object.entries(playerGroups).forEach(([playerName, outcomes]) => {
                if (outcomes.length >= 2) { // Need both Over and Under
                  const overOutcome = outcomes.find(o => o.name === 'Over');
                  const underOutcome = outcomes.find(o => o.name === 'Under');
                  
                  if (overOutcome && underOutcome && overOutcome.point !== undefined) {
                    const propKey = `${game.id}-${market.key}-${playerName}-${overOutcome.point}`;
                    console.log(`Creating prop for ${playerName}: ${market.key} ${overOutcome.point}`);
                    
                    if (!propGroups.has(propKey)) {
                      propGroups.set(propKey, {
                        game,
                        mkt: { 
                          key: market.key, 
                          name: market.key.replace('player_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                        },
                        out: {
                          name: playerName,
                          price: overOutcome.price,
                          odds: overOutcome.price,
                          point: overOutcome.point
                        },
                        bk: bookmaker,
                        sport: game.sport_key,
                        isPlayerProp: true,
                        allBooks: []
                      });
                    }
                    
                    const propGroup = propGroups.get(propKey);
                    propGroup.allBooks.push({
                      price: overOutcome.price,
                      odds: overOutcome.price,
                      book: bookmaker.title,
                      bookmaker: bookmaker,
                      market: market
                    });
                  }
                }
              });
              
              return; // Skip the old processing for this market
            }
            
            // Original processing for other formats
            market.outcomes?.forEach(outcome => {
              const propKey = `${game.id}-${market.key}-${outcome.name}-${outcome.point || 'no-point'}`;
              
              // Log detailed prop creation for debugging
              if (isDFSSite) {
                console.log(`Creating prop key: ${propKey} for ${bookmaker.key}`);
                console.log(`Outcome details:`, {
                  name: outcome.name,
                  point: outcome.point,
                  price: outcome.price,
                  marketKey: market.key
                });
              }
              
              if (!propGroups.has(propKey)) {
                propGroups.set(propKey, {
                  game,
                  mkt: { 
                    key: market.key, 
                    name: market.key.replace('player_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
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
                  allBooks: []
                });
              }
              
              // Add this bookmaker's odds to the group
              propGroups.get(propKey).allBooks.push({
                price: outcome.price, 
                odds: outcome.price,
                book: bookmaker.title,
                bookmaker: bookmaker,
                market: market
              });
            });
          });
        });
      });
      
      // Second pass: include all props and apply sportsbook filter
      console.log(`Total prop groups collected: ${propGroups.size}`);
      propGroups.forEach((propData, propKey) => {
        console.log(`Processing prop group: ${propKey} with ${propData.allBooks.length} books`);
        
        // Apply sportsbook filter if active
        if (bookFilter && bookFilter.length > 0) {
          const hasMatchingBook = propData.allBooks.some(book => {
            const keyMatch = bookFilter.includes(book.bookmaker?.key);
            const nameMatch = bookFilter.includes(book.book?.toLowerCase().replace(/\s+/g, ''));
            console.log('Filtering prop:', propData.out.name, 'Book:', book.bookmaker?.key, book.book, 'Match:', keyMatch || nameMatch);
            return keyMatch || nameMatch;
          });
          if (!hasMatchingBook) {
            console.log(`Skipping prop ${propKey} - no matching sportsbook`);
            return; // Skip this prop if no matching sportsbook
          }
        }
        
        // Add this prop to the results
        propsRows.push(propData);
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

        const candidates = allMarketOutcomes.filter(o => {
          // If no bookFilter specified, include all bookmakers
          if (!bookFilter || !bookFilter.length) return true;
          return bookFilter.includes(o.bookmaker.key);
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
    const pDevig = consensusDevigProb(row);
    const pairCnt = devigPairCount(row);
    if (pDevig && pDevig > 0 && pDevig < 1 && pairCnt > 4) {
      const fairDec = 1 / pDevig;
      return calculateEV(userOdds, decimalToAmerican(fairDec));
    }
    const probs = (row.allBooks || []).map(b => americanToProb(b.price ?? b.odds)).filter(p => typeof p === "number" && p > 0 && p < 1);
    const consensusProb = median(probs);
    const uniqCnt = uniqueBookCount(row);
    if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt > 4) {
      const fairDec = 1 / consensusProb;
      return calculateEV(userOdds, decimalToAmerican(fairDec));
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
    if (evOnlyPositive || (typeof evMin === 'number' && !Number.isNaN(evMin))) {
      r = r.filter(row => {
        const ev = evMap.get(row.key);
        if (ev == null || Number.isNaN(ev)) return false;
        if (evOnlyPositive && ev <= 0) return false;
        if (typeof evMin === 'number' && ev < evMin) return false;
        return true;
      });
    }
    // keep only best odds per game/market/point bucket (most favorable for bettor)
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
      
      if (!cur) {
        bestBy.set(gk, { row: rr, odds, ev });
      } else {
        // Prioritize best odds, but use EV as tiebreaker
        if (isBetterOdds(odds, cur.odds) || (odds === cur.odds && ev > cur.ev)) {
          bestBy.set(gk, { row: rr, odds, ev });
        }
      }
    });
    r = Array.from(bestBy.values()).map(v => v.row);
    return r.slice().sort((a, b) => (sort.dir === 'asc' ? -sorter(a, b) : sorter(a, b)));
  }, [allRows, evOnlyPositive, evMin, sort.dir, sorter, evMap]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const paginatedRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  useEffect(() => setPage(1), [games, mode, pageSize, bookFilter, marketFilter, evOnlyPositive, evMin]);

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

  /* ---------- Render ---------- */
  if (loading) return (
    <div className="odds-table-loading">
      <div className="loading-spinner"></div>
      <div className="loading-text">Refreshing odds data...</div>
      <div className="loading-subtext">Getting the latest odds from all sportsbooks</div>
      <style jsx>{`
        .odds-table-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: var(--card-bg);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          margin: 1rem 0;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top: 3px solid var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }
        
        .loading-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        
        .loading-subtext {
          font-size: 0.9rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .mob-total-stack {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
          text-align: left;
        }
        
        .mob-total-market {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .mob-total-side {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 1px;
        }
      `}</style>
    </div>
  );
  if (!allRows.length && !loading) return null;

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
            <th>Team</th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'line', dir:s.key==='line'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Line <span className="sort-indicator">{sort.key==='line'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'book', dir:s.key==='book'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Book <span className="sort-indicator">{sort.key==='book'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'odds', dir:s.key==='odds'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Odds <span className="sort-indicator">{sort.key==='odds'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th>De-Vig</th>
            <th>
              {onAddBet && (
                <button
                  className="bet-slip-header-btn"
                  onClick={onOpenBetSlip}
                  title="Open Bet Slip"
                  style={{
                    background: betSlipCount > 0 ? 'var(--accent)' : '#334155',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🎫 Slip
                  {betSlipCount > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700'
                      }}
                    >
                      {betSlipCount}
                    </span>
                  )}
                </button>
              )}
            </th>
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
                  <div className="mob-player-prop">
                    <div className="mob-player-name">{row.out.name.split(' Over ')[0].split(' Under ')[0]}</div>
                    <div className="mob-prop-type">{row.mkt.name}</div>
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
                          addToPicks(row, { bookmaker: row.bk, book: row.bk?.title }, false, e.target);
                        }}
                        title="Add to My Picks"
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
                          {row.game?.away_logo && (
                            <img
                              src={row.game.away_logo}
                              alt={`${row.game?.away_team || 'Away'} logo`}
                              className="desktop-team-logo"
                              loading="lazy"
                            />
                          )}
                          <span>{row.game?.away_team || 'Away Team'}</span>
                        </div>
                        <div className="desktop-team-row">
                          {row.game?.home_logo && (
                            <img
                              src={row.game.home_logo}
                              alt={`${row.game?.home_team || 'Home'} logo`}
                              className="desktop-team-logo"
                              loading="lazy"
                            />
                          )}
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
                      <span style={{ fontWeight:800 }}>
                        {(row.mkt?.key || '') === 'h2h'
                          ? shortTeam(row.out?.name, row.game?.sport_key)
                          : (row.out?.name || '')}
                      </span>
                      <span style={{ opacity:.9 }}>
                        {formatMarket(row.mkt?.key || '')}
                      </span>
                    </div>
                  </td>
                  <td>{(row.mkt?.key || '') === 'h2h' ? '' : formatLine(row.out?.point, row.mkt?.key, 'game')}</td>
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
                    {/* Desktop subtext retained; mobile hides via CSS */}
                    <div className="mobile-subtext">
                      {cleanBookTitle(row.bk?.title)}
                      {(row.mkt.key || '') !== 'h2h' && (row.out.point != null && row.out.point !== '') ? ` • ${formatLine(row.out.point, row.mkt.key, 'game')}` : ''}
                      {fair != null ? ` • Fair ${(() => {
                        const n = Number(fair);
                        if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
                        if (currentOddsFormat === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                        const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                        const den = n > 0 ? 100 : Math.round(Math.abs(n));
                        const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                        return `${num/g}/${den/g}`;
                      })()}` : ''}
                    </div>
                  </td>
                  <td>{fair != null ? (Number(fair) > 0 ? `+${fair}` : `${fair}`) : ''}</td>
                  <td aria-hidden="true"></td>
                </tr>

                {/* ----- Mobile card (click to expand) ----- */}
                <tr className="mobile-card-row" aria-hidden={false}>
                  <td colSpan={8}>
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
                              {row.game?.away_logo ? (
                                <img
                                  src={row.game.away_logo}
                                  alt={`${row.game?.away_team || 'Away'} logo`}
                                  className="mob-team-logo"
                                  loading="lazy"
                                />
                              ) : null}
                              <span>{row.game?.away_team || 'Away Team'}</span>
                            </div>
                            <div className="team-line">
                              {row.game?.home_logo ? (
                                <img
                                  src={row.game.home_logo}
                                  alt={`${row.game?.home_team || 'Home'} logo`}
                                  className="mob-team-logo"
                                  loading="lazy"
                                />
                              ) : null}
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
                              <span className={`mob-prop-side ${row.out.name.includes('Over') ? 'over' : 'under'}`}>
                                {row.out.name.includes('Over') ? 'Over' : 'Under'} {row.out.point}
                              </span>
                            </div>
                          ) : (
                            <>
                              {String(row.mkt?.key).includes('total') ? (
                                <div className="mob-total-stack">
                                  <div className="mob-total-market">TOTAL</div>
                                  <div className="mob-total-side">{(row.out.name || '').toUpperCase()}</div>
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
                              <div className="mini-header-odds mini-props-header">Odds</div>
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
                              return (row.allBooks || []).filter(item => {
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

                            return cols.map((ob, i) => (
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
                                          {row.out.name.includes('Over') ? 'Over' : 'Under'} {row.out.point}
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
                                    // For props, show single odds column
                                    <>
                                      <div className="mini-odds-col">
                                        <div className="mini-swipe-odds">
                                          {formatOdds(Number(ob.price ?? ob.odds ?? 0))}
                                        </div>
                                      </div>
                                    </>
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
                              ));
                          })()}
                          
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
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Desktop/Tablet mini-table (hide on mobile via CSS) */}
                {expandedRows[row.key] && row.allBooks.length > 0 && (
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

                              return displayBooks.map((p, i) => (
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
                              ));
                            })()}
                          </tbody>
                          {/* Show book count for player props */}
                          {mode === "props" && displayBooks.length > 0 && (
                            <tfoot>
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
                            </tfoot>
                          )}
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
