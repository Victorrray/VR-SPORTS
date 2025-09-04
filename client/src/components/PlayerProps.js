// Player Props Betting Markets Component
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCachedFetch } from '../hooks/useCachedFetch';
import { User, TrendingUp, Target, Clock, Star, Filter, Search, Plus } from 'lucide-react';
import './PlayerProps.css';

const PlayerProps = ({ sport = 'americanfootball_nfl', gameId = null }) => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState(gameId);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedPropType, setSelectedPropType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('player');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteProps, setFavoriteProps] = useState(new Set());

  // Fetch games for the sport
  const { data: games, loading: gamesLoading } = useCachedFetch('/api/odds', {
    params: { sports: sport, markets: 'h2h' },
    transform: (data) => data || []
  });

  // Fetch player props for selected game
  const { data: playerProps, loading: propsLoading, refresh: refreshProps } = useCachedFetch('/api/player-props', {
    enabled: !!selectedGame,
    params: { 
      sport,
      game_id: selectedGame,
      markets: 'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds,player_points,player_rebounds,player_assists'
    },
    pollingInterval: 120000, // 2 minutes for live props - reduced API costs
    transform: (data) => data || []
  });

  // Mock player props data for demonstration
  const mockPlayerProps = useMemo(() => {
    if (!selectedGame || !games.length) return [];
    
    const game = games.find(g => g.id === selectedGame);
    if (!game) return [];

    const players = [
      // NFL Players
      { name: 'Josh Allen', team: game.home_team, position: 'QB' },
      { name: 'Stefon Diggs', team: game.home_team, position: 'WR' },
      { name: 'Lamar Jackson', team: game.away_team, position: 'QB' },
      { name: 'Mark Andrews', team: game.away_team, position: 'TE' },
      // NBA Players
      { name: 'LeBron James', team: game.home_team, position: 'SF' },
      { name: 'Anthony Davis', team: game.home_team, position: 'PF' },
      { name: 'Stephen Curry', team: game.away_team, position: 'PG' },
      { name: 'Klay Thompson', team: game.away_team, position: 'SG' }
    ];

    const propTypes = sport.includes('nfl') ? [
      { key: 'pass_yds', name: 'Passing Yards', unit: 'yards' },
      { key: 'pass_tds', name: 'Passing TDs', unit: 'touchdowns' },
      { key: 'rush_yds', name: 'Rushing Yards', unit: 'yards' },
      { key: 'receptions', name: 'Receptions', unit: 'catches' },
      { key: 'rec_yds', name: 'Receiving Yards', unit: 'yards' }
    ] : [
      { key: 'points', name: 'Points', unit: 'points' },
      { key: 'rebounds', name: 'Rebounds', unit: 'rebounds' },
      { key: 'assists', name: 'Assists', unit: 'assists' },
      { key: 'threes', name: '3-Pointers Made', unit: 'threes' }
    ];

    const props = [];
    players.forEach(player => {
      propTypes.forEach(propType => {
        // Skip irrelevant props based on position
        if (sport.includes('nfl')) {
          if (propType.key === 'pass_yds' && player.position !== 'QB') return;
          if (propType.key === 'pass_tds' && player.position !== 'QB') return;
          if (propType.key === 'receptions' && ['QB', 'RB'].includes(player.position)) return;
          if (propType.key === 'rec_yds' && ['QB', 'RB'].includes(player.position)) return;
        }

        const baseValue = {
          pass_yds: 275, pass_tds: 2.5, rush_yds: 85, receptions: 6.5, rec_yds: 75,
          points: 25.5, rebounds: 8.5, assists: 7.5, threes: 2.5
        }[propType.key] || 50;

        const variation = (Math.random() - 0.5) * 0.4 * baseValue;
        const line = Math.round((baseValue + variation) * 2) / 2;
        
        const overOdds = -110 + Math.floor(Math.random() * 40) - 20;
        const underOdds = -110 + Math.floor(Math.random() * 40) - 20;
        
        props.push({
          id: `${player.name}-${propType.key}-${selectedGame}`,
          player: player.name,
          team: player.team,
          position: player.position,
          propType: propType.key,
          propName: propType.name,
          unit: propType.unit,
          line: line,
          overOdds: overOdds,
          underOdds: underOdds,
          overPrice: oddsToPrice(overOdds),
          underPrice: oddsToPrice(underOdds),
          edge: (Math.random() * 8) - 2, // -2% to +6% edge
          volume: Math.floor(Math.random() * 1000) + 100,
          lastUpdate: new Date(),
          bookmakers: ['DraftKings', 'FanDuel', 'BetMGM'].slice(0, Math.floor(Math.random() * 3) + 1)
        });
      });
    });

    return props;
  }, [selectedGame, games, sport]);

  const oddsToPrice = (odds) => {
    if (odds > 0) return `+${odds}`;
    return odds.toString();
  };

  const calculateImpliedProbability = (odds) => {
    if (odds > 0) {
      return (100 / (odds + 100)) * 100;
    } else {
      return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100;
    }
  };

  // Filter and sort props
  const filteredProps = useMemo(() => {
    let filtered = playerProps.length > 0 ? playerProps : mockPlayerProps;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(prop => 
        prop.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.propName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by prop type
    if (selectedPropType !== 'all') {
      filtered = filtered.filter(prop => prop.propType === selectedPropType);
    }

    // Filter by player
    if (selectedPlayer) {
      filtered = filtered.filter(prop => prop.player === selectedPlayer);
    }

    // Filter favorites only
    if (showFavoritesOnly) {
      filtered = filtered.filter(prop => favoriteProps.has(prop.id));
    }

    // Sort props
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'player':
          return a.player.localeCompare(b.player);
        case 'edge':
          return b.edge - a.edge;
        case 'line':
          return b.line - a.line;
        case 'volume':
          return b.volume - a.volume;
        default:
          return 0;
      }
    });

    return filtered;
  }, [playerProps, mockPlayerProps, searchTerm, selectedPropType, selectedPlayer, showFavoritesOnly, favoriteProps, sortBy]);

  // Get unique players and prop types for filters
  const uniquePlayers = useMemo(() => {
    const props = playerProps.length > 0 ? playerProps : mockPlayerProps;
    return [...new Set(props.map(prop => prop.player))].sort();
  }, [playerProps, mockPlayerProps]);

  const uniquePropTypes = useMemo(() => {
    const props = playerProps.length > 0 ? playerProps : mockPlayerProps;
    return [...new Set(props.map(prop => ({ key: prop.propType, name: prop.propName })))];
  }, [playerProps, mockPlayerProps]);

  const toggleFavorite = (propId) => {
    setFavoriteProps(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propId)) {
        newFavorites.delete(propId);
      } else {
        newFavorites.add(propId);
      }
      return newFavorites;
    });
  };

  const addToBetSlip = (prop, side) => {
    const bet = {
      id: `${prop.id}-${side}`,
      type: 'player_prop',
      player: prop.player,
      team: prop.team,
      propType: prop.propName,
      line: prop.line,
      side: side,
      odds: side === 'over' ? prop.overOdds : prop.underOdds,
      price: side === 'over' ? prop.overPrice : prop.underPrice,
      edge: prop.edge,
      matchup: `${prop.player} ${prop.propName}`,
      sport: sport,
      gameId: selectedGame
    };

    // Dispatch to bet slip context or handle bet addition
    console.log('Adding to bet slip:', bet);
    
    // You would integrate this with your existing bet slip system
    // For now, we'll just show a success message
    alert(`Added ${prop.player} ${prop.propName} ${side} ${prop.line} to bet slip!`);
  };

  return (
    <div className="player-props-container">
      <div className="props-header">
        <h2>Player Props</h2>
        <div className="props-controls">
          <button 
            className="refresh-btn"
            onClick={refreshProps}
            disabled={propsLoading}
          >
            <Clock size={16} />
            {propsLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Game Selection */}
      <div className="game-selection">
        <label>Select Game:</label>
        <select 
          value={selectedGame || ''} 
          onChange={(e) => setSelectedGame(e.target.value)}
          disabled={gamesLoading}
        >
          <option value="">Choose a game...</option>
          {games.map(game => (
            <option key={game.id} value={game.id}>
              {game.away_team} @ {game.home_team} - {new Date(game.commence_time).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedGame && (
        <>
          {/* Filters */}
          <div className="props-filters">
            <div className="filter-group">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search players or props..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              value={selectedPlayer} 
              onChange={(e) => setSelectedPlayer(e.target.value)}
            >
              <option value="">All Players</option>
              {uniquePlayers.map(player => (
                <option key={player} value={player}>{player}</option>
              ))}
            </select>

            <select 
              value={selectedPropType} 
              onChange={(e) => setSelectedPropType(e.target.value)}
            >
              <option value="all">All Props</option>
              {uniquePropTypes.map(propType => (
                <option key={propType.key} value={propType.key}>{propType.name}</option>
              ))}
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="player">Sort by Player</option>
              <option value="edge">Sort by Edge</option>
              <option value="line">Sort by Line</option>
              <option value="volume">Sort by Volume</option>
            </select>

            <label className="favorites-toggle">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              />
              Favorites Only
            </label>
          </div>

          {/* Props Grid */}
          <div className="props-grid">
            {filteredProps.map(prop => (
              <div key={prop.id} className="prop-card">
                <div className="prop-header">
                  <div className="player-info">
                    <div className="player-name">{prop.player}</div>
                    <div className="player-details">
                      {prop.team} • {prop.position}
                    </div>
                  </div>
                  <button 
                    className={`favorite-btn ${favoriteProps.has(prop.id) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(prop.id)}
                  >
                    <Star size={16} />
                  </button>
                </div>

                <div className="prop-details">
                  <div className="prop-name">{prop.propName}</div>
                  <div className="prop-line">{prop.line} {prop.unit}</div>
                  {prop.edge > 0 && (
                    <div className="prop-edge positive">+{prop.edge.toFixed(1)}% Edge</div>
                  )}
                </div>

                <div className="prop-bets">
                  <button 
                    className="bet-button over"
                    onClick={() => addToBetSlip(prop, 'over')}
                  >
                    <div className="bet-side">Over {prop.line}</div>
                    <div className="bet-odds">{prop.overPrice}</div>
                    <div className="bet-probability">
                      {calculateImpliedProbability(prop.overOdds).toFixed(1)}%
                    </div>
                  </button>

                  <button 
                    className="bet-button under"
                    onClick={() => addToBetSlip(prop, 'under')}
                  >
                    <div className="bet-side">Under {prop.line}</div>
                    <div className="bet-odds">{prop.underPrice}</div>
                    <div className="bet-probability">
                      {calculateImpliedProbability(prop.underOdds).toFixed(1)}%
                    </div>
                  </button>
                </div>

                <div className="prop-meta">
                  <div className="prop-volume">Volume: {prop.volume}</div>
                  <div className="prop-books">
                    {prop.bookmakers.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProps.length === 0 && (
            <div className="no-props">
              <Target size={48} />
              <h3>No props found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          )}
        </>
      )}

      {!selectedGame && (
        <div className="no-game-selected">
          <User size={48} />
          <h3>Select a game to view player props</h3>
          <p>Choose from the available games above to see player prop betting markets</p>
        </div>
      )}
    </div>
  );
};

export default PlayerProps;
