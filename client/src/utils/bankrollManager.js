// Centralized bankroll management utility
// Ensures consistent bankroll handling across BetSlip, ArbitrageDetector, and MySportsbooks
import React from 'react';

const BANKROLL_STORAGE_KEY = 'userBankroll';
const DEFAULT_BANKROLL = 1000;

export const bankrollManager = {
  // Get current bankroll from storage
  getBankroll: () => {
    try {
      const saved = localStorage.getItem(BANKROLL_STORAGE_KEY);
      
      // Debug logging to help diagnose issues
      console.log('Retrieving bankroll:', { 
        saved, 
        type: typeof saved,
        parsed: saved ? Number(saved) : null,
        default: DEFAULT_BANKROLL 
      });
      
      // Ensure we have a valid number
      const parsedValue = saved ? Number(saved) : null;
      if (saved && !isNaN(parsedValue)) {
        return parsedValue;
      } else {
        return DEFAULT_BANKROLL;
      }
    } catch (error) {
      console.warn('Failed to get bankroll from storage:', error);
      return DEFAULT_BANKROLL;
    }
  },

  // Set bankroll in storage and notify all listeners
  setBankroll: (amount) => {
    try {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount < 0) {
        throw new Error('Invalid bankroll amount');
      }
      
      // Debug logging to help diagnose issues
      console.log('Setting bankroll:', { 
        amount, 
        numericAmount,
        stringValue: numericAmount.toString() 
      });
      
      // Store as string to ensure consistency
      localStorage.setItem(BANKROLL_STORAGE_KEY, numericAmount.toString());
      
      // Also store in optimizedStorage for redundancy
      try {
        if (window.optimizedStorage && typeof window.optimizedStorage.set === 'function') {
          window.optimizedStorage.set(BANKROLL_STORAGE_KEY, numericAmount, { priority: 'high' });
        }
      } catch (e) {
        console.warn('Failed to set bankroll in optimizedStorage:', e);
      }
      
      // Dispatch custom event to notify all components
      window.dispatchEvent(new CustomEvent('bankrollChanged', {
        detail: { bankroll: numericAmount }
      }));
      
      return numericAmount;
    } catch (error) {
      console.error('Failed to set bankroll:', error);
      throw error;
    }
  },

  // Add event listener for bankroll changes
  onBankrollChange: (callback) => {
    const handler = (event) => {
      callback(event.detail.bankroll);
    };
    
    window.addEventListener('bankrollChanged', handler);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('bankrollChanged', handler);
    };
  },

  // Calculate recommended bet sizes based on bankroll and risk tolerance
  calculateBetSize: (bankroll, riskTolerance = 'moderate', edgePercentage = 0) => {
    const riskMultipliers = {
      conservative: 0.01, // 1% of bankroll
      moderate: 0.025,    // 2.5% of bankroll  
      aggressive: 0.05    // 5% of bankroll
    };
    
    const baseMultiplier = riskMultipliers[riskTolerance] || riskMultipliers.moderate;
    
    // Apply Kelly Criterion if edge is provided
    if (edgePercentage > 0) {
      // Simplified Kelly: f = (bp - q) / b
      // Where b = odds-1, p = win probability, q = lose probability
      const kellyMultiplier = Math.min(edgePercentage / 100 * 0.5, baseMultiplier * 2);
      return Math.round(bankroll * kellyMultiplier);
    }
    
    return Math.round(bankroll * baseMultiplier);
  },

  // Validate bankroll amount
  validateBankroll: (amount) => {
    const numericAmount = Number(amount);
    
    if (isNaN(numericAmount)) {
      return { valid: false, error: 'Bankroll must be a valid number' };
    }
    
    if (numericAmount < 0) {
      return { valid: false, error: 'Bankroll cannot be negative' };
    }
    
    if (numericAmount > 1000000) {
      return { valid: false, error: 'Bankroll cannot exceed $1,000,000' };
    }
    
    return { valid: true, amount: numericAmount };
  }
};

// React hook for bankroll management
export const useBankroll = () => {
  const [bankroll, setBankrollState] = React.useState(bankrollManager.getBankroll());
  
  React.useEffect(() => {
    // Listen for bankroll changes from other components
    const cleanup = bankrollManager.onBankrollChange((newBankroll) => {
      setBankrollState(newBankroll);
    });
    
    return cleanup;
  }, []);
  
  const updateBankroll = (amount) => {
    try {
      const newBankroll = bankrollManager.setBankroll(amount);
      setBankrollState(newBankroll);
      return { success: true, bankroll: newBankroll };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  return {
    bankroll,
    updateBankroll,
    calculateBetSize: (riskTolerance, edgePercentage) => 
      bankrollManager.calculateBetSize(bankroll, riskTolerance, edgePercentage),
    validateBankroll: bankrollManager.validateBankroll
  };
};
