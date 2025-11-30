import { useEffect, useState } from 'react';

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
        const response = await fetch('/api/featured');

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.bet) {
          // Format the game time in user's local timezone
          const gameTime = new Date(data.bet.gameTime).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          });

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
          // Fallback data when API returns no bet
          const fallbackBet: FeaturedBet = {
            id: 'fallback',
            sport: 'NBA',
            teams: 'Boston Celtics @ Miami Heat',
            gameTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            }),
            pick: 'Boston Celtics -4.5',
            odds: -110,
            sportsbook: 'DraftKings',
            ev: '+3.2%'
          };
          setBet(fallbackBet);
          console.log('⚠️ Using fallback featured bet');
        }
      } catch (err) {
        console.error('Error fetching featured bet:', err);
        // Show fallback data on error
        const fallbackBet: FeaturedBet = {
          id: 'fallback-error',
          sport: 'NBA',
          teams: 'Boston Celtics @ Miami Heat',
          gameTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          }),
          pick: 'Boston Celtics -4.5',
          odds: -110,
          sportsbook: 'DraftKings',
          ev: '+3.2%'
        };
        setBet(fallbackBet);
        console.log('⚠️ Using fallback featured bet due to API error');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBet();
  }, []);

  return { bet, loading, error };
}
