import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './SimpleAuth';

export interface UserStats {
  winRate: string;
  averageEdge: string;
  totalProfit: string;
  activeBets: number;
  totalPicks: number;
  loading: boolean;
  error: string | null;
}

// Helper to calculate stats from picks array
function calculateStatsFromPicks(picks: any[]): Omit<UserStats, 'loading' | 'error'> {
  if (!picks || picks.length === 0) {
    return {
      winRate: '0%',
      averageEdge: '0%',
      totalProfit: '$0',
      activeBets: 0,
      totalPicks: 0,
    };
  }

  // Calculate active bets (pending status)
  const activePicks = picks.filter((p: any) => 
    p.status === 'active' || p.status === 'pending'
  );
  
  // Calculate completed picks for win rate
  const completedPicks = picks.filter((p: any) => 
    p.status === 'won' || p.status === 'lost'
  );
  
  let winRate = '0%';
  if (completedPicks.length > 0) {
    const wins = completedPicks.filter((p: any) => p.status === 'won').length;
    const rate = (wins / completedPicks.length) * 100;
    winRate = `${rate.toFixed(1)}%`;
  }

  // Calculate average edge/EV from all picks
  let averageEdge = '0%';
  const picksWithEV = picks.filter((p: any) => {
    const ev = parseFloat(p.expected_value || p.ev || p.edge || '0');
    return !isNaN(ev) && ev !== 0;
  });
  
  if (picksWithEV.length > 0) {
    const totalEV = picksWithEV.reduce((sum: number, p: any) => {
      const ev = parseFloat(p.expected_value || p.ev || p.edge || '0');
      return sum + ev;
    }, 0);
    const avgEV = totalEV / picksWithEV.length;
    averageEdge = `${avgEV.toFixed(1)}%`;
  }

  // Calculate total profit
  let totalProfit = '$0';
  const profitAmount = picks.reduce((sum: number, p: any) => {
    const profit = parseFloat(p.profit || p.payout || '0');
    return sum + profit;
  }, 0);
  
  if (profitAmount !== 0) {
    totalProfit = profitAmount >= 0 
      ? `+$${Math.abs(profitAmount).toFixed(0)}`
      : `-$${Math.abs(profitAmount).toFixed(0)}`;
  }

  return {
    winRate,
    averageEdge,
    totalProfit,
    activeBets: activePicks.length,
    totalPicks: picks.length,
  };
}

// Get picks from localStorage
function getLocalStoragePicks(): any[] {
  try {
    const stored = localStorage.getItem('my_picks_v1');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Error loading picks from localStorage:', error);
    return [];
  }
}

export function useUserStats(): UserStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    winRate: '0%',
    averageEdge: '0%',
    totalProfit: '$0',
    activeBets: 0,
    totalPicks: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        let picks: any[] = [];
        
        // Try to fetch from Supabase if user is logged in
        if (user && supabase) {
          const { data: supabasePicks, error: picksError } = await supabase
            .from('picks')
            .select('*')
            .eq('user_id', user.id);

          if (!picksError && supabasePicks && supabasePicks.length > 0) {
            picks = supabasePicks;
            console.log('📊 Stats: Using Supabase picks:', picks.length);
          }
        }
        
        // Fallback to localStorage picks if no Supabase picks
        if (picks.length === 0) {
          picks = getLocalStoragePicks();
          console.log('📊 Stats: Using localStorage picks:', picks.length);
        }

        const calculatedStats = calculateStatsFromPicks(picks);
        
        setStats({
          ...calculatedStats,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        console.error('Error calculating stats:', err);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load stats',
        }));
      }
    };

    fetchUserStats();
  }, [user]);

  return stats;
}
