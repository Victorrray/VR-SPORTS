// src/pages/SportsbookMarkets.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileBottomBar from "../components/MobileBottomBar";
import MobileFiltersSheet from "../components/MobileFiltersSheet";
import MobileSearchModal from "../components/MobileSearchModal";
import { useBetSlip } from "../contexts/BetSlipContext";
import BetSlip from "../components/BetSlip";
// Removed unused imports: PersonalizedDashboard, EdgeCalculator, AlertSystem

// ⬇️ Adjust these paths if needed
import SportMultiSelect from "../components/SportMultiSelect";
import DatePicker from "../components/DatePicker";
import OddsTable from "../components/OddsTable";
import ArbitrageDetector from "../components/ArbitrageDetector";
import useDebounce from "../hooks/useDebounce";
import { withApiBase } from "../config/api";
import { useMarkets } from '../hooks/useMarkets';
import { useMe } from '../hooks/useMe';
import { useAuth } from '../hooks/useAuth';

// Add responsive layout styles
const arbitrageSplitViewStyles = `
  .arbitrage-split-view {
    display: grid;
    gap: 24px;
    align-items: start;
  }
  
  @media (min-width: 1024px) {
    .arbitrage-split-view {
      grid-template-columns: 1fr 400px;
    }
  }
  
  @media (max-width: 1023px) {
    .arbitrage-split-view {
      grid-template-columns: 1fr;
    }
    
    .arbitrage-split-view > div:first-child {
      order: 2;
    }
    
    .arbitrage-split-view > div:last-child {
      order: 1;
      position: relative;
      top: 0;
      max-height: 400px;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('arbitrage-styles')) {
  const style = document.createElement('style');
  style.id = 'arbitrage-styles';
  style.textContent = arbitrageSplitViewStyles;
  document.head.appendChild(style);
}

// Import getSportLeague function
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

/* =========================
   Constants & helpers
   ========================= */

// Which markets to show for main sportsbooks (game lines)
const GAME_LINES = ["h2h", "spreads", "totals"];

// Friendly titles for markets
const MARKET_TITLES = {
  h2h: "Moneyline",
  spreads: "Spread",
  totals: "Totals",
  spreads_alternate: "Alt Spread",
  totals_alternate: "Alt Totals",
  alternate_spreads: "Alt Spread",
  alternate_totals: "Alt Totals",
  // Period/segment
  first_half_spreads: "1H Spread",
  first_half_totals: "1H Totals",
  first_half_moneyline: "1H Moneyline",
  team_totals: "Team Totals",
  team_totals_home: "Home Team Total",
  team_totals_away: "Away Team Total",
  first_quarter_spreads: "1Q Spread",
  first_quarter_totals: "1Q Totals",
  first_quarter_moneyline: "1Q Moneyline",
  first_five_moneyline: "F5 Moneyline",
  first_five_spreads: "F5 Runline",
  first_five_totals: "F5 Totals",
  // Soccer specific
  draw_no_bet: "Draw No Bet",
  double_chance: "Double Chance",
  btts: "Both Teams To Score",
  corners: "Corners",
  cards: "Cards",
  // Tennis specific (availability varies by provider)
  set_winner: "Set Winner",
  game_handicap: "Game Handicap",
  set_totals: "Set Totals",
  total_sets: "Total Sets",
};

// Suggested markets per sport (unioned for multi-select)
const SPORT_MARKETS = {
  americanfootball_nfl: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "first_half_moneyline", "first_half_spreads", "first_half_totals",
    "team_totals", "team_totals_home", "team_totals_away",
  ],
  americanfootball_ncaaf: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "first_half_moneyline", "first_half_spreads", "first_half_totals",
    "team_totals", "team_totals_home", "team_totals_away",
  ],
  basketball_nba: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "first_half_moneyline", "first_half_spreads", "first_half_totals",
    "first_quarter_moneyline", "first_quarter_spreads", "first_quarter_totals",
    "team_totals", "team_totals_home", "team_totals_away",
  ],
  basketball_ncaab: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "first_half_moneyline", "first_half_spreads", "first_half_totals",
    "team_totals",
  ],
  baseball_mlb: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "first_five_moneyline", "first_five_spreads", "first_five_totals",
    "team_totals",
  ],
  baseball_kbo: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "first_five_moneyline", "first_five_spreads", "first_five_totals",
    "team_totals",
  ],
  baseball_npb: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "first_five_moneyline", "first_five_spreads", "first_five_totals",
    "team_totals",
  ],
  baseball_cpbl: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "first_five_moneyline", "first_five_spreads", "first_five_totals",
    "team_totals",
  ],
  icehockey_nhl: [
    "h2h", "spreads", "totals",
    "spreads_alternate", "totals_alternate",
    "team_totals",
  ],
  soccer_epl: [
    "h2h", "draw_no_bet", "double_chance", "totals", "totals_alternate", "btts", "corners", "cards",
  ],
  soccer_uefa_champs_league: [
    "h2h", "draw_no_bet", "double_chance", "totals", "totals_alternate", "btts", "corners", "cards",
  ],
  tennis_atp: ["h2h", "totals", "set_winner", "game_handicap", "set_totals", "total_sets"],
  tennis_wta: ["h2h", "totals", "set_winner", "game_handicap", "set_totals", "total_sets"],
  tennis_challenger: ["h2h", "totals", "set_winner", "game_handicap", "set_totals"],
  tennis_itf_men: ["h2h", "totals", "set_winner", "game_handicap"],
  tennis_itf_women: ["h2h", "totals", "set_winner", "game_handicap"],
  mma_mixed_martial_arts: ["h2h"],
  boxing_boxing: ["h2h"],
};


// Map API sport keys to common short names
const FRIENDLY_TITLES = {
  basketball_nba: "NBA",
  basketball_ncaab: "NCAAB",
  basketball_wnba: "WNBA",
  baseball_mlb: "MLB",
  baseball_kbo: "KBO",
  baseball_npb: "NPB",
  baseball_cpbl: "CPBL",
  americanfootball_nfl: "NFL",
  americanfootball_ncaaf: "NCAAF",
  icehockey_nhl: "NHL",
  soccer_epl: "EPL",
  soccer_uefa_champs_league: "UCL",
  tennis_atp: "ATP",
  tennis_wta: "WTA",
  tennis_challenger: "Challenger",
  tennis_itf_men: "ITF (Men)",
  tennis_itf_women: "ITF (Women)",
  mma_mixed_martial_arts: "MMA",
  boxing_boxing: "BOXING",
};

// Keep the sport picker short by default
// Removed sports causing 404 errors: tennis_atp, tennis_wta, baseball_kbo, baseball_npb, baseball_cpbl
const FEATURED_SPORTS = new Set([
  "basketball_nba",
  "basketball_wnba", 
  "baseball_mlb",
  "baseball_kbo",
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "soccer_epl",
]);

/* =========================
   Component
   ========================= */

const SportsbookMarkets = ({ onRegisterMobileSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { me } = useMe();
  const { bets, isOpen, addBet, removeBet, updateBet, clearAllBets, openBetSlip, closeBetSlip, placeBets } = useBetSlip();
  const [sportList, setSportList] = useState([]);
  // Initialize state from localStorage or defaults
  // Get initial sports from URL or fallback to localStorage/default
  const getInitialSports = () => {
    if (typeof window === "undefined") return ["americanfootball_nfl", "americanfootball_ncaaf"];
    
    try {
      // Check URL params first
      const params = new URLSearchParams(window.location.search);
      const sportsParam = params.get('sports');
      
      if (sportsParam) {
        const sports = sportsParam.split(',');
        // Validate sports to prevent XSS
        const validSports = sports.filter(sport => 
          /^[a-z_]+$/.test(sport) // Basic validation for sport keys
        );
        if (validSports.length > 0) {
          return validSports;
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem("vr-odds-sports");
      return saved ? JSON.parse(saved) : ["americanfootball_nfl", "americanfootball_ncaaf"];
    } catch (error) {
      console.error('Error getting initial sports:', error);
      return ["americanfootball_nfl", "americanfootball_ncaaf"];
    }
  };

  const [picked, setPicked] = useState(getInitialSports);
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    // Check URL first, then localStorage
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get("q");
    if (urlQuery) return urlQuery;
    return localStorage.getItem("vr-odds-query") || "";
  });
  const [games, setGames] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("vr-odds-books");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [tableNonce, setTableNonce] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastErrorTime, setLastErrorTime] = useState(0);
  const ERROR_THROTTLE_MS = 10000; // 10 seconds between error messages
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("vr-odds-date") || "";
  });
  const [marketKeys, setMarketKeys] = useState(() => {
    if (typeof window === "undefined") return ["h2h", "spreads", "totals"];
    try {
      const saved = localStorage.getItem("vr-odds-markets");
      return saved ? JSON.parse(saved) : ["h2h", "spreads", "totals"];
    } catch {
      return ["h2h", "spreads", "totals"];
    }
  });
  const [settingsOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [minEV, setMinEV] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("vr-odds-minev") || "";
  });
  const [activePreset, setActivePreset] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("vr-odds-preset") || null;
  });
  // Player props DISABLED - always false to eliminate broken functionality
  const [showPlayerProps, setShowPlayerProps] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showArbitrage, setShowArbitrage] = useState(false);
  
  // Check if user has platinum plan for arbitrage access
  const hasPlatinum = me?.plan === 'platinum';
  const isOverQuota = me?.plan !== 'platinum' && me?.calls_made >= (me?.limit || 250);
  const [oddsFormat] = useState('american');
  // Debounced query for smoother filtering and to feed MobileSearchModal
  const debouncedQuery = useDebounce(query, 300);

  // Sync query with URL parameters on route changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get("q") || "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
      localStorage.setItem("vr-odds-query", urlQuery);
    }
  }, [location.search, query]);

  // Draft filter state (edited in the sheet, applied on "Apply")
  const [draftPicked, setDraftPicked] = useState([]);
  const [draftSelectedDate, setDraftSelectedDate] = useState('');
  const [draftSelectedBooks, setDraftSelectedBooks] = useState([]);
  const [draftMarketKeys, setDraftMarketKeys] = useState([]);

  // Seed draft values whenever the filter sheet opens
  useEffect(() => {
    if (mobileFiltersOpen) {
      setDraftPicked(picked);
      setDraftSelectedDate(selectedDate || '');
      setDraftSelectedBooks(selectedBooks);
      setDraftMarketKeys(marketKeys);
    }
  }, [mobileFiltersOpen, picked, selectedDate, selectedBooks, marketKeys]);

  // Helpers to reset/apply filters
  const getDefaultSports = () => ["basketball_nba", "americanfootball_nfl"];

  const applyFilters = () => {
    // Apply draft → live state and persist
    setPicked(draftPicked && draftPicked.length ? draftPicked : getDefaultSports());
    setSelectedDate(draftSelectedDate || '');
    setSelectedBooks(draftSelectedBooks || []);
    setMarketKeys(draftMarketKeys && draftMarketKeys.length ? draftMarketKeys : ["h2h", "spreads", "totals"]);

    try {
      localStorage.setItem('vr-odds-sports', JSON.stringify(draftPicked && draftPicked.length ? draftPicked : getDefaultSports()));
      localStorage.setItem('vr-odds-date', draftSelectedDate || '');
      localStorage.setItem('vr-odds-books', JSON.stringify(draftSelectedBooks || []));
      localStorage.setItem('vr-odds-markets', JSON.stringify(draftMarketKeys && draftMarketKeys.length ? draftMarketKeys : ["h2h", "spreads", "totals"]));
    } catch {}

    // Update URL for sports param for shareability
    const params = new URLSearchParams(location.search);
    const sportsForUrl = (draftPicked && draftPicked.length ? draftPicked : getDefaultSports()).join(',');
    if (sportsForUrl) params.set('sports', sportsForUrl); else params.delete('sports');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });

    setMobileFiltersOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftPicked(getDefaultSports());
    setDraftSelectedDate('');
    setDraftSelectedBooks([]);
    setDraftMarketKeys(["h2h", "spreads", "totals"]);
  };

  const resetAndApplyDefaults = () => {
    // Quick reset (used by empty-state button)
    setPicked(getDefaultSports());
    setSelectedDate('');
    setSelectedBooks([]);
    setMarketKeys(["h2h", "spreads", "totals"]);
    try {
      localStorage.setItem('vr-odds-sports', JSON.stringify(getDefaultSports()));
      localStorage.setItem('vr-odds-date', '');
      localStorage.setItem('vr-odds-books', JSON.stringify([]));
      localStorage.setItem('vr-odds-markets', JSON.stringify(["h2h", "spreads", "totals"]));
    } catch {}
    const params = new URLSearchParams(location.search);
    params.set('sports', getDefaultSports().join(','));
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  // Load sports list (for the picker)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(withApiBase('/api/sports'));
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const arr = await r.json();
        const normalized = (Array.isArray(arr) ? arr : [])
          .filter(s => s && (s.active === undefined || s.active))
          .map(s => ({ key: s.key, title: s.title || (FRIENDLY_TITLES[s.key] || s.key) }));
        console.log('Fetched sports list:', normalized);
        if (!cancelled) setSportList(normalized);
      } catch (e) {
        console.error('Failed to fetch sports list:', e);
        // Fallback to featured list
        const fallback = Array.from(FEATURED_SPORTS).map(key => ({
          key,
          title: FRIENDLY_TITLES[key] || key
        }));
        console.log('Using fallback sports list:', fallback);
        if (!cancelled) setSportList(fallback);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // NOTE: moved filteredGames/effectiveSelectedBooks after useMarkets to avoid TDZ errors

  function handleMobileSearch(searchTerm) {
    try {
      console.log('📱 SportsbookMarkets: handleMobileSearch called with:', searchTerm);
      console.log('📱 SportsbookMarkets: Current query before update:', query);
      setQuery(searchTerm);
      
      // Update URL to include search parameter
      const params = new URLSearchParams(location.search);
      if (searchTerm.trim()) {
        params.set('q', searchTerm);
      } else {
        params.delete('q');
      }
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      
      localStorage.setItem("vr-odds-query", searchTerm);
      console.log('📱 SportsbookMarkets: localStorage updated');
    } catch (err) {
      console.error('Error updating search query:', err);
      // Don't show storage errors to the user as they're not critical
    }
    setShowMobileSearch(false);
  }

  // Handle search query changes with debounce and error handling
  const debouncedSearch = useDebounce((searchTerm) => {
    try {
      setQuery(searchTerm);
      localStorage.setItem("vr-odds-query", searchTerm);
    } catch (err) {
      console.error('Error updating search query:', err);
    }
  }, 300);

  // Fetch markets data with error handling and retry logic
  const { 
    games: marketGames = [], 
    books: marketBooks = [], 
    isLoading: marketsLoading, 
    error: marketsError, 
    bookmakers 
  } = useMarkets(
    picked,
    ["us", "us2", "us_exchanges"],
    marketKeys,
    selectedDate ? new Date(selectedDate) : null
  );

  // Keep local book list in sync with hook results
  useEffect(() => {
    if (Array.isArray(marketBooks)) setBookList(marketBooks);
  }, [marketBooks]);

  // Filtered games based on date and query
  const filteredGames = useMemo(() => {
    let base = Array.isArray(marketGames) ? marketGames : [];
    // Filter by selected date (local date)
    if (selectedDate) {
      base = base.filter(g => {
        const d = new Date(g.commence_time);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const local = `${y}-${m}-${day}`;
        return local === selectedDate;
      });
    }
    const q = (debouncedQuery || '').trim().toLowerCase();
    if (!q) return base;
    return base.filter(g =>
      (g.home_team && g.home_team.toLowerCase().includes(q)) ||
      (g.away_team && g.away_team.toLowerCase().includes(q)) ||
      (g.sport_title && g.sport_title.toLowerCase().includes(q))
    );
  }, [marketGames, selectedDate, debouncedQuery]);

  // Effective book filter (all if none selected)
  const effectiveSelectedBooks = useMemo(() => {
    return (selectedBooks && selectedBooks.length)
      ? selectedBooks
      : (Array.isArray(marketBooks) ? marketBooks.map(b => b.key) : []);
  }, [selectedBooks, marketBooks]);

  // Handle errors from useMarkets
  useEffect(() => {
    if (marketsError) {
      const now = Date.now();
      // Only update error state if it's been more than ERROR_THROTTLE_MS since the last error
      if (now - lastErrorTime > ERROR_THROTTLE_MS) {
        console.error('🔴 Markets error:', marketsError);
        setError(marketsError.message || 'Failed to load markets');
        setLastErrorTime(now);
      }
    } else {
      // Clear error when there's no error
      setError(null);
    }
  }, [marketsError, lastErrorTime]);

  // Update loading state with debounce to prevent flickering
  useEffect(() => {
    if (marketsLoading) {
      setLoading(true);
    } else {
      // Add a small delay before hiding the loading indicator to prevent flickering
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [marketsLoading]);

  // Set up event listener for mobile search modal
  useEffect(() => {
    const handleOpenMobileSearch = () => {
      setShowMobileSearch(true);
    };

    window.addEventListener('openMobileSearch', handleOpenMobileSearch);
    
    return () => {
      window.removeEventListener('openMobileSearch', handleOpenMobileSearch);
    };
  }, []);

  // Show loading state with better UX
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-300">Loading odds data...</p>
        <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 max-w-md w-full">
          <div className="text-red-400 text-4xl mb-3">⚠️</div>
          <h3 className="text-xl font-semibold text-red-100 mb-2">Unable to Load Data</h3>
          <p className="text-red-200 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={resetAndApplyDefaults}
              className="bg-purple-700 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex-1"
            >
              Reset Filters
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-700 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex-1"
            >
              Retry
            </button>
          </div>
          <p className="text-xs text-red-400 mt-3">If the problem persists, please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sportsbook-markets">
      <div style={{ 
        marginBottom: '24px', 
        paddingTop: '20px', 
        textAlign: 'center',
        paddingLeft: 'var(--mobile-gutter, 16px)',
        paddingRight: 'var(--mobile-gutter, 16px)',
        padding: '24px 16px'
      }}>
        <div style={{ 
          display: 'flex', 
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          padding: '4px',
          gap: '0'
        }}>
          <button
            onClick={() => setShowArbitrage(false)}
            style={{
              flex: 1,
              background: !showArbitrage 
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                : 'transparent',
              border: 'none',
              color: !showArbitrage ? 'white' : 'var(--text-secondary)',
              padding: '16px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📊 Game Odds
          </button>
          <button
            onClick={() => hasPlatinum ? setShowArbitrage(true) : navigate('/pricing')}
            style={{
              flex: 1,
              background: showArbitrage 
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                : 'transparent',
              border: 'none',
              color: showArbitrage ? 'white' : 'var(--text-secondary)',
              padding: '16px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: hasPlatinum ? 1 : 0.6
            }}
          >
            ⚡ Arbitrage {!hasPlatinum && '🔒'}
          </button>
        </div>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          margin: '16px 0 0 0',
          opacity: 0.8
        }}>
          {showArbitrage ? 'Find profitable arbitrage opportunities' : 'Compare odds across all major sportsbooks'}
        </p>
      </div>

      {/* Show quota exceeded message for free users */}
      {isOverQuota && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          margin: '24px 16px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>
            🚫 API Quota Exceeded
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            You've reached your monthly limit of {me?.limit || 250} API calls. Upgrade to Platinum for unlimited access.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Upgrade to Platinum
          </button>
        </div>
      )}

      {showArbitrage && hasPlatinum ? (
        <ArbitrageDetector 
          sport={picked[0] || 'americanfootball_nfl'}
          games={filteredGames}
          bookFilter={effectiveSelectedBooks}
          compact={false}
        />
      ) : !isOverQuota ? (
        <OddsTable
          key={tableNonce}
          games={filteredGames}
          pageSize={15}
          mode="game"
          bookFilter={effectiveSelectedBooks}
          marketFilter={marketKeys}
          evMin={minEV === "" ? null : Number(minEV)}
          loading={loading || marketsLoading}
          error={error || marketsError}
          oddsFormat={oddsFormat}
          allCaps={
            typeof window !== "undefined" && new URLSearchParams(window.location.search).get("caps") === "1"
          }
          onAddBet={addBet}
          betSlipCount={bets.length}
          onOpenBetSlip={openBetSlip}
        />
      ) : null}

          {/* Mobile footer nav + filter pill */}
          <MobileBottomBar 
            onFilterClick={() => setMobileFiltersOpen(true)} 
            active="sportsbooks" 
            showFilter={true}
            style={{ display: 'flex' }}
          />
          <MobileFiltersSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters">
            <div className="filter-stack" style={{ maxWidth: 680, margin: "0 auto" }}>
              {/* Date selector */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontWeight: 600 }}>Date</h4>
                <DatePicker
                  value={draftSelectedDate}
                  onChange={(val) => setDraftSelectedDate(val || '')}
                />
              </div>

              {/* Sports selector */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text)', fontSize: '16px' }}>Sports</h4>
                <SportMultiSelect
                  list={sportList}
                  selected={draftPicked}
                  onChange={(next) => setDraftPicked(next)}
                  usePortal
                  leftAlign
                  enableSearch={true}
                  enableCategories={true}
                  isSportsbook={false}
                  placeholderText="Choose sports..."
                  allLabel="All Sports"
                />
              </div>

              {/* Sportsbooks selector */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text)', fontSize: '16px' }}>Sportsbooks</h4>
                <SportMultiSelect
                  list={bookList}
                  selected={draftSelectedBooks}
                  onChange={(next) => setDraftSelectedBooks(next)}
                  usePortal
                  leftAlign
                  enableSearch={true}
                  enableCategories={true}
                  isSportsbook={true}
                  placeholderText="Choose sportsbooks..."
                  allLabel="All Sportsbooks"
                />
              </div>


              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={applyFilters}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  Apply
                </button>
                <button
                  onClick={resetDraftFilters}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </MobileFiltersSheet>

          {/* BetSlip Component */}
          <BetSlip
            isOpen={isOpen}
            onClose={closeBetSlip}
            bets={bets}
            onUpdateBet={updateBet}
            onRemoveBet={removeBet}
            onClearAll={clearAllBets}
            onPlaceBets={placeBets}
          />

          {/* Mobile Search Modal */}
          <MobileSearchModal 
            isOpen={showMobileSearch}
            onClose={() => setShowMobileSearch(false)}
            onSearch={handleMobileSearch}
            currentQuery={debouncedQuery}
          />
    </div>
  );
}

export default SportsbookMarkets;
