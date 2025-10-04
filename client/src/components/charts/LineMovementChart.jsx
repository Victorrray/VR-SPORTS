import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { 
  extractLineMovement, 
  calculateLineStats, 
  detectSteamMoves 
} from '../../hooks/useHistoricalOdds';
import './LineMovementChart.css';

/**
 * Line Movement Chart Component
 * Shows how odds have changed over time
 */
export default function LineMovementChart({ 
  snapshots, 
  bookmakerKey, 
  outcome,
  title 
}) {
  if (!snapshots || !bookmakerKey || !outcome) {
    return (
      <div className="line-chart-empty">
        <Activity size={32} />
        <p>No line movement data available</p>
      </div>
    );
  }

  const lineData = extractLineMovement(snapshots, bookmakerKey, outcome);
  
  if (lineData.length === 0) {
    return (
      <div className="line-chart-empty">
        <p>No data for {bookmakerKey}</p>
      </div>
    );
  }

  const stats = calculateLineStats(lineData);
  const steamMoves = detectSteamMoves(lineData);

  // Calculate chart dimensions
  const maxOdds = Math.max(...lineData.map(d => d.odds));
  const minOdds = Math.min(...lineData.map(d => d.odds));
  const range = maxOdds - minOdds || 1;
  const padding = range * 0.1;

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  // Calculate Y position (inverted for SVG)
  const getY = (odds) => {
    return 100 - ((odds - (minOdds - padding)) / (range + 2 * padding)) * 100;
  };

  // Generate SVG path
  const pathData = lineData
    .map((point, i) => {
      const x = (i / (lineData.length - 1)) * 100;
      const y = getY(point.odds);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="line-movement-chart">
      {title && <h4 className="chart-title">{title}</h4>}
      
      {/* Stats Summary */}
      <div className="line-stats">
        <div className="stat-item">
          <span className="stat-label">Opening</span>
          <span className="stat-value">{stats.openingOdds > 0 ? '+' : ''}{stats.openingOdds}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Current</span>
          <span className="stat-value">{stats.currentOdds > 0 ? '+' : ''}{stats.currentOdds}</span>
        </div>
        <div className={`stat-item movement ${stats.movement > 0 ? 'up' : stats.movement < 0 ? 'down' : 'neutral'}`}>
          <span className="stat-label">Movement</span>
          <span className="stat-value">
            {stats.movement > 0 ? <TrendingUp size={14} /> : stats.movement < 0 ? <TrendingDown size={14} /> : '—'}
            {stats.movement !== 0 && `${stats.movement > 0 ? '+' : ''}${stats.movement}`}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="chart-container">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart-svg">
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" className="grid-line" />
          <line x1="0" y1="50" x2="100" y2="50" className="grid-line" />
          <line x1="0" y1="75" x2="100" y2="75" className="grid-line" />
          
          {/* Line path */}
          <path d={pathData} className="line-path" />
          
          {/* Data points */}
          {lineData.map((point, i) => (
            <circle
              key={i}
              cx={(i / (lineData.length - 1)) * 100}
              cy={getY(point.odds)}
              r="1.5"
              className="data-point"
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="y-axis-labels">
          <span>{maxOdds > 0 ? '+' : ''}{Math.round(maxOdds)}</span>
          <span>{minOdds > 0 ? '+' : ''}{Math.round(minOdds)}</span>
        </div>
      </div>

      {/* Time labels */}
      <div className="time-labels">
        <span>{formatTime(lineData[0].timestamp)}</span>
        <span>{formatTime(lineData[lineData.length - 1].timestamp)}</span>
      </div>

      {/* Steam moves alert */}
      {steamMoves.length > 0 && (
        <div className="steam-moves-alert">
          <Activity size={14} />
          <span>{steamMoves.length} steam move{steamMoves.length > 1 ? 's' : ''} detected</span>
        </div>
      )}
    </div>
  );
}
