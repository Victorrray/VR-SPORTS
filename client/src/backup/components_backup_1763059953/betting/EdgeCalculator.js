import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Target, Info, AlertCircle, Plus, Trophy, BarChart3, Award } from 'lucide-react';
import './EdgeCalculator.css';

const LS_KEY = "oss_my_picks_v1";

export default function EdgeCalculator({ onClose, onNavigateToSportsbooks }) {
  const [inputs, setInputs] = useState({
    bookmakerOdds: '',
    fairOdds: '',
    betAmount: '100',
    bankroll: '1000'
  });
  
  const [results, setResults] = useState({
    edge: null,
    expectedValue: null,
    kellyBet: null,
    roi: null,
    breakEvenProb: null,
    impliedProb: null
  });

  const [projections, setProjections] = useState({
    winScenario: null,
    loseScenario: null,
    longTermEV: null
  });

  const [userPicks, setUserPicks] = useState([]);
  const [realPerformance, setRealPerformance] = useState(null);

  // Load user picks data
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const picks = JSON.parse(raw);
        setUserPicks(picks);
        calculateRealPerformance(picks);
      }
    } catch (error) {
      console.error('Error loading picks:', error);
    }
  }, []);

  const calculateRealPerformance = (picks) => {
    const settled = picks.filter(p => p.status === 'won' || p.status === 'lost');
    const won = picks.filter(p => p.status === 'won');
    const totalStaked = picks.reduce((sum, p) => sum + (Number(p.stake) || 0), 0);
    const totalReturns = won.reduce((sum, p) => sum + (Number(p.actualPayout) || Number(p.potential) || 0), 0);
    const netProfit = totalReturns - totalStaked;
    const winRate = settled.length > 0 ? (won.length / settled.length) * 100 : 0;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    
    // Calculate average edge from odds
    const avgEdge = picks.length > 0 ? picks.reduce((sum, p) => {
      const odds = Number(String(p.odds || '').replace(/[^-+0-9]/g, '')) || 0;
      // Rough edge estimation based on odds (this is simplified)
      const impliedProb = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
      const edge = Math.max(0, (1 - impliedProb) * 100 - 5); // Rough calculation
      return sum + edge;
    }, 0) / picks.length : 0;

    setRealPerformance({
      winRate: Math.round(winRate * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      avgEdge: Math.round(avgEdge * 10) / 10,
      totalBets: picks.length,
      netProfit: Math.round(netProfit * 100) / 100
    });
  };

  useEffect(() => {
    calculateEdge();
  }, [inputs]);

  const calculateEdge = () => {
    const { bookmakerOdds, fairOdds, betAmount, bankroll } = inputs;
    
    if (!bookmakerOdds || !fairOdds) {
      setResults({
        edge: null,
        expectedValue: null,
        kellyBet: null,
        roi: null,
        breakEvenProb: null,
        impliedProb: null
      });
      return;
    }

    try {
      const bookOdds = parseFloat(bookmakerOdds);
      const fair = parseFloat(fairOdds);
      const amount = parseFloat(betAmount) || 100;
      const bank = parseFloat(bankroll) || 1000;

      // Convert American odds to decimal
      const bookDecimal = bookOdds > 0 ? (bookOdds / 100) + 1 : (100 / Math.abs(bookOdds)) + 1;
      const fairDecimal = fair > 0 ? (fair / 100) + 1 : (100 / Math.abs(fair)) + 1;

      // Calculate edge
      const edge = ((bookDecimal / fairDecimal) - 1) * 100;
      
      // Expected Value
      const expectedValue = (amount * (edge / 100));
      
      // Kelly Criterion
      const fairProb = 1 / fairDecimal;
      const kellyFraction = ((bookDecimal - 1) * fairProb - (1 - fairProb)) / (bookDecimal - 1);
      const kellyBet = Math.max(0, kellyFraction * bank);
      
      // ROI
      const roi = (expectedValue / amount) * 100;
      
      // Break-even probability
      const breakEvenProb = (1 / bookDecimal) * 100;
      
      // Implied probability
      const impliedProb = fairProb * 100;

      setResults({
        edge: edge.toFixed(2),
        expectedValue: expectedValue.toFixed(2),
        kellyBet: kellyBet.toFixed(2),
        roi: roi.toFixed(2),
        breakEvenProb: breakEvenProb.toFixed(1),
        impliedProb: impliedProb.toFixed(1)
      });

      // Calculate projections
      const winAmount = amount * (bookDecimal - 1);
      const loseAmount = -amount;
      const longTermEV = expectedValue * 100; // Over 100 bets

      setProjections({
        winScenario: winAmount.toFixed(2),
        loseScenario: loseAmount.toFixed(2),
        longTermEV: longTermEV.toFixed(2)
      });

    } catch (error) {
      console.error('Edge calculation error:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getEdgeColor = (edge) => {
    const edgeNum = parseFloat(edge);
    if (edgeNum > 3) return 'var(--success)';
    if (edgeNum > 0) return 'var(--warning)';
    return 'var(--error)';
  };

  const getRecommendation = () => {
    const edge = parseFloat(results.edge);
    if (edge > 5) return { text: 'Excellent bet! Strong positive edge.', color: 'var(--success)' };
    if (edge > 3) return { text: 'Good bet with solid edge.', color: 'var(--success)' };
    if (edge > 1) return { text: 'Marginal edge. Consider carefully.', color: 'var(--warning)' };
    if (edge > 0) return { text: 'Small edge. May not be worth the risk.', color: 'var(--warning)' };
    return { text: 'Negative edge. Avoid this bet.', color: 'var(--error)' };
  };

  return (
    <div className="edge-calculator-overlay" onClick={onClose}>
      <div className="edge-calculator" onClick={e => e.stopPropagation()}>
        <div className="calculator-header">
          <div className="header-title">
            <Calculator size={20} />
            <span>Edge Calculator</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="calculator-content">
          {/* Input Section */}
          <div className="input-section">
            <h3>Bet Details</h3>
            <div className="input-grid">
              <div className="input-group">
                <label>Bookmaker Odds</label>
                <input
                  type="number"
                  placeholder="e.g. +150 or -110"
                  value={inputs.bookmakerOdds}
                  onChange={(e) => handleInputChange('bookmakerOdds', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Fair Odds</label>
                <input
                  type="number"
                  placeholder="e.g. +120 or -130"
                  value={inputs.fairOdds}
                  onChange={(e) => handleInputChange('fairOdds', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Bet Amount ($)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={inputs.betAmount}
                  onChange={(e) => handleInputChange('betAmount', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Bankroll ($)</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={inputs.bankroll}
                  onChange={(e) => handleInputChange('bankroll', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          {results.edge !== null && (
            <div className="results-section">
              <h3>Analysis</h3>
              
              {/* Main Edge Display */}
              <div className="edge-display">
                <div className="edge-value" style={{ color: getEdgeColor(results.edge) }}>
                  {results.edge > 0 ? '+' : ''}{results.edge}%
                </div>
                <div className="edge-label">Expected Edge</div>
              </div>

              {/* Key Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <DollarSign size={16} />
                  <div className="metric-value">${results.expectedValue}</div>
                  <div className="metric-label">Expected Value</div>
                </div>
                <div className="metric-card">
                  <Target size={16} />
                  <div className="metric-value">${results.kellyBet}</div>
                  <div className="metric-label">Kelly Bet Size</div>
                </div>
                <div className="metric-card">
                  <TrendingUp size={16} />
                  <div className="metric-value">{results.roi}%</div>
                  <div className="metric-label">ROI</div>
                </div>
              </div>

              {/* Probabilities */}
              <div className="prob-section">
                <div className="prob-item">
                  <span>Break-even Probability:</span>
                  <span>{results.breakEvenProb}%</span>
                </div>
                <div className="prob-item">
                  <span>Fair Probability:</span>
                  <span>{results.impliedProb}%</span>
                </div>
              </div>

              {/* Projections */}
              <div className="projections-section">
                <h4>Scenarios</h4>
                <div className="scenario-grid">
                  <div className="scenario win">
                    <div className="scenario-label">If Win</div>
                    <div className="scenario-value">+${projections.winScenario}</div>
                  </div>
                  <div className="scenario lose">
                    <div className="scenario-label">If Lose</div>
                    <div className="scenario-value">${projections.loseScenario}</div>
                  </div>
                  <div className="scenario long-term">
                    <div className="scenario-label">100 Bets EV</div>
                    <div className="scenario-value">${projections.longTermEV}</div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="recommendation" style={{ borderLeft: `4px solid ${getRecommendation().color}` }}>
                <AlertCircle size={16} style={{ color: getRecommendation().color }} />
                <span>{getRecommendation().text}</span>
              </div>
            </div>
          )}

          {/* Recent Performance Section */}
          <div className="performance-section">
            <h3>
              <Trophy size={18} />
              Recent Performance
            </h3>
            {realPerformance && userPicks.length > 0 ? (
              <div className="real-performance-grid">
                <div className="perf-metric">
                  <div className="perf-value">{realPerformance.winRate}%</div>
                  <div className="perf-label">WIN RATE</div>
                </div>
                <div className="perf-metric">
                  <div className={`perf-value ${realPerformance.roi >= 0 ? 'positive' : 'negative'}`}>
                    {realPerformance.roi >= 0 ? '+' : ''}{realPerformance.roi}%
                  </div>
                  <div className="perf-label">ROI</div>
                </div>
                <div className="perf-metric">
                  <div className="perf-value">{realPerformance.avgEdge}%</div>
                  <div className="perf-label">AVG EDGE</div>
                </div>
                <div className="perf-metric">
                  <div className="perf-value">{realPerformance.totalBets}</div>
                  <div className="perf-label">TOTAL BETS</div>
                </div>
              </div>
            ) : (
              <div className="no-picks-state">
                <div className="no-picks-content">
                  <BarChart3 size={32} className="no-picks-icon" />
                  <h4>No Betting History</h4>
                  <p>Start tracking your picks to see real performance data</p>
                  <button 
                    className="add-picks-btn"
                    onClick={() => {
                      onClose();
                      if (onNavigateToSportsbooks) {
                        onNavigateToSportsbooks();
                      }
                    }}
                  >
                    <Plus size={16} />
                    Find +EV Bets
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="help-section">
            <div className="help-item">
              <Info size={14} />
              <span>Enter American odds (e.g., +150, -110) for both bookmaker and fair value</span>
            </div>
            <div className="help-item">
              <Info size={14} />
              <span>Kelly bet size shows optimal bet amount based on your bankroll</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
