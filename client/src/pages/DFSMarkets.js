// src/pages/DFSMarkets.jsx
import React, { useEffect, useMemo, useState } from "react";
import OddsTable from "../components/betting/OddsTable";
import SportMultiSelect from "../components/betting/SportMultiSelect";
import useDebounce from "../hooks/useDebounce";
import { withApiBase } from "../config/api";
import { secureFetch } from "../utils/security";
import { Button } from "../components/design10/ui/button";
import { Card } from "../components/design10/ui/card";

// Only these 3 DFS apps
const DFS_KEYS = ["prizepicks", "underdog", "pick6"];

const MARKET_MAP = {
  // Basketball
  basketball_nba: [
    "player_points","player_points_alternate",
    "player_assists","player_assists_alternate",
    "player_rebounds","player_rebounds_alternate",
    "player_threes","player_threes_alternate",
    "player_blocks","player_blocks_alternate",
    "player_steals","player_steals_alternate",
    "player_points_rebounds_assists","player_points_rebounds_assists_alternate"
  ],
  // Baseball
  baseball_mlb: [
    "player_hits","player_hits_alternate",
    "player_home_runs","player_home_runs_alternate",
    "player_total_bases","player_total_bases_alternate",
    "player_strikeouts","player_strikeouts_alternate",
    "player_rbis","player_rbis_alternate",
    "player_runs_scored","player_runs_scored_alternate"
  ],
  // Football (example set)
  americanfootball_nfl: [
    "player_pass_yards","player_pass_yards_alternate",
    "player_rush_yards","player_rush_yards_alternate",
    "player_reception_yards","player_reception_yards_alternate",
    "player_receptions","player_receptions_alternate",
    "player_anytime_td","player_anytime_td_alternate"
  ],
  // Hockey (example set)
  icehockey_nhl: [
    "player_points","player_points_alternate",
    "player_goals","player_goals_alternate",
    "player_assists","player_assists_alternate",
    "player_shots_on_goal","player_shots_on_goal_alternate"
  ]
};

// If sport not in map, still ask for some common ones
const DEFAULT_MARKETS = [
  "player_points","player_points_alternate",
  "player_assists","player_assists_alternate",
  "player_rebounds","player_rebounds_alternate"
];

const CONCURRENCY = 8;

export default function DFSMarkets() {
  const [sportList, setSportList] = useState([]);
  const [picked, setPicked] = useState(["americanfootball_nfl", "americanfootball_ncaaf"]);
  const [games, setGames] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState(null);
  const [quota] = useState({ remain: "–", used: "–" });
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD

  const debounced = useDebounce(query, 300);

  // ---- helpers ----
  const normalizeArray = (resp) => {
    if (Array.isArray(resp)) return resp;
    if (resp && typeof resp === "object") return Object.values(resp);
    return [];
  };

  const runLimited = async (max, items, job) => {
    const out = [];
    let i = 0;
    async function next() {
      const idx = i++;
      if (idx >= items.length) return;
      try {
        out[idx] = await job(items[idx]);
      } catch {
        out[idx] = null;
      }
      return next();
    }
    await Promise.all(Array.from({ length: max }, next));
    return out.filter(Boolean);
  };

  const getMarketsForSport = (sportKey) =>
    (MARKET_MAP[sportKey] || DEFAULT_MARKETS).join(",");

  const fetchSeedsForSport = async (sportKey) => {
    // Try /api/events first
    try {
      const { withApiBase } = require('../config/api');
      const base = withApiBase('');
      const ev = await fetch(`${base}/api/events?sport=${sportKey}`);
      if (ev.ok) {
        const data = await ev.json();
        const arr = normalizeArray(data).filter(e => e?.id && e?.sport_key);
        if (arr.length) return arr;
      }
    } catch (_) {}

    // Fallback: /api/odds-data (US region, h2h only) to harvest IDs
    try {
      const { withApiBase } = require('../config/api');
      const base = withApiBase('');
      const r = await fetch(
        `${base}/api/odds-data?sport=${sportKey}&regions=us&markets=h2h`
      );
      if (!r.ok) return [];
      const oddsArr = normalizeArray(await r.json());
      return oddsArr
        .filter(g => g?.id && g?.sport_key)
        .map(g => ({
          id: g.id,
          sport_key: g.sport_key,
          sport_title: g.sport_title,
          home_team: g.home_team,
          away_team: g.away_team,
          commence_time: g.commence_time
        }));
    } catch (_) {
      return [];
    }
  };

  // ---- 1) load sports ----
  useEffect(() => {
    (async () => {
      try {
        const { withApiBase } = require('../config/api');
        const base = withApiBase('');
        const r = await fetch(`${base}/api/sports`);
        if (!r.ok) {
          setSportList([{ key: "ALL", title: "All Sports" }]);
          return;
        }
        const list = await r.json();
        const arr = Array.isArray(list) ? list : [];
        const normalized = arr
          .filter(s => s && s.active)
          .map(s => ({
            ...s,
            title: (s.key === 'boxing_boxing') ? 'BOXING' : (s.title || s.key),
          }));
        const all = [{ key: "ALL", title: "All Sports" }, ...normalized];
        setSportList(all);
      } catch (e) {
        setSportList([{ key: "ALL", title: "All Sports" }]);
      }
    })();
  }, []);

  // ---- 2) load DFS props ----
  useEffect(() => {
    (async () => {
      try {
        setLoad(true);
        setErr(null);
        setGames([]);

        const keys = picked.includes("ALL")
          ? sportList.filter(s => s.key !== "ALL").map(s => s.key)
          : picked;

        if (!keys.length) {
          setLoad(false);
          return;
        }

        const seedsNested = await Promise.all(keys.map(k => fetchSeedsForSport(k)));
        const seeds = seedsNested.flat().filter(ev => ev?.id && ev?.sport_key);

        if (!seeds.length) {
          setGames([]);
          setLoad(false);
          return;
        }

        const eventsWithProps = await runLimited(CONCURRENCY, seeds, async (ev) => {
          const markets = getMarketsForSport(ev.sport_key); // include _alternate
          const base = withApiBase('');
          const eventDate = ev.commence_time ? new Date(ev.commence_time).toISOString().slice(0, 10) : null;
          if (!eventDate) return null;

          const params = new URLSearchParams({
            league: ev.sport_key,
            date: eventDate,
            game_id: ev.id,
            markets,
          });

          let response;
          try {
            response = await secureFetch(`${base}/api/player-props?${params.toString()}`, {
              credentials: 'include',
              headers: { Accept: 'application/json' },
            });
          } catch (err) {
            return null;
          }

          if (!response.ok) return null;

          let data;
          try {
            data = await response.json();
          } catch (_) {
            return null;
          }
          if (!Array.isArray(data?.items) || !data.items.length) return null;

          const booksMap = new Map();
          data.items.forEach((item) => {
            const bookKey = (item.book || '').toLowerCase();
            if (!bookKey) return;
            if (!booksMap.has(bookKey)) {
              booksMap.set(bookKey, {
                key: bookKey,
                title: item.book_label || bookKey,
                markets: new Map(),
              });
            }
            const bookEntry = booksMap.get(bookKey);
            const marketKey = item.market;
            if (!bookEntry.markets.has(marketKey)) {
              bookEntry.markets.set(marketKey, {
                key: marketKey,
                outcomes: [],
              });
            }
            bookEntry.markets.get(marketKey).outcomes.push({
              name: item.ou,
              description: item.player,
              player: item.player,
              price: item.price,
              point: item.line,
              url: item.url,
              link_available: item.link_available,
              is_latest: item.is_latest,
              is_active: item.is_active,
            });
          });

          const books = Array.from(booksMap.values()).map((book) => ({
            key: book.key,
            title: book.title,
            markets: Array.from(book.markets.values()).filter((mkt) => mkt.outcomes.length > 0),
          }));

          const dfsBooks = books.filter((bk) => DFS_KEYS.includes((bk.key || '').toLowerCase()));
          if (!dfsBooks.length) return null;

          return { ...ev, bookmakers: dfsBooks };
        });

        const ready = eventsWithProps.filter(Boolean);
        setGames(ready);
      } catch (e) {
        setErr(e.message || String(e));
        setGames([]);
      } finally {
        setLoad(false);
      }
    })();
  }, [picked, sportList]);

  // ---- client-side search ----
  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    let base = games;
    // Date filter (by local date)
    if (selectedDate) {
      base = base.filter(g => {
        const d = new Date(g.commence_time);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const local = `${y}-${m}-${day}`;
        return local === selectedDate;
      });
    }
    if (!q) return base;
    return base.filter(g =>
      (g.home_team && g.home_team.toLowerCase().includes(q)) ||
      (g.away_team && g.away_team.toLowerCase().includes(q)) ||
      (g.sport_title && g.sport_title.toLowerCase().includes(q)) ||
      (g.bookmakers || []).some(bk =>
        (bk.markets || []).some(m =>
          (m.outcomes || []).some(
            o =>
              (o.description && o.description.toLowerCase().includes(q)) ||
              (o.name && o.name.toLowerCase().includes(q))
          )
        )
      )
    );
  }, [games, debounced, selectedDate]);

  // ---- UI ----
  return (
    <main className="page-wrap">
      <div className="market-container">
        <div className="filters-mobile">
          <input
            placeholder="Search team / league / player"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            aria-label="Filter by date"
            title="Filter by date"
          />
          <SportMultiSelect
            list={sportList}
            selected={picked}
            onChange={setPicked}
          />
        </div>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
            <p>Loading DFS props…</p>
          </div>
        ) : error ? (
          <p style={{ color: "salmon", textAlign: "center" }}>
            DFS error: {error}
          </p>
        ) : filtered.length === 0 ? (
          <div className="odds-table-card">
            <div className="spinner-wrap" style={{ padding: "2em 0" }}>
              <p>No DFS props found for the current selection.</p>
              <p style={{ opacity: 0.7, marginTop: 6 }}>
                Tip: try NBA / MLB with game day slates, and ensure your backend has <code>ODDS_API_KEY</code>.
              </p>
            </div>
          </div>
        ) : (
          <OddsTable
            games={filtered}
            pageSize={15}
            mode="props"
            loading={false}
            initialSort={{ key: 'time', dir: 'asc' }}
            allCaps={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('caps') === '1'}
          />
        )}

        <small style={{ opacity: 0.7 }}>
          quota — remain {quota.remain} • used {quota.used}
        </small>
      </div>
    </main>
  );
}
