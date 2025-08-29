// src/components/OddsTable.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import "./OddsTable.css";

// --- Helper: Calculate Expected Value (EV) ---
function calculateEV(odds, fairLine) {
  if (!odds || !fairLine) return null;
  const toDec = o => (o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1);
  const userDec = toDec(odds);
  const fairDec = toDec(fairLine);
  const ev = ((userDec / fairDec) - 1) * 100;
  return ev;
}

// Convert American odds to implied probability (ignoring vig)
function americanToProb(odds) {
  const o = Number(odds);
  if (!o) return null;
  return o > 0 ? 100 / (o + 100) : (-o) / ((-o) + 100);
}

// Convert decimal odds to American odds
function decimalToAmerican(dec) {
  if (!dec || dec <= 1) return 0;
  return dec >= 2 ? Math.round((dec - 1) * 100) : Math.round(-100 / (dec - 1));
}

function median(nums) {
  const a = nums.slice().sort((x, y) => x - y);
  const n = a.length;
  if (!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

// Compute a de-vig consensus probability for the selected side by pairing both sides
// across books for the same market/point. Falls back to null if no valid pairs.
function consensusDevigProb(row) {
  try {
    const marketKey = row?.mkt?.key;
    const pointStr = String(row?.out?.point ?? "");
    const sideName = row?.out?.name; // For h2h: team name; for totals/spreads: "Over"/"Under"
    const game = row?.game;
    if (!game || !marketKey) return null;

    const isH2H = marketKey === "h2h";
    const isTotals = marketKey === "totals";
    const isSpreads = marketKey === "spreads";

    const pairs = [];
    (game.bookmakers || []).forEach(bk => {
      const mkt = (bk.markets || []).find(m => m.key === marketKey);
      if (!mkt || !mkt.outcomes) return;
      if (isH2H) {
        const home = mkt.outcomes.find(o => o && o.name === game.home_team);
        const away = mkt.outcomes.find(o => o && o.name === game.away_team);
        if (!home || !away) return;
        const pHome = americanToProb(home.price ?? home.odds);
        const pAway = americanToProb(away.price ?? away.odds);
        if (!(pHome > 0 && pHome < 1 && pAway > 0 && pAway < 1)) return;
        const denom = pHome + pAway;
        if (denom <= 0) return;
        const pSel = sideName === game.home_team ? (pHome / denom) : (pAway / denom);
        if (pSel > 0 && pSel < 1) pairs.push(pSel);
      } else if (isTotals || isSpreads) {
        const over = mkt.outcomes.find(o => o && o.name === "Over" && String(o.point ?? "") === pointStr);
        const under = mkt.outcomes.find(o => o && o.name === "Under" && String(o.point ?? "") === pointStr);
        if (!over || !under) return;
        const pOver = americanToProb(over.price ?? over.odds);
        const pUnder = americanToProb(under.price ?? under.odds);
        if (!(pOver > 0 && pOver < 1 && pUnder > 0 && pUnder < 1)) return;
        const denom = pOver + pUnder;
        if (denom <= 0) return;
        const pSel = sideName === "Under" ? (pUnder / denom) : (pOver / denom);
        if (pSel > 0 && pSel < 1) pairs.push(pSel);
      }
    });

    if (!pairs.length) return null;
    return median(pairs);
  } catch (_) {
    return null;
  }
}

function formatOdds(odds) {
  if (odds == null || odds === "") return "";
  const n = Number(odds);
  if (isNaN(n)) return odds;
  return n > 0 ? `+${n}` : `${n}`;
}

function formatLine(line, marketKey, mode = "game") {
  if (line == null || line === "") return "";
  const n = Number(line);
  if (isNaN(n)) return line;
  if (mode === "props") return n;
  if (marketKey === "totals" || marketKey === "TOTALS") return n;
  return n > 0 ? `+${n}` : `${n}`;
}

function formatMarket(key = "") {
  const k = String(key || "").toLowerCase();
  if (k === "h2h") return "MONEYLINE";
  if (k === "spreads") return "SPREAD";
  if (k === "totals") return "TOTALS";
  if (k.includes("alternate") && k.includes("spread")) return "ALT SPREAD";
  if (k.includes("alternate") && k.includes("total")) return "ALT TOTALS";
  if (k === "draw_no_bet") return "DRAW NO BET";
  if (k === "double_chance") return "DOUBLE CHANCE";
  if (k === "btts") return "BOTH TEAMS TO SCORE";
  if (k === "corners") return "CORNERS";
  if (k === "cards") return "CARDS";
  if (k === "first_half_moneyline") return "1H MONEYLINE";
  if (k === "first_half_spreads") return "1H SPREAD";
  if (k === "first_half_totals") return "1H TOTALS";
  if (k === "first_quarter_moneyline") return "1Q MONEYLINE";
  if (k === "first_quarter_spreads") return "1Q SPREAD";
  if (k === "first_quarter_totals") return "1Q TOTALS";
  if (k === "first_five_moneyline") return "F5 MONEYLINE";
  if (k === "first_five_spreads") return "F5 RUNLINE";
  if (k === "first_five_totals") return "F5 TOTALS";
  if (k === "team_totals") return "TEAM TOTALS";
  if (k === "team_totals_home") return "HOME TEAM TOTAL";
  if (k === "team_totals_away") return "AWAY TEAM TOTAL";
  if (k === "set_winner") return "SET WINNER";
  if (k === "game_handicap") return "GAME HANDICAP";
  if (k === "set_totals") return "SET TOTALS";
  if (k === "total_sets") return "TOTAL SETS";
  return key.replace("player_", "").toUpperCase();
}

// Compact market type for the main table Type column
function marketTypeLabel(key = "") {
  const k = String(key || "").toLowerCase();
  if (k === 'h2h' || k.endsWith('moneyline')) return 'ML';
  if (k.includes('spread')) return 'Spread';
  if (k.includes('total')) return 'Totals';
  if (k === 'draw_no_bet') return 'DNB';
  if (k === 'double_chance') return 'Double Chance';
  if (k === 'btts') return 'BTTS';
  return formatMarket(key);
}

// Clean bookmaker titles for display (e.g., remove ".ag")
function cleanBookTitle(title) {
  if (!title) return "";
  return String(title).replace(/\.?ag\b/gi, "").trim();
}

// Team nickname helper with small mapping and heuristics
const TEAM_NICKNAMES = {
  americanfootball_ncaaf: {
    'St. Francis (PA) Red Flash': 'Red Flash',
  },
};

function shortTeam(name = "", sportKey = "") {
  const n = String(name).trim();
  if (!n) return "";
  const mapped = TEAM_NICKNAMES[sportKey]?.[n];
  if (mapped) return mapped;
  const paren = n.lastIndexOf(')');
  if (paren !== -1 && paren + 1 < n.length) {
    const after = n.slice(paren + 1).trim();
    if (after) return after;
  }
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const prev = parts[parts.length - 2];
    const ADJ = new Set(['Red','Blue','Green','Black','White','Golden','Fighting','Crimson','Scarlet','Orange','Mean','Yellow','Purple','Silver','Gold','Cardinal','Tar',"Ragin'"]);
    if (ADJ.has(prev)) return `${prev} ${last}`;
  }
  return parts[parts.length - 1];
}

// Compact kickoff formatter for mobile; shows "Mon 7:30 PM" or just time if today
function formatKickoffShort(commence) {
  try {
    const d = new Date(commence);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
  // Always show minutes, even when :00 (e.g., 4:00 PM)
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) return time;
    const diffMs = d.getTime() - now.getTime();
    const withinWeek = diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
    if (withinWeek) {
      const day = d.toLocaleDateString([], { weekday: 'short' });
      return `${day} ${time}`;
    }
    // Farther than a week: show explicit date like "Aug 28th 7:30 PM"
    const month = d.toLocaleString([], { month: 'short' });
    const dayNum = d.getDate();
    const suffix = ((n) => {
      const v = n % 100;
      if (v >= 11 && v <= 13) return 'th';
      switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    })(dayNum);
    return `${month} ${dayNum}${suffix} ${time}`;
  } catch {
    return String(commence);
  }
}

function isLive(commence_time) {
  const start = new Date(commence_time).getTime();
  const now = Date.now();
  return now >= start && now < start + 3 * 3600 * 1000;
}

export default function OddsTable({
  games,
  mode = "game",
  pageSize = 15,
  loading = false,
  bookFilter = [], // array of bookmaker keys to target rows/EV; mini-table still shows all
  initialSort = { key: "ev", dir: "desc" }, // allow consumers to default-sort (e.g., by time)
  marketFilter = [], // array of market keys to include (e.g., ['h2h','spreads','totals'])
  evOnlyPositive = false, // if true, only show rows with EV > 0
  evMin = null, // if number, minimum EV percent threshold
  allCaps = false, // if true, render all table text uppercase for preview
}) {
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort || { key: "ev", dir: "desc" });
  const prevPriceRef = useRef({});
  const [priceDelta, setPriceDelta] = useState({});
  

  const toggleRow = key =>
    setExpandedRows(exp => ({ ...exp, [key]: !exp[key] }));

  function getRowsProps() {
    const rows = [];
    games?.forEach((game, gIdx) => {
      const seen = new Set();
      game.bookmakers?.forEach((bk, bIdx) => {
        bk.markets?.forEach((mkt, mIdx) => {
          mkt.outcomes?.forEach((out, oIdx) => {
            if (out.name === "Over") {
              const playerKey = `${out.description ?? ""}:${mkt.key}:${out.point}`;
              if (seen.has(playerKey)) return;
              seen.add(playerKey);
              let best = { ...out, price: Number.MIN_SAFE_INTEGER, book: "", bookmaker: bk, market: mkt };
              games.forEach(g =>
                g.bookmakers?.forEach(b => {
                  const bKey = (b.key || "").toLowerCase();
                  // Respect selected books, if provided
                  if (bookFilter.length && !bookFilter.includes(bKey)) return;
                  b.markets?.filter(m => m.key === mkt.key).forEach(m =>
                    m.outcomes?.filter(o =>
                      o.name === "Over" &&
                      (o.description ?? "") === (out.description ?? "") &&
                      String(o.point ?? "") === String(out.point ?? "")
                    ).forEach(o => {
                      if (Number(o.price ?? o.odds ?? 0) > Number(best.price ?? best.odds ?? 0)) {
                        // Ensure market/bookmaker reference matches the winning offer
                        best = { ...o, book: b.title, bookmaker: b, market: m };
                      }
                    })
                  );
                })
              );
              const allBooksForRow = games.flatMap((g, gi) =>
                g.bookmakers?.flatMap((b, bi) =>
                  b.markets?.filter(m => m.key === mkt.key).flatMap((m, mi) =>
                    m.outcomes?.filter(o =>
                      o.name === "Over" &&
                      (o.description ?? "") === (out.description ?? "") &&
                      String(o.point ?? "") === String(out.point ?? "")
                    ).map((o, oi) => ({
                      ...o,
                      book: b.title,
                      bookmaker: b,
                      market: m,
                      _rowId: `${g.id}:${m.key}:${o.description || o.name}:${o.point}:${gi}:${bi}:${mi}:${oi}`,
                    }))
                  )
                )
              );
              const baseKey = [game.id, mkt.key, out.description, out.point].join(":");
              const key = `${baseKey}:${gIdx}:${bIdx}:${mIdx}:${oIdx}`;
              rows.push({
                key,
                game,
                bk: best.bookmaker,
                mkt,
                out: best,
                allBooks: allBooksForRow,
              });
            }
          });
        });
      });
    });
    return rows;
  }

  // (For completeness: keep getRowsGame if you need sportsbook mode as well)
  function getRowsGame() {
    const rows = [];
    games?.forEach((game) => {
      const baseKeys = ["h2h", "spreads", "totals"];
      const keys = (marketFilter && marketFilter.length) ? marketFilter : baseKeys;

      keys.forEach((mktKey) => {
        const allMarketOutcomes = [];
        game.bookmakers?.forEach(bk => {
          const mkt = bk.markets?.find(m => m.key === mktKey);
          if (mkt && mkt.outcomes) {
            mkt.outcomes.forEach(out => {
              allMarketOutcomes.push({
                ...out,
                book: bk.title,
                bookmaker: bk,
                market: mkt,
              });
            });
          }
        });

        if (!allMarketOutcomes.length) return;

        // Narrow candidates to selected books if provided
        const candidates = allMarketOutcomes.filter(o =>
          !bookFilter.length || bookFilter.includes((o.bookmaker?.key || "").toLowerCase())
        );
        if (!candidates.length) return;

        if (mktKey === 'h2h') {
          // Create a row for each side (home/away), later we will keep the higher EV per game
          const sides = [game.home_team, game.away_team].filter(Boolean);
          sides.forEach(side => {
            const sideOffers = candidates.filter(o => (o.name === side));
            if (!sideOffers.length) return;
            const bestOffer = sideOffers.slice().sort((a, b) => Number(b.price ?? b.odds ?? 0) - Number(a.price ?? a.odds ?? 0))[0];
            const allBooksForRow = allMarketOutcomes
              .filter(o => (o.name === side || !o.name))
              .map((o, i) => ({ ...o, book: o.book, _rowId: `${game.id}:${mktKey}:${o.name || ''}:${o.point || ''}:${i}` }));
            const key = `${game.id}:${mktKey}:${side}:${bestOffer.point || ''}`;
            rows.push({ key, game, mkt: bestOffer.market, bk: bestOffer.bookmaker, out: bestOffer, allBooks: allBooksForRow });
          });
        } else {
          // For spreads/totals (and alternates): for each point, create one row per selection (e.g., Over/Under or each team)
          const byPoint = new Map();
          candidates.forEach(o => {
            const p = String(o.point ?? '');
            if (!byPoint.has(p)) byPoint.set(p, []);
            byPoint.get(p).push(o);
          });
          byPoint.forEach((list, p) => {
            // Group by selection name at this point
            const byName = new Map();
            list.forEach(o => {
              const nm = o.name || '';
              if (!byName.has(nm)) byName.set(nm, []);
              byName.get(nm).push(o);
            });
            byName.forEach((offers, nm) => {
              if (!offers.length) return;
              const bestOffer = offers.slice().sort((a, b) => Number(b.price ?? b.odds ?? 0) - Number(a.price ?? a.odds ?? 0))[0];
              const allBooksForRow = allMarketOutcomes
                .filter(o => String(o.point ?? '') === p && (o.name === nm || !o.name))
                .map((o, i) => ({ ...o, book: o.book, _rowId: `${game.id}:${mktKey}:${o.name || ''}:${p}:${i}` }));
              const key = `${game.id}:${mktKey}:${nm}:${p}`;
              rows.push({ key, game, mkt: bestOffer.market, bk: bestOffer.bookmaker, out: bestOffer, allBooks: allBooksForRow });
            });
          });
        }
      });
    });
    return rows;
  }

  const allRows = useMemo(() => (mode === "props" ? getRowsProps() : getRowsGame()), [games, mode, bookFilter, marketFilter]);

  // --- Sort by EV highest to lowest ---
  const getEV = row => {
    const userOdds = Number(row?.out?.price ?? row?.out?.odds ?? 0);
    if (!userOdds) return -999;

    // First try de-vig using both sides from the same book across the market
    const pDevig = consensusDevigProb(row);
    if (pDevig && pDevig > 0 && pDevig < 1) {
      const fairDec = 1 / pDevig;
      const fairAmerican = decimalToAmerican(fairDec);
      return calculateEV(userOdds, fairAmerican) ?? -999;
    }

    // Fallback: median implied probability across all books (non-de-vig)
    const probs = row.allBooks
      .map(b => americanToProb(b.price ?? b.odds))
      .filter(p => typeof p === "number" && p > 0 && p < 1);
    const consensusProb = median(probs);
    if (consensusProb && consensusProb > 0 && consensusProb < 1) {
      const fairDec = 1 / consensusProb;
      const fairAmerican = decimalToAmerican(fairDec);
      return calculateEV(userOdds, fairAmerican) ?? -999;
    }

    return -999;
  };
  const evMap = useMemo(() => {
    const m = new Map();
    allRows.forEach(r => {
      m.set(r.key, getEV(r));
    });
    return m;
  }, [allRows]);

  const sorters = {
    ev: (a, b) => ((evMap.get(b.key) ?? -999) - (evMap.get(a.key) ?? -999)),
    match: (a, b) => String(`${a.game.home_team} ${a.game.away_team}`).localeCompare(`${b.game.home_team} ${b.game.away_team}`),
    market: (a, b) => String(a.mkt?.key).localeCompare(String(b.mkt?.key)),
    outcome: (a, b) => String(a.out?.name ?? "").localeCompare(String(b.out?.name ?? "")),
    line: (a, b) => Number(a.out?.point ?? 0) - Number(b.out?.point ?? 0),
    book: (a, b) => cleanBookTitle(a.bk?.title ?? "").localeCompare(cleanBookTitle(b.bk?.title ?? "")),
    odds: (a, b) => Number(a.out?.price ?? a.out?.odds ?? 0) - Number(b.out?.price ?? b.out?.odds ?? 0),
    time: (a, b) => new Date(a.game?.commence_time || 0) - new Date(b.game?.commence_time || 0),
  };

  const sorter = sorters[sort.key] || sorters.ev;

  const filteredSortedRows = useMemo(() => {
    let rows = allRows;
    if (evOnlyPositive || (typeof evMin === 'number' && !Number.isNaN(evMin))) {
      rows = rows.filter(r => {
        const ev = evMap.get(r.key);
        if (ev == null || Number.isNaN(ev)) return false;
        if (evOnlyPositive && ev <= 0) return false;
        if (typeof evMin === 'number' && !Number.isNaN(evMin) && ev < evMin) return false;
        return true;
      });
    }
    // Keep only the line with the higher EV per (game, market, point) group
    const bestByGroup = new Map();
    const groupKey = (r) => {
      const mk = String(r?.mkt?.key || '').toLowerCase();
      const rawPt = r?.out?.point;
      // For spreads, group by absolute point so +7.5 and -7.5 are considered one bucket
      let ptKey;
      if (mk.includes('spread')) {
        const n = Number(rawPt);
        ptKey = Number.isFinite(n) ? Math.abs(n).toString() : String(rawPt ?? '');
      } else {
        ptKey = String(rawPt ?? '');
      }
      // Group h2h by game+market; others by game+market+normalizedPoint
      return mk === 'h2h' ? `${r.game.id}:${mk}` : `${r.game.id}:${mk}:${ptKey}`;
    };
    rows.forEach(r => {
      const gk = groupKey(r);
      const ev = evMap.get(r.key) ?? -999;
      const current = bestByGroup.get(gk);
      if (!current || ev > current.ev) {
        bestByGroup.set(gk, { row: r, ev });
      }
    });
    rows = Array.from(bestByGroup.values()).map(v => v.row);
    const sorted = rows.slice().sort((a, b) => (sort.dir === 'asc' ? -sorter(a, b) : sorter(a, b)));
    return sorted;
  }, [allRows, evOnlyPositive, evMin, sort.dir, sorter, evMap]);

  const totalPages = Math.ceil(filteredSortedRows.length / pageSize);
  const paginatedRows = useMemo(() => filteredSortedRows.slice((page - 1) * pageSize, page * pageSize), [filteredSortedRows, page, pageSize]);

  const pageNumbers = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pageNumbers.push(i);
  }

  useEffect(() => {
    setPage(1);
  }, [games, mode, pageSize, bookFilter, marketFilter, evOnlyPositive, evMin]);

  

  // Flash odds cell on changes
  useEffect(() => {
    const prev = prevPriceRef.current || {};
    const nextMap = {};
    const deltas = {};
    allRows.forEach(row => {
      const curr = Number(row?.out?.price ?? row?.out?.odds ?? 0);
      const prevVal = Number(prev[row.key] ?? 0);
      nextMap[row.key] = curr;
      if (prevVal && curr && curr !== prevVal) {
        deltas[row.key] = curr > prevVal ? 'up' : 'down';
      }
    });
    prevPriceRef.current = nextMap;
    if (Object.keys(deltas).length) {
      setPriceDelta(deltas);
      const t = setTimeout(() => setPriceDelta({}), 1000);
      return () => clearTimeout(t);
    }
  }, [allRows]);

  // ---- Loading State (skeleton) ----
  if (loading) {
    const cols = mode === 'props'
      ? ["EV %","Matchup","Player","O/U","Line","Market","Odds","Book"]
      : ["EV %","Sport","Match","Start","Type","Team","Line","Book","Odds",""];
    return (
      <div className="odds-table-card">
        <table className="odds-grid" aria-busy="true" aria-label="Loading odds">
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, r) => (
              <tr key={r} className="odds-row">
                {cols.map((_, ci) => (
                  <td key={ci}>
                    <div className="skeleton" style={{ height: '14px', width: ci === 0 ? '52px' : '100%', margin: '6px 0' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!allRows.length) {
    return (
      <div className="odds-table-card">
        <div className="spinner-wrap" style={{ padding: "2em 0" }}>
          <p>No bets found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`odds-table-card revamp${allCaps ? ' all-caps' : ''}`}>
      
      <table className="odds-grid" data-mode={mode}>
        <thead>
          <tr>
            <th
              className="ev-col sort-th"
              role="columnheader button"
              aria-sort={sort.key === 'ev' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
              onClick={() => setSort(s => ({ key: 'ev', dir: s.key === 'ev' && s.dir === 'desc' ? 'asc' : 'desc' }))}
            >
              <span className="sort-label">EV % <span className="sort-indicator">{sort.key === 'ev' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
            </th>
            {mode === "props" ? (
              <>
                <th>Matchup</th>
                <th>Player</th>
                <th>O/U</th>
                <th
                  className="sort-th"
                  role="columnheader button"
                  aria-sort={sort.key === 'line' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  onClick={() => setSort(s => ({ key: 'line', dir: s.key === 'line' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                >
                  <span className="sort-label">Line <span className="sort-indicator">{sort.key === 'line' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
                </th>
                <th>Market</th>
                <th
                  className="sort-th"
                  role="columnheader button"
                  aria-sort={sort.key === 'odds' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  onClick={() => setSort(s => ({ key: 'odds', dir: s.key === 'odds' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                >
                  <span className="sort-label">Odds <span className="sort-indicator">{sort.key === 'odds' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
                </th>
                <th
                  className="sort-th"
                  role="columnheader button"
                  aria-sort={sort.key === 'book' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  onClick={() => setSort(s => ({ key: 'book', dir: s.key === 'book' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                >
                  <span className="sort-label">Book <span className="sort-indicator">{sort.key === 'book' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
                </th>
              </>
            ) : (
              <>
                <th
                  className="sort-th"
                  role="columnheader"
                >
                  <span className="sort-label">Sport</span>
                </th>
                <th
                  className="sort-th"
                  role="columnheader button"
                  aria-sort={sort.key === 'match' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  onClick={() => setSort(s => ({ key: 'match', dir: s.key === 'match' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                >
                  <span className="sort-label">Match <span className="sort-indicator">{sort.key === 'match' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
                </th>
                <th
                  className="sort-th"
                  role="columnheader button"
                  aria-sort={sort.key === 'time' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  onClick={() => setSort(s => ({ key: 'time', dir: s.key === 'time' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                >
                  <span className="sort-label">Start <span className="sort-indicator">{sort.key === 'time' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
                </th>
                <th><span className="sort-label">Type</span></th>
                <th><span className="sort-label">Team</span></th>
                <th
                  className="sort-th"
                  role="columnheader button"
                  aria-sort={sort.key === 'line' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  onClick={() => setSort(s => ({ key: 'line', dir: s.key === 'line' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                >
                  <span className="sort-label">Line <span className="sort-indicator">{sort.key === 'line' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
                </th>
                <th
                  className="sort-th"
                  role="columnheader button"
                  aria-sort={sort.key === 'book' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  onClick={() => setSort(s => ({ key: 'book', dir: s.key === 'book' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                >
                  <span className="sort-label">Book <span className="sort-indicator">{sort.key === 'book' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
                </th>
                <th
                  className="sort-th"
                  role="columnheader button"
                  aria-sort={sort.key === 'odds' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  onClick={() => setSort(s => ({ key: 'odds', dir: s.key === 'odds' && s.dir === 'desc' ? 'asc' : 'desc' }))}
                >
                  <span className="sort-label">Odds <span className="sort-indicator">{sort.key === 'odds' ? (sort.dir === 'desc' ? '▼' : '▲') : ''}</span></span>
                </th>
                <th></th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, i) => {
            const ev = evMap.get(row.key);
            const evClass = ev && ev > 0 ? "ev-col positive" : "ev-col negative";
            const oddsChange = priceDelta[row.key];

            return (
              <React.Fragment key={row.key}>
                {mode === "props" ? (
                  <tr
                    className={`odds-row${expandedRows[row.key] ? " expanded" : ""}`}
                    onClick={() => toggleRow(row.key)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(row.key); } }}
                    tabIndex={0}
                    aria-expanded={!!expandedRows[row.key]}
                    style={{ cursor: "pointer" }}
                  >
                    <td data-label="EV %" className={evClass}>{typeof ev === "number" ? ev.toFixed(2) + "%" : ""}</td>
                    <td data-label="Matchup">
                      {row.game.home_team} vs {row.game.away_team}
                      <br />
                      <small>{formatKickoffShort(row.game.commence_time)}</small>
                    </td>
                    <td data-label="Player">{row.out.description}</td>
                    <td data-label="O/U">{row.out.name}</td>
                    <td data-label="Line">{row.out.point}</td>
                    <td data-label="Market">{formatMarket(row.mkt.key)}</td>
                    <td data-label="Odds" className={oddsChange ? (oddsChange === 'up' ? 'flash-up' : 'flash-down') : ''}>
                      {formatOdds(row.out.price)} {oddsChange === 'up' ? '▲' : oddsChange === 'down' ? '▼' : ''}
                    </td>
                    <td data-label="Book">{cleanBookTitle(row.bk?.title || row.out.book)}</td>
                  </tr>
                ) : (
                  <tr
                    className={`odds-row${expandedRows[row.key] ? " expanded" : ""}`}
                    onClick={() => toggleRow(row.key)}
                    style={{ cursor: "pointer" }}
                  >
                    <td data-label="EV %" className={evClass}>{typeof ev === "number" ? ev.toFixed(2) + "%" : ""}</td>
                    <td data-label="Sport">{row.game.sport_title || ''}</td>
                    <td data-label="Match">
                      {row.game.home_team} vs {row.game.away_team}
                    </td>
                    <td data-label="Start">
                      {isLive(row.game.commence_time) && (
                        <span style={{ color: "#ff5e5e", fontWeight: "bold", fontSize: "1em", marginRight: "0.4em" }}>🔴 LIVE</span>
                      )}
                      <small>{formatKickoffShort(row.game.commence_time)}</small>
                    </td>
                    <td data-label="Type">{marketTypeLabel(row.mkt.key)}</td>
                    <td data-label="Team">
                      {(row.mkt.key || '') === 'h2h' ? shortTeam(row.out.name, row.game.sport_key) :
                       (row.mkt.key || '').includes('spread') ? shortTeam(row.out.name, row.game.sport_key) :
                       (row.out.name || '')}
                    </td>
                    <td data-label="Line">{(row.mkt.key || '') === 'h2h' ? '' : formatLine(row.out.point, row.mkt.key, mode)}</td>
                    <td data-label="Book">{cleanBookTitle(row.bk.title)}</td>
                    <td data-label="Odds" className={oddsChange ? (oddsChange === 'up' ? 'flash-up' : 'flash-down') : ''}>
                      {formatOdds(row.out.price ?? row.out.odds ?? "")} {oddsChange === 'up' ? '▲' : oddsChange === 'down' ? '▼' : ''}
                    </td>
                    {/* pad to match header's trailing blank column */}
                    <td aria-hidden="true"></td>
                  </tr>
                )}

                {/* --- Mini-table: vertically stacked columns, centered --- */}
                {expandedRows[row.key] && row.allBooks.length > 0 && (
                  <tr>
                    <td colSpan={mode === 'props' ? 8 : 10}>
                      <div className="mini-table-oddsjam">
                        <div className="mini-table-row">
                          {(() => {
                            const toDec = (n) => {
                              const v = Number(n || 0);
                              if (!v) return 0;
                              return v > 0 ? (v / 100) + 1 : (100 / Math.abs(v)) + 1;
                            };
                            const MAX_COMPARE = 9; // best + up to 8 others
                            const allowed = (bookFilter && bookFilter.length)
                              ? new Set(bookFilter.map(k => String(k).toLowerCase()))
                              : null;
                            // Filter to selected books if any
                            const eligible = row.allBooks.filter(ob => {
                              const key = String(ob?.bookmaker?.key || "").toLowerCase();
                              return !allowed || allowed.has(key);
                            });
                            const pool = eligible.length ? eligible : row.allBooks;
                            // Unique by bookmaker key (defensive)
                            const seen = new Set();
                            const unique = [];
                            pool.forEach(ob => {
                              const k = String(ob?.bookmaker?.key || ob.book || "").toLowerCase();
                              if (!seen.has(k)) { seen.add(k); unique.push(ob); }
                            });
                            // Sort by best price (decimal odds desc)
                            const sorted = unique.slice().sort((a, b) => toDec(b.price ?? b.odds) - toDec(a.price ?? a.odds));
                            const limited = sorted.slice(0, MAX_COMPARE);
                            const bestScore = limited.length
                              ? Math.max(...limited.map(ob => toDec(ob.price ?? ob.odds)))
                              : -Infinity;
                            return limited.map((o, oi) => {
                              const currScore = toDec(o.price ?? o.odds);
                              const isBest = Math.abs(currScore - bestScore) < 1e-9;
                              return (
                                <div key={o._rowId || oi} className="mini-table-header-cell">
                                  <div className="mini-book-name" title={cleanBookTitle(o.book)}>{cleanBookTitle(o.book)}</div>
                                  <div className="mini-table-line">{o.point ?? ""}</div>
                                  <hr
                                    style={{
                                      width: "80%",
                                      margin: "0.4em auto 0.2em auto",
                                      border: 0,
                                      borderTop: "1.5px solid",
                                      borderTopColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                                    }}
                                  />
                                  <div className={`mini-table-odds-cell${isBest ? " best-odds" : ""}`}>
                                    {formatOdds(o.price ?? o.odds ?? "")}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* --- PAGINATION BAR --- */}
      {totalPages > 1 && (
        <div className="pagination-bar" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4em", margin: "2em 0" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "0.45em 1.2em",
              borderRadius: "8px",
              border: "none",
              background: page === 1 ? "#aaa" : "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              cursor: page === 1 ? "default" : "pointer",
              opacity: page === 1 ? 0.7 : 1,
            }}
          >
            Prev
          </button>
          {pageNumbers[0] > 1 && (
            <span style={{ padding: "0 0.7em" }}>...</span>
          )}
          {pageNumbers.map(num => (
            <button
              key={num}
              onClick={() => setPage(num)}
              style={{
                padding: "0.45em 1.1em",
                borderRadius: "8px",
                border: "none",
                background: num === page ? "var(--accent)" : "#222c",
                color: "#fff",
                fontWeight: 600,
                cursor: num === page ? "default" : "pointer",
                opacity: num === page ? 1 : 0.85,
              }}
              disabled={num === page}
            >
              {num}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <span style={{ padding: "0 0.7em" }}>...</span>
          )}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "0.45em 1.2em",
              borderRadius: "8px",
              border: "none",
              background: page === totalPages ? "#aaa" : "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              cursor: page === totalPages ? "default" : "pointer",
              opacity: page === totalPages ? 0.7 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
