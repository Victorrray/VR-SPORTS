import { useState, useEffect, useCallback, useRef } from 'react';
import { withApiBase } from '../config/api';
import { secureFetch } from '../utils/security';

function normalizeHistory(data = []) {
  if (!Array.isArray(data)) return [];

  return data.map((bookmaker) => {
    const key = bookmaker?.key || bookmaker?.bookmaker?.key || bookmaker?.bookmakerKey;
    const title = bookmaker?.title || bookmaker?.bookmaker?.title || key || 'Book';
    const markets = Array.isArray(bookmaker?.markets) ? bookmaker.markets : [];

    const normalizedMarkets = markets.map((market) => {
      const marketKey = market?.key || market?.market_key || market?.marketKey || 'market';
      const snapshots = Array.isArray(market?.history)
        ? market.history
        : Array.isArray(market?.odds)
          ? market.odds
          : [market];

      return snapshots.map((snapshot) => {
        const lastUpdate = snapshot?.last_update || market?.last_update || bookmaker?.last_update || null;
        const outcomes = Array.isArray(snapshot?.outcomes) ? snapshot.outcomes : [];

        return outcomes.map((outcome) => ({
          bookmakerKey: key,
          bookmakerTitle: title,
          marketKey,
          lastUpdate,
          outcomeName: outcome?.name || outcome?.description || outcome?.participant || 'Outcome',
          price: outcome?.price ?? outcome?.odds ?? null,
          point: outcome?.point ?? null,
        }));
      }).flat();
    }).flat();

    return normalizedMarkets;
  }).flat();
}

export function useOddsHistory({
  sportKey,
  eventId,
  markets = [],
  bookmakers = [],
  enabled = true,
} = {}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    if (!enabled || !sportKey || !eventId) return null;

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('sport', sportKey);
      params.set('eventId', eventId);
      if (Array.isArray(markets) && markets.length > 0) {
        params.set('markets', markets.join(','));
      }
      if (Array.isArray(bookmakers) && bookmakers.length > 0) {
        params.set('bookmakers', bookmakers.join(','));
      }

      const url = withApiBase(`/api/odds-history?${params.toString()}`);

      const response = await secureFetch(url, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || payload?.message || 'Failed to fetch odds history');
      }

      const json = await response.json().catch(() => []);
      const normalized = normalizeHistory(json);
      setHistory(normalized);
      return normalized;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      console.error('useOddsHistory error:', err);
      setError(err.message || 'Failed to load line movement');
      setHistory([]);
      return null;
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  }, [enabled, sportKey, eventId, markets, bookmakers]);

  useEffect(() => {
    let mounted = true;
    if (enabled && sportKey && eventId) {
      fetchHistory();
    } else if (!enabled && mounted) {
      setHistory([]);
      setError(null);
      setLoading(false);
    }
    return () => {
      mounted = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchHistory, enabled, sportKey, eventId]);

  return {
    history,
    loading,
    error,
    refresh: fetchHistory,
  };
}

export default useOddsHistory;
