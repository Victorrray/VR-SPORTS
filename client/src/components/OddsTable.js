import React, { useState, useEffect, useRef, useMemo } from "react";
import "./OddsTable.css";

/* ---------- Helpers (unchanged core math) ---------- */
function calculateEV(odds, fairLine) {
  if (!odds || !fairLine) return null;
  const toDec = o => (o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1);
  const userDec = toDec(odds);
  const fairDec = toDec(fairLine);
  return ((userDec / fairDec) - 1) * 100;
}
function americanToProb(odds) {
  const o = Number(odds);
  if (!o) return null;
  return o > 0 ? 100 / (o + 100) : (-o) / ((-o) + 100);
}
function decimalToAmerican(dec) {
  if (!dec || dec <= 1) return 0;
  return dec >= 2 ? Math.round((dec - 1) * 100) : Math.round(-100 / (dec - 1));
}
function median(nums) {
  const a = nums.slice().sort((x, y) => x - y);
  const n = a.length; if (!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
function formatLine(line, marketKey, mode="game") {
  if (line == null || line === "") return "";
  const n = Number(line); if (isNaN(n)) return line;
  if (mode === "props") return n;
  if (String(marketKey).toLowerCase() === "totals") return n;
  return n > 0 ? `+${n}` : `${n}`;
}
function formatMarket(key="") {
  const k = String(key).toLowerCase();
  if (k === "h2h") return "MONEYLINE";
  if (k.includes("spread")) return "SPREAD";
  if (k.includes("total")) return "TOTALS";
  return key.replace("player_", "").toUpperCase();
}
function marketTypeLabel(key="") {
  const k = String(key).toLowerCase();
  if (k === "h2h" || k.endsWith("moneyline")) return "ML";
  if (k.includes("spread")) return "Spread";
  if (k.includes("total")) return "Totals";
  return formatMarket(key);
}
function cleanBookTitle(t){ return t ? String(t).replace(/\.?ag\b/gi,"").trim() : ""; }

const TEAM_NICKNAMES = { americanfootball_ncaaf: { 'St. Francis (PA) Red Flash': 'Red Flash' } };
function shortTeam(name="", sportKey="") {
  const n = String(name).trim(); if (!n) return "";
  const mapped = TEAM_NICKNAMES[sportKey]?.[n]; if (mapped) return mapped;
  const paren = n.lastIndexOf(')'); if (paren !== -1 && paren + 1 < n.length) {
    const after = n.slice(paren + 1).trim(); if (after) return after;
  }
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length-1], prev = parts[parts.length-2];
    const ADJ = new Set(['Red','Blue','Green','Black','White','Golden','Fighting','Crimson','Scarlet','Orange','Mean','Yellow','Purple','Silver','Gold','Cardinal','Tar',"Ragin'"]);
    if (ADJ.has(prev)) return `${prev} ${last}`;
  }
  return parts[parts.length-1];
}
function formatKickoffNice(commence){
  try{
    const d = new Date(commence);
    const date = d.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });
    const time = d.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
    return `${date} at ${time}`;
  }catch{return String(commence);}
}
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

/* ---------- De-vig helpers ---------- */
function consensusDevigProb(row) {
  try {
    const marketKey = row?.mkt?.key;
    const pointStr = String(row?.out?.point ?? "");
    const sideName = row?.out?.name;
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
        const denom = pHome + pAway; if (denom <= 0) return;
        const pSel = sideName === game.home_team ? (pHome / denom) : (pAway / denom);
        if (pSel > 0 && pSel < 1) pairs.push(pSel);
      } else if (isTotals || isSpreads) {
        const over = mkt.outcomes.find(o => o && o.name === "Over" && String(o.point ?? "") === pointStr);
        const under = mkt.outcomes.find(o => o && o.name === "Under" && String(o.point ?? "") === pointStr);
        if (!over || !under) return;
        const pOver = americanToProb(over.price ?? over.odds);
        const pUnder = americanToProb(under.price ?? under.odds);
        if (!(pOver > 0 && pOver < 1 && pUnder > 0 && pUnder < 1)) return;
        const denom = pOver + pUnder; if (denom <= 0) return;
        const pSel = sideName === "Under" ? (pUnder / denom) : (pOver / denom);
        if (pSel > 0 && pSel < 1) pairs.push(pSel);
      }
    });
    if (!pairs.length) return null;
    return median(pairs);
  } catch { return null; }
}
function devigPairCount(row) {
  try {
    const marketKey = row?.mkt?.key;
    const pointStr = String(row?.out?.point ?? "");
    const game = row?.game;
    if (!game || !marketKey) return 0;
    const isH2H = marketKey === "h2h";
    const isTotals = marketKey === "totals";
    const isSpreads = marketKey === "spreads";
    let count = 0;
    (game.bookmakers || []).forEach(bk => {
      const mkt = (bk.markets || []).find(m => m.key === marketKey);
      if (!mkt || !mkt.outcomes) return;
      if (isH2H) {
        const home = mkt.outcomes.find(o => o && o.name === game.home_team);
        const away = mkt.outcomes.find(o => o && o.name === game.away_team);
        const pHome = americanToProb(home?.price ?? home?.odds);
        const pAway = americanToProb(away?.price ?? away?.odds);
        if (pHome > 0 && pHome < 1 && pAway > 0 && pAway < 1) count += 1;
      } else if (isTotals || isSpreads) {
        const over = mkt.outcomes.find(o => o && o.name === "Over" && String(o.point ?? "") === pointStr);
        const under = mkt.outcomes.find(o => o && o.name === "Under" && String(o.point ?? "") === pointStr);
        const pOver = americanToProb(over?.price ?? over?.odds);
        const pUnder = americanToProb(under?.price ?? under?.odds);
        if (pOver > 0 && pOver < 1 && pUnder > 0 && pUnder < 1) count += 1;
      }
    });
    return count;
  } catch { return 0; }
}
function uniqueBookCount(row) {
  try {
    const set = new Set();
    (row.allBooks || []).forEach(b => {
      const key = String(b?.bookmaker?.key || b?.book || '').toLowerCase();
      if (key) set.add(key);
    });
    return set.size;
  } catch { return 0; }
}

export default function OddsTable({
  games,
  mode = "game",
  pageSize = 15,
  loading = false,
  error = null,
  oddsFormat: oddsFormatProp = null,
  bookFilter = [],
  initialSort = { key: "ev", dir: "desc" },
  marketFilter = [],
  evOnlyPositive = false,
  evMin = null,
  allCaps = false,
}) {
  
  // My Picks functionality
  const addToPicks = (row, book, isHome) => {
    const pick = {
      id: `${row.key}-${book?.bookmaker?.key || book?.book}-${Date.now()}`,
      gameId: row.game.id,
      homeTeam: row.game.home_team,
      awayTeam: row.game.away_team,
      market: formatMarket(row.mkt?.key || ''),
      selection: row.out.name,
      odds: row.out.price || row.out.odds,
      bookmaker: cleanBookTitle(book?.book || book?.bookmaker?.title),
      line: row.out.point,
      commenceTime: row.game.commence_time,
      sport: getSportLeague(row.game.sport_key).sport,
      league: getSportLeague(row.game.sport_key).league,
      dateAdded: new Date().toISOString(),
      status: 'pending',
      stake: 0,
      notes: ''
    };
    
    const existingPicks = JSON.parse(localStorage.getItem('myPicks') || '[]');
    const updatedPicks = [...existingPicks, pick];
    localStorage.setItem('myPicks', JSON.stringify(updatedPicks));
    
    // Show success feedback
    const button = document.querySelector(`[data-pick-id="${pick.id}"]`);
    if (button) {
      button.textContent = '✓';
      button.style.background = 'var(--success)';
      setTimeout(() => {
        button.textContent = '+';
        button.style.background = '';
      }, 1500);
    }
  };
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort || { key: "ev", dir: "desc" });
  const prevPriceRef = useRef({});
  const [priceDelta, setPriceDelta] = useState({});
  const [oddsFormatState, setOddsFormat] = useState(() => {
    if (typeof window === 'undefined') return 'american';
    return localStorage.getItem('oddsFormat') || 'american';
  });

  useEffect(() => {
    if (oddsFormatProp) return;
    if (typeof window !== 'undefined') localStorage.setItem('oddsFormat', oddsFormatState);
  }, [oddsFormatProp, oddsFormatState]);

  const currentOddsFormat = oddsFormatProp || oddsFormatState;
  const toDecimal = (o) => {
    const n = Number(o);
    if (!Number.isFinite(n) || n === 0) return null;
    return n > 0 ? (n / 100) + 1 : (100 / Math.abs(n)) + 1;
  };
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const americanToFractional = (o) => {
    const n = Number(o);
    if (!Number.isFinite(n) || n === 0) return null;
    const num = n > 0 ? Math.round(Math.abs(n)) : 100;
    const den = n > 0 ? 100 : Math.round(Math.abs(n));
    const g = gcd(num, den) || 1;
    return `${num / g}/${den / g}`;
  };
  const formatByPreference = (o) => {
    if (o == null || o === "") return "";
    const n = Number(o);
    if (!Number.isFinite(n)) return String(o);
    if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
    if (currentOddsFormat === 'decimal') {
      const d = toDecimal(n); return d ? d.toFixed(2) : '';
    }
    if (currentOddsFormat === 'fractional') {
      const f = americanToFractional(n); return f || '';
    }
    return n > 0 ? `+${n}` : `${n}`;
  };

  const toggleRow = key => setExpandedRows(exp => ({ ...exp, [key]: !exp[key] }));

  /* ---------- Build rows (game mode) ---------- */
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
              allMarketOutcomes.push({ ...out, book: bk.title, bookmaker: bk, market: mkt });
            });
          }
        });
        if (!allMarketOutcomes.length) return;

        const candidates = allMarketOutcomes.filter(o =>
          !bookFilter.length || bookFilter.includes((o.bookmaker?.key || "").toLowerCase())
        );
        if (!candidates.length) return;

        if (mktKey === 'h2h') {
          [game.home_team, game.away_team].forEach(side => {
            if (!side) return;
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
          const byPoint = new Map();
          candidates.forEach(o => {
            const p = String(o.point ?? '');
            if (!byPoint.has(p)) byPoint.set(p, []);
            byPoint.get(p).push(o);
          });
          byPoint.forEach((list, p) => {
            const byName = new Map();
            list.forEach(o => {
              const nm = o.name || '';
              if (!byName.has(nm)) byName.set(nm, []);
              byName.get(nm).push(o);
            });
            byName.forEach((offers, nm) => {
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
  const allRows = useMemo(() => (mode === "props" ? [] : getRowsGame()), [games, mode, bookFilter, marketFilter]);

  /* ---------- EV / fair maps ---------- */
  const getEV = row => {
    const userOdds = Number(row?.out?.price ?? row?.out?.odds ?? 0);
    if (!userOdds) return null;
    const pDevig = consensusDevigProb(row);
    const pairCnt = devigPairCount(row);
    if (pDevig && pDevig > 0 && pDevig < 1 && pairCnt > 4) {
      const fairDec = 1 / pDevig;
      return calculateEV(userOdds, decimalToAmerican(fairDec));
    }
    const probs = row.allBooks.map(b => americanToProb(b.price ?? b.odds)).filter(p => typeof p === "number" && p > 0 && p < 1);
    const consensusProb = median(probs);
    const uniqCnt = uniqueBookCount(row);
    if (consensusProb && consensusProb > 0 && consensusProb < 1 && uniqCnt > 4) {
      const fairDec = 1 / consensusProb;
      return calculateEV(userOdds, decimalToAmerican(fairDec));
    }
    return null;
  };
  const evMap = useMemo(() => {
    const m = new Map();
    allRows.forEach(r => m.set(r.key, getEV(r)));
    return m;
  }, [allRows]);

  const fairDevigMap = useMemo(() => {
    const m = new Map();
    allRows.forEach(r => {
      const p = consensusDevigProb(r);
      const pairCnt = devigPairCount(r);
      if (p && p > 0 && p < 1 && pairCnt > 4) {
        const fairDec = 1 / p;
        m.set(r.key, decimalToAmerican(fairDec));
      } else {
        m.set(r.key, null);
      }
    });
    return m;
  }, [allRows]);

  /* ---------- sorting / paging ---------- */
  const sorters = {
    ev: (a, b) => ((evMap.get(b.key) ?? -999) - (evMap.get(a.key) ?? -999)),
    match: (a, b) => String(`${a.game.home_team} ${a.game.away_team}`).localeCompare(`${b.game.home_team} ${b.game.away_team}`),
    line: (a, b) => Number(a.out?.point ?? 0) - Number(b.out?.point ?? 0),
    book: (a, b) => cleanBookTitle(a.bk?.title ?? "").localeCompare(cleanBookTitle(b.bk?.title ?? "")),
    odds: (a, b) => Number(a.out?.price ?? a.out?.odds ?? 0) - Number(b.out?.price ?? b.out?.odds ?? 0),
    time: (a, b) => new Date(a.game?.commence_time || 0) - new Date(b.game?.commence_time || 0),
    market: (a, b) => String(a.mkt?.key).localeCompare(String(b.mkt?.key)),
  };
  const sorter = sorters[sort.key] || sorters.ev;

  let rows = useMemo(() => {
    let r = allRows;
    if (evOnlyPositive || (typeof evMin === 'number' && !Number.isNaN(evMin))) {
      r = r.filter(row => {
        const ev = evMap.get(row.key);
        if (ev == null || Number.isNaN(ev)) return false;
        if (evOnlyPositive && ev <= 0) return false;
        if (typeof evMin === 'number' && ev < evMin) return false;
        return true;
      });
    }
    // keep only best EV per game/market/point bucket
    const bestBy = new Map();
    const groupKey = (r) => {
      const mk = String(r?.mkt?.key || '').toLowerCase();
      const rawPt = r?.out?.point;
      const ptKey = mk.includes('spread')
        ? (Number.isFinite(Number(rawPt)) ? Math.abs(Number(rawPt)).toString() : String(rawPt ?? ''))
        : String(rawPt ?? '');
      return mk === 'h2h' ? `${r.game.id}:${mk}` : `${r.game.id}:${mk}:${ptKey}`;
    };
    r.forEach(rr => {
      const gk = groupKey(rr);
      const ev = evMap.get(rr.key) ?? -999;
      const cur = bestBy.get(gk);
      if (!cur || ev > cur.ev) bestBy.set(gk, { row: rr, ev });
    });
    r = Array.from(bestBy.values()).map(v => v.row);
    return r.slice().sort((a, b) => (sort.dir === 'asc' ? -sorter(a, b) : sorter(a, b)));
  }, [allRows, evOnlyPositive, evMin, sort.dir, sorter, evMap]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const paginatedRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize]);

  useEffect(() => setPage(1), [games, mode, pageSize, bookFilter, marketFilter, evOnlyPositive, evMin]);

  useEffect(() => {
    const prev = prevPriceRef.current || {};
    const nextMap = {}, deltas = {};
    allRows.forEach(row => {
      const curr = Number(row?.out?.price ?? row?.out?.odds ?? 0);
      const prevVal = Number(prev[row.key] ?? 0);
      nextMap[row.key] = curr;
      if (prevVal && curr && curr !== prevVal) deltas[row.key] = curr > prevVal ? 'up' : 'down';
    });
    prevPriceRef.current = nextMap;
    if (Object.keys(deltas).length) {
      setPriceDelta(deltas);
      const t = setTimeout(() => setPriceDelta({}), 900);
      return () => clearTimeout(t);
    }
  }, [allRows]);

  /* ---------- Render ---------- */
  if (loading) {
    const cols = ["EV %","Match","Team","Type","Line","Book","Odds","De-Vig",""];
    return (
      <div className="odds-table-card">
        <table className="odds-grid" aria-busy="true" aria-label="Loading odds">
          <thead><tr>{cols.map((c,i)=><th key={i}>{c}</th>)}</tr></thead>
          <tbody>{Array.from({length:6}).map((_,r)=>(<tr key={r} className="odds-row">{cols.map((__,ci)=>(<td key={ci}><div className="skeleton" style={{height:'14px',width:ci===0?'52px':'100%',margin:'6px 0'}}/></td>))}</tr>))}</tbody>
        </table>
      </div>
    );
  }
  if (!allRows.length) return (
    <div className="odds-table-card">
      <div className="spinner-wrap" style={{ padding:"2em 0" }}><p>No bets found.</p></div>
    </div>
  );

  return (
    <div className={`odds-table-card revamp${allCaps ? ' all-caps' : ''}`}>
      {/* format toggle (uncontrolled) */}
      {!oddsFormatProp && (
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:8 }}>
          <span style={{ opacity:.8, fontWeight:700, fontSize:'0.92em' }}>Odds:</span>
          {['american','decimal','fractional'].map(fmt => (
            <button key={fmt} type="button" onClick={()=>setOddsFormat(fmt)}
              style={{ padding:'4px 10px', borderRadius:8, border:'1px solid #334c',
                background: (oddsFormatState===fmt)?'var(--accent)':'#1c2238',
                color:(oddsFormatState===fmt)?'#fff':'#e7ecff', fontWeight:700 }}>
              {fmt[0].toUpperCase()+fmt.slice(1)}
            </button>
          ))}
        </div>
      )}

      <table className="odds-grid" data-mode={mode}>
        <thead>
          <tr>
            <th className="ev-col sort-th" onClick={()=>setSort(s=>({ key:'ev', dir:s.key==='ev'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">EV % <span className="sort-indicator">{sort.key==='ev'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'match', dir:s.key==='match'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Match <span className="sort-indicator">{sort.key==='match'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th>Team</th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'line', dir:s.key==='line'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Line <span className="sort-indicator">{sort.key==='line'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'book', dir:s.key==='book'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Book <span className="sort-indicator">{sort.key==='book'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th className="sort-th" onClick={()=>setSort(s=>({ key:'odds', dir:s.key==='odds'&&s.dir==='desc'?'asc':'desc' }))}>
              <span className="sort-label">Odds <span className="sort-indicator">{sort.key==='odds'?(sort.dir==='desc'?'▼':'▲'):''}</span></span>
            </th>
            <th>De-Vig</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row) => {
            const ev = evMap.get(row.key);
            const fair = fairDevigMap.get(row.key);
            const oddsChange = priceDelta[row.key];

            return (
              <React.Fragment key={row.key}>
                {/* Desktop / tablet row (unchanged) */}
                <tr className={`odds-row${expandedRows[row.key] ? " expanded" : ""}`} onClick={()=>toggleRow(row.key)} style={{ cursor:"pointer" }}>
                  <td className={`ev-col ${ev && ev > 0 ? 'positive' : 'negative'}`}>
                    <div className="ev-col-content">
                      {typeof ev === "number" ? (<span className="ev-chip">{ev.toFixed(2)}%</span>) : ""}
                      <button 
                        className="desktop-add-pick-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToPicks(row, { bookmaker: row.bk, book: row.bk?.title });
                        }}
                        title="Add to My Picks"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ textAlign:'left', display:'flex', flexDirection:'column', gap:2 }}>
                      <span style={{ opacity:.8, fontSize:'0.92em' }}>{formatKickoffNice(row.game.commence_time)}</span>
                      <span style={{ fontWeight:800 }}>{row.game.home_team} vs {row.game.away_team}</span>
                      <span style={{ opacity:.9 }}>
                        {(() => { const { sport, league } = getSportLeague(row.game.sport_key, row.game.sport_title); return `${sport} | ${league}`; })()}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', flexDirection:'column', gap:2, textAlign:'left' }}>
                      <span style={{ fontWeight:800 }}>
                        {(row.mkt.key || '') === 'h2h'
                          ? shortTeam(row.out.name, row.game.sport_key)
                          : (row.out.name || '')}
                      </span>
                      <span style={{ opacity:.9 }}>
                        {formatMarket(row.mkt?.key || '')}
                      </span>
                    </div>
                  </td>
                  <td>{(row.mkt.key || '') === 'h2h' ? '' : formatLine(row.out.point, row.mkt.key, 'game')}</td>
                  <td>{cleanBookTitle(row.bk.title)}</td>
                  <td className={oddsChange ? (oddsChange === 'up' ? 'flash-up' : 'flash-down') : ''}>
                    <span className="odds-main odds-best">
                      {(() => {
                        const n = Number(row.out.price ?? row.out.odds ?? 0);
                        if (oddsFormatState === 'american') return n > 0 ? `+${n}` : `${n}`;
                        if (oddsFormatState === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                        const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                        const den = n > 0 ? 100 : Math.round(Math.abs(n));
                        const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                        return `${num/g}/${den/g}`;
                      })()}
                    </span>
                    {/* Desktop subtext retained; mobile hides via CSS */}
                    <div className="mobile-subtext">
                      {cleanBookTitle(row.bk?.title)}
                      {(row.mkt.key || '') !== 'h2h' && (row.out.point != null && row.out.point !== '') ? ` • ${formatLine(row.out.point, row.mkt.key, 'game')}` : ''}
                      {fair != null ? ` • Fair ${(() => {
                        const n = Number(fair);
                        if (oddsFormatState === 'american') return n > 0 ? `+${n}` : `${n}`;
                        if (oddsFormatState === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                        const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                        const den = n > 0 ? 100 : Math.round(Math.abs(n));
                        const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                        return `${num/g}/${den/g}`;
                      })()}` : ''}
                    </div>
                  </td>
                  <td>{fair != null ? (Number(fair) > 0 ? `+${fair}` : `${fair}`) : ''}</td>
                  <td aria-hidden="true"></td>
                </tr>

                {/* ----- Mobile card (click to expand) ----- */}
                <tr className="mobile-card-row" aria-hidden={false}>
                  <td colSpan={8}>
                    <div
                      className={`mobile-odds-card as-button ${expandedRows[row.key] ? 'expanded' : ''}`}
                      onClick={()=>toggleRow(row.key)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e)=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); toggleRow(row.key); } }}
                    >
                      <div className="mob-top">
                        <div className="mob-top-left">
                          <div className="mob-match-title">
                            <div className="team-line">{row.game.home_team}</div>
                            <div className="team-line">{row.game.away_team}</div>
                          </div>
                          <div className="mob-meta">
                            {formatKickoffNice(row.game.commence_time)} • {(() => {
                              const { sport, league } = getSportLeague(row.game.sport_key, row.game.sport_title);
                              return `${sport} | ${league}`;
                            })()}
                          </div>
                        </div>
                        <div className="mob-ev-section">
                          <div className={`mob-ev ${ev && ev > 0 ? 'pos' : 'neg'}`}>
                            {typeof ev === 'number' ? `${ev.toFixed(2)}%` : ''}
                          </div>
                          <button 
                            className="mob-add-pick-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToPicks(row, { bookmaker: row.bk, book: row.bk?.title });
                            }}
                            title="Add to My Picks"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Team name - now appears first */}
                      <div className="mob-team">
                        {String(row.mkt?.key || '').includes('total')
                          ? '' // No team name for totals
                          : (() => {
                              const teamName = (row.mkt.key || '') === 'h2h' 
                                ? shortTeam(row.out.name, row.game.sport_key)
                                : shortTeam(row.out.name, row.game.sport_key);
                              
                              // Check if both teams have the same short name
                              const homeShort = shortTeam(row.game.home_team, row.game.sport_key);
                              const awayShort = shortTeam(row.game.away_team, row.game.sport_key);
                              
                              if (homeShort === awayShort && teamName === homeShort) {
                                // Add home/away indicator when teams have same name
                                const isHome = row.out.name === row.game.home_team;
                                return `${teamName} ${isHome ? '(H)' : '(A)'}`;
                              }
                              
                              return teamName;
                            })()}
                      </div>

                      {/* Market type and line - now appears below team */}
                      <div className="mob-market-row">
                        <div className="mob-market">
                          {formatMarket(row.mkt?.key || '')}
                          {String(row.mkt?.key || '').includes('total') 
                            ? ` ${row.out.name || ''}` 
                            : ''}
                        </div>
                        <div className="mob-line">{(row.mkt.key || '') === 'h2h' ? '—' : formatLine(row.out.point, row.mkt.key, 'game')}</div>
                      </div>

                      {/* Bottom row: Sportsbook name left, odds and pick button right */}
                      <div className="mob-bottom-row">
                        <div className="mob-book">{cleanBookTitle(row.bk?.title)}</div>
                        <div className="mob-right-section">
                          <div className={`mob-odds-container ${priceDelta[row.key] ? (priceDelta[row.key] === 'up' ? 'up' : 'down') : ''}`}>
                            <span className="mob-odds">
                              {(() => {
                                const n = Number(row.out.price ?? row.out.odds ?? 0);
                                if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
                                if (currentOddsFormat === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                                const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                                const den = n > 0 ? 100 : Math.round(Math.abs(n));
                                const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                                return `${num/g}/${den/g}`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ---- MOBILE VERTICAL MINI-TABLE (expands downward only) ---- */}
                      {expandedRows[row.key] && (
                        <div className="mini-swipe" role="region" aria-label="Compare books">
                          {/* Header row */}
                          <div className="mini-swipe-header">
                            <div className="mini-header-book">Book</div>
                            <div className="mini-header-odds">
                              {String(row.mkt?.key).includes('total') ? 'Over' : shortTeam(row.game.home_team, row.game.sport_key)}
                            </div>
                            <div className="mini-header-odds">
                              {String(row.mkt?.key).includes('total') ? 'Under' : shortTeam(row.game.away_team, row.game.sport_key)}
                            </div>
                            <div className="mini-header-pick">Pick</div>
                          </div>

                          {/* Book rows */}
                          {(() => {
                            const toDec = (n) => {
                              const v = Number(n || 0);
                              if (!v) return 0;
                              return v > 0 ? (v / 100) + 1 : (100 / Math.abs(v)) + 1;
                            };
                            const mkRow = String(row?.mkt?.key || '').toLowerCase();
                            const isML = (mkRow === 'h2h' || mkRow.endsWith('moneyline'));
                            const isTotals = mkRow.includes('total');
                            const isSpreads = mkRow.includes('spread');
                            const oPointStr = String(row.out.point ?? '');

                            const seen = new Set();
                            const uniq = [];
                            row.allBooks.forEach(ob => {
                              const key = String(ob?.bookmaker?.key || ob.book || '').toLowerCase();
                              if (!seen.has(key)) { seen.add(key); uniq.push(ob); }
                            });
                            const cols = uniq.slice().sort((a,b)=>toDec(b.price??b.odds)-toDec(a.price??a.odds)).slice(0, 6);

                            const grab = (ob, top) => {
                              const outs = Array.isArray(ob?.market?.outcomes) ? ob.market.outcomes : [];
                              if (isML) {
                                const name = top ? row.game.home_team : row.game.away_team;
                                const f = outs.find(x => x && x.name === name);
                                return f ? (f.price ?? f.odds) : '';
                              }
                              if (isTotals) {
                                const name = top ? 'Over' : 'Under';
                                const f = outs.find(x => x && x.name === name && String(x.point ?? '') === oPointStr);
                                return f ? (f.price ?? f.odds) : '';
                              }
                              if (isSpreads) {
                                const name = top ? row.game.home_team : row.game.away_team;
                                const ptAbs = Math.abs(Number(row.out.point ?? 0));
                                const f = outs.find(x => x && x.name === name && Math.abs(Number(x.point ?? 0)) === ptAbs) ||
                                          outs.find(x => x && x.name === name);
                                return f ? (f.price ?? f.odds) : '';
                              }
                              return '';
                            };

                            const formatOdds = (n) => {
                              if (!n && n !== 0) return '';
                              if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
                              if (currentOddsFormat === 'decimal') { const d = toDecimal(n); return d ? d.toFixed(2) : ''; }
                              const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                              const den = n > 0 ? 100 : Math.round(Math.abs(n));
                              const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                              return `${num/g}/${den/g}`;
                            };

                            return cols.map((ob, i) => (
                              <div className="mini-swipe-row" key={ob._rowId || i}>
                                <div className="mini-book-col">{cleanBookTitle(ob.book)}</div>
                                <div className="mini-odds-col">
                                  <div className="mini-swipe-odds">
                                    {formatOdds(Number(grab(ob, true)))}
                                  </div>
                                </div>
                                <div className="mini-odds-col">
                                  <div className="mini-swipe-odds">
                                    {formatOdds(Number(grab(ob, false)))}
                                  </div>
                                </div>
                                <div className="mini-pick-col">
                                  <button 
                                    className="add-pick-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToPicks(row, ob, true);
                                    }}
                                    title="Add to My Picks"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Desktop/Tablet mini-table (hide on mobile via CSS) */}
                {expandedRows[row.key] && row.allBooks.length > 0 && (
                  <tr className="desktop-mini-wrap">
                    <td colSpan={8}>
                      <div className="mini-table-oddsjam">
                        <div className="mini-table-row">
                          {/* legend */}
                          <div className="mini-table-header-cell mini-table-legend">
                            <div className="mini-col-type">{marketTypeLabel(row?.mkt?.key || '')}</div>
                            <hr style={{ width:"80%", margin:"0.4em auto 0.2em auto", border:0, borderTop:"1.5px solid", borderTopColor:"color-mix(in srgb, var(--accent) 20%, transparent)" }} />
                            <div className="mini-legend-stack">
                              <div className="legend-team top">{String(row.mkt?.key).includes('total') ? 'Over' : shortTeam(row.game.home_team, row.game.sport_key)}</div>
                              <div className="legend-team bot">{String(row.mkt?.key).includes('total') ? 'Under' : shortTeam(row.game.away_team, row.game.sport_key)}</div>
                            </div>
                          </div>

                          {/* columns */}
                          {(() => {
                            const toDec = (n) => {
                              const v = Number(n || 0);
                              if (!v) return 0;
                              return v > 0 ? (v / 100) + 1 : (100 / Math.abs(v)) + 1;
                            };
                            const mkRow = String(row?.mkt?.key || '').toLowerCase();
                            const isML = (mkRow === 'h2h' || mkRow.endsWith('moneyline'));
                            const isTotals = mkRow.includes('total');
                            const oPointStr = String(row.out.point ?? '');

                            const seenAll = new Set();
                            const uniqueAll = [];
                            row.allBooks.forEach(ob => {
                              const k = String(ob?.bookmaker?.key || ob.book || "").toLowerCase();
                              if (!seenAll.has(k)) { seenAll.add(k); uniqueAll.push(ob); }
                            });
                            const sortedAll = uniqueAll.slice().sort((a, b) => toDec(b.price ?? b.odds) - toDec(a.price ?? a.odds)).slice(0, 8);

                            const fmt = (out) => {
                              const n = Number(out);
                              if (!n && n !== 0) return '';
                              if (currentOddsFormat === 'american') return n > 0 ? `+${n}` : `${n}`;
                              if (currentOddsFormat === 'decimal') { const d = toDec(n); return d ? d.toFixed(2) : ''; }
                              const num = n > 0 ? Math.round(Math.abs(n)) : 100;
                              const den = n > 0 ? 100 : Math.round(Math.abs(n));
                              const g = (function g(a,b){return b?g(b,a%b):a})(num,den)||1;
                              return `${num/g}/${den/g}`;
                            };

                            return sortedAll.map((p, i) => {
                              const outs = Array.isArray(p?.market?.outcomes) ? p.market.outcomes : [];
                              const top = isML
                                ? outs.find(x => x && x.name === row.game.home_team)
                                : isTotals
                                  ? outs.find(x => x && x.name === 'Over' && String(x.point ?? '') === oPointStr)
                                  : outs.find(x => x && x.name === row.game.home_team);
                              const bot = isML
                                ? outs.find(x => x && x.name === row.game.away_team)
                                : isTotals
                                  ? outs.find(x => x && x.name === 'Under' && String(x.point ?? '') === oPointStr)
                                  : outs.find(x => x && x.name === row.game.away_team);
                              return (
                                <div key={p._rowId || i} className="mini-table-header-cell">
                                  <div className="mini-book-name" title={cleanBookTitle(p.book)}>{cleanBookTitle(p.book)}</div>
                                  <hr style={{ width:"80%", margin:"0.4em auto 0.2em auto", border:0, borderTop:"1.5px solid", borderTopColor:"color-mix(in srgb, var(--accent) 20%, transparent)" }} />
                                  <div className="mini-table-odds-cell">{fmt(top?.price ?? top?.odds)}</div>
                                  <div className="mini-table-odds-cell" style={{ marginTop:6 }}>{fmt(bot?.price ?? bot?.odds)}</div>
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

      {totalPages > 1 && (
        <div className="pagination-bar" style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:".4em", margin:"2em 0" }}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:"0.45em 1.2em", borderRadius:8, border:"none", background: page===1?"#aaa":"var(--accent)", color:"#fff", fontWeight:600 }}>Prev</button>
          {Array.from({length:Math.min(5,totalPages)}).map((_,i)=>{
            const num = Math.max(1, page-2)+i;
            if (num>totalPages) return null;
            return <button key={num} onClick={()=>setPage(num)} disabled={num===page} style={{ padding:"0.45em 1.1em", borderRadius:8, border:"none", background:num===page?"var(--accent)":"#222c", color:"#fff", fontWeight:600 }}>{num}</button>;
          })}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:"0.45em 1.2em", borderRadius:8, border:"none", background: page===totalPages?"#aaa":"var(--accent)", color:"#fff", fontWeight:600 }}>Next</button>
        </div>
      )}
    </div>
  );
}
