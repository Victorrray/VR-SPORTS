// User Profile Management Component
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBettingData } from '../hooks/useBettingData';
import { User, Settings, TrendingUp, DollarSign, Target, Bell, Save, Edit3 } from 'lucide-react';
import './UserProfile.css';

const UserProfile = () => {
  const { user, profile, updateProfile, isSupabaseEnabled } = useAuth();
  const { getBettingStats, betHistory, bankrollTransactions } = useBettingData();
  
  const [isEditing, setIsEditing] = useState(false);
  const [bettingStats, setBettingStats] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    bankroll: 1000,
    default_bet_size: 10,
    risk_tolerance: 'medium',
    preferred_sports: [],
    preferred_regions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bankroll: profile.bankroll || 1000,
        default_bet_size: profile.default_bet_size || 10,
        risk_tolerance: profile.risk_tolerance || 'medium',
        preferred_sports: profile.preferred_sports || [],
        preferred_regions: profile.preferred_regions || []
      });
    }
  }, [profile]);

  // Load betting statistics
  useEffect(() => {
    const loadStats = async () => {
      if (user && isSupabaseEnabled) {
        const stats = await getBettingStats();
        setBettingStats(stats);
      }
    };
    loadStats();
  }, [user, getBettingStats, isSupabaseEnabled]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }));
  };

  const handleSave = async () => {
    if (!isSupabaseEnabled) {
      setError('Profile updates not available in demo mode');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (!user) {
    return (
      <div className="user-profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <User className="profile-icon" />
            <h2>Sign in to view your profile</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      {/* Profile Header */}
      <div className="profile-card profile-header-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" />
            ) : (
              <User className="profile-icon" />
            )}
          </div>
          <div className="profile-info">
            <h1>{profile?.display_name || profile?.username || 'User'}</h1>
            <p className="profile-email">{user.email}</p>
            <div className="profile-badges">
              <span className={`tier-badge ${profile?.plan || 'free'}`}>
                {(profile?.plan || 'free').toUpperCase()}
              </span>
            </div>
          </div>
          <button 
            className="edit-profile-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 size={16} />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Betting Statistics */}
      {bettingStats && (
        <div className="profile-card stats-card">
          <h3><TrendingUp size={20} /> Betting Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{bettingStats.total_bets || 0}</div>
              <div className="stat-label">Total Bets</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatPercentage(bettingStats.win_rate)}</div>
              <div className="stat-label">Win Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatCurrency(bettingStats.profit_loss)}</div>
              <div className="stat-label">Profit/Loss</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatPercentage(bettingStats.avg_edge)}</div>
              <div className="stat-label">Avg Edge</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatCurrency(bettingStats.total_stake)}</div>
              <div className="stat-label">Total Staked</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{bettingStats.favorite_sport || 'N/A'}</div>
              <div className="stat-label">Favorite Sport</div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      <div className="profile-card settings-card">
        <h3><Settings size={20} /> Profile Settings</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="settings-form">
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter your display name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><DollarSign size={16} /> Bankroll</label>
              <input
                type="number"
                name="bankroll"
                value={formData.bankroll}
                onChange={handleInputChange}
                disabled={!isEditing}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label><Target size={16} /> Default Bet Size</label>
              <input
                type="number"
                name="default_bet_size"
                value={formData.default_bet_size}
                onChange={handleInputChange}
                disabled={!isEditing}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Risk Tolerance</label>
            <select
              name="risk_tolerance"
              value={formData.risk_tolerance}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              <option value="conservative">Conservative</option>
              <option value="medium">Medium</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Sports</label>
            <div className="checkbox-group">
              {['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl', 'soccer_epl'].map(sport => (
                <label key={sport} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.preferred_sports.includes(sport)}
                    onChange={() => handleArrayChange('preferred_sports', sport)}
                    disabled={!isEditing}
                  />
                  {sport.replace('_', ' ').toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Preferred Regions</label>
            <div className="checkbox-group">
              {['us', 'uk', 'eu', 'au'].map(region => (
                <label key={region} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.preferred_regions.includes(region)}
                    onChange={() => handleArrayChange('preferred_regions', region)}
                    disabled={!isEditing}
                  />
                  {region.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="form-actions">
              <button 
                className="save-btn"
                onClick={handleSave}
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {betHistory.length > 0 && (
        <div className="profile-card activity-card">
          <h3>Recent Betting Activity</h3>
          <div className="activity-list">
            {betHistory.slice(0, 5).map(bet => (
              <div key={bet.id} className="activity-item">
                <div className="activity-info">
                  <div className="activity-title">
                    {bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1)} Bet
                  </div>
                  <div className="activity-details">
                    {bet.sport} • {formatCurrency(bet.stake)} • {bet.status}
                  </div>
                </div>
                <div className="activity-date">
                  {new Date(bet.placed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
