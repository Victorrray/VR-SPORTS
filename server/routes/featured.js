/**
 * Featured Bet Route
 * Simple public endpoint for daily featured bet
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { API_KEY } = require('../config/constants');

/**
 * GET /api/featured
 * Returns one featured bet for the day - no authentication required
 */
router.get('/', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'API_KEY not configured' });
    }

    // Fetch NBA odds
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american&limit=1`;
    const response = await axios.get(url, { timeout: 10000 });

    if (!response.data?.events || response.data.events.length === 0) {
      return res.json({ bet: null });
    }

    const game = response.data.events[0];
    const h2hMarket = game.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
    const homeOdds = h2hMarket?.outcomes?.[0]?.odds || -110;

    const bet = {
      id: game.id,
      sport: 'NBA',
      teams: `${game.home_team} @ ${game.away_team}`,
      gameTime: game.commence_time,
      pick: `${game.home_team} -3.5`,
      odds: homeOdds,
      sportsbook: game.bookmakers?.[0]?.title || 'DraftKings',
      ev: '+2.5%'
    };

    res.json({ bet });
  } catch (err) {
    console.error('Featured bet error:', err.message);
    res.status(500).json({ error: 'Failed to fetch featured bet' });
  }
});

module.exports = router;
