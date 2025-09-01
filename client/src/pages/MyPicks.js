import React, { useEffect, useState } from "react";
import { TrendingUp, Plus, Trash2, Trophy, Target, Calendar, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import MobileBottomBar from "../components/MobileBottomBar";
import "./MyPicks.css";

const LS_KEY = "oss_my_picks_v1";

export default function MyPicks() {
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPicks(JSON.parse(raw));
    } catch {}
  }, []);

  function save(next) {
    setPicks(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }

  function removePick(id) {
    save(picks.filter(p => p.id !== id));
  }

  return (
    <main className="picks-page">
      <header className="picks-header">
        <div className="header-title">
          <TrendingUp className="header-icon" size={32} />
          <div>
            <h1>My Picks</h1>
            <p>Track your betting selections and performance</p>
          </div>
        </div>
        
        <div className="picks-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Target size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{picks.length}</div>
              <div className="stat-label">Active Picks</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Trophy size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">--</div>
              <div className="stat-label">Win Rate</div>
            </div>
          </div>
        </div>
      </header>

      {picks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <TrendingUp size={48} />
          </div>
          <h3>No picks yet</h3>
          <p>Start tracking your betting selections to monitor your performance.</p>
          <button
            onClick={() => {
              const demo = {
                id: String(Date.now()),
                league: "NFL",
                game: "Dallas Cowboys @ Philadelphia Eagles",
                market: "Moneyline",
                selection: "PHI -120",
                note: "Eagles at home with strong offensive line",
                odds: "-120",
                stake: "$50",
                potential: "$91.67",
                status: "pending",
                dateAdded: new Date().toISOString()
              };
              save([demo]);
            }}
            className="demo-btn"
          >
            <Plus size={16} />
            Add Demo Pick
          </button>
        </div>
      )}

      <div className="picks-grid">
        {picks.map(p => (
          <div key={p.id} className={`pick-card ${p.status || 'pending'}`}>
            <div className="pick-header">
              <div className="pick-league">
                <Trophy size={14} />
                <span>{p.league}</span>
              </div>
              <div className="pick-status">
                {(p.status === 'won' || p.status === 'win') && <CheckCircle2 size={16} className="status-won" />}
                {(p.status === 'lost' || p.status === 'loss') && <AlertCircle size={16} className="status-lost" />}
                {(!p.status || p.status === 'pending') && <Calendar size={16} className="status-pending" />}
              </div>
            </div>
            
            <div className="pick-game">
              <h3>{p.game}</h3>
              <div className="pick-market">{p.market}</div>
            </div>
            
            <div className="pick-selection">
              <div className="selection-main">{p.selection}</div>
              {p.odds && (
                <div className="selection-odds">
                  <span>Odds: {p.odds}</span>
                </div>
              )}
            </div>
            
            {(p.stake || p.potential) && (
              <div className="pick-financials">
                {p.stake && (
                  <div className="financial-item">
                    <DollarSign size={14} />
                    <span>Stake: {p.stake}</span>
                  </div>
                )}
                {p.potential && (
                  <div className="financial-item">
                    <Target size={14} />
                    <span>Potential: {p.potential}</span>
                  </div>
                )}
              </div>
            )}
            
            {p.note && (
              <div className="pick-note">
                <p>{p.note}</p>
              </div>
            )}
            
            {p.dateAdded && (
              <div className="pick-date">
                <Calendar size={12} />
                <span>{new Date(p.dateAdded).toLocaleDateString()}</span>
              </div>
            )}
            
            <div className="pick-actions">
              <button
                onClick={() => removePick(p.id)}
                className="remove-btn"
                aria-label="Remove pick"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <MobileBottomBar active="picks" showFilter={false} />
    </main>
  );
}
