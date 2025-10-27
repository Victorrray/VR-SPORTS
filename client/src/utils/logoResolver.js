// Simple slugger: "Dallas Cowboys" -> "dallas-cowboys"
const toSlug = (str) =>
  str.toLowerCase()
     .replace(/&/g, "and")
     .replace(/[^a-z0-9]+/g, "-")
     .replace(/^-+|-+$/g, "");

// ESPN team ID mappings for CDN logo URLs
const ESPN_TEAM_IDS = {
  // NFL Teams
  "dallas-cowboys": "25",
  "philadelphia-eagles": "25",
  "new-york-giants": "27",
  "washington-commanders": "26",
  "green-bay-packers": "9",
  "chicago-bears": "3",
  "detroit-lions": "8",
  "minnesota-vikings": "16",
  "new-england-patriots": "17",
  "miami-dolphins": "15",
  "buffalo-bills": "2",
  "new-york-jets": "20",
  "pittsburgh-steelers": "23",
  "baltimore-ravens": "33",
  "cincinnati-bengals": "4",
  "cleveland-browns": "5",
  "houston-texans": "34",
  "indianapolis-colts": "11",
  "tennessee-titans": "10",
  "jacksonville-jaguars": "30",
  "kansas-city-chiefs": "12",
  "denver-broncos": "7",
  "los-angeles-chargers": "14",
  "las-vegas-raiders": "13",
  "seattle-seahawks": "25",
  "san-francisco-49ers": "25",
  "los-angeles-rams": "14",
  "arizona-cardinals": "1",
  "carolina-panthers": "33",
  "atlanta-falcons": "1",
  "new-orleans-saints": "18",
  "tampa-bay-buccaneers": "27",
};

export function resolveTeamLogo({ league, teamName, apiLogo }) {
  // 1) If API already gives a usable URL, prefer it
  if (apiLogo && typeof apiLogo === "string") return apiLogo;

  const slug = toSlug(teamName || "");
  
  // 2) For NFL teams, use ESPN CDN
  if (league && league.toLowerCase() === "nfl") {
    // Try to find ESPN team ID
    const espnId = ESPN_TEAM_IDS[slug];
    if (espnId) {
      // ESPN CDN logo URL format
      return `https://a.espncdn.com/media/motion/2022/logos/nfl/teams/500/${espnId}.png`;
    }
  }

  // 3) For other leagues, try generic ESPN format
  if (league) {
    const leagueCode = league.toLowerCase() === "ncaaf" ? "college-football" : league.toLowerCase();
    return `https://a.espncdn.com/media/motion/2022/logos/${leagueCode}/teams/500/${slug}.png`;
  }

  // 4) Fallback to placeholder
  return `https://via.placeholder.com/50x50?text=${encodeURIComponent(teamName || "Team")}`;
}
