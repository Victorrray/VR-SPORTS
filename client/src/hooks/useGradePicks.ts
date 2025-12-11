import { useState, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';

interface Pick {
  id: number | string;
  eventId?: string;
  sportKey?: string;
  pick?: string;
  line?: number | null;
  marketKey?: string;
  team1?: string;
  team2?: string;
  status?: 'pending' | 'won' | 'lost' | 'push';
}

interface GradedPick {
  eventId: string;
  status: 'won' | 'lost' | 'push' | 'pending' | 'error';
  message?: string;
  scores?: Array<{ name: string; score: string }>;
  homeTeam?: string;
  awayTeam?: string;
}

interface UseGradePicksResult {
  gradePicks: (picks: Pick[]) => Promise<GradedPick[]>;
  grading: boolean;
  error: string | null;
}

export function useGradePicks(): UseGradePicksResult {
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradePicks = useCallback(async (picks: Pick[]): Promise<GradedPick[]> => {
    // Filter picks that have eventId and sportKey and are pending
    const picksToGrade = picks.filter(
      p => p.eventId && p.sportKey && (!p.status || p.status === 'pending')
    );

    if (picksToGrade.length === 0) {
      return [];
    }

    setGrading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/grade-picks', {
        picks: picksToGrade.map(p => ({
          eventId: p.eventId,
          sportKey: p.sportKey,
          pick: p.pick,
          line: p.line,
          marketKey: p.marketKey,
          team1: p.team1,
          team2: p.team2
        }))
      });

      return response.data.gradedPicks || [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to grade picks';
      setError(errorMessage);
      console.error('Error grading picks:', err);
      return [];
    } finally {
      setGrading(false);
    }
  }, []);

  return { gradePicks, grading, error };
}
