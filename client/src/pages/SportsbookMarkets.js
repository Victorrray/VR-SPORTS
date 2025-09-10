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
  const [showPlayerProps, setShowPlayerProps] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("vr-odds-playerprops") === "true";
  });
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
  } = useMarkets(
    picked,
    ["us"],
    marketKeys,
    selectedDate ? new Date(selectedDate) : null
  );

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
          <button
            onClick={() => window.location.reload()}
            className="bg-red-700 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Retry
          </button>
          <p className="text-xs text-red-400 mt-3">If the problem persists, please try again later.</p>
        </div>
      </div>
    );
  }

// ... (rest of the code remains the same)
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
