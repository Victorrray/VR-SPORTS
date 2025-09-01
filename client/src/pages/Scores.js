// src/pages/Scores.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Trophy, Calendar, Clock } from "lucide-react";
import MobileBottomBar from "../components/MobileBottomBar";
import "./Scores.css";

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

// Get all available sports (show all for debugging)
function getCurrentSeasonSports() {
  return [
    { key: "americanfootball_nfl", label: "NFL" },
    { key: "americanfootball_ncaaf", label: "NCAA" },
    { key: "basketball_nba", label: "NBA" },
    { key: "basketball_ncaab", label: "NCAAB" },
    { key: "icehockey_nhl", label: "NHL" },
    { key: "baseball_mlb", label: "MLB" }
  ];
}

export default function Scores() {
  const availableSports = getCurrentSeasonSports();
  const defaultSport = availableSports.length > 0 ? availableSports[0].key : "americanfootball_nfl";
  
  const [sport, setSport] = useState(defaultSport);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [spinning, setSpinning] = useState(false); // refresh button spin

  const btnRef = useRef(null);

  async function load() {
    setLoading(true);
    setErr("");
    console.log("Loading scores for sport:", sport); // Debug log
    try {
      const r = await fetch(`${process.env.REACT_APP_API_URL || ""}/api/scores?sport=${sport}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      console.log("Received data for sport", sport, ":", data); // Debug log
      setGames(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading scores:", e); // Debug log
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
  }, [sport]); // Remove eslint-disable to ensure sport dependency is properly tracked

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
    console.log("Sorting games for sport:", sport, "Total games:", games.length);
    const live = [];
    const sched = [];
    const finals = [];
    games.forEach((g) => {
      console.log("Game:", g.away_team, "vs", g.home_team, "Status:", g.status, "Sport:", g.sport_key);
      if (g.status === "in_progress") live.push(g);
      else if (g.status === "final") finals.push(g);
      else sched.push(g);
    });
    live.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    sched.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    finals.sort((a, b) => new Date(b.commence_time) - new Date(a.commence_time));
    
    const result = [...live, ...sched, ...finals];
    console.log("Final sorted games:", result.length);
    return result;
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
    <main className="scores-page">
      <div className="scores-header">
        <div className="header-left">
          <div className="page-title">
            <Trophy className="title-icon" size={28} />
            <h1>Live Scores</h1>
          </div>
          {/* Week pill (NFL mostly) */}
          {weekInfo?.week && weekInfo?.season && (
            <div className="week-badge">
              <Calendar size={14} />
              <span>
                {weekInfo.league === "nfl" ? `NFL • Week ${weekInfo.week} • ${weekInfo.season}` : `Week ${weekInfo.week} • ${weekInfo.season}`}
              </span>
            </div>
          )}
        </div>

        <div className="header-controls">
          <div className="sport-tabs">
            {availableSports.map((sportOption) => (
              <button
                key={sportOption.key}
                onClick={() => setSport(sportOption.key)}
                className={`sport-tab ${sport === sportOption.key ? "active" : ""}`}
              >
                {sportOption.label}
              </button>
            ))}
          </div>

          <button
            ref={btnRef}
            onClick={handleRefresh}
            aria-label="Refresh scores"
            className={`refresh-btn ${spinning ? "spinning" : ""}`}
          >
            <RefreshCw size={18} className="refresh-icon" />
          </button>
        </div>
      </div>

      {loading && <div className="loading-state">Loading scores...</div>}
      {err && <div className="error-state">{err}</div>}

      <div className="scores-grid">
        {sorted.map((g) => {
          const badge = statusBadgeText(g.status, g.clock);
          const isLive = g.status === "in_progress";
          const isFinal = g.status === "final";

          return (
            <div
              key={g.id}
              className={`game-card ${isLive ? "live" : ""} ${isFinal ? "final" : ""}`}
            >
              <div className="teams-section">
                {/* Away */}
                <div className="team-row">
                  <TeamLogo src={g.away_logo} name={g.away_team} />
                  <div className="team-info">
                    <div className="team-name">{g.away_team}{g.away_rank ? ` (#${g.away_rank})` : ""}</div>
                    {g.away_record && <div className="team-record">{g.away_record}</div>}
                  </div>
                  <div className="team-score">{g.scores?.away ?? (isFinal ? 0 : "-")}</div>
                </div>

                {/* Home */}
                <div className="team-row">
                  <TeamLogo src={g.home_logo} name={g.home_team} />
                  <div className="team-info">
                    <div className="team-name">{g.home_team}{g.home_rank ? ` (#${g.home_rank})` : ""}</div>
                    {g.home_record && <div className="team-record">{g.home_record}</div>}
                  </div>
                  <div className="team-score">{g.scores?.home ?? (isFinal ? 0 : "-")}</div>
                </div>
              </div>

              <div className="game-status">
                <div className="status-section">
                  {badge ? (
                    <div className={`status-badge ${isLive ? "live" : "final"}`}>
                      {isLive && <div className="live-dot" />}
                      <span>{badge}</span>
                    </div>
                  ) : (
                    <div className="kickoff-time">
                      <Clock size={12} />
                      <span>{kickoffLabel(g.commence_time)}</span>
                    </div>
                  )}
                </div>

                {g.odds && (g.odds.spread || g.odds.overUnder) && (
                  <div className="odds-summary">
                    {g.odds.spread && <div className="odds-line"><span>Line:</span> {g.odds.spread}</div>}
                    {g.odds.overUnder != null && <div className="odds-line"><span>O/U:</span> {g.odds.overUnder}</div>}
                    {g.odds.provider && <div className="odds-provider">({g.odds.provider})</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MobileBottomBar active="scores" showFilter={false} />
    </main>
  );
}
