// src/pages/SportsbookMarkets.js
import React, { useEffect, useMemo, useState } from "react";
import MobileBottomBar from "../components/MobileBottomBar";
import MobileFiltersSheet from "../components/MobileFiltersSheet";

// ⬇️ Adjust these paths if needed
import SportMultiSelect from "../components/SportMultiSelect";
import DatePicker from "../components/DatePicker";
import OddsTable from "../components/OddsTable";
import useDebounce from "../hooks/useDebounce";
import useMarkets from "../hooks/useMarkets";

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

// DFS apps to exclude when showing sportsbooks
const DFS_KEYS = ["prizepicks", "underdog", "pick6"];

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
const FEATURED_SPORTS = new Set([
  "basketball_nba",
  "baseball_mlb",
  "baseball_kbo",
  "baseball_npb",
  "baseball_cpbl",
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "icehockey_nhl",
  "soccer_epl",
  "soccer_uefa_champs_league",
  "tennis_atp",
  "tennis_wta",
  "mma_mixed_martial_arts",
  "boxing_boxing",
]);

// Friendly bookmaker titles (if you render them elsewhere)
const BOOK_TITLES = {
  draftkings: "DraftKings",
  fanduel: "FanDuel",
  betmgm: "BetMGM",
  caesars: "Caesars",
  bet365: "Bet365",
  pointsbetus: "PointsBet (US)",
  fanatics: "Fanatics Sportsbook",
  fanatics_sportsbook: "Fanatics Sportsbook",
  espnbet: "ESPN BET",
  betrivers: "BetRivers",
  sugarhouse: "SugarHouse",
  unibet_us: "Unibet (US)",
  betparx: "betPARX",
  betway: "Betway",
  si_sportsbook: "SI Sportsbook",
  betfred: "Betfred",
  superbook: "SuperBook",
  circasports: "Circa Sports",
  hardrockbet: "Hard Rock Bet",
  wynnbet: "WynnBET",
  barstool: "Barstool",
  foxbet: "FOX Bet",
  fliff: "Fliff",
  fliff_sportsbook: "Fliff",
  ballybet: "Bally Bet",
  betanysports: "BetAnySports",
  rebet: "ReBet",
  windcreek: "Wind Creek (Betfred PA)",
  betopenly: "BetOpenly",
  novig: "Novig",
  prophetx: "ProphetX",
  pinnacle: "Pinnacle",
  betonlineag: "BetOnline.ag",
  betus: "BetUS",
  bovada: "Bovada",
  williamhill_us: "Caesars",
  lowvig: "LowVig.ag",
  mybookieag: "MyBookie.ag",
  sport888: "888sport",
  betfair_ex_uk: "Betfair Exchange (UK)",
  betfair_sb_uk: "Betfair Sportsbook (UK)",
  betvictor: "BetVictor",
  boylesports: "BoyleSports",
  casumo: "Casumo",
  coral: "Coral",
  grosvenor: "Grosvenor",
  ladbrokes_uk: "Ladbrokes",
  leovegas: "LeoVegas",
  livescorebet: "LiveScore Bet",
  matchbook: "Matchbook",
  paddypower: "Paddy Power",
  skybet: "Sky Bet",
  smarkets: "Smarkets",
  unibet_uk: "Unibet (UK)",
  virginbet: "Virgin Bet",
  williamhill: "William Hill",
  onexbet: "1xBet",
  betclic_fr: "Betclic (FR)",
  betfair_ex_eu: "Betfair Exchange (EU)",
  betsson: "Betsson",
  coolbet: "Coolbet",
  everygame: "Everygame",
  gtbets: "GTBets",
  marathonbet: "Marathon Bet",
  nordicbet: "NordicBet",
  parionssport_fr: "Parions Sport (FR)",
  suprabets: "Suprabets",
  tipico_de: "Tipico (DE)",
  unibet_fr: "Unibet (FR)",
  unibet_it: "Unibet (IT)",
  unibet_nl: "Unibet (NL)",
  winamax_de: "Winamax (DE)",
  winamax_fr: "Winamax (FR)",
  betfair_ex_au: "Betfair Exchange (AU)",
  betr_au: "Betr (AU)",
  betright: "Bet Right",
  bet365_au: "Bet365 AU",
  boombet: "BoomBet",
  dabble_au: "Dabble AU",
  ladbrokes_au: "Ladbrokes AU",
  neds: "Neds",
  playup: "PlayUp",
  pointsbetau: "PointsBet AU",
  sportsbet: "SportsBet",
  tab: "TAB",
  tabtouch: "TABtouch",
  unibet: "Unibet",
};

// Limit sportsbook universe: keep US books, Pinnacle, and US exchanges
const ALLOWED_BOOKS = new Set(
  [
    // Major US books
    "draftkings","fanduel","betmgm","caesars","bet365","pointsbetus","fanatics","fanatics_sportsbook","espnbet",
    "betrivers","sugarhouse","unibet_us","betparx","betway","si_sportsbook","betfred","superbook","circasports",
    "hardrockbet","wynnbet","barstool","foxbet","ballybet","windcreek",
    // US-friendly/offshore commonly compared
    "bovada","betonlineag","betus","mybookieag","lowvig","betanysports","fliff","fliff_sportsbook",
    // Exchanges and peer-to-peer (US)
    "betopenly","novig","prophetx","rebet",
    // Explicitly include Pinnacle for reference pricing
    "pinnacle",
    // If present in feed, allow explicit US exchange key
    "betfair_ex_us",
  ].map((k) => k.toLowerCase())
);

/* =========================
   Component
   ========================= */

export default function SportsbookMarkets() {
  const [sportList, setSportList] = useState([]);
  const [picked, setPicked] = useState(["americanfootball_nfl", "americanfootball_ncaaf"]);
  const [query, setQuery] = useState("");
  const [games, setGames] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [tableNonce, setTableNonce] = useState(0);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState(null);
  const [showAllGames, setShowAllGames] = useState(false);
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [marketKeys, setMarketKeys] = useState(["h2h", "spreads", "totals"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [minEV, setMinEV] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const [oddsFormat, setOddsFormat] = useState(() => {
    if (typeof window === "undefined") return "american";
    return localStorage.getItem("oddsFormat") || "american";
  });

  // ✅ Debounce defined ONCE
  const debouncedQuery = useDebounce(query, 300);

  // Sync with URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("oddsFormat", oddsFormat);
      } catch {}
    }
  }, [oddsFormat]);

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

  // Preferred default books for reset
  const PREFERRED_BOOK_KEYS = [
    "draftkings",
    "fanduel",
    "fanatics",
    "fanatics_sportsbook",
    "bovada",
    "fliff",
    "fliff_sportsbook",
  ];

  // Compute market options based on selected sports (union)
  const marketOptions = useMemo(() => {
    let keys = new Set();
    const selectedSports = picked.includes("ALL")
      ? sportList.filter((s) => s.key !== "ALL").map((s) => s.key)
      : picked;
    if (!selectedSports || selectedSports.length === 0) {
      GAME_LINES.forEach((k) => keys.add(k));
    } else {
      selectedSports.forEach((sk) => {
        (SPORT_MARKETS[sk] || GAME_LINES).forEach((k) => keys.add(k));
      });
    }
    return Array.from(keys).map((k) => ({ key: k, title: MARKET_TITLES[k] || k }));
  }, [picked, sportList]);

  // Keep selected markets within available options for the sport(s)
  useEffect(() => {
    const avail = new Set(marketOptions.map((o) => o.key));
    const sel = marketKeys.filter((k) => avail.has(k));
    if (sel.length !== marketKeys.length) {
      setMarketKeys(sel.length ? sel : Array.from(avail));
    }
    // eslint-disable-next-line
  }, [marketOptions]);

  // When sports selection changes, auto-select all markets available for those sports
  useEffect(() => {
    const allForSports = marketOptions.map((o) => o.key);
    setMarketKeys(allForSports);
    // eslint-disable-next-line
  }, [picked]); // eslint okay; handled intentionally

  const availableMarkets = useMemo(() => {
    const set = new Set();
    games
      .slice(0, 10)
      .forEach((g) => (g.bookmakers || []).forEach((bk) => (bk.markets || []).forEach((m) => set.add(m.key))));
    return Array.from(set).sort();
  }, [games]);

  const BASE_URL = process.env.REACT_APP_API_URL || ""; // keep CRA-style env; change to import.meta.env for Vite

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

        // Ensure certain soccer/tennis keys are visible even if not returned as active
        const ENSURE = [
          "soccer_epl",
          "soccer_uefa_champs_league",
          "tennis_atp",
          "tennis_wta",
          "baseball_kbo",
          "baseball_npb",
          "baseball_cpbl",
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

  // Use shared hook for sportsbook odds data
  const selectedSports = picked.includes("ALL")
    ? sportList.filter((s) => s.key !== "ALL").map((s) => s.key)
    : picked;
  const allowedBooksArr = useMemo(() => Array.from(ALLOWED_BOOKS), []);
  const { games: hookGames, books: hookBooks, loading: hookLoading, error: hookError, quota: hookQuota } = useMarkets({
    sports: selectedSports,
    markets: marketKeys.length ? marketKeys : GAME_LINES,
    baseUrl: BASE_URL,
    regions: "us,us2,us_ex",
    excludeBooks: DFS_KEYS,
    allowedBooks: allowedBooksArr,
    refreshKey: refreshTick,
  });

  // Sync back to local state expected by existing UI
  useEffect(() => {
    setGames(hookGames || []);
    setLoad(!!hookLoading);
    setErr(hookError || null);
    setQuota(hookQuota || { remain: "–", used: "–" });
    if (Array.isArray(hookBooks) && hookBooks.length > 0) {
      setBookList(hookBooks);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("booksCache", JSON.stringify(hookBooks));
        } catch {}
      }
    }
  }, [hookGames, hookLoading, hookError, hookQuota, hookBooks]);

  // Derive effective book filter; if none of selected are available, show all
  const availableBookKeys = useMemo(() => new Set((bookList || []).map((b) => b.key)), [bookList]);
  const effectiveSelectedBooks = useMemo(() => {
    const filtered = (selectedBooks || []).filter((k) => availableBookKeys.has(k));
    return filtered.length ? filtered : [];
  }, [selectedBooks, availableBookKeys]);

  // Ensure selected books stay within available list; if none, prefer defaults
  useEffect(() => {
    const booksArr = bookList || [];
    const availableKeys = new Set(booksArr.map((b) => b.key));
    if (!booksArr.length) return;

    const intersect = (selectedBooks || []).filter((k) => availableKeys.has(k));
    if (intersect.length) {
      if (intersect.length !== selectedBooks.length) setSelectedBooks(intersect);
    } else {
      const prefer = PREFERRED_BOOK_KEYS.filter((k) => availableKeys.has(k));
      setSelectedBooks(prefer.length ? prefer : booksArr.map((b) => b.key));
    }
    // eslint-disable-next-line
  }, [bookList]);

  // ===== Filtering before passing to OddsTable =====
  let filteredGames = games;

  if (debouncedQuery.trim()) {
    const q = debouncedQuery.toLowerCase();
    filteredGames = filteredGames.filter(
      (g) =>
        (g.home_team && g.home_team.toLowerCase().includes(q)) ||
        (g.away_team && g.away_team.toLowerCase().includes(q)) ||
        (g.sport_title && g.sport_title.toLowerCase().includes(q)) ||
        // Also search by league/sport
        (getSportLeague(g.sport_key).league.toLowerCase().includes(q)) ||
        (getSportLeague(g.sport_key).sport.toLowerCase().includes(q))
    );
  }

  // Date filter (local date)
  if (selectedDate) {
    filteredGames = filteredGames.filter((g) => {
      const d = new Date(g.commence_time);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const local = `${y}-${m}-${day}`;
      return local === selectedDate;
    });
  }

  if (picked && picked.length && !picked.includes("ALL")) {
    filteredGames = filteredGames.filter((g) => picked.includes(g.sport_key));
  }

  if (!showAllGames) {
    filteredGames = filteredGames.filter((g) => {
      const start = new Date(g.commence_time).getTime();
      const now = Date.now();
      return !(now >= start && now < start + 3 * 3600 * 1000);
    });
  }

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
                        onChange={() => setOddsFormat(opt.k)}
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
                placeholder={"Search team / league"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

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
                usePortal={true}
                portalAlign={"up"}
              />
            </div>

            <div className="filter-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => setRefreshTick(Date.now())}>
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
          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            onClick={() => setSettingsOpen((v) => !v)}
            style={{
              position: "absolute",
              left: 12,
              bottom: 12,
              background: "transparent",
              border: "none",
              color: "#e7ecff",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
              padding: 6,
              borderRadius: 8,
            }}
          >
            ⚙️
          </button>
        </aside>

        <section className="table-area">
          <OddsTable
            key={tableNonce}
            games={filteredGames}
            pageSize={15}
            mode={"game"}
            bookFilter={effectiveSelectedBooks}
            marketFilter={marketKeys}
            evMin={minEV === "" ? null : Number(minEV)}
            loading={loading}
            error={error}
            oddsFormat={oddsFormat}
            allCaps={
              typeof window !== "undefined" && new URLSearchParams(window.location.search).get("caps") === "1"
            }
          />
        </section>

        {/* Mobile footer nav + filter pill */}
        <MobileBottomBar onFilterClick={() => setMobileFiltersOpen(true)} active="sportsbooks" />
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
                  setRefreshTick(Date.now());
                  setMobileFiltersOpen(false);
                }}
              >
                Apply Filters
              </button>
              <button
                type="button"
                className="filter-btn reset-btn"
                onClick={() => {
                  resetFilters();
                  setMobileFiltersOpen(false);
                }}
              >
                Reset All
              </button>
            </div>
          </div>
        </MobileFiltersSheet>
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

    const availableKeys = new Set(bookList.map((b) => b.key));
    const preferredAvail = ["draftkings","fanduel","fanatics","fanatics_sportsbook","bovada","fliff","fliff_sportsbook"]
      .filter((k) => availableKeys.has(k));
    setSelectedBooks(preferredAvail.length ? preferredAvail : []);
    setTableNonce((n) => n + 1);
    setRefreshTick(Date.now());
  }
}
