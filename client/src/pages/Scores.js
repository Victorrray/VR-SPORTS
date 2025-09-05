// src/pages/Scores.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, Users, Trophy, Calendar, RefreshCw, Clock, Info, ChevronDown, Football, Basketball, Zap, Gamepad2, Target, Home } from 'lucide-react';
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

const REFRESH_MS = 60_000; // auto refresh every 60s for scheduled games
const LIVE_REFRESH_MS = 30_000; // refresh every 30s for live games

// Get all available sports with icons
function getCurrentSeasonSports() {
  return [
    { key: "americanfootball_nfl", label: "NFL", icon: "🏈" },
    { key: "americanfootball_ncaaf", label: "NCAA", icon: "🏈" },
    { key: "basketball_nba", label: "NBA", icon: "🏀" },
    { key: "basketball_ncaab", label: "NCAAB", icon: "🏀" },
    { key: "icehockey_nhl", label: "NHL", icon: "🏒" },
    { key: "baseball_mlb", label: "MLB", icon: "⚾" }
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [liveGamesCount, setLiveGamesCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  const btnRef = useRef(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setErr("");
    setConnectionStatus('connecting');
    try {
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:10000');
      console.log('🔍 Scores API URL:', `${apiUrl}/api/scores?sport=${sport}`);
      
      // Configure fetch options for cross-origin requests
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't include credentials for cross-origin requests in production
        credentials: apiUrl.includes('localhost') ? 'include' : 'omit'
      };
      
      const r = await fetch(`${apiUrl}/api/scores?sport=${sport}`, fetchOptions);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setGames(data || []);
      
      // Count live games using enhanced backend data
      const liveCount = (data || []).filter(g => g.live === true || g.status === 'in_progress').length;
      setLiveGamesCount(liveCount);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
      
      // Log live games for debugging
      if (liveCount > 0) {
        console.log(`🔴 Found ${liveCount} live games:`, 
          (data || []).filter(g => g.live === true).map(g => `${g.away_team} @ ${g.home_team}`)
        );
      }
    } catch (error) {
      console.error("Error loading scores:", error);
      setConnectionStatus('error');
      if (!silent) setErr(`Failed to load scores: ${error.message}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.sport-selector')) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  // First load + dynamic auto refresh based on live games
  useEffect(() => {
    load();
    
    // Use faster refresh if there are live games (15s for live, 60s for others)
    const refreshInterval = liveGamesCount > 0 ? 15000 : REFRESH_MS;
    const t = setInterval(() => load(true), refreshInterval);
    return () => clearInterval(t);
  }, [sport, liveGamesCount]);

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
            {liveGamesCount > 0 && (
              <div className="live-indicator-header">
                <div className="live-dot-pulse"></div>
                <span className="live-count">{liveGamesCount} Live</span>
              </div>
            )}
          </div>
          <div className="header-info">
            {/* Week pill (NFL mostly) */}
            {weekInfo?.week && weekInfo?.season && (
              <div className="week-badge">
                <Calendar size={14} />
                <span>
                  {weekInfo.league === "nfl" ? `NFL • Week ${weekInfo.week} • ${weekInfo.season}` : `Week ${weekInfo.week} • ${weekInfo.season}`}
                </span>
              </div>
            )}
            
            {/* Connection status and last update */}
            <div className="connection-status">
              <div className={`status-dot ${connectionStatus}`}></div>
              {lastUpdate && (
                <span className="last-update">
                  Updated {lastUpdate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="header-controls">
          {/* Desktop Tabs */}
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

          <div className="mobile-controls">
            {/* Mobile Dropdown Selector */}
            <div className="sport-selector">
              <button 
                className={`sport-dropdown-btn ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="sport-icon">
                    {availableSports.find(s => s.key === sport)?.icon || '🏈'}
                  </span>
                  <span>{availableSports.find(s => s.key === sport)?.label || 'Select Sport'}</span>
                </div>
                <ChevronDown size={16} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
              </button>
              
              {dropdownOpen && (
                <div className="sport-dropdown-menu">
                  {availableSports.map((sportOption) => (
                    <button
                      key={sportOption.key}
                      onClick={() => {
                        setSport(sportOption.key);
                        setDropdownOpen(false);
                      }}
                      className={`sport-option ${sport === sportOption.key ? 'selected' : ''}`}
                    >
                      <span className="sport-icon">{sportOption.icon}</span>
                      <span>{sportOption.label}</span>
                    </button>
                  ))}
                </div>
              )}
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
        {sorted.map((g) => {
          const isLive = g.live === true || g.status === 'in_progress';
          const isCompleted = g.completed === true || g.status === 'final';
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
                    {(isCompleted || isLive) && g.scores && (
                      <div className="team-score">
                        {g.scores.away || 0}
                      </div>
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
                    {(isCompleted || isLive) && g.scores && (
                      <div className="team-score">
                        {g.scores.home || 0}
                      </div>
                    )}
                  </div>
                  
                  {/* Game lines right-aligned with team names */}
                  {g.odds && (g.odds.spread || g.odds.overUnder) && (
                    <div className="game-lines-right">
                      {g.odds.spread && <div className="odds-line"><span>Line:</span> {g.odds.spread}</div>}
                      {g.odds.overUnder != null && <div className="odds-line"><span>O/U:</span> {g.odds.overUnder}</div>}
                      {g.odds.provider && <div className="odds-provider">({g.odds.provider})</div>}
                    </div>
                  )}
                </div>

                <div className="game-info">
                  {isLive && (
                    <div className="live-indicator">
                      <div className="live-dot"></div>
                      <span>Live Now</span>
                      {g.clock && g.clock !== 'Live' && <span className="game-clock">{g.clock}</span>}
                      {g.period && <span className="game-period">Q{g.period}</span>}
                      {g.situation && <span className="game-situation">{g.situation}</span>}
                    </div>
                  )}
                </div>

                {/* Game Reactions moved under game lines */}
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
