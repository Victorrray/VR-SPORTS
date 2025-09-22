// src/pages/SportsbookMarkets.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const ENABLE_PLAYER_PROPS_V2 = true;
const PLAYER_PROP_MARKET_KEYS = ['player_anytime_td', 'player_pass_yds', 'player_pass_tds', 'player_rush_yds', 'player_rush_tds', 'player_reception_yds', 'player_receptions', 'player_1st_td', 'player_last_td'];

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
  const [showPlayerProps, setShowPlayerProps] = useState(false);
  const [showArbitrage, setShowArbitrage] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minEV, setMinEV] = useState("");
  const [tableNonce, setTableNonce] = useState(0);
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

  const isPlayerPropsMode = ENABLE_PLAYER_PROPS_V2 && showPlayerProps;
  const isArbitrageMode = showArbitrage;
  const marketsForMode = isPlayerPropsMode ? PLAYER_PROP_MARKET_KEYS : marketKeys;
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
    setMobileFiltersOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftPicked(["americanfootball_nfl"]);
    setDraftSelectedDate('');
    setDraftSelectedBooks([]);
    setDraftMarketKeys(["h2h", "spreads", "totals"]);
  };

  return (
    <div className="sportsbook-markets">
      {/* Three Button Toggle */}
      <div style={{
        marginBottom: "24px",
        paddingTop: "20px",
        textAlign: "center",
        paddingLeft: "var(--mobile-gutter, 16px)",
        paddingRight: "var(--mobile-gutter, 16px)",
        padding: "24px 16px"
      }}>
        <div style={{
          display: "flex",
          background: "rgba(0, 0, 0, 0.2)",
          borderRadius: "12px",
          padding: "4px",
          gap: "0"
        }}>
          <button
            onClick={() => {
              setShowArbitrage(false);
              setShowPlayerProps(false);
            }}
            style={{
              flex: 1,
              background: (!isArbitrageMode && !isPlayerPropsMode) ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "transparent",
              border: "none",
              color: (!isArbitrageMode && !isPlayerPropsMode) ? "white" : "var(--text-secondary)",
              padding: "16px 24px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            📊 Game Odds
          </button>
          {ENABLE_PLAYER_PROPS_V2 && (
            <button
              onClick={() => {
                setShowPlayerProps(true);
                setShowArbitrage(false);
              }}
              style={{
                flex: 1,
                background: isPlayerPropsMode ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "transparent",
                border: "none",
                color: isPlayerPropsMode ? "white" : "var(--text-secondary)",
                padding: "16px 24px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              🎯 Player Props
            </button>
          )}
          <button
            onClick={() => {
              if (hasPlatinum) {
                setShowArbitrage(true);
                setShowPlayerProps(false);
              } else {
                navigate("/pricing");
              }
            }}
            style={{
              flex: 1,
              background: isArbitrageMode ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "transparent",
              border: "none",
              color: isArbitrageMode ? "white" : "var(--text-secondary)",
              padding: "16px 24px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: !hasPlatinum ? 0.6 : 1
            }}
          >
            ⚡ Arbitrage {!hasPlatinum && "🔒"}
          </button>
        </div>
        <p style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
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
          <OddsTable
            key={`props-${tableNonce}`}
            games={filteredGames}
            pageSize={15}
            mode="props"
            bookFilter={effectiveSelectedBooks}
            marketFilter={PLAYER_PROP_MARKET_KEYS}
            evMin={null}
            loading={loading || marketsLoading}
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
          
          {/* Show message for player props mode instead of filters */}
          {isPlayerPropsMode ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏈</div>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>
                NFL Player Props Mode
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
                Filters are disabled in Player Props mode.<br/>
                Showing NFL player prop markets only for optimal performance.
              </p>
            </div>
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
                />
              </div>

              {/* Date Filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Date
                </label>
                <DatePicker
                  selectedDate={draftSelectedDate}
                  onDateChange={setDraftSelectedDate}
                />
              </div>

              {/* Markets Filter */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
              Markets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['h2h', 'spreads', 'totals'].map(market => (
                <button
                  key={market}
                  onClick={() => {
                    const currentMarkets = draftMarketKeys || [];
                    if (currentMarkets.includes(market)) {
                      setDraftMarketKeys(currentMarkets.filter(m => m !== market));
                    } else {
                      setDraftMarketKeys([...currentMarkets, market]);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: (draftMarketKeys || []).includes(market) ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                    background: (draftMarketKeys || []).includes(market) ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    color: (draftMarketKeys || []).includes(market) ? '#8b5cf6' : 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {market === 'h2h' ? 'Moneyline' : market}
                </button>
              ))}
            </div>
          </div>

          {/* Sportsbooks Filter */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
              Sportsbooks
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(marketBooks || []).slice(0, 8).map(book => (
                <button
                  key={book.key}
                  onClick={() => {
                    const currentBooks = draftSelectedBooks || [];
                    if (currentBooks.includes(book.key)) {
                      setDraftSelectedBooks(currentBooks.filter(b => b !== book.key));
                    } else {
                      setDraftSelectedBooks([...currentBooks, book.key]);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 16,
                    border: (draftSelectedBooks || []).includes(book.key) ? '2px solid #8b5cf6' : '1px solid var(--border-color)',
                    background: (draftSelectedBooks || []).includes(book.key) ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    color: (draftSelectedBooks || []).includes(book.key) ? '#8b5cf6' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {book.title}
                </button>
              ))}
            </div>
          </div>
              </>
            )}

          {!isPlayerPropsMode && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={applyFilters} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                Apply
              </button>
              <button onClick={resetDraftFilters} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '14px' }}>
                Reset
              </button>
            </div>
          )}
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
