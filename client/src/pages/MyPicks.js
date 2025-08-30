import React, { useEffect, useState } from "react";
import MobileBottomBar from "../components/MobileBottomBar";

const LS_KEY = "oss_my_picks_v1";

export default function MyPicks() {
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPicks(JSON.parse(raw));
    } catch {}
  }, []);

  function save(next) {
    setPicks(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  }

  function removePick(id) {
    save(picks.filter(p => p.id !== id));
  }

  return (
    <main style={{ maxWidth: 860, margin: "1.5rem auto", padding: "0 1rem 120px" }}>
      <h1 style={{ marginBottom: 8, fontSize: "1.8rem", fontWeight: 800 }}>My Picks</h1>
      <p style={{ opacity: 0.85, marginBottom: 16 }}>
        Save selections you want to track. (Local to this device for now.)
      </p>

      {picks.length === 0 && (
        <div style={{ padding: 18, border: "1px solid #2a3255", borderRadius: 14, background: "#121a2b" }}>
          <p style={{ margin: 0, opacity: 0.9 }}>
            You don’t have any picks yet.
            <button
              onClick={() => {
                const demo = {
                  id: String(Date.now()),
                  league: "NFL",
                  game: "DAL @ PHI",
                  market: "Moneyline",
                  selection: "PHI -120",
                  note: "Demo pick",
                };
                save([demo]);
              }}
              style={{ marginLeft: 8, padding: "6px 10px", borderRadius: 10, border: "1px solid #2a3255", background: "#1b2137", color: "#e7e9ee", fontWeight: 700 }}
            >
              add a demo pick
            </button>
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {picks.map(p => (
          <div key={p.id} style={{ padding: 14, border: "1px solid #2a3255", borderRadius: 14, background: "#121a2b" }}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontWeight:800 }}>{p.game}</div>
                <div style={{ opacity: 0.85, fontSize: 13 }}>{p.league} • {p.market}</div>
                <div style={{ marginTop: 6 }}>{p.selection}</div>
                {p.note && <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>{p.note}</div>}
              </div>
              <div>
                <button
                  onClick={() => removePick(p.id)}
                  style={{ padding:"8px 10px", borderRadius:10, border:"1px solid #7f1d1d", background:"#3f1f22", color:"#fecaca", fontWeight:800 }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MobileBottomBar active="picks" showFilter={false} />
    </main>
  );
}
