import React, { useEffect, useState } from "react";
import OddsTable from "../components/OddsTable";
import SportMultiSelect from "../components/SportMultiSelect";
import useDebounce from "../hooks/useDebounce";

// List of DFS app bookmaker keys from odds API docs
const DFS_BOOKMAKERS = [
  "prizepicks", "underdog", "parlayplay", "betr", "fliff", "sleeper"
];

const MLB_PROP_MARKETS = [
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

export default function DFSMarkets() {
  const [sportList, setSportList] = useState([]);
  const [picked, setPicked] = useState(["basketball_nba"]);
  const [query, setQuery] = useState("");
  const [propSport, setPropSport] = useState("basketball_nba");
  const [games, setGames] = useState([]);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState(null);

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
        if (!propSport && allSports.length > 1)
          setPropSport(allSports[1].key);
      });
    // eslint-disable-next-line
  }, []);

  // Fetch DFS player props
  useEffect(() => {
    (async () => {
      try {
        setLoad(true);

        // 1. Fetch all events for the selected sport
        const propMarkets = propSport === "baseball_mlb" ? MLB_PROP_MARKETS : ["h2h"];
        const seedsResp = await fetch(
          `${BASE_URL}/api/odds-data?sport=${propSport}&markets=${propMarkets.join(",")}`
        )
          .then(r => r.json())
          .catch(() => []);
        // Normalize response to array
        const seeds = Array.isArray(seedsResp)
          ? seedsResp
          : seedsResp && typeof seedsResp === "object"
            ? Object.values(seedsResp)
            : [];
        const validSeeds = seeds.filter(ev => ev?.id && ev?.sport_key);

        if (!validSeeds.length) {
          setGames([]);
          setLoad(false);
          return;
        }

        // 2. For each event, fetch player props, filter to DFS bookmakers only
        const props = await runLimited(8, validSeeds, ev =>
          fetch(
            `${BASE_URL}/api/player-props?sport=${ev.sport_key}&eventId=${ev.id}`
          )
            .then(r => r.json())
            .then(bks => {
              let dfsBooks;
              if (Array.isArray(bks)) {
                dfsBooks = bks.filter(bk =>
                  DFS_BOOKMAKERS.includes((bk.key || "").toLowerCase())
                );
              } else if (bks.bookmakers) {
                dfsBooks = bks.bookmakers.filter(bk =>
                  DFS_BOOKMAKERS.includes((bk.key || "").toLowerCase())
                );
              } else if (bks.key && bks.markets) {
                dfsBooks = DFS_BOOKMAKERS.includes((bks.key || "").toLowerCase())
                  ? [bks]
                  : [];
              } else {
                dfsBooks = [];
              }
              if (!dfsBooks.length) return null;
              return { ...ev, bookmakers: dfsBooks };
            })
            .catch(() => null)
        );

        setGames(
          props.filter(ev => Array.isArray(ev?.bookmakers) && ev.bookmakers.length)
        );
        setQuota({ remain: "—", used: "—" });
        setErr(null);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoad(false);
      }
    })();
    // eslint-disable-next-line
  }, [propSport]);

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

  return (
    <main className="page-wrap">
      <div className="market-container">
        {/* --------- Show Sport Picker --------- */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1.1em",
            marginTop: "1.4em",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <label htmlFor="propSport" style={{ fontWeight: 600 }}>
            Select Sport:
          </label>
          <select
            id="propSport"
            value={propSport}
            onChange={e => setPropSport(e.target.value)}
            style={{
              fontSize: "1rem",
              padding: "0.27rem 0.65rem",
              borderRadius: "8px",
              minWidth: 160,
              height: 40,
              background: "#222945",
              color: "#bbcbff",
              border: "1.5px solid #334c",
              boxShadow: "0 2px 7px #181b2344",
            }}
          >
            {sportList
              .filter(s => s.key !== "ALL")
              .map(s => (
                <option key={s.key} value={s.key}>
                  {s.title}
                </option>
              ))}
          </select>
          <input
            placeholder="Search team / league"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              marginLeft: "1em",
              flex: 2
            }}
          />
        </div>
        <OddsTable
          games={filteredGames}
          pageSize={15}
          mode="props"
          loading={loading}
        />
        <small style={{ opacity: 0.7 }}>
          quota – remain {quota.remain} • used {quota.used}
        </small>
      </div>
    </main>
  );
}
