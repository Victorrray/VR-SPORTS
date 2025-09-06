import React, { useState, useEffect } from 'react';
import { User, Settings, BookOpen, Save, Check } from 'lucide-react';
import UsernameForm from '../components/UsernameForm';
import './Profile.css';

const AVAILABLE_SPORTSBOOKS = [
  { key: 'draftkings', name: 'DraftKings', popular: true },
  { key: 'fanduel', name: 'FanDuel', popular: true },
  { key: 'betmgm', name: 'BetMGM', popular: true },
  { key: 'caesars', name: 'Caesars', popular: true },
  { key: 'pointsbet', name: 'PointsBet', popular: true },
  { key: 'bet365', name: 'Bet365', popular: true },
  { key: 'unibet', name: 'Unibet', popular: false },
  { key: 'williamhill_us', name: 'William Hill', popular: false },
  { key: 'betrivers', name: 'BetRivers', popular: false },
  { key: 'wynnbet', name: 'WynnBET', popular: false },
  { key: 'superbook', name: 'SuperBook', popular: false },
  { key: 'barstool', name: 'Barstool', popular: false },
  { key: 'twinspires', name: 'TwinSpires', popular: false },
  { key: 'foxbet', name: 'FOX Bet', popular: false }
];

export default function ProfilePage() {
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Load user's selected sportsbooks from localStorage
    const saved = localStorage.getItem('userSelectedSportsbooks');
    if (saved) {
      setSelectedBooks(JSON.parse(saved));
    } else {
      // Default to popular sportsbooks
      setSelectedBooks(['draftkings', 'fanduel', 'betmgm', 'caesars']);
    }
  }, []);

  const handleBookToggle = (bookKey) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookKey)) {
        return prev.filter(key => key !== bookKey);
      } else {
        return [...prev, bookKey];
      }
    });
  };

  const handleSave = () => {
    localStorage.setItem('userSelectedSportsbooks', JSON.stringify(selectedBooks));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const displayedBooks = showAllBooks 
    ? AVAILABLE_SPORTSBOOKS 
    : AVAILABLE_SPORTSBOOKS.filter(book => book.popular);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-title">
          <User size={24} />
          <h1>Profile Settings</h1>
        </div>
        <p>Customize your VR-Odds experience</p>
      </div>

      <div className="profile-sections">
        {/* Username Section */}
        <div className="profile-section">
          <div className="section-header">
            <Settings size={20} />
            <h2>Account Information</h2>
          </div>
          <UsernameForm />
        </div>

        {/* Sportsbook Selection */}
        <div className="profile-section">
          <div className="section-header">
            <BookOpen size={20} />
            <h2>My Sportsbooks</h2>
          </div>
          <p className="section-description">Select the sportsbooks you use to see personalized odds and recommendations</p>

          <div className="sportsbook-selection">
            <div className="selection-info">
              <span className="selected-count">
                {selectedBooks.length} sportsbook{selectedBooks.length !== 1 ? 's' : ''} selected
              </span>
              <button 
                className="toggle-all-btn"
                onClick={() => setShowAllBooks(!showAllBooks)}
              >
                {showAllBooks ? 'Show Popular Only' : 'Show All Sportsbooks'}
              </button>
            </div>

            <div className="sportsbooks-grid">
              {displayedBooks.map(book => (
                <div 
                  key={book.key}
                  className={`sportsbook-card ${selectedBooks.includes(book.key) ? 'selected' : ''}`}
                  onClick={() => handleBookToggle(book.key)}
                >
                  <div className="book-info">
                    <span className="book-name">{book.name}</span>
                    {book.popular && <span className="popular-badge">Popular</span>}
                  </div>
                  <div className="selection-indicator">
                    {selectedBooks.includes(book.key) && <Check size={16} />}
                  </div>
                </div>
              ))}
            </div>

            <div className="save-section">
              <button 
                className={`save-btn ${saveStatus === 'saved' ? 'saved' : ''}`}
                onClick={handleSave}
                disabled={saveStatus === 'saved'}
              >
                {saveStatus === 'saved' ? (
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
              <p className="save-note">
                Your dashboard will only show odds from your selected sportsbooks
              </p>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="profile-section">
          <div className="section-header">
            <Settings size={20} />
            <h2>Security & Access</h2>
          </div>
          <div className="security-options">
            <div className="security-item">
              <div className="security-info">
                <span className="security-title">Reset Password</span>
                <span className="security-desc">Send reset link to your email</span>
              </div>
              <button className="security-btn">Reset</button>
            </div>
            <div className="security-item">
              <div className="security-info">
                <span className="security-title">Sign Out</span>
                <span className="security-desc">End your current session</span>
              </div>
              <button className="security-btn danger">Sign Out</button>
            </div>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="profile-section">
          <div className="section-header">
            <Settings size={20} />
            <h2>Accessibility Settings</h2>
          </div>
          
          <div className="accessibility-group">
            <h3 className="accessibility-subtitle">Visual</h3>
            <div className="accessibility-item">
              <div className="accessibility-info">
                <span className="accessibility-title">High Contrast</span>
                <span className="accessibility-desc">Increases color contrast for better visibility</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="accessibility-group">
            <h3 className="accessibility-subtitle">Text Size</h3>
            <div className="text-size-options">
              <label className="radio-option">
                <input type="radio" name="textSize" value="normal" defaultChecked />
                <span className="radio-label">Normal</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="textSize" value="large" />
                <span className="radio-label">Large</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="textSize" value="extra-large" />
                <span className="radio-label">Extra Large</span>
              </label>
            </div>
          </div>

          <div className="accessibility-group">
            <h3 className="accessibility-subtitle">Motion</h3>
            <div className="accessibility-item">
              <div className="accessibility-info">
                <span className="accessibility-title">Reduce Motion</span>
                <span className="accessibility-desc">Minimizes animations and transitions</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
