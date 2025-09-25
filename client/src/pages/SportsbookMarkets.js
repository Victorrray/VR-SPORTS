// src/pages/SportsbookMarkets.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Target, Zap, Users, Trophy, ChevronDown, ChevronUp, TrendingUp, Shield, BarChart3, Star } from 'lucide-react';
import { optimizedStorage } from "../utils/storageOptimizer";
import { smartCache } from "../utils/enhancedCache";
import MobileBottomBar from "../components/layout/MobileBottomBar";
import MobileFiltersSheet from "../components/layout/MobileFiltersSheet";
import MobileSearchModal from "../components/modals/MobileSearchModal";
import { useBetSlip } from "../contexts/BetSlipContext";
import BetSlip from "../components/betting/BetSlip";
import SportMultiSelect from "../components/betting/SportMultiSelect";
import DatePicker from "../components/common/DatePicker";
import OddsTable from "../components/betting/OddsTable";
import ArbitrageDetector from "../components/betting/ArbitrageDetector";
import MiddlesDetector from "../components/betting/MiddlesDetector";
import AuthRequired from "../components/auth/AuthRequired";
import useDebounce from "../hooks/useDebounce";
import { withApiBase } from "../config/api";
import { secureFetch } from "../utils/security";
import { useMarkets } from '../hooks/useMarkets';
import { useMe } from '../hooks/useMe';
import { useAuth } from '../hooks/useAuth';
import { AVAILABLE_SPORTSBOOKS, getDFSApps } from '../constants/sportsbooks';

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
    
    // Default selections by mode
    if (mode === 'props') {
      return ['prizepicks', 'underdog', 'pick6', 'novig']; // Default DFS apps + NoVig for player props
    }
    // Default to popular sportsbooks if nothing saved for game mode
    return ['draftkings', 'fanduel', 'betmgm', 'caesars'];
  };
  
  const [picked, setPicked] = useState(["americanfootball_nfl", "americanfootball_ncaaf"]);
  const [query, setQuery] = useState("");
  const [selectedBooks, setSelectedBooks] = useState(getUserSelectedSportsbooks('game'));
  const [selectedPlayerPropsBooks, setSelectedPlayerPropsBooks] = useState(getUserSelectedSportsbooks('props'));
  const [selectedDate, setSelectedDate] = useState("");
  const [marketKeys, setMarketKeys] = useState(["h2h", "spreads", "totals"]); // Will be auto-updated by useEffect
  const [selectedPlayerPropMarkets, setSelectedPlayerPropMarkets] = useState(["player_pass_yds", "player_rush_yds", "player_receptions"]);
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
  const [sportList, setSportList] = useState([]);
  const [bookList, setBookList] = useState([]);
  
  // Missing variables
  const oddsFormat = "american";
  const debouncedQuery = useDebounce(query, 300);
  
  // Draft filter state - initialize with current applied state
  const [draftPicked, setDraftPicked] = useState(picked);
  const [draftSelectedDate, setDraftSelectedDate] = useState(selectedDate);
  const [draftSelectedBooks, setDraftSelectedBooks] = useState(getUserSelectedSportsbooks('game'));
  const [draftSelectedPlayerPropsBooks, setDraftSelectedPlayerPropsBooks] = useState(getUserSelectedSportsbooks('props'));
  const [draftMarketKeys, setDraftMarketKeys] = useState(marketKeys);
  const [draftSelectedPlayerPropMarkets, setDraftSelectedPlayerPropMarkets] = useState(selectedPlayerPropMarkets);
  
  // Arbitrage-specific filter states
  const [draftMinProfit, setDraftMinProfit] = useState(2);
  const [draftMaxStake, setDraftMaxStake] = useState(100);
  const [draftArbitrageSortBy, setDraftArbitrageSortBy] = useState('profit');

  const isPlayerPropsMode = showPlayerProps;
  const isArbitrageMode = showArbitrage;
  const isMiddlesMode = showMiddles;
  const marketsForMode = isPlayerPropsMode ? [...marketKeys, ...selectedPlayerPropMarkets] : marketKeys;
  const regionsForMode = isPlayerPropsMode ? ["us", "us_dfs"] : ["us", "us2", "us_exchanges"];
  
  // For player props, hardcode NFL to avoid filter issues
  // For regular mode, limit to single sport to prevent overload
  const sportsForMode = isPlayerPropsMode ? ["americanfootball_nfl"] : (picked.length > 0 ? [picked[0]] : picked);
  
  const hasPlatinum = me?.plan === 'platinum';
  const isOverQuota = me?.plan !== 'platinum' && me?.calls_made >= (me?.limit || 250);
  
  // Debug logging for arbitrage access
  console.log('🔍 Arbitrage Debug:', {
    isArbitrageMode,
    hasPlatinum,
    userPlan: me?.plan,
    userId: user?.id,
    me: me
  });

  const { 
    games: marketGames = [], 
    books: marketBooks = [], 
    isLoading: marketsLoading, 
    error: marketsError, 
    bookmakers 
  } = useMarkets(
    sportsForMode,
    regionsForMode,
    marketsForMode,
    { date: selectedDate }
  );

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
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
        
        // If still have invalid markets or empty selection, use defaults
        if (marketsToUse.length === 0 || hasInvalidMarkets) {
          marketsToUse = availableMarketKeys.slice(0, 3);
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
      const autoSelectedMarkets = getAutoSelectedMarkets(picked);
      setMarketKeys(autoSelectedMarkets);
      console.log('🎯 Auto-selected applied markets for sports:', picked, '→', autoSelectedMarkets);
    }
  }, [picked]);

  // Enhanced player props loading state - show loading until props are populated
  useEffect(() => {
    if (isPlayerPropsMode) {
      // Show loading if we're in props mode and either:
      // 1. Markets are still loading, OR
      // 2. We have games but no props data yet (games without player prop markets)
      const hasPropsData = filteredGames.some(game => 
        game.bookmakers?.some(book => 
          book.markets?.some(market => 
            selectedPlayerPropMarkets.includes(market.key)
          )
        )
      );
      
      const shouldShowLoading = marketsLoading || (!hasPropsData && filteredGames.length > 0);
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
  }, [isPlayerPropsMode, marketsLoading, filteredGames, selectedPlayerPropMarkets]);

  // Immediate loading feedback when switching to Player Props
  useEffect(() => {
    if (isPlayerPropsMode) {
      // Show loading immediately when switching to props mode
      setPlayerPropsProcessing(true);
      console.log('🎯 Switched to Player Props mode - showing loading');
      
      // Force refresh the table to trigger immediate data fetch
      setTableNonce(prev => prev + 1);
      
      // Extended timeout for player props since they take longer to load
      setTimeout(() => {
        if (isPlayerPropsMode) {
          console.log('🎯 Player Props timeout - checking if data loaded');
          const hasPropsData = filteredGames.some(game => 
            game.bookmakers?.some(book => 
              book.markets?.some(market => 
                selectedPlayerPropMarkets.includes(market.key)
              )
            )
          );
          if (!hasPropsData && !marketsLoading) {
            console.log('🎯 No props data after timeout, keeping loading state');
            setPlayerPropsProcessing(true);
          }
        }
      }, 3000); // 3 second timeout for player props
    }
  }, [isPlayerPropsMode]);

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
    const result = (currentSelectedBooks && currentSelectedBooks.length)
      ? currentSelectedBooks
      : (Array.isArray(marketBooks) ? marketBooks.map(b => b.key) : []);
    
    // Debug logging for filtering issues
    console.log('🎯 Bookmaker Filtering Debug:', {
      mode: isPlayerPropsMode ? 'Player Props' : 'Game Odds',
      selectedBooks: selectedBooks,
      selectedPlayerPropsBooks: selectedPlayerPropsBooks,
      currentSelectedBooks: currentSelectedBooks,
      selectedBooksLength: currentSelectedBooks?.length || 0,
      marketBooks: marketBooks?.map(b => b.key) || [],
      effectiveSelectedBooks: result,
      effectiveLength: result.length
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
          setSportList(sports);
        }
      } catch (error) {
        console.warn('Failed to fetch sports list:', error);
        // Fallback sports list
        setSportList([
          { key: 'americanfootball_nfl', title: 'NFL' },
          { key: 'americanfootball_ncaaf', title: 'NCAAF' },
          { key: 'basketball_nba', title: 'NBA' },
          { key: 'basketball_ncaab', title: 'NCAAB' },
          { key: 'icehockey_nhl', title: 'NHL' },
          { key: 'baseball_mlb', title: 'MLB' }
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
    const defaultSports = ["americanfootball_nfl"];
    const defaultMarkets = getAutoSelectedMarkets(defaultSports); // Auto-select markets for default sport
    const defaultPlayerProps = ["player_pass_yds", "player_rush_yds", "player_receptions"];
    const defaultSportsbooks = getUserSelectedSportsbooks('game'); // Use user's saved sportsbooks for game mode
    const defaultPlayerPropsSportsbooks = getUserSelectedSportsbooks('props'); // Use user's saved sportsbooks for props mode
    
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
      if (sport.includes('football')) {
        sportCategories.set('football', ['passing', 'rushing', 'receiving', 'touchdowns', 'combination', 'defense', 'kicking']);
      } else if (sport.includes('baseball')) {
        sportCategories.set('baseball', ['batting', 'pitching']);
      } else if (sport.includes('hockey')) {
        sportCategories.set('hockey', ['hockey']);
      } else if (sport.includes('soccer')) {
        sportCategories.set('soccer', ['soccerPlayers']);
      } else if (sport.includes('basketball')) {
        sportCategories.set('basketball', ['basketball']);
      }
    });

    // Build organized markets for each sport
    sportCategories.forEach((categories, sportType) => {
      categories.forEach(category => {
        if (PLAYER_PROP_MARKETS[category]) {
          const categoryInfo = PLAYER_PROP_CATEGORIES[category];
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
    
    // Only include DFS apps in Player Props mode
    if (showPlayerProps) {
      const dfsApps = getDFSApps();
      const missingDFSApps = dfsApps.filter(dfs => !marketBookKeys.has(dfs.key));
      const enhancedBooks = [
        ...(marketBooks || []),
        ...missingDFSApps.map(dfs => ({ key: dfs.key, title: dfs.name }))
      ];
      return enhancedBooks;
    }
    
    // For Game Odds mode, only return traditional sportsbooks (no DFS apps)
    return (marketBooks || []).filter(book => {
      const dfsAppKeys = ['prizepicks', 'underdog', 'sleeper', 'prophetx', 'pick6'];
      return !dfsAppKeys.includes(book.key);
    });
  }, [marketBooks, showPlayerProps]);

  return (
    <div className="sportsbook-markets">
      {/* Debug Section - Remove after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          background: '#1a1a2e',
          border: '2px solid #8b5cf6',
          borderRadius: '8px',
          padding: '12px',
          margin: '16px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div style={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: '8px' }}>🐛 Debug Info:</div>
          <div style={{ color: '#fff' }}>Sports Selected: {JSON.stringify(picked)}</div>
          <div style={{ color: '#fff' }}>Date Filter: {selectedDate || 'None'}</div>
          <div style={{ color: '#fff' }}>Games Found: {marketGames?.length || 0}</div>
          <div style={{ color: '#fff' }}>Player Props Mode: {showPlayerProps ? 'Yes' : 'No'}</div>
          <button 
            onClick={() => {
              console.log('🔍 Full Debug Info:', {
                picked, selectedDate, marketGames, showPlayerProps, 
                sportsForMode: isPlayerPropsMode ? ["americanfootball_nfl"] : picked
              });
              // Quick test: Force MLB selection
              setPicked(['baseball_mlb']);
              setSelectedDate('');
            }}
            style={{
              background: '#22c55e',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              marginTop: '8px',
              cursor: 'pointer'
            }}
          >
            🏈→⚾ Force MLB Test
          </button>
        </div>
      )}
      
      {/* Collapsible Navigation Dropdown */}
      <div style={{
        marginBottom: "24px",
        paddingTop: "20px",
        maxWidth: "1200px", // Match odds table max width
        margin: "0 auto 24px auto", // Center align like odds table
        paddingLeft: "16px",
        paddingRight: "16px"
      }}>
        {/* Current Selection Header */}
        <button
          onClick={() => setNavigationExpanded(!navigationExpanded)}
          style={{
            width: "100%",
            background: "var(--card-bg)",
            border: "none",
            borderRadius: "12px",
            padding: "16px 20px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: navigationExpanded ? "12px" : "0"
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ fontSize: "20px" }}>
              {isArbitrageMode ? "⚡" : isPlayerPropsMode ? "🎯" : isMiddlesMode ? "🎪" : "📊"}
            </div>
            <div>
              <div style={{
                fontWeight: "600",
                fontSize: "16px",
                color: "#ffffff",
                textAlign: "left"
              }}>
                {isArbitrageMode ? "Arbitrage" : isPlayerPropsMode ? "Player Props" : isMiddlesMode ? "Middles" : "Game Odds"}
              </div>
              <div style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "left",
                marginTop: "2px"
              }}>
                {isArbitrageMode
                  ? "Find profitable arbitrage opportunities"
                  : isPlayerPropsMode
                    ? "Explore player props across every book you follow"
                    : isMiddlesMode
                      ? "Find middle betting opportunities between different lines"
                      : "Compare odds across all major sportsbooks"}
              </div>
            </div>
          </div>
          <div style={{
            color: "var(--text-secondary)",
            transition: "transform 0.2s ease",
            transform: navigationExpanded ? "rotate(180deg)" : "rotate(0deg)"
          }}>
            <ChevronDown size={20} />
          </div>
        </button>

        {/* Dropdown Options */}
        {navigationExpanded && (
          <div style={{
            background: "var(--card-bg)",
            border: "none",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)"
          }}>
            {/* Game Odds Option */}
            <button
              onClick={() => {
                setShowArbitrage(false);
                setShowPlayerProps(false);
                setShowMiddles(false);
                setNavigationExpanded(false);
              }}
              style={{
                width: "100%",
                background: (!isArbitrageMode && !isPlayerPropsMode && !isMiddlesMode) 
                  ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                  : "transparent",
                border: "none",
                padding: "16px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                borderBottom: "1px solid var(--border-color)"
              }}
              onMouseEnter={(e) => {
                if (!(!isArbitrageMode && !isPlayerPropsMode && !isMiddlesMode)) {
                  e.target.style.background = "rgba(139, 92, 246, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!(!isArbitrageMode && !isPlayerPropsMode && !isMiddlesMode)) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              <div style={{ fontSize: "20px" }}>📊</div>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontWeight: "600",
                  fontSize: "15px",
                  color: (!isArbitrageMode && !isPlayerPropsMode && !isMiddlesMode) ? "white" : "#ffffff"
                }}>
                  Game Odds
                </div>
                <div style={{
                  fontSize: "12px",
                  color: (!isArbitrageMode && !isPlayerPropsMode && !isMiddlesMode) ? "rgba(255,255,255,0.8)" : "rgba(255, 255, 255, 0.7)",
                  marginTop: "2px"
                }}>
                  Live markets
                </div>
              </div>
              {(!isArbitrageMode && !isPlayerPropsMode && !isMiddlesMode) && (
                <div style={{
                  marginLeft: "auto",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981"
                }} />
              )}
            </button>

            {/* Player Props Option */}
            <button
              onClick={() => {
                setShowArbitrage(false);
                setShowPlayerProps(true);
                setShowMiddles(false);
                setNavigationExpanded(false);
                // Immediate loading state for better perceived performance
                setPlayerPropsProcessing(true);
              }}
              style={{
                width: "100%",
                background: isPlayerPropsMode 
                  ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                  : "transparent",
                border: "none",
                padding: "16px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                borderBottom: "1px solid var(--border-color)"
              }}
              onMouseEnter={(e) => {
                if (!isPlayerPropsMode) {
                  e.target.style.background = "rgba(139, 92, 246, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isPlayerPropsMode) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              <div style={{ fontSize: "20px" }}>🎯</div>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontWeight: "600",
                  fontSize: "15px",
                  color: isPlayerPropsMode ? "white" : "#ffffff"
                }}>
                  Player Props
                </div>
                <div style={{
                  fontSize: "12px",
                  color: isPlayerPropsMode ? "rgba(255,255,255,0.8)" : "rgba(255, 255, 255, 0.7)",
                  marginTop: "2px"
                }}>
                  DFS opportunities
                </div>
              </div>
              {isPlayerPropsMode && (
                <div style={{
                  marginLeft: "auto",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981"
                }} />
              )}
            </button>

            {/* Arbitrage Option */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 Arbitrage button clicked - setting arbitrage mode');
                setShowPlayerProps(false);
                setShowArbitrage(true);
                setShowMiddles(false);
                setNavigationExpanded(false);
              }}
              style={{
                width: "100%",
                background: isArbitrageMode 
                  ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                  : "transparent",
                border: "none",
                padding: "16px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}
              onMouseEnter={(e) => {
                if (!isArbitrageMode) {
                  e.target.style.background = "rgba(139, 92, 246, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isArbitrageMode) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              <div style={{ fontSize: "20px" }}>⚡</div>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontWeight: "600",
                  fontSize: "15px",
                  color: isArbitrageMode ? "white" : "#ffffff"
                }}>
                  Arbitrage
                </div>
                <div style={{
                  fontSize: "12px",
                  color: isArbitrageMode ? "rgba(255,255,255,0.8)" : "rgba(255, 255, 255, 0.7)",
                  marginTop: "2px"
                }}>
                  Find edges
                </div>
              </div>
              {isArbitrageMode && (
                <div style={{
                  marginLeft: "auto",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981"
                }} />
              )}
            </button>

            {/* Middles Option */}
            <button
              onClick={() => {
                setShowPlayerProps(false);
                setShowArbitrage(false);
                setShowMiddles(true);
                setNavigationExpanded(false);
              }}
              style={{
                width: "100%",
                background: isMiddlesMode 
                  ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                  : "transparent",
                border: "none",
                padding: "16px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}
              onMouseEnter={(e) => {
                if (!isMiddlesMode) {
                  e.target.style.background = "rgba(139, 92, 246, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMiddlesMode) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              <div style={{ fontSize: "20px" }}>🎪</div>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontWeight: "600",
                  fontSize: "15px",
                  color: isMiddlesMode ? "white" : "#ffffff"
                }}>
                  Middles
                </div>
                <div style={{
                  fontSize: "12px",
                  color: isMiddlesMode ? "rgba(255,255,255,0.8)" : "rgba(255, 255, 255, 0.7)",
                  marginTop: "2px"
                }}>
                  Middle betting opportunities
                </div>
              </div>
              {isMiddlesMode && (
                <div style={{
                  marginLeft: "auto",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981"
                }} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Show authentication required message */}
      {(marketsError && marketsError.includes('Authentication required')) && (
        <AuthRequired message="Please sign in to view live odds and betting data" />
      )}

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

      {/* Main Content */}
      {console.log('🔍 Rendering condition check:', {
        marketsError: marketsError,
        authRequired: marketsError && marketsError.includes('Authentication required'),
        isArbitrageMode,
        hasPlatinum,
        condition1: isArbitrageMode && hasPlatinum,
        condition2: isArbitrageMode && !hasPlatinum
      })}
      {(marketsError && marketsError.includes('Authentication required')) ? null : isArbitrageMode && hasPlatinum ? (
        <ArbitrageDetector 
          sport={picked[0] || 'americanfootball_nfl'}
          games={filteredGames}
          bookFilter={effectiveSelectedBooks}
          compact={false}
          minProfit={draftMinProfit}
          maxStake={draftMaxStake}
          selectedMarkets={draftMarketKeys}
          sortBy={draftArbitrageSortBy}
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
          <OddsTable
            key={`props-${tableNonce}`}
            games={filteredGames}
            pageSize={15}
            mode="props"
            bookFilter={effectiveSelectedBooks}
            marketFilter={selectedPlayerPropMarkets}
            evMin={null}
            loading={filtersLoading || playerPropsProcessing || (marketsLoading && (!filteredGames || filteredGames.length === 0))}
            error={error || marketsError}
            oddsFormat={oddsFormat}
            allCaps={false}
            onAddBet={addBet}
            betSlipCount={bets.length}
            onOpenBetSlip={openBetSlip}
          />
        ) : null
      ) : !isOverQuota ? (
        <OddsTable
          key={tableNonce}
          games={filteredGames}
          pageSize={15}
          mode="game"
          bookFilter={effectiveSelectedBooks}
          marketFilter={marketKeys}
          evMin={minEV === "" ? null : Number(minEV)}
          loading={filtersLoading || (marketsLoading && (!filteredGames || filteredGames.length === 0))}
          error={error || marketsError}
          oddsFormat={oddsFormat}
          allCaps={false}
          onAddBet={addBet}
          betSlipCount={bets.length}
          onOpenBetSlip={openBetSlip}
        />
      ) : null}

      {/* Mobile footer nav + filter pill */}
      <MobileBottomBar
        onFilterClick={() => setMobileFiltersOpen(true)}
        active="sportsbooks"
        onSearchClick={() => setShowMobileSearch(true)}
        style={{ display: 'flex' }}
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
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
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
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  📊 Markets
                </label>
                <SportMultiSelect
                  list={[
                    { key: 'h2h', title: 'Moneyline' },
                    { key: 'spreads', title: 'Point Spread' },
                    { key: 'totals', title: 'Over/Under' }
                  ]}
                  selected={draftMarketKeys || []}
                  onChange={setDraftMarketKeys}
                  placeholderText="Select markets..."
                  allLabel="All Markets"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🔄 Sort By
                </label>
                <select
                  value={draftArbitrageSortBy}
                  onChange={(e) => setDraftArbitrageSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  <option value="profit">Profit %</option>
                  <option value="amount">Profit Amount</option>
                  <option value="time">Time Found</option>
                  <option value="sport">Sport</option>
                </select>
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

              {/* Markets Filter */}
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
              </>
            )}

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
