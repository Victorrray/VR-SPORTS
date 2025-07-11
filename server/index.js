// index.js (backend)
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5050;
const API_KEY = process.env.ODDS_API_KEY; // Put your Odds API key in .env as ODDS_API_KEY

app.use(cors());

// ✅ 1. Route: List all sports (for dropdowns)
app.get("/api/sports", async (req, res) => {
  try {
    const url = `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`;
    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ✅ 2. Route: Main odds data (for lines/spreads/totals)
app.get("/api/odds-data", async (req, res) => {
  try {
    const sport = req.query.sport || "basketball_nba";
    const regions = "us";
    const markets = req.query.markets || "h2h,spreads,totals"; // Allow markets to be set from the frontend
    const url =
      `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=american`;

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ✅ 3. Route: Player Props
app.get("/api/player-props", async (req, res) => {
  try {
    const sport = req.query.sport;
    const eventId = req.query.eventId;
    if (!sport || !eventId) {
      return res.status(400).json({ error: "Missing sport or eventId" });
    }

    const markets = [
      "player_points",
      "player_assists",
      "player_rebounds",
      "player_threes",
      "player_blocks",
      "player_steals",
      "player_double_double",
      "player_triple_double"
    ].join(",");
    const url =
      `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds?apiKey=${API_KEY}&regions=us&markets=${markets}&oddsFormat=american`;

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      res.status(404).json({ error: "No player props found for this event" });
    } else {
      res.status(500).json({ error: err.toString() });
    }
  }
});

// ✅ Health check route (optional)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
