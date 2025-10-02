// Cleaned-up sportsbooks configuration
// Duplicates removed, defunct books removed

export const AVAILABLE_SPORTSBOOKS = [
  // ===== TOP TIER - MUST HAVE =====
  { key: 'draftkings', name: 'DraftKings', popular: true, tier: 1 },
  { key: 'fanduel', name: 'FanDuel', popular: true, tier: 1 },
  { key: 'betmgm', name: 'BetMGM', popular: true, tier: 1 },
  { key: 'caesars', name: 'Caesars Sportsbook', popular: true, tier: 1 },
  
  // ===== DFS APPS =====
  { key: 'prizepicks', name: 'PrizePicks', popular: true, isDFS: true, tier: 1 },
  { key: 'underdog', name: 'Underdog Fantasy', popular: true, isDFS: true, tier: 1 },
  { key: 'pick6', name: 'DK Pick6', popular: true, isDFS: true, tier: 2 },
  
  // ===== SECOND TIER - MAJOR OPERATORS =====
  { key: 'espnbet', name: 'ESPN BET', popular: true, tier: 2 },
  { key: 'fanatics', name: 'Fanatics Sportsbook', popular: true, tier: 2 },
  { key: 'hardrock', name: 'Hard Rock Bet', popular: true, tier: 2 },
  { key: 'pointsbetus', name: 'PointsBet US', popular: true, tier: 2 },
  { key: 'betrivers', name: 'BetRivers', popular: true, tier: 2 },
  { key: 'wynnbet', name: 'WynnBET', popular: true, tier: 2 },
  { key: 'unibet_us', name: 'Unibet US', popular: true, tier: 2 },
  
  // ===== SHARP/LOW VIG BOOKS =====
  { key: 'pinnacle', name: 'Pinnacle', popular: true, tier: 2 },
  { key: 'novig', name: 'NoVig', popular: true, tier: 2 },
  
  // ===== EXCHANGE =====
  { key: 'prophetx', name: 'ProphetX', popular: true, isExchange: true, tier: 3 },
  
  // ===== REGIONAL/SPECIALTY =====
  { key: 'fliff', name: 'Fliff', popular: false, tier: 3 },
  { key: 'circasports', name: 'Circa Sports', popular: false, tier: 3 },
  
  // ===== OFFSHORE (Optional - can remove if not wanted) =====
  { key: 'bovada', name: 'Bovada', popular: false, tier: 3, offshore: true },
  { key: 'betonline', name: 'BetOnline', popular: false, tier: 3, offshore: true },
  { key: 'mybookieag', name: 'MyBookie', popular: false, tier: 3, offshore: true },
];

// Helper function to get sportsbook by key
export const getSportsbookByKey = (key) => {
  return AVAILABLE_SPORTSBOOKS.find(book => book.key === key);
};

// Helper function to get popular sportsbooks
export const getPopularSportsbooks = () => {
  return AVAILABLE_SPORTSBOOKS.filter(book => book.popular);
};

// Helper function to get sportsbooks by tier
export const getSportsbooksByTier = (tier) => {
  return AVAILABLE_SPORTSBOOKS.filter(book => book.tier === tier);
};

// Helper function to get top tier sportsbooks
export const getTopTierSportsbooks = () => {
  return AVAILABLE_SPORTSBOOKS.filter(book => book.tier === 1);
};

// Helper function to get sportsbooks available to free users
export const getFreePlanSportsbooks = () => {
  return AVAILABLE_SPORTSBOOKS.filter(book => 
    book.key === 'draftkings' || 
    book.key === 'fanduel' || 
    book.key === 'caesars'
  );
};

// Helper function to get sportsbooks available to platinum users (includes all)
export const getPlatinumPlanSportsbooks = () => {
  return AVAILABLE_SPORTSBOOKS;
};

// Helper function to filter sportsbooks by user plan
export const getSportsbooksByPlan = (userPlan) => {
  if (userPlan === 'platinum') {
    return AVAILABLE_SPORTSBOOKS;
  }
  return getFreePlanSportsbooks();
};

// Helper function to get all sportsbook keys
export const getAllSportsbookKeys = () => {
  return AVAILABLE_SPORTSBOOKS.map(book => book.key);
};

// Helper function to get DFS apps only
export const getDFSApps = () => {
  return AVAILABLE_SPORTSBOOKS.filter(book => book.isDFS);
};

// Helper function to get traditional sportsbooks only (excluding DFS)
export const getTraditionalSportsbooks = () => {
  return AVAILABLE_SPORTSBOOKS.filter(book => !book.isDFS && !book.isExchange);
};

// Helper function to check if a sportsbook is a DFS app
export const isDFSApp = (key) => {
  const book = getSportsbookByKey(key);
  return book?.isDFS || false;
};

// Helper function to get non-offshore books only
export const getNonOffshoreSportsbooks = () => {
  return AVAILABLE_SPORTSBOOKS.filter(book => !book.offshore);
};

// Helper function to get player props priority books
export const getPlayerPropsPriorityBooks = () => {
  // Return books in priority order for player props
  return AVAILABLE_SPORTSBOOKS
    .filter(book => book.tier <= 2) // Only tier 1 and 2
    .sort((a, b) => {
      // DFS apps first
      if (a.isDFS && !b.isDFS) return -1;
      if (!a.isDFS && b.isDFS) return 1;
      // Then by tier
      return a.tier - b.tier;
    });
};

// Helper function to get ALL books that support player props
export const getPlayerPropsBooks = () => {
  // ALL books in our system support player props (US-focused)
  // Excludes: None - all books are US-based and support player props
  return AVAILABLE_SPORTSBOOKS.map(book => book.key);
};

// Helper function to check if a book supports player props
export const supportsPlayerProps = (bookKey) => {
  // All books in our cleaned list support player props
  return AVAILABLE_SPORTSBOOKS.some(book => book.key === bookKey);
};

// REMOVED (Duplicates/Defunct):
// - williamhill_us (duplicate of caesars)
// - barstool (duplicate of espnbet)
// - betonlineag (duplicate of betonline)
// - foxbet (defunct)
// - twinspires (rebranded to fanduel)
// - rebet (low volume)
// - lowvig (low volume)
