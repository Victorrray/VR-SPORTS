import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { optimizedStorage } from '../utils/storageOptimizer';

const FilterContext = createContext();

export function FilterProvider({ children }) {
  // Initialize filters from localStorage or defaults
  const [filters, setFilters] = useState(() => {
    const saved = optimizedStorage.get('appliedFilters');
    if (saved) {
      return saved;
    }
    return {
      // Game mode filters
      sports: ['americanfootball_nfl', 'basketball_nba', 'icehockey_nhl'],
      date: '',
      markets: ['h2h', 'spreads', 'totals'],
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
    };
  });

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

  // Apply filters (clear pending state and save to localStorage)
  const applyFilters = useCallback(() => {
    setFilters(prev => {
      const updated = { ...prev, isPending: false };
      // Save to localStorage for persistence
      optimizedStorage.set('appliedFilters', updated);
      return updated;
    });
  }, []);

  // Close filter modal without applying (revert pending changes)
  const closeFilterModal = useCallback(() => {
    setFilters(prev => ({ ...prev, isPending: false }));
  }, []);

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    const defaults = {
      sports: ['americanfootball_nfl', 'americanfootball_ncaaf'],
      date: '',
      markets: ['h2h', 'spreads', 'totals'],
      sportsbooks: [],
      dataPoints: 10,
      playerPropMarkets: ['player_pass_yds', 'player_rush_yds', 'player_receptions'],
      playerPropSportsbooks: [],
      minProfit: 0.5,
      maxStake: 100,
      minMiddleGap: 3,
      minMiddleProbability: 15,
      maxMiddleStake: 1000,
      isPending: false,
      minEV: '',
    };
    setFilters(defaults);
    optimizedStorage.set('appliedFilters', defaults);
  }, []);

  // Save filters to localStorage whenever they change (but not while pending)
  useEffect(() => {
    if (!filters.isPending) {
      optimizedStorage.set('appliedFilters', filters);
    }
  }, [filters]);

  const value = {
    filters,
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
