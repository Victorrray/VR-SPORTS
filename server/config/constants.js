/**
 * Application Constants
 * Centralized configuration for cache durations, bookmakers, markets, and API settings
 */

// Cache durations - balanced for freshness vs API cost/memory
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes for regular markets
const PLAYER_PROPS_CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes for player props - return cached fast, refresh in background
const PLAYER_PROPS_STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes - after this, trigger background refresh
const ALTERNATE_MARKETS_CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes for alternate markets (change less frequently)
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// API configuration
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.ODDS_API_KEY;
const PLAYER_PROPS_API_BASE = process.env.PLAYER_PROPS_API_BASE || null;
const ENABLE_PLAYER_PROPS_V2 = process.env.ENABLE_PLAYER_PROPS_V2 !== 'false'; // Default to true, can be disabled with 'false'
const REMOVE_API_LIMITS = process.env.REMOVE_API_LIMITS === 'true'; // Testing flag to remove all API limits

// Player props configuration
const PLAYER_PROPS_CACHE_TTL_MS = Number(process.env.PLAYER_PROPS_CACHE_TTL_MS || 30_000);
const PLAYER_PROPS_RETRY_ATTEMPTS = Number(process.env.PLAYER_PROPS_RETRY_ATTEMPTS || 2);
const PLAYER_PROPS_MAX_MARKETS_PER_REQUEST = 50;
const PLAYER_PROPS_MAX_BOOKS_PER_REQUEST = 25;
const PLAYER_PROPS_REQUEST_TIMEOUT = 30000;
const PLAYER_PROPS_MAX_CACHE_ENTRIES = 100;
const PLAYER_PROPS_TIMEZONE = process.env.PLAYER_PROPS_TIMEZONE || 'America/New_York';

// Stripe configuration
const STRIPE_PRICE_GOLD = process.env.STRIPE_PRICE_GOLD || process.env.STRIPE_PRICE_PLATINUM;
const STRIPE_PRICE_PLATINUM = process.env.STRIPE_PRICE_PLATINUM || process.env.STRIPE_PRICE_GOLD;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// Bookmaker lists
const FOCUSED_BOOKMAKERS = [
  // DFS apps for player props (prioritized for slice limit)
  "prizepicks", "underdog", "draftkings_pick6", "dabble_au", "betr",
  // Sharp books and exchanges (high priority)
  "pinnacle", "prophet_exchange", "rebet",
  // US region books
  "draftkings", "fanduel", "betmgm", "caesars", "williamhill_us", "pointsbet", "bovada", 
  "mybookie", "betonline", "unibet", "betrivers", "novig", "fliff",
  "hardrock", "hardrockbet", "espnbet", "fanatics", "wynnbet", "superbook", "twinspires",
  "betfred_us", "circasports", "lowvig", "barstool", "foxbet",
  // Other exchange books
  "betopenly", "prophetx"
];

// Trial user bookmaker restrictions
const TRIAL_BOOKMAKERS = [
  // DFS apps for player props (prioritized for slice limit)
  "prizepicks", "underdog", "draftkings_pick6", "dabble_au", "betr",
  // Sharp books and exchanges (high priority)
  "pinnacle", "prophet_exchange", "rebet",
  // Major sportsbooks
  "draftkings", "fanduel", "caesars", "williamhill_us", "betmgm", "pointsbet", "betrivers", 
  "unibet", "bovada", "betonline", "fliff", "hardrock", "hardrockbet", "novig", "wynnbet",
  "espnbet", "fanatics", "betopenly", "prophetx"
];

// Market configurations
const ALTERNATE_MARKETS = [
  'alternate_spreads',
  'alternate_totals',
  'team_totals',
  'alternate_team_totals'
];

const PLAYER_PROP_MARKETS = [
  'player_pass_yds', 'player_pass_tds', 'player_pass_completions', 'player_pass_attempts',
  'player_rush_yds', 'player_rush_tds', 'player_rush_attempts',
  'player_receptions', 'player_reception_yds', 'player_reception_tds',
  'player_points', 'player_rebounds', 'player_assists', 'player_threes',
  'player_strikeouts', 'player_hits', 'player_total_bases', 'player_rbis'
];

const INVALID_PLAYER_PROP_MARKETS = [
  'player_2_plus_tds',
  'player_receiving_yds',
  'player_receiving_tds', 
  'player_receiving_longest'
];

const PLAYER_PROPS_MARKET_MAP = {
  player_reception_yds: 'player_receiving_yards',
  player_reception_yards: 'player_receiving_yards',
  player_receptions: 'player_receptions',
  player_receptions_alternate: 'player_receptions_alternate',
  player_pass_yds: 'player_passing_yards',
  player_pass_yards: 'player_passing_yards',
  player_pass_tds: 'player_passing_touchdowns',
  player_pass_td: 'player_passing_touchdowns',
  player_rush_yds: 'player_rushing_yards',
  player_rush_yards: 'player_rushing_yards',
  player_rush_attempts: 'player_rushing_attempts',
  player_rush_attempts_alternate: 'player_rushing_attempts_alternate',
  player_receive_yards: 'player_receiving_yards',
  player_receiving_yards: 'player_receiving_yards',
  player_receiving_yards_alternate: 'player_receiving_yards_alternate',
  player_receiving_receptions: 'player_receptions',
  player_points: 'player_points',
  player_points_alternate: 'player_points_alternate',
  player_assists: 'player_assists',
  player_assists_alternate: 'player_assists_alternate',
  player_rebounds: 'player_rebounds',
  player_rebounds_alternate: 'player_rebounds_alternate',
  player_threes: 'player_three_pointers_made',
  player_threes_alternate: 'player_three_pointers_made_alternate',
  player_total_bases: 'player_total_bases',
  player_total_bases_alternate: 'player_total_bases_alternate',
  player_strikeouts: 'player_strikeouts',
  player_strikeouts_alternate: 'player_strikeouts_alternate',
  player_points_rebounds_assists: 'player_points_rebounds_assists',
  player_points_rebounds_assists_alternate: 'player_points_rebounds_assists_alternate',
  player_anytime_td: 'player_anytime_touchdown',
  player_anytime_touchdown: 'player_anytime_touchdown',
  player_anytime_td_alternate: 'player_anytime_touchdown_alternate',
  player_anytime_touchdown_alternate: 'player_anytime_touchdown_alternate',
  player_combined_tackles: 'player_combined_tackles',
  player_combined_tackles_assists: 'player_combined_tackles',
  player_assists_plus_points: 'player_points_assists',
  player_points_assists: 'player_points_assists',
  player_rush_receive_yds: 'player_rush_receive_yards',
  player_rush_receive_yards: 'player_rush_receive_yards',
  player_rush_receive_yds_alternate: 'player_rush_receive_yards_alternate',
  player_rush_receive_yards_alternate: 'player_rush_receive_yards_alternate',
  player_pass_completions: 'player_pass_completions',
  player_pass_attempts: 'player_pass_attempts',
  player_pass_longest_completion: 'player_pass_longest_completion',
  player_reception_longest: 'player_reception_longest',
  player_rush_attempts_longest: 'player_rush_longest',
  player_rush_longest: 'player_rush_longest',
};

const DEFAULT_PLAYER_PROP_MARKETS = {
  americanfootball_nfl: [
    'player_passing_yards',
    'player_rushing_yards',
    'player_receiving_yards',
    'player_receptions',
    'player_passing_touchdowns',
    'player_rushing_attempts',
  ],
  basketball_nba: [
    'player_points',
    'player_assists',
    'player_rebounds',
    'player_three_pointers_made',
  ],
  baseball_mlb: [
    'player_total_bases',
    'player_hits',
    'player_home_runs',
    'player_strikeouts',
  ],
};

const DEFAULT_BOOK_STATE = (process.env.DEFAULT_BOOK_STATE || 'nj').toLowerCase();

// Bookmaker limits
const MAX_BOOKMAKERS = 25;

module.exports = {
  // Cache durations
  CACHE_DURATION_MS,
  PLAYER_PROPS_CACHE_DURATION_MS,
  ALTERNATE_MARKETS_CACHE_DURATION_MS,
  PLAN_CACHE_TTL_MS,
  
  // API configuration
  PORT,
  API_KEY,
  PLAYER_PROPS_API_BASE,
  ENABLE_PLAYER_PROPS_V2,
  REMOVE_API_LIMITS,
  
  // Player props configuration
  PLAYER_PROPS_CACHE_TTL_MS,
  PLAYER_PROPS_RETRY_ATTEMPTS,
  PLAYER_PROPS_MAX_MARKETS_PER_REQUEST,
  PLAYER_PROPS_MAX_BOOKS_PER_REQUEST,
  PLAYER_PROPS_REQUEST_TIMEOUT,
  PLAYER_PROPS_MAX_CACHE_ENTRIES,
  PLAYER_PROPS_TIMEZONE,
  PLAYER_PROPS_STALE_THRESHOLD_MS,
  
  // Stripe configuration
  STRIPE_PRICE_GOLD,
  STRIPE_PRICE_PLATINUM,
  STRIPE_WEBHOOK_SECRET,
  FRONTEND_URL,
  ADMIN_API_KEY,
  
  // Bookmakers
  FOCUSED_BOOKMAKERS,
  TRIAL_BOOKMAKERS,
  MAX_BOOKMAKERS,
  
  // Markets
  ALTERNATE_MARKETS,
  PLAYER_PROP_MARKETS,
  INVALID_PLAYER_PROP_MARKETS,
  PLAYER_PROPS_MARKET_MAP,
  DEFAULT_PLAYER_PROP_MARKETS,
  DEFAULT_BOOK_STATE,
};
