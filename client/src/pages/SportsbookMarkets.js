// src/pages/SportsbookMarkets.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Target, Zap, Users, Trophy, ChevronDown, ChevronUp, TrendingUp, Shield, BarChart3, BarChart4, Star, Activity, RefreshCw, Search, Check, Clock } from 'lucide-react';
import SEOHelmet from '../components/seo/SEOHelmet';
import { PAGE_TITLES, PAGE_DESCRIPTIONS, generateSchemaMarkup } from '../utils/seo';
import { optimizedStorage } from "../utils/storageOptimizer";
import MobileFiltersSheet from "../components/layout/MobileFiltersSheet";
import MobileSearchModal from "../components/modals/MobileSearchModal";
import "../components/betting/FormControls.css"; // Import form controls styling
import { useBetSlip } from "../contexts/BetSlipContext";
import { useFilters } from "../contexts/FilterContext";
import BetSlip from "../components/betting/BetSlip";
import SportMultiSelect from "../components/betting/SportMultiSelect";
import DatePicker from "../components/common/DatePicker";
import OddsTable from "../components/betting/OddsTable";
import ArbitrageDetector from "../components/betting/ArbitrageDetector";
import MiddlesDetector from "../components/betting/MiddlesDetector";
import { Button } from '../components/design12/ui/button';
import { Card } from '../components/design12/ui/card';
import AuthRequired from "../components/auth/AuthRequired";
import ApiErrorDisplay from "../components/common/ApiErrorDisplay";
import useDebounce from "../hooks/useDebounce";
import { withApiBase } from "../config/api";
import { secureFetch } from "../utils/security";
import { useMarketsWithCache } from '../hooks/useMarketsWithCache';
import { useMe } from '../hooks/useMe';
import { useAuth } from '../hooks/SimpleAuth';
import { AVAILABLE_SPORTSBOOKS, getDFSApps, getFreePlanSportsbooks } from '../constants/sportsbooks';
import DesktopHeader from '../components/layout/DesktopHeader';
import { Header } from '../components/design12/Header';
import FilterMenu from '../components/layout/FilterMenu';
import SectionMenu from '../components/layout/SectionMenu';
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
    { key: 'player_points_alternate', title: 'Points (Alternate)', sport: 'basketball' },
    { key: 'player_rebounds', title: 'Rebounds', sport: 'basketball' },
    { key: 'player_rebounds_alternate', title: 'Rebounds (Alternate)', sport: 'basketball' },
    { key: 'player_assists', title: 'Assists', sport: 'basketball' },
    { key: 'player_assists_alternate', title: 'Assists (Alternate)', sport: 'basketball' },
    { key: 'player_threes', title: '3-Pointers Made', sport: 'basketball' },
    { key: 'player_threes_alternate', title: '3-Pointers Made (Alternate)', sport: 'basketball' },
    { key: 'player_steals', title: 'Steals', sport: 'basketball' },
    { key: 'player_steals_alternate', title: 'Steals (Alternate)', sport: 'basketball' },
    { key: 'player_blocks', title: 'Blocks', sport: 'basketball' },
    { key: 'player_blocks_alternate', title: 'Blocks (Alternate)', sport: 'basketball' },
    { key: 'player_turnovers', title: 'Turnovers', sport: 'basketball' },
    { key: 'player_turnovers_alternate', title: 'Turnovers (Alternate)', sport: 'basketball' },
    // Combination props
    { key: 'player_points_assists_alternate', title: 'Points + Assists (Alternate)', sport: 'basketball' },
    { key: 'player_points_rebounds_alternate', title: 'Points + Rebounds (Alternate)', sport: 'basketball' },
    { key: 'player_rebounds_assists_alternate', title: 'Rebounds + Assists (Alternate)', sport: 'basketball' },
    { key: 'player_points_rebounds_assists_alternate', title: 'Points + Rebounds + Assists (Alternate)', sport: 'basketball' }
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
  const { me, loading: meLoading } = useMe();
  const { bets, isOpen, addBet, removeBet, updateBet, clearAllBets, openBetSlip, closeBetSlip, placeBets } = useBetSlip();
  const { filters, updateFilter, updateFilters, openFilterModal, applyFilters: contextApplyFilters, closeFilterModal, resetFilters: contextResetFilters } = useFilters();
  
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
  
  // ===== FILTER STATE NOW MANAGED BY FilterContext =====
  // All filter state is now in the filters object from useFilters()
  // Access via: filters.sports, filters.date, filters.markets, filters.sportsbooks, etc.
  // Update via: updateFilter(key, value) or updateFilters({...})
  // Apply via: contextApplyFilters() or handleApplyFilters()
  // ====================================================
  
  // UI State (not filter-related, kept local)
  const [query, setQuery] = useState("");
  const [showPlayerProps, setShowPlayerProps] = useState(false);
  const [showArbitrage, setShowArbitrage] = useState(false);
  const [showMiddles, setShowMiddles] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableNonce, setTableNonce] = useState(0);
  const [playerPropsProcessing, setPlayerPropsProcessing] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [navigationExpanded, setNavigationExpanded] = useState(false);
  
  // Major US Sports only (for now)
  const AVAILABLE_SPORTS = [
    { key: 'americanfootball_nfl', title: 'NFL' },
    { key: 'americanfootball_ncaaf', title: 'NCAA' },
    { key: 'basketball_nba', title: 'NBA' },
    { key: 'basketball_ncaab', title: 'NCAA Basketball' },
    { key: 'icehockey_nhl', title: 'NHL' }
  ];

  const [sportList, setSportList] = useState(AVAILABLE_SPORTS);
  const [bookList, setBookList] = useState([]);
  
  // Constants
  const oddsFormat = "american";
  const debouncedQuery = useDebounce(query, 300);
  
  // Refresh cooldown state
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Auto-refresh toggle state (default: ALWAYS disabled - ignore localStorage)
  // This prevents unexpected refreshes that can clear data
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  
  // Toggle auto-refresh and save to localStorage
  const toggleAutoRefresh = () => {
    const newValue = !autoRefreshEnabled;
    setAutoRefreshEnabled(newValue);
    localStorage.setItem('autoRefreshEnabled', String(newValue));
    console.log('🔄 Auto-refresh', newValue ? 'enabled' : 'disabled');
  };
  
  // Ensure toggleAutoRefresh is available in the render scope
  const handleToggleAutoRefresh = toggleAutoRefresh;

  const isPlayerPropsMode = showPlayerProps;
  const isArbitrageMode = showArbitrage;
  const isMiddlesMode = showMiddles;
  
  // Markets to send to API - uses user's filter selection
  // For player props: use player prop market keys
  // For straight bets: use filters.markets (which includes period markets when "all" is selected)
  const marketsForMode = useMemo(() => {
    if (isPlayerPropsMode) {
      return PLAYER_PROP_MARKET_KEYS;
    }
    // Use the user's selected markets from filters
    // This includes period markets when they're selected
    if (filters.markets && filters.markets.length > 0) {
      return filters.markets;
    }
    // Fallback to core markets if nothing selected
    return ["h2h", "spreads", "totals"];
  }, [isPlayerPropsMode, filters.markets]);
  const regionsForMode = useMemo(() => isPlayerPropsMode ? ["us", "us_dfs"] : ["us", "us2", "us_exchanges"], [isPlayerPropsMode]);
  
  // Helper function to expand 'all' to actual sports list
  const expandSports = (sports) => {
    if (!sports || sports.length === 0) return [];
    if (sports.includes('all')) {
      // Return all available sports from sportList
      return sportList.map(s => s.key);
    }
    return sports;
  };

  // For player props, use selected sports or default to NFL only if none selected
  // For regular mode, use all selected sports (no longer limiting to single sport)
  // For arbitrage mode, use all major sports by default to find maximum opportunities
  const sportsForMode = isPlayerPropsMode 
    ? (filters.sports.length > 0 ? expandSports(filters.sports) : ["americanfootball_nfl"]) 
    : isArbitrageMode
    ? (filters.sports.length > 0 ? expandSports(filters.sports) : ["americanfootball_nfl", "americanfootball_ncaaf", "basketball_nba", "basketball_ncaab", "icehockey_nhl"])
    : expandSports(filters.sports);
    
  
  const hasPlatinum = me?.plan === 'platinum' || me?.unlimited === true;
  const hasGoldOrBetter = me?.plan === 'gold' || me?.plan === 'platinum';
  const isOverQuota = !hasGoldOrBetter && me?.calls_made >= (me?.limit || 250);
  

  // Market categories for organization
  const MARKET_CATEGORIES = {
    core: { title: 'Core Markets', icon: Target, description: 'Essential betting markets' },
    alternates: { title: 'Alternate Lines', icon: BarChart3, description: 'Additional line options' },
    team: { title: 'Team-Specific', icon: Users, description: 'Individual team markets' },
    periods: { title: 'Game Periods', icon: Clock, description: 'Quarter, half, and period markets' },
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
      { key: 'alternate_team_totals', title: 'Alt Team Totals', description: 'All team total options', category: 'team' },
      // Quarter Markets - Moneyline
      { key: 'h2h_q1', title: '1Q Moneyline', description: 'First quarter winner', category: 'periods' },
      { key: 'h2h_q2', title: '2Q Moneyline', description: 'Second quarter winner', category: 'periods' },
      { key: 'h2h_q3', title: '3Q Moneyline', description: 'Third quarter winner', category: 'periods' },
      { key: 'h2h_q4', title: '4Q Moneyline', description: 'Fourth quarter winner', category: 'periods' },
      // Quarter Markets - Spreads
      { key: 'spreads_q1', title: '1Q Spread', description: 'First quarter spread', category: 'periods' },
      { key: 'spreads_q2', title: '2Q Spread', description: 'Second quarter spread', category: 'periods' },
      { key: 'spreads_q3', title: '3Q Spread', description: 'Third quarter spread', category: 'periods' },
      { key: 'spreads_q4', title: '4Q Spread', description: 'Fourth quarter spread', category: 'periods' },
      // Quarter Markets - Totals
      { key: 'totals_q1', title: '1Q Total', description: 'First quarter total', category: 'periods' },
      { key: 'totals_q2', title: '2Q Total', description: 'Second quarter total', category: 'periods' },
      { key: 'totals_q3', title: '3Q Total', description: 'Third quarter total', category: 'periods' },
      { key: 'totals_q4', title: '4Q Total', description: 'Fourth quarter total', category: 'periods' },
      // Quarter Markets - Alternate Spreads
      { key: 'alternate_spreads_q1', title: 'Alt 1Q Spread', description: 'Alternate first quarter spreads', category: 'periods' },
      { key: 'alternate_spreads_q2', title: 'Alt 2Q Spread', description: 'Alternate second quarter spreads', category: 'periods' },
      { key: 'alternate_spreads_q3', title: 'Alt 3Q Spread', description: 'Alternate third quarter spreads', category: 'periods' },
      { key: 'alternate_spreads_q4', title: 'Alt 4Q Spread', description: 'Alternate fourth quarter spreads', category: 'periods' },
      // Quarter Markets - Alternate Totals
      { key: 'alternate_totals_q1', title: 'Alt 1Q Total', description: 'Alternate first quarter totals', category: 'periods' },
      { key: 'alternate_totals_q2', title: 'Alt 2Q Total', description: 'Alternate second quarter totals', category: 'periods' },
      { key: 'alternate_totals_q3', title: 'Alt 3Q Total', description: 'Alternate third quarter totals', category: 'periods' },
      { key: 'alternate_totals_q4', title: 'Alt 4Q Total', description: 'Alternate fourth quarter totals', category: 'periods' },
      // Quarter Markets - Team Totals
      { key: 'team_totals_q1', title: '1Q Team Total', description: 'First quarter team totals', category: 'periods' },
      { key: 'team_totals_q2', title: '2Q Team Total', description: 'Second quarter team totals', category: 'periods' },
      { key: 'team_totals_q3', title: '3Q Team Total', description: 'Third quarter team totals', category: 'periods' },
      { key: 'team_totals_q4', title: '4Q Team Total', description: 'Fourth quarter team totals', category: 'periods' },
      // Quarter Markets - Alternate Team Totals
      { key: 'alternate_team_totals_q1', title: 'Alt 1Q Team Total', description: 'Alternate first quarter team totals', category: 'periods' },
      { key: 'alternate_team_totals_q2', title: 'Alt 2Q Team Total', description: 'Alternate second quarter team totals', category: 'periods' },
      { key: 'alternate_team_totals_q3', title: 'Alt 3Q Team Total', description: 'Alternate third quarter team totals', category: 'periods' },
      { key: 'alternate_team_totals_q4', title: 'Alt 4Q Team Total', description: 'Alternate fourth quarter team totals', category: 'periods' },
      // Half Markets - Moneyline
      { key: 'h2h_h1', title: '1H Moneyline', description: 'First half winner', category: 'periods' },
      { key: 'h2h_h2', title: '2H Moneyline', description: 'Second half winner', category: 'periods' },
      // Half Markets - Spreads
      { key: 'spreads_h1', title: '1H Spread', description: 'First half spread', category: 'periods' },
      { key: 'spreads_h2', title: '2H Spread', description: 'Second half spread', category: 'periods' },
      // Half Markets - Totals
      { key: 'totals_h1', title: '1H Total', description: 'First half total', category: 'periods' },
      { key: 'totals_h2', title: '2H Total', description: 'Second half total', category: 'periods' },
      // Half Markets - Alternate Spreads
      { key: 'alternate_spreads_h1', title: 'Alt 1H Spread', description: 'Alternate first half spreads', category: 'periods' },
      { key: 'alternate_spreads_h2', title: 'Alt 2H Spread', description: 'Alternate second half spreads', category: 'periods' },
      // Half Markets - Alternate Totals
      { key: 'alternate_totals_h1', title: 'Alt 1H Total', description: 'Alternate first half totals', category: 'periods' },
      { key: 'alternate_totals_h2', title: 'Alt 2H Total', description: 'Alternate second half totals', category: 'periods' },
      // Half Markets - Team Totals
      { key: 'team_totals_h1', title: '1H Team Total', description: 'First half team totals', category: 'periods' },
      { key: 'team_totals_h2', title: '2H Team Total', description: 'Second half team totals', category: 'periods' },
      // Half Markets - Alternate Team Totals
      { key: 'alternate_team_totals_h1', title: 'Alt 1H Team Total', description: 'Alternate first half team totals', category: 'periods' },
      { key: 'alternate_team_totals_h2', title: 'Alt 2H Team Total', description: 'Alternate second half team totals', category: 'periods' }
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
      { key: 'alternate_team_totals', title: 'Alt Team Totals', description: 'All team total options', category: 'team' },
      // Quarter Markets - Moneyline
      { key: 'h2h_q1', title: '1Q Moneyline', description: 'First quarter winner', category: 'periods' },
      { key: 'h2h_q2', title: '2Q Moneyline', description: 'Second quarter winner', category: 'periods' },
      { key: 'h2h_q3', title: '3Q Moneyline', description: 'Third quarter winner', category: 'periods' },
      { key: 'h2h_q4', title: '4Q Moneyline', description: 'Fourth quarter winner', category: 'periods' },
      // Quarter Markets - Spreads
      { key: 'spreads_q1', title: '1Q Spread', description: 'First quarter spread', category: 'periods' },
      { key: 'spreads_q2', title: '2Q Spread', description: 'Second quarter spread', category: 'periods' },
      { key: 'spreads_q3', title: '3Q Spread', description: 'Third quarter spread', category: 'periods' },
      { key: 'spreads_q4', title: '4Q Spread', description: 'Fourth quarter spread', category: 'periods' },
      // Quarter Markets - Totals
      { key: 'totals_q1', title: '1Q Total', description: 'First quarter total', category: 'periods' },
      { key: 'totals_q2', title: '2Q Total', description: 'Second quarter total', category: 'periods' },
      { key: 'totals_q3', title: '3Q Total', description: 'Third quarter total', category: 'periods' },
      { key: 'totals_q4', title: '4Q Total', description: 'Fourth quarter total', category: 'periods' },
      // Quarter Markets - Alternate Spreads
      { key: 'alternate_spreads_q1', title: 'Alt 1Q Spread', description: 'Alternate first quarter spreads', category: 'periods' },
      { key: 'alternate_spreads_q2', title: 'Alt 2Q Spread', description: 'Alternate second quarter spreads', category: 'periods' },
      { key: 'alternate_spreads_q3', title: 'Alt 3Q Spread', description: 'Alternate third quarter spreads', category: 'periods' },
      { key: 'alternate_spreads_q4', title: 'Alt 4Q Spread', description: 'Alternate fourth quarter spreads', category: 'periods' },
      // Quarter Markets - Alternate Totals
      { key: 'alternate_totals_q1', title: 'Alt 1Q Total', description: 'Alternate first quarter totals', category: 'periods' },
      { key: 'alternate_totals_q2', title: 'Alt 2Q Total', description: 'Alternate second quarter totals', category: 'periods' },
      { key: 'alternate_totals_q3', title: 'Alt 3Q Total', description: 'Alternate third quarter totals', category: 'periods' },
      { key: 'alternate_totals_q4', title: 'Alt 4Q Total', description: 'Alternate fourth quarter totals', category: 'periods' },
      // Quarter Markets - Team Totals
      { key: 'team_totals_q1', title: '1Q Team Total', description: 'First quarter team totals', category: 'periods' },
      { key: 'team_totals_q2', title: '2Q Team Total', description: 'Second quarter team totals', category: 'periods' },
      { key: 'team_totals_q3', title: '3Q Team Total', description: 'Third quarter team totals', category: 'periods' },
      { key: 'team_totals_q4', title: '4Q Team Total', description: 'Fourth quarter team totals', category: 'periods' },
      // Quarter Markets - Alternate Team Totals
      { key: 'alternate_team_totals_q1', title: 'Alt 1Q Team Total', description: 'Alternate first quarter team totals', category: 'periods' },
      { key: 'alternate_team_totals_q2', title: 'Alt 2Q Team Total', description: 'Alternate second quarter team totals', category: 'periods' },
      { key: 'alternate_team_totals_q3', title: 'Alt 3Q Team Total', description: 'Alternate third quarter team totals', category: 'periods' },
      { key: 'alternate_team_totals_q4', title: 'Alt 4Q Team Total', description: 'Alternate fourth quarter team totals', category: 'periods' },
      // Half Markets - Moneyline
      { key: 'h2h_h1', title: '1H Moneyline', description: 'First half winner', category: 'periods' },
      { key: 'h2h_h2', title: '2H Moneyline', description: 'Second half winner', category: 'periods' },
      // Half Markets - Spreads
      { key: 'spreads_h1', title: '1H Spread', description: 'First half spread', category: 'periods' },
      { key: 'spreads_h2', title: '2H Spread', description: 'Second half spread', category: 'periods' },
      // Half Markets - Totals
      { key: 'totals_h1', title: '1H Total', description: 'First half total', category: 'periods' },
      { key: 'totals_h2', title: '2H Total', description: 'Second half total', category: 'periods' },
      // Half Markets - Alternate Spreads
      { key: 'alternate_spreads_h1', title: 'Alt 1H Spread', description: 'Alternate first half spreads', category: 'periods' },
      { key: 'alternate_spreads_h2', title: 'Alt 2H Spread', description: 'Alternate second half spreads', category: 'periods' },
      // Half Markets - Alternate Totals
      { key: 'alternate_totals_h1', title: 'Alt 1H Total', description: 'Alternate first half totals', category: 'periods' },
      { key: 'alternate_totals_h2', title: 'Alt 2H Total', description: 'Alternate second half totals', category: 'periods' },
      // Half Markets - Team Totals
      { key: 'team_totals_h1', title: '1H Team Total', description: 'First half team totals', category: 'periods' },
      { key: 'team_totals_h2', title: '2H Team Total', description: 'Second half team totals', category: 'periods' },
      // Half Markets - Alternate Team Totals
      { key: 'alternate_team_totals_h1', title: 'Alt 1H Team Total', description: 'Alternate first half team totals', category: 'periods' },
      { key: 'alternate_team_totals_h2', title: 'Alt 2H Team Total', description: 'Alternate second half team totals', category: 'periods' }
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
      { key: 'team_totals', title: 'Team Totals', description: 'Team-specific run totals', category: 'team' },
      // Innings Markets - Moneyline
      { key: 'h2h_1st_1_innings', title: '1st Inning ML', description: 'First inning moneyline', category: 'periods' },
      { key: 'h2h_1st_3_innings', title: '1st 3 Innings ML', description: 'First 3 innings moneyline', category: 'periods' },
      { key: 'h2h_1st_5_innings', title: '1st 5 Innings ML', description: 'First 5 innings moneyline', category: 'periods' },
      { key: 'h2h_1st_7_innings', title: '1st 7 Innings ML', description: 'First 7 innings moneyline', category: 'periods' },
      // Innings Markets - 3-Way Moneyline
      { key: 'h2h_3_way_1st_1_innings', title: '1st Inning 3-Way', description: 'First inning 3-way moneyline', category: 'periods' },
      { key: 'h2h_3_way_1st_3_innings', title: '1st 3 Innings 3-Way', description: 'First 3 innings 3-way moneyline', category: 'periods' },
      { key: 'h2h_3_way_1st_5_innings', title: '1st 5 Innings 3-Way', description: 'First 5 innings 3-way moneyline', category: 'periods' },
      { key: 'h2h_3_way_1st_7_innings', title: '1st 7 Innings 3-Way', description: 'First 7 innings 3-way moneyline', category: 'periods' },
      // Innings Markets - Spreads
      { key: 'spreads_1st_1_innings', title: '1st Inning Spread', description: 'First inning spread', category: 'periods' },
      { key: 'spreads_1st_3_innings', title: '1st 3 Innings Spread', description: 'First 3 innings spread', category: 'periods' },
      { key: 'spreads_1st_5_innings', title: '1st 5 Innings Spread', description: 'First 5 innings spread', category: 'periods' },
      { key: 'spreads_1st_7_innings', title: '1st 7 Innings Spread', description: 'First 7 innings spread', category: 'periods' },
      // Innings Markets - Alternate Spreads
      { key: 'alternate_spreads_1st_1_innings', title: 'Alt 1st Inning Spread', description: 'Alternate first inning spreads', category: 'periods' },
      { key: 'alternate_spreads_1st_3_innings', title: 'Alt 1st 3 Innings Spread', description: 'Alternate first 3 innings spreads', category: 'periods' },
      { key: 'alternate_spreads_1st_5_innings', title: 'Alt 1st 5 Innings Spread', description: 'Alternate first 5 innings spreads', category: 'periods' },
      { key: 'alternate_spreads_1st_7_innings', title: 'Alt 1st 7 Innings Spread', description: 'Alternate first 7 innings spreads', category: 'periods' },
      // Innings Markets - Totals
      { key: 'totals_1st_1_innings', title: '1st Inning Total', description: 'First inning total', category: 'periods' },
      { key: 'totals_1st_3_innings', title: '1st 3 Innings Total', description: 'First 3 innings total', category: 'periods' },
      { key: 'totals_1st_5_innings', title: '1st 5 Innings Total', description: 'First 5 innings total', category: 'periods' },
      { key: 'totals_1st_7_innings', title: '1st 7 Innings Total', description: 'First 7 innings total', category: 'periods' },
      // Innings Markets - Alternate Totals
      { key: 'alternate_totals_1st_1_innings', title: 'Alt 1st Inning Total', description: 'Alternate first inning totals', category: 'periods' },
      { key: 'alternate_totals_1st_3_innings', title: 'Alt 1st 3 Innings Total', description: 'Alternate first 3 innings totals', category: 'periods' },
      { key: 'alternate_totals_1st_5_innings', title: 'Alt 1st 5 Innings Total', description: 'Alternate first 5 innings totals', category: 'periods' },
      { key: 'alternate_totals_1st_7_innings', title: 'Alt 1st 7 Innings Total', description: 'Alternate first 7 innings totals', category: 'periods' }
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
      { key: 'team_totals', title: 'Team Totals', description: 'Team-specific goal totals', category: 'team' },
      // Period Markets - Moneyline
      { key: 'h2h_p1', title: '1P Moneyline', description: 'First period winner', category: 'periods' },
      { key: 'h2h_p2', title: '2P Moneyline', description: 'Second period winner', category: 'periods' },
      { key: 'h2h_p3', title: '3P Moneyline', description: 'Third period winner', category: 'periods' },
      // Period Markets - 3-Way Moneyline
      { key: 'h2h_3_way_p1', title: '1P 3-Way', description: 'First period 3-way result', category: 'periods' },
      { key: 'h2h_3_way_p2', title: '2P 3-Way', description: 'Second period 3-way result', category: 'periods' },
      { key: 'h2h_3_way_p3', title: '3P 3-Way', description: 'Third period 3-way result', category: 'periods' },
      // Period Markets - Spreads
      { key: 'spreads_p1', title: '1P Spread', description: 'First period spread', category: 'periods' },
      { key: 'spreads_p2', title: '2P Spread', description: 'Second period spread', category: 'periods' },
      { key: 'spreads_p3', title: '3P Spread', description: 'Third period spread', category: 'periods' },
      // Period Markets - Alternate Spreads
      { key: 'alternate_spreads_p1', title: 'Alt 1P Spread', description: 'Alternate first period spreads', category: 'periods' },
      { key: 'alternate_spreads_p2', title: 'Alt 2P Spread', description: 'Alternate second period spreads', category: 'periods' },
      { key: 'alternate_spreads_p3', title: 'Alt 3P Spread', description: 'Alternate third period spreads', category: 'periods' },
      // Period Markets - Totals
      { key: 'totals_p1', title: '1P Total', description: 'First period total', category: 'periods' },
      { key: 'totals_p2', title: '2P Total', description: 'Second period total', category: 'periods' },
      { key: 'totals_p3', title: '3P Total', description: 'Third period total', category: 'periods' },
      // Period Markets - Alternate Totals
      { key: 'alternate_totals_p1', title: 'Alt 1P Total', description: 'Alternate first period totals', category: 'periods' },
      { key: 'alternate_totals_p2', title: 'Alt 2P Total', description: 'Alternate second period totals', category: 'periods' },
      { key: 'alternate_totals_p3', title: 'Alt 3P Total', description: 'Alternate third period totals', category: 'periods' },
      // Period Markets - Team Totals
      { key: 'team_totals_p1', title: '1P Team Total', description: 'First period team totals', category: 'periods' },
      { key: 'team_totals_p2', title: '2P Team Total', description: 'Second period team totals', category: 'periods' },
      { key: 'team_totals_p3', title: '3P Team Total', description: 'Third period team totals', category: 'periods' },
      // Period Markets - Alternate Team Totals
      { key: 'alternate_team_totals_p1', title: 'Alt 1P Team Total', description: 'Alternate first period team totals', category: 'periods' },
      { key: 'alternate_team_totals_p2', title: 'Alt 2P Team Total', description: 'Alternate second period team totals', category: 'periods' },
      { key: 'alternate_team_totals_p3', title: 'Alt 3P Team Total', description: 'Alternate third period team totals', category: 'periods' }
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
      { key: 'btts', title: 'Both Teams to Score', description: 'Yes/No both teams score', category: 'special' },
      // Half Markets - 3-Way
      { key: 'h2h_3_way_h1', title: '1H 3-Way', description: 'First half 3-way result', category: 'periods' },
      { key: 'h2h_3_way_h2', title: '2H 3-Way', description: 'Second half 3-way result', category: 'periods' }
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
    const categoryOrder = ['core', 'alternates', 'team', 'periods', 'special'];
    
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
    // Include core, alternates, team, AND period markets
    return relevantMarkets
      .filter(market => !market.isHeader && (market.category === 'core' || market.category === 'alternates' || market.category === 'team' || market.category === 'periods'))
      .map(market => market.key);
  };

  // Function to get all compatible markets for the selected sports
  const getAllCompatibleMarkets = (sports) => {
    // If no sports selected, return default
    if (!sports || sports.length === 0) {
      return getAutoSelectedMarkets([]);
    }
    
    // For player props mode, use PLAYER_PROP_MARKET_KEYS to ensure we send player prop markets
    // This triggers the backend to fetch player props via betType=props detection
    if (isPlayerPropsMode) {
      // Use selected player prop markets if available, otherwise use all player prop markets
      const selectedMarkets = filters.playerPropMarkets && filters.playerPropMarkets.length > 0
        ? filters.playerPropMarkets
        : PLAYER_PROP_MARKET_KEYS;
      console.log('🏈 getAllCompatibleMarkets: Player props mode, returning markets:', selectedMarkets);
      return selectedMarkets;
    }
    
    // For regular mode with selected markets, use those
    if (filters.markets && filters.markets.length > 0) {
      return filters.markets;
    }
    
    // Fallback to auto-selected markets (includes core + period markets)
    return getAutoSelectedMarkets(sports);
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
    marketsForMode,
    { date: filters.date, autoRefresh: autoRefreshEnabled }
  );

  // Log when marketsLoading changes to debug tab refresh
  useEffect(() => {
    console.log('🔍 SportsbookMarkets: marketsLoading changed to:', marketsLoading);
    console.trace('🔍 SportsbookMarkets: marketsLoading change stack trace');
  }, [marketsLoading]);

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
    // Skip if plan data is still loading - wait for hasPlatinum to be determined
    if (meLoading) {
      console.log('⏳ Waiting for plan data to load before initializing mode...');
      return;
    }
    
    // Check for mode and query parameters in URL
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    const urlQuery = searchParams.get('q');
    
    console.log('🔍 URL Initialization - mode:', mode, 'query:', urlQuery);
    
    // Set search query from URL if present
    if (urlQuery && urlQuery !== query) {
      console.log('🔍 Setting search query from URL:', urlQuery);
      setQuery(urlQuery);
    }
    
    // Only update mode if it's different from current state to avoid unnecessary re-renders
    const currentMode = showPlayerProps ? 'props' : showArbitrage ? 'arbitrage' : showMiddles ? 'middles' : 'game';
    
    if (mode === 'arbitrage' && currentMode !== 'arbitrage') {
      console.log('🔍 Initializing arbitrage mode from URL parameter');
      setShowPlayerProps(false);
      setShowArbitrage(true);
      setShowMiddles(false);
      // Note: Non-platinum users will see the upgrade message instead of being redirected
    } else if (mode === 'props' && currentMode !== 'props') {
      console.log('🎯 Initializing player props mode from URL parameter');
      setShowPlayerProps(true);
      setShowArbitrage(false);
      setShowMiddles(false);
    } else if (mode === 'middles' && currentMode !== 'middles') {
      console.log('🎪 Initializing middles mode from URL parameter');
      setShowPlayerProps(false);
      setShowArbitrage(false);
      setShowMiddles(true);
      // Note: Non-platinum users will see the upgrade message instead of being redirected
    } else if (!mode && currentMode !== 'game') {
      console.log('🎮 Initializing game mode (no mode parameter)');
      setShowPlayerProps(false);
      setShowArbitrage(false);
      setShowMiddles(false);
    }
  }, [location.search, meLoading]); // Only depend on URL and loading state, not mode states

  // Listen for changes to user's sportsbook selections
  useEffect(() => {
    const handleStorageChange = () => {
      const newSelectedBooks = getUserSelectedSportsbooks();
      updateFilter("sportsbooks", newSelectedBooks);
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
      updateFilter("sports", ["americanfootball_nfl"]);
      updateFilter("date", '');
      updateFilter("sportsbooks", []);
      updateFilter("playerPropSportsbooks", []);
      updateFilter("markets", ["h2h", "spreads", "totals"]);
      updateFilter("playerPropMarkets", ["player_pass_yds", "player_rush_yds", "player_receptions"]);
      updateFilter("minEV", "");
      
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
  // IMPORTANT: Always update to include period markets, even if user has old localStorage data
  useEffect(() => {
    const initialMarkets = getAutoSelectedMarkets(filters.sports);
    console.log('🎯 Mount effect - initialMarkets:', initialMarkets.length, 'current filters.markets:', (filters.markets || []).length);
    console.log('🎯 Period markets in initialMarkets:', initialMarkets.filter(m => 
      m.includes('_q') || m.includes('_h1') || m.includes('_h2') || m.includes('_p1') || m.includes('_p2') || m.includes('_p3') || m.includes('_1st')
    ).length);
    
    // ALWAYS update markets on mount to ensure period markets are included
    // This fixes the issue where old localStorage data doesn't have period markets
    if (initialMarkets.length > 0) {
      updateFilter("markets", initialMarkets);
      console.log('🎯 Updated markets to include all markets:', initialMarkets.length);
    }
  }, []); // Run only once on mount

  // Migration function to fix old invalid market names
  const migrateInvalidMarkets = (markets) => {
    const marketMigrations = {
      'player_receiving_yds': 'player_reception_yds',
      'player_receiving_tds': 'player_reception_tds', 
      'player_receiving_longest': 'player_reception_longest',
      'player_2_plus_tds': null, // Remove this market as it's not supported
      'pick6': 'draftkings_pick6' // Migrate old generic key to proper DraftKings Pick6 key
    };
    
    return markets
      .map(market => marketMigrations[market] || market)
      .filter(market => market !== null);
  };

  // Auto-update player prop markets when sport changes (only if current selection is inappropriate)
  useEffect(() => {
    if (isPlayerPropsMode && filters.sports && filters.sports.length > 0) {
      const sportBasedMarkets = getPlayerPropMarketsBySport(filters.sports);
      const availableMarketKeys = sportBasedMarkets
        .filter(market => !market.isHeader)
        .map(market => market.key);
      
      // First, migrate any old invalid market names in current selection
      const migratedMarkets = migrateInvalidMarkets(filters.playerPropMarkets);
      
      // Check if current selection contains markets that don't exist for the current sport
      const hasInvalidMarkets = migratedMarkets.some(market => 
        !availableMarketKeys.includes(market)
      );
      
      // If we migrated markets or have invalid markets, update the selection
      if (migratedMarkets.length !== filters.playerPropMarkets.length || 
          JSON.stringify(migratedMarkets) !== JSON.stringify(filters.playerPropMarkets) ||
          hasInvalidMarkets) {
        
        let marketsToUse = migratedMarkets;
        
        // If still have invalid markets or empty selection, use ALL available markets
        if (marketsToUse.length === 0 || hasInvalidMarkets) {
          marketsToUse = availableMarketKeys; // Select ALL available markets instead of just first 3
        }
        
        if (marketsToUse.length > 0) {
          console.log('🎯 Migrating/updating player prop markets:', {
            sports: filters.sports,
            oldMarkets: filters.playerPropMarkets,
            migratedMarkets: migratedMarkets,
            finalMarkets: marketsToUse,
            reason: migratedMarkets.length !== filters.playerPropMarkets.length ? 'migration' : 
                   hasInvalidMarkets ? 'invalid markets' : 'empty selection'
          });
          
          updateFilter("playerPropMarkets", marketsToUse);
        }
      }
    }
  }, [filters.sports, isPlayerPropsMode, filters.playerPropMarkets]); // Run when sport, mode, or markets change


  // Removed auto-selection logic - users should be able to select individual player prop markets


  // Update bookList when marketBooks changes
  useEffect(() => {
    if (marketBooks && marketBooks.length > 0) {
      setBookList(marketBooks);
    }
  }, [marketBooks]);

  const filteredGames = useMemo(() => {
    if (!Array.isArray(marketGames)) return [];
    
    const now = new Date();
    
    // First, filter by sport (selected sports)
    // IMPORTANT: If 'all' is selected, don't filter by sport - show all games
    let sportFilteredGames = marketGames;
    if (filters.sports && filters.sports.length > 0 && !filters.sports.includes('all')) {
      sportFilteredGames = marketGames.filter(game => filters.sports.includes(game.sport_key));
    }
    // If 'all' is selected, show all games (no sport filtering)
    
    // ALWAYS filter out games that have already started (past/completed games)
    // This prevents stale cached data from showing old games
    // NO EXCEPTIONS - if the game has started, it should not appear in regular views
    const activeGames = sportFilteredGames.filter(game => {
      if (!game.commence_time) return false; // Skip games without time info (can't verify if past)
      const gameTime = new Date(game.commence_time);
      const hasStarted = gameTime <= now;
      if (hasStarted) {
      }
      return !hasStarted;
    });
    
    
    // If no date filter is selected, return active games (past games already filtered)
    if (!filters.date || filters.date === "") {
      return activeGames;
    }
    
    // Filter for live games only (started within last 4 hours - still in progress)
    if (filters.date === "live") {
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const liveGames = sportFilteredGames.filter(game => {
        if (!game.commence_time) return false;
        const gameTime = new Date(game.commence_time);
        // Live = started but not more than 4 hours ago (game likely still in progress)
        const isLive = gameTime <= now && gameTime > fourHoursAgo;
        return isLive;
      });
      return liveGames;
    }
    
    // Filter for specific date (Today or future dates)
    // For "Today" and future dates, only show games that HAVEN'T started yet
    const selectedDateObj = new Date(filters.date + 'T00:00:00');
    const nextDay = new Date(selectedDateObj);
    nextDay.setDate(selectedDateObj.getDate() + 1);
    
    const dateFilteredGames = activeGames.filter(game => {
      if (!game.commence_time) return false;
      
      const gameTime = new Date(game.commence_time);
      const isOnSelectedDate = gameTime >= selectedDateObj && gameTime < nextDay;
      const hasNotStarted = gameTime > now; // Only show games that haven't started
      
      return isOnSelectedDate && hasNotStarted;
    });
    
    return dateFilteredGames;
  }, [marketGames, filters.date, filters.sports]);

  // Arbitrage games filter - includes LIVE games for arbitrage detection
  // Arbitrage opportunities only exist when games are actively being traded
  const arbitrageGames = useMemo(() => {
    if (!Array.isArray(marketGames)) return [];
    
    // For arbitrage, we want ALL games (upcoming + live)
    // Arbitrage opportunities exist across all active markets
    return marketGames;
  }, [marketGames]);

  // Clear filters loading when data is ready
  useEffect(() => {
    if (!marketsLoading && filteredGames.length > 0) {
      setFiltersLoading(false);
    }
  }, [marketsLoading, filteredGames.length]);

  // Single consolidated effect for auto-selecting markets when sports change
  // This replaces multiple competing effects that were causing conflicts
  const prevSportsRef = React.useRef(filters.sports);
  
  useEffect(() => {
    // Only run when sports actually change (not on every render)
    const sportsChanged = JSON.stringify(prevSportsRef.current) !== JSON.stringify(filters.sports);
    if (!sportsChanged) return;
    
    prevSportsRef.current = filters.sports;
    
    if (!filters.sports || filters.sports.length === 0) return;
    
    // Auto-select markets based on selected sports
    const autoSelectedMarkets = getAutoSelectedMarkets(filters.sports);
    if (autoSelectedMarkets.length > 0) {
      updateFilter("markets", autoSelectedMarkets);
    }
  }, [filters.sports]);

  // Auto-update player prop markets when sport changes (only in player props mode)
  useEffect(() => {
    if (!showPlayerProps || !filters.sports || filters.sports.length === 0) return;
    
    const sportBasedMarkets = getPlayerPropMarketsBySport(filters.sports);
    const availableMarketKeys = sportBasedMarkets
      .filter(market => !market.isHeader)
      .map(market => market.key);
    
    // Check if current selection has invalid markets for the selected sport
    const currentMarkets = filters.playerPropMarkets || [];
    const hasInvalidMarkets = currentMarkets.some(market => 
      !availableMarketKeys.includes(market)
    );
    
    // Update only if we have invalid markets
    if (hasInvalidMarkets && availableMarketKeys.length > 0) {
      const newMarkets = availableMarketKeys.slice(0, 3);
      updateFilter("playerPropMarkets", newMarkets);
    }
  }, [filters.sports, showPlayerProps]);

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
        // Cache prefetching handled by useMarkets hook
      };

      // Debounce prefetching to avoid excessive requests
      const timeoutId = setTimeout(prefetchPlayerProps, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isPlayerPropsMode, filters.sports, filters.date, filteredGames.length]);

  // Removed redundant loading effect to prevent flashing

  const effectiveSelectedBooks = useMemo(() => {
    // Use mode-specific sportsbook selection
    const currentSelectedBooks = isPlayerPropsMode ? filters.playerPropSportsbooks : filters.sportsbooks;
    
    // If no books are explicitly selected, return an EMPTY ARRAY to signal "show all books"
    // This is better than returning all marketBooks keys because:
    // 1. It's more efficient (no filtering needed)
    // 2. It will include ALL books, even ones not in the current data
    // 3. It's consistent with how the OddsTable component expects "show all" to work
    let result = (currentSelectedBooks && currentSelectedBooks.length) 
      ? currentSelectedBooks 
      : [];
    
    // Removed auto-include logic - users should be able to select individual DFS apps
    
    return result;
  }, [filters.sportsbooks, filters.playerPropSportsbooks, marketBooks, isPlayerPropsMode]);

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
          setSportList(sports.length > 0 ? sports : AVAILABLE_SPORTS);
        } else {
          setSportList(AVAILABLE_SPORTS);
        }
      } catch (error) {
        setSportList(AVAILABLE_SPORTS);
      }
    };
    fetchSports();
  }, []);

  // No sync needed - FilterContext handles all filter state automatically
  // When modal opens, filters are already available via context

  const handleApplyFilters = () => {
    setFiltersLoading(true);
    contextApplyFilters();
    setMobileFiltersOpen(false);
    setTableNonce(prev => prev + 1);

    // Trigger data refresh after filters are applied
    setTimeout(() => {
      if (refreshMarkets) {
        refreshMarkets();
      }
      setFiltersLoading(false);
    }, 100);
  };

  const resetDraftFilters = () => {
    const defaultSports = ["americanfootball_nfl"];
    updateFilter("sports", defaultSports);
    updateFilter("date", '');
    updateFilter("sportsbooks", getUserSelectedSportsbooks('game')); // Reset to user's saved sportsbooks for game mode
    updateFilter("playerPropSportsbooks", getUserSelectedSportsbooks('props')); // Reset to user's saved sportsbooks for props mode
    updateFilter("markets", getAutoSelectedMarkets(defaultSports)); // Auto-select markets for default sport
    updateFilter("playerPropMarkets", ["player_pass_yds", "player_rush_yds", "player_receptions"]);
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
    // For player props, reset to empty array to show ALL available sportsbooks
    const defaultPlayerPropsSportsbooks = [];
    
    // Reset draft state
    updateFilter("sports", defaultSports);
    updateFilter("date", '');
    updateFilter("sportsbooks", defaultSportsbooks);
    updateFilter("playerPropSportsbooks", defaultPlayerPropsSportsbooks);
    updateFilter("markets", defaultMarkets);
    updateFilter("playerPropMarkets", defaultPlayerProps);
    updateFilter("filters.dataPoints", 10);
    
    // Reset applied state
    updateFilter("sports", defaultSports);
    updateFilter("date", '');
    updateFilter("sportsbooks", defaultSportsbooks);
    updateFilter("playerPropSportsbooks", defaultPlayerPropsSportsbooks);
    updateFilter("markets", defaultMarkets);
    updateFilter("playerPropMarkets", defaultPlayerProps);
    updateFilter("filters.dataPoints", 10);
  };

  // Function to get available markets for the markets filter dropdown
  const getAvailableMarkets = (selectedSports) => {
    return getRelevantMarkets(selectedSports);
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
    // Basketball categories
    basketball: {
      title: "Basketball",
      icon: Trophy,
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

    console.log('🎯 getPlayerPropMarketsBySport called with sports:', selectedSports);

    // Determine which categories to include based on selected sports
    selectedSports.forEach(sport => {
      console.log(`📊 Processing sport: ${sport}`);
      
      // Handle basketball sports FIRST (both NBA and NCAA) - MUST come before football check
      if (sport === 'basketball_nba' || sport === 'basketball_ncaab' || sport.includes('basketball')) {
        sportCategories.set('basketball', ['basketball']);
        console.log(`🏀 Adding basketball player prop categories for sport: ${sport}`);
      }
      // Handle football sports (both NFL and NCAA)
      else if (sport === 'americanfootball_nfl' || sport === 'americanfootball_ncaaf' || sport.includes('football')) {
        sportCategories.set('football', ['passing', 'rushing', 'receiving', 'touchdowns', 'combination', 'defense', 'kicking']);
        console.log(`🏈 Adding football player prop categories for sport: ${sport}`);
      } 
      // Handle hockey sports
      else if (sport === 'icehockey_nhl' || sport.includes('hockey')) {
        sportCategories.set('hockey', ['hockey']);
        console.log(`🏒 Adding hockey player prop categories for sport: ${sport}`);
      } 
      // Handle soccer sports
      else if (sport.includes('soccer')) {
        sportCategories.set('soccer', ['soccerPlayers']);
        console.log(`⚽ Adding soccer player prop categories for sport: ${sport}`);
      }
    });

    console.log('📋 Sport categories determined:', Array.from(sportCategories.keys()));

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

  // Player props bookmaker whitelist - only books that actually return player props from TheOddsAPI
  const PLAYER_PROPS_SUPPORTED_BOOKS = [
    // Major US Sportsbooks
    'draftkings', 'fanduel', 'betmgm', 'caesars', 'pointsbetus', 'betrivers',
    'unibet_us', 'wynnbet', 'espnbet', 'fanatics', 'hardrock',
    // DFS Apps (primary player props providers)
    'prizepicks', 'underdog', 'draftkings_pick6', 'dabble_au', 'betr',
    // Other books with player props support
    'bovada', 'betonline', 'mybookieag',
    // Sharp/Specialty books
    'novig', 'fliff', 'pinnacle',
    // Exchanges
    'prophetx', 'rebet', 'betopenly',
    // Regional/Other
    'circasports'
  ];

  // Memoized enhanced sportsbook list to prevent unnecessary recalculations
  const enhancedSportsbookList = useMemo(() => {
    // Start with API books if available
    let booksToUse = marketBooks && marketBooks.length > 0 
      ? marketBooks 
      : AVAILABLE_SPORTSBOOKS.filter(s => !s.isHeader).map(s => ({ key: s.key, title: s.name }));
    
    // For Platinum users, also add any missing books from AVAILABLE_SPORTSBOOKS
    if (hasPlatinum) {
      const apiBookKeys = new Set((booksToUse || []).map(book => book.key));
      const allConfiguredBooks = AVAILABLE_SPORTSBOOKS.filter(s => !s.isHeader);
      const missingConfiguredBooks = allConfiguredBooks.filter(book => !apiBookKeys.has(book.key));
      
      // Add missing configured books
      if (missingConfiguredBooks.length > 0) {
        booksToUse = [
          ...(booksToUse || []),
          ...missingConfiguredBooks.map(s => ({ key: s.key, title: s.name }))
        ];
      }
    }
    
    const marketBookKeys = new Set((booksToUse || []).map(book => book.key));
    
    // Get all available DFS apps
    const dfsApps = getDFSApps();
    const missingDFSApps = dfsApps.filter(dfs => !marketBookKeys.has(dfs.key));
    
    // For Player Props mode, filter to only supported books
    let enhancedBooks;
    if (showPlayerProps) {
      // Filter to only books that actually support player props
      const supportedBooksToUse = (booksToUse || []).filter(book => 
        PLAYER_PROPS_SUPPORTED_BOOKS.includes(book.key)
      );
      const supportedDFSApps = missingDFSApps.filter(dfs => 
        PLAYER_PROPS_SUPPORTED_BOOKS.includes(dfs.key)
      );
      
      enhancedBooks = [
        ...supportedBooksToUse,
        ...supportedDFSApps.map(dfs => ({ key: dfs.key, title: dfs.name }))
      ];
      
      console.log('🎯 Player Props Sportsbooks (filtered for API support):', {
        totalSupported: enhancedBooks.length,
        excluded: (booksToUse || []).filter(b => !PLAYER_PROPS_SUPPORTED_BOOKS.includes(b.key)).map(b => b.key),
        supported: enhancedBooks.map(b => b.key)
      });
    } else {
      // For Straight Bets, Arbitrage, Middles, and Exchanges modes - EXCLUDE DFS apps
      // DFS apps only offer player props, not traditional moneyline/spread/totals
      // Note: Fliff is NOT a DFS app - it's a social sportsbook with real odds for all bet types
      const dfsAppKeys = [
        'prizepicks', 'underdog', 'draftkings_pick6', 
        'dabble', 'dabble_au', 'sleeper', 'betr',
        'chalkboard', 'parlay', 'hotstreak'
      ];
      enhancedBooks = (booksToUse || []).filter(book => 
        !dfsAppKeys.includes(book.key?.toLowerCase())
      );
    }
    
    // Hide Betr and DraftKings Pick6 unless they have actual data from the API
    // These books rarely return data, so only show them when they do
    const booksToHideUnlessHaveData = ['betr', 'draftkings_pick6'];
    const apiBookKeys = new Set((marketBooks || []).map(book => book.key?.toLowerCase()));
    
    enhancedBooks = enhancedBooks.filter(book => {
      const bookKeyLower = book.key?.toLowerCase();
      // If this book is in the "hide unless has data" list, only show if API returned it
      if (booksToHideUnlessHaveData.includes(bookKeyLower)) {
        return apiBookKeys.has(bookKeyLower);
      }
      return true;
    });
    
    return enhancedBooks;
  }, [marketBooks, hasPlatinum, showPlayerProps]);

  // Helper function to get current section ID
  const getCurrentSectionId = () => {
    if (showPlayerProps) return 'props';
    if (showArbitrage) return 'arbitrage';
    if (showMiddles) return 'middles';
    return 'game';
  };

  // Handle section change from SectionMenu
  const handleSectionChange = (sectionId) => {
    console.log(`🔄 Changing section to: ${sectionId}`, { hasPlatinum, userPlan: me?.plan, meLoading, userId: user?.id });
    
    // Check if user is authenticated
    if (!user) {
      console.warn(`⚠️ User not authenticated, redirecting to login`);
      navigate('/login');
      return;
    }
    
    // Check if user has access to premium features (arbitrage/middles require platinum)
    if ((sectionId === 'arbitrage' || sectionId === 'middles') && !hasPlatinum) {
      console.warn(`⚠️ User tried to access ${sectionId} but doesn't have platinum plan. Plan: ${me?.plan}`);
      // Show alert to user
      alert(`${sectionId === 'arbitrage' ? 'Arbitrage' : 'Middles'} detection requires a Platinum plan. Please upgrade to access this feature.`);
      return; // Don't change section if user doesn't have access
    }
    
    // Update URL to persist mode selection FIRST
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
    
    // Build the new URL
    const newUrl = searchParams.toString() ? `${location.pathname}?${searchParams.toString()}` : location.pathname;
    console.log(`🔄 Updating URL to: ${newUrl}`);
    
    // Use window.history.replaceState directly to avoid navigation issues
    window.history.replaceState(null, '', newUrl);
    
    // Update all mode states based on the selected section
    setShowPlayerProps(sectionId === 'props');
    setShowArbitrage(sectionId === 'arbitrage');
    setShowMiddles(sectionId === 'middles');
    
    // Force a re-render by updating the table nonce
    setTableNonce(prev => prev + 1);
    
    // Scroll to top to show the section header
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className="sportsbook-markets">
      <SEOHelmet
        title={PAGE_TITLES.sportsbooks}
        description={PAGE_DESCRIPTIONS.sportsbooks}
        path="/sportsbooks"
        schema={generateSchemaMarkup('WebApplication')}
      />
      {/* Design11 Header - Mobile & Desktop */}
      <Header 
        onLoginClick={() => navigate('/login')}
        onSignUpClick={() => navigate('/signup')}
        onDashboardClick={() => navigate('/dashboard')}
        onRoadmapClick={() => navigate('/roadmap')}
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
        {/* Centered Section Header */}
        <div style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '24px', paddingTop: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          {getCurrentSectionId() === 'game' && (
            <>
              <BarChart4 size={32} color="#a78bfa" style={{ flexShrink: 0 }} />
              Straight Bets
            </>
          )}
          {getCurrentSectionId() === 'props' && (
            <>
              <Target size={32} color="#a78bfa" style={{ flexShrink: 0 }} />
              Player Props
            </>
          )}
          {getCurrentSectionId() === 'arbitrage' && (
            <>
              <Zap size={32} color="#a78bfa" style={{ flexShrink: 0 }} />
              Arbitrage
            </>
          )}
          {getCurrentSectionId() === 'middles' && (
            <>
              <Activity size={32} color="#a78bfa" style={{ flexShrink: 0 }} />
              Middles
            </>
          )}
        </div>

        {/* Inner container for filter and odds table */}
        <div className="desktop-markets-inner">
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
                className={`desktop-section-btn ${getCurrentSectionId() === 'arbitrage' ? 'active' : ''} ${!hasPlatinum ? 'disabled' : ''}`}
                onClick={() => handleSectionChange('arbitrage')}
                disabled={!hasPlatinum}
                title={!hasPlatinum ? 'Requires Platinum Plan' : ''}
              >
                <Zap size={18} />
                Arbitrage
              </button>
              <button 
                className={`desktop-section-btn ${getCurrentSectionId() === 'middles' ? 'active' : ''} ${!hasPlatinum ? 'disabled' : ''}`}
                onClick={() => handleSectionChange('middles')}
                disabled={!hasPlatinum}
                title={!hasPlatinum ? 'Requires Platinum Plan' : ''}
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
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: hasPlatinum ? 'pointer' : 'not-allowed', padding: '8px 0', opacity: hasPlatinum ? 1 : 0.5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <RefreshCw size={16} style={{ opacity: autoRefreshEnabled ? 1 : 0.5 }} />
                  Auto-Refresh (30s) {!hasPlatinum && <span style={{ fontSize: '12px', color: '#ef4444' }}>(Platinum Only)</span>}
                </span>
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={toggleAutoRefresh}
                  disabled={!hasPlatinum}
                  style={{
                    width: '40px',
                    height: '20px',
                    cursor: hasPlatinum ? 'pointer' : 'not-allowed',
                    accentColor: 'var(--accent)',
                    opacity: hasPlatinum ? 1 : 0.5
                  }}
                />
              </label>
            </div>

            {/* Search Filter */}
            <div className="desktop-filter-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <form onSubmit={(e) => { e.preventDefault(); const params = new URLSearchParams(location.search); if (query) params.set('q', query); else params.delete('q'); navigate(`/sportsbooks?${params.toString()}`); }} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', padding: '10px 12px' }}>
                  <Search size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search sports..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      padding: '0'
                    }}
                  />
                </div>
              </form>
            </div>

            {/* Player Props Filters */}
            {showPlayerProps && (
              <>
                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>📊</span> Data Points
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="range" 
                      min="3" 
                      max="10" 
                      value={filters.dataPoints}
                      onChange={(e) => updateFilter("dataPoints", parseInt(e.target.value, 10))}
                      style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(139, 92, 246, 0.3)', outline: 'none', cursor: 'pointer', accentColor: 'var(--accent)', WebkitAppearance: 'none', appearance: 'none', padding: '0' }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700, minWidth: '30px', textAlign: 'center' }}>{filters.dataPoints}</span>
                  </div>
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>📅</span> Date
                  </div>
                  <DatePicker
                    value={filters.date}
                    onChange={(value) => updateFilter('date', value)}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏈</span> Sports (Select One)
                  </div>
                  <SportMultiSelect
                    list={sportList || []}
                    selected={filters.sports || []}
                    onChange={(selected) => {
                      // Player props: only allow one sport at a time
                      if (selected.length > 1) {
                        // Keep only the last selected sport
                        updateFilter("sports", [selected[selected.length - 1]]);
                      } else {
                        updateFilter("sports", selected);
                      }
                    }}
                    placeholderText="Select one sport..."
                    allLabel="All Sports"
                    enableCategories={true}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🎯</span> Player Prop Markets
                  </div>
                  <SportMultiSelect
                    list={getPlayerPropMarketsBySport(filters.sports)}
                    selected={filters.playerPropMarkets || []}
                    onChange={(value) => updateFilter('playerPropMarkets', value)}
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
                    selected={filters.playerPropSportsbooks || []}
                    onChange={(value) => updateFilter('playerPropSportsbooks', value)}
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
                    value={filters.minProfit}
                    onChange={(e) => updateFilter("minProfit", Number(e.target.value))}
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
                    value={filters.maxStake}
                    onChange={(e) => updateFilter("maxStake", Number(e.target.value))}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏪</span> Sportsbooks
                  </div>
                  <SportMultiSelect
                    list={enhancedSportsbookList}
                    selected={filters.sportsbooks || []}
                    onChange={(value) => updateFilter('sportsbooks', value)}
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
            {!showPlayerProps && !showArbitrage && !showMiddles && (
              <>


                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>📅</span> Date
                  </div>
                  <DatePicker
                    value={filters.date}
                    onChange={(value) => updateFilter('date', value)}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏈</span> Sports
                  </div>
                  <SportMultiSelect
                    list={sportList || []}
                    selected={filters.sports || []}
                    onChange={(value) => updateFilter('sports', value)}
                    placeholderText="Select sports..."
                    allLabel="All Sports"
                    enableCategories={true}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>📊</span> Markets
                  </div>
                  <SportMultiSelect
                    list={getAvailableMarkets(filters.sports)}
                    selected={filters.markets || []}
                    onChange={(newMarkets) => {
                      updateFilter("markets", newMarkets);
                    }}
                    placeholderText="Select markets..."
                    allLabel="All Markets"
                    enableCategories={true}
                  />
                </div>

                <div className="desktop-filter-section">
                  <div className="desktop-filter-label">
                    <span>🏪</span> Sportsbooks
                  </div>
                  <SportMultiSelect
                    list={enhancedSportsbookList}
                    selected={filters.sportsbooks || []}
                    onChange={(newSelection) => {
                      console.log('🏪 Straight Bets Sportsbook selection changed:', {
                        newSelection,
                        previousSelection: filters.sportsbooks,
                        listAvailable: enhancedSportsbookList?.length,
                        listKeys: enhancedSportsbookList?.map(b => b.key)
                      });
                      updateFilter("sportsbooks", newSelection);
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
              <button className="desktop-filter-btn desktop-filter-btn-apply" onClick={handleApplyFilters}>
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
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'absolute', right: '40px', marginTop: '24px' }}>
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
        isPlayerPropsMode,
        isMiddlesMode,
        hasPlatinum,
        isOverQuota,
        hasGoldOrBetter,
        meLoading,
        filteredGamesLength: filteredGames?.length || 0,
        showPlayerProps,
        showArbitrage,
        showMiddles
      })}
      
      {/* Show loading state while plan data is loading */}
      {meLoading && (isArbitrageMode || isMiddlesMode) ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div className="loading-spinner" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your plan information...</p>
        </div>
      ) : (marketsError && !marketsError.includes('Authentication required')) ? (
        <ApiErrorDisplay 
          error={marketsError} 
          onRetry={() => window.location.reload()} 
        />
      ) : (marketsError && marketsError.includes('Authentication required')) ? null : isArbitrageMode && hasPlatinum ? (
        <ArbitrageDetector 
          sport={filters.sports.length > 0 ? filters.sports : ['americanfootball_nfl', 'americanfootball_ncaaf', 'basketball_nba', 'basketball_ncaab', 'icehockey_nhl']}
          games={filteredGames}
          bookFilter={effectiveSelectedBooks}
          compact={false}
          minProfit={filters.minProfit}
          maxStake={filters.maxStake}
          selectedMarkets={filters.markets}
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
          sport={['americanfootball_nfl', 'americanfootball_ncaaf', 'basketball_nba', 'basketball_ncaab', 'icehockey_nhl']}
          games={[]}
          bookFilter={effectiveSelectedBooks}
          compact={false}
          autoRefresh={autoRefreshEnabled}
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
        !hasGoldOrBetter ? (
          // Paywall for free users
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '48px 32px',
            margin: '20px 0',
            textAlign: 'center',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Target size={40} color="white" />
            </div>
            <h2 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700' }}>
              Unlock Player Props
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 24px 0', fontSize: '16px', lineHeight: '1.6' }}>
              Get access to player props odds from 40+ sportsbooks, find the best lines, and maximize your edge with our premium features.
            </p>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              marginBottom: '24px',
              textAlign: 'left',
              maxWidth: '300px',
              margin: '0 auto 24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                <Check size={20} color="#22c55e" />
                <span>Compare odds across all books</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                <Check size={20} color="#22c55e" />
                <span>Find +EV player props</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                <Check size={20} color="#22c55e" />
                <span>Line shopping made easy</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Upgrade Now
            </button>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', margin: '16px 0 0 0', fontSize: '14px' }}>
              Starting at $15/month
            </p>
          </div>
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
              key={`props-${tableNonce}`}
              games={filteredGames}
              pageSize={15}
              mode="props"
              bookFilter={effectiveSelectedBooks}
              marketFilter={filters.playerPropMarkets} // Use selected player prop markets
              evMin={null}
              loading={filtersLoading || playerPropsProcessing || marketsLoading}
              error={error || marketsError}
              oddsFormat={oddsFormat}
              allCaps={false}
              onAddBet={addBet}
              betSlipCount={bets.length}
              onOpenBetSlip={openBetSlip}
              searchQuery={debouncedQuery}
              dataPoints={filters.dataPoints}
            />
          </div>
        ) : null
      ) : !isOverQuota ? (
        // Straight Bets mode - available to ALL users (free, gold, platinum)
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
            marketFilter={(filters.markets || []).filter(m => !m.startsWith('player_') && !m.startsWith('batter_') && !m.startsWith('pitcher_'))} // Filter out player props for Straight Bets
            evMin={filters.minEV === "" ? null : Number(filters.minEV)}
            loading={filtersLoading || marketsLoading}
            error={error || marketsError}
            oddsFormat={oddsFormat}
            allCaps={false}
            onAddBet={addBet}
            betSlipCount={bets.length}
            onOpenBetSlip={openBetSlip}
            dataPoints={filters.dataPoints}
          />
        </div>
      ) : null}
      </div>
        </div>
      </div>

      {/* Mobile filter button - positioned on the left */}
      <FilterMenu onClick={() => setMobileFiltersOpen(true)} isOpen={mobileFiltersOpen} />
      
      {/* Section menu button - positioned on the right */}
      <SectionMenu 
        currentSection={getCurrentSectionId()} 
        onSectionChange={handleSectionChange} 
        hasPlatinum={hasPlatinum} 
      />
      
      <MobileFiltersSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title={isPlayerPropsMode ? "NFL Player Props" : "Filters"}>
        <div className="filter-stack" style={{ maxWidth: 680, margin: "0 auto" }}>
          {/* Player Props Mode Filters */}
          {showPlayerProps ? (
            <>
              {/* Auto-Refresh Toggle */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
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

              {/* Date Filter for Player Props */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  📅 Date
                </label>
                <DatePicker
                  value={filters.date}
                  onChange={(value) => updateFilter('date', value)}
                />
              </div>

              {/* Sports Selection for Player Props */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🏈 Sports
                </label>
                <SportMultiSelect
                  list={sportList || []}
                  selected={filters.sports || []}
                  onChange={(value) => updateFilter('sports', value)}
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
                  list={getPlayerPropMarketsBySport(filters.sports)}
                  selected={filters.playerPropMarkets || []}
                  onChange={(value) => updateFilter('playerPropMarkets', value)}
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
                  selected={filters.playerPropSportsbooks || []}
                  onChange={(value) => updateFilter('playerPropSportsbooks', value)}
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
              {/* Auto-Refresh Toggle */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                  value={filters.minProfit}
                  onChange={(e) => updateFilter("minProfit", Number(e.target.value))}
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
                  value={filters.maxStake}
                  onChange={(e) => updateFilter("maxStake", Number(e.target.value))}
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
                  selected={filters.sportsbooks || []}
                  onChange={(value) => updateFilter('sportsbooks', value)}
                  placeholderText="Select sportsbooks..."
                  allLabel="All Sportsbooks"
                  isSportsbook={true}
                  enableCategories={true}
                  showDFSApps={false}
                />
              </div>
            </>
          ) : showMiddles ? (
            <>
              {/* Auto-Refresh Toggle */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: hasPlatinum ? 'pointer' : 'not-allowed', padding: '8px 0', opacity: hasPlatinum ? 1 : 0.5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <RefreshCw size={16} style={{ opacity: autoRefreshEnabled ? 1 : 0.5 }} />
                    Auto-Refresh (30s) {!hasPlatinum && <span style={{ fontSize: '12px', color: '#ef4444' }}>(Platinum Only)</span>}
                  </span>
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={toggleAutoRefresh}
                    disabled={!hasPlatinum}
                    style={{
                      width: '40px',
                      height: '20px',
                      cursor: hasPlatinum ? 'pointer' : 'not-allowed',
                      accentColor: 'var(--accent)',
                      opacity: hasPlatinum ? 1 : 0.5
                    }}
                  />
                </label>
              </div>

              {/* Middles-specific filters */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  📏 Minimum Gap (Points)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={filters.minMiddleGap || 3}
                  onChange={(e) => updateFilter("minMiddleGap", Number(e.target.value))}
                  className="form-control"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  📊 Min Probability %
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="1"
                  value={filters.minMiddleProbability || 15}
                  onChange={(e) => updateFilter("minMiddleProbability", Number(e.target.value))}
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
                  value={filters.maxMiddleStake || 1000}
                  onChange={(e) => updateFilter("maxMiddleStake", Number(e.target.value))}
                  className="form-control"
                />
              </div>

              {/* Sportsbooks Filter for Middles */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🏪 Sportsbooks
                </label>
                <SportMultiSelect
                  list={enhancedSportsbookList}
                  selected={filters.sportsbooks || []}
                  onChange={(value) => updateFilter('sportsbooks', value)}
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
              {/* Auto-Refresh Toggle */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: hasPlatinum ? 'pointer' : 'not-allowed', padding: '8px 0', opacity: hasPlatinum ? 1 : 0.5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <RefreshCw size={16} style={{ opacity: autoRefreshEnabled ? 1 : 0.5 }} />
                    Auto-Refresh (30s) {!hasPlatinum && <span style={{ fontSize: '12px', color: '#ef4444' }}>(Platinum Only)</span>}
                  </span>
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={toggleAutoRefresh}
                    disabled={!hasPlatinum}
                    style={{
                      width: '40px',
                      height: '20px',
                      cursor: hasPlatinum ? 'pointer' : 'not-allowed',
                      accentColor: 'var(--accent)',
                      opacity: hasPlatinum ? 1 : 0.5
                    }}
                  />
                </label>
              </div>

              {/* Straight Bets Filters */}
              {/* Data Points Slider */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  <span>📊 Data Points</span>
                  <span style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>{filters.dataPoints || 10}</span>
                </label>
                <input 
                  type="range" 
                  min="3" 
                  max="10" 
                  value={filters.dataPoints || 10}
                  onChange={(e) => updateFilter('dataPoints', parseInt(e.target.value, 10))}
                  style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(139, 92, 246, 0.3)', outline: 'none', cursor: 'pointer', accentColor: 'var(--accent)', WebkitAppearance: 'none', appearance: 'none', padding: '0' }}
                />
              </div>

              {/* Date Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  📅 Date
                </label>
                <DatePicker
                  value={filters.date}
                  onChange={(value) => updateFilter('date', value)}
                />
              </div>

              {/* Sports Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  🏈 Sports
                </label>
                <SportMultiSelect
                  list={sportList || []}
                  selected={filters.sports || []}
                  onChange={(value) => updateFilter('sports', value)}
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
                  selected={filters.sportsbooks || []}
                  onChange={(value) => updateFilter('sportsbooks', value)}
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
                  list={getAvailableMarkets(filters.sports)}
                  selected={filters.markets || []}
                  onChange={(value) => {
                    updateFilter('markets', value);
                    console.log('🎯 User selected markets (mobile):', value.length > 0 ? value : 'ALL MARKETS (empty array)');
                  }}
                  placeholderText="Select markets..."
                  allLabel="All Markets"
                  enableCategories={true}
                />
              </div>
            </>
          )}
          
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={handleApplyFilters} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
              Apply
            </button>
            <button onClick={() => contextResetFilters()} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6b7280, #4b5563)', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
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
