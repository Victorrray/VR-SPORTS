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
    enablePush: false
  });

  useEffect(() => {
    if (games?.length) {
      generateAlerts();
    }
  }, [games, alertSettings]);

  const generateAlerts = () => {
    const newAlerts = [];
    const now = new Date();
    
    games.forEach((game, index) => {
      // Mock edge calculation - in real app this would use actual data
      const mockEdge = (Math.random() * 8) - 2; // -2% to +6% range
      const gameTime = new Date(game.commence_time);
      const hoursUntilGame = (gameTime - now) / (1000 * 60 * 60);
      
      // High +EV Alert
      if (mockEdge >= alertSettings.minEdge) {
        newAlerts.push({
          id: `high-ev-${game.id}-${index}`,
          type: 'high-ev',
          title: 'High +EV Opportunity',
          message: `${game.away_team} @ ${game.home_team} has ${mockEdge.toFixed(1)}% edge`,
          game: game,
          edge: mockEdge,
          priority: mockEdge > 4 ? 'high' : 'medium',
          timestamp: now.toISOString(),
          icon: TrendingUp,
          color: 'var(--success)'
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

    // Line movement alerts (mock)
    if (Math.random() > 0.7) {
      newAlerts.push({
        id: `line-movement-${Date.now()}`,
        type: 'line-movement',
        title: 'Significant Line Movement',
        message: 'Chiefs spread moved from -3.5 to -6.0 in last hour',
        priority: 'medium',
        timestamp: now.toISOString(),
        icon: TrendingUp,
        color: 'var(--info)'
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

    setAlerts(sortedAlerts);
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getAlertCount = () => {
    return alerts.filter(alert => alert.priority === 'high').length;
  };

  const AlertItem = ({ alert }) => {
    const Icon = alert.icon;
    
    return (
      <div className={`alert-item ${alert.priority}`}>
        <div className="alert-icon" style={{ color: alert.color }}>
          <Icon size={18} />
        </div>
        <div className="alert-content">
          <div className="alert-title">{alert.title}</div>
          <div className="alert-message">{alert.message}</div>
          {alert.edge && (
            <div className="alert-edge">Edge: +{alert.edge.toFixed(1)}%</div>
          )}
          <div className="alert-time">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </div>
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

          {/* Alert Settings */}
          <div className="alert-settings">
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
