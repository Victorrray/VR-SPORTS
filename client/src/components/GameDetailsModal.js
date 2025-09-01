import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Users, TrendingUp, Calendar, Trophy, Info } from 'lucide-react';
import './GameDetailsModal.css';

export default function GameDetailsModal({ game, isOpen, onClose }) {
  const [gameDetails, setGameDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && game) {
      fetchGameDetails();
    }
  }, [isOpen, game]);

  const fetchGameDetails = async () => {
    setLoading(true);
    try {
      // Mock ESPN-style data - in production, this would fetch from ESPN API
      const mockDetails = {
        venue: {
          name: "Madison Square Garden",
          city: "New York",
          state: "NY",
          capacity: "20,789"
        },
        weather: game.sport_key?.includes('nfl') ? {
          temperature: "72°F",
          condition: "Clear",
          humidity: "45%",
          wind: "5 mph SW"
        } : null,
        attendance: "18,456",
        officials: [
          { name: "John Smith", position: "Referee" },
          { name: "Mike Johnson", position: "Umpire" }
        ],
        teamStats: {
          [game.away_team || "Away Team"]: {
            record: "12-8",
            streak: "W3",
            lastGame: `W 105-98 vs ${game.home_team || "Opponent"}`,
            injuries: ["Player A (Questionable)", "Player B (Out)"]
          },
          [game.home_team || "Home Team"]: {
            record: "15-5", 
            streak: "W5",
            lastGame: `W 112-89 vs ${game.away_team || "Opponent"}`,
            injuries: ["Player C (Probable)"]
          }
        },
        headToHead: {
          allTime: `${game.home_team || "Home"} lead 45-32`,
          thisSeason: "Split 1-1",
          lastMeeting: `${game.home_team || "Home"} 108-102 (Dec 15)`
        },
        keyPlayers: [
          { name: "Star Player", team: game.away_team || "Away Team", stats: "27.5 PPG, 8.1 RPG, 6.8 APG" },
          { name: "Key Player", team: game.home_team || "Home Team", stats: "30.2 PPG, 8.9 RPG, 4.5 APG" }
        ],
        predictions: {
          spread: game.odds?.spread || "-3.5",
          total: game.odds?.overUnder || "215.5",
          moneyline: { away: "+145", home: "-165" }
        }
      };
      
      setGameDetails(mockDetails);
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
              {/* Game Header */}
              <div className="game-header">
                <div className="teams-display">
                  <div className="team-info">
                    <h3>{game.away_team}</h3>
                    <span className="team-record">{gameDetails.teamStats[game.away_team]?.record}</span>
                  </div>
                  <div className="vs-divider">@</div>
                  <div className="team-info">
                    <h3>{game.home_team}</h3>
                    <span className="team-record">{gameDetails.teamStats[game.home_team]?.record}</span>
                  </div>
                </div>
                
                <div className="game-time">
                  <Clock size={16} />
                  <span>{new Date(game.commence_time).toLocaleString()}</span>
                </div>
              </div>

              {/* Venue & Weather */}
              <div className="detail-section">
                <h4><MapPin size={16} /> Venue</h4>
                <div className="venue-info">
                  <p><strong>{gameDetails.venue.name}</strong></p>
                  <p>{gameDetails.venue.city}, {gameDetails.venue.state}</p>
                  <p>Capacity: {gameDetails.venue.capacity}</p>
                </div>
                
                {gameDetails.weather && (
                  <div className="weather-info">
                    <h5>Weather</h5>
                    <p>{gameDetails.weather.temperature} - {gameDetails.weather.condition}</p>
                    <p>Humidity: {gameDetails.weather.humidity} | Wind: {gameDetails.weather.wind}</p>
                  </div>
                )}
              </div>

              {/* Team Stats */}
              <div className="detail-section">
                <h4><TrendingUp size={16} /> Team Form</h4>
                <div className="team-stats">
                  {Object.entries(gameDetails.teamStats).map(([team, stats]) => (
                    <div key={team} className="team-stat-block">
                      <h5>{team}</h5>
                      <p><strong>Record:</strong> {stats.record}</p>
                      <p><strong>Streak:</strong> {stats.streak}</p>
                      <p><strong>Last Game:</strong> {stats.lastGame}</p>
                      {stats.injuries.length > 0 && (
                        <div className="injuries">
                          <strong>Injuries:</strong>
                          <ul>
                            {stats.injuries.map((injury, idx) => (
                              <li key={idx}>{injury}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Head to Head */}
              <div className="detail-section">
                <h4><Users size={16} /> Head to Head</h4>
                <div className="h2h-info">
                  <p><strong>All Time:</strong> {gameDetails.headToHead.allTime}</p>
                  <p><strong>This Season:</strong> {gameDetails.headToHead.thisSeason}</p>
                  <p><strong>Last Meeting:</strong> {gameDetails.headToHead.lastMeeting}</p>
                </div>
              </div>

              {/* Key Players */}
              <div className="detail-section">
                <h4><Trophy size={16} /> Key Players</h4>
                <div className="key-players">
                  {gameDetails.keyPlayers.map((player, idx) => (
                    <div key={idx} className="player-card">
                      <h5>{player.name}</h5>
                      <p className="player-team">{player.team}</p>
                      <p className="player-stats">{player.stats}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Betting Info */}
              <div className="detail-section">
                <h4><Info size={16} /> Betting Lines</h4>
                <div className="betting-info">
                  <div className="betting-line">
                    <span>Spread:</span>
                    <span>{gameDetails.predictions.spread}</span>
                  </div>
                  <div className="betting-line">
                    <span>Total:</span>
                    <span>{gameDetails.predictions.total}</span>
                  </div>
                  <div className="betting-line">
                    <span>Moneyline:</span>
                    <span>{gameDetails.predictions.moneyline.away} / {gameDetails.predictions.moneyline.home}</span>
                  </div>
                </div>
              </div>
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
