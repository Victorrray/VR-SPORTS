// src/pages/Scores.jsx
import React, { useEffect, useState } from "react";
import MobileBottomBar from "../components/MobileBottomBar";

export default function Scores() {
  const [sport, setSport] = useState("americanfootball_nfl"); // default NFL
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // ✅ Use relative URL so CRA proxy forwards to http://localhost:5050 in dev
        const r = await fetch(`/api/scores?sport=${encodeURIComponent(sport)}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!cancelled) setGames(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load scores");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sport]);

  return (
    <main style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem 120px" }}>
      <h1 style={{ marginBottom: 16 }}>Live Scores</h1>

      {/* Sport selector */}
      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        <button
          onClick={() => setSport("americanfootball_nfl")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: 0,
            background: sport === "americanfootball_nfl" ? "var(--accent)" : "#2a3046",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          NFL
        </button>
        <button
          onClick={() => setSport("americanfootball_ncaaf")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: 0,
            background: sport === "americanfootball_ncaaf" ? "var(--accent)" : "#2a3046",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          NCAA
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "tomato" }}>{err}</p>}
      {!loading && !err && games.length === 0 && (
        <div
          style={{
            border: "1px solid #2a3255",
            background: "#121a2b",
            color: "#bbcbff",
            borderRadius: 12,
            padding: 16,
          }}
        >
          No games found for this date. Try switching leagues or check back later.
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {games.map((g) => {
          const status = String(g?.status || "").replace("_", " ");
          const away = g?.away_team ?? "Away";
          const home = g?.home_team ?? "Home";
          const awayScore = g?.scores?.away ?? "–";
          const homeScore = g?.scores?.home ?? "–";
          const clock = g?.clock ?? "";

          return (
            <div
              key={g.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #2a3255",
                background: "#121a2b",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {away}
                </div>
                <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {home}
                </div>
              </div>

              <div style={{ textAlign: "right", minWidth: 36 }}>
                <div>{awayScore}</div>
                <div>{homeScore}</div>
              </div>

              <div style={{ marginLeft: 16, textAlign: "right", minWidth: 90 }}>
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                    marginBottom: 4,
                    textTransform: "capitalize",
                  }}
                >
                  {status || "scheduled"}
                </div>
                <div style={{ fontSize: 13, color: "#bbcbff" }}>{clock}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keep mobile nav visible */}
      <MobileBottomBar active="scores" showFilter={false} />
    </main>
  );
}
