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
import useDebounce from "../hooks/useDebounce";
import { useMarkets } from '../hooks/useMarkets';

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
  "baseball_mlb",
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "icehockey_nhl",
  "soccer_epl",
  "soccer_uefa_champs_league",
  "mma_mixed_martial_arts",
  "boxing_boxing",
]);

/* =========================
   Component
   ========================= */

export default function SportsbookMarkets({ onRegisterMobileSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { bets, isOpen, addBet, removeBet, updateBet, clearAllBets, openBetSlip, closeBetSlip, placeBets } = useBetSlip();
  const [sportList, setSportList] = useState([]);
  // Initialize state from localStorage or defaults
  const [picked, setPicked] = useState(() => {
    if (typeof window === "undefined") return ["americanfootball_nfl", "americanfootball_ncaaf"];
    try {
      const saved = localStorage.getItem("vr-odds-sports");
      return saved ? JSON.parse(saved) : ["americanfootball_nfl", "americanfootball_ncaaf"];
    } catch {
      return ["americanfootball_nfl", "americanfootball_ncaaf"];
    }
  });
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
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
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState(null);
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
  const [showPlayerProps, setShowPlayerProps] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("vr-odds-playerprops") === "true";
  });
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  function handleMobileSearch(searchTerm) {
    console.log('📱 SportsbookMarkets: handleMobileSearch called with:', searchTerm);
    console.log('📱 SportsbookMarkets: Current query before update:', query);
    setQuery(searchTerm);
    console.log('📱 SportsbookMarkets: setQuery called with:', searchTerm);
    
    // Update URL to include search parameter
    const params = new URLSearchParams(location.search);
    if (searchTerm.trim()) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    
    // Update localStorage to persist the search
    localStorage.setItem("vr-odds-query", searchTerm);
    console.log('📱 SportsbookMarkets: localStorage updated');
    setShowMobileSearch(false);
  }

  // Listen for mobile search button clicks
  useEffect(() => {
    const handleOpenMobileSearch = () => {
      setShowMobileSearch(true);
    };

    window.addEventListener('openMobileSearch', handleOpenMobileSearch);
    
    return () => {
      window.removeEventListener('openMobileSearch', handleOpenMobileSearch);
    };
  }, []);

  // Register mobile search callback with parent
  useEffect(() => {
    if (onRegisterMobileSearch) {
      onRegisterMobileSearch(() => setShowMobileSearch(true));
    }
    return () => {
      if (onRegisterMobileSearch) {
        onRegisterMobileSearch(null);
      }
    };
  }, [onRegisterMobileSearch]);

  // Enhanced filter presets with sportsbook recommendations
  const filterPresets = [
    {
      id: 'nfl',
      name: 'NFL',
      description: 'NFL games with best books',
      sports: ['americanfootball_nfl'],
      markets: ['h2h', 'spreads', 'totals'],
      recommendedBooks: ['draftkings', 'fanduel', 'betmgm', 'caesars', 'espnbet']
    },
    {
      id: 'nba',
      name: 'NBA', 
      description: 'NBA games with top sportsbooks',
      sports: ['basketball_nba'],
      markets: ['h2h', 'spreads', 'totals'],
      recommendedBooks: ['draftkings', 'fanduel', 'betmgm', 'pointsbetau', 'hardrockbet']
    },
    {
      id: 'mlb',
      name: 'MLB',
      description: 'MLB games with enhanced markets', 
      sports: ['baseball_mlb'],
      markets: ['h2h', 'spreads', 'totals', 'first_five_moneyline', 'first_five_spreads', 'first_five_totals'],
      recommendedBooks: ['fanduel', 'draftkings', 'betmgm', 'unibet_us']
    },
    {
      id: 'dfs',
      name: 'DFS',
      description: 'Daily Fantasy Sports platforms',
      sports: ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb'],
      markets: ['h2h', 'spreads', 'totals'],
      recommendedBooks: ['prizepicks', 'underdog', 'superdraft', 'fliff']
    },
    {
      id: 'props',
      name: 'Props',
      description: 'Player props across all sports',
      sports: ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb'],
      markets: ['player_pass_tds', 'player_points', 'batter_home_runs'],
      recommendedBooks: ['draftkings', 'fanduel', 'betmgm', 'prizepicks']
    }
  ];
  
  const applyPreset = (preset) => {
    setPicked(preset.sports);
    setMarketKeys(preset.markets);
    setActivePreset(preset.id);
    
    // Auto-select recommended books if available
    if (preset.recommendedBooks && bookList.length > 0) {
      const availableRecommended = preset.recommendedBooks.filter(bookKey => 
        bookList.some(book => book.key === bookKey)
      );
      if (availableRecommended.length > 0) {
        setSelectedBooks(availableRecommended);
      }
    }
    
    // Enable player props for props preset
    if (preset.id === 'props') {
      setShowPlayerProps(true);
    } else {
      setShowPlayerProps(false);
    }
  };

  const [oddsFormat, setOddsFormat] = useState(() => {
    if (typeof window === "undefined") return "american";
    return localStorage.getItem("oddsFormat") || "american";
  });

  // ✅ Debounce defined ONCE - temporarily bypassed for debugging
  const debouncedQuery = query; // useDebounce(query, 300);
  
  // Debug logging for query changes
  useEffect(() => {
    console.log('🔄 Query changed from', query, 'to debouncedQuery:', debouncedQuery);
  }, [query, debouncedQuery]);

  // Sync with URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('q') || '';
    console.log('🔗 URL Sync: location.search =', location.search);
    console.log('🔗 URL Sync: urlQuery =', urlQuery, 'current query =', query);
    if (urlQuery !== query) {
      console.log('🔗 URL Sync: Setting query to urlQuery:', urlQuery);
      setQuery(urlQuery);
    }
  }, [location.search, query]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("oddsFormat", oddsFormat);
      } catch {}
    }
  }, [oddsFormat]);

  // Save filter states to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vr-odds-sports", JSON.stringify(picked));
      } catch {}
    }
  }, [picked]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vr-odds-query", query);
      } catch {}
    }
  }, [query]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vr-odds-books", JSON.stringify(selectedBooks));
      } catch {}
    }
  }, [selectedBooks]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vr-odds-date", selectedDate);
      } catch {}
    }
  }, [selectedDate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vr-odds-markets", JSON.stringify(marketKeys));
      } catch {}
    }
  }, [marketKeys]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vr-odds-minev", minEV);
      } catch {}
    }
  }, [minEV]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vr-odds-preset", activePreset || "");
      } catch {}
    }
  }, [activePreset]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("vr-odds-playerprops", showPlayerProps.toString());
      } catch {}
    }
  }, [showPlayerProps]);

  // Hydrate books list from localStorage cache on first mount (to avoid empty dropdown)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("booksCache");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) setBookList(arr);
      }
    } catch {}
    // eslint-disable-next-line
  }, []);


  const BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:10000');

  // Fetch sport list (defensive against non-array errors), map to friendly titles
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${BASE_URL}/api/sports`);
        if (!r.ok) {
          setSportList([{ key: "ALL", title: "All Sports" }]);
          return;
        }
        const data = await r.json();
        const arr = Array.isArray(data) ? data : [];
        const activeOnly = arr.filter((s) => s && s.active);
        const curated = activeOnly.filter((s) => FEATURED_SPORTS.has(s.key));
        const listToUse = curated.length ? curated : activeOnly;
        let mapped = listToUse.map((s) => ({
          ...s,
          title: FRIENDLY_TITLES[s.key] || s.title || s.key,
        }));

        // Ensure certain sports are visible even if not returned as active
        // Remove sports that are causing 404 errors
        const ENSURE = [
          "soccer_epl",
          "soccer_uefa_champs_league",
          "mma_mixed_martial_arts",
          "boxing_boxing",
        ];
        const present = new Set(mapped.map((s) => s.key));
        ENSURE.forEach((k) => {
          if (!present.has(k)) {
            mapped.push({ key: k, title: FRIENDLY_TITLES[k] || k, active: false });
          }
        });

        mapped = mapped.sort((a, b) => String(a.title).localeCompare(String(b.title)));
        const allSports = [{ key: "ALL", title: "All Sports" }, ...mapped];
        setSportList(allSports);
      } catch (_) {
        setSportList([{ key: "ALL", title: "All Sports" }]);
      }
    })();
    // eslint-disable-next-line
  }, []);

  // Memoize markets to prevent unnecessary re-renders
  const marketsToFetch = useMemo(() => {
    const baseMarkets = marketKeys.length ? [...marketKeys] : [...GAME_LINES];
    if (showPlayerProps) {
      const nflProps = [
        "player_pass_tds", "player_pass_yds", "player_rush_yds", "player_receptions",
        "player_receiving_yds", "player_rush_attempts", "player_pass_attempts",
        "player_pass_completions", "player_pass_interceptions"
      ];
      
      const mlbProps = [
        "batter_home_runs", "batter_hits", "batter_total_bases", "batter_rbis",
        "batter_runs_scored", "pitcher_strikeouts", "pitcher_hits_allowed"
      ];
      
      const nbaProps = [
        "player_points", "player_rebounds", "player_assists", "player_threes",
        "player_blocks", "player_steals"
      ];
      
      baseMarkets.push(...nflProps, ...mlbProps, ...nbaProps);
    }
    return baseMarkets;
  }, [marketKeys, showPlayerProps]);

  const {
    games: hookGames,
    books: hookBooks,
    loading: hookLoading,
    error: hookError,
    lastUpdate,
    quota
  } = useMarkets(picked, ["us"], marketsToFetch);

  // Derive effective book filter; if none of selected are available, show all
  const availableBookKeys = useMemo(() => new Set((bookList || []).map((b) => b.key)), [bookList]);
  const effectiveSelectedBooks = useMemo(() => {
    // If no books are selected, show all books (empty filter)
    if (!selectedBooks || selectedBooks.length === 0) {
      return [];
    }
    // Otherwise, filter to only selected books that are available
    const filtered = selectedBooks.filter((k) => availableBookKeys.has(k));
    return filtered;
  }, [selectedBooks, availableBookKeys]);

  // ===== Filtering before passing to OddsTable =====
  let filteredGames = games;

  // When search is active, it overrides date and sport filters but keeps sportsbook filters
  const hasActiveSearch = debouncedQuery.trim();

  if (hasActiveSearch) {
    console.log('🔍 Search active - overriding date/sport filters');
    console.log('🔍 Filtering games with debouncedQuery:', debouncedQuery);
    console.log('🔍 Total games before filter:', filteredGames.length);
    const q = debouncedQuery.toLowerCase();
    filteredGames = filteredGames.filter(
      (g) =>
        (g.home_team && g.home_team.toLowerCase().includes(q)) ||
        (g.away_team && g.away_team.toLowerCase().includes(q)) ||
        (g.sport_title && g.sport_title.toLowerCase().includes(q)) ||
        (g.bookmakers &&
          g.bookmakers.some((bm) =>
            bm.markets.some((market) =>
              market.key.toLowerCase().includes(q)
            )
          ))
    );
    console.log('🔍 Games after search filter:', filteredGames.length);
  } else {
    // Only apply date and sport filters when no search is active
    
    // Date filter (local date) or live games filter
    if (selectedDate) {
      if (selectedDate === "live") {
        // Filter for live games (games that have started but not finished)
        filteredGames = filteredGames.filter((g) => {
          const gameStart = new Date(g.commence_time).getTime();
          const now = Date.now();
          const gameEnd = gameStart + (3.5 * 60 * 60 * 1000); // Assume 3.5 hours max game duration
          return now >= gameStart && now <= gameEnd;
        });
      } else {
        // Regular date filtering
        filteredGames = filteredGames.filter((g) => {
          const d = new Date(g.commence_time);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const gameDate = `${y}-${m}-${day}`;
          return gameDate === selectedDate;
        });
      }
    } else {
      // Hide live games by default unless specifically selected
      filteredGames = filteredGames.filter((g) => {
        const gameStart = new Date(g.commence_time).getTime();
        const now = Date.now();
        const gameEnd = gameStart + (3.5 * 60 * 60 * 1000); // Assume 3.5 hours max game duration
        const isLive = now >= gameStart && now <= gameEnd;
        return !isLive; // Hide live games when no date filter is selected
      });
    }

    // Sport filter - only when no search is active
    if (picked && picked.length && !picked.includes("ALL")) {
      filteredGames = filteredGames.filter((g) => picked.includes(g.sport_key));
    }
  }

  // Show all games by default
  if (false) {
    filteredGames = filteredGames.filter((g) => {
      const start = new Date(g.commence_time).getTime();
      const now = Date.now();
      return !(now >= start && now < start + 3 * 3600 * 1000);
    });
  }

  // Sync back to local state expected by existing UI
  useEffect(() => {
    console.log('🎯 SportsbookMarkets: Syncing hook data to local state:', {
      hookGames: hookGames?.length || 0,
      hookBooks: hookBooks?.length || 0,
      hookLoading,
      hookError
    });
    
    setGames(hookGames || []);
    setLoad(!!hookLoading);
    setErr(hookError || null);
    // setQuota(hookQuota || { remain: "–", used: "–" });
    if (Array.isArray(hookBooks) && hookBooks.length > 0) {
      // Add all new sportsbooks to ensure they appear in filters
      const additionalBooks = [
        { key: 'espnbet', title: 'ESPN BET' },
        { key: 'pointsbetau', title: 'PointsBet' },
        { key: 'unibet_us', title: 'Unibet' },
        { key: 'betfred_us', title: 'Betfred' },
        { key: 'hardrockbet', title: 'Hard Rock Bet' },
        { key: 'fliff', title: 'Fliff' },
        { key: 'superdraft', title: 'SuperDraft' },
        { key: 'prizepicks', title: 'PrizePicks' },
        { key: 'underdog', title: 'Underdog Fantasy' },
        { key: 'draftkings_pick6', title: 'DraftKings Pick6' }
      ];
      
      // Merge books, avoiding duplicates
      const existingKeys = new Set(hookBooks.map(b => b.key));
      const newBooks = additionalBooks.filter(b => !existingKeys.has(b.key));
      const combinedBooks = [...hookBooks, ...newBooks];
      setBookList(combinedBooks);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("booksCache", JSON.stringify(combinedBooks));
        } catch {}
      }
    }
  }, [hookGames, hookLoading, hookError, hookBooks]);

  // Debug logging for hook data (moved after all variables are initialized)
  useEffect(() => {
    console.log('🎯 SportsbookMarkets: Rendering with state:', {
      gamesCount: games.length,
      booksCount: bookList.length,
      selectedBooksCount: selectedBooks.length,
      effectiveSelectedBooksCount: effectiveSelectedBooks.length,
      filteredGamesCount: filteredGames.length,
      loading,
      error,
      picked,
      showPlayerProps,
      marketKeys,
      firstGameSample: games[0] ? {
        id: games[0].id,
        home_team: games[0].home_team,
        away_team: games[0].away_team,
        bookmakers_count: games[0].bookmakers?.length || 0
      } : null
    });
  }, [games, bookList, selectedBooks, effectiveSelectedBooks, filteredGames, loading, error, picked, showPlayerProps, marketKeys]);

  return (
    <main className="page-wrap">
      <div className="market-container two-col">
        <aside className="filters-sidebar">
          <div className="filter-stack">
            {settingsOpen && (
              <div
                role="dialog"
                aria-label="Settings"
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #334c",
                  background: "#11192c",
                  borderRadius: 10,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Odds Format</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { k: "american", label: "American" },
                    { k: "decimal", label: "Decimal" },
                    { k: "fractional", label: "Fractional" },
                  ].map((opt) => (
                    <label
                      key={opt.k}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: "1px solid #334c",
                      }}
                    >
                      <input
                        type="radio"
                        name="odds-format"
                        value={opt.k}
                        checked={oddsFormat === opt.k}
                        onChange={(e) => setOddsFormat(e.target.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="filter-group">
              <span className="filter-label">Search</span>
              <input
                placeholder="Search team / league"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Smart Filter Presets */}
            <div className="filter-presets" style={{ marginBottom: '16px' }}>
              <div className="presets-scroll" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {filterPresets.map((preset) => (
                  <button
                    key={preset.id}
                    className={`preset-btn ${activePreset === preset.id ? 'active' : ''}`}
                    onClick={() => applyPreset(preset)}
                    title={preset.description}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: activePreset === preset.id ? 'var(--accent)' : 'transparent',
                      color: activePreset === preset.id ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Sportsbooks ({bookList.length} available)</span>
              <SportMultiSelect
                list={bookList.sort((a, b) => {
                  // Sort by popularity/importance
                  const priority = {
                    'draftkings': 1, 'fanduel': 2, 'betmgm': 3, 'caesars': 4, 'espnbet': 5,
                    'pointsbetau': 6, 'hardrockbet': 7, 'unibet_us': 8, 'betfred_us': 9,
                    'prizepicks': 10, 'underdog': 11, 'superdraft': 12, 'fliff': 13
                  };
                  return (priority[a.key] || 99) - (priority[b.key] || 99);
                })}
                selected={selectedBooks}
                onChange={setSelectedBooks}
                placeholderText={selectedBooks.length === 0 ? "All Books Selected" : `${selectedBooks.length} books selected`}
                allLabel="All Books"
                grid={true}
                columns={2}
                leftAlign={true}
                usePortal={true}
                portalAlign={"up"}
              />
            </div>

            <div className="filter-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => setTableNonce(n => n + 1)}>
                Refresh
              </button>
              <button type="button" className="btn btn-danger btn-lg" onClick={resetFilters}>
                Reset
              </button>
            </div>

            <div className="filters-meta">
              <span className="filters-count">Results: {filteredGames.length}</span>
            </div>
          </div>

          {/* Bottom-left gear button */}
        </aside>

        <section className="table-area">
          {/* Header with Bet Type Toggle */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginBottom: '16px', 
            paddingTop: '20px', 
            textAlign: 'center',
            paddingLeft: 'var(--mobile-gutter, 16px)',
            paddingRight: 'var(--mobile-gutter, 16px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
{/* <AlertSystem games={filteredGames} /> */}
              <div style={{
                display: 'flex',
                background: 'var(--card-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => {
                    if (showPlayerProps) {
                      setShowPlayerProps(false);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: !showPlayerProps ? 'var(--accent)' : 'transparent',
                    color: !showPlayerProps ? '#fff' : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Game Odds
                </button>
                <button
                  onClick={() => setShowPlayerProps(true)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: showPlayerProps ? 'var(--accent)' : 'transparent',
                    color: showPlayerProps ? '#fff' : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Player Props
                </button>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={() => {
                  setLoad(true);
                  setTableNonce(n => n + 1);
                  // Reset loading after a brief moment to show the table loading state
                  setTimeout(() => setLoad(false), 2000);
                }}
                title="Refresh odds data"
                aria-label="Refresh"
                style={{
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--accent)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px'
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              </button>
            </div>
          </div>

          <OddsTable
            key={tableNonce}
            games={filteredGames}
            pageSize={15}
            mode={showPlayerProps ? "props" : "game"}
            bookFilter={effectiveSelectedBooks}
            marketFilter={marketKeys}
            evMin={minEV === "" ? null : Number(minEV)}
            loading={loading || hookLoading}
            error={error || hookError}
            oddsFormat={oddsFormat}
            allCaps={
              typeof window !== "undefined" && new URLSearchParams(window.location.search).get("caps") === "1"
            }
            onAddBet={addBet}
            betSlipCount={bets.length}
            onOpenBetSlip={openBetSlip}
          />
        </section>

        {/* Mobile footer nav + filter pill */}
        <MobileBottomBar onFilterClick={() => setMobileFiltersOpen(true)} active="sportsbooks" showFilter={true} />
        <MobileFiltersSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters">
          <div className="filter-stack" style={{ maxWidth: 680, margin: "0 auto" }}>
            <div className="filter-group">
              <span className="filter-label">Date</span>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="All Dates"
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">Sports</span>
              <SportMultiSelect
                list={sportList}
                selected={picked}
                onChange={setPicked}
                placeholderText="Choose sports…"
                allLabel="All Sports"
                grid={true}
                columns={2}
                leftAlign={true}
                usePortal={true}
                portalAlign={"up"}
              />
            </div>
            <div className="filter-group">
              <span className="filter-label">Books</span>
              <SportMultiSelect
                list={bookList}
                selected={selectedBooks}
                onChange={setSelectedBooks}
                placeholderText="Choose books…"
                allLabel="All Books"
                grid={true}
                columns={2}
                leftAlign={true}
              />
            </div>
            <div className="filter-actions">
              <button
                type="button"
                className="filter-btn apply-btn"
                onClick={() => {
                  // Close any open dropdowns first
                  const openDropdowns = document.querySelectorAll('.ms-menu');
                  openDropdowns.forEach(dropdown => {
                    const toggle = dropdown.parentElement?.querySelector('.ms-toggle');
                    if (toggle) {
                      toggle.setAttribute('aria-expanded', 'false');
                    }
                  });
                  
                  // Force re-fetch with current filter settings
                  setTableNonce(n => n + 1);
                  setTimeout(() => setMobileFiltersOpen(false), 100);
                }}
              >
                Apply Filters
              </button>
              <button
                type="button"
                className="filter-btn reset-btn"
                onClick={() => {
                  // Close any open dropdowns first
                  const openDropdowns = document.querySelectorAll('.ms-menu');
                  openDropdowns.forEach(dropdown => {
                    const toggle = dropdown.parentElement?.querySelector('.ms-toggle');
                    if (toggle) {
                      toggle.setAttribute('aria-expanded', 'false');
                    }
                  });
                  
                  resetFilters();
                  setTimeout(() => setMobileFiltersOpen(false), 100);
                }}
              >
                Reset All
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
    </main>
  );

  // Helpers scoped inside component
  function resetFilters() {
    setQuery("");
    setSelectedDate("");
    setMinEV("");

    const DEFAULT_SPORTS = ["americanfootball_nfl", "americanfootball_ncaaf"];
    setPicked(DEFAULT_SPORTS);

    // Reset to no books selected (show all)
    setSelectedBooks([]);
    setTableNonce((n) => n + 1);
  }
}
