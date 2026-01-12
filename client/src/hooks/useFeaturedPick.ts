import { useEffect, useState } from 'react';
import { withApiBase } from '../config/api';

export interface FeaturedBet {
  id: string;
  sport: string;
  teams: string;
  gameTime: string;
  pick: string;
  odds: number | string;
  sportsbook: string;
  ev: string;
}

export function useFeaturedPick() {
  const [bet, setBet] = useState<FeaturedBet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedBet = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `featured-bet-${today}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const cachedBet = JSON.parse(cached);
            setBet(cachedBet);
            setLoading(false);
            return;
          } catch (e) {
            console.warn('Failed to parse cached bet');
            localStorage.removeItem(cacheKey);
          }
        }

        // Fetch from API
        const response = await fetch(withApiBase('/api/featured'));

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.bet) {
          // Format the game time
          const gameTime = new Date(data.bet.gameTime).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Los_Angeles'
          }) + ' PST';

          const formattedBet: FeaturedBet = {
            id: data.bet.id,
            sport: data.bet.sport,
            teams: data.bet.teams,
            gameTime,
            pick: data.bet.pick,
            odds: data.bet.odds,
            sportsbook: data.bet.sportsbook,
            ev: data.bet.ev
          };

          setBet(formattedBet);
          localStorage.setItem(cacheKey, JSON.stringify(formattedBet));
          console.log('✅ Featured bet loaded from API:', formattedBet.teams);
        } else {
          // No featured bet available - don't show fake data
          setBet(null);
          console.log('ℹ️ No featured bet available from API');
        }
      } catch (err) {
        console.error('Error fetching featured bet:', err);
        // Don't show fake data on error - just show nothing
        setBet(null);
        setError('Failed to load featured bet');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBet();
  }, []);

  return { bet, loading, error };
}
