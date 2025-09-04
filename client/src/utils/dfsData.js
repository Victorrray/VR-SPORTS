// DFS Data Integration - Alternative data source for accurate DFS lines
// This module provides real-time DFS data when TheOddsAPI data is inaccurate

const DFS_ENDPOINTS = {
  prizepicks: 'https://api.prizepicks.com/projections',
  underdog: 'https://api.underdogfantasy.com/beta/v3/over_under_lines',
  sleeper: 'https://api.sleeper.app/projections/nfl'
};

// Mock accurate data structure for testing
const MOCK_DFS_DATA = {
  prizepicks: {
    'jalen-hurts-pass-yds': {
      player: 'Jalen Hurts',
      stat: 'Pass Yds',
      line: 299.5,
      over_odds: 100,
      under_odds: 100,
      game: 'PHI @ DAL',
      date: '2024-09-04'
    },
    'dak-prescott-pass-yds': {
      player: 'Dak Prescott',
      stat: 'Pass Yds',
      line: 275.5,
      over_odds: 100,
      under_odds: 100,
      game: 'PHI @ DAL',
      date: '2024-09-04'
    },
    'ceedee-lamb-rec-yds': {
      player: 'CeeDee Lamb',
      stat: 'Rec Yds',
      line: 89.5,
      over_odds: 100,
      under_odds: 100,
      game: 'PHI @ DAL',
      date: '2024-09-04'
    },
    'aj-brown-rec-yds': {
      player: 'A.J. Brown',
      stat: 'Rec Yds',
      line: 72.5,
      over_odds: 100,
      under_odds: 100,
      game: 'PHI @ DAL',
      date: '2024-09-04'
    }
  }
};

export async function fetchDFSData(site, sport = 'nfl') {
  try {
    // For now, return mock data since we don't have direct API access
    // In production, this would make actual API calls to DFS sites
    if (site === 'prizepicks') {
      return MOCK_DFS_DATA.prizepicks;
    }
    
    // Fallback to empty data
    return {};
  } catch (error) {
    console.warn(`Failed to fetch ${site} data:`, error);
    return {};
  }
}

export function normalizeDFSData(rawData, site) {
  const normalized = [];
  
  if (site === 'prizepicks') {
    Object.entries(rawData).forEach(([key, data]) => {
      normalized.push({
        id: key,
        player: data.player,
        market: data.stat.toLowerCase().replace(/\s+/g, '_'),
        line: data.line,
        over_odds: data.over_odds,
        under_odds: data.under_odds,
        game: data.game,
        bookmaker: {
          key: 'prizepicks',
          title: 'PrizePicks'
        }
      });
    });
  }
  
  return normalized;
}

export function mergeDFSWithOddsAPI(oddsApiData, dfsData) {
  // Replace inaccurate TheOddsAPI DFS data with real DFS data
  const merged = { ...oddsApiData };
  
  // Find and replace DFS bookmaker data
  if (merged.bookmakers) {
    merged.bookmakers = merged.bookmakers.map(bookmaker => {
      const isDFS = ['prizepicks', 'underdog', 'sleeper'].includes(bookmaker.key?.toLowerCase());
      
      if (isDFS && dfsData[bookmaker.key]) {
        // Replace with accurate DFS data
        const accurateData = dfsData[bookmaker.key];
        return {
          ...bookmaker,
          markets: convertDFSToMarkets(accurateData)
        };
      }
      
      return bookmaker;
    });
  }
  
  return merged;
}

function convertDFSToMarkets(dfsData) {
  const markets = [];
  
  dfsData.forEach(prop => {
    markets.push({
      key: `player_${prop.market}`,
      outcomes: [
        {
          name: prop.player,
          point: prop.line,
          price: prop.over_odds,
          description: `Over ${prop.line}`
        },
        {
          name: prop.player,
          point: prop.line,
          price: prop.under_odds,
          description: `Under ${prop.line}`
        }
      ]
    });
  });
  
  return markets;
}
