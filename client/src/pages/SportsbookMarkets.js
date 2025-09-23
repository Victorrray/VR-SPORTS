// src/pages/SportsbookMarkets.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Target, Zap, Users, Trophy } from "lucide-react";
import MobileBottomBar from "../components/layout/MobileBottomBar";
import MobileFiltersSheet from "../components/layout/MobileFiltersSheet";
import MobileSearchModal from "../components/modals/MobileSearchModal";
import { useBetSlip } from "../contexts/BetSlipContext";
import BetSlip from "../components/betting/BetSlip";
import SportMultiSelect from "../components/betting/SportMultiSelect";
import DatePicker from "../components/common/DatePicker";
import OddsTable from "../components/betting/OddsTable";
import ArbitrageDetector from "../components/betting/ArbitrageDetector";
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minEV, setMinEV] = useState("");
  const [tableNonce, setTableNonce] = useState(0);
  const [playerPropsProcessing, setPlayerPropsProcessing] = useState(false);
  const [sportList, setSportList] = useState([]);
  const [bookList, setBookList] = useState([]);
  
  // Missing variables
  const oddsFormat = "american";
  const debouncedQuery = useDebounce(query, 300);
  
  // Draft filter state
  const [draftPicked, setDraftPicked] = useState(["americanfootball_nfl"]);
  const [draftSelectedDate, setDraftSelectedDate] = useState('');
  const [draftSelectedBooks, setDraftSelectedBooks] = useState([]);
  const [draftMarketKeys, setDraftMarketKeys] = useState(["h2h", "spreads", "totals"]);
  const [draftSelectedPlayerPropMarkets, setDraftSelectedPlayerPropMarkets] = useState(["player_rush_yds", "player_pass_yds", "player_receptions"]);

  const isPlayerPropsMode = ENABLE_PLAYER_PROPS_V2 && showPlayerProps;
  const isArbitrageMode = showArbitrage;
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
    marketsForMode
  );

  // Update bookList when marketBooks changes
  useEffect(() => {
    if (marketBooks && marketBooks.length > 0) {
      setBookList(marketBooks);
    }
  }, [marketBooks]);

  // Handle player props processing state
  useEffect(() => {
    if (isPlayerPropsMode && (marketsLoading || (filteredGames.length > 0 && !playerPropsProcessing))) {
      setPlayerPropsProcessing(true);
      // Give a small delay to show loading, then let OddsTable processing complete
      const timer = setTimeout(() => {
        setPlayerPropsProcessing(false);
      }, 1500); // Show loading for 1.5 seconds to cover processing time
      return () => clearTimeout(timer);
    } else if (!isPlayerPropsMode) {
      setPlayerPropsProcessing(false);
    }
  }, [isPlayerPropsMode, marketsLoading, filteredGames.length]);

  const filteredGames = useMemo(() => {
    return Array.isArray(marketGames) ? marketGames : [];
  }, [marketGames]);

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

  const applyFilters = () => {
    setPicked(draftPicked && draftPicked.length ? draftPicked : ["americanfootball_nfl"]);
    setSelectedDate(draftSelectedDate || '');
    setSelectedBooks(draftSelectedBooks || []);
    setMarketKeys(draftMarketKeys && draftMarketKeys.length ? draftMarketKeys : ["h2h", "spreads", "totals"]);
    setSelectedPlayerPropMarkets(draftSelectedPlayerPropMarkets && draftSelectedPlayerPropMarkets.length ? draftSelectedPlayerPropMarkets : ["player_pass_yds", "player_rush_yds", "player_receptions"]);
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

  // Get football player prop markets organized for the dropdown with categories
  const getFootballPlayerPropMarkets = () => {
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
  };

  // Merge available sportsbooks with DFS apps to ensure they're always available
  const getEnhancedSportsbookList = (marketBooks) => {
    const marketBookKeys = new Set((marketBooks || []).map(book => book.key));
    const dfsApps = getDFSApps();
    
    // Add DFS apps that aren't already in the market books
    const missingDFSApps = dfsApps.filter(dfs => !marketBookKeys.has(dfs.key));
    const enhancedBooks = [
      ...(marketBooks || []),
      ...missingDFSApps.map(dfs => ({ key: dfs.key, title: dfs.name }))
    ];
    
    return enhancedBooks;
  };

  return (
    <div className="sportsbook-markets">
      {/* Card-Style Navigation */}
      <div style={{
        marginBottom: "32px",
        paddingTop: "20px",
        paddingLeft: "var(--mobile-gutter, 16px)",
        paddingRight: "var(--mobile-gutter, 16px)",
        padding: "24px 16px"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "16px",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          <button
            onClick={() => {
              setShowArbitrage(false);
              setShowPlayerProps(false);
            }}
            style={{
              background: (!isArbitrageMode && !isPlayerPropsMode) 
                ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                : "var(--card-bg)",
              border: (!isArbitrageMode && !isPlayerPropsMode) 
                ? "2px solid transparent" 
                : "2px solid var(--border-color)",
              borderRadius: "16px",
              padding: "20px 16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              minHeight: "100px",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              if (!(!isArbitrageMode && !isPlayerPropsMode)) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.3)";
                e.target.style.borderColor = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              if (!(!isArbitrageMode && !isPlayerPropsMode)) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
                e.target.style.borderColor = "var(--border-color)";
              }
            }}
          >
            <div style={{
              fontSize: "24px",
              marginBottom: "4px"
            }}>📊</div>
            <div style={{
              fontWeight: "600",
              fontSize: "16px",
              color: (!isArbitrageMode && !isPlayerPropsMode) ? "white" : "var(--text-primary)",
              textAlign: "center"
            }}>Game Odds</div>
            <div style={{
              fontSize: "12px",
              color: (!isArbitrageMode && !isPlayerPropsMode) ? "rgba(255,255,255,0.8)" : "var(--text-secondary)",
              textAlign: "center",
              lineHeight: "1.3"
            }}>Live markets</div>
            {(!isArbitrageMode && !isPlayerPropsMode) && (
              <div style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981"
              }} />
            )}
          </button>

          <button
            onClick={() => {
              setShowArbitrage(false);
              setShowPlayerProps(true);
            }}
            style={{
              background: isPlayerPropsMode 
                ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                : "var(--card-bg)",
              border: isPlayerPropsMode 
                ? "2px solid transparent" 
                : "2px solid var(--border-color)",
              borderRadius: "16px",
              padding: "20px 16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              minHeight: "100px",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              if (!isPlayerPropsMode) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.3)";
                e.target.style.borderColor = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isPlayerPropsMode) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
                e.target.style.borderColor = "var(--border-color)";
              }
            }}
          >
            <div style={{
              fontSize: "24px",
              marginBottom: "4px"
            }}>🎯</div>
            <div style={{
              fontWeight: "600",
              fontSize: "16px",
              color: isPlayerPropsMode ? "white" : "var(--text-primary)",
              textAlign: "center"
            }}>Player Props</div>
            <div style={{
              fontSize: "12px",
              color: isPlayerPropsMode ? "rgba(255,255,255,0.8)" : "var(--text-secondary)",
              textAlign: "center",
              lineHeight: "1.3"
            }}>DFS opportunities</div>
            {isPlayerPropsMode && (
              <div style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981"
              }} />
            )}
          </button>

          <button
            onClick={() => {
              setShowPlayerProps(false);
              setShowArbitrage(true);
            }}
            style={{
              background: isArbitrageMode 
                ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" 
                : "var(--card-bg)",
              border: isArbitrageMode 
                ? "2px solid transparent" 
                : "2px solid var(--border-color)",
              borderRadius: "16px",
              padding: "20px 16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              minHeight: "100px",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              if (!isArbitrageMode) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.3)";
                e.target.style.borderColor = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isArbitrageMode) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
                e.target.style.borderColor = "var(--border-color)";
              }
            }}
          >
            <div style={{
              fontSize: "24px",
              marginBottom: "4px"
            }}>⚡</div>
            <div style={{
              fontWeight: "600",
              fontSize: "16px",
              color: isArbitrageMode ? "white" : "var(--text-primary)",
              textAlign: "center"
            }}>Arbitrage</div>
            <div style={{
              fontSize: "12px",
              color: isArbitrageMode ? "rgba(255,255,255,0.8)" : "var(--text-secondary)",
              textAlign: "center",
              lineHeight: "1.3"
            }}>Find edges</div>
            {isArbitrageMode && (
              <div style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981"
              }} />
            )}
          </button>
        </div>
        
        {/* Description text */}
        <p style={{
          textAlign: "center",
          color: "var(--text-secondary)",
          fontSize: "14px",
          margin: "16px 0 0 0",
          opacity: 0.8
        }}>
          {isArbitrageMode
            ? "Find profitable arbitrage opportunities"
            : isPlayerPropsMode
              ? "Explore player props across every book you follow"
              : "Compare odds across all major sportsbooks"}
        </p>
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
            loading={loading || marketsLoading || playerPropsProcessing}
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
          loading={loading || marketsLoading}
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
                  list={getFootballPlayerPropMarkets()}
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
                  list={getEnhancedSportsbookList(marketBooks)}
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

              {/* Sportsbooks Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sportsbooks
                </label>
                <SportMultiSelect
                  list={getEnhancedSportsbookList(marketBooks)}
                  selected={draftSelectedBooks || []}
                  onChange={setDraftSelectedBooks}
                  placeholderText="Select sportsbooks..."
                  allLabel="All Sportsbooks"
                  isSportsbook={true}
                  enableCategories={true}
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
