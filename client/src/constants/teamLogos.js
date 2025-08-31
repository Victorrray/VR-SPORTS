const PLACEHOLDER = "/logos/placeholder.svg";
const NFL = {
  "Philadelphia Eagles": "/logos/nfl/eagles.svg",
  "Dallas Cowboys": "/logos/nfl/cowboys.svg",
  "San Francisco 49ers": "/logos/nfl/49ers.svg",
};
const NCAAF = {
  "Kansas State Wildcats": "/logos/ncaaf/kansas-state.svg",
  "Iowa State Cyclones": "/logos/ncaaf/iowa-state.svg",
};
const DEFAULT_BY_LEAGUE = { nfl: NFL, ncaaf: NCAAF };

export function getTeamLogos(league = "", homeTeam = "", awayTeam = "") {
  const map = DEFAULT_BY_LEAGUE[(league || "").toLowerCase()] || {};
  return { home: map[homeTeam] || PLACEHOLDER, away: map[awayTeam] || PLACEHOLDER };
}
