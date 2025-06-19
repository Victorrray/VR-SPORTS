import React, { useEffect, useState } from "react";
import OddsTable from "../components/OddsTable";
import SportMultiSelect from "../components/SportMultiSelect";
import useDebounce from "../hooks/useDebounce";

const GAME_LINES = ["h2h", "spreads", "totals"];

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

export default function MainMarkets({ mode = "game" }) {
  const [sportList, setSportList] = useState([]);
  const [picked, setPicked] = useState(["basketball_nba"]);
  const [query, setQuery] = useState("");
  const [propSport, setPropSport] = useState("basketball_nba");
  const [games, setGames] = useState([]);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState(null);
  const [showAllGames, setShowAllGames] = useState(false);

  const debounced = useDebounce(query, 300);
  const searching = mode === "game" && debounced.trim().length > 0;

  // Use the env variable for all fetches!
  const BASE_URL = process.env.REACT_APP_API_URL || "";

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

  useEffect(() => {
    (async () => {
      try {
        setLoad(true);

        if (searching) {
          const r = await fetch(
            `${BASE_URL}/api/odds-data?sport=upcoming&markets=${GAME_LINES.join(",")}`
          );
          setGames(await r.json());
          setQuota({ remain: "—", used: "—" });
          setErr(null);
          setLoad(false);
          return;
        }

        if (mode === "game") {
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
          setGames((await Promise.all(calls)).flat());
        }

        if (mode === "props" && propSport) {
          const seeds = await fetch(
            `${BASE_URL}/api/odds-data?sport=${propSport}&markets=h2h`
          )
            .then(r => r.json())
            .catch(() => []);
          const validSeeds = seeds.filter(ev => ev?.id && ev?.sport_key);

          if (!validSeeds.length) {
            setGames([]);
            setLoad(false);
            return;
          }

          const props = await runLimited(8, validSeeds, ev =>
            fetch(
              `${BASE_URL}/api/player-props?sport=${ev.sport_key}&eventId=${ev.id}`
            )
              .then(r => r.json())
              .then(bks => {
                if (!bks) return null;
                if (Array.isArray(bks)) {
                  return { ...ev, bookmakers: bks };
                } else if (bks.bookmakers) {
                  return { ...ev, bookmakers: bks.bookmakers };
                } else if (bks.key && bks.markets) {
                  return { ...ev, bookmakers: [bks] };
                }
                return null;
              })
              .catch(() => null)
          );
          setGames(
            props.filter(ev => Array.isArray(ev?.bookmakers) && ev.bookmakers.length)
          );
          setQuota({ remain: "—", used: "—" });
        }

        setErr(null);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoad(false);
      }
    })();
    // eslint-disable-next-line
  }, [picked, mode, searching, debounced, sportList, propSport]);

  if (loading)
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <main className="page-wrap">
      <div className="market-container">
        {/* --------- Show Filters on Game Lines --------- */}
        {mode === "game" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.2rem",
              marginBottom: "1.4em",
              marginTop: "1.8em",
              justifyContent: "center"
            }}
          >
            <input
              placeholder="Search team / league"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: 3,
                minWidth: 260,
                fontSize: "1.06em",
                padding: "0.60em 1em",
                borderRadius: "10px",
                border: "1.5px solid #334c",
                marginRight: 0,
                background: "#23263a",
                color: "#fff",
                outline: "none",
                boxShadow: "0 2px 9px #181b2344",
                maxWidth: 420,
              }}
            />
            <SportMultiSelect
              list={sportList}
              selected={picked}
              onChange={setPicked}
              style={{
                minWidth: 160,
                maxWidth: 200,
                fontSize: "1.04em",
                borderRadius: "10px",
                height: 40,
                background: "#222945",
                color: "#bbcbff",
                border: "1.5px solid #334c",
                boxShadow: "0 2px 7px #181b2344",
              }}
            />
            <label
              style={{
                fontWeight: 600,
                fontSize: "1.03em",
                color: "#bbcbff",
                display: "flex",
                alignItems: "center",
                gap: "0.37em",
                marginLeft: 4,
                userSelect: "none",
                background: "#181b23",
                padding: "0.39em 0.85em 0.39em 0.68em",
                borderRadius: "9px"
              }}
            >
              <input
                type="checkbox"
                checked={showAllGames}
                onChange={() => setShowAllGames(val => !val)}
                style={{
                  accentColor: "#ff5151",
                  width: 19,
                  height: 19,
                  marginRight: 7,
                  verticalAlign: "middle",
                  cursor: "pointer",
                }}
              />
              Show Live Games
            </label>
          </div>
        )}

        {/* --------- Show Sport Picker on Props Tab --------- */}
        {mode === "props" && (
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
          </div>
        )}

        <OddsTable
          games={games}
          query={mode === "game" ? debounced : ""}
          pageSize={15}
          mode={mode}
          showAllGames={showAllGames}
        />

        <small style={{ opacity: 0.7 }}>
          quota – remain {quota.remain} • used {quota.used}
        </small>
      </div>
    </main>
  );
}
