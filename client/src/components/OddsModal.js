import React from "react";

export default function OddsModal({ open, odds, onClose }) {
  if (!open || !odds) return null;

  return (
    <div className="ev-backdrop" onClick={onClose}>
      <div className="ev-modal" onClick={e => e.stopPropagation()}>
        <h2>{odds.sport_title}</h2>

        {odds.bookmakers.map(bk => (
          <div key={bk.key} style={{ marginBottom: "1rem" }}>
            <h4>{bk.title}</h4>

            {bk.markets.map(m => (
              <details key={m.key} style={{ marginBottom: 6 }}>
                <summary style={{ cursor: "pointer" }}>{m.key}</summary>
                <ul style={{ fontSize: ".85rem", paddingLeft: 18 }}>
                  {m.outcomes.map(o => (
                    <li key={o.name + (o.point ?? "")}>
                      {o.description ? o.description + " – " : ""}
                      {o.name}
                      {o.point != null ? ` ${o.point}` : ""} :{" "}
                      {o.price > 0 ? `+${o.price}` : o.price}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        ))}

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
