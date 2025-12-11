// server/routes/grades.js - Bet grading using TheOddsAPI scores
const express = require('express');
const router = express.Router();
const axios = require('axios');

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

/**
 * Grade picks by fetching scores from TheOddsAPI
 * POST /api/grade-picks
 * 
 * Body: { picks: Array<{ eventId, sportKey, pick, line, marketKey, team1, team2 }> }
 * 
 * Returns: { gradedPicks: Array<{ eventId, status: 'won' | 'lost' | 'push' | 'pending', score }> }
 */
router.post('/grade-picks', async (req, res) => {
  try {
    const { picks } = req.body;
    
    if (!picks || !Array.isArray(picks) || picks.length === 0) {
      return res.status(400).json({ error: 'No picks provided' });
    }
    
    if (!ODDS_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Group picks by sport to minimize API calls
    const picksBySport = picks.reduce((acc, pick) => {
      const sport = pick.sportKey;
      if (!sport) return acc;
      if (!acc[sport]) acc[sport] = [];
      acc[sport].push(pick);
      return acc;
    }, {});
    
    const gradedPicks = [];
    
    // Fetch scores for each sport
    for (const [sportKey, sportPicks] of Object.entries(picksBySport)) {
      try {
        // Fetch scores from TheOddsAPI
        const scoresUrl = `${ODDS_API_BASE}/sports/${sportKey}/scores/`;
        const response = await axios.get(scoresUrl, {
          params: {
            apiKey: ODDS_API_KEY,
            daysFrom: 3 // Get scores from last 3 days
          }
        });
        
        const scores = response.data || [];
        
        // Grade each pick for this sport
        for (const pick of sportPicks) {
          const gameScore = scores.find(s => s.id === pick.eventId);
          
          if (!gameScore) {
            // Game not found in scores - might not have started yet
            gradedPicks.push({
              eventId: pick.eventId,
              status: 'pending',
              message: 'Game not found in scores'
            });
            continue;
          }
          
          if (!gameScore.completed) {
            // Game hasn't finished yet
            gradedPicks.push({
              eventId: pick.eventId,
              status: 'pending',
              message: 'Game in progress or not started',
              scores: gameScore.scores
            });
            continue;
          }
          
          // Game is completed - grade the bet
          const gradeResult = gradeBet(pick, gameScore);
          gradedPicks.push({
            eventId: pick.eventId,
            ...gradeResult,
            scores: gameScore.scores,
            homeTeam: gameScore.home_team,
            awayTeam: gameScore.away_team
          });
        }
      } catch (sportError) {
        console.error(`Error fetching scores for ${sportKey}:`, sportError.message);
        // Mark all picks for this sport as error
        for (const pick of sportPicks) {
          gradedPicks.push({
            eventId: pick.eventId,
            status: 'error',
            message: `Failed to fetch scores: ${sportError.message}`
          });
        }
      }
    }
    
    res.json({ gradedPicks });
    
  } catch (error) {
    console.error('Error grading picks:', error);
    res.status(500).json({ error: 'Failed to grade picks', message: error.message });
  }
});

/**
 * Grade a single bet based on game scores
 */
function gradeBet(pick, gameScore) {
  const { marketKey, pick: pickSelection, line, team1, team2 } = pick;
  const scores = gameScore.scores || [];
  
  // Find scores for each team
  const homeScore = scores.find(s => s.name === gameScore.home_team)?.score;
  const awayScore = scores.find(s => s.name === gameScore.away_team)?.score;
  
  if (homeScore === undefined || awayScore === undefined) {
    return { status: 'error', message: 'Could not find scores for teams' };
  }
  
  const homeScoreNum = parseInt(homeScore, 10);
  const awayScoreNum = parseInt(awayScore, 10);
  
  // Determine which team was picked
  const isHomePick = pickSelection.includes(gameScore.home_team);
  const isAwayPick = pickSelection.includes(gameScore.away_team);
  const isOverPick = pickSelection.toLowerCase().includes('over');
  const isUnderPick = pickSelection.toLowerCase().includes('under');
  
  // Grade based on market type
  if (marketKey === 'h2h' || marketKey?.includes('moneyline')) {
    // Moneyline bet - straight up winner
    if (isHomePick) {
      return { status: homeScoreNum > awayScoreNum ? 'won' : 'lost' };
    } else if (isAwayPick) {
      return { status: awayScoreNum > homeScoreNum ? 'won' : 'lost' };
    }
  } else if (marketKey === 'spreads' || marketKey?.includes('spread')) {
    // Spread bet
    const spreadLine = parseFloat(line) || 0;
    
    if (isHomePick) {
      // Home team with spread
      const adjustedScore = homeScoreNum + spreadLine;
      if (adjustedScore > awayScoreNum) return { status: 'won' };
      if (adjustedScore < awayScoreNum) return { status: 'lost' };
      return { status: 'push' };
    } else if (isAwayPick) {
      // Away team with spread
      const adjustedScore = awayScoreNum + spreadLine;
      if (adjustedScore > homeScoreNum) return { status: 'won' };
      if (adjustedScore < homeScoreNum) return { status: 'lost' };
      return { status: 'push' };
    }
  } else if (marketKey === 'totals' || marketKey?.includes('total')) {
    // Over/Under bet
    const totalLine = parseFloat(line) || 0;
    const totalScore = homeScoreNum + awayScoreNum;
    
    if (isOverPick) {
      if (totalScore > totalLine) return { status: 'won' };
      if (totalScore < totalLine) return { status: 'lost' };
      return { status: 'push' };
    } else if (isUnderPick) {
      if (totalScore < totalLine) return { status: 'won' };
      if (totalScore > totalLine) return { status: 'lost' };
      return { status: 'push' };
    }
  }
  
  return { status: 'error', message: 'Could not determine bet result' };
}

/**
 * Get scores for a specific sport
 * GET /api/scores/:sportKey
 */
router.get('/scores/:sportKey', async (req, res) => {
  try {
    const { sportKey } = req.params;
    const { daysFrom = 3 } = req.query;
    
    if (!ODDS_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    const scoresUrl = `${ODDS_API_BASE}/sports/${sportKey}/scores/`;
    const response = await axios.get(scoresUrl, {
      params: {
        apiKey: ODDS_API_KEY,
        daysFrom: parseInt(daysFrom, 10)
      }
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores', message: error.message });
  }
});

module.exports = router;
