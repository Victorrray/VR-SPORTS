import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, AlertCircle, LogOut, User, Settings, CreditCard, Trash2, BookOpen, X } from 'lucide-react';
import { optimizedStorage } from '../utils/storageOptimizer';
import UsernameForm from '../components/auth/UsernameForm';
import { usePlan } from '../hooks/usePlan';
import './Profile.css';

const AVAILABLE_SPORTSBOOKS = [
  // Popular US Sportsbooks
  { key: 'draftkings', name: 'DraftKings', popular: true },
  { key: 'fanduel', name: 'FanDuel', popular: true },
  { key: 'betmgm', name: 'BetMGM', popular: true },
  { key: 'caesars', name: 'Caesars', popular: true },
  { key: 'betrivers', name: 'BetRivers', popular: true },
  { key: 'espnbet', name: 'ESPN BET', popular: true },
  
  // Additional US Sportsbooks
  { key: 'betonlineag', name: 'BetOnline.ag', popular: false },
  { key: 'betus', name: 'BetUS', popular: false },
  { key: 'bovada', name: 'Bovada', popular: false },
  { key: 'fanatics', name: 'Fanatics Sportsbook', popular: false },
  { key: 'lowvig', name: 'LowVig.ag', popular: false },
  { key: 'mybookieag', name: 'MyBookie.ag', popular: false },
  { key: 'ballybet', name: 'Bally Bet', popular: false },
  { key: 'betanysports', name: 'BetAnySports', popular: false },
  { key: 'betparx', name: 'betPARX', popular: false },
  { key: 'fliff', name: 'Fliff', popular: false },
  { key: 'hardrockbet', name: 'Hard Rock Bet', popular: false },
  { key: 'windcreek', name: 'Wind Creek (Betfred PA)', popular: false },
  
  // US DFS Sites (Player Props)
  { key: 'draftkings_pick6', name: 'Pick 6', popular: false, type: 'dfs' },
  { key: 'prizepicks', name: 'PrizePicks', popular: false, type: 'dfs' },
  { key: 'underdog', name: 'Underdog Fantasy', popular: false, type: 'dfs' },
  
  // US Betting Exchanges
  { key: 'betopenly', name: 'BetOpenly', popular: false, type: 'exchange' },
  { key: 'novig', name: 'Novig', popular: false, type: 'exchange' },
  { key: 'prophetx', name: 'ProphetX', popular: false, type: 'exchange' },
  
  // Legacy sportsbooks (keeping for compatibility)
  { key: 'pointsbet', name: 'PointsBet', popular: false },
  { key: 'unibet', name: 'Unibet', popular: false },
  { key: 'williamhill_us', name: 'William Hill US', popular: false },
  { key: 'rebet', name: 'Rebet', popular: false, type: 'platinum' },
  { key: 'wynnbet', name: 'WynnBET', popular: false },
  { key: 'superbook', name: 'SuperBook', popular: false },
  { key: 'barstool', name: 'Barstool', popular: false },
  { key: 'twinspires', name: 'TwinSpires', popular: false },
  { key: 'foxbet', name: 'FOX Bet', popular: false }
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth() as any; // Temporary fix for auth context typing
  const { plan: planInfo, planLoading } = usePlan() as any;
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Load user's selected sportsbooks from optimized storage
    const saved = optimizedStorage.get('userSelectedSportsbooks');
    if (saved) {
      setSelectedBooks(saved);
    } else {
      // Default to popular sportsbooks
      setSelectedBooks(['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers', 'espnbet']);
    }
  }, []);

  const fallbackPlan = { plan: 'free', used: 0, quota: 250, remaining: 250 };
  const resolvedPlan = planInfo || fallbackPlan;
  const normalizedPlanId = (resolvedPlan.plan || null);
  const planDisplayName = (normalizedPlanId === 'gold' || normalizedPlanId === 'platinum')
    ? 'Gold Plan'
    : 'No Active Plan';
  const usageUsed = resolvedPlan.used ?? resolvedPlan.calls_made ?? 0;
  const usageLimit = resolvedPlan.quota ?? resolvedPlan.limit ?? null;
  const usageSummary = (normalizedPlanId === 'gold' || normalizedPlanId === 'platinum')
    ? 'Full access to live odds and game data'
    : 'Subscribe to Gold plan for $10/month';

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
    optimizedStorage.set('userSelectedSportsbooks', selectedBooks, { priority: 'high' });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const [signOutProgress, setSignOutProgress] = useState<any>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (busy) return;
    setBusy(true);
    setSignOutError(null);
    
    try {
      // Use the useAuth hook's signOut method for consistency
      await signOut();
      
      // Clear any additional local storage items
      optimizedStorage.remove('userSelectedSportsbooks');
      optimizedStorage.remove('pricingIntent');
      
      // Navigate to landing page
      navigate('/?signed_out=true', { replace: true });
      
    } catch (error) {
      console.error('Sign out error:', error);
      setSignOutError(error.message);
      setBusy(false);
      setSignOutProgress(null);
    }
  };

  const handleCancelSubscription = () => {
    navigate('/billing/cancel');
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
                    <div className="book-badges">
                      {book.popular && <span className="popular-badge">Popular</span>}
                      {book.type === 'dfs' && <span className="type-badge dfs">DFS</span>}
                      {book.type === 'exchange' && <span className="type-badge exchange">Exchange</span>}
                    </div>
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
              <button 
                className="security-btn danger" 
                onClick={handleSignOut}
                disabled={busy}
                data-testid="btn-signout"
              >
                {busy 
                  ? (signOutProgress 
                      ? `${signOutProgress.step}... (${signOutProgress.current}/${signOutProgress.total})`
                      : 'Signing out...'
                    )
                  : 'Sign Out'
                }
              </button>
              {signOutError && (
                <div className="error-message" style={{marginTop: '8px', color: 'var(--danger)', fontSize: '0.875rem'}}>
                  Error: {signOutError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="profile-section">
          <div className="section-header">
            <CreditCard size={20} />
            <h2>Subscription</h2>
          </div>
          <div className="subscription-card">
            <div className="subscription-status">
              <div className="status-info">
                <div className="plan-badge">
                  <span className={`plan-indicator ${normalizedPlanId}`}>
                    {normalizedPlanId === 'platinum' ? '💎' : '🆓'}
                  </span>
              <div className="plan-details">
                <span className="plan-name">
                  {planDisplayName}
                </span>
                <span className="plan-desc">
                  {planLoading && !planInfo ? 'Loading usage...' : usageSummary}
                </span>
              </div>
            </div>
          </div>
          
          {normalizedPlanId === 'platinum' && (
            <div className="subscription-actions">
              <button 
                className="security-btn cancel-btn"
                onClick={handleCancelSubscription}
              >
                <X size={16} />
                Cancel Subscription
              </button>
            </div>
          )}
          
          {normalizedPlanId !== 'platinum' && (
            <div className="subscription-actions">
              <button 
                className="security-btn upgrade-btn"
                    onClick={() => navigate('/pricing')}
                  >
                    <CreditCard size={16} />
                    Upgrade to Platinum
                  </button>
                </div>
              )}
            </div>
            
            <div className="subscription-info">
          <p className="subscription-note">
            {normalizedPlanId === 'platinum' 
              ? 'You have unlimited access to all features. Cancel anytime.' 
              : 'Upgrade to Platinum for unlimited API access and premium features.'
            }
          </p>
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
