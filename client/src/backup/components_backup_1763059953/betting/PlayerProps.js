import React, { useState, useEffect, useMemo, useRef } from 'react';
import { withApiBase } from '../../config/api';
import { secureFetch } from '../../utils/security';
import { useQuotaHandler } from '../../hooks/useQuotaHandler';
import QuotaExceededModal from './QuotaExceededModal';

const DEFAULT_MARKETS = [
  'player_points','player_assists','player_rebounds',
  'player_points_rebounds_assists','player_pass_tds','player_passing_yards',
  'player_rushing_yards','player_receiving_yards','player_receptions',
];

function useDebugFlag() {
  const urlHas = new URLSearchParams(window.location.search).get("debug") === "1";
  const lsHas = typeof localStorage !== "undefined" && localStorage.getItem("propsDebug") === "1";
  return urlHas || lsHas;
}

export default function PlayerProps({
  eventId: rawEventId,
  game_id,
  sport = 'americanfootball_nfl',
  league,
  eventDate,
  commenceTime,
  markets = DEFAULT_MARKETS,
  bookmakers = []
}) {
  const eventId = rawEventId || game_id;
  const resolvedLeague = league || sport;
  const debug = useDebugFlag();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUrl, setLastUrl] = useState("");
  const { quotaExceeded, quotaError, handleApiResponse } = useQuotaHandler();
  const previousSnapshotRef = useRef(null);

  const derivedDate = useMemo(() => {
    if (eventDate && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return eventDate;
    if (commenceTime) {
      const dt = new Date(commenceTime);
      if (!Number.isNaN(dt.getTime())) {
        return dt.toISOString().slice(0, 10);
      }
    }
    return null;
  }, [eventDate, commenceTime]);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (resolvedLeague) params.set('league', resolvedLeague);
    if (derivedDate) params.set('date', derivedDate);
    if (eventId) params.set('game_id', eventId);
    if (markets && markets.length) {
      params.set('markets', Array.isArray(markets) ? markets.join(',') : String(markets || '').trim());
    }
    if (bookmakers && bookmakers.length > 0) {
      params.set('bookmakers', Array.isArray(bookmakers) ? bookmakers.join(',') : String(bookmakers));
    }
    return params.toString();
  }, [resolvedLeague, derivedDate, eventId, markets, bookmakers]);

  useEffect(() => {
    if (!resolvedLeague || !derivedDate) {
      setSnapshot(null);
      setError('Insufficient event metadata for props');
      return;
    }
    const base = withApiBase('');
    const url = `${base}/api/player-props?${qs}`;
    setLastUrl(url);
    setLoading(true);
    setError(null);
    secureFetch(url, { credentials: 'include', headers: { 'Accept': 'application/json' } })
      .then(async (r) => {
        // Handle quota exceeded before other processing
        const quotaResult = await handleApiResponse(r);
        if (quotaResult.quotaExceeded) {
          return; // Stop processing if quota exceeded
        }
        
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || r.statusText || "Request failed");
        return j;
      })
      .then((j) => {
        if (!j) return;
        const formatted = {
          items: Array.isArray(j.items) ? j.items : [],
          stale: !!j.stale,
          ttl: j.ttl ?? null,
          as_of: j.as_of || null,
        };
        previousSnapshotRef.current = formatted;
        setSnapshot(formatted);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load props');
        if (previousSnapshotRef.current) {
          setSnapshot(previousSnapshotRef.current);
        }
      })
      .finally(() => setLoading(false));
  }, [qs, resolvedLeague, derivedDate, eventId, handleApiResponse]);

  // ---------- UI ----------
  const panel = (children) => (
    <div className="rounded-xl border border-white/10 p-3 text-sm">{children}</div>
  );

  const debugPanel = debug ? (
    <div className="mt-2 text-xs opacity-80 whitespace-pre-wrap break-words">
      <div><b>Request:</b> {lastUrl || "(pending)"} </div>
      <div><b>Error:</b> {error ? String(error) : "–"}</div>
      <div><b>Payload keys:</b> {payload ? Object.keys(payload).join(", ") : "–"}</div>
      <div style={{maxHeight: 180, overflow: "auto", marginTop: 6}}>
        <code>{JSON.stringify(payload ?? {}, null, 2)}</code>
      </div>
    </div>
  ) : null;

  if (!resolvedLeague || !derivedDate) return panel(<div>Missing schedule data.{debugPanel}</div>);

  const currentData = snapshot || previousSnapshotRef.current;

  if (loading && (!currentData || currentData.items.length === 0)) {
    return panel(<div>Loading player props…{debugPanel}</div>);
  }

  if (error) return panel(<div className="text-red-400">Props error: {error}{debugPanel}</div>);

  if (!currentData) return panel(<div>No props available.{debugPanel}</div>);

  const filteredItems = useMemo(() => {
    if (!currentData?.items) return [];
    return currentData.items.filter((item) => !eventId || item.game_id === eventId);
  }, [currentData, eventId]);

  const grouped = useMemo(() => {
    const map = new Map();
    filteredItems.forEach((item) => {
      const key = `${item.player}||${item.market}`;
      if (!map.has(key)) {
        map.set(key, {
          player: item.player,
          market: item.market,
          books: new Map(),
        });
      }
      const group = map.get(key);
      const bookKey = item.book || 'book';
      if (!group.books.has(bookKey)) {
        group.books.set(bookKey, {
          book: bookKey,
          label: item.book_label || bookKey,
          outcomes: [],
        });
      }
      group.books.get(bookKey).outcomes.push(item);
    });

    return Array.from(map.values()).map((group) => ({
      player: group.player,
      market: group.market,
      books: Array.from(group.books.values()).map((book) => ({
        ...book,
        outcomes: book.outcomes.sort((a, b) => a.ou.localeCompare(b.ou)),
      })),
    }));
  }, [filteredItems]);

  if (!grouped.length) {
    return panel(
      <div>
        <div>No player props available yet for this event.</div>
        {debugPanel}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {currentData.stale && (
        <div className="text-xs text-amber-300">Using cached props (stale).</div>
      )}
      {currentData.as_of && (
        <div className="text-xs opacity-60">As of {new Date(currentData.as_of).toLocaleTimeString()}</div>
      )}

      <div className="space-y-3">
        {grouped.map((group) => (
          <div key={`${group.player}-${group.market}`} className="rounded-xl border border-white/10 p-3">
            <div className="text-xs opacity-70 uppercase">{group.market.replace(/_/g, ' ')}</div>
            <div className="font-medium text-base">{group.player}</div>
            <div className="space-y-2 mt-2">
              {group.books.map((book) => (
                <div key={book.book} className="bg-white/5 rounded-lg p-2">
                  <div className="text-xs opacity-70 mb-1">{book.label}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {book.outcomes.map((outcome, idx) => {
                      const priceDisplay = outcome.price > 0 ? `+${outcome.price}` : outcome.price;
                      const lineDisplay = outcome.line != null ? outcome.line : '—';
                      const content = (
                        <div className="flex flex-col text-sm">
                          <span className="font-semibold">{outcome.ou}</span>
                          <span className="opacity-80">Line: {lineDisplay}</span>
                          <span className="opacity-80">Price: {priceDisplay}</span>
                        </div>
                      );
                      if (outcome.url && outcome.link_available) {
                        return (
                          <a key={idx} href={outcome.url} target="_blank" rel="noreferrer" className="rounded-md border border-white/10 p-2 hover:border-purple-400 transition-colors">
                            {content}
                          </a>
                        );
                      }
                      return (
                        <div key={idx} className="rounded-md border border-white/10 p-2 opacity-70 cursor-not-allowed">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {debugPanel}
      
      {/* Quota Exceeded Modal */}
      <QuotaExceededModal 
        isOpen={quotaExceeded}
        onClose={() => {}} // Don't allow closing - user must upgrade or wait
        quotaError={quotaError}
      />
    </div>
  );
}
