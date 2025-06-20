import React, { useState, useEffect } from "react";
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

function formatMarket(key) {
  if (key === "h2h") return "MONEYLINE";
  if (key === "spreads") return "SPREAD";
  if (key === "totals") return "TOTALS";
  return key.replace("player_", "").toUpperCase();
}

// --- Helper: Is Live? ---
function isLive(commence_time) {
  const start = new Date(commence_time).getTime();
  const now = Date.now();
  return now >= start && now < start + 3 * 3600 * 1000;
}

export default function OddsTable({
  games,
  query = "",
  mode = "game",
  pageSize = 15,
  showAllGames = false,
  loading = false,
}) {
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(1);

  // ---- always keep hooks at the top ----
  useEffect(() => {
    setPage(1);
  }, [games, query, mode, pageSize, showAllGames]);

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="odds-table-card">
        <div className="spinner-wrap">
          <div className="spinner" />
          <p>Loading odds…</p>
        </div>
      </div>
    );
  }

  function getRowsGame() {
    const rows = [];
    games?.forEach((game) => {
      ["h2h", "spreads", "totals"].forEach((mktKey) => {
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

        if (allMarketOutcomes.length) {
          let bestOutcome;
          if (mktKey === "h2h") {
            bestOutcome = allMarketOutcomes
              .filter(o => o.name === game.home_team)
              .sort((a, b) => Number(b.price ?? b.odds ?? 0) - Number(a.price ?? a.odds ?? 0))[0]
              || allMarketOutcomes[0];
          } else if (mktKey === "spreads" || mktKey === "totals") {
            bestOutcome = allMarketOutcomes
              .filter(o => o.name === "Over")
              .sort((a, b) => Number(b.price ?? b.odds ?? 0) - Number(a.price ?? a.odds ?? 0))[0]
              || allMarketOutcomes[0];
          }

          if (bestOutcome) {
            const allBooksForRow = allMarketOutcomes
              .filter(o =>
                (o.name === bestOutcome.name || !o.name) &&
                (String(o.point ?? "") === String(bestOutcome.point ?? ""))
              )
              .map((o, i) => ({
                ...o,
                book: o.book,
                _rowId: `${game.id}:${mktKey}:${o.name}:${o.point}:${i}`,
              }));

            const key = `${game.id}:${mktKey}:${bestOutcome.name}:${bestOutcome.point}`;
            rows.push({
              key,
              game,
              mkt: bestOutcome.market,
              bk: bestOutcome.bookmaker,
              out: bestOutcome,
              allBooks: allBooksForRow,
            });
          }
        }
      });
    });
    return rows;
  }

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
                g.bookmakers?.forEach(b =>
                  b.markets?.filter(m => m.key === mkt.key).forEach(m =>
                    m.outcomes?.filter(o =>
                      o.name === "Over" &&
                      (o.description ?? "") === (out.description ?? "") &&
                      String(o.point ?? "") === String(out.point ?? "")
                    ).forEach(o => {
                      if (Number(o.price ?? o.odds ?? 0) > Number(best.price ?? best.odds ?? 0)) {
                        best = { ...o, book: b.title, bookmaker: b, market: mkt };
                      }
                    })
                  )
                )
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

  let allRows = mode === "props" ? getRowsProps() : getRowsGame();

  // --- Sort by EV highest to lowest ---
  const getEV = row => {
    const prices = row.allBooks.map(b => Number(b.price ?? b.odds ?? 0));
    const bestOdds =
      prices.some(x => x > 0)
        ? Math.max(...prices.filter(x => x > 0))
        : Math.min(...prices.filter(x => x < 0));
    const fairLine =
      prices.some(x => x > 0)
        ? Math.min(...prices.filter(x => x > 0))
        : Math.max(...prices.filter(x => x < 0));
    return calculateEV(bestOdds, fairLine) ?? -999;
  };
  allRows = allRows.sort((a, b) => getEV(b) - getEV(a));

  // --- Filter logic for BOTH tabs ---
  let filteredRows = query
    ? allRows.filter(r => {
        if (mode === "props") {
          return (
            (r.out.description && r.out.description.toLowerCase().includes(query.toLowerCase())) ||
            (r.game && ((r.game.home_team + r.game.away_team).toLowerCase().includes(query.toLowerCase()))) ||
            (r.mkt && formatMarket(r.mkt.key).toLowerCase().includes(query.toLowerCase()))
          );
        } else {
          return (
            (r.game.home_team + r.game.away_team + r.game.sport_title)
              .toLowerCase()
              .includes(query.toLowerCase()) ||
            (r.out && r.out.name && r.out.name.toLowerCase().includes(query.toLowerCase())) ||
            (r.mkt && formatMarket(r.mkt.key).toLowerCase().includes(query.toLowerCase()))
          );
        }
      })
    : allRows;

  // --- Filter for live games ---
  if (!showAllGames) {
    filteredRows = filteredRows.filter(r => !isLive(r.game.commence_time));
  }

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const pageNumbers = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pageNumbers.push(i);
  }

  const toggleRow = key =>
    setExpandedRows(exp => ({ ...exp, [key]: !exp[key] }));

  // Only after all hooks are called: do your early return!
  if (!filteredRows.length) {
    return (
      <div className="odds-table-card">
        <div className="spinner-wrap" style={{ padding: "2em 0" }}>
          <p>No bets found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="odds-table-card">
      <table className="odds-grid">
        <thead>
          <tr>
            <th className="ev-col">EV % <span role="img" aria-label="value">💡</span></th>
            {mode === "props" ? (
              <>
                <th>MATCHUP</th>
                <th>PLAYER</th>
                <th>O/U</th>
                <th>LINE</th>
                <th>MARKET</th>
                <th>ODDS</th>
                <th>BOOK</th>
              </>
            ) : (
              <>
                <th>Match</th>
                <th>Market</th>
                <th>Outcome</th>
                <th>Line</th>
                {/* <th>Start</th> REMOVED */}
                <th>Book</th>
                <th>Odds</th>
                <th></th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, i) => {
            const prices = row.allBooks.map(b => Number(b.price ?? b.odds ?? 0));
            const bestOdds =
              prices.some(x => x > 0)
                ? Math.max(...prices.filter(x => x > 0))
                : Math.min(...prices.filter(x => x < 0));
            const fairLine =
              prices.some(x => x > 0)
                ? Math.min(...prices.filter(x => x > 0))
                : Math.max(...prices.filter(x => x < 0));
            const ev = calculateEV(bestOdds, fairLine);

            // Helper for EV color
            const evClass = ev > 0 ? "ev-col positive" : "ev-col negative";

            return (
              <React.Fragment key={row.key}>
                {mode === "props" ? (
                  <tr
                    className={`odds-row${expandedRows[row.key] ? " expanded" : ""}`}
                    onClick={() => toggleRow(row.key)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className={evClass}>{ev ? ev.toFixed(2) + "%" : ""}</td>
                    <td>
                      {row.game.home_team} vs {row.game.away_team}
                      <br />
                      <small>{new Date(row.game.commence_time).toLocaleString()}</small>
                    </td>
                    <td>{row.out.description}</td>
                    <td>{row.out.name}</td>
                    <td>{row.out.point}</td>
                    <td>{formatMarket(row.mkt.key)}</td>
                    <td>{formatOdds(row.out.price)}</td>
                    <td>{row.bk?.title || row.out.book}</td>
                  </tr>
                ) : (
                  <tr
                    className={`odds-row${expandedRows[row.key] ? " expanded" : ""}`}
                    onClick={() => toggleRow(row.key)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className={evClass}>{ev ? ev.toFixed(2) + "%" : ""}</td>
                    <td>
                      {row.game.home_team} vs {row.game.away_team}
                      <br />
                      {isLive(row.game.commence_time) && (
                        <span style={{
                          color: "#ff5e5e",
                          fontWeight: "bold",
                          fontSize: "1em",
                          marginRight: "0.6em"
                        }}>🔴 LIVE</span>
                      )}
                      <small>{new Date(row.game.commence_time).toLocaleString()}</small>
                    </td>
                    <td>{formatMarket(row.mkt.key)}</td>
                    <td>{row.out.name}</td>
                    <td>{formatLine(row.out.point, row.mkt.key, mode)}</td>
                    {/* <td>{new Date(row.game.commence_time).toLocaleString()}</td> REMOVED */}
                    <td>{row.bk.title}</td>
                    <td>{formatOdds(row.out.price ?? row.out.odds ?? "")}</td>
                  </tr>
                )}

                {/* --- Mini-table: vertically stacked columns, centered --- */}
                {expandedRows[row.key] && row.allBooks.length > 0 && (
                  <tr>
                    <td colSpan={mode === "props" ? 8 : 9}>
                      <div className="mini-table-oddsjam">
                        <div className="mini-table-row">
                          {row.allBooks.map((o, oi) => {
                            const oddsArr = row.allBooks.map(ob => Number(ob.price ?? ob.odds ?? 0));
                            const bestOdds =
                              oddsArr.some(x => x > 0)
                                ? Math.max(...oddsArr.filter(x => x > 0))
                                : Math.min(...oddsArr.filter(x => x < 0));
                            const isBest = Number(o.price ?? o.odds ?? 0) === bestOdds;
                            return (
                              <div key={o._rowId || oi} className="mini-table-header-cell">
                                <div>{o.book}</div>
                                <div className="mini-table-line">{o.point ?? ""}</div>
                                <hr style={{ width: "80%", margin: "0.4em auto 0.2em auto", border: 0, borderTop: "1.5px solid #3355ff22" }} />
                                <div className={`mini-table-odds-cell${isBest ? " best-odds" : ""}`}>
                                  {formatOdds(o.price ?? o.odds ?? "")}
                                </div>
                              </div>
                            );
                          })}
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.4em",
            margin: "2em 0",
          }}
        >
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "0.45em 1.2em",
              borderRadius: "8px",
              border: "none",
              background: page === 1 ? "#aaa" : "#3355ff",
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
                background: num === page ? "#3355ff" : "#222c",
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
              background: page === totalPages ? "#aaa" : "#3355ff",
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
