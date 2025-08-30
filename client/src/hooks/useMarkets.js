// src/hooks/useMarkets.js
import { useCallback, useEffect, useMemo, useState } from "react";

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
    try {
      setLoading(true);
      setError(null);
      setGames([]);

      const keys = Array.isArray(sports) ? sports : [];
      if (!keys.length) {
        setGames([]);
        return;
      }

      const cacheBust = encodeURIComponent(String(refreshKey || Date.now()));
      const calls = keys.map(k =>
        fetch(`${baseUrl}/api/odds-data?sport=${k}&regions=${regions}&markets=${marketsParam}&includeBetLimits=true&_=${cacheBust}`)
          .then(async r => {
            if (r.ok && quota.remain === "–") {
              setQuota({
                remain: r.headers.get("x-requests-remaining") ?? "—",
                used: r.headers.get("x-requests-used") ?? "—",
              });
            }
            return r.ok ? r.json() : [];
          })
          .catch(() => [])
      );
      const gamesRaw = (await Promise.all(calls)).flat();

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
      setError(e.message || String(e));
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [sports, baseUrl, regions, marketsParam, allowedBooksKey, excludeBooksKey, refreshKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { games, books, loading, error, quota, refetch: fetchAll };
}
