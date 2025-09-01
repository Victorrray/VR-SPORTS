import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
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

  useEffect(() => {
    // Load reactions from localStorage
    const savedReactions = JSON.parse(localStorage.getItem('oss_game_reactions') || '{}');
    if (savedReactions[gameKey]) {
      setReactions(savedReactions[gameKey].reactions || {});
      setUserReaction(savedReactions[gameKey].userReaction || null);
    }
  }, [gameKey]);

  const addReaction = (emoji) => {
    if (!user) return;

    const userId = user.id;
    const newReactions = { ...reactions };
    
    // Remove user's previous reaction if exists
    if (userReaction) {
      if (newReactions[userReaction]) {
        newReactions[userReaction] = newReactions[userReaction].filter(id => id !== userId);
        if (newReactions[userReaction].length === 0) {
          delete newReactions[userReaction];
        }
      }
    }

    // Add new reaction
    if (!newReactions[emoji]) {
      newReactions[emoji] = [];
    }
    if (!newReactions[emoji].includes(userId)) {
      newReactions[emoji].push(userId);
    }

    setReactions(newReactions);
    setUserReaction(emoji);
    setShowPicker(false);

    // Save to localStorage
    const allReactions = JSON.parse(localStorage.getItem('oss_game_reactions') || '{}');
    allReactions[gameKey] = {
      reactions: newReactions,
      userReaction: emoji,
      timestamp: Date.now()
    };
    localStorage.setItem('oss_game_reactions', JSON.stringify(allReactions));
  };

  const removeReaction = () => {
    if (!user || !userReaction) return;

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

    // Save to localStorage
    const allReactions = JSON.parse(localStorage.getItem('oss_game_reactions') || '{}');
    if (allReactions[gameKey]) {
      allReactions[gameKey].reactions = newReactions;
      allReactions[gameKey].userReaction = null;
      localStorage.setItem('oss_game_reactions', JSON.stringify(allReactions));
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
            onClick={() => users.includes(user?.id) ? removeReaction() : addReaction(emoji)}
            title={`${users.length} ${REACTION_EMOJIS.find(r => r.emoji === emoji)?.label || 'reactions'}`}
          >
            <span className="reaction-emoji">{emoji}</span>
            <span className="reaction-count">{users.length}</span>
          </button>
        ))}
        
        {/* Add Reaction Button */}
        {user && (
          <button
            className="add-reaction-btn"
            onClick={() => setShowPicker(!showPicker)}
            title="Add reaction"
          >
            <span className="plus-icon">+</span>
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
              onClick={() => addReaction(emoji)}
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
