import React, { createContext, useContext, useState, useCallback } from 'react';

const BetSlipContext = createContext();

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
};

export const BetSlipProvider = ({ children }) => {
  const [bets, setBets] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addBet = useCallback((bet) => {
    setBets(prevBets => {
      // Check if bet already exists
      const existingIndex = prevBets.findIndex(b => b.id === bet.id);
      if (existingIndex !== -1) {
        // Update existing bet
        const updated = [...prevBets];
        updated[existingIndex] = { ...updated[existingIndex], ...bet };
        return updated;
      }
      // Add new bet
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
    // Here you would typically send the bets to your backend
    console.log('Placing bets:', placedBets);
    
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
      clearAllBets();
      closeBetSlip();
      
      // Show success notification (you could integrate with a toast library)
      console.log(`Successfully placed ${placedBets.length} bet(s)`);
      
    } catch (error) {
      console.error('Failed to place bets:', error);
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
