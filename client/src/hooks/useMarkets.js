// src/hooks/useMarkets.js
import { useState, useEffect, useCallback, useMemo } from "react";
import { cacheUtils, cacheKeys } from "../utils/cache";
import { secureFetch, apiRateLimiter } from "../utils/security";

// Small utility to normalize arrays from API responses
function normalizeArray(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp && typeof resp === "object") return Object.values(resp);
  return [];
}

// Reusable hook to fetch sportsbook market odds across sports
// Options:
// - sports: array of sport keys
// - markets: array of market keys to request
// - baseUrl: server base URL
// - regions: CSV region keys (default 'us,us2,us_ex')
// - excludeBooks: array of bookmaker keys to exclude (e.g., DFS)
// - allowedBooks: optional allowlist of bookmaker keys to include
// - refreshKey: value to force refetch when changed
export default function useMarkets({
  sports = [],
  markets = ["h2h","spreads","totals"],
  baseUrl = "",
  regions = "us,us2,us_ex",
  excludeBooks = [],
  allowedBooks = null,
  refreshKey = 0,
} = {}) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [books, setBooks] = useState([]);
  const [quota, setQuota] = useState({ remain: "–", used: "–" });

  const marketsParam = useMemo(() => {
    const CANON = { alternate_spreads: 'spreads_alternate', alternate_totals: 'totals_alternate' };
    const set = new Set();
    (markets || []).forEach(k => set.add(CANON[k] || k));
    return Array.from(set).join(",");
  }, [markets]);

  // Stabilize collection dependencies by content
  const allowedBooksKey = useMemo(() => JSON.stringify(Array.from(allowedBooks || [])), [allowedBooks]);
  const excludeBooksKey = useMemo(() => JSON.stringify(Array.from(excludeBooks || [])), [excludeBooks]);

  const fetchAll = useCallback(async () => {
    if (!sports.length) return;
    setLoading(true);
    setError(null);

    try {
      const cacheKey = cacheKeys.odds(sports, marketsParam, allowedBooksKey);
      
      const data = await cacheUtils.withCache(cacheKey, async () => {
        // Check rate limit before making request
        if (!apiRateLimiter.isAllowed('odds-api')) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }

        const url = `${baseUrl}/api/odds?sports=${sports.join(",")}&regions=${regions}&markets=${marketsParam}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        return await resp.json();
      }, 180000); // 3 minute cache for odds data

      const gamesRaw = normalizeArray(data);

      // Filter bookmakers by exclude/allow lists (normalized from keys)
      const exArr = (() => { try { return JSON.parse(excludeBooksKey) || []; } catch { return []; } })();
      const allowArr = (() => { try { return JSON.parse(allowedBooksKey) || []; } catch { return []; } })();
      const ex = new Set(exArr.map(k => String(k).toLowerCase()));
      const allow = allowArr.length ? new Set(allowArr.map(k => String(k).toLowerCase())) : null;

      const filteredGames = gamesRaw
        .map(g => ({
          ...g,
          bookmakers: (g.bookmakers || [])
            .filter(bk => !ex.has((bk.key || '').toLowerCase()))
            .filter(bk => allow ? allow.has((bk.key || '').toLowerCase()) : true),
        }))
        .filter(g => Array.isArray(g.bookmakers) && g.bookmakers.length > 0);

      setGames(filteredGames);

      // Build unique bookmaker list present in results
      const seen = new Map();
      const cleanTitle = (t) => String(t || '').replace(/\.?ag\b/gi, '').trim();
      filteredGames.forEach(g => (g.bookmakers || []).forEach(bk => {
        const key = (bk.key || '').toLowerCase();
        if (!key) return;
        if (!seen.has(key)) seen.set(key, { key, title: cleanTitle(bk.title || key) });
      }));
      const booksArr = Array.from(seen.values()).sort((a, b) => a.title.localeCompare(b.title));
      setBooks(booksArr);
    } catch (e) {
      console.error("Markets API Error:", e?.message || e);
      
      // Enhanced error handling with specific error types
      let errorMessage = "Failed to load odds data";
      
      if (e?.name === 'TypeError' && e?.message?.includes('fetch')) {
        errorMessage = "Network error - please check your connection";
      } else if (e?.message?.includes('429')) {
        errorMessage = "Rate limit exceeded - please wait a moment";
      } else if (e?.message?.includes('401') || e?.message?.includes('403')) {
        errorMessage = "Authentication error - please refresh the page";
      } else if (e?.message?.includes('500')) {
        errorMessage = "Server error - our team has been notified";
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      setGames([]);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [sports, baseUrl, regions, marketsParam, allowedBooksKey, excludeBooksKey, refreshKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { games, books, loading, error, quota, refetch: fetchAll };
}
