import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import optimizedStorage from '../utils/storageOptimizer';

const FilterContext = createContext();

// Default filters for each bet type
const getDefaultFilters = (betType = 'straight') => ({
  // Game mode filters
  sports: ['americanfootball_nfl', 'basketball_nba', 'icehockey_nhl'],
  date: '',
  markets: [
    // Core markets
    'h2h', 'spreads', 'totals',
    // Alternate markets
    'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals',
    // Quarter markets (Basketball, Football)
    'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
    'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
    'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
    // Half markets
    'h2h_h1', 'h2h_h2', 'spreads_h1', 'spreads_h2', 'totals_h1', 'totals_h2',
    // Period markets (Hockey)
    'h2h_p1', 'h2h_p2', 'h2h_p3', 'spreads_p1', 'spreads_p2', 'spreads_p3', 'totals_p1', 'totals_p2', 'totals_p3'
  ],
  sportsbooks: [],
  dataPoints: 10,
  
  // Player props filters
  playerPropMarkets: ['player_pass_yds', 'player_rush_yds', 'player_receptions'],
  playerPropSportsbooks: [],
  
  // Arbitrage filters
  minProfit: 0.5,
  maxStake: 100,
  
  // Middles filters
  minMiddleGap: 3,
  minMiddleProbability: 15,
  maxMiddleStake: 1000,
  
  // UI state
  isPending: false, // True while modal is open
  minEV: '',
  
  // Track which bet type these filters belong to
  betType: betType,
});

// Storage key for each bet type
const getStorageKey = (betType) => `appliedFilters_${betType || 'straight'}`;

export function FilterProvider({ children }) {
  // Current active bet type
  const [activeBetType, setActiveBetType] = useState('straight');
  
  // Initialize filters from localStorage or defaults for the active bet type
  const [filters, setFilters] = useState(() => {
    const saved = optimizedStorage.get(getStorageKey('straight'));
    if (saved) {
      return { ...saved, betType: 'straight' };
    }
    return getDefaultFilters('straight');
  });

  // Switch to a different bet type and load its filters
  const switchBetType = useCallback((newBetType) => {
    // Save current filters before switching
    if (filters.betType) {
      optimizedStorage.set(getStorageKey(filters.betType), filters);
    }
    
    // Load filters for the new bet type
    const saved = optimizedStorage.get(getStorageKey(newBetType));
    if (saved) {
      setFilters({ ...saved, betType: newBetType, isPending: false });
    } else {
      setFilters(getDefaultFilters(newBetType));
    }
    setActiveBetType(newBetType);
  }, [filters]);

  // Update a single filter property
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Open filter modal (set pending state)
  const openFilterModal = useCallback(() => {
    setFilters(prev => ({ ...prev, isPending: true }));
  }, []);

  // Apply filters (clear pending state and save to localStorage for current bet type)
  const applyFilters = useCallback(() => {
    setFilters(prev => {
      const updated = { ...prev, isPending: false };
      // Save to localStorage with bet-type-specific key
      optimizedStorage.set(getStorageKey(prev.betType || activeBetType), updated);
      return updated;
    });
  }, [activeBetType]);

  // Close filter modal without applying (revert pending changes)
  const closeFilterModal = useCallback(() => {
    setFilters(prev => ({ ...prev, isPending: false }));
  }, []);

  // Reset filters to defaults for current bet type
  const resetFilters = useCallback(() => {
    const currentBetType = filters.betType || activeBetType;
    const defaults = getDefaultFilters(currentBetType);
    setFilters(defaults);
    optimizedStorage.set(getStorageKey(currentBetType), defaults);
  }, [filters.betType, activeBetType]);

  // Save filters to localStorage whenever they change (but not while pending)
  useEffect(() => {
    if (!filters.isPending && filters.betType) {
      optimizedStorage.set(getStorageKey(filters.betType), filters);
    }
  }, [filters]);

  const value = {
    filters,
    activeBetType,
    switchBetType,
    updateFilter,
    updateFilters,
    openFilterModal,
    applyFilters,
    closeFilterModal,
    resetFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

// Hook to use filter context
export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
}
