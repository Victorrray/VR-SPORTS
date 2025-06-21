import React, { useEffect, useState } from "react";
import OddsTable from "../components/OddsTable";
import SportMultiSelect from "../components/SportMultiSelect";
import useDebounce from "../hooks/useDebounce";

// Which markets to show for main sportsbooks
const GAME_LINES = ["h2h", "spreads", "totals"];
// List of major US sportsbook keys (from odds API docs, **NOT** DFS)
const NON_DFS_BOOKMAKERS = [
  "fanduel", "draftkings", "betmgm", "caesars", "pointsbetus",
  "betrivers", "barstool", "betus", "wynnbet", "foxbet", "bet365", "superbook",
  // Add more as needed. Exclude prizepicks, underdog, etc.
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

export default function SportsbookMarkets() {
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

  // Fetch sport list
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

  // Fetch odds data for major sportsbooks
  useEffect(() => {
    (async () => {
      try {
        setLoad(true);
        const keys = picked.includes("ALL")
          ? sportList.filter(s => s.key !== "ALL").map(s => s.key)
          : picked;

        const calls = keys.map(k =>
          fetch(`${BASE_URL}/api/odds-data?sport=${k}&markets=${GAME_LINES.join(",")}`)
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

        // Filter bookmakers for NON_DFS_BOOKMAKERS only
        const filteredGames = gamesRaw.map(g => ({
          ...g,
          bookmakers: (g.bookmakers || []).filter(bk =>
            NON_DFS_BOOKMAKERS.includes((bk.key || "").toLowerCase())
          ),
        }))
        // Only include games with at least one valid sportsbook
        .filter(g => Array.isArray(g.bookmakers) && g.bookmakers.length > 0);

        setGames(filteredGames);
        setErr(null);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoad(false);
      }
    })();
    // eslint-disable-next-line
  }, [picked, sportList]);

  // Filtering before passing to OddsTable
  let filteredGames = games;
  if (debounced.trim()) {
    filteredGames = filteredGames.filter(
      g =>
        (g.home_team && g.home_team.toLowerCase().includes(debounced.toLowerCase())) ||
        (g.away_team && g.away_team.toLowerCase().includes(debounced.toLowerCase())) ||
        (g.sport_title && g.sport_title.toLowerCase().includes(debounced.toLowerCase()))
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

  return (
    <main className="page-wrap">
      <div className="market-container">
        <div className="filters-mobile">
          <input
            placeholder="Search team / league"
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
        <OddsTable
          games={filteredGames}
          pageSize={15}
          mode="game"
          loading={loading}
        />
        <small style={{ opacity: 0.7 }}>
          quota – remain {quota.remain} • used {quota.used}
        </small>
      </div>
    </main>
  );
}
