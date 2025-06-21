import React, { useEffect, useState } from "react";
import OddsTable from "../components/OddsTable";
import SportMultiSelect from "../components/SportMultiSelect";
import useDebounce from "../hooks/useDebounce";

// Major sportsbooks and DFS bookmaker keys
const SPORTSBOOK_BOOKMAKERS = [
  "fanduel", "draftkings", "betmgm", "caesars", "pointsbetus", "betrivers", "wynnbet", "barstool", "bet365", "unibet", "superbook"
];
const DFS_BOOKMAKERS = [
  "prizepicks", "underdogfantasy", "sleeper", "parlayplay", "betr_picks"
];

const GAME_LINES = ["h2h", "spreads", "totals"];
const MLB_PROP_MARKETS = [
  "h2h",
  "player_hits",
  "player_home_runs",
  "player_total_bases",
  "player_strikeouts",
  "player_rbis",
  "player_runs_scored"
];

const runLimited = (max, arr, fn) => {
  const out = [];
  let i = 0;
  const next = () =>
    i < arr.length
      ? fn(arr[i++]).then(r => {
          out.push(r);
          return next();
        })
      : Promise.resolve();
  return Promise.all(Array(max).fill(0).map(next)).then(() => out);
};

export default function MainMarkets() {
  const [tab, setTab] = useState("sportsbooks"); // "sportsbooks" or "dfs"
  const [sportList, setSportList] = useState([]);
  const [picked, setPicked] = useState(["basketball_nba"]);
  const [query, setQuery] = useState("");
  const [games, setGames] = useState([]);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState(null);
  const [showAllGames, setShowAllGames] = useState(false);

  const debounced = useDebounce(query, 300);
  const BASE_URL = process.env.REACT_APP_API_URL || "";

  // Get available sports
  useEffect(() => {
    fetch(`${BASE_URL}/api/sports`)
      .then(r => r.json())
      .then(list => {
        const allSports = [
          { key: "ALL", title: "All Sports" },
          ...list.filter(s => s.active),
        ];
        setSportList(allSports);
      });
    // eslint-disable-next-line
  }, []);

  // Fetch data based on tab
  useEffect(() => {
    (async () => {
      try {
        setLoad(true);
        setErr(null);

        // ---- SPORTSBOOKS TAB ----
        if (tab === "sportsbooks") {
          const keys = picked.includes("ALL")
            ? sportList.filter(s => s.key !== "ALL").map(s => s.key)
            : picked;

          const calls = keys.map(async sportKey => {
            const markets = (sportKey === "baseball_mlb") ? MLB_PROP_MARKETS : GAME_LINES;
            const r = await fetch(
              `${BASE_URL}/api/odds-data?sport=${sportKey}&markets=${markets.join(",")}`
            );
            return r.json();
          });

          let events = (await Promise.all(calls)).flat();

          // Filter for major sportsbooks
          events = events
            .map(game => ({
              ...game,
              bookmakers: (game.bookmakers || []).filter(bk =>
                SPORTSBOOK_BOOKMAKERS.includes(bk.key)
              )
            }))
            .filter(game => game.bookmakers.length > 0);

          setGames(events);
        }

        // ---- DFS TAB ----
        else if (tab === "dfs") {
          const keys = picked.includes("ALL")
            ? sportList.filter(s => s.key !== "ALL").map(s => s.key)
            : picked;

          // 1. Get events for each sport (use h2h, just for event IDs)
          const eventCalls = keys.map(async sportKey => {
            const r = await fetch(
              `${BASE_URL}/api/odds-data?sport=${sportKey}&markets=h2h`
            );
            return r.json();
          });
          const eventSeeds = (await Promise.all(eventCalls)).flat();

          // Normalize seeds to array of events with id/sport_key
          const validSeeds = Array.isArray(eventSeeds)
            ? eventSeeds.filter(ev => ev?.id && ev?.sport_key)
            : [];

          // 2. Fetch player props for each event, limited concurrency
          const props = await runLimited(8, validSeeds, ev =>
            fetch(
              `${BASE_URL}/api/player-props?sport=${ev.sport_key}&eventId=${ev.id}`
            )
              .then(r => r.json())
              .then(bks => {
                let bookmakers = [];
                if (Array.isArray(bks)) {
                  bookmakers = bks;
                } else if (bks.bookmakers) {
                  bookmakers = bks.bookmakers;
                } else if (bks.key && bks.markets) {
                  bookmakers = [bks];
                }
                // Only include DFS bookmakers
                bookmakers = bookmakers.filter(bk => DFS_BOOKMAKERS.includes(bk.key));
                if (!bookmakers.length) return null;
                return { ...ev, bookmakers };
              })
              .catch(() => null)
          );
          setGames(props.filter(ev => ev && Array.isArray(ev.bookmakers) && ev.bookmakers.length));
        }

      } catch (e) {
        setErr(e.message);
        setGames([]);
      } finally {
        setLoad(false);
      }
    })();
    // eslint-disable-next-line
  }, [picked, tab, sportList]);

  // ---- FILTERING for search, live toggle, etc ----
  let filteredGames = games;
  if (debounced.trim()) {
    filteredGames = filteredGames.filter(
      g =>
        (g.home_team && g.home_team.toLowerCase().includes(debounced.toLowerCase())) ||
        (g.away_team && g.away_team.toLowerCase().includes(debounced.toLowerCase())) ||
        (g.sport_title && g.sport_title.toLowerCase().includes(debounced.toLowerCase())) ||
        g.bookmakers.some(bk =>
          (bk.markets || []).some(mkt =>
            (mkt.outcomes || []).some(
              o =>
                (o.description && o.description.toLowerCase().includes(debounced.toLowerCase())) ||
                (o.name && o.name.toLowerCase().includes(debounced.toLowerCase()))
            )
          )
        )
    );
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

  if (loading)
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // --------- UI ---------
  return (
    <main className="page-wrap">
      <div className="market-container">
        {/* --------- TABS --------- */}
        <div
          style={{
            display: "flex",
            gap: "2.4em",
            justifyContent: "center",
            marginTop: "2em",
            marginBottom: "0.9em",
          }}
        >
          <button
            className={`tab-btn${tab === "sportsbooks" ? " active" : ""}`}
            style={{
              fontWeight: 700,
              background: tab === "sportsbooks" ? "#3355ff" : "#23263a",
              color: tab === "sportsbooks" ? "#fff" : "#bbcbff",
              border: "none",
              borderRadius: "8px 8px 0 0",
              fontSize: "1.09em",
              padding: "0.85em 2.3em",
              cursor: tab === "sportsbooks" ? "default" : "pointer",
              outline: "none",
              transition: "background 0.18s",
              boxShadow: tab === "sportsbooks" ? "0 6px 16px #3355ff18" : "none",
            }}
            onClick={() => setTab("sportsbooks")}
            disabled={tab === "sportsbooks"}
          >
            Sportsbooks
          </button>
          <button
            className={`tab-btn${tab === "dfs" ? " active" : ""}`}
            style={{
              fontWeight: 700,
              background: tab === "dfs" ? "#3355ff" : "#23263a",
              color: tab === "dfs" ? "#fff" : "#bbcbff",
              border: "none",
              borderRadius: "8px 8px 0 0",
              fontSize: "1.09em",
              padding: "0.85em 2.3em",
              cursor: tab === "dfs" ? "default" : "pointer",
              outline: "none",
              transition: "background 0.18s",
              boxShadow: tab === "dfs" ? "0 6px 16px #3355ff18" : "none",
            }}
            onClick={() => setTab("dfs")}
            disabled={tab === "dfs"}
          >
            DFS Apps
          </button>
        </div>

        {/* --------- FILTERS --------- */}
        <div className="filters-mobile">
          <input
            placeholder={`Search team / league / player`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <SportMultiSelect
            list={sportList}
            selected={picked}
            onChange={setPicked}
          />
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={showAllGames}
              onChange={() => setShowAllGames(val => !val)}
            />
            Show Live Games
          </label>
        </div>

        {/* --------- ODDS TABLE --------- */}
        <OddsTable
          games={filteredGames}
          pageSize={15}
          mode={"props"}
          loading={loading}
        />

        <small style={{ opacity: 0.7 }}>
          quota – remain {quota.remain} • used {quota.used}
        </small>
      </div>
    </main>
  );
}
