import { useState, useEffect } from 'react';
import { secureFetch } from '../utils/security';

/**
 * Hook to fetch available markets for a specific event
 * Costs 1 API credit (cheaper than fetching full odds)
 * 
 * @param {string} sport - Sport key (e.g., 'americanfootball_nfl')
 * @param {string} eventId - Event ID
 * @param {string} regions - Regions (default: 'us')
 * @returns {Object} - { markets, loading, error, refetch }
 */
export function useEventMarkets(sport, eventId, regions = 'us') {
  const [markets, setMarkets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarkets = async () => {
    if (!sport || !eventId) {
      setMarkets(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await secureFetch(
        `/api/events/${sport}/${eventId}/markets?regions=${regions}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch markets: ${response.statusText}`);
      }

      const data = await response.json();
      setMarkets(data);
      
      console.log(`✅ Loaded markets for event ${eventId}:`, {
        eventId: data.id,
        bookmakerCount: data.bookmakers?.length || 0,
        totalMarkets: data.bookmakers?.reduce((sum, b) => sum + (b.markets?.length || 0), 0) || 0
      });
      
    } catch (err) {
      console.error('Error fetching event markets:', err);
      setError(err.message);
      setMarkets(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [sport, eventId, regions]);

  return { 
    markets, 
    loading, 
    error,
    refetch: fetchMarkets 
  };
}

/**
 * Get all unique market keys across all bookmakers
 * @param {Object} marketsData - Data from useEventMarkets
 * @returns {Array} - Array of unique market keys
 */
export function getUniqueMarkets(marketsData) {
  if (!marketsData?.bookmakers) return [];

  const marketSet = new Set();
  
  marketsData.bookmakers.forEach(bookmaker => {
    bookmaker.markets?.forEach(market => {
      marketSet.add(market.key);
    });
  });

  return Array.from(marketSet).sort();
}

/**
 * Get bookmakers that offer a specific market
 * @param {Object} marketsData - Data from useEventMarkets
 * @param {string} marketKey - Market key to search for
 * @returns {Array} - Array of bookmaker keys
 */
export function getBookmakersForMarket(marketsData, marketKey) {
  if (!marketsData?.bookmakers) return [];

  return marketsData.bookmakers
    .filter(bookmaker => 
      bookmaker.markets?.some(market => market.key === marketKey)
    )
    .map(bookmaker => bookmaker.key);
}

/**
 * Group markets by category
 * @param {Array} marketKeys - Array of market keys
 * @returns {Object} - Markets grouped by category
 */
export function groupMarketsByCategory(marketKeys) {
  const groups = {
    main: [],
    player: [],
    team: [],
    alternate: [],
    other: []
  };

  marketKeys.forEach(key => {
    if (['h2h', 'spreads', 'totals'].includes(key)) {
      groups.main.push(key);
    } else if (key.startsWith('player_') || key.startsWith('batter_') || key.startsWith('pitcher_')) {
      groups.player.push(key);
    } else if (key.startsWith('team_')) {
      groups.team.push(key);
    } else if (key.includes('alternate')) {
      groups.alternate.push(key);
    } else {
      groups.other.push(key);
    }
  });

  return groups;
}

/**
 * Format market key to readable name
 * @param {string} marketKey - Market key
 * @returns {string} - Formatted name
 */
export function formatMarketKey(marketKey) {
  const replacements = {
    'h2h': 'Moneyline',
    'spreads': 'Spreads',
    'totals': 'Totals',
    'player_': 'Player ',
    'team_': 'Team ',
    'alternate_': 'Alt ',
    '_': ' '
  };

  let formatted = marketKey;
  Object.entries(replacements).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(key, 'g'), value);
  });

  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
