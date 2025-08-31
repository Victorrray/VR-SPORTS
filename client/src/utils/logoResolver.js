// Simple slugger: "Dallas Cowboys" -> "dallas-cowboys"
const toSlug = (str) =>
  str.toLowerCase()
     .replace(/&/g, "and")
     .replace(/[^a-z0-9]+/g, "-")
     .replace(/^-+|-+$/g, "");

const TEAM_LOGOS = {
  // NFL
  "nfl:dallas-cowboys": "/logos/nfl/dallas-cowboys.png",
  "nfl:philadelphia-eagles": "/logos/nfl/philadelphia-eagles.png",
  // NCAA example
  "ncaaf:iowa-state-cyclones": "/logos/ncaaf/iowa-state-cyclones.png",
  "ncaaf:kansas-state-wildcats": "/logos/ncaaf/kansas-state-wildcats.png",
  // add more as you go
};

export function resolveTeamLogo({ league, teamName, apiLogo }) {
  // 1) If API already gives a usable URL, prefer it
  if (apiLogo && typeof apiLogo === "string") return apiLogo;

  // 2) Try our local map
  const key = `${(league || "").toLowerCase()}:${toSlug(teamName || "")}`;
  if (TEAM_LOGOS[key]) return TEAM_LOGOS[key];

  // 3) Smart guess based on convention: /logos/<league>/<slug>.png
  const guess = `/logos/${(league || "misc").toLowerCase()}/${toSlug(teamName || "unknown")}.png`;
  return guess; // This will 404 gracefully if missing; we’ll catch it in the <img> onError
}
