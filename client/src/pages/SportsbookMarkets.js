// src/pages/SportsbookMarkets.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Target, Zap, Users, Trophy, ChevronDown, ChevronUp, TrendingUp, Shield, BarChart3, Star, Activity, RefreshCw } from 'lucide-react';
import SEOHelmet from '../components/seo/SEOHelmet';
import { PAGE_TITLES, PAGE_DESCRIPTIONS, generateSchemaMarkup } from '../utils/seo';
import { optimizedStorage } from "../utils/storageOptimizer";
import { smartCache } from "../utils/enhancedCache";
import MobileBottomBar from "../components/layout/MobileBottomBar";
import MobileFiltersSheet from "../components/layout/MobileFiltersSheet";
import MobileSearchModal from "../components/modals/MobileSearchModal";
import FilterMenu from "../components/layout/FilterMenu";
import SectionMenu from "../components/layout/SectionMenu";
import "../components/betting/FormControls.css"; // Import form controls styling
import { useBetSlip } from "../contexts/BetSlipContext";
import BetSlip from "../components/betting/BetSlip";
import SportMultiSelect from "../components/betting/SportMultiSelect";
import DatePicker from "../components/common/DatePicker";
import OddsTable from "../components/betting/OddsTable";
import ArbitrageDetector from "../components/betting/ArbitrageDetector";
import MiddlesDetector from "../components/betting/MiddlesDetector";
import AuthRequired from "../components/auth/AuthRequired";
import ApiErrorDisplay from "../components/common/ApiErrorDisplay";
import useDebounce from "../hooks/useDebounce";
import { withApiBase } from "../config/api";
import { secureFetch } from "../utils/security";
import { useMarketsWithCache } from '../hooks/useMarketsWithCache';
import { useMe } from '../hooks/useMe';
import { useAuth } from '../hooks/SimpleAuth';
import { AVAILABLE_SPORTSBOOKS, getDFSApps } from '../constants/sportsbooks';
import DesktopHeader from '../components/layout/DesktopHeader';
import './SportsbookMarkets.css';
import './SportsbookMarkets.desktop.css';
import './SportsbookMarkets.sidebar.css';

const ENABLE_PLAYER_PROPS_V2 = true;

// Comprehensive player prop markets organized by category
// Based on TheOddsAPI documentation and available markets
const PLAYER_PROP_MARKETS = {
  passing: [
    { key: 'player_pass_yds', title: 'Passing Yards', sport: 'football' },
    { key: 'player_pass_tds', title: 'Passing TDs', sport: 'football' },
    { key: 'player_pass_completions', title: 'Pass Completions', sport: 'football' },
    { key: 'player_pass_attempts', title: 'Pass Attempts', sport: 'football' },
    { key: 'player_pass_interceptions', title: 'Interceptions', sport: 'football' },
    { key: 'player_pass_longest_completion', title: 'Longest Pass', sport: 'football' },
    // Alternate passing props
    { key: 'player_pass_yds_alternate', title: 'Alternate Pass Yards', sport: 'football' },
    { key: 'player_pass_tds_alternate', title: 'Alternate Pass TDs', sport: 'football' },
    { key: 'player_pass_completions_alternate', title: 'Alternate Pass Completions', sport: 'football' },
    { key: 'player_pass_attempts_alternate', title: 'Alternate Pass Attempts', sport: 'football' },
    { key: 'player_pass_interceptions_alternate', title: 'Alternate Pass Interceptions', sport: 'football' },
    { key: 'player_pass_longest_completion_alternate', title: 'Alternate Longest Pass', sport: 'football' }
  ],
  rushing: [
    { key: 'player_rush_yds', title: 'Rushing Yards', sport: 'football' },
    { key: 'player_rush_tds', title: 'Rushing TDs', sport: 'football' },
    { key: 'player_rush_attempts', title: 'Rush Attempts', sport: 'football' },
    { key: 'player_rush_longest', title: 'Longest Rush', sport: 'football' },
    // Alternate rushing props
    { key: 'player_rush_yds_alternate', title: 'Alternate Rush Yards', sport: 'football' },
    { key: 'player_rush_tds_alternate', title: 'Alternate Rush TDs', sport: 'football' },
    { key: 'player_rush_attempts_alternate', title: 'Alternate Rush Attempts', sport: 'football' },
    { key: 'player_rush_longest_alternate', title: 'Alternate Longest Rush', sport: 'football' }
  ],
  receiving: [
    { key: 'player_receptions', title: 'Receptions', sport: 'football' },
    { key: 'player_reception_yds', title: 'Receiving Yards', sport: 'football' },
    { key: 'player_reception_tds', title: 'Receiving TDs', sport: 'football' },
    { key: 'player_reception_longest', title: 'Longest Reception', sport: 'football' },
    // Alternate receiving props
    { key: 'player_receptions_alternate', title: 'Alternate Receptions', sport: 'football' },
    { key: 'player_reception_yds_alternate', title: 'Alternate Reception Yards', sport: 'football' },
    { key: 'player_reception_tds_alternate', title: 'Alternate Reception TDs', sport: 'football' },
    { key: 'player_reception_longest_alternate', title: 'Alternate Longest Reception', sport: 'football' }
  ],
  touchdowns: [
    { key: 'player_anytime_td', title: 'Anytime TD', sport: 'football' },
    { key: 'player_1st_td', title: 'First TD', sport: 'football' },
    { key: 'player_last_td', title: 'Last TD', sport: 'football' }
    // Note: player_2_plus_tds is not supported by the API
  ],
  // Combination props (Pass + Rush, Rush + Reception, etc.)
  combination: [
    { key: 'player_pass_rush_yds_alternate', title: 'Alternate Pass + Rush Yards', sport: 'football' },
    { key: 'player_pass_rush_reception_tds_alternate', title: 'Alternate Pass + Rush + Reception TDs', sport: 'football' },
    { key: 'player_pass_rush_reception_yds_alternate', title: 'Alternate Pass + Rush + Reception Yards', sport: 'football' },
    { key: 'player_rush_reception_tds_alternate', title: 'Alternate Rush + Reception TDs', sport: 'football' },
    { key: 'player_rush_reception_yds_alternate', title: 'Alternate Rush + Reception Yards', sport: 'football' }
  ],
  // Defense and special teams
  defense: [
    { key: 'player_sacks_alternate', title: 'Alternate Sacks', sport: 'football' },
    { key: 'player_solo_tackles_alternate', title: 'Alternate Solo Tackles', sport: 'football' },
    { key: 'player_tackles_assists_alternate', title: 'Alternate Tackles + Assists', sport: 'football' },
    { key: 'player_assists_alternate', title: 'Alternate Assists', sport: 'football' }
  ],
  // Kicking props
  kicking: [
    { key: 'player_field_goals_alternate', title: 'Alternate Field Goals', sport: 'football' },
    { key: 'player_kicking_points_alternate', title: 'Alternate Kicking Points', sport: 'football' },
    { key: 'player_pats_alternate', title: 'Alternate Points After Touchdown', sport: 'football' }
  ],
  basketball: [
    { key: 'player_points', title: 'Points', sport: 'basketball' },
    { key: 'player_rebounds', title: 'Rebounds', sport: 'basketball' },
    { key: 'player_assists', title: 'Assists', sport: 'basketball' },
    { key: 'player_threes', title: '3-Pointers Made', sport: 'basketball' },
    { key: 'player_steals', title: 'Steals', sport: 'basketball' },
    { key: 'player_blocks', title: 'Blocks', sport: 'basketball' }
  ],
  // Baseball - Batting props
  batting: [
    { key: 'batter_hits', title: 'Hits', sport: 'baseball' },
    { key: 'batter_total_bases', title: 'Total Bases', sport: 'baseball' },
    { key: 'batter_rbis', title: 'RBIs', sport: 'baseball' },
    { key: 'batter_runs_scored', title: 'Runs Scored', sport: 'baseball' },
    { key: 'batter_home_runs', title: 'Home Runs', sport: 'baseball' },
    { key: 'batter_first_home_run', title: 'First Home Run', sport: 'baseball' },
    { key: 'batter_hits_runs_rbis', title: 'Hits + Runs + RBIs', sport: 'baseball' },
    { key: 'batter_singles', title: 'Singles', sport: 'baseball' },
    { key: 'batter_doubles', title: 'Doubles', sport: 'baseball' },
    { key: 'batter_triples', title: 'Triples', sport: 'baseball' },
    { key: 'batter_walks', title: 'Walks', sport: 'baseball' },
    { key: 'batter_strikeouts', title: 'Strikeouts', sport: 'baseball' },
    { key: 'batter_stolen_bases', title: 'Stolen Bases', sport: 'baseball' },
    // Alternate batting props
    { key: 'batter_total_bases_alternate', title: 'Alternate Total Bases', sport: 'baseball' },
    { key: 'batter_home_runs_alternate', title: 'Alternate Home Runs', sport: 'baseball' },
    { key: 'batter_hits_alternate', title: 'Alternate Hits', sport: 'baseball' },
    { key: 'batter_rbis_alternate', title: 'Alternate RBIs', sport: 'baseball' },
    { key: 'batter_walks_alternate', title: 'Alternate Walks', sport: 'baseball' },
    { key: 'batter_strikeouts_alternate', title: 'Alternate Strikeouts', sport: 'baseball' },
    { key: 'batter_runs_scored_alternate', title: 'Alternate Runs Scored', sport: 'baseball' },
    { key: 'batter_singles_alternate', title: 'Alternate Singles', sport: 'baseball' },
    { key: 'batter_doubles_alternate', title: 'Alternate Doubles', sport: 'baseball' },
    { key: 'batter_triples_alternate', title: 'Alternate Triples', sport: 'baseball' }
  ],
  // Baseball - Pitching props
  pitching: [
    { key: 'pitcher_strikeouts', title: 'Strikeouts', sport: 'baseball' },
    { key: 'pitcher_record_a_win', title: 'Record a Win', sport: 'baseball' },
    { key: 'pitcher_hits_allowed', title: 'Hits Allowed', sport: 'baseball' },
    { key: 'pitcher_walks', title: 'Walks Allowed', sport: 'baseball' },
    { key: 'pitcher_earned_runs', title: 'Earned Runs', sport: 'baseball' },
    { key: 'pitcher_outs', title: 'Outs', sport: 'baseball' },
    // Alternate pitching props
    { key: 'pitcher_hits_allowed_alternate', title: 'Alternate Hits Allowed', sport: 'baseball' },
    { key: 'pitcher_walks_alternate', title: 'Alternate Walks Allowed', sport: 'baseball' },
    { key: 'pitcher_strikeouts_alternate', title: 'Alternate Strikeouts', sport: 'baseball' }
  ],
  // Hockey - Player props
  hockey: [
    { key: 'player_points', title: 'Points', sport: 'hockey' },
    { key: 'player_power_play_points', title: 'Power Play Points', sport: 'hockey' },
    { key: 'player_assists', title: 'Assists', sport: 'hockey' },
    { key: 'player_blocked_shots', title: 'Blocked Shots', sport: 'hockey' },
    { key: 'player_shots_on_goal', title: 'Shots on Goal', sport: 'hockey' },
    { key: 'player_goals', title: 'Goals', sport: 'hockey' },
    { key: 'player_total_saves', title: 'Total Saves', sport: 'hockey' },
    { key: 'player_goal_scorer_first', title: 'First Goal Scorer', sport: 'hockey' },
    { key: 'player_goal_scorer_last', title: 'Last Goal Scorer', sport: 'hockey' },
    { key: 'player_goal_scorer_anytime', title: 'Anytime Goal Scorer', sport: 'hockey' },
    // Alternate hockey props
    { key: 'player_points_alternate', title: 'Alternate Points', sport: 'hockey' },
    { key: 'player_assists_alternate', title: 'Alternate Assists', sport: 'hockey' },
    { key: 'player_power_play_points_alternate', title: 'Alternate Power Play Points', sport: 'hockey' },
    { key: 'player_goals_alternate', title: 'Alternate Goals', sport: 'hockey' },
    { key: 'player_shots_on_goal_alternate', title: 'Alternate Shots on Goal', sport: 'hockey' },
    { key: 'player_blocked_shots_alternate', title: 'Alternate Blocked Shots', sport: 'hockey' },
    { key: 'player_total_saves_alternate', title: 'Alternate Total Saves', sport: 'hockey' }
  ],
  // Soccer - Player props
  soccerPlayers: [
    { key: 'player_goal_scorer_anytime', title: 'Anytime Goal Scorer', sport: 'soccer' },
    { key: 'player_first_goal_scorer', title: 'First Goal Scorer', sport: 'soccer' },
    { key: 'player_last_goal_scorer', title: 'Last Goal Scorer', sport: 'soccer' },
    { key: 'player_to_receive_card', title: 'To Receive a Card', sport: 'soccer' },
    { key: 'player_to_receive_red_card', title: 'To Receive a Red Card', sport: 'soccer' },
    { key: 'player_shots_on_target', title: 'Shots on Target', sport: 'soccer' },
    { key: 'player_shots', title: 'Shots', sport: 'soccer' },
    { key: 'player_assists', title: 'Assists', sport: 'soccer' }
  ]
};

// Get all player prop market keys for backward compatibility
const PLAYER_PROP_MARKET_KEYS = Object.values(PLAYER_PROP_MARKETS).flat().map(market => market.key);

const SportsbookMarkets = ({ onRegisterMobileSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { me } = useMe();
  const { bets, isOpen, addBet, removeBet, updateBet, clearAllBets, openBetSlip, closeBetSlip, placeBets } = useBetSlip();
  
  // Get user's saved sportsbook selections by mode
  const getUserSelectedSportsbooks = (mode = 'game') => {
    const storageKey = mode === 'props' ? 'userSelectedSportsbooks_props' : 'userSelectedSportsbooks';
    const saved = optimizedStorage.get(storageKey);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    
    // For player props mode, return an empty array to show ALL available sportsbooks
    // This ensures users see all possible sportsbooks in the player props mode
    if (mode === 'props') {
      // Return empty array to show ALL sportsbooks (no filtering)
      return [];
    }
    
    // Default to popular sportsbooks for game odds
    return ['draftkings', 'fanduel', 'betmgm', 'caesars'];
  };
  
  const [picked, setPicked] = useState(["americanfootball_nfl"]);
  const [query, setQuery] = useState("");
  const [selectedBooks, setSelectedBooks] = useState(getUserSelectedSportsbooks('game'));
  const [selectedPlayerPropsBooks, setSelectedPlayerPropsBooks] = useState(getUserSelectedSportsbooks('props'));
  const [selectedDate, setSelectedDate] = useState("");
  const [marketKeys, setMarketKeys] = useState(["h2h", "spreads", "totals", "team_totals"]); // Added team_totals to default selection
  // Include a mix of NFL, NCAA football, and NCAA basketball relevant markets by default
  const [selectedPlayerPropMarkets, setSelectedPlayerPropMarkets] = useState([
    // Football markets (NFL and NCAAF)
    "player_pass_yds", "player_rush_yds", "player_receptions", "player_anytime_td",
    // Basketball markets (NBA and NCAAB)
    "player_points", "player_rebounds", "player_assists"
  ]);
  const [showPlayerProps, setShowPlayerProps] = useState(false);
  const [showArbitrage, setShowArbitrage] = useState(false);
  const [showMiddles, setShowMiddles] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minEV, setMinEV] = useState("");
  const [tableNonce, setTableNonce] = useState(0);
  const [playerPropsProcessing, setPlayerPropsProcessing] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [navigationExpanded, setNavigationExpanded] = useState(false);
  // Comprehensive sports list organized by categories
  const AVAILABLE_SPORTS = [
    // Major US Sports
    { key: 'americanfootball_nfl', title: 'NFL' },
    { key: 'americanfootball_ncaaf', title: 'NCAA Football' },
    { key: 'basketball_nba', title: 'NBA' },
    { key: 'basketball_ncaab', title: 'NCAA Basketball' },
    { key: 'basketball_wnba', title: 'WNBA' },
    { key: 'baseball_mlb', title: 'MLB' },
    { key: 'icehockey_nhl', title: 'NHL' },
    
    // International Sports (Soccer)
    { key: 'soccer_epl', title: 'EPL' },
    { key: 'soccer_uefa_champs_league', title: 'UEFA Champions League' },
    { key: 'soccer_fifa_world_cup', title: 'FIFA World Cup' },
    { key: 'soccer_conmebol_copa_america', title: 'Copa America' },
    { key: 'soccer_uefa_european_championship', title: 'UEFA European Championship' },
    
    // Tennis
    { key: 'tennis_atp', title: 'ATP Tennis' },
    { key: 'tennis_wta', title: 'WTA Tennis' },
    { key: 'tennis_atp_french_open', title: 'French Open (ATP)' },
    { key: 'tennis_atp_us_open', title: 'US Open (ATP)' },
    { key: 'tennis_atp_wimbledon', title: 'Wimbledon (ATP)' },
    { key: 'tennis_atp_australian_open', title: 'Australian Open (ATP)' },
    { key: 'tennis_wta_french_open', title: 'French Open (WTA)' },
    { key: 'tennis_wta_us_open', title: 'US Open (WTA)' },
    { key: 'tennis_wta_wimbledon', title: 'Wimbledon (WTA)' },
    { key: 'tennis_wta_australian_open', title: 'Australian Open (WTA)' },
    
    // Combat Sports
    { key: 'boxing_heavyweight', title: 'Boxing (Heavyweight)' },
    { key: 'mma_mixed_martial_arts', title: 'MMA' },
    { key: 'boxing', title: 'Boxing' },
    
    // Motorsports & Racing
    { key: 'motorsport_nascar', title: 'NASCAR' },
    { key: 'motorsport_f1', title: 'Formula 1' },
    { key: 'motorsport_indycar', title: 'IndyCar' },
    { key: 'horse_racing', title: 'Horse Racing' },
    
    // Golf
    { key: 'golf_pga', title: 'PGA Tour' },
    { key: 'golf_us_open', title: 'US Open Golf' },
    { key: 'golf_british_open', title: 'British Open' },
    { key: 'golf_pga_championship', title: 'PGA Championship' },
    { key: 'golf_the_open_championship', title: 'The Open Championship' },
    
    // International Leagues
    { key: 'australianrules_afl', title: 'AFL' },
    { key: 'americanfootball_cfl', title: 'CFL' },
    { key: 'basketball_nbl', title: 'NBL' },
    { key: 'rugby_league_nrl', title: 'NRL' },
    { key: 'cricket_icc_world_cup', title: 'Cricket World Cup' },
    { key: 'cricket_big_bash', title: 'Big Bash League' },
    { key: 'cricket_the_hundred', title: 'The Hundred' },
    { key: 'basketball_euroleague', title: 'EuroLeague Basketball' }
  ];

  const [sportList, setSportList] = useState(AVAILABLE_SPORTS);
  const [bookList, setBookList] = useState([]);
  
  // Missing variables
  const oddsFormat = "american";
  const debouncedQuery = useDebounce(query, 300);
  
  // Draft filter state - initialize with current applied state
  const [draftPicked, setDraftPicked] = useState(picked);
  const [draftSelectedDate, setDraftSelectedDate] = useState(selectedDate);
  const [draftSelectedBooks, setDraftSelectedBooks] = useState(getUserSelectedSportsbooks('game'));
  // Initialize with user's saved selection or empty array to show ALL books
  const [draftSelectedPlayerPropsBooks, setDraftSelectedPlayerPropsBooks] = useState(selectedPlayerPropsBooks);
  const [draftMarketKeys, setDraftMarketKeys] = useState(marketKeys);
  const [draftSelectedPlayerPropMarkets, setDraftSelectedPlayerPropMarkets] = useState(selectedPlayerPropMarkets);
  
  // Arbitrage-specific filter states
  const [draftMinProfit, setDraftMinProfit] = useState(2);
  const [draftMaxStake, setDraftMaxStake] = useState(100);
  
  // Refresh cooldown state
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Auto-refresh toggle state (default: enabled)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRefreshEnabled');
    return saved !== null ? saved === 'true' : true; // Default to enabled
  });
  
  // Toggle auto-refresh and save to localStorage
  const toggleAutoRefresh = () => {
    const newValue = !autoRefreshEnabled;
    setAutoRefreshEnabled(newValue);
    localStorage.setItem('autoRefreshEnabled', String(newValue));
    console.log('🔄 Auto-refresh', newValue ? 'enabled' : 'disabled');
  };

  const isPlayerPropsMode = showPlayerProps;
  const isArbitrageMode = showArbitrage;
  const isMiddlesMode = showMiddles;
  // TEMPORARY CHANGE: For regular odds mode, include ALL markets
  // For player props mode, use all available player prop markets
  const marketsForMode = isPlayerPropsMode 
    ? PLAYER_PROP_MARKET_KEYS // Use all available player prop markets
    : ["h2h", "spreads", "totals", "team_totals", "alternate_spreads", "alternate_totals", "alternate_team_totals"]; // Include all regular markets
  const regionsForMode = isPlayerPropsMode ? ["us", "us_dfs"] : ["us", "us2", "us_exchanges"];
  
  // For player props, use selected sports or default to NFL and NCAAF if none selected
  // For regular mode, use all selected sports (no longer limiting to single sport)
  const sportsForMode = isPlayerPropsMode 
    ? (picked.length > 0 ? picked : ["americanfootball_nfl", "americanfootball_ncaaf"]) 
    : picked;
    
  // Log the sports being used for the current mode
  console.log(`🎯 Sports for ${isPlayerPropsMode ? 'Player Props' : 'Straight Bets'} mode:`, sportsForMode);
  
  const hasPlatinum = true; // TESTING MODE: Always set to true to enable all features
  const hasGoldOrBetter = me?.plan === 'gold' || me?.plan === 'platinum';
  const isOverQuota = !hasGoldOrBetter && me?.calls_made >= (me?.limit || 250);
  
  // Debug logging for arbitrage access
  console.log('🔍 Arbitrage Debug:', {
    isArbitrageMode,
    hasPlatinum,
    userPlan: me?.plan,
    userId: user?.id,
    me: me
  });

  // Function to get all compatible markets for the selected sports
  const getAllCompatibleMarkets = (sports) => {
    // Core markets that work across all sports
    const coreMarkets = ['h2h', 'spreads', 'totals'];
    
    // If no sports selected or in player props mode, return default
    if (!sports || sports.length === 0) {
      return coreMarkets;
    }
    
    // For player props mode, return the selected player prop markets
    if (isPlayerPropsMode) {
      return selectedPlayerPropMarkets;
    }
    
    // For regular mode with selected markets, use those
    if (marketKeys && marketKeys.length > 0) {
      return marketKeys;
    }
    
    // Fallback to core markets
    return coreMarkets;
  };

  const { 
    games: marketGames = [], 
    books: marketBooks = [], 
    loading: marketsLoading, 
    error: marketsError, 
    bookmakers,
    refresh: refreshMarkets,
    usingCache
  } = useMarketsWithCache(
    sportsForMode,
    regionsForMode,
    getAllCompatibleMarkets(sportsForMode),
    { date: selectedDate, autoRefresh: autoRefreshEnabled }
  );

  // Cooldown timer effect
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(refreshCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);
  
  // Handle refresh with cooldown
  const handleRefresh = () => {
    if (refreshCooldown > 0 || isRefreshing) return;
    
    console.log('🔄 Manual refresh triggered');
    setIsRefreshing(true);
    
    // Clear API cache to force fresh data
    if (window.localStorage) {
      const keys = Object.keys(window.localStorage);
      keys.forEach(key => {
        if (key.includes('api-cache') || key.includes('market-cache')) {
          window.localStorage.removeItem(key);
        }
      });
    }
    
    // Trigger refresh
    if (refreshMarkets) {
      refreshMarkets();
    }
    
    // Set cooldown and reset refreshing state
    setRefreshCooldown(20);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Initialize mode and search query from URL parameters
  useEffect(() => {
    // Check for mode and query parameters in URL
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    const urlQuery = searchParams.get('q');
    
    // Set search query from URL if present
    if (urlQuery && urlQuery !== query) {
      console.log('🔍 Setting search query from URL:', urlQuery);
      setQuery(urlQuery);
    }
    
    if (mode === 'arbitrage') {
      console.log('🔍 Initializing arbitrage mode from URL parameter');
      setShowPlayerProps(false);
      setShowArbitrage(true);
      setShowMiddles(false);
    } else if (mode === 'props') {
      console.log('🎯 Initializing player props mode from URL parameter');
      setShowPlayerProps(true);
      setShowArbitrage(false);
      setShowMiddles(false);
    } else if (mode === 'middles') {
      console.log('🎪 Initializing middles mode from URL parameter');
      setShowPlayerProps(false);
      setShowArbitrage(false);
      setShowMiddles(true);
    }
  }, [location.search]); // Only run when URL parameters change

  // Listen for changes to user's sportsbook selections
  useEffect(() => {
    const handleStorageChange = () => {
      const newSelectedBooks = getUserSelectedSportsbooks();
      setSelectedBooks(newSelectedBooks);
      setDraftSelectedBooks(newSelectedBooks);
    };

    // Listen for storage changes (when user updates selections in MySportsbooks)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from optimizedStorage
    window.addEventListener('userSelectedSportsbooksChanged', handleStorageChange);
    
    // Listen for mobile search event from Navbar
    const handleOpenMobileSearch = () => {
      console.log('📱 Received openMobileSearch event');
      setShowMobileSearch(true);
    };
    
    window.addEventListener('openMobileSearch', handleOpenMobileSearch);
    
    // Handle reset filters event from OddsTable
    const handleResetFilters = () => {
      console.log('🔄 Resetting all filters to defaults');
      // Reset to default values
      setPicked(["americanfootball_nfl"]);
      setSelectedDate('');
      setSelectedBooks([]);
      setSelectedPlayerPropsBooks([]);
      setMarketKeys(["h2h", "spreads", "totals"]);
      setSelectedPlayerPropMarkets(["player_pass_yds", "player_rush_yds", "player_receptions"]);
      setMinEV("");
      
      // Force refresh data
      setTableNonce(prev => prev + 1);
    };
    
    window.addEventListener('resetOddsFilters', handleResetFilters);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resetOddsFilters', handleResetFilters);
      window.removeEventListener('userSelectedSportsbooksChanged', handleStorageChange);
      window.removeEventListener('openMobileSearch', handleOpenMobileSearch);
    };
  }, []);

  // Initialize markets for default sports on component mount
  useEffect(() => {
    const initialMarkets = getAutoSelectedMarkets(picked);
    setMarketKeys(initialMarkets);
    setDraftMarketKeys(initialMarkets);
    console.log('🎯 Initial auto-selected markets:', initialMarkets);
  }, []); // Run only once on mount

  // Migration function to fix old invalid market names
  const migrateInvalidMarkets = (markets) => {
    const marketMigrations = {
      'player_receiving_yds': 'player_reception_yds',
      'player_receiving_tds': 'player_reception_tds', 
      'player_receiving_longest': 'player_reception_longest',
      'player_2_plus_tds': null, // Remove this market as it's not supported
      'draftkings_pick6': 'pick6' // Migrate old DFS key to new one
    };
    
    return markets
      .map(market => marketMigrations[market] || market)
      .filter(market => market !== null);
  };

  // Auto-update player prop markets when sport changes (only if current selection is inappropriate)
  useEffect(() => {
    if (isPlayerPropsMode && picked && picked.length > 0) {
      const sportBasedMarkets = getPlayerPropMarketsBySport(picked);
      const availableMarketKeys = sportBasedMarkets
        .filter(market => !market.isHeader)
        .map(market => market.key);
      
      // First, migrate any old invalid market names in current selection
      const migratedMarkets = migrateInvalidMarkets(selectedPlayerPropMarkets);
      
      // Check if current selection contains markets that don't exist for the current sport
      const hasInvalidMarkets = migratedMarkets.some(market => 
        !availableMarketKeys.includes(market)
      );
      
      // If we migrated markets or have invalid markets, update the selection
      if (migratedMarkets.length !== selectedPlayerPropMarkets.length || 
          JSON.stringify(migratedMarkets) !== JSON.stringify(selectedPlayerPropMarkets) ||
          hasInvalidMarkets) {
        
        let marketsToUse = migratedMarkets;
        
        // If still have invalid markets or empty selection, use ALL available markets
        if (marketsToUse.length === 0 || hasInvalidMarkets) {
          marketsToUse = availableMarketKeys; // Select ALL available markets instead of just first 3
        }
        
        if (marketsToUse.length > 0) {
          console.log('🎯 Migrating/updating player prop markets:', {
            sports: picked,
            oldMarkets: selectedPlayerPropMarkets,
            migratedMarkets: migratedMarkets,
            finalMarkets: marketsToUse,
            reason: migratedMarkets.length !== selectedPlayerPropMarkets.length ? 'migration' : 
                   hasInvalidMarkets ? 'invalid markets' : 'empty selection'
          });
          
          setSelectedPlayerPropMarkets(marketsToUse);
          setDraftSelectedPlayerPropMarkets(marketsToUse);
        }
      }
    }
  }, [picked, isPlayerPropsMode, selectedPlayerPropMarkets]); // Run when sport, mode, or markets change

  // Removed auto-selection logic - users should be able to select individual player prop markets

  // Debug logging after marketGames is available
  console.log('🎯 Markets hook params:', {
    sportsForMode,
    picked,
    isPlayerPropsMode,
    selectedDate,
    marketsForMode,
    marketGamesCount: marketGames?.length || 0,
    selectedBooks: selectedBooks
  });
  
  // Debug: Log games by sport
  if (marketGames?.length > 0) {
    const gamesBySport = marketGames.reduce((acc, game) => {
      const sport = game.sport_key || 'unknown';
      acc[sport] = (acc[sport] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Games by sport:', gamesBySport);
  }

  // Update bookList when marketBooks changes
  useEffect(() => {
    if (marketBooks && marketBooks.length > 0) {
      setBookList(marketBooks);
    }
  }, [marketBooks]);

  const filteredGames = useMemo(() => {
    if (!Array.isArray(marketGames)) return [];
    
    // If no date filter is selected, return all games
    if (!selectedDate || selectedDate === "") {
      console.log('🗓️ No date filter - showing all games:', marketGames.length);
      return marketGames;
    }
    
    // Filter for live games only
    if (selectedDate === "live") {
      const liveGames = marketGames.filter(game => {
        const isLive = game.commence_time && new Date(game.commence_time) <= new Date();
        return isLive;
      });
      console.log('🔴 Live games filter - showing:', liveGames.length, 'of', marketGames.length);
      return liveGames;
    }
    
    // Filter for specific date (Today or future dates)
    // For "Today" and future dates, only show games that HAVEN'T started yet
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const nextDay = new Date(selectedDateObj);
    nextDay.setDate(selectedDateObj.getDate() + 1);
    const now = new Date();
    
    const dateFilteredGames = marketGames.filter(game => {
      if (!game.commence_time) return false;
      
      const gameTime = new Date(game.commence_time);
      const isOnSelectedDate = gameTime >= selectedDateObj && gameTime < nextDay;
      const hasNotStarted = gameTime > now; // Only show games that haven't started
      
      return isOnSelectedDate && hasNotStarted;
    });
    
    console.log(`🗓️ Date filter (${selectedDate}) - showing:`, dateFilteredGames.length, 'upcoming games of', marketGames.length, 'total');
    return dateFilteredGames;
  }, [marketGames, selectedDate]);

  // Arbitrage games filter - includes LIVE games for arbitrage detection
  // Arbitrage opportunities only exist when games are actively being traded
  const arbitrageGames = useMemo(() => {
    if (!Array.isArray(marketGames)) return [];
    
    // For arbitrage, we want ALL games (upcoming + live)
    // Arbitrage opportunities exist across all active markets
    console.log('⚡ Arbitrage games - showing all active games:', marketGames.length);
    return marketGames;
  }, [marketGames]);

  // Clear filters loading when data is ready
  useEffect(() => {
    if (!marketsLoading && filteredGames.length > 0) {
      setFiltersLoading(false);
    }
  }, [marketsLoading, filteredGames.length]);

  // Auto-select all relevant markets when sports change (draft state)
  useEffect(() => {
    if (draftPicked && draftPicked.length > 0) {
      const autoSelectedMarkets = getAutoSelectedMarkets(draftPicked);
      setDraftMarketKeys(autoSelectedMarkets);
      console.log('🎯 Auto-selected draft markets for sports:', draftPicked, '→', autoSelectedMarkets);
    }
  }, [draftPicked]);

  // Auto-select all relevant markets when applied sports change
  useEffect(() => {
    if (picked && picked.length > 0) {
      // Get all relevant markets for the selected sports
      const autoSelectedMarkets = getAutoSelectedMarkets(picked);
      
      // If we already have some markets selected, merge them with the auto-selected ones
      // to ensure we don't lose any markets when adding new sports
      if (marketKeys && marketKeys.length > 0) {
        // Create a Set to avoid duplicates
        const combinedMarkets = new Set([...marketKeys, ...autoSelectedMarkets]);
        setMarketKeys(Array.from(combinedMarkets));
        console.log('🎯 Combined markets for sports:', picked, '→', Array.from(combinedMarkets));
      } else {
        // If no markets are selected yet, use the auto-selected ones
        setMarketKeys(autoSelectedMarkets);
        console.log('🎯 Auto-selected markets for sports:', picked, '→', autoSelectedMarkets);
      }
    }
  }, [picked]);

  // Enhanced player props loading state - show loading until props are populated
  useEffect(() => {
    if (isPlayerPropsMode) {
      // Check if we have any player prop markets in the data
      // We're now checking for ANY markets, not just the selected ones
      const hasPropsData = filteredGames.some(game => 
        game.bookmakers?.some(book => 
          book.markets?.some(market => 
            market.key.startsWith('player_') // Any player prop market
          )
        )
      );
      
      // Only show loading if we're actively fetching data and have no games yet
      const shouldShowLoading = marketsLoading && (!filteredGames.length || !hasPropsData);
      setPlayerPropsProcessing(shouldShowLoading);
      
      console.log('🎯 Player Props Loading State:', {
        isPlayerPropsMode,
        marketsLoading,
        filteredGamesCount: filteredGames.length,
        hasPropsData,
        shouldShowLoading
      });
    } else {
      setPlayerPropsProcessing(false);
    }
  }, [isPlayerPropsMode, marketsLoading, filteredGames]);

  // Immediate loading feedback when switching to Player Props
  useEffect(() => {
    if (isPlayerPropsMode) {
      // Show loading immediately when switching to props mode
      setPlayerPropsProcessing(true);
      console.log('🎯 Switched to Player Props mode - showing loading');
      
      // Force refresh the table to trigger immediate data fetch
      setTableNonce(prev => prev + 1);
      
      // Always show loading for at least 2 seconds when switching to player props mode
      // This ensures users see the loading indicator even if data loads quickly
      const minLoadingTimer = setTimeout(() => {
        if (isPlayerPropsMode) {
          console.log('🎯 Player Props minimum loading time completed');
          // Check for ANY player prop markets, not just selected ones
          const hasPropsData = filteredGames.some(game => 
            game.bookmakers?.some(book => 
              book.markets?.some(market => 
                market.key.startsWith('player_') // Any player prop market
              )
            )
          );
          
          // Only stop loading if we have data or if we're not actively fetching
          if ((filteredGames.length > 0 && hasPropsData) || !marketsLoading) {
            console.log('🎯 Minimum loading time passed, showing available data');
            setPlayerPropsProcessing(false);
          } else {
            console.log('🎯 Still loading player props data after minimum time');
          }
        }
      }, 2000); // Minimum 2 second loading time for better UX
      
      return () => clearTimeout(minLoadingTimer);
    }
  }, [isPlayerPropsMode, filteredGames, marketsLoading]);

  // Player props prefetching and caching optimization
  useEffect(() => {
    if (isPlayerPropsMode && filteredGames.length > 0) {
      // Prefetch player props data for faster loading
      const prefetchPlayerProps = async () => {
        const cacheKey = `player-props:${picked.join(',')}:${selectedDate}`;
        
        try {
          await smartCache.prefetch(cacheKey, async () => {
            console.log('🎯 Prefetching player props data...');
            // This will be handled by the useMarkets hook, but we're warming the cache
            return { prefetched: true, timestamp: Date.now() };
          }, {
            type: 'LIVE',
            priority: 'high',
            customTTL: 10000 // 10 seconds for live player props
          });
        } catch (error) {
          console.warn('Failed to prefetch player props:', error);
        }
      };

      // Debounce prefetching to avoid excessive requests
      const timeoutId = setTimeout(prefetchPlayerProps, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isPlayerPropsMode, picked, selectedDate, filteredGames.length]);

  // Removed redundant loading effect to prevent flashing

  const effectiveSelectedBooks = useMemo(() => {
    // Use mode-specific sportsbook selection
    const currentSelectedBooks = isPlayerPropsMode ? selectedPlayerPropsBooks : selectedBooks;
    
    // If no books are explicitly selected, return an EMPTY ARRAY to signal "show all books"
    // This is better than returning all marketBooks keys because:
    // 1. It's more efficient (no filtering needed)
    // 2. It will include ALL books, even ones not in the current data
    // 3. It's consistent with how the OddsTable component expects "show all" to work
    let result = (currentSelectedBooks && currentSelectedBooks.length) 
      ? currentSelectedBooks 
      : [];
    
    // Removed auto-include logic - users should be able to select individual DFS apps
    
    // Debug logging for filtering issues
    console.log('🎯 Bookmaker Filtering Debug:', {
      mode: isPlayerPropsMode ? 'Player Props' : 'Straight Bets',
      selectedBooks: selectedBooks,
      selectedPlayerPropsBooks: selectedPlayerPropsBooks,
      currentSelectedBooks: currentSelectedBooks,
      selectedBooksLength: currentSelectedBooks?.length || 0,
      marketBooks: marketBooks?.map(b => b.key) || [],
      effectiveSelectedBooks: result.length ? result : 'ALL BOOKS (empty filter)',
      effectiveLength: result.length,
      isShowingAllBooks: result.length === 0
    });
    
    return result;
  }, [selectedBooks, selectedPlayerPropsBooks, marketBooks, isPlayerPropsMode]);

  const handleMobileSearch = (searchTerm) => {
    setQuery(searchTerm);
    setShowMobileSearch(false);
  };

  // Fetch sports list for filters
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await secureFetch(withApiBase('/api/sports'), { credentials: 'include' });
        if (response.ok) {
          const sports = await response.json();
          // Filter out "winner" and "election" sports
          const filteredSports = sports.filter(sport => 
            !sport.key.includes('winner') && 
            !sport.key.includes('election') &&
            !sport.key.includes('_outright')
          );
          setSportList(filteredSports);
        }
      } catch (error) {
        console.warn('Failed to fetch sports list:', error);
        // Fallback sports list
        setSportList([
          // Major US Sports
          { key: 'americanfootball_nfl', title: 'NFL', group: "Major US Sports" },
          { key: 'americanfootball_ncaaf', title: 'NCAAF', group: "Major US Sports" },
          { key: 'basketball_nba', title: 'NBA', group: "Major US Sports" },
          { key: 'basketball_ncaab', title: 'NCAAB', group: "Major US Sports" },
          { key: 'icehockey_nhl', title: 'NHL', group: "Major US Sports" },
          { key: 'baseball_mlb', title: 'MLB', group: "Major US Sports" },
          
          // Soccer
          { key: 'soccer_epl', title: 'EPL', group: "Soccer" },
          { key: 'soccer_uefa_champs_league', title: 'Champions League', group: "Soccer" },
          { key: 'soccer_mls', title: 'MLS', group: "Soccer" },
          
          // Combat Sports
          { key: 'mma_mixed_martial_arts', title: 'MMA', group: "Combat Sports" },
          { key: 'boxing_boxing', title: 'Boxing', group: "Combat Sports" }
        ]);
      }
    };
    fetchSports();
  }, []);

  // Sync draft state with applied state only when filters modal opens
  useEffect(() => {
    if (mobileFiltersOpen) {
      // Only sync when modal opens, not on every state change
      setDraftPicked([...picked]);
      setDraftSelectedDate(selectedDate);
      setDraftSelectedBooks([...selectedBooks]);
      setDraftMarketKeys([...marketKeys]);
      setDraftSelectedPlayerPropMarkets([...selectedPlayerPropMarkets]);
      // Arbitrage states don't need syncing as they're internal to the component
    }
  }, [mobileFiltersOpen]); // Only depend on modal open state

  const applyFilters = () => {
    // Show loading immediately when filters are applied
    setFiltersLoading(true);
    
    // Apply draft filters to actual state
    const newPicked = Array.isArray(draftPicked) && draftPicked.length > 0 ? draftPicked : ["americanfootball_nfl"];
    const newDate = draftSelectedDate || '';
    const newBooks = Array.isArray(draftSelectedBooks) ? draftSelectedBooks : [];
    // For player props mode, respect the user's selection if they've made one
    // Otherwise use empty array to show ALL books
    const newPlayerPropsBooks = Array.isArray(draftSelectedPlayerPropsBooks) ? draftSelectedPlayerPropsBooks : [];
    const newMarkets = Array.isArray(draftMarketKeys) && draftMarketKeys.length > 0 ? draftMarketKeys : ["h2h", "spreads", "totals"];
    
    console.log('🏈 Applying filters:', {
      sports: newPicked,
      date: newDate,
      books: newBooks,
      playerPropsBooks: newPlayerPropsBooks,
      markets: newMarkets,
      playerPropsMode: showPlayerProps
    });
    
    setPicked(newPicked);
    setSelectedDate(newDate);
    setSelectedBooks(newBooks);
    setSelectedPlayerPropsBooks(newPlayerPropsBooks);
    setMarketKeys(newMarkets);
    
    // Save mode-specific sportsbook selections to localStorage
    optimizedStorage.set('userSelectedSportsbooks', newBooks);
    optimizedStorage.set('userSelectedSportsbooks_props', newPlayerPropsBooks);
    setSelectedPlayerPropMarkets(Array.isArray(draftSelectedPlayerPropMarkets) && draftSelectedPlayerPropMarkets.length > 0 ? draftSelectedPlayerPropMarkets : ["player_pass_yds", "player_rush_yds", "player_receptions"]);
    setMobileFiltersOpen(false);

    // Clear loading after a short delay to allow state updates to propagate
    setTimeout(() => {
      setFiltersLoading(false);
    }, 1000);
  };

  const resetDraftFilters = () => {
    const defaultSports = ["americanfootball_nfl"];
    setDraftPicked(defaultSports);
    setDraftSelectedDate('');
    setDraftSelectedBooks(getUserSelectedSportsbooks('game')); // Reset to user's saved sportsbooks for game mode
    setDraftSelectedPlayerPropsBooks(getUserSelectedSportsbooks('props')); // Reset to user's saved sportsbooks for props mode
    setDraftMarketKeys(getAutoSelectedMarkets(defaultSports)); // Auto-select markets for default sport
    setDraftSelectedPlayerPropMarkets(["player_pass_yds", "player_rush_yds", "player_receptions"]);
  };

  const resetAllFilters = () => {
    // Reset both draft and applied states
    // Include both NFL and NCAAF as default sports
    const defaultSports = ["americanfootball_nfl", "americanfootball_ncaaf"];
    const defaultMarkets = getAutoSelectedMarkets(defaultSports); // Auto-select markets for default sport
    // Include a mix of NFL, NCAA football, and NCAA basketball relevant markets
    const defaultPlayerProps = [
      // Football markets (NFL and NCAAF)
      "player_pass_yds", "player_rush_yds", "player_receptions", "player_anytime_td",
      // Basketball markets (NBA and NCAAB)
      "player_points", "player_rebounds", "player_assists"
    ];
    const defaultSportsbooks = getUserSelectedSportsbooks('game'); // Use user's saved sportsbooks for game mode
    // Use user's saved sportsbooks for props mode or empty array to show ALL books
    const defaultPlayerPropsSportsbooks = getUserSelectedSportsbooks('props');
    
    // Reset draft state
    setDraftPicked(defaultSports);
    setDraftSelectedDate('');
    setDraftSelectedBooks(defaultSportsbooks);
    setDraftSelectedPlayerPropsBooks(defaultPlayerPropsSportsbooks);
    setDraftMarketKeys(defaultMarkets);
    setDraftSelectedPlayerPropMarkets(defaultPlayerProps);
    
    // Reset applied state
    setPicked(defaultSports);
    setSelectedDate('');
    setSelectedBooks(defaultSportsbooks);
    setSelectedPlayerPropsBooks(defaultPlayerPropsSportsbooks);
    setMarketKeys(defaultMarkets);
    setSelectedPlayerPropMarkets(defaultPlayerProps);
  };

  // Market categories for organization
  const MARKET_CATEGORIES = {
    core: { title: 'Core Markets', icon: Target, description: 'Essential betting markets' },
    alternates: { title: 'Alternate Lines', icon: BarChart3, description: 'Additional line options' },
    team: { title: 'Team-Specific', icon: Users, description: 'Individual team markets' },
    special: { title: 'Special Markets', icon: Star, description: 'Unique betting options' }
  };

  // Core markets that are guaranteed to work - now with categories
  const CORE_MARKETS_BY_SPORT = {
    americanfootball: [
      // Core Markets
      { key: 'h2h', title: 'Moneyline', description: 'Win/Loss bets', category: 'core' },
      { key: 'spreads', title: 'Spreads', description: 'Point spreads', category: 'core' },
      { key: 'totals', title: 'Totals', description: 'Over/Under total points', category: 'core' },
      // Alternate Lines
      { key: 'alternate_spreads', title: 'Alt Spreads', description: 'All available point spreads', category: 'alternates' },
      { key: 'alternate_totals', title: 'Alt Totals', description: 'All available totals', category: 'alternates' },
      // Team-Specific
      { key: 'team_totals', title: 'Team Totals', description: 'Team-specific over/under', category: 'team' },
      { key: 'alternate_team_totals', title: 'Alt Team Totals', description: 'All team total options', category: 'team' }
    ],
    basketball: [
      // Core Markets
      { key: 'h2h', title: 'Moneyline', description: 'Win/Loss bets', category: 'core' },
      { key: 'spreads', title: 'Spreads', description: 'Point spreads', category: 'core' },
      { key: 'totals', title: 'Totals', description: 'Over/Under total points', category: 'core' },
      // Alternate Lines
      { key: 'alternate_spreads', title: 'Alt Spreads', description: 'All available point spreads', category: 'alternates' },
      { key: 'alternate_totals', title: 'Alt Totals', description: 'All available totals', category: 'alternates' },
      // Team-Specific
      { key: 'team_totals', title: 'Team Totals', description: 'Team-specific over/under', category: 'team' },
      { key: 'alternate_team_totals', title: 'Alt Team Totals', description: 'All team total options', category: 'team' }
    ],
    baseball: [
      // Core Markets
      { key: 'h2h', title: 'Moneyline', description: 'Win/Loss bets', category: 'core' },
      { key: 'spreads', title: 'Run Line', description: 'Run line spreads', category: 'core' },
      { key: 'totals', title: 'Totals', description: 'Over/Under total runs', category: 'core' },
      // Alternate Lines
      { key: 'alternate_spreads', title: 'Alt Run Lines', description: 'All available run lines', category: 'alternates' },
      { key: 'alternate_totals', title: 'Alt Totals', description: 'All available run totals', category: 'alternates' },
      // Team-Specific
      { key: 'team_totals', title: 'Team Totals', description: 'Team-specific run totals', category: 'team' }
    ],
    hockey: [
      // Core Markets
      { key: 'h2h', title: 'Moneyline', description: 'Win/Loss bets', category: 'core' },
      { key: 'spreads', title: 'Puck Line', description: 'Puck line spreads', category: 'core' },
      { key: 'totals', title: 'Totals', description: 'Over/Under total goals', category: 'core' },
      // Alternate Lines
      { key: 'alternate_spreads', title: 'Alt Puck Lines', description: 'All available puck lines', category: 'alternates' },
      { key: 'alternate_totals', title: 'Alt Totals', description: 'All available goal totals', category: 'alternates' },
      // Team-Specific
      { key: 'team_totals', title: 'Team Totals', description: 'Team-specific goal totals', category: 'team' }
    ],
    soccer: [
      // Core Markets
      { key: 'h2h', title: 'Moneyline', description: 'Win/Loss bets', category: 'core' },
      { key: 'h2h_3_way', title: '3-Way Moneyline', description: 'Win/Draw/Loss including ties', category: 'core' },
      { key: 'totals', title: 'Totals', description: 'Over/Under total goals', category: 'core' },
      // Alternate Lines
      { key: 'alternate_totals', title: 'Alt Totals', description: 'All available goal totals', category: 'alternates' },
      // Team-Specific
      { key: 'team_totals', title: 'Team Totals', description: 'Team-specific goal totals', category: 'team' },
      // Special Markets
      { key: 'draw_no_bet', title: 'Draw No Bet', description: 'Win/Loss excluding draws', category: 'special' },
      { key: 'btts', title: 'Both Teams to Score', description: 'Yes/No both teams score', category: 'special' }
    ],
    default: [
      { key: 'h2h', title: 'Moneyline', description: 'Win/Loss bets', category: 'core' },
      { key: 'spreads', title: 'Spreads', description: 'Point spreads', category: 'core' },
      { key: 'totals', title: 'Totals', description: 'Over/Under totals', category: 'core' }
    ]
  };

  // Use core markets for now - period markets will be added when server supports them
  const MARKETS_BY_SPORT = CORE_MARKETS_BY_SPORT;

  // Function to organize markets by category
  const organizeMarketsByCategory = (markets) => {
    const organized = [];
    const categorizedMarkets = {};

    // Group markets by category
    markets.forEach(market => {
      const category = market.category || 'core';
      if (!categorizedMarkets[category]) {
        categorizedMarkets[category] = [];
      }
      categorizedMarkets[category].push(market);
    });

    // Add category headers and markets in logical order
    const categoryOrder = ['core', 'alternates', 'team', 'special'];
    
    categoryOrder.forEach(categoryKey => {
      if (categorizedMarkets[categoryKey] && categorizedMarkets[categoryKey].length > 0) {
        const categoryInfo = MARKET_CATEGORIES[categoryKey];
        
        // Safety check: skip if category info is not defined
        if (!categoryInfo) {
          console.warn(`Category "${categoryKey}" not found in MARKET_CATEGORIES`);
          return;
        }
        
        // Add category header
        organized.push({
          key: `${categoryKey}_header`,
          title: categoryInfo.title,
          isHeader: true,
          icon: categoryInfo.icon,
          description: categoryInfo.description
        });
        
        // Add markets in this category
        categorizedMarkets[categoryKey].forEach(market => {
          organized.push(market);
        });
      }
    });

    return organized;
  };

  // Function to get relevant markets based on selected sports
  const getRelevantMarkets = (selectedSports) => {
    if (!selectedSports || selectedSports.length === 0) {
      return organizeMarketsByCategory(MARKETS_BY_SPORT.default);
    }

    // If multiple sports selected, combine all relevant markets
    const allMarkets = new Map();
    
    // Always include default markets for better compatibility
    MARKETS_BY_SPORT.default.forEach(market => {
      allMarkets.set(market.key, market);
    });
    
    selectedSports.forEach(sport => {
      let sportCategory = 'default';
      
      if (sport.includes('football')) sportCategory = 'americanfootball';
      else if (sport.includes('basketball')) sportCategory = 'basketball';
      else if (sport.includes('baseball')) sportCategory = 'baseball';
      else if (sport.includes('hockey')) sportCategory = 'hockey';
      else if (sport.includes('soccer')) sportCategory = 'soccer';
      
      const markets = MARKETS_BY_SPORT[sportCategory] || MARKETS_BY_SPORT.default;
      markets.forEach(market => {
        allMarkets.set(market.key, market);
      });
    });

    return organizeMarketsByCategory(Array.from(allMarkets.values()));
  };

  // Function to auto-select all relevant markets for selected sports
  const getAutoSelectedMarkets = (selectedSports) => {
    const relevantMarkets = getRelevantMarkets(selectedSports);
    // Filter out header items and only return actual market keys
    return relevantMarkets
      .filter(market => !market.isHeader)
      .map(market => market.key);
  };

  // Player prop categories with icons
  const PLAYER_PROP_CATEGORIES = {
    passing: {
      title: "Passing",
      icon: Target,
    },
    rushing: {
      title: "Rushing", 
      icon: Zap,
    },
    receiving: {
      title: "Receiving",
      icon: Users,
    },
    touchdowns: {
      title: "Touchdowns",
      icon: Trophy,
    },
    combination: {
      title: "Combination",
      icon: TrendingUp,
    },
    defense: {
      title: "Defense",
      icon: Shield,
    },
    kicking: {
      title: "Kicking",
      icon: Target,
    },
    // Baseball categories
    batting: {
      title: "Batting",
      icon: Target,
    },
    pitching: {
      title: "Pitching",
      icon: Zap,
    },
    // Hockey categories
    hockey: {
      title: "Hockey",
      icon: Target,
    },
    // Soccer categories
    soccerPlayers: {
      title: "Soccer Players",
      icon: Target,
    }
  };

  // Function to get player prop markets based on selected sports
  const getPlayerPropMarketsBySport = (selectedSports) => {
    if (!selectedSports || selectedSports.length === 0) {
      return footballPlayerPropMarkets; // Default to football
    }

    const organizedMarkets = [];
    const sportCategories = new Map();

    // Determine which categories to include based on selected sports
    selectedSports.forEach(sport => {
      // Handle football sports (both NFL and NCAA)
      if (sport.includes('football') || sport === 'americanfootball_nfl' || sport === 'americanfootball_ncaaf') {
        sportCategories.set('football', ['passing', 'rushing', 'receiving', 'touchdowns', 'combination', 'defense', 'kicking']);
        console.log(`🏈 Adding football player prop categories for sport: ${sport}`);
      } 
      // Handle baseball sports
      else if (sport.includes('baseball') || sport === 'baseball_mlb') {
        sportCategories.set('baseball', ['batting', 'pitching']);
        console.log(`⚾ Adding baseball player prop categories for sport: ${sport}`);
      } 
      // Handle hockey sports
      else if (sport.includes('hockey') || sport === 'icehockey_nhl') {
        sportCategories.set('hockey', ['hockey']);
        console.log(`🏒 Adding hockey player prop categories for sport: ${sport}`);
      } 
      // Handle soccer sports
      else if (sport.includes('soccer')) {
        sportCategories.set('soccer', ['soccerPlayers']);
        console.log(`⚽ Adding soccer player prop categories for sport: ${sport}`);
      } 
      // Handle basketball sports (both NBA and NCAA)
      else if (sport.includes('basketball') || sport === 'basketball_nba' || sport === 'basketball_ncaab') {
        sportCategories.set('basketball', ['basketball']);
        console.log(`🏀 Adding basketball player prop categories for sport: ${sport}`);
      }
    });

    // Build organized markets for each sport
    sportCategories.forEach((categories, sportType) => {
      categories.forEach(category => {
        if (PLAYER_PROP_MARKETS[category]) {
          const categoryInfo = PLAYER_PROP_CATEGORIES[category];
          
          // Safety check: skip if category info is not defined
          if (!categoryInfo) {
            console.warn(`Player prop category "${category}" not found in PLAYER_PROP_CATEGORIES`);
            return;
          }
          
          // Add category header
          organizedMarkets.push({
            key: `${category}_header`,
            title: categoryInfo.title,
            sport: sportType,
            isHeader: true,
            icon: categoryInfo.icon
          });
          
          // Add markets for this category
          PLAYER_PROP_MARKETS[category]
            .filter(market => market.sport === sportType)
            .forEach(market => {
              organizedMarkets.push({
                ...market,
                title: `${market.title}`
              });
            });
        }
      });
    });

    return organizedMarkets.length > 0 ? organizedMarkets : footballPlayerPropMarkets;
  };

  // Memoized football player prop markets for better performance
  const footballPlayerPropMarkets = useMemo(() => {
    const footballCategories = ['passing', 'rushing', 'receiving', 'touchdowns', 'combination', 'defense', 'kicking'];
    const organizedMarkets = [];
    
    footballCategories.forEach(category => {
      if (PLAYER_PROP_MARKETS[category]) {
        const categoryInfo = PLAYER_PROP_CATEGORIES[category];
        
        // Safety check: skip if category info is not defined
        if (!categoryInfo) {
          console.warn(`Football player prop category "${category}" not found in PLAYER_PROP_CATEGORIES`);
          return;
        }
        
        // Add category header (for visual organization)
        organizedMarkets.push({
          key: `${category}_header`,
          title: categoryInfo.title,
          sport: 'football',
          isHeader: true,
          icon: categoryInfo.icon
        });
        
        // Add markets in this category
        PLAYER_PROP_MARKETS[category]
          .filter(market => market.sport === 'football')
          .forEach(market => {
            organizedMarkets.push({
              ...market,
              title: `${market.title}` // Clean title without category prefix
            });
          });
      }
    });
    
    return organizedMarkets;
  }, []); // Empty dependency array since PLAYER_PROP_MARKETS is static

  // Memoized enhanced sportsbook list to prevent unnecessary recalculations
  const enhancedSportsbookList = useMemo(() => {
    const marketBookKeys = new Set((marketBooks || []).map(book => book.key));
    
    // Get all available DFS apps
    const dfsApps = getDFSApps();
    const missingDFSApps = dfsApps.filter(dfs => !marketBookKeys.has(dfs.key));
    
    // For both Straight Bets and Player Props modes, include all sportsbooks AND DFS apps
    const enhancedBooks = [
      ...(marketBooks || []),
      ...missingDFSApps.map(dfs => ({ key: dfs.key, title: dfs.name }))
    ];
    
    // Log different messages based on mode
    if (showPlayerProps) {
      console.log('🎯 Player Props Sportsbooks:', {
        totalAvailable: enhancedBooks.length,
        regularBooks: marketBooks?.length || 0,
        dfsApps: missingDFSApps.length,
        allBooks: enhancedBooks.map(b => b.key)
      });
    } else {
      console.log('📈 Straight Bets Sportsbooks:', {
        totalAvailable: enhancedBooks.length,
        regularBooks: marketBooks?.length || 0,
        dfsApps: missingDFSApps.length,
        allBooks: enhancedBooks.map(b => b.key)
      });
    }
    
    return enhancedBooks;
  }, [marketBooks, showPlayerProps]);

  // Helper function to get current section ID
  const getCurrentSectionId = () => {
    if (showPlayerProps) return 'props';
    if (showArbitrage) return 'arbitrage';
    if (showMiddles) return 'middles';
    return 'game';
  };

  // Handle section change from SectionMenu
  const handleSectionChange = (sectionId) => {
    console.log(`🔄 Changing section to: ${sectionId}`);
    
    // Update all mode states based on the selected section
    setShowPlayerProps(sectionId === 'props');
    setShowArbitrage(sectionId === 'arbitrage');
    setShowMiddles(sectionId === 'middles');
    
    // Update URL to persist mode selection
    const searchParams = new URLSearchParams(location.search);
    if (sectionId === 'props') {
      searchParams.set('mode', 'props');
    } else if (sectionId === 'arbitrage') {
      searchParams.set('mode', 'arbitrage');
    } else if (sectionId === 'middles') {
      searchParams.set('mode', 'middles');
    } else {
      searchParams.delete('mode'); // Remove mode param for game odds
    }
    
    // Use navigate with replace to update URL without page reload
    const newUrl = `${location.pathname}?${searchParams.toString()}`;
    console.log(`🔄 Navigating to: ${newUrl}`);
    navigate(newUrl, { replace: true });
    
    // Force a re-render by updating the table nonce
    setTableNonce(prev => prev + 1);
    
    // Use replace state to avoid breaking browser history
    window.history.replaceState(
      null, 
      '', 
      searchParams.toString() ? `${location.pathname}?${searchParams.toString()}` : location.pathname
    );
  };

  return (
    <div className="sportsbook-markets">
      <SEOHelmet
        title={PAGE_TITLES.sportsbooks}
        description={PAGE_DESCRIPTIONS.sportsbooks}
        path="/sportsbooks"
        schema={generateSchemaMarkup('WebApplication')}
      />
      {/* Desktop Header */}
      <DesktopHeader
        onFilterClick={() => setMobileFiltersOpen(true)}
        currentSection={getCurrentSectionId()}
        onSectionChange={handleSectionChange}
        hasPlatinum={hasPlatinum}
      />
      
      {/* Desktop Sidebar + Main Content Layout */}
      <div className="sportsbook-markets-container">
        {/* Desktop Filters Sidebar (visible on desktop only) */}
        <aside className="desktop-filters-sidebar">
          <div className="desktop-filters-card">
            {/* Section Selector Buttons */}
            <div className="desktop-section-buttons">
              <button 
                className={`desktop-section-btn ${getCurrentSectionId() === 'game' ? 'active' : ''}`}
                onClick={() => handleSectionChange('game')}
              >
                <BarChart3 size={18} />
                Straight Bets
              </button>
              <button 
                className={`desktop-section-btn ${getCurrentSectionId() === 'props' ? 'active' : ''}`}
                onClick={() => handleSectionChange('props')}
              >
                <Target size={18} />
                Player Props
              </button>
              <button 
                className={`desktop-section-btn ${getCurrentSectionId() === 'arbitrage' ? 'active' : ''}`}
                onClick={() => handleSectionChange('arbitrage')}
              >
                <Zap size={18} />
                Arbitrage
              </button>
              <button 
                className={`desktop-section-btn ${getCurrentSectionId() === 'middles' ? 'active' : ''}`}
                onClick={() => handleSectionChange('middles')}
              >
                <Activity size={18} />
                Middles
              </button>
            </div>

            <div className="desktop-filters-header">
              <svg className="desktop-filters-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <h3>Filters</h3>
            </div>

            {/* Auto-Refresh Toggle */}
            <div className="desktop-filter-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <RefreshCw size={16} style={{ opacity: autoRefreshEnabled ? 1 : 0.5 }} />
                  Auto-Refresh (30s)
                </span>
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={toggleAutoRefresh}
                  style={{
                    width: '40px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: 'var(--accent)'
                  }}
                />
              </label>
            </div>

            {/* Player Props Filters */}
            {showPlayerProps && (
              <>
                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏈</span> Sports
                  </div>
                  <SportMultiSelect
                    list={sportList || []}
                    selected={draftPicked || []}
                    onChange={setDraftPicked}
                    placeholderText="Select sports..."
                    allLabel="All Sports"
                    enableCategories={true}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>📅</span> Date
                  </div>
                  <DatePicker
                    value={draftSelectedDate}
                    onChange={setDraftSelectedDate}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🎯</span> Player Prop Markets
                  </div>
                  <SportMultiSelect
                    list={getPlayerPropMarketsBySport(draftPicked)}
                    selected={draftSelectedPlayerPropMarkets || []}
                    onChange={setDraftSelectedPlayerPropMarkets}
                    placeholderText="Select player props..."
                    allLabel="All Player Props"
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏪</span> Sportsbooks
                  </div>
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
                </div>
              </>
            )}

            {/* Arbitrage Filters */}
            {showArbitrage && (
              <>
                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>💰</span> Minimum Profit %
                  </div>
                  <input
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={draftMinProfit}
                    onChange={(e) => setDraftMinProfit(Number(e.target.value))}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>💵</span> Max Stake
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="10"
                    value={draftMaxStake}
                    onChange={(e) => setDraftMaxStake(Number(e.target.value))}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏪</span> Sportsbooks
                  </div>
                  <SportMultiSelect
                    list={enhancedSportsbookList}
                    selected={draftSelectedBooks || []}
                    onChange={setDraftSelectedBooks}
                    placeholderText="Select sportsbooks..."
                    allLabel="All Sportsbooks"
                    isSportsbook={true}
                    enableCategories={true}
                    showDFSApps={false}
                  />
                </div>
              </>
            )}

            {/* Straight Bets Filters */}
            {!showPlayerProps && !showArbitrage && (
              <>
                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>📅</span> Date
                  </div>
                  <DatePicker
                    value={draftSelectedDate}
                    onChange={setDraftSelectedDate}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏈</span> Sports
                  </div>
                  <SportMultiSelect
                    list={sportList || []}
                    selected={draftPicked || []}
                    onChange={setDraftPicked}
                    placeholderText="Select sports..."
                    allLabel="All Sports"
                    enableCategories={true}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏪</span> Sportsbooks
                  </div>
                  <SportMultiSelect
                    list={enhancedSportsbookList}
                    selected={draftSelectedBooks || []}
                    onChange={(newSelection) => {
                      console.log('🏪 Straight Bets Sportsbook selection changed:', {
                        newSelection,
                        previousSelection: draftSelectedBooks,
                        listAvailable: enhancedSportsbookList?.length,
                        listKeys: enhancedSportsbookList?.map(b => b.key)
                      });
                      setDraftSelectedBooks(newSelection);
                    }}
                    placeholderText="Select sportsbooks..."
                    allLabel="All Sportsbooks"
                    isSportsbook={true}
                    enableCategories={true}
                    showDFSApps={false}
                  />
                </div>
              </>
            )}

            {/* Apply/Reset Buttons */}
            <div className="desktop-filter-actions">
              <button className="desktop-filter-btn desktop-filter-btn-apply" onClick={applyFilters}>
                Apply
              </button>
              <button className="desktop-filter-btn desktop-filter-btn-reset" onClick={resetAllFilters}>
                Reset
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="desktop-main-content">
      
      {/* Debug info removed as requested */}
      
      {/* Dynamic header based on current section */}
      <div style={{ 
        height: "60px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))",
        border: "1px solid rgba(139, 92, 246, 0.1)",
        borderRadius: "12px",
        marginBottom: "20px",
        padding: "0 20px"
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: "24px", 
          fontWeight: "700", 
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          {getCurrentSectionId() === 'props' && (
            <>
              <Target size={24} color="#a78bfa" />
              Player Props
            </>
          )}
          {getCurrentSectionId() === 'arbitrage' && (
            <>
              <Zap size={24} color="#a78bfa" />
              Arbitrage
            </>
          )}
          {getCurrentSectionId() === 'middles' && (
            <>
              <Activity size={24} color="#a78bfa" />
              Middle Betting
            </>
          )}
          {getCurrentSectionId() === 'game' && (
            <>
              <BarChart3 size={24} color="#a78bfa" />
              Straight Bets
            </>
          )}
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Cache Indicator */}
          {usingCache && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#10b981',
              fontWeight: '500'
            }}>
              <Zap size={14} />
              <span>Cached</span>
            </div>
          )}
          
          {/* Refresh Button with Cooldown Timer */}
          <button
            onClick={handleRefresh}
            disabled={marketsLoading || isRefreshing || refreshCooldown > 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: (marketsLoading || isRefreshing || refreshCooldown > 0)
                ? 'rgba(139, 92, 246, 0.3)' 
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(124, 58, 237, 0.8))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (marketsLoading || isRefreshing || refreshCooldown > 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: (marketsLoading || isRefreshing || refreshCooldown > 0) ? 0.6 : 1,
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              if (!marketsLoading && !isRefreshing && refreshCooldown === 0) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title={refreshCooldown > 0 ? `Wait ${refreshCooldown}s before refreshing again` : usingCache ? 'Refresh cached data' : 'Refresh odds data (clears cache)'}
          >
            <RefreshCw 
              size={16} 
              style={{ 
                animation: (marketsLoading || isRefreshing) ? 'spin 1s linear infinite' : 'none'
              }} 
            />
            {(marketsLoading || isRefreshing) 
              ? 'Refreshing...' 
              : refreshCooldown > 0 
                ? `Wait ${refreshCooldown}s` 
                : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Show authentication required message */}
      {(marketsError && marketsError.includes('Authentication required')) && (
        <AuthRequired message="Please sign in to view live odds and betting data" />
      )}
      
      {/* Authentication check removed - handled by SimpleAuth */}

      {/* Show subscription required message for users without Gold plan */}
      {me && !me.plan && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '12px',
          padding: '24px',
          margin: '24px 16px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#FFD700', margin: '0 0 12px 0' }}>
            🥇 Gold Subscription Required
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Subscribe to Gold plan for just $10/month to access live odds and game data.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Upgrade to Gold
          </button>
        </div>
      )}

      {/* Main Content */}
      {console.log('🔍 Rendering condition check:', {
        marketsError: marketsError,
        authRequired: marketsError && marketsError.includes('Authentication required'),
        isArbitrageMode,
        hasPlatinum,
        condition1: isArbitrageMode && hasPlatinum,
        condition2: isArbitrageMode && !hasPlatinum
      })}
      
      {/* Show API error display for connection issues */}
      {marketsError && !marketsError.includes('Authentication required') ? (
        <ApiErrorDisplay 
          error={marketsError} 
          onRetry={() => window.location.reload()} 
        />
      ) : (marketsError && marketsError.includes('Authentication required')) ? null : isArbitrageMode && hasPlatinum ? (
        <ArbitrageDetector 
          sport={picked.length > 0 ? picked : ['americanfootball_nfl', 'americanfootball_ncaaf', 'basketball_nba', 'basketball_ncaab', 'baseball_mlb', 'icehockey_nhl']}
          games={arbitrageGames}
          bookFilter={effectiveSelectedBooks}
          compact={false}
          minProfit={draftMinProfit}
          maxStake={draftMaxStake}
          selectedMarkets={draftMarketKeys}
        />
      ) : isArbitrageMode && !hasPlatinum ? (
        <div style={{
          background: 'var(--card-bg)',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '32px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>
            ⚡ Arbitrage Detection - Premium Feature
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Unlock real-time arbitrage opportunities across multiple sportsbooks. Find guaranteed profit opportunities with advanced algorithms.
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
      ) : isMiddlesMode && hasPlatinum ? (
        <MiddlesDetector 
          sport={picked[0] || 'americanfootball_nfl'}
          games={filteredGames}
          bookFilter={effectiveSelectedBooks}
          compact={false}
        />
      ) : isMiddlesMode && !hasPlatinum ? (
        <div style={{
          background: 'var(--card-bg)',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '32px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>
            🎪 Middle Betting - Premium Feature
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Discover middle betting opportunities where you can win both bets when the result lands between different lines. Advanced strategy for experienced bettors.
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
      ) : isPlayerPropsMode ? (
        !isOverQuota ? (
          console.log('SportsbookMarkets: selectedPlayerPropMarkets =', selectedPlayerPropMarkets),
          <div style={{ position: 'relative' }}>
            {/* Refresh Overlay */}
            {isRefreshing && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(10, 6, 18, 0.8)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                borderRadius: '12px',
                gap: '12px'
              }}>
                <RefreshCw size={48} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                  Refreshing Odds...
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Getting latest lines from all sportsbooks
                </div>
              </div>
            )}
            <OddsTable
              key={`props-${tableNonce}`}
              games={filteredGames}
              pageSize={15}
              mode="props"
              bookFilter={effectiveSelectedBooks}
              marketFilter={selectedPlayerPropMarkets} // Use selected player prop markets
              evMin={null}
              loading={filtersLoading || playerPropsProcessing || marketsLoading}
              error={error || marketsError}
              oddsFormat={oddsFormat}
              allCaps={false}
              onAddBet={addBet}
              betSlipCount={bets.length}
              onOpenBetSlip={openBetSlip}
              searchQuery={debouncedQuery}
            />
          </div>
        ) : null
      ) : !isOverQuota ? (
        <div style={{ position: 'relative' }}>
          {/* Refresh Overlay */}
          {isRefreshing && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(10, 6, 18, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              borderRadius: '12px',
              gap: '12px'
            }}>
              <RefreshCw size={48} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                Refreshing Odds...
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Getting latest lines from all sportsbooks
              </div>
            </div>
          )}
          <OddsTable
            key={tableNonce}
            games={filteredGames}
            pageSize={15}
            mode="game"
            bookFilter={effectiveSelectedBooks}
            marketFilter={[]} // Empty array to show ALL markets
            evMin={minEV === "" ? null : Number(minEV)}
          loading={filtersLoading || marketsLoading}
          error={error || marketsError}
          oddsFormat={oddsFormat}
          allCaps={false}
          onAddBet={addBet}
          betSlipCount={bets.length}
          onOpenBetSlip={openBetSlip}
        />
        </div>
      ) : null}

      {/* Mobile filter button - positioned on the left */}
      <FilterMenu onClick={() => setMobileFiltersOpen(true)} isOpen={mobileFiltersOpen} />
      
      {/* Section menu button - positioned on the right */}
      <SectionMenu 
        currentSection={getCurrentSectionId()} 
        onSectionChange={handleSectionChange} 
        hasPlatinum={hasPlatinum} 
      />
      
      {/* Mobile footer nav */}
      <MobileBottomBar
        onFilterClick={() => setMobileFiltersOpen(true)}
        active="sportsbooks"
        onSearchClick={() => setShowMobileSearch(true)}
        currentSection={getCurrentSectionId()}
        onSectionChange={handleSectionChange}
        hasPlatinum={hasPlatinum}
      />
      
      <MobileFiltersSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title={isPlayerPropsMode ? "NFL Player Props" : "Filters"}>
        <div className="filter-stack" style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Player Props Mode Filters */}
          {showPlayerProps ? (
            <>
              {/* Sports Selection for Player Props */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🏈 Sports
                </label>
                <SportMultiSelect
                  list={sportList || []}
                  selected={draftPicked || []}
                  onChange={setDraftPicked}
                  placeholderText="Select sports..."
                  allLabel="All Sports"
                  enableCategories={true}
                />
              </div>

              {/* Date Filter for Player Props */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  📅 Date
                </label>
                <DatePicker
                  value={draftSelectedDate}
                  onChange={setDraftSelectedDate}
                />
              </div>

              {/* Player Props Market Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🎯 Player Prop Markets
                </label>
                <SportMultiSelect
                  list={getPlayerPropMarketsBySport(draftPicked)}
                  selected={draftSelectedPlayerPropMarkets || []}
                  onChange={setDraftSelectedPlayerPropMarkets}
                  placeholderText="Select player props..."
                  allLabel="All Player Props"
                />
              </div>

              {/* Sportsbooks Filter for Player Props */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🏪 Sportsbooks
                </label>
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
              </div>
            </>
          ) : showArbitrage ? (
            <>
              {/* Arbitrage-specific filters */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  💰 Minimum Profit %
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={draftMinProfit}
                  onChange={(e) => setDraftMinProfit(Number(e.target.value))}
                  className="form-control"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  💵 Max Stake
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="10"
                  value={draftMaxStake}
                  onChange={(e) => setDraftMaxStake(Number(e.target.value))}
                  className="form-control"
                />
              </div>

              {/* Sportsbooks Filter for Arbitrage */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🏪 Sportsbooks
                </label>
                <SportMultiSelect
                  list={enhancedSportsbookList}
                  selected={draftSelectedBooks || []}
                  onChange={setDraftSelectedBooks}
                  placeholderText="Select sportsbooks..."
                  allLabel="All Sportsbooks"
                  isSportsbook={true}
                  enableCategories={true}
                  showDFSApps={false}
                />
              </div>
            </>
          ) : (
            <>
              {/* Date Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  📅 Date
                </label>
                <DatePicker
                  value={draftSelectedDate}
                  onChange={setDraftSelectedDate}
                />
              </div>

              {/* Sports Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🏈 Sports
                </label>
                <SportMultiSelect
                  list={sportList || []}
                  selected={draftPicked || []}
                  onChange={setDraftPicked}
                  placeholderText="Select sports..."
                  allLabel="All Sports"
                  enableCategories={true}
                />
              </div>

              {/* Sportsbooks Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🏪 Sportsbooks
                </label>
                <SportMultiSelect
                  list={enhancedSportsbookList}
                  selected={draftSelectedBooks || []}
                  onChange={setDraftSelectedBooks}
                  placeholderText="Select sportsbooks..."
                  allLabel="All Sportsbooks"
                  isSportsbook={true}
                  enableCategories={true}
                  showDFSApps={false}
                />
              </div>

              {/* Markets Filter - TEMPORARILY HIDDEN */}
              {/* All markets are automatically selected */}
              {false && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                    📊 Markets
                  </label>
                  <SportMultiSelect
                    list={getRelevantMarkets(draftPicked)}
                    selected={draftMarketKeys || []}
                    onChange={setDraftMarketKeys}
                    placeholderText="Select markets..."
                    allLabel="All Markets"
                  />
                </div>
              )}
              </>
            )}

          {/* Auto-Refresh Toggle */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '20px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <RefreshCw size={16} style={{ opacity: autoRefreshEnabled ? 1 : 0.5 }} />
                Auto-Refresh (30s)
              </span>
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={toggleAutoRefresh}
                style={{
                  width: '40px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: 'var(--accent)'
                }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={applyFilters} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
              Apply
            </button>
            <button onClick={resetAllFilters} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6b7280, #4b5563)', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
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
};

export default SportsbookMarkets;
