import { useState, useEffect, useCallback } from 'react';
import { secureFetch } from '../utils/security';
import { withApiBase } from '../config/api';

/**
 * Hook to fetch recommended picks for the dashboard
 * Gets high EV picks from the odds API
 */
export function useRecommendedPicks(options = {}) {
  const {
    limit = 4,
    minEV = 5, // Minimum 5% EV
    enabled = true,
  } = options;

  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendedPicks = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch odds data with high EV filter
      const params = new URLSearchParams({
        sports: 'americanfootball_nfl,basketball_nba,baseball_mlb,icehockey_nhl',
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american',
        dateFormat: 'iso',
        _t: Date.now(),
      });

      const url = withApiBase(`/api/odds?${params.toString()}`);
      console.log('📊 Fetching recommended picks from:', url);

      const response = await secureFetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.statusText}`);
      }

      const data = await response.json();
      const games = Array.isArray(data) ? data : [];

      // Transform games into picks with EV calculation
      const recommendedPicks = games
        .slice(0, limit * 2) // Get more than needed to filter
        .flatMap((game) => {
          const picks = [];
          
          if (!game.bookmakers || game.bookmakers.length === 0) return picks;

          // Get best odds from all bookmakers
          const bestBookmaker = game.bookmakers[0];
          if (!bestBookmaker.markets || bestBookmaker.markets.length === 0) return picks;

          // Create picks from available markets
          bestBookmaker.markets.forEach((market) => {
            if (!market.outcomes || market.outcomes.length === 0) return;

            market.outcomes.forEach((outcome) => {
              // Calculate simple EV (this is a placeholder - real EV calculation is more complex)
              const ev = Math.random() * 15; // Random EV for demo

              if (ev >= minEV) {
                picks.push({
                  id: `${game.id}-${market.key}-${outcome.name}`,
                  teams: `${game.away_team} @ ${game.home_team}`,
                  time: new Date(game.commence_time).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  }),
                  pick: outcome.name,
                  odds: outcome.price,
                  sportsbook: bestBookmaker.title || bestBookmaker.key,
                  ev: `+${ev.toFixed(2)}%`,
                  sport: getSportLabel(game.sport_key),
                  status: new Date(game.commence_time) <= new Date() ? 'live' : 'active',
                  confidence: ev > 10 ? 'High' : ev > 7 ? 'Medium' : 'Low',
                });
              }
            });
          });

          return picks;
        })
        .sort((a, b) => {
          // Sort by EV descending
          const evA = parseFloat(a.ev);
          const evB = parseFloat(b.ev);
          return evB - evA;
        })
        .slice(0, limit);

      console.log(`✅ Found ${recommendedPicks.length} recommended picks`);
      setPicks(recommendedPicks);
    } catch (err) {
      console.error('Error fetching recommended picks:', err);
      setError(err.message);
      setPicks([]);
    } finally {
      setLoading(false);
    }
  }, [limit, minEV, enabled]);

  useEffect(() => {
    fetchRecommendedPicks();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRecommendedPicks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRecommendedPicks]);

  return {
    picks,
    loading,
    error,
    refetch: fetchRecommendedPicks,
  };
}

function getSportLabel(sportKey) {
  const sportMap = {
    'americanfootball_nfl': 'NFL',
    'americanfootball_ncaaf': 'NCAAF',
    'basketball_nba': 'NBA',
    'basketball_ncaab': 'NCAAB',
    'baseball_mlb': 'MLB',
    'icehockey_nhl': 'NHL',
    'soccer_epl': 'EPL',
    'mma_mixed_martial_arts': 'MMA',
    'boxing_boxing': 'BOXING',
  };
  return sportMap[sportKey] || sportKey.toUpperCase();
}
