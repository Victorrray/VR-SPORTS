import React, { useEffect, useMemo, useState } from "react";
import OddsTable from "../components/OddsTable";
import SportMultiSelect from "../components/SportMultiSelect";
import useDebounce from "../hooks/useDebounce";

// Which markets to show for main sportsbooks (game lines)
const GAME_LINES = ["h2h", "spreads", "totals"];
// DFS apps to exclude when showing sportsbooks
const DFS_KEYS = ["prizepicks", "underdog", "pick6"];
// Map API sport keys to common short names
const FRIENDLY_TITLES = {
  basketball_nba: "NBA",
  basketball_ncaab: "NCAAB",
  basketball_wnba: "WNBA",
  baseball_mlb: "MLB",
  americanfootball_nfl: "NFL",
  americanfootball_ncaaf: "NCAAF",
  icehockey_nhl: "NHL",
  soccer_epl: "EPL",
  soccer_uefa_champs_league: "UCL",
};
// Keep the sport picker short by default
const FEATURED_SPORTS = new Set([
  "basketball_nba",
  "baseball_mlb",
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "icehockey_nhl",
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
};

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
  const [onlyPositive, setOnlyPositive] = useState(false);
  const [minEV, setMinEV] = useState("");

  const resetFilters = () => {
    setSelectedDate("");
    setMarketKeys(["h2h", "spreads", "totals"]);
    setOnlyPositive(false);
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
        const mapped = listToUse
          .map(s => ({
            ...s,
            title: FRIENDLY_TITLES[s.key] || s.title || s.key,
          }));
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
          const calls = keys.map(k =>
            fetch(`${BASE_URL}/api/odds-data?sport=${k}&regions=us,uk,eu,au&markets=${GAME_LINES.join(",")}`)
              .then(async r => {
                if (r.ok && quota.remain === "–") {
                  setQuota({
                    remain: r.headers.get("x-requests-remaining") ?? "—",
                    used: r.headers.get("x-requests-used") ?? "—",
                  });
                }
                return r.json();
              })
              .catch(() => [])
          );
          const gamesRaw = (await Promise.all(calls)).flat();

          // Remove DFS apps (keep all other bookmakers across regions)
          const filteredGames = gamesRaw.map(g => ({
            ...g,
            bookmakers: (g.bookmakers || []).filter(bk => !DFS_KEYS.includes((bk.key || "").toLowerCase())),
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
          const booksArr = Array.from(seen.values()).sort((a, b) => a.title.localeCompare(b.title));
          setBookList(booksArr);
          // Default: select all books once on first load
          if (booksArr.length && selectedBooks.length === 0) {
            setSelectedBooks(booksArr.map(b => b.key));
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
  }, [picked, sportList]);

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
        <div className="filters-mobile">
          {/* Row 1: Primary search centered */}
          <div className="filters-row">
            <input
              placeholder={"Search team / league"}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* Row 2: Markets + EV controls (core decision filters) */}
          <div className="filters-row">
            <div className="filter-group">
              <span className="filter-label">Markets</span>
              <div className="chip-wrap">
                {[{k:'h2h', label:'Moneyline'}, {k:'spreads', label:'Spread'}, {k:'totals', label:'Totals'}].map(m => (
                  <button
                    key={m.k}
                    type="button"
                    onClick={() => setMarketKeys(prev => prev.includes(m.k) ? prev.filter(x => x !== m.k) : [...prev, m.k])}
                    className={`chip ${marketKeys.includes(m.k) ? 'active' : ''}`}
                  >{m.label}</button>
                ))}
              </div>
            </div>
            <div className="filter-group ev-group">
              <span className="filter-label">EV</span>
              <label className="filter-checkbox" style={{ marginRight: 8 }}>
                <input
                  type="checkbox"
                  checked={onlyPositive}
                  onChange={() => setOnlyPositive(v => !v)}
                />
                Only +EV
              </label>
              <input
                type="number"
                value={minEV}
                onChange={e => setMinEV(e.target.value)}
                placeholder="Min %"
                style={{ width: 90 }}
                aria-label="Minimum EV percent"
              />
            </div>
          </div>

          {/* Row 3: Date + Sports + Books + Live */}
          <div className="filters-row">
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
              />
            </div>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showAllGames}
                onChange={() => setShowAllGames(val => !val)}
              />
              Show Live Games
            </label>
          </div>

          {/* Row 4: Reset + Count */}
          <div className="filters-row">
            <div className="filters-actions">
              <button type="button" className="btn btn-ghost" onClick={resetFilters}>Reset</button>
            </div>
            <span className="filters-count">Games: {filteredGames.length}</span>
          </div>
        </div>
        <OddsTable
          games={filteredGames}
          pageSize={15}
          mode={"game"}
          bookFilter={selectedBooks}
          marketFilter={marketKeys}
          evOnlyPositive={onlyPositive}
          evMin={minEV === '' ? null : Number(minEV)}
          loading={loading}
        />
      </div>
    </main>
  );
}
