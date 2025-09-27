// Storage initialization script
import { optimizedStorage } from './storageOptimizer';

// Make optimizedStorage available globally
if (typeof window !== 'undefined') {
  window.optimizedStorage = optimizedStorage;
  
  // Initialize critical storage keys if they don't exist
  const initStorage = () => {
    try {
      // Initialize userSelectedSportsbooks if not present
      if (!localStorage.getItem('userSelectedSportsbooks')) {
        const defaultBooks = ['draftkings', 'fanduel', 'betmgm', 'caesars'];
        localStorage.setItem('userSelectedSportsbooks', JSON.stringify(defaultBooks));
        optimizedStorage.set('userSelectedSportsbooks', defaultBooks, { priority: 'high' });
        console.log('Initialized userSelectedSportsbooks with defaults');
      }
      
      // Initialize userBankroll if not present
      if (!localStorage.getItem('userBankroll')) {
        localStorage.setItem('userBankroll', '1000');
        console.log('Initialized userBankroll with default: 1000');
      }
      
      console.log('Storage initialization complete');
    } catch (error) {
      console.error('Storage initialization failed:', error);
    }
  };
  
  // Run initialization
  initStorage();
}

export default optimizedStorage;
