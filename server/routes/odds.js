/**
 * Odds Routes
 * Main odds endpoint and related functionality
 * This is the most complex route - handles game odds, player props, and caching
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireUser, checkPlanAccess, enforceUsage } = require('../middleware/auth');
const { getCacheKey, getCachedResponse, setCachedResponse } = require('../services/cache');
const {
  getBookmakersForPlan,
  transformCachedOddsToApiFormat,
  saveOddsToSupabase
} = require('../services/helpers');
const {
  API_KEY,
  ALTERNATE_MARKETS,
  ENABLE_PLAYER_PROPS_V2,
  PLAYER_PROPS_CACHE_TTL_MS,
  PLAYER_PROPS_REQUEST_TIMEOUT,
  DEFAULT_BOOK_STATE
} = require('../config/constants');

// All available markets from TheOddsAPI (for reference)
// Featured: h2h, spreads, totals, outrights, h2h_lay, outrights_lay
// Additional: alternate_spreads, alternate_totals, btts, draw_no_bet, h2h_3_way, team_totals, alternate_team_totals
// Game Period: h2h_q1-q4, h2h_h1-h2, h2h_p1-p3, h2h_1st_X_innings, spreads_*, totals_*, alternate_*, team_totals_*
// 3-Way Period: h2h_3_way_q1-q4, h2h_3_way_h1-h2, h2h_3_way_p1-p3, h2h_3_way_1st_X_innings

// Sport-specific market support from TheOddsAPI
const SPORT_MARKET_SUPPORT = {
  'americanfootball_nfl': [
    // Standard markets
    'h2h', 'spreads', 'totals', 
    'alternate_spreads', 'alternate_totals', 
    'team_totals', 'alternate_team_totals',
    // Quarter markets - 2-way
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    // Quarter markets - 3-way
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    // Half markets - 2-way
    'h2h_h1', 'h2h_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2',
    // Half markets - 3-way
    'h2h_3_way_h1', 'h2h_3_way_h2'
  ],
  'americanfootball_ncaaf': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Quarter markets - 2-way
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    // Quarter markets - 3-way
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    // Half markets - 2-way
    'h2h_h1', 'h2h_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2',
    // Half markets - 3-way
    'h2h_3_way_h1', 'h2h_3_way_h2'
  ],
  'basketball_nba': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Quarter markets - 2-way
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    'alternate_spreads_q1', 'alternate_spreads_q2', 'alternate_spreads_q3', 'alternate_spreads_q4',
    'alternate_totals_q1', 'alternate_totals_q2', 'alternate_totals_q3', 'alternate_totals_q4',
    'team_totals_q1', 'team_totals_q2', 'team_totals_q3', 'team_totals_q4',
    'alternate_team_totals_q1', 'alternate_team_totals_q2', 'alternate_team_totals_q3', 'alternate_team_totals_q4',
    // Quarter markets - 3-way
    'h2h_3_way_q1', 'h2h_3_way_q2', 'h2h_3_way_q3', 'h2h_3_way_q4',
    // Half markets - 2-way
    'h2h_h1', 'h2h_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2',
    // Half markets - 3-way
    'h2h_3_way_h1', 'h2h_3_way_h2'
  ],
  'basketball_ncaab': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Quarter markets (if applicable)
    'h2h_h1', 'h2h_h2',
    'spreads_h1', 'spreads_h2',
    'totals_h1', 'totals_h2',
    'alternate_spreads_h1', 'alternate_spreads_h2',
    'alternate_totals_h1', 'alternate_totals_h2',
    'team_totals_h1', 'team_totals_h2',
    'alternate_team_totals_h1', 'alternate_team_totals_h2'
  ],
  'baseball_mlb': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Innings markets
    'h2h_1st_1_innings', 'h2h_1st_3_innings', 'h2h_1st_5_innings', 'h2h_1st_7_innings',
    'h2h_3_way_1st_1_innings', 'h2h_3_way_1st_3_innings', 'h2h_3_way_1st_5_innings', 'h2h_3_way_1st_7_innings',
    'spreads_1st_1_innings', 'spreads_1st_3_innings', 'spreads_1st_5_innings', 'spreads_1st_7_innings',
    'totals_1st_1_innings', 'totals_1st_3_innings', 'totals_1st_5_innings', 'totals_1st_7_innings',
    'alternate_spreads_1st_1_innings', 'alternate_spreads_1st_3_innings', 'alternate_spreads_1st_5_innings', 'alternate_spreads_1st_7_innings',
    'alternate_totals_1st_1_innings', 'alternate_totals_1st_3_innings', 'alternate_totals_1st_5_innings', 'alternate_totals_1st_7_innings'
  ],
  'icehockey_nhl': [
    // Standard markets
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals',
    // Period markets
    'h2h_p1', 'h2h_p2', 'h2h_p3',
    'h2h_3_way_p1', 'h2h_3_way_p2', 'h2h_3_way_p3',
    'spreads_p1', 'spreads_p2', 'spreads_p3',
    'totals_p1', 'totals_p2', 'totals_p3',
    'alternate_spreads_p1', 'alternate_spreads_p2', 'alternate_spreads_p3',
    'alternate_totals_p1', 'alternate_totals_p2', 'alternate_totals_p3',
    'team_totals_p1', 'team_totals_p2', 'team_totals_p3',
    'alternate_team_totals_p1', 'alternate_team_totals_p2', 'alternate_team_totals_p3'
  ],
  // Soccer leagues - only h2h, spreads, totals supported (NO alternate markets)
  // TheOddsAPI returns 422 error if alternate_spreads, alternate_totals, team_totals are requested for soccer
  'soccer_epl': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_uefa_champs_league': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_usa_mls': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_spain_la_liga': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_germany_bundesliga': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_italy_serie_a': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_france_ligue_one': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_fifa_world_cup': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_uefa_europa_league': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_mexico_ligamx': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_netherlands_eredivisie': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_portugal_primeira_liga': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'soccer_spl': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance'],
  'mma_mixed_martial_arts': ['h2h', 'spreads', 'totals', 'h2h_lay'],
  'boxing_boxing': ['h2h', 'spreads', 'totals', 'h2h_lay'],
  'golf_pga': ['outrights', 'outrights_lay'],
  'golf_masters': ['outrights', 'outrights_lay'],
  'golf_us_open': ['outrights', 'outrights_lay'],
  'golf_british_open': ['outrights', 'outrights_lay'],
  // Default for US sports (supports alternate markets)
  'default': [
    'h2h', 'spreads', 'totals',
    'alternate_spreads', 'alternate_totals',
    'team_totals', 'alternate_team_totals'
  ],
  // Default for soccer (NO alternate markets - TheOddsAPI doesn't support them)
  'soccer_default': ['h2h', 'spreads', 'totals', 'h2h_3_way', 'draw_no_bet', 'btts', 'double_chance']
};

/**
 * GET /api/odds
 * Main odds endpoint - returns game odds with optional player props
 */

// Debug: Log all requests to this router
router.use((req, res, next) => {
  console.log('📍 Odds router received request:', { path: req.path, method: req.method, url: req.url });
  next();
});

router.get('/', requireUser, checkPlanAccess, async (req, res) => {
  try {
    const { sports, regions = "us,us2", markets = "h2h,spreads,totals", oddsFormat = "american", date, betType } = req.query;
    console.log('🔍 /api/odds called with:', { sports, regions, markets, date, betType, userId: req.__userId });
    
    if (!sports) return res.status(400).json({ error: "Missing sports parameter" });
    if (!API_KEY) {
      return res.status(500).json({ 
        error: "ODDS_API_KEY not configured", 
        message: "Please configure ODDS_API_KEY environment variable" 
      });
    }
    
    let sportsArray = sports.split(',');
    
    // If 'all' is requested, expand to all available sports
    if (sportsArray.includes('all')) {
      console.log('🎯 EXPANDING "all" to full sports list');
      sportsArray = [
        'americanfootball_nfl',
        'americanfootball_ncaaf',
        'basketball_nba',
        'basketball_ncaab',
        'baseball_mlb',
        'icehockey_nhl',
        'soccer_epl',
        'soccer_spain_la_liga',
        'soccer_germany_bundesliga',
        'soccer_usa_mls',
        'soccer_mexico_ligamx'
      ];
      console.log('🎯 Expanded sportsArray:', sportsArray);
    }
    
    let marketsArray = markets.split(',');
    let allGames = [];
    
    // Define DFS apps list at top level for use throughout the function
    const dfsApps = ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'draftkings_pick6'];
    
    // Map sports to their player props markets (using TheOddsAPI market names)
    // Reference: https://the-odds-api.com/sports-odds-data/betting-markets.html
    // This is defined outside the betType check so we always have access to player props markets
    const playerPropsMarketMap = {
        'americanfootball_nfl': [
          // Standard props
          'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts', 'player_pass_interceptions',
          'player_pass_longest_completion', 'player_pass_rush_yds', 'player_pass_rush_reception_tds', 'player_pass_rush_reception_yds',
          'player_pass_yds_q1',
          'player_rush_yds', 'player_rush_tds', 'player_rush_attempts', 'player_rush_longest',
          'player_rush_reception_tds', 'player_rush_reception_yds',
          'player_receptions', 'player_reception_yds', 'player_reception_tds', 'player_reception_longest',
          'player_anytime_td', 'player_1st_td', 'player_last_td', 'player_tds_over',
          'player_assists', 'player_defensive_interceptions', 'player_field_goals', 'player_kicking_points',
          'player_pats', 'player_sacks', 'player_solo_tackles', 'player_tackles_assists',
          // Alternate props
          'player_assists_alternate', 'player_field_goals_alternate', 'player_kicking_points_alternate',
          'player_pass_attempts_alternate', 'player_pass_completions_alternate', 'player_pass_interceptions_alternate',
          'player_pass_longest_completion_alternate', 'player_pass_rush_yds_alternate',
          'player_pass_rush_reception_tds_alternate', 'player_pass_rush_reception_yds_alternate',
          'player_pass_tds_alternate', 'player_pass_yds_alternate', 'player_pats_alternate',
          'player_receptions_alternate', 'player_reception_longest_alternate', 'player_reception_tds_alternate', 'player_reception_yds_alternate',
          'player_rush_attempts_alternate', 'player_rush_longest_alternate', 'player_rush_reception_tds_alternate', 'player_rush_reception_yds_alternate',
          'player_rush_tds_alternate', 'player_rush_yds_alternate',
          'player_sacks_alternate', 'player_solo_tackles_alternate', 'player_tackles_assists_alternate'
        ],
        'americanfootball_ncaaf': [
          // Standard props
          'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts', 'player_pass_interceptions',
          'player_pass_longest_completion', 'player_pass_rush_yds', 'player_pass_rush_reception_tds', 'player_pass_rush_reception_yds',
          'player_rush_yds', 'player_rush_tds', 'player_rush_attempts', 'player_rush_longest',
          'player_rush_reception_tds', 'player_rush_reception_yds',
          'player_receptions', 'player_reception_yds', 'player_reception_tds', 'player_reception_longest',
          'player_anytime_td', 'player_1st_td', 'player_last_td', 'player_tds_over',
          'player_assists', 'player_defensive_interceptions', 'player_field_goals', 'player_kicking_points',
          'player_pats', 'player_sacks', 'player_solo_tackles', 'player_tackles_assists',
          // Alternate props (same as NFL)
          'player_assists_alternate', 'player_field_goals_alternate', 'player_kicking_points_alternate',
          'player_pass_attempts_alternate', 'player_pass_completions_alternate', 'player_pass_interceptions_alternate',
          'player_pass_longest_completion_alternate', 'player_pass_rush_yds_alternate',
          'player_pass_rush_reception_tds_alternate', 'player_pass_rush_reception_yds_alternate',
          'player_pass_tds_alternate', 'player_pass_yds_alternate', 'player_pats_alternate',
          'player_receptions_alternate', 'player_reception_longest_alternate', 'player_reception_tds_alternate', 'player_reception_yds_alternate',
          'player_rush_attempts_alternate', 'player_rush_longest_alternate', 'player_rush_reception_tds_alternate', 'player_rush_reception_yds_alternate',
          'player_rush_tds_alternate', 'player_rush_yds_alternate',
          'player_sacks_alternate', 'player_solo_tackles_alternate', 'player_tackles_assists_alternate'
        ],
        'americanfootball_cfl': [
          // CFL uses same markets as NFL/NCAAF
          'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts', 'player_pass_interceptions',
          'player_rush_yds', 'player_rush_tds', 'player_rush_attempts',
          'player_receptions', 'player_reception_yds', 'player_reception_tds',
          'player_anytime_td', 'player_1st_td', 'player_last_td'
        ],
        'basketball_nba': [
          // Standard props
          'player_points', 'player_points_q1', 'player_rebounds', 'player_rebounds_q1',
          'player_assists', 'player_assists_q1', 'player_threes',
          'player_steals', 'player_blocks', 'player_blocks_steals', 'player_turnovers',
          'player_points_rebounds_assists', 'player_points_rebounds', 'player_points_assists', 'player_rebounds_assists',
          'player_field_goals', 'player_frees_made', 'player_frees_attempts',
          'player_first_basket', 'player_first_team_basket', 'player_double_double', 'player_triple_double',
          'player_method_of_first_basket',
          // Alternate props
          'player_points_alternate', 'player_rebounds_alternate', 'player_assists_alternate',
          'player_blocks_alternate', 'player_steals_alternate', 'player_turnovers_alternate', 'player_threes_alternate',
          'player_points_assists_alternate', 'player_points_rebounds_alternate', 'player_rebounds_assists_alternate',
          'player_points_rebounds_assists_alternate'
        ],
        'basketball_ncaab': [
          'player_points', 'player_rebounds', 'player_assists', 'player_threes',
          'player_steals', 'player_blocks', 'player_turnovers',
          'player_points_rebounds_assists', 'player_points_rebounds', 'player_points_assists', 'player_rebounds_assists',
          'player_double_double',
          // Alternate props (same as NBA)
          'player_points_alternate', 'player_rebounds_alternate', 'player_assists_alternate',
          'player_blocks_alternate', 'player_steals_alternate', 'player_turnovers_alternate', 'player_threes_alternate',
          'player_points_assists_alternate', 'player_points_rebounds_alternate', 'player_rebounds_assists_alternate',
          'player_points_rebounds_assists_alternate'
        ],
        // WNBA - Offseason (May-October typically)
        // 'basketball_wnba': [
        //   'player_points', 'player_rebounds', 'player_assists', 'player_threes',
        //   'player_steals', 'player_blocks', 'player_turnovers',
        //   'player_points_rebounds_assists', 'player_points_rebounds', 'player_points_assists', 'player_rebounds_assists',
        //   'player_double_double', 'player_triple_double',
        //   'player_points_alternate', 'player_rebounds_alternate', 'player_assists_alternate',
        //   'player_blocks_alternate', 'player_steals_alternate', 'player_turnovers_alternate', 'player_threes_alternate',
        //   'player_points_assists_alternate', 'player_points_rebounds_alternate', 'player_rebounds_assists_alternate',
        //   'player_points_rebounds_assists_alternate'
        // ],
        'baseball_mlb': [
          // Batter props
          'batter_home_runs', 'batter_first_home_run', 'batter_hits', 'batter_total_bases',
          'batter_rbis', 'batter_runs_scored', 'batter_hits_runs_rbis',
          'batter_singles', 'batter_doubles', 'batter_triples',
          'batter_walks', 'batter_strikeouts', 'batter_stolen_bases',
          // Pitcher props
          'pitcher_strikeouts', 'pitcher_record_a_win', 'pitcher_hits_allowed',
          'pitcher_walks', 'pitcher_earned_runs', 'pitcher_outs',
          // Alternate batter props
          'batter_total_bases_alternate', 'batter_home_runs_alternate', 'batter_hits_alternate',
          'batter_rbis_alternate', 'batter_walks_alternate', 'batter_strikeouts_alternate',
          'batter_runs_scored_alternate', 'batter_singles_alternate', 'batter_doubles_alternate', 'batter_triples_alternate',
          // Alternate pitcher props
          'pitcher_hits_allowed_alternate', 'pitcher_walks_alternate', 'pitcher_strikeouts_alternate'
        ],
        'icehockey_nhl': [
          // Standard props
          'player_points', 'player_power_play_points', 'player_assists',
          'player_blocked_shots', 'player_shots_on_goal', 'player_goals', 'player_total_saves',
          'player_goal_scorer_first', 'player_goal_scorer_last', 'player_goal_scorer_anytime',
          // Alternate props
          'player_points_alternate', 'player_assists_alternate', 'player_power_play_points_alternate',
          'player_goals_alternate', 'player_shots_on_goal_alternate', 'player_blocked_shots_alternate',
          'player_total_saves_alternate'
        ],
        // Soccer leagues - Player props only (no game markets)
        'soccer_epl': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_uefa_champs_league': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_usa_mls': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_spain_la_liga': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_germany_bundesliga': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_italy_serie_a': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        'soccer_france_ligue_one': [
          'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
          'player_to_receive_card', 'player_to_receive_red_card',
          'player_shots_on_target', 'player_shots', 'player_assists'
        ],
        // AFL
        'aussierules_afl': [
          'player_disposals', 'player_disposals_over',
          'player_goal_scorer_first', 'player_goal_scorer_last', 'player_goal_scorer_anytime',
          'player_goals_scored_over', 'player_marks_over', 'player_marks_most',
          'player_tackles_over', 'player_tackles_most',
          'player_afl_fantasy_points', 'player_afl_fantasy_points_over', 'player_afl_fantasy_points_most'
        ],
        // Rugby League (NRL)
        'rugbyleague_nrl': [
          'player_try_scorer_first', 'player_try_scorer_last', 'player_try_scorer_anytime', 'player_try_scorer_over'
        ]
      };
    
    // Default soccer player props markets (for any soccer league not explicitly defined)
    const defaultSoccerPlayerProps = [
      'player_goal_scorer_anytime', 'player_first_goal_scorer', 'player_last_goal_scorer',
      'player_to_receive_card', 'player_to_receive_red_card',
      'player_shots_on_target', 'player_shots', 'player_assists'
    ];
    
    // Get player props markets for requested sports (always, not just for betType === 'props')
    const playerPropsMarkets = [];
    sportsArray.forEach(sport => {
      if (playerPropsMarketMap[sport]) {
        console.log(`🏈 Adding markets for ${sport}:`, playerPropsMarketMap[sport]);
        playerPropsMarkets.push(...playerPropsMarketMap[sport]);
      } else if (sport.startsWith('soccer_')) {
        // Use default soccer player props for any soccer league
        console.log(`⚽ Adding default soccer markets for ${sport}:`, defaultSoccerPlayerProps);
        playerPropsMarkets.push(...defaultSoccerPlayerProps);
      } else {
        console.log(`🏈 No player props markets found for ${sport}`);
      }
    });
    
    // Always include player props markets in the fetch (in addition to regular markets)
    const allMarketsToFetch = [...new Set([...marketsArray, ...playerPropsMarkets])];
    
    // Separate player props from regular markets
    const regularMarkets = marketsArray.filter(m => !m.includes('player_') && !m.includes('batter_') && !m.includes('pitcher_'));
    const playerPropMarkets = playerPropsMarkets;
    
    // Helper to get supported markets for a sport (use soccer_default for unlisted soccer leagues)
    const getSupportedMarketsForSport = (sport) => {
      if (SPORT_MARKET_SUPPORT[sport]) {
        return SPORT_MARKET_SUPPORT[sport];
      }
      // Use soccer_default for any soccer league not explicitly listed
      if (sport.startsWith('soccer_')) {
        return SPORT_MARKET_SUPPORT['soccer_default'];
      }
      return SPORT_MARKET_SUPPORT['default'];
    };
    
    // Filter markets based on sport support
    const filteredRegularMarkets = regularMarkets.filter(m => {
      return sportsArray.some(sport => {
        const supportedForSport = getSupportedMarketsForSport(sport);
        return supportedForSport.includes(m);
      });
    });
    
    console.log('🎯 Sport-specific market filtering:');
    sportsArray.forEach(sport => {
      const supportedForSport = getSupportedMarketsForSport(sport);
      console.log(`  ${sport}: ${supportedForSport.join(', ')}`);
    });
    
    // Separate quarter/half/period markets from base markets
    const quarterMarketPatterns = ['_q1', '_q2', '_q3', '_q4', '_h1', '_h2', '_p1', '_p2', '_p3', '_1st_'];
    const baseMarkets = filteredRegularMarkets.filter(m => !quarterMarketPatterns.some(pattern => m.includes(pattern)));
    const quarterMarkets = filteredRegularMarkets.filter(m => quarterMarketPatterns.some(pattern => m.includes(pattern)));
    
    console.log('📊 Market separation:');
    console.log('  Base markets:', baseMarkets);
    console.log('  Quarter/Half/Period markets:', quarterMarkets);
    
    // Step 1: Fetch base odds (and always include player props)
    if (baseMarkets.length > 0 || playerPropMarkets.length > 0) {
      const marketsToFetch = [...new Set([...baseMarkets, ...playerPropMarkets])];
      const supabase = req.app.locals.supabase;
      const oddsCacheService = req.app.locals.oddsCacheService;
      
      for (const sport of sportsArray) {
        try {
          const userProfile = req.__userProfile || { plan: 'free' };
          const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
          
          // For game odds, filter out DFS apps (they only have player props)
          const gameOddsBookmakers = allowedBookmakers.filter(book => !dfsApps.includes(book));
          const bookmakerList = gameOddsBookmakers.join(',');
          
          console.log(`🎯 Game odds bookmakers for ${sport}: ${bookmakerList}`);
          
          // Check Supabase cache first (but skip if player props are requested - they need fresh data)
          let supabaseCachedData = null;
          const hasPlayerProps = playerPropMarkets.length > 0;
          
          if (supabase && oddsCacheService && !hasPlayerProps) {
            try {
              const cachedOdds = await oddsCacheService.getCachedOdds(sport, {
                markets: marketsToFetch
              });
              
              if (cachedOdds && cachedOdds.length > 0) {
                console.log(`📦 Supabase cache HIT for ${sport}: ${cachedOdds.length} cached entries`);
                supabaseCachedData = transformCachedOddsToApiFormat(cachedOdds);
                console.log(`✅ Using ${supabaseCachedData.length} games from Supabase cache`);
              } else {
                console.log(`📦 Supabase cache MISS for ${sport}`);
              }
            } catch (cacheErr) {
              console.warn(`⚠️ Supabase cache error for ${sport}:`, cacheErr.message);
            }
          } else if (hasPlayerProps) {
            console.log(`⏭️ Skipping Supabase cache for ${sport} - player props requested (need fresh data)`);
          }
          
          // Use Supabase cache if available
          if (supabaseCachedData && supabaseCachedData.length > 0) {
            allGames.push(...supabaseCachedData);
            console.log(`💰 Saved API call for ${sport} using Supabase cache`);
            continue;
          }
          
          // Make API call
          const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${marketsToFetch.join(',')}&bookmakers=${bookmakerList}&oddsFormat=${oddsFormat}&includeBetLimits=true&includeLinks=true&includeSids=true`;
          
          // Split markets for optimized caching
          const regularMarketsData = marketsToFetch.filter(market => !ALTERNATE_MARKETS.includes(market));
          const alternateMarketsData = marketsToFetch.filter(market => ALTERNATE_MARKETS.includes(market));
          
          const needsRegularMarkets = regularMarketsData.length > 0;
          const needsAlternateMarkets = alternateMarketsData.length > 0;
          
          const regularCacheKey = needsRegularMarkets ? 
            getCacheKey('odds', { sport, regions, markets: regularMarketsData }) : null;
          const alternateCacheKey = needsAlternateMarkets ? 
            getCacheKey('odds_alternate', { sport, regions, markets: alternateMarketsData }) : null;
          
          const cachedRegularData = needsRegularMarkets ? getCachedResponse(regularCacheKey) : null;
          const cachedAlternateData = needsAlternateMarkets ? getCachedResponse(alternateCacheKey) : null;
          
          const canUseAllCached = 
            (!needsRegularMarkets || cachedRegularData) && 
            (!needsAlternateMarkets || cachedAlternateData);
          
          const cacheKey = getCacheKey('odds', { sport, regions, markets: marketsToFetch });
          const cachedData = getCachedResponse(cacheKey);
          
          let responseData;
          
          if (canUseAllCached) {
            responseData = [];
            if (cachedRegularData) {
              console.log(`📦 Using cached regular markets data for ${sport}`);
              responseData = [...responseData, ...cachedRegularData];
            }
            if (cachedAlternateData) {
              console.log(`📦 Using cached alternate markets data for ${sport}`);
              responseData = [...responseData, ...cachedAlternateData];
            }
            if (cachedData) {
              console.log(`📦 Using combined cached data for ${sport}`);
              responseData = cachedData;
            }
          } else {
            console.log(`🌐 API call for ${sport}`);
            console.log(`🔗 Full URL: ${url}`);
            const response = await axios.get(url);
            responseData = response.data;
            console.log(`📦 ${sport} returned ${responseData?.length || 0} games`);
            
            // Debug: Log comprehensive market summary
            if (responseData && responseData.length > 0) {
              console.log(`\n${'='.repeat(60)}`);
              console.log(`📊 MARKET SUMMARY FOR ${sport.toUpperCase()}`);
              console.log(`${'='.repeat(60)}`);
              console.log(`📦 Games returned: ${responseData.length}`);
              
              // Collect all unique markets across all games and bookmakers
              const allMarketsFound = new Set();
              const marketsByBook = new Map();
              let totalBookmakers = 0;
              
              responseData.forEach(game => {
                if (game.bookmakers) {
                  game.bookmakers.forEach(book => {
                    totalBookmakers++;
                    if (!marketsByBook.has(book.key)) {
                      marketsByBook.set(book.key, new Set());
                    }
                    if (book.markets) {
                      book.markets.forEach(market => {
                        allMarketsFound.add(market.key);
                        marketsByBook.get(book.key).add(market.key);
                      });
                    }
                  });
                }
              });
              
              console.log(`📚 Total bookmaker entries: ${totalBookmakers}`);
              console.log(`📊 Unique markets found: ${allMarketsFound.size}`);
              console.log(`📊 Markets requested: ${marketsToFetch.join(', ')}`);
              console.log(`📊 Markets returned: ${Array.from(allMarketsFound).sort().join(', ')}`);
              
              // Check which requested markets were NOT returned
              const missingMarkets = marketsToFetch.filter(m => !allMarketsFound.has(m));
              if (missingMarkets.length > 0) {
                console.log(`⚠️ MISSING MARKETS (requested but not returned): ${missingMarkets.join(', ')}`);
              }
              
              // Log markets by bookmaker (first 5 bookmakers)
              console.log(`\n📚 Markets by Bookmaker (sample):`);
              let bookCount = 0;
              for (const [bookKey, markets] of marketsByBook) {
                if (bookCount >= 5) break;
                console.log(`   ${bookKey}: ${Array.from(markets).join(', ')}`);
                bookCount++;
              }
              
              // CRITICAL: Check if Fliff is in the response
              const fliffData = marketsByBook.get('fliff');
              if (fliffData) {
                console.log(`✅ FLIFF FOUND in ${sport}: ${Array.from(fliffData).join(', ')}`);
              } else {
                console.log(`❌ FLIFF NOT FOUND in ${sport} response`);
                console.log(`📋 ALL BOOKMAKERS IN RESPONSE (${marketsByBook.size} total):`);
                Array.from(marketsByBook.keys()).forEach((book, idx) => {
                  console.log(`   ${idx + 1}. ${book}`);
                });
              }
              
              // Log first game details
              const firstGame = responseData[0];
              console.log(`\n🎮 First game: ${firstGame.away_team} @ ${firstGame.home_team}`);
              console.log(`📚 Bookmakers for this game: ${firstGame.bookmakers ? firstGame.bookmakers.length : 0}`);
              console.log(`${'='.repeat(60)}\n`);
            }
            
            // Log quota information from response headers
            const quotaRemaining = response.headers['x-requests-remaining'];
            const quotaUsed = response.headers['x-requests-used'];
            const quotaLast = response.headers['x-requests-last'];
            console.log(`📊 Quota - Remaining: ${quotaRemaining}, Used: ${quotaUsed}, Last Call Cost: ${quotaLast}`);
            
            // Cache the data
            if (needsRegularMarkets && needsAlternateMarkets) {
              const regularData = responseData.map(game => ({
                ...game,
                bookmakers: game.bookmakers.map(bookmaker => ({
                  ...bookmaker,
                  markets: bookmaker.markets.filter(market => !ALTERNATE_MARKETS.includes(market.key))
                })).filter(bookmaker => bookmaker.markets.length > 0)
              })).filter(game => game.bookmakers.length > 0);
              
              const alternateData = responseData.map(game => ({
                ...game,
                bookmakers: game.bookmakers.map(bookmaker => ({
                  ...bookmaker,
                  markets: bookmaker.markets.filter(market => ALTERNATE_MARKETS.includes(market.key))
                })).filter(bookmaker => bookmaker.markets.length > 0)
              })).filter(game => game.bookmakers.length > 0);
              
              if (regularData.length > 0) {
                setCachedResponse(regularCacheKey, regularData);
              }
              if (alternateData.length > 0) {
                setCachedResponse(alternateCacheKey, alternateData);
              }
              setCachedResponse(cacheKey, responseData);
            } else {
              setCachedResponse(cacheKey, responseData);
            }
            
            // Save to Supabase
            if (supabase && oddsCacheService && responseData && responseData.length > 0) {
              try {
                console.log(`💾 Saving ${responseData.length} games to Supabase cache for ${sport}`);
                await saveOddsToSupabase(responseData, sport, supabase);
                console.log(`✅ Successfully cached ${responseData.length} games in Supabase`);
              } catch (supabaseSaveErr) {
                console.warn(`⚠️ Failed to save to Supabase cache:`, supabaseSaveErr.message);
              }
            }
          }
          
          const sportGames = responseData || [];
          console.log(`Got ${sportGames.length} games for ${sport}`);
          allGames.push(...sportGames);
        } catch (sportErr) {
          console.warn(`Failed to fetch games for sport ${sport}:`, sportErr.response?.status, sportErr.response?.data || sportErr.message);
        }
      }
      
      // Filter bookmakers based on user plan
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      console.log(`\n🔍 BOOKMAKER FILTERING DEBUG:`);
      console.log(`👤 User plan: ${userProfile.plan}`);
      console.log(`✅ Allowed bookmakers: ${allowedBookmakers.join(', ')}`);
      console.log(`🔎 Is 'fliff' in allowed list? ${allowedBookmakers.includes('fliff')}`);
      
      // Count Fliff before filtering
      let fliffCountBefore = 0;
      allGames.forEach(game => {
        if (game.bookmakers) {
          fliffCountBefore += game.bookmakers.filter(b => b.key === 'fliff').length;
        }
      });
      console.log(`📊 Fliff bookmakers BEFORE filtering: ${fliffCountBefore}`);
      
      // Only filter game odds bookmakers, not player props
      allGames.forEach(game => {
        if (game.bookmakers) {
          game.bookmakers = game.bookmakers.filter(bookmaker => {
            // Always include DFS apps (they have player props)
            if (dfsApps.includes(bookmaker.key)) {
              return true;
            }
            // For traditional bookmakers, check if they're in the allowed list
            return allowedBookmakers.includes(bookmaker.key);
          });
        }
      });
      
      // Count Fliff after filtering
      let fliffCountAfter = 0;
      allGames.forEach(game => {
        if (game.bookmakers) {
          fliffCountAfter += game.bookmakers.filter(b => b.key === 'fliff').length;
        }
      });
      console.log(`📊 Fliff bookmakers AFTER filtering: ${fliffCountAfter}`);
      console.log(`Filtered to ${allowedBookmakers.length} allowed bookmakers for user plan: ${userProfile.plan}`);
    }
    
    // Filter out games that have already started (past games)
    const now = new Date();
    const beforeFilter = allGames.length;
    allGames = allGames.filter((game) => {
      if (!game.commence_time) return false;
      const gameTime = new Date(game.commence_time);
      return gameTime > now; // Only include future games
    });
    console.log(`🗑️ Filtered out ${beforeFilter - allGames.length} past games. Remaining: ${allGames.length} upcoming games`);
    
    // If a specific date is requested, filter to only games on that date
    if (date && date !== 'all_upcoming' && date !== 'all') {
      const beforeDateFilter = allGames.length;
      // Parse the date string (YYYY-MM-DD format)
      const [year, month, day] = date.split('-').map(Number);
      const filterDate = new Date(year, month - 1, day);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      allGames = allGames.filter((game) => {
        if (!game.commence_time) return false;
        const gameTime = new Date(game.commence_time);
        // Check if game is on the specified date (between start of day and start of next day)
        return gameTime >= filterDate && gameTime < nextDay;
      });
      console.log(`📅 Filtered by date ${date}: ${beforeDateFilter} games -> ${allGames.length} games on that date`);
    }
    
    // Step 2: Fetch quarter/half/period markets if requested
    // NOTE: Period markets require /events/{eventId}/odds endpoint (one call per game)
    // This is much more expensive, so we're strategic:
    // - Only fetch for top 5 games per sport
    // - Only fetch selected period markets (not all variants)
    // - Cache for 24 hours
    console.log('🔍 STEP 2 CHECK: quarterMarkets.length =', quarterMarkets.length, 'quarterMarkets =', quarterMarkets);
    if (quarterMarkets.length > 0) {
      console.log('🎯 Step 2: Fetching quarter/half/period markets:', quarterMarkets);
      
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      // For game odds, filter out DFS apps (they only have player props)
      const gameOddsBookmakers = allowedBookmakers.filter(book => !dfsApps.includes(book));
      const bookmakerList = gameOddsBookmakers.join(',');
      
      console.log(`🎯 Quarter/Period markets bookmakers: ${bookmakerList}`);
      
      // Strategic approach: Only fetch for top 5 games per sport using /events/{eventId}/odds
      const MAX_GAMES_FOR_PERIOD_MARKETS = 5;
      const PERIOD_MARKET_CACHE_HOURS = 24;
      
      for (const sport of sportsArray) {
        try {
          // Get top games for this sport (first 5)
          const sportGames = allGames.filter(g => g.sport_key === sport).slice(0, MAX_GAMES_FOR_PERIOD_MARKETS);
          
          if (sportGames.length === 0) {
            console.log(`⏭️ No games found for ${sport}`);
            continue;
          }
          
          console.log(`🎯 Fetching period markets for top ${sportGames.length} ${sport} games using /events/{eventId}/odds`);
          
          // Fetch period markets for each game individually
          for (const game of sportGames) {
            try {
              const eventId = game.id;
              const cacheKey = `period_markets_${sport}_${eventId}`;
              
              // Check cache first
              const cached = await getCachedResponse(cacheKey, PERIOD_MARKET_CACHE_HOURS * 60 * 60 * 1000);
              if (cached) {
                console.log(`📦 Period markets cache HIT for ${eventId}`);
                // Merge cached data
                if (cached.bookmakers) {
                  cached.bookmakers.forEach(cBookmaker => {
                    const existingBookmaker = game.bookmakers.find(b => b.key === cBookmaker.key);
                    if (existingBookmaker && cBookmaker.markets) {
                      const existingMarketKeys = existingBookmaker.markets.map(m => m.key);
                      cBookmaker.markets.forEach(cMarket => {
                        if (!existingMarketKeys.includes(cMarket.key)) {
                          existingBookmaker.markets.push(cMarket);
                        }
                      });
                    }
                  });
                }
                continue;
              }
              
              // Fetch from API
              const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events/${eventId}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${quarterMarkets.join(',')}&bookmakers=${bookmakerList}&oddsFormat=${oddsFormat}`;
              
              console.log(`🌐 Fetching period markets for event ${eventId}`);
              const response = await axios.get(url);
              const eventData = response.data || {};
              
              console.log(`📊 Period Markets Quota - Remaining: ${response.headers['x-requests-remaining']}, Used: ${response.headers['x-requests-used']}`);
              
              // Cache the result
              if (eventData.bookmakers) {
                await setCachedResponse(cacheKey, eventData, PERIOD_MARKET_CACHE_HOURS * 60 * 60 * 1000);
              }
              
              // Merge period market data with existing game
              if (eventData.bookmakers) {
                eventData.bookmakers.forEach(pBookmaker => {
                  const existingBookmaker = game.bookmakers.find(b => b.key === pBookmaker.key);
                  if (existingBookmaker && pBookmaker.markets) {
                    const existingMarketKeys = existingBookmaker.markets.map(m => m.key);
                    pBookmaker.markets.forEach(pMarket => {
                      if (!existingMarketKeys.includes(pMarket.key)) {
                        existingBookmaker.markets.push(pMarket);
                      }
                    });
                    console.log(`✅ Merged ${pBookmaker.markets.length} period markets for ${pBookmaker.key}`);
                  }
                });
              }
            } catch (gameErr) {
              console.warn(`⚠️ Failed to fetch period markets for event ${game.id}:`, gameErr.response?.status, gameErr.response?.data?.message || gameErr.message);
            }
          }
        } catch (sportErr) {
          console.warn(`⚠️ Failed to process period markets for ${sport}:`, sportErr.message);
        }
      }
      
      console.log(`✅ Period markets fetch complete`);
    }
    
    // Step 3: Fetch player props if requested
    // NOTE: Player props must be fetched using /events/{eventId}/odds endpoint, one event at a time
    console.log('🏈 PLAYER PROPS CHECK:');
    console.log('🏈   playerPropMarkets.length:', playerPropMarkets.length);
    console.log('🏈   playerPropMarkets:', playerPropMarkets);
    console.log('🏈   ENABLE_PLAYER_PROPS_V2:', ENABLE_PLAYER_PROPS_V2);
    console.log('🏈   Will fetch player props?', playerPropMarkets.length > 0 && ENABLE_PLAYER_PROPS_V2);
    
    if (playerPropMarkets.length > 0 && ENABLE_PLAYER_PROPS_V2) {
      console.log('🎯 STARTING PLAYER PROPS FETCH for markets:', playerPropMarkets);
      
      const userProfile = req.__userProfile || { plan: 'free' };
      const allowedBookmakers = getBookmakersForPlan(userProfile.plan);
      
      // Use ALL allowed bookmakers for player props (both traditional sportsbooks and DFS apps)
      // TheOddsAPI will return player props data for whichever bookmakers have it available
      const playerPropsBookmakers = allowedBookmakers;
      const bookmakerList = playerPropsBookmakers.join(',');
      
      console.log(`🎯 Player props bookmakers for ${sportsArray.join(', ')}: ${bookmakerList}`);
      console.log(`🔍 Player props bookmakers details: ${JSON.stringify(playerPropsBookmakers)}`);
      console.log(`🔍 Total bookmakers requested: ${playerPropsBookmakers.length}`);
      
      let playerPropsCount = 0;
      
      // OPTIMIZATION: Fetch all sports' events in parallel first
      console.log(`🚀 Fetching events for all ${sportsArray.length} sports in parallel...`);
      const eventsPromises = sportsArray.map(async (sport) => {
        try {
          const eventsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/events?apiKey=${API_KEY}`;
          const eventsResponse = await axios.get(eventsUrl, { timeout: 30000 });
          let events = eventsResponse.data || [];
          
          // Filter events by date if requested
          if (date && date !== 'all_upcoming') {
            const targetDate = new Date(date);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            events = events.filter(event => {
              const eventDate = new Date(event.commence_time);
              return eventDate >= targetDate && eventDate < nextDay;
            });
          }
          
          console.log(`📅 Got ${events.length} events for ${sport}${date && date !== 'all_upcoming' ? ` on ${date}` : ''}`);
          return events.map(e => ({ ...e, sport_key: sport }));
        } catch (err) {
          console.warn(`⚠️ Failed to fetch events for ${sport}:`, err.message);
          return [];
        }
      });
      
      const allEventsArrays = await Promise.all(eventsPromises);
      const allEvents = allEventsArrays.flat();
      console.log(`📅 Total events across all sports: ${allEvents.length}`);
      
      // OPTIMIZATION: Fetch player props for all events in larger parallel batches
      const MAX_CONCURRENT = 15; // Increased from 10 to 15
      const playerPropsRegions = 'us,us2,us_dfs,us_ex,au';
      
      // Explicitly include DFS apps for player props (including soccer)
      const dfsBookmakersForProps = ['prizepicks', 'underdog', 'draftkings_pick6', 'dabble_au', 'sleeper', 'fliff', 'chalkboard', 'betr'];
      const allPlayerPropsBookmakers = [...new Set([...bookmakerList.split(','), ...dfsBookmakersForProps])].join(',');
      console.log(`🎯 Player props bookmakers (including DFS for soccer): ${allPlayerPropsBookmakers}`);
      
      for (let i = 0; i < allEvents.length; i += MAX_CONCURRENT) {
        const batch = allEvents.slice(i, i + MAX_CONCURRENT);
        const batchPromises = batch.map(event => 
          (async () => {
            try {
              // Include bookmakers parameter to explicitly request DFS apps for all sports including soccer
              const playerPropsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(event.sport_key)}/events/${event.id}/odds?apiKey=${API_KEY}&regions=${playerPropsRegions}&markets=${playerPropMarkets.join(',')}&oddsFormat=${oddsFormat}&bookmakers=${allPlayerPropsBookmakers}&includeBetLimits=true`;
              
              const playerPropsResponse = await axios.get(playerPropsUrl, { timeout: 15000 }); // Reduced timeout
              
              if (playerPropsResponse.data && playerPropsResponse.data.bookmakers && playerPropsResponse.data.bookmakers.length > 0) {
                // Log DFS apps found for soccer events
                if (event.sport_key?.startsWith('soccer_')) {
                  const dfsFound = playerPropsResponse.data.bookmakers.filter(bk => 
                    dfsBookmakersForProps.some(dfs => bk.key?.toLowerCase().includes(dfs))
                  );
                  if (dfsFound.length > 0) {
                    console.log(`⚽🎯 DFS APPS FOUND FOR SOCCER: ${event.home_team} vs ${event.away_team} - ${dfsFound.map(b => b.key).join(', ')}`);
                  }
                }
                
                const eventWithProps = {
                  ...playerPropsResponse.data,
                  bookmakers: playerPropsResponse.data.bookmakers
                    .filter(bk => bk.markets && bk.markets.some(m => playerPropMarkets.includes(m.key)))
                    .map(bk => ({
                      ...bk,
                      title: bk.title || bk.key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
                    }))
                };
                
                if (eventWithProps.bookmakers.length > 0) {
                  console.log(`✅ Props: ${event.home_team} vs ${event.away_team} (${eventWithProps.bookmakers.length} books)`);
                  allGames.push(eventWithProps);
                  playerPropsCount++;
                }
              }
            } catch (eventErr) {
              // Silently skip failed events to reduce log noise
              if (eventErr.response?.status !== 422 && eventErr.code !== 'ECONNABORTED') {
                console.warn(`⚠️ Props error for ${event.id}:`, eventErr.message);
              }
            }
          })()
        );
        
        await Promise.all(batchPromises);
        
        // Log progress every batch
        const progress = Math.min(i + MAX_CONCURRENT, allEvents.length);
        console.log(`⏳ Progress: ${progress}/${allEvents.length} events processed`);
      }
      
      console.log(`✅ Total player props events fetched: ${playerPropsCount}`);
      console.log(`🏈 Player props fetch complete - returning ${playerPropsCount} events`);
    } else if (betType === 'props') {
      console.log('🏈 WARNING: betType is props but ENABLE_PLAYER_PROPS_V2 is disabled or playerPropMarkets is empty');
      console.log('🏈 ENABLE_PLAYER_PROPS_V2:', ENABLE_PLAYER_PROPS_V2);
      console.log('🏈 playerPropMarkets:', playerPropMarkets);
    }
    
    console.log(`📊 Final response: ${allGames.length} total games/events (including ${allGames.filter(g => g.bookmakers?.some(b => dfsApps.includes(b.key))).length} with player props)`);
    if (betType === 'props') {
      console.log(`🏈 Player props response: ${allGames.length} events with player props`);
    }
    
    // Filter bookmakers' markets to only include requested markets (if not fetching all)
    const allRequestedMarkets = [...regularMarkets, ...playerPropMarkets];
    console.log('🎯 All requested markets:', allRequestedMarkets);
    console.log('🎯 betType:', betType);
    console.log('🎯 regularMarkets:', regularMarkets);
    console.log('🎯 playerPropMarkets:', playerPropMarkets);
    
    if (allRequestedMarkets.length > 0 && betType !== 'props') {
      // For regular game odds, filter to only requested markets
      console.log('🔍 Filtering bookmakers to only include markets:', allRequestedMarkets);
      allGames.forEach(game => {
        if (game.bookmakers) {
          game.bookmakers = game.bookmakers.map(bookmaker => ({
            ...bookmaker,
            markets: bookmaker.markets?.filter(market => allRequestedMarkets.includes(market.key)) || []
          })).filter(bookmaker => bookmaker.markets && bookmaker.markets.length > 0);
        }
      });
      console.log('✅ Filtered bookmakers to only requested markets');
    } else {
      console.log('⏭️ Skipping market filtering - allRequestedMarkets.length:', allRequestedMarkets.length, 'betType:', betType);
    }
    
    // Debug: Count markets in response
    const marketCounts = {};
    allGames.forEach(game => {
      game.bookmakers?.forEach(book => {
        book.markets?.forEach(market => {
          marketCounts[market.key] = (marketCounts[market.key] || 0) + 1;
        });
      });
    });
    console.log('📊 FINAL MARKETS IN RESPONSE:', Object.keys(marketCounts).sort().join(', '));
    console.log('📊 MARKET COUNTS:', marketCounts);
    
    // Log the games being returned
    console.log(`\n✅ RETURNING ${allGames.length} GAMES TO FRONTEND:`);
    allGames.slice(0, 3).forEach((game, idx) => {
      console.log(`  Game ${idx + 1}: ${game.away_team} @ ${game.home_team}`);
      console.log(`    Commence: ${game.commence_time}`);
      console.log(`    Bookmakers: ${game.bookmakers?.length || 0}`);
      if (game.bookmakers?.length > 0) {
        console.log(`    First bookmaker: ${game.bookmakers[0].key} with ${game.bookmakers[0].markets?.length || 0} markets`);
      }
    });
    console.log('');
    
    res.json(allGames);
  } catch (err) {
    console.error('Odds error:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /api/odds-data
 * Legacy endpoint for odds snapshots
 */
router.get('/odds-data', enforceUsage, async (req, res) => {
  try {
    if (!API_KEY) return res.status(400).json({ error: "Missing ODDS_API_KEY" });
    const sport = req.query.sport || "basketball_nba";
    const regions = req.query.regions || "us";
    const markets = req.query.markets || "h2h,spreads,totals";
    const oddsFormat = req.query.oddsFormat || "american";
    const includeBetLimits = req.query.includeBetLimits;

    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(
      sport
    )}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}${
      includeBetLimits ? `&includeBetLimits=${encodeURIComponent(includeBetLimits)}` : ""
    }`;

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    console.error("odds-data error:", err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: String(err) });
  }
});

/**
 * GET /api/cached-odds/:sport
 * Get cached odds from Supabase for any sport
 */
router.get('/cached-odds/:sport', enforceUsage, async (req, res) => {
  try {
    const { sport } = req.params;
    const { markets, bookmakers, eventId } = req.query;
    const oddsCacheService = req.app.locals.oddsCacheService;
    
    // Map short sport names to full keys
    const sportKeyMap = {
      'nfl': 'americanfootball_nfl',
      'ncaaf': 'americanfootball_ncaaf',
      'nba': 'basketball_nba',
      'ncaab': 'basketball_ncaab',
      'mlb': 'baseball_mlb',
      'nhl': 'icehockey_nhl',
      'epl': 'soccer_epl'
    };
    
    const sportKey = sportKeyMap[sport] || sport;
    console.log(`📦 Fetching cached odds for sport: ${sportKey}`);
    
    const options = {
      markets: markets ? markets.split(',') : null,
      bookmakers: bookmakers ? bookmakers.split(',') : null,
      eventId: eventId || null
    };

    const cachedOdds = await oddsCacheService.getCachedOdds(sportKey, options);
    const transformedData = transformCachedOddsToFrontend(cachedOdds);
    
    console.log(`✅ Returning ${transformedData.length} cached games for ${sportKey}`);
    
    res.set('Cache-Control', 'public, max-age=30');
    res.json(transformedData);
  } catch (err) {
    console.error('Cached odds error:', err);
    res.status(500).json({ error: 'Failed to get cached odds', detail: err.message });
  }
});

/**
 * POST /api/cached-odds/nfl/update
 * Manual trigger for NFL odds update (admin only)
 */
router.post('/cached-odds/nfl/update', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
    
    if (adminKey !== ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const oddsCacheService = req.app.locals.oddsCacheService;
    const result = await oddsCacheService.updateNFLOdds();
    
    res.json({ 
      success: true, 
      message: 'NFL odds updated successfully',
      ...result 
    });
  } catch (err) {
    console.error('Manual update error:', err);
    res.status(500).json({ error: 'Failed to update odds', detail: err.message });
  }
});

/**
 * GET /api/cached-odds/stats
 * Get update statistics
 */
router.get('/cached-odds/stats', async (req, res) => {
  try {
    const { sport = 'americanfootball_nfl', limit = 10 } = req.query;
    const oddsCacheService = req.app.locals.oddsCacheService;
    
    const stats = await oddsCacheService.getUpdateStats(sport, parseInt(limit));
    res.json({ stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats', detail: err.message });
  }
});

/**
 * POST /api/cached-odds/nfl/control
 * Start/stop NFL updates (admin only)
 */
router.post('/cached-odds/nfl/control', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
    
    if (adminKey !== ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { action } = req.body;
    const oddsCacheService = req.app.locals.oddsCacheService;
    
    if (action === 'start') {
      await oddsCacheService.startNFLUpdates();
      res.json({ success: true, message: 'NFL updates started' });
    } else if (action === 'stop') {
      await oddsCacheService.stopNFLUpdates();
      res.json({ success: true, message: 'NFL updates stopped' });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
    }
  } catch (err) {
    console.error('Control error:', err);
    res.status(500).json({ error: 'Failed to control updates', detail: err.message });
  }
});

/**
 * GET /api/odds/player-props
 * Player props endpoint - fetches player prop odds using the /odds endpoint
 * Note: TheOddsAPI only supports player props through the /odds endpoint with specific market keys
 */
router.get('/player-props', requireUser, checkPlanAccess, async (req, res) => {
  try {
    const { league, date, game_id, markets, bookmakers } = req.query;
    
    if (!league) {
      return res.status(400).json({ error: 'Missing required parameter: league' });
    }

    // Convert league to sport_key format
    const sportKeyMap = {
      'americanfootball_nfl': 'americanfootball_nfl',
      'nfl': 'americanfootball_nfl',
      'basketball_nba': 'basketball_nba',
      'nba': 'basketball_nba',
      'baseball_mlb': 'baseball_mlb',
      'mlb': 'baseball_mlb',
      'icehockey_nhl': 'icehockey_nhl',
      'nhl': 'icehockey_nhl'
    };
    
    const sportKey = sportKeyMap[league] || league;
    
    // Parse markets - if not provided, use default player prop markets
    let marketsList = markets 
      ? (typeof markets === 'string' ? markets.split(',') : markets)
      : ['player_points', 'player_assists', 'player_rebounds', 'player_pass_tds', 'player_passing_yards', 'player_rushing_yards', 'player_receiving_yards', 'player_receptions'];
    
    // Ensure all markets are player prop markets
    marketsList = marketsList.filter(m => m.startsWith('player_'));
    
    if (marketsList.length === 0) {
      return res.status(400).json({ error: 'No valid player prop markets specified' });
    }

    // Build API request - use /odds endpoint which supports player props
    const params = {
      apiKey: API_KEY,
      regions: 'us,us_dfs',
      markets: marketsList.join(','),
      oddsFormat: 'american'
    };
    
    // Use DFS apps for player props
    const dfsApps = ['prizepicks', 'underdog', 'pick6', 'draftkings_pick6', 'dabble_au'];
    params.bookmakers = bookmakers || dfsApps.join(',');

    console.log('🎯 Fetching player props:', { sportKey, markets: marketsList.join(','), bookmakers: params.bookmakers });

    // Fetch from TheOddsAPI using /odds endpoint
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds`;
    const response = await axios.get(url, { params, timeout: 30000 });
    
    if (response.status !== 200) {
      throw new Error(`TheOddsAPI returned status ${response.status}`);
    }

    const events = response.data || [];
    
    // Transform to player props format
    const items = [];
    for (const event of events) {
      if (!event.bookmakers || event.bookmakers.length === 0) continue;
      
      for (const bookmaker of event.bookmakers) {
        for (const market of bookmaker.markets || []) {
          if (!market.key.startsWith('player_')) continue;
          
          for (const outcome of market.outcomes || []) {
            items.push({
              event_id: event.id,
              sport_key: sportKey,
              commence_time: event.commence_time,
              home_team: event.home_team,
              away_team: event.away_team,
              bookmaker_key: bookmaker.key,
              bookmaker_title: bookmaker.title,
              market_key: market.key,
              market_name: market.key.replace('player_', ''),
              player_name: outcome.name,
              outcome_name: outcome.description,
              price: outcome.price,
              point: outcome.point
            });
          }
        }
      }
    }

    res.json({
      items,
      stale: false,
      ttl: 300,
      as_of: new Date().toISOString()
    });
  } catch (err) {
    console.error('Player props error:', err);
    res.status(500).json({ error: 'Failed to fetch player props', detail: err.message });
  }
});

/**
 * Helper function to transform cached odds to frontend format
 */
function transformCachedOddsToFrontend(cachedOdds) {
  const eventsMap = new Map();

  for (const odd of cachedOdds) {
    if (!eventsMap.has(odd.event_id)) {
      eventsMap.set(odd.event_id, {
        id: odd.event_id,
        sport_key: odd.sport_key,
        sport_title: 'NFL',
        commence_time: odd.commence_time,
        home_team: odd.event_name.split(' @ ')[1],
        away_team: odd.event_name.split(' @ ')[0],
        bookmakers: []
      });
    }

    const event = eventsMap.get(odd.event_id);
    let bookmaker = event.bookmakers.find(b => b.key === odd.bookmaker_key);
    
    if (!bookmaker) {
      bookmaker = {
        key: odd.bookmaker_key,
        title: odd.bookmaker_key,
        markets: []
      };
      event.bookmakers.push(bookmaker);
    }

    bookmaker.markets.push({
      key: odd.market_key,
      last_update: odd.last_updated,
      outcomes: odd.outcomes
    });
  }

  return Array.from(eventsMap.values());
}

module.exports = router;
