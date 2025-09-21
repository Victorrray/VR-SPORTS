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
import useDebounce from "../hooks/useDebounce";
import { withApiBase } from "../config/api";
import { secureFetch } from "../utils/security";
import { useMarkets } from '../hooks/useMarkets';
import { useMe } from '../hooks/useMe';
import { useAuth } from '../hooks/useAuth';

const ENABLE_PLAYER_PROPS_V2 = true;
const PLAYER_PROP_MARKET_KEYS = ['player_passing_yards', 'player_passing_touchdowns', 'player_rushing_yards', 'player_rushing_attempts', 'player_receiving_yards', 'player_receptions', 'player_points', 'player_assists', 'player_rebounds'];

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
  
  // Draft filter state
  const [draftPicked, setDraftPicked] = useState([]);
  const [draftSelectedDate, setDraftSelectedDate] = useState('');
  const [draftSelectedBooks, setDraftSelectedBooks] = useState([]);
  const [draftMarketKeys, setDraftMarketKeys] = useState([]);

  const isPlayerPropsMode = ENABLE_PLAYER_PROPS_V2 && showPlayerProps;
  const isArbitrageMode = showArbitrage;
  const marketsForMode = isPlayerPropsMode ? PLAYER_PROP_MARKET_KEYS : marketKeys;
  const regionsForMode = isPlayerPropsMode ? ["us"] : ["us", "us2", "us_exchanges"];
  
  const hasPlatinum = me?.plan === 'platinum';
  const isOverQuota = me?.plan !== 'platinum' && me?.calls_made >= (me?.limit || 250);
  const [oddsFormat] = useState('american');
  const debouncedQuery = useDebounce(query, 300);

  const { 
    games: marketGames = [], 
    books: marketBooks = [], 
    isLoading: marketsLoading, 
    error: marketsError, 
    bookmakers 
  } = useMarkets(
    picked,
    regionsForMode,
    marketsForMode
  );

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
      {/* Header with Player Props Button */}
      <div style={{
        padding: '16px',
        background: 'var(--card-bg)',
        borderRadius: '12px',
        margin: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h2 style={{
          margin: 0,
          color: 'var(--text)',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Sports Betting Odds
        </h2>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {ENABLE_PLAYER_PROPS_V2 && (
            <button
              onClick={() => {
                setShowPlayerProps(true);
                setShowArbitrage(false);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: isPlayerPropsMode
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🎯 Player Props
            </button>
          )}

          <button
            onClick={() => navigate('/dfs')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📊 DFS Markets
          </button>
        </div>
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

      {/* Main Content */}
      {isArbitrageMode && hasPlatinum ? (
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
        showFilter={true}
        style={{ display: 'flex' }}
      />
      
      <MobileFiltersSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters">
        <div className="filter-stack" style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={applyFilters} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
              Apply
            </button>
            <button onClick={resetDraftFilters} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '14px' }}>
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
