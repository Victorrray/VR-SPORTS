// src/utils/playerPropUtils.js
/**
 * Utility functions for handling player props
 */

/**
 * Extract player name from outcome description or name for different sports
 * @param {Object} outcome - The outcome object
 * @param {string} marketKey - The market key
 * @param {string} sportKey - The sport key
 * @returns {string} - The extracted player name
 */
export const extractPlayerName = (outcome, marketKey, sportKey) => {
  // If description is available, use it as the primary source
  if (outcome.description && typeof outcome.description === 'string' && outcome.description.trim() !== '') {
    return outcome.description;
  }
  
  // For soccer goal scorers, the player name is often in the outcome name
  if (sportKey?.includes('soccer') && 
      (marketKey?.includes('goal_scorer') || marketKey?.includes('first_goal'))) {
    // For soccer props, the outcome name is often the player name directly
    if (outcome.name !== 'Yes' && outcome.name !== 'No' && 
        outcome.name !== 'Over' && outcome.name !== 'Under') {
      return outcome.name;
    }
  }
  
  // For "Yes" outcomes in goal scorer markets, we need to extract from the market
  if ((outcome.name === 'Yes' || outcome.name === 'No') && 
      (marketKey?.includes('goal_scorer') || marketKey?.includes('first_goal'))) {
    // Try to extract from the market description if available
    return 'Player';
  }
  
  // Default fallback
  return outcome.name;
};

/**
 * Format market name for display
 * @param {string} marketKey - The market key
 * @returns {string} - Formatted market name
 */
export const formatMarketName = (marketKey) => {
  if (!marketKey) return '';
  
  // Special case formatting for common markets
  const specialMarkets = {
    'player_first_goal_scorer': 'FIRST GOAL SCORER',
    'player_goal_scorer_first': 'FIRST GOAL SCORER',
    'player_goal_scorer_anytime': 'ANYTIME GOAL SCORER',
    'player_goal_scorer_last': 'LAST GOAL SCORER',
    'player_last_goal_scorer': 'LAST GOAL SCORER',
    'player_anytime_td': 'ANYTIME TOUCHDOWN',
    'player_anytime_touchdown': 'ANYTIME TOUCHDOWN'
  };
  
  if (specialMarkets[marketKey]) {
    return specialMarkets[marketKey];
  }
  
  // Standard formatting
  return marketKey
    .replace('player_', '')
    .replace('batter_', '')
    .replace('pitcher_', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get explanation for Yes/No props
 * @param {string} marketKey - The market key
 * @param {string} outcomeName - The outcome name
 * @returns {string|null} - Explanation or null if not applicable
 */
export const getYesNoExplanation = (marketKey, outcomeName) => {
  if (outcomeName !== 'Yes') return null;
  
  const explanations = {
    'player_anytime_touchdown': 'Player will score a touchdown at any point during the game',
    'player_anytime_td': 'Player will score a touchdown at any point during the game',
    'anytime_td': 'Player will score a touchdown at any point during the game',
    'player_goal_scorer_anytime': 'Player will score a goal at any point during the match',
    'first_touchdown': 'This player will score the FIRST touchdown of the game',
    'first_td': 'This player will score the FIRST touchdown of the game',
    '1st_td': 'This player will score the FIRST touchdown of the game',
    'player_first_touchdown': 'This player will score the FIRST touchdown of the game',
    'player_first_goal_scorer': 'This player will score the FIRST goal of the match',
    'player_goal_scorer_first': 'This player will score the FIRST goal of the match'
  };
  
  const key = marketKey.toLowerCase();
  for (const [pattern, explanation] of Object.entries(explanations)) {
    if (key.includes(pattern)) {
      return explanation;
    }
  }
  
  return 'Yes - this event will happen';
};
