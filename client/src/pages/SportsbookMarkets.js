// src/pages/SportsbookMarkets.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Target, Zap, Users, Trophy, ChevronDown, ChevronUp } from "lucide-react";
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
    { key: 'player_pass_longest_completion', title: 'Longest Pass', sport: 'football' }
  ],
  rushing: [
    { key: 'player_rush_yds', title: 'Rushing Yards', sport: 'football' },
    { key: 'player_rush_tds', title: 'Rushing TDs', sport: 'football' },
    { key: 'player_rush_attempts', title: 'Rush Attempts', sport: 'football' },
    { key: 'player_rush_longest', title: 'Longest Rush', sport: 'football' }
  ],
  receiving: [
    { key: 'player_receptions', title: 'Receptions', sport: 'football' },
    { key: 'player_receiving_yds', title: 'Receiving Yards', sport: 'football' },
    { key: 'player_receiving_tds', title: 'Receiving TDs', sport: 'football' },
    { key: 'player_receiving_longest', title: 'Longest Reception', sport: 'football' }
  ],
  touchdowns: [
    { key: 'player_anytime_td', title: 'Anytime TD', sport: 'football' },
    { key: 'player_1st_td', title: 'First TD', sport: 'football' },
    { key: 'player_last_td', title: 'Last TD', sport: 'football' },
    { key: 'player_2_plus_tds', title: '2+ TDs', sport: 'football' }
  ],
  basketball: [
    { key: 'player_points', title: 'Points', sport: 'basketball' },
    { key: 'player_rebounds', title: 'Rebounds', sport: 'basketball' },
    { key: 'player_assists', title: 'Assists', sport: 'basketball' },
    { key: 'player_threes', title: '3-Pointers Made', sport: 'basketball' },
    { key: 'player_steals', title: 'Steals', sport: 'basketball' },
    { key: 'player_blocks', title: 'Blocks', sport: 'basketball' }
  ],
  baseball: [
    { key: 'batter_hits', title: 'Hits', sport: 'baseball' },
    { key: 'batter_total_bases', title: 'Total Bases', sport: 'baseball' },
    { key: 'batter_rbis', title: 'RBIs', sport: 'baseball' },
    { key: 'batter_runs_scored', title: 'Runs', sport: 'baseball' },
    { key: 'batter_home_runs', title: 'Home Runs', sport: 'baseball' },
    { key: 'pitcher_strikeouts', title: 'Strikeouts', sport: 'baseball' },
    { key: 'pitcher_hits_allowed', title: 'Hits Allowed', sport: 'baseball' },
    { key: 'pitcher_earned_runs', title: 'Earned Runs', sport: 'baseball' }
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
  
  const [picked, setPicked] = useState(["americanfootball_nfl", "americanfootball_ncaaf"]);
  const [query, setQuery] = useState("");
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [marketKeys, setMarketKeys] = useState(["h2h", "spreads", "totals"]);
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
  const [navigationExpanded, setNavigationExpanded] = useState(false);
  const [sportList, setSportList] = useState([]);
  const [bookList, setBookList] = useState([]);
  
  // Missing variables
  const oddsFormat = "american";
  const debouncedQuery = useDebounce(query, 300);
  
  // Draft filter state - initialize with current applied state
  const [draftPicked, setDraftPicked] = useState(picked);
  const [draftSelectedDate, setDraftSelectedDate] = useState(selectedDate);
  const [draftSelectedBooks, setDraftSelectedBooks] = useState(selectedBooks);
  const [draftMarketKeys, setDraftMarketKeys] = useState(marketKeys);
  const [draftSelectedPlayerPropMarkets, setDraftSelectedPlayerPropMarkets] = useState(selectedPlayerPropMarkets);

  const isPlayerPropsMode = showPlayerProps;
  const isArbitrageMode = showArbitrage;
  const isMiddlesMode = showMiddles;
  const marketsForMode = isPlayerPropsMode ? [...marketKeys, ...selectedPlayerPropMarkets] : marketKeys;
  const regionsForMode = isPlayerPropsMode ? ["us"] : ["us", "us2", "us_exchanges"];
  
  // For player props, hardcode NFL to avoid filter issues
  const sportsForMode = isPlayerPropsMode ? ["americanfootball_nfl"] : picked;
  
  const hasPlatinum = me?.plan === 'platinum';
  const isOverQuota = me?.plan !== 'platinum' && me?.calls_made >= (me?.limit || 250);

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

  // Debug logging after marketGames is available
  console.log('🎯 Markets hook params:', {
    sportsForMode,
    picked,
    isPlayerPropsMode,
    selectedDate,
    marketsForMode,
    marketGamesCount: marketGames?.length || 0
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
    return Array.isArray(marketGames) ? marketGames : [];
  }, [marketGames]);

  // Simplified player props loading state - only show loading when actually switching modes
  useEffect(() => {
    if (isPlayerPropsMode && !filteredGames.length && marketsLoading) {
      setPlayerPropsProcessing(true);
    } else {
      setPlayerPropsProcessing(false);
    }
  }, [isPlayerPropsMode, marketsLoading, filteredGames.length]);

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
          console.warn('Player props prefetch failed:', error);
        }
      };

      // Debounce prefetching to avoid excessive requests
      const timeoutId = setTimeout(prefetchPlayerProps, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isPlayerPropsMode, picked, selectedDate, filteredGames.length]);

  // Removed redundant loading effect to prevent flashing

  const effectiveSelectedBooks = useMemo(() => {
    return (selectedBooks && selectedBooks.length)
      ? selectedBooks
      : (Array.isArray(marketBooks) ? marketBooks.map(b => b.key) : []);
  }, [selectedBooks, marketBooks]);

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
    }
  }, [mobileFiltersOpen]); // Only depend on modal open state

  const applyFilters = () => {
    // Apply draft filters to actual state
    const newPicked = Array.isArray(draftPicked) && draftPicked.length > 0 ? draftPicked : ["americanfootball_nfl"];
    const newDate = draftSelectedDate || '';
    const newBooks = Array.isArray(draftSelectedBooks) ? draftSelectedBooks : [];
    const newMarkets = Array.isArray(draftMarketKeys) && draftMarketKeys.length > 0 ? draftMarketKeys : ["h2h", "spreads", "totals"];
    
    console.log('🏈 Applying filters:', {
      sports: newPicked,
      date: newDate,
      books: newBooks,
      markets: newMarkets,
      playerPropsMode: showPlayerProps
    });
    
    setPicked(newPicked);
    setSelectedDate(newDate);
    setSelectedBooks(newBooks);
    setMarketKeys(newMarkets);
    setSelectedPlayerPropMarkets(Array.isArray(draftSelectedPlayerPropMarkets) && draftSelectedPlayerPropMarkets.length > 0 ? draftSelectedPlayerPropMarkets : ["player_pass_yds", "player_rush_yds", "player_receptions"]);
    setMobileFiltersOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftPicked(["americanfootball_nfl"]);
    setDraftSelectedDate('');
    setDraftSelectedBooks([]);
    setDraftMarketKeys(["h2h", "spreads", "totals"]);
    setDraftSelectedPlayerPropMarkets(["player_pass_yds", "player_rush_yds", "player_receptions"]);
  };

  const resetAllFilters = () => {
    // Reset both draft and applied states
    const defaultSports = ["americanfootball_nfl"];
    const defaultMarkets = ["h2h", "spreads", "totals"];
    const defaultPlayerProps = ["player_pass_yds", "player_rush_yds", "player_receptions"];
    
    // Reset draft state
    setDraftPicked(defaultSports);
    setDraftSelectedDate('');
    setDraftSelectedBooks([]);
    setDraftMarketKeys(defaultMarkets);
    setDraftSelectedPlayerPropMarkets(defaultPlayerProps);
    
    // Reset applied state
    setPicked(defaultSports);
    setSelectedDate('');
    setSelectedBooks([]);
    setMarketKeys(defaultMarkets);
    setSelectedPlayerPropMarkets(defaultPlayerProps);
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
    }
  };

  // Memoized football player prop markets for better performance
  const footballPlayerPropMarkets = useMemo(() => {
    const footballCategories = ['passing', 'rushing', 'receiving', 'touchdowns'];
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
    const dfsApps = getDFSApps();
    
    // Add DFS apps that aren't already in the market books
    const missingDFSApps = dfsApps.filter(dfs => !marketBookKeys.has(dfs.key));
    const enhancedBooks = [
      ...(marketBooks || []),
      ...missingDFSApps.map(dfs => ({ key: dfs.key, title: dfs.name }))
    ];
    
    return enhancedBooks;
  }, [marketBooks]);

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
            border: "2px solid var(--border-color)",
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
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "var(--border-color)";
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
            border: "2px solid var(--border-color)",
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
              onClick={() => {
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
      {(marketsError && marketsError.includes('Authentication required')) ? null : isArbitrageMode && hasPlatinum ? (
        <ArbitrageDetector 
          sport={picked[0] || 'americanfootball_nfl'}
          games={filteredGames}
          bookFilter={effectiveSelectedBooks}
          compact={false}
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
            loading={marketsLoading && (!filteredGames || filteredGames.length === 0)}
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
          loading={marketsLoading && (!filteredGames || filteredGames.length === 0)}
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
          {isPlayerPropsMode ? (
            <>
              {/* Player Props Market Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Player Prop Markets
                </label>
                <SportMultiSelect
                  list={footballPlayerPropMarkets}
                  selected={draftSelectedPlayerPropMarkets || []}
                  onChange={setDraftSelectedPlayerPropMarkets}
                  placeholderText="Select player props..."
                  allLabel="All Player Props"
                />
              </div>

              {/* Sportsbooks Filter for Player Props */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sportsbooks
                </label>
                <SportMultiSelect
                  list={enhancedSportsbookList}
                  selected={draftSelectedBooks || []}
                  onChange={setDraftSelectedBooks}
                  placeholderText="Select sportsbooks..."
                  allLabel="All Sportsbooks"
                  isSportsbook={true}
                  enableCategories={true}
                />
              </div>
            </>
          ) : (
            <>
              {/* Date Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Date
                </label>
                <DatePicker
                  value={draftSelectedDate}
                  onChange={setDraftSelectedDate}
                />
              </div>

              {/* Sports Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sports
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
                  Sportsbooks
                </label>
                <SportMultiSelect
                  list={enhancedSportsbookList}
                  selected={draftSelectedBooks || []}
                  onChange={setDraftSelectedBooks}
                  placeholderText="Select sportsbooks..."
                  allLabel="All Sportsbooks"
                  isSportsbook={true}
                  enableCategories={true}
                />
              </div>

              {/* Markets Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Markets
                </label>
                <SportMultiSelect
                  list={[
                    { key: 'h2h', title: 'Moneyline' },
                    { key: 'spreads', title: 'Spreads' },
                    { key: 'totals', title: 'Totals' }
                  ]}
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
            <button onClick={resetAllFilters} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '14px' }}>
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
