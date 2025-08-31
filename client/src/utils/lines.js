export function formatKickoff(iso) {
  if (!iso) return "TBD";
  try {
    const d = new Date(iso);
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return "TBD"; }
}

export function compactOdds(v) {
  if (v === null || v === undefined || isNaN(Number(v))) return "—";
  const n = Number(v);
  return n > 0 ? `+${n}` : `${n}`;
}
