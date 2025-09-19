// Live Betting Component with Real-time Odds Updates
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeCachedFetch } from '../../hooks/useCachedFetch';
import { 
  Play, Pause, Clock, TrendingUp, TrendingDown, 
  Zap, AlertCircle, Target, Wifi, WifiOff 
} from 'lucide-react';
import './LiveBetting.css';

const LiveBetting = ({ sport = 'americanfootball_nfl' }) => {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [oddsHistory, setOddsHistory] = useState({});
  const [alertThreshold, setAlertThreshold] = useState(5); // 5% odds movement alert
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch live games with real-time polling
  const { 
    data: liveGames, 
    loading: gamesLoading, 
    error: gamesError,
    isPolling,
    startPolling,
    stopPolling
  } = useRealtimeCachedFetch((() => {
    const { withApiBase } = require('../../config/api');
    return withApiBase('/api/live-odds');
  })(), {
    params: { 
      sports: sport,
      markets: 'h2h,spreads,totals',
      live_only: true
    },
    pollingInterval: 30000, // 30 seconds for live betting - reduced API costs
    enablePolling: autoRefresh,
    pauseOnHidden: false, // Keep polling even when tab is hidden for live betting
    transform: (data) => {
      // Filter only live games
      const games = data || [];
      return games.filter(game => 
        game.status === 'in_progress' || 
        (game.completed === false && new Date(game.commence_time) <= new Date())
      );
    },
    onSuccess: (data) => {
      setLastUpdate(new Date());
      setConnectionStatus('connected');
      
      // Track odds movements
      if (data && data.length > 0) {
        trackOddsMovements(data);
      }
    },
    onError: (error) => {
      console.error('Live betting error:', error);
      setConnectionStatus('error');
    }
  });

  // Mock live game data for demonstration
  const mockLiveGames = useMemo(() => {
    if (liveGames && liveGames.length > 0) return liveGames;
    
    return [
      {
        id: 'live-game-1',
        sport_key: sport,
        sport_title: 'NFL',
        commence_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        home_team: 'Kansas City Chiefs',
        away_team: 'Buffalo Bills',
        status: 'in_progress',
        game_clock: '2:34',
        period: '3rd Quarter',
        home_score: 21,
        away_score: 17,
        bookmakers: [
          {
            key: 'draftkings',
            title: 'DraftKings',
            last_update: new Date().toISOString(),
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: 'Kansas City Chiefs', price: -140, last_price: -135 },
                  { name: 'Buffalo Bills', price: +120, last_price: +115 }
                ]
              },
              {
                key: 'spreads',
                outcomes: [
                  { name: 'Kansas City Chiefs', price: -110, point: -3.5, last_point: -3.0 },
                  { name: 'Buffalo Bills', price: -110, point: +3.5, last_point: +3.0 }
                ]
              },
              {
                key: 'totals',
                outcomes: [
                  { name: 'Over', price: -105, point: 47.5, last_point: 48.0 },
                  { name: 'Under', price: -115, point: 47.5, last_point: 48.0 }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'live-game-2',
        sport_key: sport,
        sport_title: 'NFL',
        commence_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        home_team: 'Green Bay Packers',
        away_team: 'Chicago Bears',
        status: 'in_progress',
        game_clock: '12:45',
        period: '4th Quarter',
        home_score: 28,
        away_score: 14,
        bookmakers: [
          {
            key: 'fanduel',
            title: 'FanDuel',
            last_update: new Date().toISOString(),
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: 'Green Bay Packers', price: -450, last_price: -380 },
                  { name: 'Chicago Bears', price: +350, last_price: +300 }
                ]
              },
              {
                key: 'spreads',
                outcomes: [
                  { name: 'Green Bay Packers', price: -110, point: -13.5, last_point: -12.0 },
                  { name: 'Chicago Bears', price: -110, point: +13.5, last_point: +12.0 }
                ]
              }
            ]
          }
        ]
      }
    ];
  }, [liveGames, sport]);

  const trackOddsMovements = (games) => {
    games.forEach(game => {
      const gameKey = game.id;
      const currentOdds = extractOddsData(game);
      
      if (oddsHistory[gameKey]) {
        const previousOdds = oddsHistory[gameKey];
        const movements = detectSignificantMovements(previousOdds, currentOdds);
        
        if (movements.length > 0) {
          movements.forEach(movement => {
            if (Math.abs(movement.change) >= alertThreshold) {
              showOddsAlert(game, movement);
            }
          });
        }
      }
      
      setOddsHistory(prev => ({
        ...prev,
        [gameKey]: currentOdds
      }));
    });
  };

  const extractOddsData = (game) => {
    const odds = {};
    game.bookmakers?.forEach(bookmaker => {
      bookmaker.markets?.forEach(market => {
        market.outcomes?.forEach(outcome => {
          const key = `${market.key}-${outcome.name}`;
          odds[key] = {
            price: outcome.price,
            point: outcome.point,
            timestamp: new Date()
          };
        });
      });
    });
    return odds;
  };

  const detectSignificantMovements = (previous, current) => {
    const movements = [];
    
    Object.keys(current).forEach(key => {
      if (previous[key]) {
        const priceDiff = current[key].price - previous[key].price;
        const pointDiff = (current[key].point || 0) - (previous[key].point || 0);
        
        if (Math.abs(priceDiff) >= 10 || Math.abs(pointDiff) >= 0.5) {
          movements.push({
            key,
            priceChange: priceDiff,
            pointChange: pointDiff,
            change: Math.abs(priceDiff) > Math.abs(pointDiff * 10) ? priceDiff : pointDiff
          });
        }
      }
    });
    
    return movements;
  };

  const showOddsAlert = (game, movement) => {
    // This would integrate with your alert system
    console.log(`Significant odds movement in ${game.home_team} vs ${game.away_team}:`, movement);
  };

  const formatOdds = (price) => {
    return price > 0 ? `+${price}` : price.toString();
  };

  const getOddsMovement = (current, previous) => {
    if (!previous) return null;
    const diff = current - previous;
    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
      amount: Math.abs(diff)
    };
  };

  const addToLiveBetSlip = (game, market, outcome) => {
    const bet = {
      id: `live-${game.id}-${market.key}-${outcome.name}`,
      type: 'live',
      game: `${game.away_team} @ ${game.home_team}`,
      market: market.key,
      selection: outcome.name,
      odds: outcome.price,
      point: outcome.point,
      price: formatOdds(outcome.price),
      sport: game.sport_key,
      gameId: game.id,
      isLive: true,
      gameStatus: {
        period: game.period,
        clock: game.game_clock,
        homeScore: game.home_score,
        awayScore: game.away_score
      }
    };

    console.log('Adding live bet to slip:', bet);
    alert(`Added live bet: ${outcome.name} ${formatOdds(outcome.price)} to bet slip!`);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      startPolling();
    } else {
      stopPolling();
    }
  };

  return (
    <div className="live-betting-container">
      <div className="live-betting-header">
        <div className="header-left">
          <h2>Live Betting</h2>
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? <Wifi size={16} /> : <WifiOff size={16} />}
            {connectionStatus === 'connected' ? 'Live' : 'Disconnected'}
          </div>
        </div>
        
        <div className="header-controls">
          <div className="refresh-control">
            <button 
              className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
              onClick={toggleAutoRefresh}
            >
              {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
              {autoRefresh ? 'Pause' : 'Resume'} Auto-Refresh
            </button>
          </div>
          
          {lastUpdate && (
            <div className="last-update">
              <Clock size={14} />
              Updated {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Alert Settings */}
      <div className="alert-settings">
        <label>
          <AlertCircle size={16} />
          Alert on odds movement ≥
          <input
            type="number"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Number(e.target.value))}
            min="1"
            max="50"
            step="1"
          />
          %
        </label>
      </div>

      {/* Live Games */}
      {mockLiveGames.length > 0 ? (
        <div className="live-games-grid">
          {mockLiveGames.map(game => (
            <div key={game.id} className="live-game-card">
              <div className="game-header">
                <div className="game-info">
                  <div className="teams">
                    <div className="team away">
                      {game.away_team}
                      <span className="score">{game.away_score}</span>
                    </div>
                    <div className="vs">@</div>
                    <div className="team home">
                      {game.home_team}
                      <span className="score">{game.home_score}</span>
                    </div>
                  </div>
                  <div className="game-status">
                    <div className="period">{game.period}</div>
                    <div className="clock">{game.game_clock}</div>
                  </div>
                </div>
                <div className="live-indicator">
                  <Zap size={16} />
                  LIVE
                </div>
              </div>

              {/* Markets */}
              <div className="markets-container">
                {game.bookmakers?.[0]?.markets?.map(market => (
                  <div key={market.key} className="market-section">
                    <h4 className="market-title">
                      {market.key === 'h2h' ? 'Moneyline' : 
                       market.key === 'spreads' ? 'Point Spread' : 
                       market.key === 'totals' ? 'Total Points' : market.key}
                    </h4>
                    
                    <div className="outcomes-grid">
                      {market.outcomes?.map(outcome => {
                        const movement = getOddsMovement(outcome.price, outcome.last_price);
                        const pointMovement = getOddsMovement(outcome.point, outcome.last_point);
                        
                        return (
                          <button
                            key={outcome.name}
                            className="outcome-btn"
                            onClick={() => addToLiveBetSlip(game, market, outcome)}
                          >
                            <div className="outcome-header">
                              <span className="outcome-name">{outcome.name}</span>
                              {movement && movement.direction !== 'same' && (
                                <div className={`movement-indicator ${movement.direction}`}>
                                  {movement.direction === 'up' ? 
                                    <TrendingUp size={12} /> : 
                                    <TrendingDown size={12} />
                                  }
                                </div>
                              )}
                            </div>
                            
                            <div className="outcome-details">
                              {outcome.point && (
                                <div className="point-spread">
                                  {outcome.point > 0 ? '+' : ''}{outcome.point}
                                  {pointMovement && pointMovement.direction !== 'same' && (
                                    <span className={`point-change ${pointMovement.direction}`}>
                                      ({pointMovement.direction === 'up' ? '+' : '-'}{pointMovement.amount})
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <div className="odds-price">
                                {formatOdds(outcome.price)}
                                {movement && movement.direction !== 'same' && (
                                  <span className={`price-change ${movement.direction}`}>
                                    ({movement.direction === 'up' ? '+' : '-'}{movement.amount})
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-live-games">
          <Target size={48} />
          <h3>No Live Games</h3>
          <p>There are currently no live games available for betting.</p>
          <p>Live betting will be available when games are in progress.</p>
        </div>
      )}

      {gamesError && (
        <div className="error-message">
          <AlertCircle size={16} />
          Error loading live games: {gamesError.message}
        </div>
      )}
    </div>
  );
};

export default LiveBetting;
