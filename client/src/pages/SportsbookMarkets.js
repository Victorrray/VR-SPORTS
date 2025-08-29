import React, { useEffect, useMemo, useState } from "react";
import OddsTable from "../components/OddsTable";
import SportMultiSelect from "../components/SportMultiSelect";
import useDebounce from "../hooks/useDebounce";

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
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "first_half_moneyline","first_half_spreads","first_half_totals",
    "team_totals","team_totals_home","team_totals_away",
  ],
  americanfootball_ncaaf: [
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "first_half_moneyline","first_half_spreads","first_half_totals",
    "team_totals","team_totals_home","team_totals_away",
  ],
  basketball_nba: [
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "first_half_moneyline","first_half_spreads","first_half_totals",
    "first_quarter_moneyline","first_quarter_spreads","first_quarter_totals",
    "team_totals","team_totals_home","team_totals_away",
  ],
  basketball_ncaab: [
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "first_half_moneyline","first_half_spreads","first_half_totals",
    "team_totals",
  ],
  baseball_mlb: [
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "first_five_moneyline","first_five_spreads","first_five_totals",
    "team_totals",
  ],
  // Other baseball leagues
  baseball_kbo: [
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "first_five_moneyline","first_five_spreads","first_five_totals",
    "team_totals",
  ],
  baseball_npb: [
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "first_five_moneyline","first_five_spreads","first_five_totals",
    "team_totals",
  ],
  baseball_cpbl: [
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "first_five_moneyline","first_five_spreads","first_five_totals",
    "team_totals",
  ],
  icehockey_nhl: [
    "h2h","spreads","totals",
    "spreads_alternate","totals_alternate",
    "team_totals",
  ],
  soccer_epl: [
    "h2h","draw_no_bet","double_chance","totals","totals_alternate","btts","corners","cards",
  ],
  soccer_uefa_champs_league: [
    "h2h","draw_no_bet","double_chance","totals","totals_alternate","btts","corners","cards",
  ],
  // Tennis (keys may vary by feed; these are common)
  tennis_atp: [
    "h2h","totals","set_winner","game_handicap","set_totals","total_sets",
  ],
  tennis_wta: [
    "h2h","totals","set_winner","game_handicap","set_totals","total_sets",
  ],
  tennis_challenger: [
    "h2h","totals","set_winner","game_handicap","set_totals",
  ],
  tennis_itf_men: [
    "h2h","totals","set_winner","game_handicap",
  ],
  tennis_itf_women: [
    "h2h","totals","set_winner","game_handicap",
  ],
  // Combat sports (availability varies by provider)
  mma_mixed_martial_arts: [
    "h2h",
  ],
  boxing_boxing: [
    "h2h",
  ],
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
  // Include soccer + tennis so they appear in the curated list
  "soccer_epl",
  "soccer_uefa_champs_league",
  "tennis_atp",
  "tennis_wta",
  // Combat sports
  "mma_mixed_martial_arts",
  "boxing_boxing",
]);

// Friendly bookmaker titles for dropdown
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
  // --- Additional US (us) ---
  betonlineag: "BetOnline.ag",
  betus: "BetUS",
  bovada: "Bovada",
  williamhill_us: "Caesars",
  lowvig: "LowVig.ag",
  mybookieag: "MyBookie.ag",
  // --- UK (uk) ---
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
  // --- EU (eu) ---
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
  // --- AU (au) ---
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
const ALLOWED_BOOKS = new Set([
  // Major US books
  'draftkings','fanduel','betmgm','caesars','bet365','pointsbetus','fanatics','fanatics_sportsbook','espnbet',
  'betrivers','sugarhouse','unibet_us','betparx','betway','si_sportsbook','betfred','superbook','circasports',
  'hardrockbet','wynnbet','barstool','foxbet','ballybet','windcreek',
  // US-friendly/offshore commonly compared
  'bovada','betonlineag','betus','mybookieag','lowvig','betanysports',
  // Exchanges and peer-to-peer (US)
  'betopenly','novig','prophetx','rebet',
  // Explicitly include Pinnacle for reference pricing
  'pinnacle',
  // If present in feed, allow explicit US exchange key
  'betfair_ex_us'
].map(k => k.toLowerCase()));

// Player-props helpers removed while focusing on sportsbooks only

export default function SportsbookMarkets() {
  const [sportList, setSportList] = useState([]);
  const [picked, setPicked] = useState(["americanfootball_nfl", "americanfootball_ncaaf"]);
  const [query, setQuery] = useState("");
  const [games, setGames] = useState([]);
  const [bookList, setBookList] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState(null);
  const [showAllGames, setShowAllGames] = useState(false);
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [marketKeys, setMarketKeys] = useState(["h2h","spreads","totals"]);

  // Compute market options based on selected sports (union)
  const marketOptions = useMemo(() => {
    let keys = new Set();
    const selectedSports = picked.includes("ALL")
      ? sportList.filter(s => s.key !== "ALL").map(s => s.key)
      : picked;
    if (!selectedSports || selectedSports.length === 0) {
      GAME_LINES.forEach(k => keys.add(k));
    } else {
      selectedSports.forEach(sk => {
        (SPORT_MARKETS[sk] || GAME_LINES).forEach(k => keys.add(k));
      });
    }
    return Array.from(keys).map(k => ({ key: k, title: MARKET_TITLES[k] || k }));
  }, [picked, sportList]);

  // Keep selected markets within available options for the sport(s)
  useEffect(() => {
    const avail = new Set(marketOptions.map(o => o.key));
    const sel = marketKeys.filter(k => avail.has(k));
    if (sel.length !== marketKeys.length) {
      // If current selection becomes invalid/empty, default to all available markets
      setMarketKeys(sel.length ? sel : Array.from(avail));
    }
    // eslint-disable-next-line
  }, [marketOptions]);

  // When sports selection changes, auto-select all markets available for those sports
  useEffect(() => {
    const allForSports = marketOptions.map(o => o.key);
    setMarketKeys(allForSports);
    // eslint-disable-next-line
  }, [picked]);
  const [minEV, setMinEV] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const availableMarkets = useMemo(() => {
    const set = new Set();
    games.slice(0, 10).forEach(g => (g.bookmakers || []).forEach(bk => (bk.markets || []).forEach(m => set.add(m.key))));
    return Array.from(set).sort();
  }, [games]);

  const resetFilters = () => {
    setSelectedDate("");
    setMarketKeys(["h2h", "spreads", "totals"]);
    setMinEV("");
  };

  const debounced = useDebounce(query, 300);
  const BASE_URL = process.env.REACT_APP_API_URL || "";

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
        const activeOnly = arr.filter(s => s && s.active);
        const curated = activeOnly.filter(s => FEATURED_SPORTS.has(s.key));
        const listToUse = curated.length ? curated : activeOnly;
        let mapped = listToUse
          .map(s => ({
            ...s,
            title: FRIENDLY_TITLES[s.key] || s.title || s.key,
          }));
        // Ensure certain soccer/tennis keys are visible even if not returned as active
        const ENSURE = [
          'soccer_epl','soccer_uefa_champs_league',
          'tennis_atp','tennis_wta',
          // Baseball international leagues (show even if not active)
          'baseball_kbo','baseball_npb','baseball_cpbl',
          // Combat sports
          'mma_mixed_martial_arts','boxing_boxing'
        ];
        const present = new Set(mapped.map(s => s.key));
        ENSURE.forEach(k => {
          if (!present.has(k)) {
            mapped.push({ key: k, title: FRIENDLY_TITLES[k] || k, active: false });
          }
        });
        // Sort by title for a tidy picker
        mapped = mapped.sort((a,b) => String(a.title).localeCompare(String(b.title)));
        const allSports = [{ key: "ALL", title: "All Sports" }, ...mapped];
        setSportList(allSports);
      } catch (_) {
        setSportList([{ key: "ALL", title: "All Sports" }]);
      }
    })();
    // eslint-disable-next-line
  }, []);

  // Fetch odds data for major sportsbooks (game lines only)
  useEffect(() => {
    (async () => {
      try {
        setLoad(true);
        setErr(null);
        const keys = picked.includes("ALL")
          ? sportList.filter(s => s.key !== "ALL").map(s => s.key)
          : picked;

        if (!keys.length) {
          setGames([]);
          setLoad(false);
          return;
        }

        {
          const normalizeMarkets = (arr) => {
            const CANON = { alternate_spreads: 'spreads_alternate', alternate_totals: 'totals_alternate' };
            const out = new Set();
            (arr || []).forEach(k => {
              const kk = (CANON[k] || k);
              out.add(kk);
            });
            return Array.from(out);
          };
          const calls = keys.map(k => {
            const selectedMarkets = (marketKeys && marketKeys.length) ? marketKeys : GAME_LINES;
            const marketsParam = normalizeMarkets(selectedMarkets).join(",");
            // Restrict to US and US exchanges; include us2 for broader US coverage
            return fetch(`${BASE_URL}/api/odds-data?sport=${k}&regions=us,us2,us_ex&markets=${marketsParam}&includeBetLimits=true`)
              .then(async r => {
                if (r.ok && quota.remain === "–") {
                  setQuota({
                    remain: r.headers.get("x-requests-remaining") ?? "—",
                    used: r.headers.get("x-requests-used") ?? "—",
                  });
                }
                return r.json();
              })
              .catch(() => []);
          });
          const gamesRaw = (await Promise.all(calls)).flat();

          // Remove DFS apps (keep all other bookmakers across regions)
          const filteredGames = gamesRaw.map(g => ({
            ...g,
            bookmakers: (g.bookmakers || [])
              .filter(bk => !DFS_KEYS.includes((bk.key || "").toLowerCase()))
              .filter(bk => ALLOWED_BOOKS.has((bk.key || '').toLowerCase())),
          }))
          // Only include games with at least one valid sportsbook
          .filter(g => Array.isArray(g.bookmakers) && g.bookmakers.length > 0);

          setGames(filteredGames);

          // Build bookmaker list from returned games (unique by key)
          const seen = new Map();
          const cleanBookTitle = (t) => String(t || '').replace(/\.?ag\b/gi, '').trim();
          filteredGames.forEach(g => (g.bookmakers || []).forEach(bk => {
            const key = (bk.key || "").toLowerCase();
            if (!key) return;
            if (!seen.has(key)) seen.set(key, { key, title: cleanBookTitle(bk.title || BOOK_TITLES[key] || key) });
          }));
          // Build list using only books actually present in the feed
          const booksArr = Array.from(seen.values()).sort((a, b) => a.title.localeCompare(b.title));
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try {
              const keys = Array.from(seen.keys());
              // eslint-disable-next-line no-console
              console.debug('[Sportsbooks] bookmakers in feed:', keys);
            } catch {}
          }
          setBookList(booksArr);
          // Preferred default selection if available
          const availableKeys = new Set(booksArr.map(b => b.key));
          const PREFERRED = ['bovada', 'fliff', 'fanduel', 'draftkings'];
          const preferredAvail = PREFERRED.filter(k => availableKeys.has(k));
          // Sync current selection to available set (delist books with no responses)
          if (booksArr.length) {
            if (selectedBooks.length === 0) {
              setSelectedBooks(preferredAvail.length ? preferredAvail : booksArr.map(b => b.key));
            } else {
              const intersect = selectedBooks.filter(k => availableKeys.has(k));
              if (intersect.length !== selectedBooks.length) {
                setSelectedBooks(intersect.length ? intersect : (preferredAvail.length ? preferredAvail : booksArr.map(b => b.key)));
              }
            }
          }
        }
      } catch (e) {
        setErr(e.message);
        setGames([]);
      } finally {
        setLoad(false);
      }
    })();
    // eslint-disable-next-line
  }, [picked, sportList, marketKeys, refreshTick]);

  // Filtering before passing to OddsTable
  let filteredGames = games;
  if (debounced.trim()) {
    const q = debounced.toLowerCase();
    filteredGames = filteredGames.filter(g =>
      (g.home_team && g.home_team.toLowerCase().includes(q)) ||
      (g.away_team && g.away_team.toLowerCase().includes(q)) ||
      (g.sport_title && g.sport_title.toLowerCase().includes(q))
    );
  }
  // Date filter (local date)
  if (selectedDate) {
    filteredGames = filteredGames.filter(g => {
      const d = new Date(g.commence_time);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const local = `${y}-${m}-${day}`;
      return local === selectedDate;
    });
  }
  if (picked && picked.length && !picked.includes("ALL")) {
    filteredGames = filteredGames.filter(g => picked.includes(g.sport_key));
  }
  if (!showAllGames) {
    filteredGames = filteredGames.filter(g => {
      const start = new Date(g.commence_time).getTime();
      const now = Date.now();
      return !(now >= start && now < start + 3 * 3600 * 1000);
    });
  }

  return (
    <main className="page-wrap">
      <div className="market-container">
        <div className="filters-mobile filters-two-line">
          {/* Row 1: Search + Date */}
          <div className="filters-row two-line-row">
            <div className="filter-group search-ev" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                placeholder={"Search team / league"}
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ minWidth: 210 }}
              />
              <div className="filter-group">
                <span className="filter-label">Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Filter by date"
                  title="Filter by date"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Markets + Sports + Books */}
          <div className="filters-row two-line-row">
            <div className="filter-group" style={{ minWidth: 200 }}>
              <span className="filter-label">Markets</span>
            <SportMultiSelect
              list={marketOptions}
              selected={marketKeys}
              onChange={setMarketKeys}
              placeholderText="Choose markets…"
              allLabel="All Markets"
            />
            </div>
            <div className="filter-group" style={{ minWidth: 220 }}>
              <span className="filter-label">Sports</span>
              <SportMultiSelect
                list={sportList}
                selected={picked}
                onChange={setPicked}
                placeholderText="Choose sports…"
                allLabel="All Sports"
              />
            </div>
            <div className="filter-group" style={{ minWidth: 220 }}>
              <span className="filter-label">Books</span>
              <SportMultiSelect
                list={bookList}
                selected={selectedBooks}
                onChange={setSelectedBooks}
                placeholderText="Choose books…"
                allLabel="All Books"
              />
            </div>
          </div>

          {/* Row 3: Actions under dropdowns */}
          <div className="filters-row two-line-row actions-row">
            <div className="filter-group actions-left">
              <button type="button" className="btn btn-primary" onClick={() => setRefreshTick(Date.now())}>Refresh</button>
              <button type="button" className="btn btn-ghost" onClick={resetFilters}>Reset</button>
            </div>
            <div className="filter-group results-right">
              <span className="filters-count">Results: {filteredGames.length}</span>
            </div>
          </div>
        </div>
        <OddsTable
          games={filteredGames}
          pageSize={15}
          mode={"game"}
          bookFilter={selectedBooks}
          marketFilter={marketKeys}
          evMin={minEV === '' ? null : Number(minEV)}
          loading={loading}
          allCaps={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('caps') === '1'}
        />
      </div>
    </main>
  );
}
