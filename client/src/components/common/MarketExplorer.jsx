import React, { useState } from 'react';
import { 
  useEventMarkets, 
  getUniqueMarkets, 
  getBookmakersForMarket,
  groupMarketsByCategory,
  formatMarketKey 
} from '../../hooks/useEventMarkets';
import { Search, TrendingUp, Users, BarChart3, RefreshCw } from 'lucide-react';
import './MarketExplorer.css';

/**
 * Market Explorer Component
 * Shows all available markets for a game without fetching full odds
 * Useful for market discovery and selection
 */
export default function MarketExplorer({ sport, eventId, gameName }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { markets, loading, error, refetch } = useEventMarkets(sport, eventId);
  
  if (!sport || !eventId) {
    return (
      <div className="market-explorer-empty">
        <BarChart3 size={48} />
        <p>Select a game to explore available markets</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="market-explorer-loading">
        <RefreshCw size={24} className="spinning" />
        <p>Loading available markets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-explorer-error">
        <p>Error loading markets: {error}</p>
        <button onClick={refetch} className="retry-btn">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  if (!markets) {
    return null;
  }

  const uniqueMarkets = getUniqueMarkets(markets);
  const groupedMarkets = groupMarketsByCategory(uniqueMarkets);
  
  // Filter markets by search query
  const filteredMarkets = uniqueMarkets.filter(key =>
    formatMarketKey(key).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by category
  const displayMarkets = selectedCategory === 'all' 
    ? filteredMarkets 
    : groupedMarkets[selectedCategory]?.filter(key =>
        formatMarketKey(key).toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

  return (
    <div className="market-explorer">
      <div className="market-explorer-header">
        <div className="header-title">
          <BarChart3 size={20} />
          <h3>Market Explorer</h3>
        </div>
        {gameName && <p className="game-name">{gameName}</p>}
        <div className="market-stats">
          <span>{uniqueMarkets.length} markets</span>
          <span>•</span>
          <span>{markets.bookmakers?.length || 0} bookmakers</span>
        </div>
      </div>

      <div className="market-explorer-controls">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filters">
          <button
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All ({uniqueMarkets.length})
          </button>
          <button
            className={selectedCategory === 'main' ? 'active' : ''}
            onClick={() => setSelectedCategory('main')}
          >
            <TrendingUp size={14} />
            Main ({groupedMarkets.main.length})
          </button>
          <button
            className={selectedCategory === 'player' ? 'active' : ''}
            onClick={() => setSelectedCategory('player')}
          >
            <Users size={14} />
            Player ({groupedMarkets.player.length})
          </button>
          <button
            className={selectedCategory === 'alternate' ? 'active' : ''}
            onClick={() => setSelectedCategory('alternate')}
          >
            Alt ({groupedMarkets.alternate.length})
          </button>
        </div>
      </div>

      <div className="markets-list">
        {displayMarkets.length === 0 ? (
          <div className="no-markets">
            <p>No markets found</p>
          </div>
        ) : (
          displayMarkets.map(marketKey => {
            const bookmakers = getBookmakersForMarket(markets, marketKey);
            return (
              <div key={marketKey} className="market-item">
                <div className="market-info">
                  <span className="market-name">{formatMarketKey(marketKey)}</span>
                  <span className="market-key">{marketKey}</span>
                </div>
                <div className="market-bookmakers">
                  <span className="bookmaker-count">
                    {bookmakers.length} book{bookmakers.length !== 1 ? 's' : ''}
                  </span>
                  <div className="bookmaker-list">
                    {bookmakers.slice(0, 3).map(bk => (
                      <span key={bk} className="bookmaker-tag">{bk}</span>
                    ))}
                    {bookmakers.length > 3 && (
                      <span className="bookmaker-more">+{bookmakers.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
