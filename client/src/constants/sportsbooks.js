// Centralized sportsbooks configuration
// This matches the actual sportsbooks available in the odds API data

export const AVAILABLE_SPORTSBOOKS = [
  // Popular US Sportsbooks (matching API data)
  { key: 'draftkings', name: 'DraftKings', popular: true },
  { key: 'fanduel', name: 'FanDuel', popular: true },
  { key: 'betmgm', name: 'BetMGM', popular: true },
  { key: 'caesars', name: 'Caesars Sportsbook', popular: true },
  { key: 'pointsbetus', name: 'PointsBet US', popular: true },
  { key: 'wynnbet', name: 'WynnBET', popular: true },
  { key: 'betrivers', name: 'BetRivers', popular: true },
  { key: 'unibet_us', name: 'Unibet US', popular: true },
  
  // Other available sportsbooks
  { key: 'williamhill_us', name: 'Caesars (William Hill)', popular: false },
  { key: 'superbook', name: 'SuperBook', popular: false },
  { key: 'barstool', name: 'ESPN BET', popular: false },
  { key: 'espnbet', name: 'ESPN BET', popular: true },
  { key: 'fanatics', name: 'Fanatics Sportsbook', popular: true },
  { key: 'twinspires', name: 'TwinSpires', popular: false },
  { key: 'foxbet', name: 'FOX Bet', popular: false },
  { key: 'betfred_us', name: 'Betfred US', popular: false },
  { key: 'circasports', name: 'Circa Sports', popular: false },
  { key: 'lowvig', name: 'LowVig', popular: false },
  { key: 'novig', name: 'NoVig', popular: true },
  { key: 'fliff', name: 'Fliff', popular: true },
  { key: 'bovada', name: 'Bovada', popular: false },
  { key: 'betonlineag', name: 'BetOnline', popular: false },
  { key: 'betonline', name: 'BetOnline', popular: true },
  { key: 'hardrock', name: 'Hard Rock Bet', popular: true },
  { key: 'mybookieag', name: 'MyBookie', popular: false },
  { key: 'rebet', name: 'Rebet', popular: false },
  { key: 'pinnacle', name: 'Pinnacle', popular: true },
  
  // DFS Apps (expanded for player props)
  { key: 'prizepicks', name: 'PrizePicks', popular: true, isDFS: true },
  { key: 'underdog', name: 'Underdog Fantasy', popular: true, isDFS: true },
  { key: 'pick6', name: 'DraftKings Pick6', popular: true, isDFS: true },
  { key: 'prophetx', name: 'ProphetX', popular: true, isDFS: true },
  
  // Additional Sportsbooks for expanded coverage
  { key: 'wynnbet', name: 'WynnBET', popular: true },
  { key: 'superbook', name: 'SuperBook', popular: true },
  { key: 'twinspires', name: 'TwinSpires', popular: true },
  { key: 'betfred_us', name: 'Betfred US', popular: true },
  { key: 'circasports', name: 'Circa Sports', popular: true },
  { key: 'lowvig', name: 'LowVig', popular: true },
  { key: 'barstool', name: 'ESPN BET (Barstool)', popular: true },
  { key: 'foxbet', name: 'FOX Bet', popular: true },
];

// Helper function to get sportsbook by key
export const getSportsbookByKey = (key) => {
  return AVAILABLE_SPORTSBOOKS.find(book => book.key === key);
};

// Helper function to get popular sportsbooks
export const getPopularSportsbooks = () => {
  return AVAILABLE_SPORTSBOOKS.filter(book => book.popular);
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
  return AVAILABLE_SPORTSBOOKS.filter(book => !book.isDFS);
};

// Helper function to check if a sportsbook is a DFS app
export const isDFSApp = (key) => {
  const book = getSportsbookByKey(key);
  return book?.isDFS || false;
};
