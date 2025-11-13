import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import './MobileSearchModal.css';

export default function MobileSearchModal({ isOpen, onClose, onSearch, currentQuery = '' }) {
  const [searchTerm, setSearchTerm] = useState(currentQuery);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔍 MobileSearchModal: handleSubmit called with searchTerm:', searchTerm);
    console.log('🔍 MobileSearchModal: onSearch function:', onSearch);
    onSearch(searchTerm);
    console.log('🔍 MobileSearchModal: onSearch called, closing modal');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-search-overlay" onClick={onClose}>
      <div className="mobile-search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <h3>Search Odds</h3>
          <button className="search-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search teams, games, or markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
            />
            {searchTerm && (
              <button 
                type="button" 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="search-actions">
            <button type="submit" className="search-submit-btn">
              Search
            </button>
            {currentQuery && (
              <button type="button" className="clear-all-btn" onClick={handleClear}>
                Clear All
              </button>
            )}
          </div>
        </form>
        
        <div className="search-tips">
          <p>Search tips:</p>
          <ul>
            <li>Team names: "Lakers", "Patriots"</li>
            <li>Markets: "spread", "moneyline", "total"</li>
            <li>Combinations: "Lakers spread"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
