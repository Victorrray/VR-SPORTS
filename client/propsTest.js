import fetch from "node-fetch";

const KEY   = process.env.ODDS_KEY;
const sport = process.argv[2] || "basketball_nba";

const listURL = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${KEY}&regions=us`;
const list = await fetch(listURL).then(r=>r.json());

if (!Array.isArray(list) || !list.length) {
  console.log("No upcoming events found");
  process.exit(0);
}

const { id, commence_time, home_team, away_team } = list[0];
console.log(`Testing event ${home_team} vs ${away_team} at ${commence_time}`);

const propURL =
  `https://api.the-odds-api.com/v4/sports/${sport}/events/${id}/odds` +
  `?apiKey=${KEY}&regions=us&markets=player_points,player_rebounds,player_assists`;

const props = await fetch(propURL).then(r=>r.json());
console.dir(props, { depth: 2 });
