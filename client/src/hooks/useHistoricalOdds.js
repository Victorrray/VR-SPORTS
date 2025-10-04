import { useState, useEffect } from 'react';
import { secureFetch } from '../utils/security';

/**
 * Hook to fetch historical odds for line movement analysis
 * 
 * @param {string} sport - Sport key
 * @param {string} eventId - Event ID
 * @param {Object} options - Options (date, markets, bookmakers, regions)
 * @returns {Object} - { history, loading, error, refetch }
 */
export function useHistoricalOdds(sport, eventId, options = {}) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    date,
    markets = 'h2h',
    bookmakers,
    regions = 'us'
  } = options;

  const fetchHistory = async () => {
    if (!sport || !eventId) {
      setHistory(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        regions,
        markets
      });
      
      if (date) params.set('date', date);
      if (bookmakers) params.set('bookmakers', bookmakers);

      const response = await secureFetch(
        `/api/historical/events/${sport}/${eventId}/odds?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch historical odds: ${response.statusText}`);
      }

      const data = await response.json();
      setHistory(data);
      
      console.log(`✅ Loaded historical odds for event ${eventId}:`, {
        timestamp: data.timestamp,
        bookmakers: data.data?.bookmakers?.length || 0
      });
      
    } catch (err) {
      console.error('Error fetching historical odds:', err);
      setError(err.message);
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [sport, eventId, date, markets, bookmakers, regions]);

  return { 
    history, 
    loading, 
    error,
    refetch: fetchHistory 
  };
}

/**
 * Extract line movement data for charting
 * @param {Array} snapshots - Array of historical snapshots
 * @param {string} bookmakerKey - Bookmaker to track
 * @param {string} outcome - Outcome name (e.g., team name)
 * @returns {Array} - Array of {timestamp, odds, point} objects
 */
export function extractLineMovement(snapshots, bookmakerKey, outcome) {
  if (!snapshots || !Array.isArray(snapshots)) return [];

  return snapshots
    .map(snapshot => {
      const bookmaker = snapshot.data?.bookmakers?.find(b => b.key === bookmakerKey);
      if (!bookmaker) return null;

      const market = bookmaker.markets?.[0]; // Assume first market
      if (!market) return null;

      const outcomeData = market.outcomes?.find(o => o.name === outcome);
      if (!outcomeData) return null;

      return {
        timestamp: snapshot.timestamp,
        odds: outcomeData.price,
        point: outcomeData.point,
        lastUpdate: market.last_update
      };
    })
    .filter(Boolean);
}

/**
 * Calculate line movement statistics
 * @param {Array} lineData - Line movement data from extractLineMovement
 * @returns {Object} - Statistics about the line movement
 */
export function calculateLineStats(lineData) {
  if (!lineData || lineData.length === 0) {
    return {
      openingOdds: null,
      currentOdds: null,
      movement: 0,
      movementPercent: 0,
      highOdds: null,
      lowOdds: null,
      avgOdds: null
    };
  }

  const odds = lineData.map(d => d.odds);
  const openingOdds = odds[0];
  const currentOdds = odds[odds.length - 1];
  const movement = currentOdds - openingOdds;
  const movementPercent = openingOdds !== 0 ? (movement / Math.abs(openingOdds)) * 100 : 0;

  return {
    openingOdds,
    currentOdds,
    movement,
    movementPercent: Math.round(movementPercent * 10) / 10,
    highOdds: Math.max(...odds),
    lowOdds: Math.min(...odds),
    avgOdds: Math.round(odds.reduce((sum, o) => sum + o, 0) / odds.length)
  };
}

/**
 * Detect steam moves (rapid line movement)
 * @param {Array} lineData - Line movement data
 * @param {number} threshold - Minimum movement to be considered steam (default: 10 points)
 * @returns {Array} - Array of steam move events
 */
export function detectSteamMoves(lineData, threshold = 10) {
  if (!lineData || lineData.length < 2) return [];

  const steamMoves = [];

  for (let i = 1; i < lineData.length; i++) {
    const prev = lineData[i - 1];
    const curr = lineData[i];
    const movement = Math.abs(curr.odds - prev.odds);

    if (movement >= threshold) {
      steamMoves.push({
        timestamp: curr.timestamp,
        from: prev.odds,
        to: curr.odds,
        movement,
        direction: curr.odds > prev.odds ? 'up' : 'down'
      });
    }
  }

  return steamMoves;
}

/**
 * Compare closing line value
 * @param {number} betOdds - Odds when bet was placed
 * @param {number} closingOdds - Closing odds
 * @returns {Object} - CLV analysis
 */
export function calculateCLV(betOdds, closingOdds) {
  const movement = closingOdds - betOdds;
  const clvPercent = betOdds !== 0 ? (movement / Math.abs(betOdds)) * 100 : 0;

  return {
    movement,
    clvPercent: Math.round(clvPercent * 10) / 10,
    beatClosing: movement > 0, // Positive CLV
    description: movement > 0 
      ? `Beat closing line by ${Math.abs(movement)} points`
      : movement < 0
      ? `Closing line moved against you by ${Math.abs(movement)} points`
      : 'No line movement'
  };
}
