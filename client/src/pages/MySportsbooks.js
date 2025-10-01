import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/SimpleAuth';
import { useMe } from '../hooks/useMe';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, AlertCircle, BookOpen, DollarSign, Star, TrendingUp, Settings } from 'lucide-react';
import { optimizedStorage } from '../utils/storageOptimizer';
import { bankrollManager } from '../utils/bankrollManager';
import SportMultiSelect from '../components/betting/SportMultiSelect';
import MobileBottomBar from '../components/layout/MobileBottomBar';
import { AVAILABLE_SPORTSBOOKS, getFreePlanSportsbooks } from '../constants/sportsbooks';
import './MySportsbooks.css';

export default function MySportsbooks() {
  const { user } = useAuth();
  const { me } = useMe();
  const navigate = useNavigate();
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [bankroll, setBankroll] = useState(bankrollManager.getBankroll());
  const [showBankrollModal, setShowBankrollModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load user's selected sportsbooks from both localStorage and optimizedStorage
    let saved;
    
    try {
      // Try localStorage first
      saved = JSON.parse(localStorage.getItem('userSelectedSportsbooks'));
      console.log('Loaded from localStorage:', saved);
    } catch (e) {
      console.warn('Error loading from localStorage:', e);
    }
    
    // If not found in localStorage, try optimizedStorage
    if (!saved || !Array.isArray(saved)) {
      saved = optimizedStorage.get('userSelectedSportsbooks');
      console.log('Loaded from optimizedStorage:', saved);
    }
    
    // Validate the loaded data
    if (saved && Array.isArray(saved) && saved.length > 0) {
      console.log('Setting selected books:', saved);
      setSelectedBooks(saved);
    } else {
      // Default to free plan sportsbooks for free users, popular for platinum
      const defaultBooks = me?.plan === 'platinum' 
        ? ['draftkings', 'fanduel', 'betmgm', 'caesars']
        : ['draftkings', 'fanduel', 'caesars'];
      console.log('Using default books:', defaultBooks);
      setSelectedBooks(defaultBooks);
    }

    // Load user's bankroll using bankroll manager
    const loadedBankroll = bankrollManager.getBankroll();
    console.log('Loaded bankroll:', loadedBankroll);
    setBankroll(loadedBankroll);
  }, [user, navigate]);

  const handleSavePreferences = () => {
    setSavingPrefs(true);
    try {
      // Save to both localStorage and optimizedStorage for redundancy
      localStorage.setItem('userSelectedSportsbooks', JSON.stringify(selectedBooks));
      optimizedStorage.set('userSelectedSportsbooks', selectedBooks, { priority: 'high' });
      
      // Save bankroll using bankroll manager
      bankrollManager.setBankroll(bankroll); 
      
      // Double-check that bankroll was saved correctly
      const savedBankroll = localStorage.getItem('userBankroll');
      console.log('Verified saved bankroll:', savedBankroll);
      
      // Double-check that sportsbooks were saved correctly
      const savedBooks = localStorage.getItem('userSelectedSportsbooks');
      console.log('Verified saved sportsbooks:', savedBooks);
      
      // Dispatch custom event to notify other components about sportsbook changes
      window.dispatchEvent(new CustomEvent('userSelectedSportsbooksChanged', {
        detail: { sportsbooks: selectedBooks }
      }));
      
      setSaveStatus('Preferences saved successfully!');
      setTimeout(() => {
        setSaveStatus('');
        setSavingPrefs(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus('Error saving preferences');
      setSavingPrefs(false);
    }
  };

  const handleBankrollChange = (e) => {
    const value = e.target.value;
    // Allow empty string for editing, but ensure it's a valid number
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      setBankroll(value === '' ? 0 : Number(value));
    }
  };

  const handleBankrollClick = () => {
    setShowBankrollModal(true);
  };

  const handleBankrollModalSave = (newValue) => {
    const validation = bankrollManager.validateBankroll(newValue);
    if (validation.valid) {
      setBankroll(validation.amount);
      
      // Immediately save the bankroll when changed via modal
      try {
        bankrollManager.setBankroll(validation.amount);
        console.log('Bankroll saved via modal:', validation.amount);
      } catch (error) {
        console.error('Failed to save bankroll from modal:', error);
      }
      
      setShowBankrollModal(false);
    } else {
      console.error('Invalid bankroll:', validation.error);
      // You could show an error message here
    }
  };

  const BankrollModal = () => {
    const [tempValue, setTempValue] = useState(bankroll.toString());
    const [selectedAmount, setSelectedAmount] = useState(null);

    const presetAmounts = [100, 250, 500, 1000, 2500, 5000, 10000, 25000];

    const handleSave = () => {
      const value = selectedAmount || Number(tempValue);
      if (value >= 0) {
        handleBankrollModalSave(value);
      }
    };

    return (
      <div className="bankroll-modal-overlay" onClick={() => setShowBankrollModal(false)}>
        <div className="bankroll-modal" onClick={(e) => e.stopPropagation()}>
          <div className="bankroll-modal-header">
            <h3>Set Your Bankroll</h3>
            <p>Choose a preset amount or enter a custom value</p>
          </div>
          
          <div className="bankroll-presets">
            {presetAmounts.map(amount => (
              <button
                key={amount}
                className={`preset-button ${selectedAmount === amount ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedAmount(amount);
                  setTempValue(amount.toString());
                }}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="bankroll-custom">
            <label>Custom Amount ($)</label>
            <input
              type="number"
              value={tempValue}
              onChange={(e) => {
                setTempValue(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Enter amount"
              className="bankroll-custom-input"
              min="0"
            />
          </div>

          <div className="bankroll-modal-actions">
            <button 
              className="modal-cancel-btn"
              onClick={() => setShowBankrollModal(false)}
            >
              Cancel
            </button>
            <button 
              className="modal-save-btn"
              onClick={handleSave}
            >
              Save Bankroll
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Filter sportsbooks based on user plan
  const availableSportsbooks = me?.plan === 'platinum' ? AVAILABLE_SPORTSBOOKS : getFreePlanSportsbooks();
  
  const popularBooks = availableSportsbooks.filter(book => book.popular);
  const otherBooks = availableSportsbooks.filter(book => !book.popular);

  const getSelectedCount = () => selectedBooks.length;
  const getTotalAvailable = () => availableSportsbooks.length;

  return (
    <div className="sportsbooks-page">
      <div className="page-header">
        <button 
          className="back-button"
          onClick={() => navigate('/account')}
          aria-label="Back to Account"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="header-content">
          <div className="header-icon">
            <BookOpen size={24} />
          </div>
          <div className="header-text">
            <h1>My Sportsbooks</h1>
            <p>Customize which sportsbooks to include in your odds comparisons</p>
          </div>
        </div>
      </div>

      {showBankrollModal && <BankrollModal />}

      <div className="bankroll-section">
        <div className="bankroll-card">
          <div className="bankroll-header">
            <div className="bankroll-icon">
              <DollarSign size={20} />
            </div>
            <div className="bankroll-info">
              <h3>Bankroll Management</h3>
              <p>Set your total bankroll for bet sizing and arbitrage calculations</p>
            </div>
          </div>
          <div className="bankroll-input-group">
            <label htmlFor="bankroll-input">Total Bankroll ($)</label>
            <div className="bankroll-input-with-button">
              <input
                id="bankroll-input"
                type="text"
                value={`$${bankroll.toLocaleString()}`}
                onClick={handleBankrollClick}
                readOnly
                placeholder="Enter your bankroll"
                className="bankroll-input"
              />
              <button 
                className="bankroll-save-button"
                onClick={() => {
                  try {
                    bankrollManager.setBankroll(bankroll);
                    alert('Bankroll saved successfully!');
                  } catch (error) {
                    console.error('Failed to save bankroll:', error);
                    alert('Error saving bankroll');
                  }
                }}
              >
                <Save size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="selection-summary">
        <div className="summary-card">
          <div className="summary-stats">
            <div className="stat-item">
              <div className="stat-number">{getSelectedCount()}</div>
              <div className="stat-label">Selected</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">{getTotalAvailable()}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>
          <div className="summary-actions">
            <button 
              className={`save-button ${saveStatus ? 'saved' : ''}`}
              onClick={handleSavePreferences}
              disabled={savingPrefs}
            >
              {savingPrefs ? (
                <>
                  <div className="spinner"></div>
                  Saving...
                </>
              ) : saveStatus ? (
                <>
                  <Check size={16} />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="sportsbooks-sections">
        <div className="section">
          <div className="section-header">
            <Star size={20} />
            <h3>Popular Sportsbooks</h3>
            <span className="section-count">({popularBooks.length})</span>
          </div>
          <div className="sportsbooks-grid">
            {popularBooks.map(book => (
              <div 
                key={book.key}
                className={`sportsbook-card ${selectedBooks.includes(book.key) ? 'selected' : ''}`}
                onClick={() => {
                  // For free users, only allow selection of free plan sportsbooks
                  if (me?.plan !== 'platinum' && !getFreePlanSportsbooks().some(b => b.key === book.key)) {
                    return; // Don't allow selection
                  }
                  
                  if (selectedBooks.includes(book.key)) {
                    setSelectedBooks(selectedBooks.filter(b => b !== book.key));
                  } else {
                    setSelectedBooks([...selectedBooks, book.key]);
                  }
                }}
              >
                <div className="sportsbook-info">
                  <div className="sportsbook-name">{book.name}</div>
                  <div className="popular-badge">Popular</div>
                </div>
                <div className="selection-indicator">
                  {selectedBooks.includes(book.key) && <Check size={16} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Only show Other Sportsbooks section for platinum users */}
        {me?.plan === 'platinum' && otherBooks.length > 0 && (
          <div className="section">
            <div className="section-header">
              <TrendingUp size={20} />
              <h3>Other Sportsbooks</h3>
              <span className="section-count">({otherBooks.length})</span>
            </div>
            <div className="sportsbooks-grid">
              {otherBooks.map(book => (
                <div 
                  key={book.key}
                  className={`sportsbook-card ${selectedBooks.includes(book.key) ? 'selected' : ''}`}
                  onClick={() => {
                    if (selectedBooks.includes(book.key)) {
                      setSelectedBooks(selectedBooks.filter(b => b !== book.key));
                    } else {
                      setSelectedBooks([...selectedBooks, book.key]);
                    }
                  }}
                >
                  <div className="sportsbook-info">
                    <div className="sportsbook-name">{book.name}</div>
                  </div>
                  <div className="selection-indicator">
                    {selectedBooks.includes(book.key) && <Check size={16} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="help-section">
        <div className="help-card">
          <Settings size={20} />
          <div className="help-content">
            <h4>How it works</h4>
            <p>Select the sportsbooks you want to include in odds comparisons and arbitrage calculations. Your preferences are saved locally and will persist across sessions.</p>
          </div>
        </div>
      </div>

      <MobileBottomBar showFilter={false} />
    </div>
  );
}
