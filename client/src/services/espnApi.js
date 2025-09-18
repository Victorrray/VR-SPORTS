/**
 * ESPN API Service for automatic bet result validation
 * Fetches game results and scores from ESPN's public API endpoints
 */

import { secureFetch } from '../utils/security';
import { withApiBase } from '../config/api';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

// Direct ESPN sport mapping (still used for game summaries if needed)
const SPORT_MAPPINGS = {
  'NFL': 'football/nfl',
  'NBA': 'basketball/nba',
  'MLB': 'baseball/mlb',
  'NHL': 'hockey/nhl',
  'NCAAF': 'football/college-football',
  'NCAAB': 'basketball/mens-college-basketball',
  'WNBA': 'basketball/wnba',
  'MLS': 'soccer/usa.1'
};

// Backend sport mapping for our /api/scores endpoint
const BACKEND_SPORT_KEYS = {
  'NFL': 'americanfootball_nfl',
  'NBA': 'basketball_nba',
  'MLB': 'baseball_mlb',
  'NHL': 'icehockey_nhl',
  'NCAAF': 'americanfootball_ncaaf',
  'NCAAB': 'basketball_ncaab',
  'WNBA': 'basketball_wnba',
  'MLS': 'soccer_mls'
};

const normalizeTeamKey = (name = '') => name.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();

function toBackendDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null;
  return `${yyyymmdd.slice(0,4)}-${yyyymmdd.slice(4,6)}-${yyyymmdd.slice(6)}`;
}

function transformBackendScoresToEspnEvents(games = []) {
  return games.map((game) => {
    const homeScore = game?.scores?.home ?? game?.home_score ?? 0;
    const awayScore = game?.scores?.away ?? game?.away_score ?? 0;
    const completed = Boolean(game?.completed || game?.status === 'final');
    const live = Boolean(game?.live || game?.status === 'in_progress');

    const statusName = completed
      ? 'STATUS_FINAL'
      : live
        ? 'STATUS_IN_PROGRESS'
        : 'STATUS_SCHEDULED';
    const statusState = completed
      ? 'post'
      : live
        ? 'in'
        : 'pre';

    return {
      id: game?.id,
      date: game?.commence_time,
      competitions: [
        {
          id: game?.id,
          status: {
            type: {
              name: statusName,
              state: statusState,
              displayClock: game?.clock || '',
              shortDetail: game?.clock || '',
              detail: game?.clock || ''
            }
          },
          competitors: [
            {
              homeAway: 'home',
              score: String(homeScore ?? 0),
              team: {
                displayName: game?.home_team,
                name: game?.home_team,
                id: normalizeTeamKey(game?.home_team),
                logos: game?.home_logo ? [{ href: game.home_logo }] : []
              }
            },
            {
              homeAway: 'away',
              score: String(awayScore ?? 0),
              team: {
                displayName: game?.away_team,
                name: game?.away_team,
                id: normalizeTeamKey(game?.away_team),
                logos: game?.away_logo ? [{ href: game.away_logo }] : []
              }
            }
          ]
        }
      ]
    };
  });
}

/**
 * Fetch scoreboard data for a specific sport and date
 * @param {string} sport - Sport code (NFL, NBA, MLB, etc.)
 * @param {string} date - Date in YYYYMMDD format (optional)
 * @returns {Promise<Object>} ESPN scoreboard data
 */
export async function fetchESPNScoreboard(sport, date = null) {
  try {
    const sportUpper = sport?.toUpperCase();
    const backendKey = BACKEND_SPORT_KEYS[sportUpper];
    if (!backendKey) {
      throw new Error(`Unsupported sport for backend scoreboard: ${sport}`);
    }

    const params = new URLSearchParams();
    params.set('sport', backendKey);
    const backendDate = toBackendDate(date);
    if (backendDate) params.set('date', backendDate);

    const url = withApiBase(`/api/scores?${params.toString()}`);
    console.log(`Fetching scoreboard via backend: ${url}`);

    const response = await secureFetch(url, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Backend scoreboard error: ${response.status}`);
    }

    const data = await response.json();
    const games = Array.isArray(data) ? data : [];

    return {
      events: transformBackendScoresToEspnEvents(games)
    };
  } catch (error) {
    console.error('Error fetching scoreboard via backend:', error);
    throw error;
  }
}

/**
 * Get game details by event ID
 * @param {string} sport - Sport code
 * @param {string} eventId - ESPN event ID
 * @returns {Promise<Object>} Game summary data
 */
export async function fetchESPNGameSummary(sport, eventId) {
  try {
    const sportPath = SPORT_MAPPINGS[sport.toUpperCase()];
    if (!sportPath) {
      throw new Error(`Unsupported sport: ${sport}`);
    }

    const url = `${ESPN_BASE_URL}/${sportPath}/summary?event=${eventId}`;
    console.log(`Fetching ESPN game summary: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ESPN game summary:', error);
    throw error;
  }
}

/**
 * Find a game in ESPN data by team names
 * @param {Array} games - Array of ESPN games
 * @param {string} homeTeam - Home team name
 * @param {string} awayTeam - Away team name
 * @returns {Object|null} Matching game or null
 */
export function findGameByTeams(games, homeTeam, awayTeam) {
  if (!games || !Array.isArray(games)) return null;

  return games.find(game => {
    if (!game.competitions || !game.competitions[0] || !game.competitions[0].competitors) {
      return false;
    }

    const competitors = game.competitions[0].competitors;
    const homeCompetitor = competitors.find(c => c.homeAway === 'home');
    const awayCompetitor = competitors.find(c => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) return false;

    const espnHomeTeam = homeCompetitor.team.displayName || homeCompetitor.team.name;
    const espnAwayTeam = awayCompetitor.team.displayName || awayCompetitor.team.name;

    // Flexible team name matching
    return (
      isTeamNameMatch(espnHomeTeam, homeTeam) && isTeamNameMatch(espnAwayTeam, awayTeam)
    ) || (
      isTeamNameMatch(espnHomeTeam, awayTeam) && isTeamNameMatch(espnAwayTeam, homeTeam)
    );
  });
}

/**
 * Check if two team names match (flexible matching)
 * @param {string} espnName - Team name from ESPN
 * @param {string} betName - Team name from bet
 * @returns {boolean} Whether names match
 */
function isTeamNameMatch(espnName, betName) {
  if (!espnName || !betName) return false;

  const normalize = (name) => name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const espnNorm = normalize(espnName);
  const betNorm = normalize(betName);

  // Direct match
  if (espnNorm === betNorm) return true;

  // Check if one contains the other
  if (espnNorm.includes(betNorm) || betNorm.includes(espnNorm)) return true;

  // Check team abbreviations and common variations
  const espnWords = espnNorm.split(' ');
  const betWords = betNorm.split(' ');

  // If any significant word matches
  for (const espnWord of espnWords) {
    if (espnWord.length > 3) { // Only check meaningful words
      for (const betWord of betWords) {
        if (betWord.length > 3 && espnWord.includes(betWord)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Validate a spread bet result
 * @param {Object} game - ESPN game data
 * @param {string} selection - Bet selection (e.g., "Chiefs -3.5")
 * @returns {string|null} 'won', 'lost', or null if game not finished
 */
export function validateSpreadBet(game, selection) {
  if (!game || !game.competitions || !game.competitions[0]) return null;

  const competition = game.competitions[0];
  const status = competition.status;

  // Only validate completed games
  if (status.type.name !== 'STATUS_FINAL') return null;

  const competitors = competition.competitors;
  const homeCompetitor = competitors.find(c => c.homeAway === 'home');
  const awayCompetitor = competitors.find(c => c.homeAway === 'away');

  if (!homeCompetitor || !awayCompetitor) return null;

  const homeScore = parseInt(homeCompetitor.score) || 0;
  const awayScore = parseInt(awayCompetitor.score) || 0;

  // Parse the selection to extract team and spread
  const spreadMatch = selection.match(/(.+?)\s*([+-]\d+\.?\d*)/);
  if (!spreadMatch) return null;

  const teamName = spreadMatch[1].trim();
  const spread = parseFloat(spreadMatch[2]);

  // Determine which team was bet on
  const homeTeamName = homeCompetitor.team.displayName || homeCompetitor.team.name;
  const awayTeamName = awayCompetitor.team.displayName || awayCompetitor.team.name;

  let betOnHome = isTeamNameMatch(homeTeamName, teamName);
  let betOnAway = isTeamNameMatch(awayTeamName, teamName);

  if (!betOnHome && !betOnAway) return null;

  // Calculate the result
  let actualSpread;
  if (betOnHome) {
    actualSpread = homeScore - awayScore;
  } else {
    actualSpread = awayScore - homeScore;
  }

  // Check if bet won (team covered the spread)
  return actualSpread + spread > 0 ? 'won' : 'lost';
}

/**
 * Validate a moneyline bet result
 * @param {Object} game - ESPN game data
 * @param {string} selection - Bet selection (e.g., "Chiefs -125")
 * @returns {string|null} 'won', 'lost', or null if game not finished
 */
export function validateMoneylineBet(game, selection) {
  if (!game || !game.competitions || !game.competitions[0]) return null;

  const competition = game.competitions[0];
  const status = competition.status;

  // Only validate completed games
  if (status.type.name !== 'STATUS_FINAL') return null;

  const competitors = competition.competitors;
  const homeCompetitor = competitors.find(c => c.homeAway === 'home');
  const awayCompetitor = competitors.find(c => c.homeAway === 'away');

  if (!homeCompetitor || !awayCompetitor) return null;

  const homeScore = parseInt(homeCompetitor.score) || 0;
  const awayScore = parseInt(awayCompetitor.score) || 0;

  // Parse the selection to extract team
  const teamMatch = selection.match(/(.+?)\s*[+-]\d+/);
  if (!teamMatch) return null;

  const teamName = teamMatch[1].trim();

  // Determine which team was bet on
  const homeTeamName = homeCompetitor.team.displayName || homeCompetitor.team.name;
  const awayTeamName = awayCompetitor.team.displayName || awayCompetitor.team.name;

  let betOnHome = isTeamNameMatch(homeTeamName, teamName);
  let betOnAway = isTeamNameMatch(awayTeamName, teamName);

  if (!betOnHome && !betOnAway) return null;

  // Check if bet won
  if (betOnHome) {
    return homeScore > awayScore ? 'won' : 'lost';
  } else {
    return awayScore > homeScore ? 'won' : 'lost';
  }
}

/**
 * Validate a total (over/under) bet result
 * @param {Object} game - ESPN game data
 * @param {string} selection - Bet selection (e.g., "Over 225.5")
 * @returns {string|null} 'won', 'lost', or null if game not finished
 */
export function validateTotalBet(game, selection) {
  if (!game || !game.competitions || !game.competitions[0]) return null;

  const competition = game.competitions[0];
  const status = competition.status;

  // Only validate completed games
  if (status.type.name !== 'STATUS_FINAL') return null;

  const competitors = competition.competitors;
  const homeCompetitor = competitors.find(c => c.homeAway === 'home');
  const awayCompetitor = competitors.find(c => c.homeAway === 'away');

  if (!homeCompetitor || !awayCompetitor) return null;

  const homeScore = parseInt(homeCompetitor.score) || 0;
  const awayScore = parseInt(awayCompetitor.score) || 0;
  const totalScore = homeScore + awayScore;

  // Parse the selection to extract over/under and total
  const totalMatch = selection.match(/(over|under)\s*(\d+\.?\d*)/i);
  if (!totalMatch) return null;

  const overUnder = totalMatch[1].toLowerCase();
  const betTotal = parseFloat(totalMatch[2]);

  // Check if bet won
  if (overUnder === 'over') {
    return totalScore > betTotal ? 'won' : 'lost';
  } else {
    return totalScore < betTotal ? 'won' : 'lost';
  }
}

/**
 * Validate any bet based on market type
 * @param {Object} game - ESPN game data
 * @param {string} market - Market type (Spread, Moneyline, Total)
 * @param {string} selection - Bet selection
 * @returns {string|null} 'won', 'lost', or null if game not finished
 */
export function validateBet(game, market, selection) {
  if (!game || !market || !selection) return null;

  const marketLower = market.toLowerCase();

  if (marketLower.includes('spread') || marketLower.includes('point spread')) {
    return validateSpreadBet(game, selection);
  } else if (marketLower.includes('moneyline') || marketLower.includes('money line')) {
    return validateMoneylineBet(game, selection);
  } else if (marketLower.includes('total') || marketLower.includes('over') || marketLower.includes('under')) {
    return validateTotalBet(game, selection);
  }

  return null;
}

/**
 * Get formatted date for ESPN API (YYYYMMDD)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatESPNDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Get date range for checking recent games
 * @param {number} daysBack - Number of days to look back
 * @returns {Array<string>} Array of date strings in YYYYMMDD format
 */
export function getDateRange(daysBack = 7) {
  const dates = [];
  const today = new Date();

  for (let i = 0; i <= daysBack; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatESPNDate(date));
  }

  return dates;
}
