// Simple slugger: "Dallas Cowboys" -> "dallas-cowboys"
const toSlug = (str) =>
  str.toLowerCase()
     .replace(/&/g, "and")
     .replace(/[^a-z0-9]+/g, "-")
     .replace(/^-+|-+$/g, "");

// ESPN team ID mappings for CDN logo URLs
const ESPN_TEAM_IDS = {
  // NFL Teams
  "arizona-cardinals": "1",
  "atlanta-falcons": "2",
  "baltimore-ravens": "3",
  "buffalo-bills": "4",
  "carolina-panthers": "5",
  "chicago-bears": "6",
  "cincinnati-bengals": "7",
  "cleveland-browns": "8",
  "dallas-cowboys": "9",
  "denver-broncos": "10",
  "detroit-lions": "11",
  "green-bay-packers": "12",
  "houston-texans": "13",
  "indianapolis-colts": "14",
  "jacksonville-jaguars": "15",
  "kansas-city-chiefs": "16",
  "las-vegas-raiders": "17",
  "los-angeles-chargers": "18",
  "los-angeles-rams": "19",
  "miami-dolphins": "20",
  "minnesota-vikings": "21",
  "new-england-patriots": "22",
  "new-orleans-saints": "23",
  "new-york-giants": "24",
  "new-york-jets": "25",
  "philadelphia-eagles": "26",
  "pittsburgh-steelers": "27",
  "san-francisco-49ers": "28",
  "seattle-seahawks": "29",
  "tampa-bay-buccaneers": "30",
  "tennessee-titans": "31",
  "washington-commanders": "32",
  // NBA Teams
  "atlanta-hawks": "101",
  "boston-celtics": "102",
  "brooklyn-nets": "103",
  "charlotte-hornets": "104",
  "chicago-bulls": "105",
  "cleveland-cavaliers": "106",
  "dallas-mavericks": "107",
  "denver-nuggets": "108",
  "detroit-pistons": "109",
  "golden-state-warriors": "110",
  "houston-rockets": "111",
  "indiana-pacers": "112",
  "los-angeles-clippers": "113",
  "los-angeles-lakers": "114",
  "memphis-grizzlies": "115",
  "miami-heat": "116",
  "milwaukee-bucks": "117",
  "minnesota-timberwolves": "118",
  "new-orleans-pelicans": "119",
  "new-york-knicks": "120",
  "oklahoma-city-thunder": "121",
  "orlando-magic": "122",
  "philadelphia-76ers": "123",
  "phoenix-suns": "124",
  "portland-trail-blazers": "125",
  "sacramento-kings": "126",
  "san-antonio-spurs": "127",
  "toronto-raptors": "128",
  "utah-jazz": "129",
  "washington-wizards": "130",
  // MLB Teams
  "arizona-diamondbacks": "109",
  "atlanta-braves": "110",
  "baltimore-orioles": "111",
  "boston-red-sox": "112",
  "chicago-cubs": "113",
  "chicago-white-sox": "114",
  "cincinnati-reds": "115",
  "cleveland-guardians": "116",
  "colorado-rockies": "117",
  "detroit-tigers": "118",
  "houston-astros": "119",
  "kansas-city-royals": "120",
  "los-angeles-angels": "121",
  "los-angeles-dodgers": "122",
  "miami-marlins": "123",
  "milwaukee-brewers": "124",
  "minnesota-twins": "125",
  "new-york-mets": "126",
  "new-york-yankees": "127",
  "oakland-athletics": "128",
  "philadelphia-phillies": "129",
  "pittsburgh-pirates": "130",
  "san-diego-padres": "131",
  "san-francisco-giants": "132",
  "seattle-mariners": "133",
  "st-louis-cardinals": "134",
  "tampa-bay-rays": "135",
  "texas-rangers": "136",
  "toronto-blue-jays": "137",
  "washington-nationals": "138",
  // NHL Teams
  "anaheim-ducks": "1",
  "arizona-coyotes": "2",
  "boston-bruins": "3",
  "buffalo-sabres": "4",
  "calgary-flames": "5",
  "carolina-hurricanes": "6",
  "chicago-blackhawks": "7",
  "colorado-avalanche": "8",
  "columbus-blue-jackets": "9",
  "dallas-stars": "10",
  "detroit-red-wings": "11",
  "edmonton-oilers": "12",
  "florida-panthers": "13",
  "los-angeles-kings": "14",
  "minnesota-wild": "15",
  "montreal-canadiens": "16",
  "nashville-predators": "17",
  "new-jersey-devils": "18",
  "new-york-islanders": "19",
  "new-york-rangers": "20",
  "ottawa-senators": "21",
  "philadelphia-flyers": "22",
  "pittsburgh-penguins": "23",
  "san-jose-sharks": "24",
  "seattle-kraken": "25",
  "st-louis-blues": "26",
  "tampa-bay-lightning": "27",
  "toronto-maple-leafs": "28",
  "vancouver-canucks": "29",
  "vegas-golden-knights": "30",
  "washington-capitals": "31",
  "winnipeg-jets": "32",
};

export function resolveTeamLogo({ league, teamName, apiLogo }) {
  // 1) If API already gives a usable URL, prefer it
  if (apiLogo && typeof apiLogo === "string") return apiLogo;

  const slug = toSlug(teamName || "");
  
  // 2) For all leagues, use ESPN CDN with correct format
  if (league && slug) {
    // Map league codes to ESPN CDN format
    const leagueMap = {
      'nfl': 'nfl',
      'nba': 'nba',
      'mlb': 'mlb',
      'nhl': 'nhl',
      'ncaaf': 'college-football',
      'ncaab': 'college-basketball',
      'wnba': 'wnba',
      'mls': 'soccer'
    };
    
    const leagueCode = leagueMap[league.toLowerCase()] || league.toLowerCase();
    
    // Map team names to ESPN team codes (used in scoreboard URLs)
    const teamCodeMap = {
      // NFL Teams
      'arizona-cardinals': 'ari',
      'atlanta-falcons': 'atl',
      'baltimore-ravens': 'bal',
      'buffalo-bills': 'buf',
      'carolina-panthers': 'car',
      'chicago-bears': 'chi',
      'cincinnati-bengals': 'cin',
      'cleveland-browns': 'cle',
      'dallas-cowboys': 'dal',
      'denver-broncos': 'den',
      'detroit-lions': 'det',
      'green-bay-packers': 'gb',
      'houston-texans': 'hou',
      'indianapolis-colts': 'ind',
      'jacksonville-jaguars': 'jax',
      'kansas-city-chiefs': 'kc',
      'las-vegas-raiders': 'lv',
      'los-angeles-chargers': 'lac',
      'los-angeles-rams': 'lar',
      'miami-dolphins': 'mia',
      'minnesota-vikings': 'min',
      'new-england-patriots': 'ne',
      'new-orleans-saints': 'no',
      'new-york-giants': 'nyg',
      'new-york-jets': 'nyj',
      'philadelphia-eagles': 'phi',
      'pittsburgh-steelers': 'pit',
      'san-francisco-49ers': 'sf',
      'seattle-seahawks': 'sea',
      'tampa-bay-buccaneers': 'tb',
      'tennessee-titans': 'ten',
      'washington-commanders': 'wsh',
      // NBA Teams
      'atlanta-hawks': 'atl',
      'boston-celtics': 'bos',
      'brooklyn-nets': 'bkn',
      'charlotte-hornets': 'cha',
      'chicago-bulls': 'chi',
      'cleveland-cavaliers': 'cle',
      'dallas-mavericks': 'dal',
      'denver-nuggets': 'den',
      'detroit-pistons': 'det',
      'golden-state-warriors': 'gs',
      'houston-rockets': 'hou',
      'los-angeles-clippers': 'lac',
      'los-angeles-lakers': 'lal',
      'memphis-grizzlies': 'mem',
      'miami-heat': 'mia',
      'milwaukee-bucks': 'mil',
      'minnesota-timberwolves': 'min',
      'new-orleans-pelicans': 'no',
      'new-york-knicks': 'ny',
      'oklahoma-city-thunder': 'okc',
      'orlando-magic': 'orl',
      'philadelphia-76ers': 'phi',
      'phoenix-suns': 'phx',
      'portland-trail-blazers': 'por',
      'sacramento-kings': 'sac',
      'san-antonio-spurs': 'sa',
      'toronto-raptors': 'tor',
      'utah-jazz': 'uta',
      'washington-wizards': 'wsh'
    };
    
    const teamCode = teamCodeMap[slug];
    if (teamCode) {
      // Use the correct ESPN CDN format: /i/teamlogos/{sport}/{size}/scoreboard/{team_code}.png
      const url = `https://a.espncdn.com/i/teamlogos/${leagueCode}/500/scoreboard/${teamCode}.png`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏈 Logo URL for ${teamName} (${slug}):`, url, {
          teamCode,
          leagueCode,
          league
        });
      }
      
      return url;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Team code not found for ${teamName} (${slug}) in league ${league}`);
      }
    }
  }

  // 3) Fallback to placeholder
  return `https://via.placeholder.com/50x50?text=${encodeURIComponent(teamName || "Team")}`;
}
