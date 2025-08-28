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

  // v4 events endpoint
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${API_KEY}`;
  try {
    const r = await axios.get(url);
    // normalize shape (we return array)
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
    const regions = req.query.regions || "us"; // allow override
    const markets = req.query.markets || "h2h,spreads,totals";
    const oddsFormat = req.query.oddsFormat || "american";

    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds` +
      `?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    console.error("odds-data error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});

// ---------- Player props (sportsbooks or DFS via regions) ----------
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

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
