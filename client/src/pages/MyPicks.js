import React, { useEffect, useState, useMemo } from "react";
import { TrendingUp, Plus, Trash2, Trophy, Target, Calendar, DollarSign, AlertCircle, CheckCircle2, BarChart3, PieChart, Filter, Download, Share2, Edit3, Clock, Zap, TrendingDown, Award, Activity, RefreshCw, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileBottomBar from "../components/MobileBottomBar";
import { autoValidateBets, manualValidateAllBets } from "../services/betValidationService";
import "./MyPicks.css";

const LS_KEY = "oss_my_picks_v1";

export default function MyPicks() {
  console.log('🎯 MyPicks component rendering');
  const navigate = useNavigate();
  const [picks, setPicks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'won', 'lost'
  const [timeRange, setTimeRange] = useState('30d'); // '7d', '30d', '90d', 'all'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'profit', 'odds', 'sport'
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPicks(JSON.parse(raw));
    } catch {}
    
    // Auto-validate bets on component mount
    handleAutoValidation();
  }, []);

  // Listen for validation events
  useEffect(() => {
    const handleValidationEvent = (event) => {
      const result = event.detail;
      if (result.updated > 0) {
        // Reload picks from localStorage
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) setPicks(JSON.parse(raw));
        } catch {}
      }
    };

    window.addEventListener('betsValidated', handleValidationEvent);
    return () => window.removeEventListener('betsValidated', handleValidationEvent);
  }, []);

  function save(next) {
    setPicks(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }

  function removePick(id) {
    save(picks.filter(p => p.id !== id));
  }

  function updatePickStatus(id, status, actualPayout = null) {
    const updated = picks.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status,
          actualPayout,
          settledDate: new Date().toISOString()
        };
      }
      return p;
    });
    save(updated);
  }

  function addSampleData() {
    const samplePicks = [
      {
        id: 'sample1',
        league: 'NFL',
        game: 'Chiefs vs Bills',
        market: 'Spread',
        selection: 'Chiefs -3.5',
        odds: '-110',
        stake: 100,
        potential: 190.91,
        status: 'won',
        actualPayout: 190.91,
        dateAdded: new Date(Date.now() - 86400000 * 2).toISOString(),
        settledDate: new Date(Date.now() - 86400000).toISOString(),
        note: 'Strong home field advantage'
      },
      {
        id: 'sample2',
        league: 'NBA',
        game: 'Lakers vs Warriors',
        market: 'Total',
        selection: 'Over 225.5',
        odds: '+105',
        stake: 75,
        potential: 153.75,
        status: 'lost',
        actualPayout: 0,
        dateAdded: new Date(Date.now() - 86400000 * 3).toISOString(),
        settledDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        note: 'Both teams playing back-to-back'
      },
      {
        id: 'sample3',
        league: 'MLB',
        game: 'Dodgers vs Giants',
        market: 'Moneyline',
        selection: 'Dodgers -125',
        odds: '-125',
        stake: 125,
        potential: 225,
        status: 'pending',
        dateAdded: new Date(Date.now() - 86400000).toISOString(),
        note: 'Ace pitcher starting for Dodgers'
      }
    ];
    save([...picks, ...samplePicks]);
  }

  function exportPicks() {
    try {
      const dataStr = JSON.stringify(picks, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-picks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }

  function importPicks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedPicks = JSON.parse(e.target.result);
        if (Array.isArray(importedPicks)) {
          // Merge with existing picks, avoiding duplicates by ID
          const existingIds = new Set(picks.map(p => p.id));
          const newPicks = importedPicks.filter(p => !existingIds.has(p.id));
          save([...picks, ...newPicks]);
          alert(`Successfully imported ${newPicks.length} new picks!`);
        } else {
          alert('Invalid file format. Please select a valid picks export file.');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed. Please check the file format and try again.');
      }
    };
    reader.readAsText(file);
    // Reset input to allow importing the same file again
    event.target.value = '';
  }

  const handleAutoValidation = async () => {
    try {
      const result = await autoValidateBets();
      if (result.updated > 0) {
        setValidationMessage(`✅ Auto-validated ${result.updated} bet${result.updated === 1 ? '' : 's'}`);
        setTimeout(() => setValidationMessage(''), 5000);
      }
    } catch (error) {
      console.error('Auto-validation error:', error);
    }
  };

  const handleManualValidation = async () => {
    setIsValidating(true);
    setValidationMessage('🔄 Checking ESPN for game results...');
    
    try {
      const result = await manualValidateAllBets();
      setValidationMessage(result.userMessage || 'Validation completed');
      setTimeout(() => setValidationMessage(''), 8000);
    } catch (error) {
      console.error('Manual validation error:', error);
      setValidationMessage('❌ Validation failed - please try again');
      setTimeout(() => setValidationMessage(''), 5000);
    } finally {
      setIsValidating(false);
    }
  };

  const refreshData = () => {
    // Force re-render by updating timestamps on all picks
    const updatedPicks = picks.map(pick => ({
      ...pick,
      lastRefresh: new Date().toISOString()
    }));
    setPicks(updatedPicks);
    localStorage.setItem('oss_my_picks_v1', JSON.stringify(updatedPicks));
    
    // Also trigger validation
    handleManualValidation();
  };

  const updateActualPayout = (pickId, actualPayout) => {
    const updatedPicks = picks.map(pick => 
      pick.id === pickId 
        ? { ...pick, actualPayout: actualPayout }
        : pick
    );
    setPicks(updatedPicks);
    localStorage.setItem('oss_my_picks_v1', JSON.stringify(updatedPicks));
  };

  // Calculate analytics
  const analytics = useMemo(() => {
    const settled = picks.filter(p => p.status === 'won' || p.status === 'lost');
    const won = picks.filter(p => p.status === 'won');
    const lost = picks.filter(p => p.status === 'lost');
    const pending = picks.filter(p => !p.status || p.status === 'pending');
    
    const totalStaked = picks.reduce((sum, p) => sum + (Number(p.stake) || 0), 0);
    const totalReturns = won.reduce((sum, p) => sum + (Number(p.actualPayout) || Number(p.potential) || 0), 0);
    const netProfit = totalReturns - totalStaked;
    const winRate = settled.length > 0 ? (won.length / settled.length) * 100 : 0;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    const avgOdds = picks.length > 0 ? picks.reduce((sum, p) => {
      const odds = String(p.odds || '').replace(/[^-+0-9]/g, '');
      return sum + (Number(odds) || 0);
    }, 0) / picks.length : 0;
    
    // Sport breakdown
    const sportStats = picks.reduce((acc, pick) => {
      const sport = pick.league || 'Unknown';
      if (!acc[sport]) {
        acc[sport] = { total: 0, won: 0, lost: 0, staked: 0, returns: 0 };
      }
      acc[sport].total++;
      acc[sport].staked += Number(pick.stake) || 0;
      if (pick.status === 'won') {
        acc[sport].won++;
        acc[sport].returns += Number(pick.actualPayout) || Number(pick.potential) || 0;
      } else if (pick.status === 'lost') {
        acc[sport].lost++;
      }
      return acc;
    }, {});
    
    return {
      totalPicks: picks.length,
      pending: pending.length,
      won: won.length,
      lost: lost.length,
      winRate: Math.round(winRate * 10) / 10,
      totalStaked,
      totalReturns,
      netProfit,
      roi: Math.round(roi * 10) / 10,
      avgOdds: Math.round(avgOdds),
      sportStats
    };
  }, [picks]);

  const filteredPicks = useMemo(() => {
    let filtered = picks;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter || (!p.status && filter === 'pending'));
    }
    
    // Apply time range filter
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => new Date(p.dateAdded) >= cutoff);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'profit':
          const profitA = a.status === 'won' ? (Number(a.actualPayout) || Number(a.potential) || 0) - (Number(a.stake) || 0) : a.status === 'lost' ? -(Number(a.stake) || 0) : 0;
          const profitB = b.status === 'won' ? (Number(b.actualPayout) || Number(b.potential) || 0) - (Number(b.stake) || 0) : b.status === 'lost' ? -(Number(b.stake) || 0) : 0;
          return profitB - profitA;
        case 'odds':
          const oddsA = Number(String(a.odds || '').replace(/[^-+0-9]/g, '')) || 0;
          const oddsB = Number(String(b.odds || '').replace(/[^-+0-9]/g, '')) || 0;
          return oddsB - oddsA;
        case 'sport':
          return (a.league || '').localeCompare(b.league || '');
        default:
          return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
    });
    
    return filtered;
  }, [picks, filter, timeRange, sortBy]);

  return (
    <main className="picks-page">
      <header className="picks-header">
        <div className="header-title">
          <TrendingUp className="header-icon" size={32} />
          <div>
            <h1>My Picks</h1>
            <p>Advanced betting performance analytics</p>
            {validationMessage && (
              <div className="validation-message">
                {validationMessage}
              </div>
            )}
          </div>
        </div>
        
        
        {/* Key Performance Metrics */}
        <div className="performance-grid">
          <div className="perf-card profit">
            <div className="perf-icon">
              <DollarSign size={20} />
            </div>
            <div className="perf-content">
              <div className={`perf-value ${analytics.netProfit >= 0 ? 'positive' : 'negative'}`}>
                {analytics.netProfit >= 0 ? '+' : ''}${analytics.netProfit.toFixed(2)}
              </div>
              <div className="perf-label">Net Profit</div>
              <div className="perf-detail">${analytics.totalStaked.toFixed(2)} staked</div>
            </div>
          </div>
          
          <div className="perf-card winrate">
            <div className="perf-icon">
              <Trophy size={20} />
            </div>
            <div className="perf-content">
              <div className="perf-value">{analytics.winRate}%</div>
              <div className="perf-label">Win Rate</div>
              <div className="perf-detail">{analytics.won}W - {analytics.lost}L</div>
            </div>
          </div>
          
          <div className="perf-card roi">
            <div className="perf-icon">
              <TrendingUp size={20} />
            </div>
            <div className="perf-content">
              <div className={`perf-value ${analytics.roi >= 0 ? 'positive' : 'negative'}`}>
                {analytics.roi >= 0 ? '+' : ''}{analytics.roi}%
              </div>
              <div className="perf-label">ROI</div>
              <div className="perf-detail">Return on investment</div>
            </div>
          </div>
          
          <div className="perf-card pending">
            <div className="perf-icon">
              <Clock size={20} />
            </div>
            <div className="perf-content">
              <div className="perf-value">{analytics.pending}</div>
              <div className="perf-label">Pending</div>
              <div className="perf-detail">{analytics.totalPicks} total picks</div>
            </div>
          </div>
        </div>
      </header>

      {picks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <TrendingUp size={48} />
          </div>
          <h3>Start Your Betting Journey</h3>
          <p>Track your picks, analyze performance, and improve your betting strategy with detailed analytics.</p>
          <div className="empty-actions">
            <button onClick={() => navigate('/sportsbooks')} className="sample-btn">
              <Zap size={16} />
              Find Bets
            </button>
          </div>
        </div>
      )}

      {/* Overview Content */}
      {
        <div className="overview-content">
          {picks.length > 0 && (
            <div className="controls-bar">
              <div className="filter-controls">
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
                  <option value="all">All Picks</option>
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                  <option value="date">Sort by Date</option>
                  <option value="profit">Sort by Profit</option>
                  <option value="odds">Sort by Odds</option>
                  <option value="sport">Sort by Sport</option>
                </select>
                <button className="validate-btn" onClick={handleManualValidation} disabled={isValidating}>
                  {isValidating ? <Loader size={14} className="spinning" /> : <CheckCircle2 size={14} />}
                  {isValidating ? 'Validating...' : 'Validate ESPN'}
                </button>
                <button className="refresh-btn" onClick={refreshData}>
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </div>
          )}
          
          <div className="picks-grid">
            {filteredPicks.map(p => {
              const profit = p.status === 'won' ? (Number(p.actualPayout) || Number(p.potential) || 0) - (Number(p.stake) || 0) : 
                            p.status === 'lost' ? -(Number(p.stake) || 0) : 0;
              
              return (
                <div key={p.id} className={`pick-card ${p.status || 'pending'}`}>
                  <div className="pick-header">
                    <div className="pick-league">
                      <Trophy size={14} />
                      <span>{p.league}</span>
                    </div>
                    <div className="pick-status">
                      {(p.status === 'won' || p.status === 'win') && <CheckCircle2 size={16} className="status-won" />}
                      {(p.status === 'lost' || p.status === 'loss') && <AlertCircle size={16} className="status-lost" />}
                      {(!p.status || p.status === 'pending') && <Clock size={16} className="status-pending" />}
                    </div>
                  </div>
                  
                  <div className="pick-game">
                    <h3>{p.game}</h3>
                    <div className="pick-market">{p.market}</div>
                  </div>
                  
                  <div className="pick-selection">
                    <div className="selection-main">{p.selection}</div>
                    <div className="selection-odds">{p.odds}</div>
                  </div>
                  
                  <div className="pick-financials">
                    <div className="financial-row">
                      <span className="label">Stake:</span>
                      <span className="value">${Number(p.stake) || 0}</span>
                    </div>
                    <div className="financial-row">
                      <span className="label">Potential:</span>
                      <span className="value">${Number(p.potential) || 0}</span>
                    </div>
                    {p.status === 'won' && (
                      <div className="financial-row">
                        <span className="label">Actual Payout:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={p.actualPayout || ''}
                          onChange={(e) => updateActualPayout(p.id, e.target.value)}
                          className="payout-input"
                          placeholder="Enter payout"
                        />
                      </div>
                    )}
                    {p.status !== 'pending' && (
                      <div className="financial-row profit">
                        <span className="label">Profit:</span>
                        <span className={`value ${profit >= 0 ? 'positive' : 'negative'}`}>
                          {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {p.note && (
                    <div className="pick-note">
                      <p>{p.note}</p>
                    </div>
                  )}
                  
                  <div className="pick-footer">
                    <div className="pick-date">
                      <Calendar size={12} />
                      <span>{new Date(p.dateAdded).toLocaleDateString()}</span>
                    </div>
                    <div className="pick-actions">
                      <button onClick={() => removePick(p.id)} className="remove-btn">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }

      <MobileBottomBar active="picks" showFilter={false} />
    </main>
  );
}
