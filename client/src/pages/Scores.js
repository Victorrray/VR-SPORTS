// src/pages/Scores.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, Users, Trophy, Calendar, RefreshCw, Clock, Info } from 'lucide-react';
import GameReactions from '../components/GameReactions';
import GameDetailsModal from '../components/GameDetailsModal';
import ScoresLoadingSkeleton from '../components/ScoresLoadingSkeleton';
import MobileBottomBar from '../components/MobileBottomBar';
import './Scores.css';

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
  const [selectedGame, setSelectedGame] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);

  const btnRef = useRef(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setErr("");
    try {
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5050');
      const r = await fetch(`${apiUrl}/api/scores?sport=${sport}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setGames(data || []);
    } catch (error) {
      console.error("Error loading scores:", error);
      if (!silent) setErr(`Failed to load scores: ${error.message}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // First load + auto refresh
  useEffect(() => {
    load();
    const t = setInterval(() => load(true), REFRESH_MS); // Silent auto-refresh
    return () => clearInterval(t);
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
    
    const result = [...live, ...sched, ...finals];
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

      {loading && (
        <div className="mobile-scores-loading">
          <div className="mobile-loading-spinner">
            <div className="mobile-spinner-ring"></div>
            <div className="mobile-spinner-ring"></div>
            <div className="mobile-spinner-ring"></div>
          </div>
          <div className="mobile-loading-text">Loading Live Scores</div>
          <div className="mobile-loading-subtitle">Fetching latest game data...</div>
        </div>
      )}
      {err && <div className="error-state">{err}</div>}

      <div className="scores-grid">
        {games.map((g) => {
          const isLive = g.completed === false && new Date(g.commence_time) <= new Date();
          const isCompleted = g.completed === true;
          const isUpcoming = !isLive && !isCompleted;

          return (
            <div 
              key={g.id} 
              className="game-card clickable"
              onClick={() => {
                setSelectedGame(g);
                setShowGameModal(true);
              }}
            >
              <div className="game-content">
                <div className="game-header">
                  <div className="game-status">
                    {isLive && <div className="status-badge live">LIVE</div>}
                    {isCompleted && <div className="status-badge final">FINAL</div>}
                    {isUpcoming && <div className="status-badge upcoming">UPCOMING</div>}
                  </div>
                  
                  <div className="game-time-compact">
                    {isLive ? (
                      <span className="live-text">Live Now</span>
                    ) : (
                      <span>{kickoffLabel(g.commence_time)}</span>
                    )}
                  </div>
                </div>

                <div className="teams-compact">
                  <div className="team-row away">
                    <div className="team-left">
                      <TeamLogo src={g.away_logo} name={g.away_team} />
                      <div className="team-info">
                        <span className="team-name">{g.away_team}</span>
                        {sport === 'americanfootball_cfb' && g.away_rank && (
                          <span className="team-rank">#{g.away_rank}</span>
                        )}
                      </div>
                    </div>
                    {isCompleted && g.scores && (
                      <div className="team-score">{g.scores.find(s => s.name === g.away_team)?.score || 0}</div>
                    )}
                  </div>
                  
                  <div className="team-row home">
                    <div className="team-left">
                      <TeamLogo src={g.home_logo} name={g.home_team} />
                      <div className="team-info">
                        <span className="team-name">{g.home_team}</span>
                        {sport === 'americanfootball_cfb' && g.home_rank && (
                          <span className="team-rank">#{g.home_rank}</span>
                        )}
                      </div>
                    </div>
                    {isCompleted && g.scores && (
                      <div className="team-score">{g.scores.find(s => s.name === g.home_team)?.score || 0}</div>
                    )}
                  </div>
                </div>

                <div className="game-info">
                  {isLive && (
                    <div className="live-indicator">
                      <div className="live-dot"></div>
                      <span>Live Now</span>
                    </div>
                  )}
                  {!isLive && (
                    <div className="game-time">
                      <Clock size={14} />
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
                
                {/* Game Reactions */}
                <GameReactions 
                  gameId={g.id} 
                  gameKey={`${g.away_team}-${g.home_team}-${g.commence_time}`}
                />

                {/* Live Chat Feature for Live Games */}
                {isLive && (
                  <div className="live-chat-toggle">
                    <button 
                      className="chat-btn"
                      onClick={() => {/* TODO: Implement chat modal */}}
                      title="Join live chat"
                    >
                      <MessageCircle size={14} />
                      <span>Chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MobileBottomBar active="scores" showFilter={false} />
      
      {/* Game Details Modal */}
      <GameDetailsModal 
        game={selectedGame}
        isOpen={showGameModal}
        onClose={() => {
          setShowGameModal(false);
          setSelectedGame(null);
        }}
      />
    </main>
  );
}
