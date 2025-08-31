// src/pages/Scores.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import MobileBottomBar from "../components/MobileBottomBar";

function TeamLogo({ src, name }) {
  const [ok, setOk] = React.useState(true);
  const initials = (name || "")
    .split(/\s+/)
    .map(s => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!src || !ok) {
    return (
      <div
        aria-hidden
        style={{
          width: 28, height: 28, borderRadius: 6,
          display: "grid", placeItems: "center",
          background: "#0b1220", color: "#cfe0ff",
          fontSize: 11, fontWeight: 900
        }}
        title={name}
      >
        {initials || "??"}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      title={name}
      style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", background: "#0b1220" }}
      onError={() => setOk(false)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

// Simple time label for scheduled games
function kickoffLabel(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today • ${time}`;
    const day = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    return `${day} • ${time}`;
  } catch {
    return iso;
  }
}

// Status → badge text
function statusBadgeText(status, clock) {
  if (status === "in_progress") return `LIVE ${clock ? `• ${clock}` : ""}`.trim();
  if (status === "final") return "Final";
  return ""; // scheduled: we'll show "Today • time" separately
}

const REFRESH_MS = 15_000; // auto refresh every 15s

export default function Scores() {
  const [sport, setSport] = useState("americanfootball_nfl"); // nfl | americanfootball_ncaaf
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [spinning, setSpinning] = useState(false); // refresh button spin

  const btnRef = useRef(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${process.env.REACT_APP_API_URL || ""}/api/scores?sport=${sport}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load scores");
    } finally {
      setLoading(false);
    }
  }

  // First load + auto refresh
  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  // Manual refresh + spin animation
  const handleRefresh = async () => {
    if (!btnRef.current) return;
    setSpinning(true);
    try { await load(); } finally {
      // keep the spin visible a tiny bit so it feels responsive
      setTimeout(() => setSpinning(false), 400);
    }
  };

  // Sort: LIVE first, then scheduled by start, then finals last (by start desc)
  const sorted = useMemo(() => {
    const live = [];
    const sched = [];
    const finals = [];
    games.forEach((g) => {
      if (g.status === "in_progress") live.push(g);
      else if (g.status === "final") finals.push(g);
      else sched.push(g);
    });
    live.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    sched.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    finals.sort((a, b) => new Date(b.commence_time) - new Date(a.commence_time));
    // NCAA rule (from earlier): show only today's scheduled; NFL shows all
    if (sport === "americanfootball_ncaaf") {
      const today = new Date().toDateString();
      return [...live, ...sched.filter(g => new Date(g.commence_time).toDateString() === today), ...finals];
    }
    return [...live, ...sched, ...finals];
  }, [games, sport]);

  // Pull global week if present (will be the same on all NFL games)
  const weekInfo = useMemo(() => {
    const g = games.find(Boolean);
    if (!g) return null;
    return {
      season: g.season || null,
      week: g.week || null,
      league: g.league || null,
    };
  }, [games]);

  return (
    <main style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem 120px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>Live Scores</h1>
          {/* Week pill (NFL mostly) */}
          {weekInfo?.week && weekInfo?.season && (
            <span
              title="Week and season"
              style={{
                fontSize: 13,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(99,102,241,.15)",
                border: "1px solid rgba(99,102,241,.35)",
                color: "#c7d2fe",
                fontWeight: 800,
              }}
            >
              {weekInfo.league === "nfl" ? `NFL • Week ${weekInfo.week} • ${weekInfo.season}` : `Week ${weekInfo.week} • ${weekInfo.season}`}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setSport("americanfootball_nfl")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: 0,
              background: sport === "americanfootball_nfl" ? "var(--accent)" : "#2a3046",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            NFL
          </button>
          <button
            onClick={() => setSport("americanfootball_ncaaf")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: 0,
              background: sport === "americanfootball_ncaaf" ? "var(--accent)" : "#2a3046",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            NCAA
          </button>

          {/* Refresh icon button (no “last updated” text) */}
          <button
            ref={btnRef}
            onClick={handleRefresh}
            aria-label="Refresh scores"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36, height: 36,
              borderRadius: 999,
              border: "1px solid #334c",
              background: "#1b2137",
              color: "#e7ecff",
              fontSize: 16,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: "translateZ(0)",
                willChange: "transform",
                animation: spinning ? "spinOnce 0.75s linear 1" : "none",
              }}
            >
              ↻
            </span>
          </button>
        </div>
      </header>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "tomato" }}>{err}</p>}

      {/* Clean list layout */}
      <div style={{ display: "grid", gap: 12 }}>
        {sorted.map((g) => {
          const badge = statusBadgeText(g.status, g.clock);
          const isLive = g.status === "in_progress";
          const isFinal = g.status === "final";

          return (
            <div
              key={g.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #2a3255",
                background: "#111826",
              }}
            >
              {/* Left: teams + records */}
              <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 8 }}>
                {/* Away */}
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 8, alignItems: "center" }}>
                  <TeamLogo src={g.away_logo} name={g.away_team} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontWeight: 800, lineHeight: 1.1 }}>{g.away_team}{g.away_rank ? ` (#${g.away_rank})` : ""}</div>
                    {g.away_record && <div style={{ opacity: 0.8, fontSize: 13 }}>{g.away_record}</div>}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{g.scores?.away ?? (isFinal ? 0 : "-")}</div>
                </div>

                {/* Home */}
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 8, alignItems: "center" }}>
                  <TeamLogo src={g.home_logo} name={g.home_team} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontWeight: 800, lineHeight: 1.1 }}>{g.home_team}{g.home_rank ? ` (#${g.home_rank})` : ""}</div>
                    {g.home_record && <div style={{ opacity: 0.8, fontSize: 13 }}>{g.home_record}</div>}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{g.scores?.home ?? (isFinal ? 0 : "-")}</div>
                </div>
              </div>

              {/* Right: status + odds */}
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ marginBottom: 8 }}>
                  {/* Status badge or kickoff time */}
                  {badge ? (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 12,
                        fontWeight: 900,
                        padding: "3px 8px",
                        borderRadius: 999,
                        color: isLive ? "#a7f3d0" : "#c7d2fe",
                        background: isLive ? "rgba(16,185,129,.15)" : "rgba(99,102,241,.15)",
                        border: `1px solid ${isLive ? "rgba(16,185,129,.35)" : "rgba(99,102,241,.35)"}`,
                      }}
                    >
                      {badge}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, opacity: 0.9 }}>{kickoffLabel(g.commence_time)}</span>
                  )}
                </div>

                {/* Odds summary */}
                {g.odds && (g.odds.spread || g.odds.overUnder) && (
                  <div style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.4 }}>
                    {g.odds.spread && <div><strong>Line:</strong> {g.odds.spread}</div>}
                    {g.odds.overUnder != null && <div><strong>O/U:</strong> {g.odds.overUnder}</div>}
                    {g.odds.provider && <div style={{ opacity: 0.75 }}>({g.odds.provider})</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MobileBottomBar active="scores" showFilter={false} />

      {/* one-off keyframes for the refresh spin */}
      <style>{`
        @keyframes spinOnce { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
