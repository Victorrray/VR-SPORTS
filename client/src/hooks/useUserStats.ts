import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './SimpleAuth';

export interface UserStats {
  winRate: string;
  averageEdge: string;
  totalProfit: string;
  activeBets: number;
  loading: boolean;
  error: string | null;
}

export function useUserStats(): UserStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    winRate: '0%',
    averageEdge: '0%',
    totalProfit: '$0',
    activeBets: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user || !supabase) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchUserStats = async () => {
      try {
        // Fetch user picks to calculate stats
        const { data: picks, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .eq('user_id', user.id);

        if (picksError) {
          console.warn('Error fetching picks:', picksError);
          setStats(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load stats',
          }));
          return;
        }

        if (!picks || picks.length === 0) {
          setStats(prev => ({
            ...prev,
            loading: false,
            winRate: '0%',
            averageEdge: '0%',
            totalProfit: '$0',
            activeBets: 0,
          }));
          return;
        }

        // Calculate stats from picks
        const activePicks = picks.filter((p: any) => p.status === 'active' || p.status === 'pending');
        const completedPicks = picks.filter((p: any) => p.status === 'won' || p.status === 'lost');
        
        let winRate = '0%';
        if (completedPicks.length > 0) {
          const wins = completedPicks.filter((p: any) => p.status === 'won').length;
          const rate = (wins / completedPicks.length) * 100;
          winRate = `${rate.toFixed(1)}%`;
        }

        // Calculate average edge
        let averageEdge = '0%';
        if (picks.length > 0) {
          const totalEV = picks.reduce((sum: number, p: any) => {
            const ev = parseFloat(p.expected_value || '0');
            return sum + ev;
          }, 0);
          const avgEV = totalEV / picks.length;
          averageEdge = `${avgEV.toFixed(1)}%`;
        }

        // Calculate total profit
        let totalProfit = '$0';
        const profitAmount = picks.reduce((sum: number, p: any) => {
          const profit = parseFloat(p.profit || '0');
          return sum + profit;
        }, 0);
        totalProfit = `$${Math.abs(profitAmount).toFixed(0)}`;
        if (profitAmount < 0) {
          totalProfit = `-${totalProfit}`;
        }

        setStats({
          winRate,
          averageEdge,
          totalProfit,
          activeBets: activePicks.length,
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
