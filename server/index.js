// server/index.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5050;
const API_KEY = process.env.ODDS_API_KEY;

if (!API_KEY) {
  console.warn("⚠️  Missing ODDS_API_KEY in .env");
}

app.use(cors());

// ---------- Health ----------
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ---------- Sports list ----------
app.get("/api/sports", async (req, res) => {
  try {
    const url = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    console.error("sports error:", err?.response?.status, err?.response?.data || err.message);
    res.status(500).json({ error: String(err) });
  }
});

// ---------- Events (by sport) ----------
app.get("/api/events", async (req, res) => {
  const { sport } = req.query;
  if (!sport) return res.status(400).json({ error: "Missing sport" });

  const url = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${API_KEY}`;
  try {
    const r = await axios.get(url);
    const data = Array.isArray(r.data) ? r.data : (r.data ? Object.values(r.data) : []);
    res.json(data);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("events error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: String(err) });
  }
});

// ---------- Main odds (sportsbooks lines) ----------
app.get("/api/odds-data", async (req, res) => {
  try {
    const sport = req.query.sport || "basketball_nba";
    const regions = req.query.regions || "us";
    const markets = req.query.markets || "h2h,spreads,totals";
    const oddsFormat = req.query.oddsFormat || "american";
    const includeBetLimits = req.query.includeBetLimits;

    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds` +
      `?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}` +
      (includeBetLimits ? `&includeBetLimits=${encodeURIComponent(includeBetLimits)}` : "");

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    console.error("odds-data error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});

// ---------- Player props ----------
app.get("/api/player-props", async (req, res) => {
  try {
    const { sport, eventId, regions = "us", markets = "", oddsFormat = "american" } = req.query;
    if (!sport || !eventId) return res.status(400).json({ error: "Missing sport or eventId" });

    const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds` +
      `?apiKey=${API_KEY}&regions=${regions}&oddsFormat=${oddsFormat}` +
      (markets ? `&markets=${markets}` : "");

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("player-props error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: String(err) });
  }
});

// ---------- Scores (ESPN public JSON; no API key required) ----------
app.get("/api/scores", async (req, res) => {
  try {
    // frontend passes: americanfootball_nfl | americanfootball_ncaaf
    const sport = String(req.query.sport || "americanfootball_nfl").toLowerCase();

    // Optional date filter: YYYY-MM-DD -> ESPN wants YYYYMMDD
    const date = (req.query.date || "").toString().replace(/-/g, ""); // e.g. 2025-09-01 => 20250901

    // Map frontend keys -> ESPN league slugs
    const LEAGUE = {
      americanfootball_nfl: "nfl",
      americanfootball_ncaaf: "college-football",
    };
    const league = LEAGUE[sport] || "nfl";

    const url = `https://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard`;
    const r = await axios.get(url, {
      params: date ? { dates: date } : undefined,
      timeout: 15_000,
    });

    const events = Array.isArray(r.data?.events) ? r.data.events : [];

    const games = events.map((e) => {
      const comp = Array.isArray(e.competitions) ? e.competitions[0] : e.competitions || {};
      const competitors = Array.isArray(comp?.competitors) ? comp.competitors : [];
      const home = competitors.find((c) => c.homeAway === "home") || {};
      const away = competitors.find((c) => c.homeAway === "away") || {};

      const st = e.status || comp.status || {};
      const t = st.type || {};
      const status = t.completed ? "final" : (t.state === "in" ? "in_progress" : "scheduled");
      const clock = (t.state === "in" ? (t.shortDetail || t.detail) : (t.state === "pre" ? "" : t.shortDetail)) || "";

      return {
        id: e.id || comp.id || `${away.team?.displayName || away.team?.name}-${home.team?.displayName || home.team?.name}-${e.date}`,
        home_team: home.team?.displayName || home.team?.name || "Home",
        away_team: away.team?.displayName || away.team?.name || "Away",
        commence_time: e.date, // ISO string
        status,
        scores: {
          home: toNum(home.score),
          away: toNum(away.score),
        },
        clock,
      };
    });

    games.sort((a, b) => (new Date(a.commence_time)) - (new Date(b.commence_time)));

    res.set("Cache-Control", "public, max-age=30");
    res.json(games);
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("scores (espn) error:", status, err?.response?.data || err.message);
    res.status(status).json({ error: "scores_espn_failed", detail: err?.response?.data || err.message });
  }
});

// ---- shared helper (single definition) ----
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
