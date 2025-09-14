import React, { useState } from 'react';
import { useAuth } from "../hooks/useAuth";
import { User, Check, X } from 'lucide-react';
import './UsernameSetup.css';

export default function UsernameSetup({ onComplete }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUsername: updateUsername } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await updateUsername(username.trim());
      if (result.error) {
        setError(result.error);
      } else {
        onComplete?.();
      }
    } catch (err) {
      setError('Failed to set username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="username-setup-overlay">
      <div className="username-setup-modal">
        <div className="username-setup-header">
          <div className="username-icon">
            <User size={24} />
          </div>
          <h2>Choose Your Username</h2>
          <p>This will be your display name on OddSightSeer. You can change it later in your profile.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="username-setup-form">
          <div className="username-input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className={`username-input ${error ? 'error' : ''}`}
              disabled={loading}
              autoFocus
            />
            {error && (
              <div className="username-error">
                <X size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
          
          <div className="username-requirements">
            <h4>Requirements:</h4>
            <ul>
              <li className={username.length >= 3 ? 'valid' : ''}>
                {username.length >= 3 ? <Check size={14} /> : <span>•</span>}
                At least 3 characters
              </li>
              <li className={username.length <= 20 ? 'valid' : ''}>
                {username.length <= 20 ? <Check size={14} /> : <span>•</span>}
                Less than 20 characters
              </li>
              <li className={/^[a-zA-Z0-9_-]*$/.test(username) ? 'valid' : ''}>
                {/^[a-zA-Z0-9_-]*$/.test(username) ? <Check size={14} /> : <span>•</span>}
                Letters, numbers, hyphens, and underscores only
              </li>
            </ul>
          </div>
          
          <button
            type="submit"
            className="username-submit-btn"
            disabled={loading || !username.trim() || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_-]+$/.test(username)}
          >
            {loading ? 'Setting Username...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
