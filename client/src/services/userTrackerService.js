/**
 * User Tracker Service
 * Automatically updates user performance metrics when bets are validated
 */

import { autoValidateBets } from './betValidationService.js';

const USER_STATS_KEY = "oss_user_stats_v1";
const PICKS_KEY = "oss_my_picks_v1";

/**
 * Get current user statistics
 * @returns {Object} User stats object
 */
export function getUserStats() {
  try {
    const raw = localStorage.getItem(USER_STATS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error loading user stats:', error);
  }

  // Return default stats
  return {
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    pendingBets: 0,
    totalStaked: 0,
    totalReturns: 0,
    netProfit: 0,
    winRate: 0,
    roi: 0,
    avgEdge: 0,
    lastUpdated: new Date().toISOString(),
    bestStreak: 0,
    currentStreak: 0,
    streakType: null, // 'win' or 'loss'
    monthlyStats: {},
    sportStats: {}
  };
}

/**
 * Calculate user statistics from picks data
 * @returns {Object} Calculated stats
 */
export function calculateUserStats() {
  try {
    const raw = localStorage.getItem(PICKS_KEY);
    if (!raw) return getUserStats();

    const picks = JSON.parse(raw);
    
    const totalBets = picks.length;
    const wonBets = picks.filter(p => p.status === 'won').length;
    const lostBets = picks.filter(p => p.status === 'lost').length;
    const pendingBets = picks.filter(p => !p.status || p.status === 'pending').length;
    
    const totalStaked = picks.reduce((sum, p) => sum + (Number(p.stake) || 0), 0);
    const totalReturns = picks
      .filter(p => p.status === 'won')
      .reduce((sum, p) => sum + (Number(p.actualPayout) || Number(p.potential) || 0), 0);
    
    const netProfit = totalReturns - totalStaked;
    const winRate = totalBets > 0 ? (wonBets / (wonBets + lostBets)) * 100 : 0;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    
    // Calculate average edge from picks that have edge data
    const picksWithEdge = picks.filter(p => p.edge && !isNaN(Number(p.edge)));
    const avgEdge = picksWithEdge.length > 0 
      ? picksWithEdge.reduce((sum, p) => sum + Number(p.edge), 0) / picksWithEdge.length 
      : 0;

    // Calculate streaks
    const settledPicks = picks
      .filter(p => p.status === 'won' || p.status === 'lost')
      .sort((a, b) => new Date(a.settledDate || a.dateAdded) - new Date(b.settledDate || b.dateAdded));
    
    let currentStreak = 0;
    let bestStreak = 0;
    let streakType = null;
    let tempStreak = 0;
    let tempType = null;

    for (let i = settledPicks.length - 1; i >= 0; i--) {
      const pick = settledPicks[i];
      const isWin = pick.status === 'won';
      
      if (i === settledPicks.length - 1) {
        // Start with the most recent bet
        currentStreak = 1;
        streakType = isWin ? 'win' : 'loss';
        tempStreak = 1;
        tempType = streakType;
      } else {
        if ((isWin && tempType === 'win') || (!isWin && tempType === 'loss')) {
          tempStreak++;
          if (i === settledPicks.length - currentStreak - 1) {
            currentStreak = tempStreak;
          }
        } else {
          if (i === settledPicks.length - currentStreak - 1) {
            currentStreak = tempStreak;
          }
          tempStreak = 1;
          tempType = isWin ? 'win' : 'loss';
        }
      }
      
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    // Calculate monthly stats
    const monthlyStats = {};
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    picks.forEach(pick => {
      const pickMonth = new Date(pick.dateAdded).toISOString().slice(0, 7);
      if (!monthlyStats[pickMonth]) {
        monthlyStats[pickMonth] = {
          bets: 0,
          won: 0,
          lost: 0,
          staked: 0,
          returns: 0,
          profit: 0
        };
      }
      
      monthlyStats[pickMonth].bets++;
      monthlyStats[pickMonth].staked += Number(pick.stake) || 0;
      
      if (pick.status === 'won') {
        monthlyStats[pickMonth].won++;
        monthlyStats[pickMonth].returns += Number(pick.actualPayout) || Number(pick.potential) || 0;
      } else if (pick.status === 'lost') {
        monthlyStats[pickMonth].lost++;
      }
      
      monthlyStats[pickMonth].profit = monthlyStats[pickMonth].returns - monthlyStats[pickMonth].staked;
    });

    // Calculate sport-specific stats
    const sportStats = {};
    picks.forEach(pick => {
      const sport = pick.league || 'Unknown';
      if (!sportStats[sport]) {
        sportStats[sport] = {
          bets: 0,
          won: 0,
          lost: 0,
          staked: 0,
          returns: 0,
          profit: 0,
          winRate: 0
        };
      }
      
      sportStats[sport].bets++;
      sportStats[sport].staked += Number(pick.stake) || 0;
      
      if (pick.status === 'won') {
        sportStats[sport].won++;
        sportStats[sport].returns += Number(pick.actualPayout) || Number(pick.potential) || 0;
      } else if (pick.status === 'lost') {
        sportStats[sport].lost++;
      }
      
      sportStats[sport].profit = sportStats[sport].returns - sportStats[sport].staked;
      const settledBets = sportStats[sport].won + sportStats[sport].lost;
      sportStats[sport].winRate = settledBets > 0 ? (sportStats[sport].won / settledBets) * 100 : 0;
    });

    return {
      totalBets,
      wonBets,
      lostBets,
      pendingBets,
      totalStaked,
      totalReturns,
      netProfit,
      winRate,
      roi,
      avgEdge,
      lastUpdated: new Date().toISOString(),
      bestStreak,
      currentStreak,
      streakType,
      monthlyStats,
      sportStats
    };

  } catch (error) {
    console.error('Error calculating user stats:', error);
    return getUserStats();
  }
}

/**
 * Update and save user statistics
 * @returns {Object} Updated stats
 */
export function updateUserStats() {
  const stats = calculateUserStats();
  
  try {
    localStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
    console.log('User stats updated:', stats);
    
    // Dispatch event for components to update
    window.dispatchEvent(new CustomEvent('userStatsUpdated', {
      detail: stats
    }));
    
    return stats;
  } catch (error) {
    console.error('Error saving user stats:', error);
    return stats;
  }
}

/**
 * Auto-update user trackers when bets are validated
 * @returns {Promise<Object>} Update results
 */
export async function autoUpdateTrackers() {
  try {
    console.log('Starting auto-update of user trackers...');
    
    // First, validate any pending bets
    const validationResult = await autoValidateBets();
    
    // Then update user statistics
    const updatedStats = updateUserStats();
    
    const result = {
      validationResult,
      updatedStats,
      message: validationResult.updated > 0 
        ? `Updated ${validationResult.updated} bet${validationResult.updated === 1 ? '' : 's'} and refreshed your stats`
        : 'Stats refreshed - no new bet results found'
    };
    
    console.log('Auto-update completed:', result);
    return result;
    
  } catch (error) {
    console.error('Error in auto-update trackers:', error);
    return {
      validationResult: { updated: 0, errors: [error.message] },
      updatedStats: getUserStats(),
      message: 'Auto-update failed'
    };
  }
}

/**
 * Manual refresh of all user data
 * @returns {Promise<Object>} Refresh results
 */
export async function refreshAllUserData() {
  try {
    console.log('Starting manual refresh of all user data...');
    
    // Validate all bets (not just recent ones)
    const { manualValidateAllBets } = await import('./betValidationService.js');
    const validationResult = await manualValidateAllBets();
    
    // Update user statistics
    const updatedStats = updateUserStats();
    
    const result = {
      validationResult,
      updatedStats,
      message: validationResult.updated > 0 
        ? `✅ Validated ${validationResult.updated} bet${validationResult.updated === 1 ? '' : 's'} and updated your performance metrics`
        : '📊 All data refreshed - your stats are up to date'
    };
    
    console.log('Manual refresh completed:', result);
    return result;
    
  } catch (error) {
    console.error('Error in manual refresh:', error);
    return {
      validationResult: { updated: 0, errors: [error.message] },
      updatedStats: getUserStats(),
      message: '❌ Refresh failed - please try again'
    };
  }
}

/**
 * Get performance summary for dashboard
 * @returns {Object} Performance summary
 */
export function getPerformanceSummary() {
  const stats = getUserStats();
  
  return {
    winRate: stats.winRate.toFixed(1),
    avgEdge: stats.avgEdge.toFixed(1),
    roi: stats.roi.toFixed(1),
    totalBets: stats.totalBets,
    netProfit: stats.netProfit,
    currentStreak: stats.currentStreak,
    streakType: stats.streakType,
    bestStreak: stats.bestStreak
  };
}

/**
 * Initialize user tracking system
 */
export function initializeUserTracking() {
  // Update stats on page load
  updateUserStats();
  
  // Listen for bet validation events and update stats
  window.addEventListener('betsValidated', () => {
    setTimeout(() => {
      updateUserStats();
    }, 1000); // Small delay to ensure localStorage is updated
  });
  
  // Auto-update every 5 minutes
  setInterval(() => {
    autoUpdateTrackers();
  }, 5 * 60 * 1000);
  
  console.log('User tracking system initialized');
}
