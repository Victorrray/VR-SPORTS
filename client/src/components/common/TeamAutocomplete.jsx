import React, { useState, useRef, useEffect } from 'react';
import { useParticipants, searchParticipants } from '../../hooks/useParticipants';
import './TeamAutocomplete.css';

/**
 * Team/Player Autocomplete Component
 * Uses The Odds API participants endpoint for standardized names
 * 
 * @param {Object} props
 * @param {string} props.sport - Sport key (e.g., 'americanfootball_nfl')
 * @param {string} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 */
export default function TeamAutocomplete({ 
  sport, 
  value = '', 
  onChange, 
  placeholder = 'Search teams...' 
}) {
  const [query, setQuery] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const { participants, loading, error } = useParticipants(sport);
  const filteredParticipants = searchParticipants(participants, query);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleSelect = (participant) => {
    setQuery(participant.full_name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    if (onChange) {
      onChange(participant.full_name, participant);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredParticipants.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredParticipants.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(filteredParticipants[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="team-autocomplete">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        placeholder={loading ? 'Loading teams...' : placeholder}
        disabled={loading}
        className="team-autocomplete-input"
      />

      {showDropdown && filteredParticipants.length > 0 && (
        <div ref={dropdownRef} className="team-autocomplete-dropdown">
          {filteredParticipants.slice(0, 10).map((participant, index) => (
            <div
              key={participant.id}
              className={`team-autocomplete-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelect(participant)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {participant.full_name}
            </div>
          ))}
          {filteredParticipants.length > 10 && (
            <div className="team-autocomplete-more">
              +{filteredParticipants.length - 10} more...
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="team-autocomplete-error">
          Failed to load teams
        </div>
      )}

      {!loading && participants.length > 0 && (
        <div className="team-autocomplete-hint">
          {participants.length} teams available
        </div>
      )}
    </div>
  );
}
