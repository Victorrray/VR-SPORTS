import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import optimizedStorage from '../utils/storageOptimizer';

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
      sports: ['americanfootball_nfl', 'basketball_nba', 'icehockey_nhl'],
      date: '',
      markets: [
        'h2h', 'spreads', 'totals',
        'alternate_spreads', 'alternate_totals', 'team_totals', 'alternate_team_totals',
        'h2h_q1', 'h2h_q2', 'h2h_q3', 'h2h_q4',
        'spreads_q1', 'spreads_q2', 'spreads_q3', 'spreads_q4',
        'totals_q1', 'totals_q2', 'totals_q3', 'totals_q4',
        'h2h_h1', 'h2h_h2', 'spreads_h1', 'spreads_h2', 'totals_h1', 'totals_h2',
        'h2h_p1', 'h2h_p2', 'h2h_p3', 'spreads_p1', 'spreads_p2', 'spreads_p3', 'totals_p1', 'totals_p2', 'totals_p3'
      ],
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
