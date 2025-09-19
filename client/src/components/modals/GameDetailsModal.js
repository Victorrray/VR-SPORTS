import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, MapPin, Users, TrendingUp, Calendar, Trophy, Info, RefreshCw } from 'lucide-react';
import useOddsHistory from '../../hooks/useOddsHistory';
import './GameDetailsModal.css';

export default function GameDetailsModal({ game, isOpen, onClose }) {
  const [gameDetails, setGameDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [selectedBook, setSelectedBook] = useState('all');

  const sportKey = game?.sport_key || game?.sportKey || null;
  const eventId = game?.id || game?.event_id || game?.eventId || null;
  const bookmakerKeys = useMemo(() => {
    if (!Array.isArray(game?.bookmakers)) return [];
    return game.bookmakers
      .map((book) => book?.key || book?.bookmaker_key)
      .filter(Boolean);
  }, [game]);

  const {
    history: oddsHistory,
    loading: historyLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useOddsHistory({
    sportKey,
    eventId,
    markets: ['h2h', 'spreads', 'totals'],
    bookmakers: bookmakerKeys,
    enabled: isOpen && activeTab === 'line' && !!sportKey && !!eventId,
  });

  const marketOptions = useMemo(() => {
    const unique = new Set(oddsHistory.map((row) => row.marketKey).filter(Boolean));
    return Array.from(unique);
  }, [oddsHistory]);

  const bookmakerOptions = useMemo(() => {
    const unique = new Set(oddsHistory.map((row) => row.bookmakerKey).filter(Boolean));
    return Array.from(unique);
  }, [oddsHistory]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setSelectedBook('all');
    }
  }, [isOpen]);

  useEffect(() => {
    if (marketOptions.length > 0 && (!selectedMarket || !marketOptions.includes(selectedMarket))) {
      setSelectedMarket(marketOptions[0]);
    }
  }, [marketOptions, selectedMarket]);

  useEffect(() => {
    if (selectedBook !== 'all' && !bookmakerOptions.includes(selectedBook)) {
      setSelectedBook('all');
    }
  }, [bookmakerOptions, selectedBook]);

  const filteredHistory = useMemo(() => {
    return oddsHistory.filter((row) => {
      const matchMarket = !selectedMarket || row.marketKey === selectedMarket;
      const matchBook = selectedBook === 'all' || row.bookmakerKey === selectedBook;
      return matchMarket && matchBook;
    });
  }, [oddsHistory, selectedMarket, selectedBook]);

  const sortedHistory = useMemo(() => {
    return [...filteredHistory].sort((a, b) => {
      const aTime = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
      const bTime = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
      return bTime - aTime;
    });
  }, [filteredHistory]);

  const formatTimestamp = (value) => {
    if (!value) return '—';
    const time = new Date(value);
    if (Number.isNaN(time.getTime())) return value;
    return time.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  useEffect(() => {
    if (isOpen && game) {
      fetchGameDetails();
    }
  }, [isOpen, game]);

  const fetchGameDetails = async () => {
    setLoading(true);
    try {
      // Generate realistic venue based on sport and home team
      const getVenueInfo = () => {
        const sport = game.sport_key || '';
        const homeTeam = game.home_team || 'Home Team';
        
        // NFL venues
        if (sport.includes('nfl')) {
          const nflVenues = {
            'Kansas City Chiefs': { name: 'Arrowhead Stadium', city: 'Kansas City', state: 'MO', capacity: '76,416' },
            'Buffalo Bills': { name: 'Highmark Stadium', city: 'Orchard Park', state: 'NY', capacity: '71,608' },
            'Green Bay Packers': { name: 'Lambeau Field', city: 'Green Bay', state: 'WI', capacity: '81,441' },
            'Dallas Cowboys': { name: 'AT&T Stadium', city: 'Arlington', state: 'TX', capacity: '80,000' },
            'New England Patriots': { name: 'Gillette Stadium', city: 'Foxborough', state: 'MA', capacity: '65,878' },
            'Philadelphia Eagles': { name: 'Lincoln Financial Field', city: 'Philadelphia', state: 'PA', capacity: '69,176' },
            'Pittsburgh Steelers': { name: 'Heinz Field', city: 'Pittsburgh', state: 'PA', capacity: '68,400' },
            'Baltimore Ravens': { name: 'M&T Bank Stadium', city: 'Baltimore', state: 'MD', capacity: '71,008' },
            'Cincinnati Bengals': { name: 'Paycor Stadium', city: 'Cincinnati', state: 'OH', capacity: '65,515' },
            'Cleveland Browns': { name: 'FirstEnergy Stadium', city: 'Cleveland', state: 'OH', capacity: '67,431' },
            'Miami Dolphins': { name: 'Hard Rock Stadium', city: 'Miami Gardens', state: 'FL', capacity: '65,326' },
            'New York Jets': { name: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ', capacity: '82,500' },
            'New York Giants': { name: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ', capacity: '82,500' },
            'Washington Commanders': { name: 'FedExField', city: 'Landover', state: 'MD', capacity: '82,000' },
            'Chicago Bears': { name: 'Soldier Field', city: 'Chicago', state: 'IL', capacity: '61,500' },
            'Detroit Lions': { name: 'Ford Field', city: 'Detroit', state: 'MI', capacity: '65,000' },
            'Minnesota Vikings': { name: 'U.S. Bank Stadium', city: 'Minneapolis', state: 'MN', capacity: '66,860' },
            'Atlanta Falcons': { name: 'Mercedes-Benz Stadium', city: 'Atlanta', state: 'GA', capacity: '71,000' },
            'Carolina Panthers': { name: 'Bank of America Stadium', city: 'Charlotte', state: 'NC', capacity: '75,523' },
            'New Orleans Saints': { name: 'Caesars Superdome', city: 'New Orleans', state: 'LA', capacity: '73,208' },
            'Tampa Bay Buccaneers': { name: 'Raymond James Stadium', city: 'Tampa', state: 'FL', capacity: '65,890' },
            'Arizona Cardinals': { name: 'State Farm Stadium', city: 'Glendale', state: 'AZ', capacity: '63,400' },
            'Los Angeles Rams': { name: 'SoFi Stadium', city: 'Los Angeles', state: 'CA', capacity: '70,240' },
            'Los Angeles Chargers': { name: 'SoFi Stadium', city: 'Los Angeles', state: 'CA', capacity: '70,240' },
            'San Francisco 49ers': { name: 'Levi\'s Stadium', city: 'Santa Clara', state: 'CA', capacity: '68,500' },
            'Seattle Seahawks': { name: 'Lumen Field', city: 'Seattle', state: 'WA', capacity: '69,000' },
            'Denver Broncos': { name: 'Empower Field at Mile High', city: 'Denver', state: 'CO', capacity: '76,125' },
            'Las Vegas Raiders': { name: 'Allegiant Stadium', city: 'Las Vegas', state: 'NV', capacity: '65,000' },
            'Houston Texans': { name: 'NRG Stadium', city: 'Houston', state: 'TX', capacity: '72,220' },
            'Indianapolis Colts': { name: 'Lucas Oil Stadium', city: 'Indianapolis', state: 'IN', capacity: '63,000' },
            'Jacksonville Jaguars': { name: 'TIAA Bank Field', city: 'Jacksonville', state: 'FL', capacity: '67,838' },
            'Tennessee Titans': { name: 'Nissan Stadium', city: 'Nashville', state: 'TN', capacity: '69,143' }
          };
          return nflVenues[homeTeam] || { name: homeTeam + ' Stadium', city: 'Home City', state: 'ST', capacity: '70,000' };
        }
        
        // College Football venues
        if (sport.includes('ncaaf') || sport.includes('cfb')) {
          const cfbVenues = {
            'Kansas State Wildcats': { name: 'Bill Snyder Family Stadium', city: 'Manhattan', state: 'KS', capacity: '50,000' },
            'Iowa State Cyclones': { name: 'Jack Trice Stadium', city: 'Ames', state: 'IA', capacity: '61,500' },
            'Alabama Crimson Tide': { name: 'Bryant-Denny Stadium', city: 'Tuscaloosa', state: 'AL', capacity: '101,821' },
            'Ohio State Buckeyes': { name: 'Ohio Stadium', city: 'Columbus', state: 'OH', capacity: '104,944' }
          };
          return cfbVenues[homeTeam] || { name: 'College Stadium', city: 'College Town', state: 'ST', capacity: '50,000' };
        }
        
        // NBA venues
        if (sport.includes('nba')) {
          const nbaVenues = {
            'Los Angeles Lakers': { name: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA', capacity: '20,000' },
            'Boston Celtics': { name: 'TD Garden', city: 'Boston', state: 'MA', capacity: '19,156' },
            'Golden State Warriors': { name: 'Chase Center', city: 'San Francisco', state: 'CA', capacity: '18,064' }
          };
          return nbaVenues[homeTeam] || { name: 'Basketball Arena', city: 'City', state: 'ST', capacity: '18,000' };
        }
        
        // Default venue
        return { name: 'Sports Venue', city: 'City', state: 'ST', capacity: '50,000' };
      };

      const venue = getVenueInfo();

      // Use only real ESPN API data - no mock data
      const gameDetails = {
        venue,
        // Only show weather if available from API (currently not provided by ESPN)
        weather: null,
        // Only show attendance if available from API
        attendance: null,
        // Only show officials if available from API
        officials: null,
        teamStats: {
          [game.away_team || "Away Team"]: {
            record: game.away_record || null,
            streak: null, // Not available from ESPN API
            score: game.scores?.away || null,
            injuries: null // Not available from ESPN API
          },
          [game.home_team || "Home Team"]: {
            record: game.home_record || null,
            streak: null, // Not available from ESPN API
            score: game.scores?.home || null,
            injuries: null // Not available from ESPN API
          }
        },
        // Remove mock head-to-head data
        headToHead: null,
        // Remove mock key players
        keyPlayers: null,
        // Use real betting data from odds API if available
        predictions: {
          spread: game.odds?.spread || null,
          total: game.odds?.overUnder || null,
          moneyline: null // Will be populated from odds API if available
        },
        // Real game status and period information from ESPN
        gameStatus: game.status === 'final' ? 'Final' : (game.status === 'in_progress' ? 'Live' : 'Scheduled'),
        period: game.clock || null,
        actualScores: game.scores || null,
        // Enhanced game details from real data
        liveUpdates: game.status === 'in_progress',
        gameWeek: game.week,
        gameSeason: game.season,
        // Remove mock broadcast info
        broadcastInfo: {
          network: null, // Not available from ESPN API
          announcers: null // Not available from ESPN API
        }
      };
      
      setGameDetails(gameDetails);
    } catch (error) {
      console.error('Error fetching game details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="game-modal-overlay" onClick={onClose}>
      <div className="game-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Trophy size={20} />
            <span>Game Details</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="modal-loading">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
              </div>
              <p>Loading game details...</p>
            </div>
          ) : gameDetails ? (
            <>
              <div className="game-header">
                <div className="teams-display">
                  <div className="team-info">
                    <div className="team-details">
                      <h3>{game.away_team}</h3>
                      <span className="team-record">{gameDetails.teamStats[game.away_team]?.record}</span>
                      {game.away_rank && <span className="team-rank">#{game.away_rank}</span>}
                    </div>
                    {gameDetails.actualScores && (
                      <span className="team-score">{gameDetails.teamStats[game.away_team]?.score}</span>
                    )}
                  </div>
                  <div className="vs-divider">
                    {gameDetails.liveUpdates ? (
                      <div className="live-status">
                        <div className="live-dot-pulse"></div>
                        <span className="game-status">{gameDetails.gameStatus}</span>
                        {gameDetails.period && <span className="game-period">{gameDetails.period}</span>}
                      </div>
                    ) : gameDetails.actualScores ? (
                      <span className="game-status">{gameDetails.gameStatus}</span>
                    ) : (
                      '@'
                    )}
                  </div>
                  <div className="team-info">
                    <div className="team-details">
                      <h3>{game.home_team}</h3>
                      <span className="team-record">{gameDetails.teamStats[game.home_team]?.record}</span>
                      {game.home_rank && <span className="team-rank">#{game.home_rank}</span>}
                    </div>
                    {gameDetails.actualScores && (
                      <span className="team-score">{gameDetails.teamStats[game.home_team]?.score}</span>
                    )}
                  </div>
                </div>

                {!gameDetails.liveUpdates && (
                  <div className="game-time">
                    <Clock size={16} />
                    <span>
                      {gameDetails.actualScores ? (
                        gameDetails.gameStatus === gameDetails.period
                          ? gameDetails.gameStatus
                          : `${gameDetails.gameStatus}${gameDetails.period ? ` - ${gameDetails.period}` : ''}`
                      ) : (
                        new Date(game.commence_time).toLocaleString()
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-tabs" role="tablist">
                <button
                  type="button"
                  className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={`modal-tab ${activeTab === 'line' ? 'active' : ''}`}
                  onClick={() => setActiveTab('line')}
                  disabled={!sportKey || !eventId}
                >
                  Line Movement
                </button>
              </div>

              {activeTab === 'overview' ? (
                <>
                  {(gameDetails.predictions.spread || gameDetails.predictions.total) && (
                    <div className="detail-section priority">
                      <h4><Info size={16} /> Betting Lines</h4>
                      <div className="betting-info">
                        {gameDetails.predictions.spread && (
                          <div className="betting-line">
                            <span>Spread:</span>
                            <span>{gameDetails.predictions.spread}</span>
                          </div>
                        )}
                        {gameDetails.predictions.total && (
                          <div className="betting-line">
                            <span>Total (O/U):</span>
                            <span>{gameDetails.predictions.total}</span>
                          </div>
                        )}
                        {game.odds?.provider && (
                          <div className="betting-source">
                            <span>Source: {game.odds.provider}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(gameDetails.teamStats[game.away_team]?.record || gameDetails.teamStats[game.home_team]?.record) && (
                    <div className="detail-section">
                      <h4><TrendingUp size={16} /> Team Records</h4>
                      <div className="team-stats-compact">
                        {Object.entries(gameDetails.teamStats).map(([team, stats]) => (
                          stats.record && (
                            <div key={team} className="team-stat-row">
                              <div className="team-name">{team}</div>
                              <div className="team-details">
                                <span className="record">{stats.record}</span>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {gameDetails.liveUpdates && (
                    <div className="detail-section live-notice">
                      <div className="live-update-banner">
                        <div className="live-dot-pulse"></div>
                        <span>Live updates every 30 seconds</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="line-movement-panel">
                  {!sportKey || !eventId ? (
                    <div className="empty-state">Line history unavailable for this event.</div>
                  ) : historyLoading ? (
                    <div className="modal-loading compact">
                      <div className="loading-spinner">
                        <div className="spinner-ring"></div>
                      </div>
                      <p>Loading line movement…</p>
                    </div>
                  ) : historyError ? (
                    <div className="empty-state error">{historyError}</div>
                  ) : !oddsHistory.length ? (
                    <div className="empty-state">No history available yet for the selected parameters.</div>
                  ) : (
                    <>
                      <div className="line-controls">
                        <div className="control-group">
                          <label>Market</label>
                          <select
                            value={selectedMarket || ''}
                            onChange={(e) => setSelectedMarket(e.target.value || null)}
                          >
                            {marketOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                        <div className="control-group">
                          <label>Book</label>
                          <select
                            value={selectedBook}
                            onChange={(e) => setSelectedBook(e.target.value)}
                          >
                            <option value="all">All books</option>
                            {bookmakerOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          className="refresh-history"
                          onClick={() => refreshHistory()}
                          disabled={historyLoading}
                        >
                          <RefreshCw size={16} /> Refresh
                        </button>
                      </div>

                      <div className="line-history-wrapper">
                        <table className="line-history-table">
                          <thead>
                            <tr>
                              <th>Book</th>
                              <th>Market</th>
                              <th>Outcome</th>
                              <th>Price</th>
                              <th>Point</th>
                              <th>Last Update</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedHistory.map((row, idx) => (
                              <tr key={`${row.bookmakerKey}-${row.marketKey}-${row.outcomeName}-${row.lastUpdate || idx}-${idx}`}>
                                <td>{row.bookmakerTitle || row.bookmakerKey}</td>
                                <td>{row.marketKey}</td>
                                <td>{row.outcomeName}</td>
                                <td>{row.price !== null && row.price !== undefined ? row.price : '—'}</td>
                                <td>{row.point !== null && row.point !== undefined ? row.point : '—'}</td>
                                <td>{formatTimestamp(row.lastUpdate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="modal-error">
              <p>Unable to load game details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
