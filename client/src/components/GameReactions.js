import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { secureFetch } from '../utils/security';
import './GameReactions.css';

const REACTION_EMOJIS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💰', label: 'Money' },
  { emoji: '😤', label: 'Confident' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😬', label: 'Nervous' },
  { emoji: '⚡', label: 'Electric' }
];

export default function GameReactions({ gameId, gameKey }) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:10000');

  // Load reactions from server
  const loadReactions = async () => {
    try {
      const response = await secureFetch(`${apiUrl}/api/reactions/${encodeURIComponent(gameKey)}`);
      if (response.ok) {
        const data = await response.json();
        const serverReactions = data.reactions || {};
        
        // Convert server format to client format and find user's reaction
        const clientReactions = {};
        let foundUserReaction = null;
        
        Object.entries(serverReactions).forEach(([emoji, users]) => {
          clientReactions[emoji] = users.map(u => u.userId);
          if (user && users.some(u => u.userId === user.id)) {
            foundUserReaction = emoji;
          }
        });
        
        setReactions(clientReactions);
        setUserReaction(foundUserReaction);
      }
    } catch (error) {
      console.error('Failed to load reactions:', error);
      // Fallback to localStorage for offline support
      const savedReactions = JSON.parse(localStorage.getItem('oss_game_reactions') || '{}');
      if (savedReactions[gameKey]) {
        setReactions(savedReactions[gameKey].reactions || {});
        setUserReaction(savedReactions[gameKey].userReaction || null);
      }
    }
  };

  useEffect(() => {
    loadReactions();
    
    // Poll for updates every 10 seconds to see other users' reactions
    const interval = setInterval(loadReactions, 10000);
    return () => clearInterval(interval);
  }, [gameKey, user]);

  const addReaction = async (emoji) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const response = await secureFetch(`${apiUrl}/api/reactions/${encodeURIComponent(gameKey)}`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous',
          emoji: emoji,
          action: 'add'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const serverReactions = data.reactions || {};
        
        // Convert server format to client format
        const clientReactions = {};
        Object.entries(serverReactions).forEach(([emoji, users]) => {
          clientReactions[emoji] = users.map(u => u.userId);
        });
        
        setReactions(clientReactions);
        setUserReaction(emoji);
        setShowPicker(false);

        // Also save to localStorage as backup
        const allReactions = JSON.parse(localStorage.getItem('oss_game_reactions') || '{}');
        allReactions[gameKey] = {
          reactions: clientReactions,
          userReaction: emoji,
          timestamp: Date.now()
        };
        localStorage.setItem('oss_game_reactions', JSON.stringify(allReactions));
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
      // Fallback to local-only reaction
      const userId = user.id;
      const newReactions = { ...reactions };
      
      if (userReaction && newReactions[userReaction]) {
        newReactions[userReaction] = newReactions[userReaction].filter(id => id !== userId);
        if (newReactions[userReaction].length === 0) {
          delete newReactions[userReaction];
        }
      }

      if (!newReactions[emoji]) {
        newReactions[emoji] = [];
      }
      if (!newReactions[emoji].includes(userId)) {
        newReactions[emoji].push(userId);
      }

      setReactions(newReactions);
      setUserReaction(emoji);
      setShowPicker(false);
    } finally {
      setLoading(false);
    }
  };

  const removeReaction = async () => {
    if (!user || !userReaction || loading) return;

    setLoading(true);
    try {
      const response = await secureFetch(`${apiUrl}/api/reactions/${encodeURIComponent(gameKey)}`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'Anonymous',
          emoji: userReaction,
          action: 'remove'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const serverReactions = data.reactions || {};
        
        // Convert server format to client format
        const clientReactions = {};
        Object.entries(serverReactions).forEach(([emoji, users]) => {
          clientReactions[emoji] = users.map(u => u.userId);
        });
        
        setReactions(clientReactions);
        setUserReaction(null);

        // Also update localStorage
        const allReactions = JSON.parse(localStorage.getItem('oss_game_reactions') || '{}');
        if (allReactions[gameKey]) {
          allReactions[gameKey].reactions = clientReactions;
          allReactions[gameKey].userReaction = null;
          localStorage.setItem('oss_game_reactions', JSON.stringify(allReactions));
        }
      }
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      // Fallback to local removal
      const userId = user.id;
      const newReactions = { ...reactions };
      
      if (newReactions[userReaction]) {
        newReactions[userReaction] = newReactions[userReaction].filter(id => id !== userId);
        if (newReactions[userReaction].length === 0) {
          delete newReactions[userReaction];
        }
      }

      setReactions(newReactions);
      setUserReaction(null);
    } finally {
      setLoading(false);
    }
  };

  const getTotalReactions = () => {
    return Object.values(reactions).reduce((sum, users) => sum + users.length, 0);
  };

  return (
    <div className="game-reactions">
      {/* Reaction Display */}
      <div className="reactions-display">
        {Object.entries(reactions).map(([emoji, users]) => (
          <button
            key={emoji}
            className={`reaction-bubble ${users.includes(user?.id) ? 'user-reacted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              users.includes(user?.id) ? removeReaction() : addReaction(emoji);
            }}
            title={`${users.length} ${REACTION_EMOJIS.find(r => r.emoji === emoji)?.label || 'reactions'}`}
          >
            <span className="reaction-emoji">{emoji}</span>
            <span className="reaction-count">{users.length}</span>
          </button>
        ))}
        
        {/* Add Reaction Button */}
        {user && (
          <button
            className={`add-reaction-btn ${loading ? 'loading' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowPicker(!showPicker);
            }}
            disabled={loading}
            title="Add reaction"
          >
            <span className="plus-icon">{loading ? '⏳' : '+'}</span>
          </button>
        )}
      </div>

      {/* Reaction Picker */}
      {showPicker && user && (
        <div className="reaction-picker">
          {REACTION_EMOJIS.map(({ emoji, label }) => (
            <button
              key={emoji}
              className="reaction-option"
              onClick={(e) => {
                e.stopPropagation();
                addReaction(emoji);
              }}
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
