import React, { useState, useEffect } from 'react';
import { Bell, X, TrendingUp, Clock, Target, Zap, AlertTriangle } from 'lucide-react';
import './AlertSystem.css';

export default function AlertSystem({ games, userPreferences = {} }) {
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    minEdge: 2.0,
    favoriteLeagues: ['NFL', 'NBA', 'NCAAF', 'NCAAB'],
    enableSound: true,
    enablePush: false,
    enableLineMovement: true,
    enableLiveAlerts: true,
    alertFrequency: 'immediate' // immediate, hourly, daily
  });
  const [lastAlertTime, setLastAlertTime] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (games?.length) {
      generateAlerts();
    }
  }, [games, alertSettings]);

  const generateAlerts = () => {
    const newAlerts = [];
    const now = new Date();
    
    // Check alert frequency throttling
    if (lastAlertTime && alertSettings.alertFrequency === 'hourly') {
      const hoursSinceLastAlert = (now - lastAlertTime) / (1000 * 60 * 60);
      if (hoursSinceLastAlert < 1) return;
    }
    
    games.forEach((game, index) => {
      // Use deterministic edge calculation to prevent jitter
      const seed = game.id ? game.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0) : index;
      const mockEdge = (Math.abs(seed) % 80 / 10) - 2; // -2% to +6% range, but consistent
      const gameTime = new Date(game.commence_time);
      const hoursUntilGame = (gameTime - now) / (1000 * 60 * 60);
      
      // High +EV Alert with enhanced logic
      if (mockEdge >= alertSettings.minEdge) {
        const urgency = mockEdge > 5 ? 'critical' : mockEdge > 3 ? 'high' : 'medium';
        const bookmaker = game.bookmakers?.[0]?.title || 'Multiple Books';
        
        newAlerts.push({
          id: `high-ev-${game.id}-${index}`,
          type: 'high-ev',
          title: urgency === 'critical' ? '🔥 CRITICAL +EV Alert' : 'High +EV Opportunity',
          message: `${game.away_team} @ ${game.home_team} has ${mockEdge.toFixed(1)}% edge on ${bookmaker}`,
          game: game,
          edge: mockEdge,
          priority: urgency === 'critical' ? 'critical' : mockEdge > 4 ? 'high' : 'medium',
          timestamp: now.toISOString(),
          icon: TrendingUp,
          color: urgency === 'critical' ? '#ff4444' : 'var(--success)',
          actionable: true,
          bookmaker: bookmaker
        });
      }
      
      // Time-sensitive alerts
      if (hoursUntilGame > 0 && hoursUntilGame < 2 && mockEdge > 1) {
        newAlerts.push({
          id: `time-sensitive-${game.id}-${index}`,
          type: 'time-sensitive',
          title: 'Game Starting Soon',
          message: `${game.away_team} @ ${game.home_team} starts in ${hoursUntilGame.toFixed(1)} hours`,
          game: game,
          edge: mockEdge,
          priority: 'high',
          timestamp: now.toISOString(),
          icon: Clock,
          color: 'var(--warning)'
        });
      }
      
      // Favorite team alerts
      const sport = game.sport_key?.toLowerCase() || '';
      const league = sport.includes('nfl') ? 'NFL' : 
                   sport.includes('nba') ? 'NBA' : 
                   sport.includes('ncaaf') ? 'NCAAF' : 
                   sport.includes('ncaab') ? 'NCAAB' : 'Other';
      
      if (alertSettings.favoriteLeagues.includes(league) && mockEdge > 0.5) {
        newAlerts.push({
          id: `favorite-${game.id}-${index}`,
          type: 'favorite',
          title: `${league} Opportunity`,
          message: `Positive edge on ${game.away_team} @ ${game.home_team}`,
          game: game,
          edge: mockEdge,
          priority: 'medium',
          timestamp: now.toISOString(),
          icon: Target,
          color: 'var(--accent)'
        });
      }
    });

    // Enhanced line movement alerts
    if (alertSettings.enableLineMovement && Math.random() > 0.7) {
      const movements = [
        { team: 'Chiefs', from: '-3.5', to: '-6.0', direction: 'down' },
        { team: 'Lakers', from: '+2.5', to: '+5.0', direction: 'up' },
        { team: 'Cowboys', from: 'O 47.5', to: 'O 44.5', direction: 'down' }
      ];
      const movement = movements[Math.floor(Math.random() * movements.length)];
      
      newAlerts.push({
        id: `line-movement-${Date.now()}`,
        type: 'line-movement',
        title: '📈 Significant Line Movement',
        message: `${movement.team} line moved from ${movement.from} to ${movement.to} (${Math.abs(parseFloat(movement.to) - parseFloat(movement.from)).toFixed(1)} point shift)`,
        priority: 'medium',
        timestamp: now.toISOString(),
        icon: TrendingUp,
        color: movement.direction === 'up' ? '#22c55e' : '#ef4444',
        actionable: true,
        movement: movement
      });
    }
    
    // Live game alerts
    if (alertSettings.enableLiveAlerts) {
      const liveGames = games.filter(g => g.status === 'in_progress' || (g.completed === false && new Date(g.commence_time) <= now));
      
      liveGames.forEach((game, idx) => {
        if (Math.random() > 0.8) { // 20% chance for live alert
          newAlerts.push({
            id: `live-${game.id}-${idx}`,
            type: 'live-opportunity',
            title: '⚡ Live Betting Opportunity',
            message: `${game.away_team} @ ${game.home_team} - Live odds shifted during play`,
            game: game,
            priority: 'high',
            timestamp: now.toISOString(),
            icon: Zap,
            color: '#8b5cf6',
            actionable: true,
            isLive: true
          });
        }
      });
    }

    // Sort by priority and timestamp
    const sortedAlerts = newAlerts
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 10); // Limit to 10 alerts

    // Play sound for high priority alerts
    if (newAlerts.length > 0 && alertSettings.enableSound && soundEnabled) {
      const highPriorityAlerts = newAlerts.filter(a => a.priority === 'high' || a.priority === 'critical');
      if (highPriorityAlerts.length > 0) {
        playAlertSound(highPriorityAlerts[0].priority);
      }
    }
    
    setAlerts(sortedAlerts);
    if (newAlerts.length > 0) {
      setLastAlertTime(now);
    }
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getAlertCount = () => {
    return alerts.filter(alert => alert.priority === 'high' || alert.priority === 'critical').length;
  };
  
  const playAlertSound = (priority) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for different priorities
      if (priority === 'critical') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      } else {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  const AlertItem = ({ alert }) => {
    const Icon = alert.icon;
    
    return (
      <div className={`alert-item ${alert.priority} ${alert.isLive ? 'live-alert' : ''}`}>
        <div className="alert-icon" style={{ color: alert.color }}>
          <Icon size={18} />
          {alert.isLive && <div className="live-pulse"></div>}
        </div>
        <div className="alert-content">
          <div className="alert-title">{alert.title}</div>
          <div className="alert-message">{alert.message}</div>
          <div className="alert-meta">
            {alert.edge && (
              <div className="alert-edge">Edge: +{alert.edge.toFixed(1)}%</div>
            )}
            {alert.bookmaker && (
              <div className="alert-bookmaker">{alert.bookmaker}</div>
            )}
            <div className="alert-time">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </div>
          </div>
          {alert.actionable && (
            <div className="alert-actions">
              <button className="alert-action-btn primary">
                View Odds
              </button>
              <button className="alert-action-btn secondary">
                Add to Slip
              </button>
            </div>
          )}
        </div>
        <button 
          className="alert-dismiss"
          onClick={() => dismissAlert(alert.id)}
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="alert-system">
      {/* Alert Bell Button */}
      <button
        className={`alert-bell ${alerts.length > 0 ? 'has-alerts' : ''}`}
        onClick={() => setShowAlerts(!showAlerts)}
        title="View alerts"
      >
        <Bell size={18} />
        {getAlertCount() > 0 && (
          <span className="alert-badge">{getAlertCount()}</span>
        )}
      </button>

      {/* Alert Panel */}
      {showAlerts && (
        <div className="alert-panel">
          <div className="alert-header">
            <div className="alert-header-title">
              <Zap size={16} />
              <span>Alerts ({alerts.length})</span>
            </div>
            <div className="alert-header-actions">
              {alerts.length > 0 && (
                <button
                  className="clear-all-btn"
                  onClick={clearAllAlerts}
                  title="Clear all"
                >
                  Clear All
                </button>
              )}
              <button
                className="close-panel-btn"
                onClick={() => setShowAlerts(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="alert-content">
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <AlertTriangle size={32} />
                <p>No alerts at the moment</p>
                <span>We'll notify you when opportunities arise</span>
              </div>
            ) : (
              <div className="alert-list">
                {alerts.map(alert => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Alert Settings */}
          <div className="alert-settings">
            <div className="settings-header">
              <h4>Alert Settings</h4>
            </div>
            <div className="setting-item">
              <label>Min Edge Threshold:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={alertSettings.minEdge}
                onChange={(e) => setAlertSettings(prev => ({
                  ...prev,
                  minEdge: parseFloat(e.target.value) || 0
                }))}
              />
              <span>%</span>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={alertSettings.enableSound}
                  onChange={(e) => setAlertSettings(prev => ({
                    ...prev,
                    enableSound: e.target.checked
                  }))}
                />
                Sound Alerts
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={alertSettings.enableLineMovement}
                  onChange={(e) => setAlertSettings(prev => ({
                    ...prev,
                    enableLineMovement: e.target.checked
                  }))}
                />
                Line Movement Alerts
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={alertSettings.enableLiveAlerts}
                  onChange={(e) => setAlertSettings(prev => ({
                    ...prev,
                    enableLiveAlerts: e.target.checked
                  }))}
                />
                Live Game Alerts
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close panel */}
      {showAlerts && (
        <div 
          className="alert-overlay"
          onClick={() => setShowAlerts(false)}
        />
      )}
    </div>
  );
}
