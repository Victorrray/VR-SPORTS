import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Save, Check, Settings, Star, TrendingUp, DollarSign } from 'lucide-react';
import SportMultiSelect from '../components/SportMultiSelect';
import MobileBottomBar from '../components/MobileBottomBar';
import { AVAILABLE_SPORTSBOOKS } from '../constants/sportsbooks';
import './MySportsbooks.css';

export default function MySportsbooks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [bankroll, setBankroll] = useState(1000);
  const [showBankrollModal, setShowBankrollModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load user's selected sportsbooks from localStorage
    const saved = localStorage.getItem('userSelectedSportsbooks');
    if (saved) {
      setSelectedBooks(JSON.parse(saved));
    } else {
      // Default to popular sportsbooks
      setSelectedBooks(['draftkings', 'fanduel', 'betmgm', 'caesars']);
    }

    // Load user's bankroll from localStorage
    const savedBankroll = localStorage.getItem('userBankroll');
    if (savedBankroll) {
      setBankroll(Number(savedBankroll));
    }
  }, [user, navigate]);

  const handleSavePreferences = () => {
    setSavingPrefs(true);
    try {
      localStorage.setItem('userSelectedSportsbooks', JSON.stringify(selectedBooks));
      localStorage.setItem('userBankroll', bankroll.toString());
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
    setBankroll(newValue);
    setShowBankrollModal(false);
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

  const popularBooks = AVAILABLE_SPORTSBOOKS.filter(book => book.popular);
  const otherBooks = AVAILABLE_SPORTSBOOKS.filter(book => !book.popular);

  const getSelectedCount = () => selectedBooks.length;
  const getTotalAvailable = () => AVAILABLE_SPORTSBOOKS.length;

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
            <input
              id="bankroll-input"
              type="text"
              value={`$${bankroll.toLocaleString()}`}
              onClick={handleBankrollClick}
              readOnly
              placeholder="Enter your bankroll"
              className="bankroll-input"
            />
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

      <MobileBottomBar />
    </div>
  );
}
