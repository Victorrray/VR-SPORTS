/**
 * Bet Validation Service
 * Automatically validates bet results using ESPN API data
 * 
 * NOTE: ESPN API service has been removed. This file is kept for reference
 * but the validation functions are disabled until the ESPN API service is restored.
 */

// Import removed - ESPN API service no longer available
// import {
//   fetchESPNScoreboard,
//   findGameByTeams,
//   validateBet,
//   getDateRange,
//   formatESPNDate
// } from './espnApi.js';

const LS_KEY = "oss_my_picks_v1";

/**
 * Parse team names from a game string
 * @param {string} gameString - Game string like "Chiefs vs Bills" or "Lakers @ Warriors"
 * @returns {Object} {homeTeam, awayTeam}
 */
function parseGameTeams(gameString) {
  if (!gameString) return { homeTeam: null, awayTeam: null };

  // Handle different separators
  let separator = ' vs ';
  if (gameString.includes(' @ ')) {
    separator = ' @ ';
  } else if (gameString.includes(' at ')) {
    separator = ' at ';
  } else if (gameString.includes(' v ')) {
    separator = ' v ';
  }

  const teams = gameString.split(separator);
  if (teams.length !== 2) return { homeTeam: null, awayTeam: null };

  return {
    awayTeam: teams[0].trim(),
    homeTeam: teams[1].trim()
  };
}

/**
 * Extract sport from league code
 * @param {string} league - League code (NFL, NBA, etc.)
 * @returns {string} Sport code for ESPN API
 */
function getSportFromLeague(league) {
  const leagueUpper = league?.toUpperCase();
  
  // Direct mappings - ensure we return the correct ESPN API sport codes
  const sportMappings = {
    'NFL': 'NFL',
    'NBA': 'NBA', 
    'MLB': 'MLB',
    'BASEBALL': 'MLB', // Handle case where sport name is stored instead of league
    'NHL': 'NHL',
    'NCAAF': 'NCAAF',
    'NCAAB': 'NCAAB',
    'WNBA': 'WNBA',
    'MLS': 'MLS'
  };

  return sportMappings[leagueUpper] || leagueUpper;
}

/**
 * Validate a single bet against ESPN data
 * @param {Object} bet - Bet object from My Picks
 * @param {Array} espnGames - Array of ESPN game data
 * @returns {Object} {status, actualPayout, confidence}
 */
function validateSingleBet(bet, espnGames) {
  try {
    const { homeTeam, awayTeam } = parseGameTeams(bet.game);
    if (!homeTeam || !awayTeam) {
      console.log(`Could not parse teams from: ${bet.game}`);
      return { status: null, confidence: 0 };
    }

    // Find matching game in ESPN data
    const espnGame = findGameByTeams(espnGames, homeTeam, awayTeam);
    if (!espnGame) {
      console.log(`No ESPN game found for: ${bet.game}`);
      return { status: null, confidence: 0 };
    }

    // Validate the bet
    const result = validateBet(espnGame, bet.market, bet.selection);
    if (!result) {
      console.log(`Could not validate bet: ${bet.market} - ${bet.selection}`);
      return { status: null, confidence: 0 };
    }

    // Calculate actual payout for winning bets
    let actualPayout = null;
    if (result === 'won') {
      actualPayout = bet.potential || bet.stake * 1.91; // Default to -110 odds if no potential
    } else {
      actualPayout = 0;
    }

    console.log(`Bet validation result for ${bet.game}: ${result}`);
    return {
      status: result,
      actualPayout,
      confidence: 95, // High confidence for ESPN data
      espnGameId: espnGame.id
    };

  } catch (error) {
    console.error('Error validating bet:', error);
    return { status: null, confidence: 0 };
  }
}

/**
 * Validate all pending bets
 * @returns {Promise<Object>} Validation results
 * 
 * NOTE: This function is disabled because ESPN API service was removed.
 * The Scores page has been removed from the application.
 */
export async function validateAllBets() {
  console.warn('⚠️ Bet validation is currently disabled - ESPN API service has been removed');
  return {
    validated: 0,
    updated: 0,
    errors: ['ESPN API service has been removed'],
    message: 'Bet validation is currently unavailable'
  };
}

/**
 * Validate bets for a specific date range
 * @param {number} daysBack - Number of days to look back
 * @returns {Promise<Object>} Validation results
 */
export async function validateBetsForDateRange(daysBack = 3) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { validated: 0, updated: 0, errors: [] };

    const picks = JSON.parse(raw);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Filter bets from the specified date range that are still pending
    const recentPendingBets = picks.filter(p => {
      const betDate = new Date(p.dateAdded);
      return betDate >= cutoffDate && (!p.status || p.status === 'pending');
    });

    if (recentPendingBets.length === 0) {
      return { validated: 0, updated: 0, errors: [], message: 'No recent pending bets to validate' };
    }

    console.log(`Validating ${recentPendingBets.length} recent pending bets...`);

    // Use the main validation function but with filtered picks
    const originalPicks = localStorage.getItem(LS_KEY);
    localStorage.setItem(LS_KEY, JSON.stringify(recentPendingBets));
    
    const result = await validateAllBets();
    
    // Restore original picks and merge results
    localStorage.setItem(LS_KEY, originalPicks);
    
    return result;

  } catch (error) {
    console.error('Error in validateBetsForDateRange:', error);
    return {
      validated: 0,
      updated: 0,
      errors: [error.message],
      message: 'Date range validation failed'
    };
  }
}

/**
 * Auto-validate bets on page load/refresh
 * @returns {Promise<Object>} Validation results
 */
export async function autoValidateBets() {
  console.log('Starting automatic bet validation...');
  
  try {
    // Only validate recent bets (last 3 days) for performance
    const result = await validateBetsForDateRange(3);
    
    if (result.updated > 0) {
      console.log(`Auto-validation completed: ${result.updated} bets updated`);
      
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('betsValidated', {
        detail: result
      }));
    }
    
    return result;
  } catch (error) {
    console.error('Auto-validation error:', error);
    return { validated: 0, updated: 0, errors: [error.message] };
  }
}

/**
 * Manual validation trigger with user feedback
 * @returns {Promise<Object>} Validation results with user message
 */
export async function manualValidateAllBets() {
  console.log('Starting manual bet validation...');
  
  try {
    const result = await validateAllBets();
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('betsValidated', {
      detail: result
    }));
    
    return {
      ...result,
      userMessage: result.updated > 0 
        ? `✅ Updated ${result.updated} bet${result.updated === 1 ? '' : 's'} with ESPN results`
        : result.validated > 0 
          ? '📊 All bets checked - no updates needed'
          : '⏳ No completed games found for pending bets'
    };
    
  } catch (error) {
    console.error('Manual validation error:', error);
    return {
      validated: 0,
      updated: 0,
      errors: [error.message],
      userMessage: '❌ Validation failed - please try again'
    };
  }
}
