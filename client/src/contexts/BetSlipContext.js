import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const BetSlipContext = createContext();

// LocalStorage key for bet slip persistence
const BET_SLIP_STORAGE_KEY = 'vr_odds_bet_slip';

// Disable verbose logging in production
const DEBUG_LOGGING = process.env.NODE_ENV === 'development';

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
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('BetSlip: Failed to load from localStorage');
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
    } catch (error) {
      console.error('BetSlip: Failed to save to localStorage');
    }
  }, [bets]);

  const addBet = useCallback((bet) => {
    setBets(prevBets => {
      const existingIndex = prevBets.findIndex(b => b.id === bet.id);
      if (existingIndex !== -1) {
        const updated = [...prevBets];
        updated[existingIndex] = { ...updated[existingIndex], ...bet };
        return updated;
      }
      return [...prevBets, bet];
    });
    
    // Auto-open bet slip when adding first bet
    if (bets.length === 0) {
      setIsOpen(true);
    }
  }, [bets.length]);

  const removeBet = useCallback((betId) => {
    setBets(prevBets => prevBets.filter(bet => bet.id !== betId));
  }, []);

  const updateBet = useCallback((betId, updates) => {
    setBets(prevBets => 
      prevBets.map(bet => 
        bet.id === betId ? { ...bet, ...updates } : bet
      )
    );
  }, []);

  const clearAllBets = useCallback(() => {
    setBets([]);
  }, []);

  const openBetSlip = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeBetSlip = useCallback(() => {
    setIsOpen(false);
  }, []);

  const placeBets = useCallback((placedBets) => {
    try {
      const existingBets = JSON.parse(localStorage.getItem('placed_bets') || '[]');
      const newBets = placedBets.map(bet => ({
        ...bet,
        id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        placedAt: new Date().toISOString(),
        status: 'pending'
      }));
      
      localStorage.setItem('placed_bets', JSON.stringify([...existingBets, ...newBets]));
      clearAllBets();
      closeBetSlip();
    } catch (error) {
      console.error('BetSlip: Failed to place bets');
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
