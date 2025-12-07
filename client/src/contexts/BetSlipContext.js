import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const BetSlipContext = createContext();

// LocalStorage key for bet slip persistence
const BET_SLIP_STORAGE_KEY = 'vr_odds_bet_slip';

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
};

// Load bets from localStorage on initial render
const loadBetsFromStorage = () => {
  try {
    const stored = localStorage.getItem(BET_SLIP_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array
      if (Array.isArray(parsed)) {
        console.log('🎯 BetSlip: Loaded', parsed.length, 'bets from localStorage');
        return parsed;
      }
    }
  } catch (error) {
    console.error('🎯 BetSlip: Failed to load from localStorage:', error);
  }
  return [];
};

export const BetSlipProvider = ({ children }) => {
  const [bets, setBets] = useState(loadBetsFromStorage);
  const [isOpen, setIsOpen] = useState(false);
  
  // Save bets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(BET_SLIP_STORAGE_KEY, JSON.stringify(bets));
      console.log('🎯 BetSlip: Saved', bets.length, 'bets to localStorage');
    } catch (error) {
      console.error('🎯 BetSlip: Failed to save to localStorage:', error);
    }
  }, [bets]);
  
  // Debug: Log whenever bets state changes
  useEffect(() => {
    console.log('🎯 BetSlip State Changed:', { 
      betCount: bets.length, 
      bets: bets.map(b => ({ id: b.id, selection: b.selection })),
      timestamp: new Date().toISOString()
    });
  }, [bets]);

  const addBet = useCallback((bet) => {
    console.log('🎯 BetSlip: addBet called', { betId: bet.id, betCount: bets.length + 1, timestamp: new Date().toISOString() });
    setBets(prevBets => {
      // Check if bet already exists
      const existingIndex = prevBets.findIndex(b => b.id === bet.id);
      if (existingIndex !== -1) {
        // Update existing bet
        const updated = [...prevBets];
        updated[existingIndex] = { ...updated[existingIndex], ...bet };
        console.log('🎯 BetSlip: Updated existing bet', { betId: bet.id, totalBets: updated.length });
        return updated;
      }
      // Add new bet
      const newBets = [...prevBets, bet];
      console.log('🎯 BetSlip: Added new bet', { betId: bet.id, totalBets: newBets.length });
      return newBets;
    });
    
    // Auto-open bet slip when adding first bet
    if (bets.length === 0) {
      setIsOpen(true);
    }
  }, [bets.length]);

  const removeBet = useCallback((betId) => {
    console.log('🎯 BetSlip: removeBet called', { betId, timestamp: new Date().toISOString() });
    setBets(prevBets => {
      const filtered = prevBets.filter(bet => bet.id !== betId);
      console.log('🎯 BetSlip: Removed bet', { betId, remainingBets: filtered.length });
      return filtered;
    });
  }, []);

  const updateBet = useCallback((betId, updates) => {
    console.log('🎯 BetSlip: updateBet called', { betId, updates, timestamp: new Date().toISOString() });
    setBets(prevBets => 
      prevBets.map(bet => 
        bet.id === betId ? { ...bet, ...updates } : bet
      )
    );
  }, []);

  const clearAllBets = useCallback(() => {
    console.log('🎯 BetSlip: clearAllBets called', { timestamp: new Date().toISOString(), stackTrace: new Error().stack });
    setBets([]);
  }, []);

  const openBetSlip = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeBetSlip = useCallback(() => {
    setIsOpen(false);
  }, []);

  const placeBets = useCallback((placedBets) => {
    // Here you would typically send the bets to your backend
    console.log('🎯 BetSlip: placeBets called', { 
      betCount: placedBets.length, 
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack 
    });
    
    // For now, we'll just save them to localStorage as placed bets
    try {
      const existingBets = JSON.parse(localStorage.getItem('placed_bets') || '[]');
      const newBets = placedBets.map(bet => ({
        ...bet,
        id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        placedAt: new Date().toISOString(),
        status: 'pending'
      }));
      
      localStorage.setItem('placed_bets', JSON.stringify([...existingBets, ...newBets]));
      
      // Clear the bet slip
      console.log('🎯 BetSlip: Clearing bets after placement');
      clearAllBets();
      closeBetSlip();
      
      // Show success notification (you could integrate with a toast library)
      console.log(`✅ BetSlip: Successfully placed ${placedBets.length} bet(s)`);
      
    } catch (error) {
      console.error('❌ BetSlip: Failed to place bets:', error);
    }
  }, [clearAllBets, closeBetSlip]);

  const getBetById = useCallback((betId) => {
    return bets.find(bet => bet.id === betId);
  }, [bets]);

  const hasBet = useCallback((betId) => {
    return bets.some(bet => bet.id === betId);
  }, [bets]);

  const value = {
    bets,
    isOpen,
    addBet,
    removeBet,
    updateBet,
    clearAllBets,
    openBetSlip,
    closeBetSlip,
    placeBets,
    getBetById,
    hasBet,
    betCount: bets.length
  };

  return (
    <BetSlipContext.Provider value={value}>
      {children}
    </BetSlipContext.Provider>
  );
};

export default BetSlipProvider;
