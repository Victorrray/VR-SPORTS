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
  { key: 'twinspires', name: 'TwinSpires', popular: false },
  { key: 'foxbet', name: 'FOX Bet', popular: false },
  { key: 'betfred_us', name: 'Betfred US', popular: false },
  { key: 'circasports', name: 'Circa Sports', popular: false },
  { key: 'lowvig', name: 'LowVig', popular: false },
  { key: 'novig', name: 'NoVig', popular: false },
  { key: 'fliff', name: 'Fliff', popular: false },
  { key: 'bovada', name: 'Bovada', popular: false },
  { key: 'betonlineag', name: 'BetOnline', popular: false },
  { key: 'mybookieag', name: 'MyBookie', popular: false },
];

// Helper function to get sportsbook by key
export const getSportsbookByKey = (key) => {
  return AVAILABLE_SPORTSBOOKS.find(book => book.key === key);
};

// Helper function to get popular sportsbooks
export const getPopularSportsbooks = () => {
  return AVAILABLE_SPORTSBOOKS.filter(book => book.popular);
};

// Helper function to get all sportsbook keys
export const getAllSportsbookKeys = () => {
  return AVAILABLE_SPORTSBOOKS.map(book => book.key);
};
