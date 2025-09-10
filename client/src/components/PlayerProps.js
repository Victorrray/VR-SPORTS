import React, { useState, useEffect, useMemo } from 'react';
import { withApiBase } from '../config/api';
import { secureFetch } from '../utils/security';
import { useQuotaHandler } from '../hooks/useQuotaHandler';
import QuotaExceededModal from './QuotaExceededModal';

const DEFAULT_MARKETS = [
  "player_points","player_assists","player_rebounds",
  "player_pass_tds","player_pass_yds","player_rush_yds",
  "player_receptions","player_reception_yds",
];

function useDebugFlag() {
  const urlHas = new URLSearchParams(window.location.search).get("debug") === "1";
  const lsHas = typeof localStorage !== "undefined" && localStorage.getItem("propsDebug") === "1";
  return urlHas || lsHas;
}

export default function PlayerProps({
  eventId: rawEventId,
  game_id, // back-compat
  sport = "americanfootball_nfl",
  markets = DEFAULT_MARKETS,
  bookmakers = []
}) {
  const eventId = rawEventId || game_id;
  const debug = useDebugFlag();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUrl, setLastUrl] = useState("");
  const { quotaExceeded, quotaError, handleApiResponse } = useQuotaHandler();

  const qs = useMemo(() => {
    const p = new URLSearchParams({
      sport: sport,
      eventId: eventId ?? "",
      markets: Array.isArray(markets) ? markets.join(",") : String(markets || ""),
    });
    if (bookmakers && bookmakers.length > 0) {
      p.set("bookmakers", Array.isArray(bookmakers) ? bookmakers.join(",") : String(bookmakers));
    }
    return p.toString();
  }, [sport, eventId, markets, bookmakers]);

  useEffect(() => {
    if (!eventId) {
      setPayload(null);
      setError("No eventId provided");
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
        if (j) setPayload(j);
      })
      .catch((e) => setError(e.message || "Failed to load props"))
      .finally(() => setLoading(false));
  }, [qs, eventId]);

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

  if (!eventId) return panel(<div>No event selected (missing eventId).</div>);

  if (loading) return panel(<div>Loading player props…{debugPanel}</div>);

  if (error) return panel(<div className="text-red-400">Props error: {error}{debugPanel}</div>);

  if (!payload) return panel(<div>No payload received.{debugPanel}</div>);

  const { __nonEmpty, data = [], books = [], markets: usedMarkets = [] } = payload;

  // Build rows
  const rows = [];
  for (const book of data || []) {
    const bookName = book?.key || book?.title || "book";
    for (const mkt of book?.markets || []) {
      const mKey = mkt?.key;
      for (const o of mkt?.outcomes || []) {
        rows.push({
          book: bookName,
          market: mKey,
          player: o?.description || o?.name || o?.participant || "—",
          price: o?.price ?? o?.point ?? o?.odds ?? "—",
        });
      }
    }
  }

  if (!__nonEmpty || rows.length === 0) {
    return panel(
      <div>
        <div>No player props available yet for this event.</div>
        <div className="opacity-70 mt-1">
          Markets tried: {usedMarkets?.join(", ") || "default"} • Books: {books?.join(", ") || "server default"}
        </div>
        {debugPanel}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs opacity-70">
        Showing props from: {books.join(", ") || "—"} — Markets: {usedMarkets.join(", ") || "—"}
      </div>
      
      {/* Fallback renderer with payload info */}
      {payload ? (
        <div className="text-xs opacity-70">
          props books: {Array.isArray(payload.data) ? payload.data.length : 0}
          {" • "}nonEmpty: {String(payload.__nonEmpty)}
          {" • "}rows: {rows.length}
        </div>
      ) : (
        <div className="text-xs opacity-70">no payload</div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl border border-white/10 p-3">
            <div className="text-xs opacity-70">{r.book} • {r.market}</div>
            <div className="font-medium">{r.player}</div>
            <div className="text-sm opacity-80">{String(r.price)}</div>
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
