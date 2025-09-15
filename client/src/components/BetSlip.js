import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, Calculator, TrendingUp, AlertCircle, CheckCircle2, Zap, Target, DollarSign, Trophy, Share2, Download, Trash2, Copy, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './BetSlip.css';

const BetSlip = ({ isOpen, onClose, bets = [], onUpdateBet, onRemoveBet, onClearAll, onPlaceBets }) => {
  const navigate = useNavigate();
  const [betAmounts, setBetAmounts] = useState({});
  const [parlayAmount, setParlayAmount] = useState('');
  const [betType, setBetType] = useState('single'); // 'single', 'parlay', 'round-robin'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickBetAmount, setQuickBetAmount] = useState(25);
  // Get user's bankroll from localStorage, sync with My Sportsbooks setting
  const getUserBankroll = () => {
    const saved = localStorage.getItem('userBankroll');
    return saved ? Number(saved) : 1000;
  };
  
  const [bankroll, setBankroll] = useState(getUserBankroll());
  const [riskTolerance, setRiskTolerance] = useState('moderate'); // 'conservative', 'moderate', 'aggressive'
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [pendingSettings, setPendingSettings] = useState({
    bankroll: getUserBankroll(),
    riskTolerance: 'moderate',
    autoCalculate: true
  });
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(true);

  // Load saved settings and sync with user bankroll
  useEffect(() => {
    try {
      const saved = localStorage.getItem('betslip_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        const loadedBankroll = settings.bankroll || getUserBankroll();
        const loadedRisk = settings.riskTolerance || 'moderate';
        const loadedAuto = settings.autoCalculate !== false;
        
        setBankroll(loadedBankroll);
        setRiskTolerance(loadedRisk);
        setQuickBetAmount(settings.quickBetAmount || 25);
        setAutoCalculate(loadedAuto);
        
        setPendingSettings({
          bankroll: loadedBankroll,
          riskTolerance: loadedRisk,
          autoCalculate: loadedAuto
        });
      }
    } catch (e) {
      console.warn('Failed to load bet slip settings:', e);
    }
    
    // Listen for bankroll changes from My Sportsbooks
    const handleStorageChange = () => {
      const newBankroll = getUserBankroll();
      setBankroll(newBankroll);
      setPendingSettings(prev => ({ ...prev, bankroll: newBankroll }));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save settings when they change
  useEffect(() => {
    try {
      const settings = { bankroll, riskTolerance, quickBetAmount, autoCalculate };
      localStorage.setItem('betslip_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save bet slip settings:', e);
    }
  }, [bankroll, riskTolerance, quickBetAmount, autoCalculate]);

  // Initialize bet amounts when bets change
  useEffect(() => {
    const newAmounts = { ...betAmounts };
    bets.forEach(bet => {
      if (!newAmounts[bet.id]) {
        newAmounts[bet.id] = autoCalculate ? getRecommendedBet(bet) : getBaseBetAmount();
      }
    });
    setBetAmounts(newAmounts);
  }, [bets, autoCalculate, bankroll, riskTolerance]);

  // Calculate base bet amount based on bankroll and risk tolerance
  const getBaseBetAmount = () => {
    const riskMultipliers = {
      conservative: 0.01, // 1% of bankroll
      moderate: 0.025,    // 2.5% of bankroll  
      aggressive: 0.05    // 5% of bankroll
    };
    
    return Math.round(bankroll * riskMultipliers[riskTolerance]);
  };

  // Calculate recommended bet size based on value betting and Kelly Criterion
  const getRecommendedBet = (bet) => {
    const baseBetAmount = getBaseBetAmount();
    
    // If no edge data, fall back to basic risk management
    if (!bet.edge || bet.edge <= 0) return baseBetAmount;
    
    const marketOdds = bet.americanOdds;
    const edge = bet.edge / 100; // Convert percentage to decimal
    
    // Calculate implied probability from market odds
    const marketImpliedProb = marketOdds > 0 
      ? 100 / (marketOdds + 100) 
      : Math.abs(marketOdds) / (Math.abs(marketOdds) + 100);
    
    // Calculate fair probability (market prob adjusted by edge)
    // If we have +5% edge, our fair prob = market prob / (1 - edge)
    const fairProb = marketImpliedProb / (1 - edge);
    
    // Calculate decimal odds for Kelly formula
    const decimalOdds = marketOdds > 0 
      ? (marketOdds / 100) + 1 
      : (100 / Math.abs(marketOdds)) + 1;
    
    // Kelly Criterion: f = (bp - q) / b
    // where b = decimal odds - 1, p = fair probability, q = 1 - p
    const b = decimalOdds - 1;
    const p = fairProb;
    const q = 1 - p;
    
    const kellyFraction = (b * p - q) / b;
    
    // Only bet if Kelly is positive (we have an edge)
    if (kellyFraction <= 0) return baseBetAmount;
    
    // Adjust Kelly based on confidence and risk tolerance
    const riskMultiplier = {
      conservative: 0.25, // Quarter Kelly
      moderate: 0.5,      // Half Kelly  
      aggressive: 0.75    // Three-quarter Kelly
    }[riskTolerance];
    
    // Scale bet size based on edge strength
    const edgeMultiplier = Math.min(1, edge * 10); // Higher edge = larger multiplier
    const adjustedKelly = kellyFraction * riskMultiplier * edgeMultiplier;
    
    // Calculate recommended amount
    const kellyAmount = bankroll * adjustedKelly;
    
    // Apply caps: minimum base bet, maximum 10% of bankroll
    const cappedAmount = Math.min(kellyAmount, bankroll * 0.1);
    const finalAmount = Math.max(baseBetAmount, cappedAmount);
    
    return Math.round(finalAmount);
  };
  
  // Validate bet amounts and settings
  const validateBets = () => {
    const errors = {};
    let totalRisk = 0;
    
    if (betType === 'single') {
      bets.forEach(bet => {
        const amount = parseFloat(betAmounts[bet.id]) || 0;
        const betId = bet.id;
        
        if (amount > 0) {
          // Check minimum bet
          if (amount < 1) {
            errors[betId] = 'Minimum bet is $1';
          }
          // Check maximum bet (20% of bankroll)
          else if (amount > bankroll * 0.2) {
            errors[betId] = `Exceeds 20% of bankroll ($${(bankroll * 0.2).toFixed(0)})`;
          }
          // Check if bet is too large for edge
          else if (bet.edge && bet.edge < 2 && amount > bankroll * 0.02) {
            errors[betId] = 'Large bet on low edge - consider reducing';
          }
          
          totalRisk += amount;
        }
      });
      
      // Check total exposure
      if (totalRisk > bankroll * 0.5) {
        errors.total = 'Total exposure exceeds 50% of bankroll';
      }
    } else if (betType === 'parlay') {
      const amount = parseFloat(parlayAmount) || 0;
      
      if (amount > 0) {
        if (amount < 1) {
          errors.parlay = 'Minimum parlay bet is $1';
        } else if (amount > bankroll * 0.1) {
          errors.parlay = `Parlay bet exceeds 10% of bankroll ($${(bankroll * 0.1).toFixed(0)})`;
        }
      }
      
      // Check parlay leg count
      if (bets.length > 10) {
        errors.parlay = 'Maximum 10 legs allowed in parlay';
      }
      
      // Check for correlated bets (same game)
      const games = new Set();
      let hasCorrelatedBets = false;
      bets.forEach(bet => {
        const gameKey = bet.matchup;
        if (games.has(gameKey)) {
          hasCorrelatedBets = true;
        }
        games.add(gameKey);
      });
      
      if (hasCorrelatedBets) {
        errors.correlation = 'Warning: Correlated bets detected (same game)';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Run validation when amounts change
  useEffect(() => {
    if (showValidation) {
      validateBets();
    }
  }, [betAmounts, parlayAmount, betType, bets, bankroll]);

  // Calculate parlay odds
  const parlayCalculations = useMemo(() => {
    if (bets.length < 2) return null;
    
    let combinedOdds = 1;
    let totalEdge = 0;
    let validBets = 0;
    
    bets.forEach(bet => {
      const odds = bet.americanOdds;
      const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
      combinedOdds *= decimalOdds;
      
      if (bet.edge) {
        totalEdge += bet.edge;
        validBets++;
      }
    });
    
    const americanOdds = combinedOdds >= 2 
      ? Math.round((combinedOdds - 1) * 100)
      : Math.round(-100 / (combinedOdds - 1));
    
    const avgEdge = validBets > 0 ? totalEdge / validBets : 0;
    const amount = parseFloat(parlayAmount) || 0;
    const payout = amount * combinedOdds;
    const profit = payout - amount;
    
    // Calculate parlay probability and expected value
    let combinedProb = 1;
    bets.forEach(bet => {
      const odds = bet.americanOdds;
      const impliedProb = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
      combinedProb *= impliedProb;
    });
    
    const breakEvenProb = 1 / combinedOdds;
    const expectedValue = (combinedProb * profit) - ((1 - combinedProb) * amount);
    const evPercentage = amount > 0 ? (expectedValue / amount) * 100 : 0;
    
    return {
      odds: americanOdds,
      combinedDecimal: combinedOdds,
      avgEdge,
      amount,
      payout,
      profit,
      legs: bets.length,
      probability: combinedProb * 100,
      breakEvenProb: breakEvenProb * 100,
      expectedValue,
      evPercentage
    };
  }, [bets, parlayAmount]);

  // Handle pending settings changes
  const handleSettingChange = (field, value) => {
    setPendingSettings(prev => ({ ...prev, [field]: value }));
    setHasUnappliedChanges(true);
  };

  const applySettings = () => {
    setBankroll(pendingSettings.bankroll);
    setRiskTolerance(pendingSettings.riskTolerance);
    setAutoCalculate(pendingSettings.autoCalculate);
    setHasUnappliedChanges(false);
    
    // Recalculate all bet amounts if auto-calculate is enabled
    if (pendingSettings.autoCalculate) {
      const newAmounts = {};
      bets.forEach(bet => {
        const recommendedAmount = calculateRecommendedAmount(bet.americanOdds, bet.edge, pendingSettings);
        newAmounts[bet.id] = Math.round(recommendedAmount);
      });
      setBetAmounts(newAmounts);
    }
  };

  // Calculate recommended bet amount based on bankroll and risk tolerance
  const calculateRecommendedAmount = (betOdds, edge = 0, settings = null) => {
    const currentSettings = settings || { bankroll, riskTolerance, autoCalculate };
    if (!currentSettings.autoCalculate) return 0;
    
    const riskMultipliers = {
      conservative: 0.01, // 1% of bankroll
      moderate: 0.025,    // 2.5% of bankroll  
      aggressive: 0.05    // 5% of bankroll
    };
    
    const baseAmount = currentSettings.bankroll * riskMultipliers[currentSettings.riskTolerance];
    
    // Kelly Criterion adjustment if we have edge data
    if (edge > 0) {
      const decimal = betOdds > 0 ? (betOdds / 100) + 1 : (100 / Math.abs(betOdds)) + 1;
      const kellyFraction = edge / (decimal - 1);
      const kellyAmount = currentSettings.bankroll * Math.min(kellyFraction, 0.1); // Cap at 10%
      return Math.min(baseAmount, kellyAmount);
    }
    
    return baseAmount;
  };

  // Calculate individual bet statistics with proper EV calculation
  const calculateBetStats = (bet) => {
    const amount = parseFloat(betAmounts[bet.id]) || 0;
    const odds = bet.americanOdds;
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    const payout = amount * decimalOdds;
    const profit = payout - amount;
    
    // Use the edge value that was calculated when the bet was added to the slip
    // This ensures consistency with the odds table calculation
    const edge = bet.edge || 0;
    
    return {
      amount,
      payout,
      profit,
      edge,
      decimalOdds
    };
  };

  // Calculate single bet totals
  const singleBetTotals = useMemo(() => {
    let totalStake = 0;
    let totalPayout = 0;
    let totalProfit = 0;
    let totalEdge = 0;
    let validEdges = 0;

    bets.forEach(bet => {
      const stats = calculateBetStats(bet);
      totalStake += stats.amount;
      totalPayout += stats.payout;
      totalProfit += stats.profit;
      
      if (stats.edge && !isNaN(stats.edge)) {
        totalEdge += stats.edge;
        validEdges++;
      }
    });

    return {
      stake: totalStake,
      payout: totalPayout,
      profit: totalProfit,
      avgEdge: validEdges > 0 ? totalEdge / validEdges : 0,
      count: bets.length
    };
  }, [bets, betAmounts]);

  const updateBetAmount = (betId, amount) => {
    setBetAmounts(prev => ({
      ...prev,
      [betId]: amount
    }));
  };

  const applyQuickBet = (betId) => {
    updateBetAmount(betId, quickBetAmount);
  };

  const clearBetAmount = (betId) => {
    updateBetAmount(betId, '');
  };

  const formatOdds = (odds) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getEdgeColor = (edge) => {
    if (!edge) return 'var(--text-muted)';
    if (edge >= 5) return 'var(--success)';
    if (edge >= 2) return 'var(--warning)';
    return 'var(--danger)';
  };

  const handlePlaceBets = () => {
    // Validate before placing
    if (!validateBets()) {
      setShowValidation(true);
      return;
    }
    
    const betsToPlace = [];
    
    if (betType === 'single') {
      bets.forEach(bet => {
        const amount = parseFloat(betAmounts[bet.id]);
        if (amount > 0) {
          betsToPlace.push({
            id: `${bet.id}_${Date.now()}`,
            league: bet.sport || 'Unknown',
            game: bet.matchup,
            market: bet.market,
            selection: bet.selection,
            odds: bet.americanOdds > 0 ? `+${bet.americanOdds}` : `${bet.americanOdds}`,
            stake: amount,
            potential: amount * (bet.americanOdds > 0 ? (bet.americanOdds / 100) + 1 : (100 / Math.abs(bet.americanOdds)) + 1),
            status: 'pending',
            dateAdded: new Date().toISOString(),
            type: 'single'
          });
        }
      });
    } else if (betType === 'parlay' && parlayCalculations && parseFloat(parlayAmount) > 0) {
      betsToPlace.push({
        id: `parlay_${Date.now()}`,
        league: 'PARLAY',
        game: `${bets.length}-Leg Parlay`,
        market: 'Parlay',
        selection: bets.map(bet => `${bet.selection} ${bet.americanOdds > 0 ? '+' : ''}${bet.americanOdds}`).join(', '),
        odds: parlayCalculations.odds > 0 ? `+${parlayCalculations.odds}` : `${parlayCalculations.odds}`,
        stake: parseFloat(parlayAmount),
        potential: parlayCalculations.payout,
        status: 'pending',
        dateAdded: new Date().toISOString(),
        type: 'parlay'
      });
    }
    
    if (betsToPlace.length > 0) {
      // Save to My Picks localStorage
      const existingPicks = JSON.parse(localStorage.getItem('oss_my_picks_v1') || '[]');
      const updatedPicks = [...existingPicks, ...betsToPlace];
      localStorage.setItem('oss_my_picks_v1', JSON.stringify(updatedPicks));
      
      // Clear the slip after placing bets
      onClearAll?.();
      setBetAmounts({});
      setParlayAmount('');
      setValidationErrors({});
      
      // Navigate to My Picks page
      navigate('/picks');
      onClose();
    }
  };

  const exportBets = () => {
    const data = {
      timestamp: new Date().toISOString(),
      betType,
      bets: bets.map(bet => ({
        ...bet,
        amount: betAmounts[bet.id] || 0
      })),
      parlayAmount: betType === 'parlay' ? parlayAmount : null,
      totals: betType === 'single' ? singleBetTotals : parlayCalculations
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `betslip_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareBets = async () => {
    const shareText = betType === 'single' 
      ? `My bets: ${bets.length} selections, ${formatCurrency(singleBetTotals.stake)} total stake, ${formatCurrency(singleBetTotals.profit)} potential profit`
      : `My parlay: ${bets.length} legs, ${formatCurrency(parlayCalculations?.amount || 0)} stake, ${formatOdds(parlayCalculations?.odds || 0)} odds`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Bet Slip',
          text: shareText
        });
      } catch (e) {
        // Fallback to clipboard
        navigator.clipboard?.writeText(shareText);
      }
    } else {
      navigator.clipboard?.writeText(shareText);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="betslip-overlay">
      <div className="betslip-container">
        <div className="betslip-header">
          <div className="betslip-title">
            <Trophy size={20} />
            <span>Bet Slip</span>
            <div className="bet-count">{bets.length}</div>
          </div>
          <div className="betslip-controls">
            <button onClick={onClose} className="control-btn close-btn">
              <X size={16} />
            </button>
          </div>
        </div>

        {bets.length === 0 ? (
          <div className="betslip-empty">
            <div className="empty-icon">
              <Target size={48} />
            </div>
            <h3>No Bets Selected</h3>
            <p>Click on odds to add bets to your slip</p>
          </div>
        ) : (
          <>
            {/* Bet Type Selector */}
            <div className="bet-type-selector">
              <button 
                className={`type-btn ${betType === 'single' ? 'active' : ''}`}
                onClick={() => setBetType('single')}
              >
                Single Bets
              </button>
              <button 
                className={`type-btn ${betType === 'parlay' ? 'active' : ''}`}
                onClick={() => setBetType('parlay')}
                disabled={bets.length < 2}
              >
                Parlay ({bets.length})
              </button>
            </div>

            {/* Bet Settings */}
            <div className="bet-settings-section">
              <div className="settings-header">
                <h5>Bet Settings</h5>
                <button 
                  className="settings-toggle"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              
              {showAdvanced && (
                <div className="settings-content">
                  <div className="settings-grid">
                    <div className="settings-row">
                      <div className="setting-group">
                        <label className="setting-label">Bankroll</label>
                        <input
                          type="number"
                          value={pendingSettings.bankroll}
                          onChange={(e) => handleSettingChange('bankroll', Number(e.target.value))}
                          className="setting-input"
                          min="1"
                        />
                        <span className="setting-hint">Your total available funds</span>
                      </div>
                      
                      <div className="setting-group">
                        <label className="setting-label">Risk Level</label>
                        <select
                          value={pendingSettings.riskTolerance}
                          onChange={(e) => handleSettingChange('riskTolerance', e.target.value)}
                          className="setting-select"
                        >
                          <option value="conservative">Conservative (1%)</option>
                          <option value="moderate">Moderate (2.5%)</option>
                          <option value="aggressive">Aggressive (5%)</option>
                        </select>
                        <span className="setting-hint">Percentage of bankroll per bet</span>
                      </div>
                    </div>
                    
                    <div className="setting-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={pendingSettings.autoCalculate}
                          onChange={(e) => handleSettingChange('autoCalculate', e.target.checked)}
                        />
                        <span className="checkbox-text">Auto-calculate bet sizes</span>
                      </label>
                      <span className="setting-hint">Automatically set recommended amounts</span>
                    </div>
                  </div>
                  
                  {hasUnappliedChanges && (
                    <div className="settings-actions">
                      <button 
                        className="apply-settings-btn"
                        onClick={applySettings}
                      >
                        <Calculator size={14} />
                        Apply & Recalculate Bets
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bet List */}
            <div className="betslip-content">
              {betType === 'single' ? (
                <div className="single-bets">
                  {bets.map(bet => (
                    <div key={bet.id} className="bet-item">
                      <div className="bet-header">
                        <div className="bet-info">
                          <div className="bet-matchup">{bet.matchup}</div>
                          <div className="bet-selection">
                            <span className="selection-text">{bet.selection}</span>
                            <span className="selection-odds">{formatOdds(bet.americanOdds)}</span>
                            {bet.edge && (
                              <span 
                                className="bet-edge-inline"
                                style={{ color: getEdgeColor(bet.edge) }}
                              >
                                {bet.edge > 0 ? '+' : ''}{bet.edge.toFixed(1)}% EV
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveBet?.(bet.id)}
                          className="remove-bet-btn"
                          title="Remove bet"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="bet-amount-section">
                        <div className="amount-input-group">
                          <input
                            type="number"
                            placeholder="0"
                            value={betAmounts[bet.id] || ''}
                            onChange={(e) => updateBetAmount(bet.id, e.target.value)}
                            className="amount-input"
                          />
                          <button
                            onClick={() => clearBetAmount(bet.id)}
                            className="clear-amount-btn"
                            title="Clear"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        
                        {betAmounts[bet.id] && parseFloat(betAmounts[bet.id]) > 0 && (
                          <div className="bet-payout">
                            <div className="payout-info">
                              <span>Stake: {formatCurrency(parseFloat(betAmounts[bet.id]))}</span>
                              <span>Payout: {formatCurrency(
                                parseFloat(betAmounts[bet.id]) * 
                                (bet.americanOdds > 0 ? (bet.americanOdds / 100) + 1 : (100 / Math.abs(bet.americanOdds)) + 1)
                              )} ({((parseFloat(betAmounts[bet.id]) / bankroll) * 100).toFixed(1)}% of bankroll)</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Value-Based Recommendation */}
                        {bet.edge && bet.edge > 0 && (
                          <div className="kelly-recommendation">
                            <Calculator size={12} />
                            <span>Value bet: ${getRecommendedBet(bet)} ({bet.edge > 0 ? '+' : ''}{bet.edge.toFixed(1)}% edge)</span>
                            <button
                              onClick={() => updateBetAmount(bet.id, getRecommendedBet(bet))}
                              className="apply-kelly-btn"
                              title="Apply value-based sizing"
                            >
                              Apply
                            </button>
                          </div>
                        )}
                        
                        {/* Validation Error */}
                        {validationErrors[bet.id] && (
                          <div className="validation-error">
                            <AlertCircle size={12} />
                            <span>{validationErrors[bet.id]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parlay-section">
                  <div className="parlay-legs">
                    <h4>Parlay Legs ({bets.length})</h4>
                    {bets.map((bet, index) => (
                      <div key={bet.id} className="parlay-leg">
                        <div className="leg-number">{index + 1}</div>
                        <div className="leg-info">
                          <div className="leg-matchup">{bet.matchup}</div>
                          <div className="leg-selection">
                            {bet.selection} {formatOdds(bet.americanOdds)}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveBet?.(bet.id)}
                          className="remove-leg-btn"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="parlay-bet-section">
                    <div className="parlay-odds">
                      <span className="odds-label">Parlay Odds:</span>
                      <span className="odds-value">
                        {parlayCalculations ? formatOdds(parlayCalculations.odds) : '--'}
                      </span>
                    </div>
                    
                    <div className="parlay-amount-input">
                      <input
                        type="number"
                        placeholder="Enter bet amount"
                        value={parlayAmount}
                        onChange={(e) => setParlayAmount(e.target.value)}
                        className="parlay-input"
                      />
                      <div className="quick-parlay-amounts">
                        {[25, 50, 100, 200].map(amount => (
                          <button
                            key={amount}
                            onClick={() => setParlayAmount(amount.toString())}
                            className="quick-amount-btn"
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {parlayCalculations && parlayCalculations.amount > 0 && (
                      <div className="parlay-payout">
                        <div className="payout-row">
                          <span>Potential Payout:</span>
                          <span className="payout-amount">
                            {formatCurrency(parlayCalculations.payout)}
                          </span>
                        </div>
                        <div className="payout-row probability">
                          <span>Win Probability:</span>
                          <span className="probability-value">
                            {parlayCalculations.probability.toFixed(1)}%
                          </span>
                        </div>
                        <div className="payout-row ev">
                          <span>Expected Value:</span>
                          <span 
                            className="ev-value"
                            style={{ color: parlayCalculations.evPercentage > 0 ? 'var(--success)' : 'var(--danger)' }}
                          >
                            {parlayCalculations.evPercentage > 0 ? '+' : ''}{parlayCalculations.evPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Parlay Validation Errors */}
                    {(validationErrors.parlay || validationErrors.correlation) && (
                      <div className="validation-errors">
                        {validationErrors.parlay && (
                          <div className="validation-error">
                            <AlertCircle size={12} />
                            <span>{validationErrors.parlay}</span>
                          </div>
                        )}
                        {validationErrors.correlation && (
                          <div className="validation-warning">
                            <AlertTriangle size={12} />
                            <span>{validationErrors.correlation}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="betslip-summary">
              {betType === 'single' ? (
                <div className="single-summary">
                  {singleBetTotals.avgEdge !== 0 && (
                    <div className="summary-row">
                      <span>Avg Edge:</span>
                      <span 
                        className="summary-value"
                        style={{ color: getEdgeColor(singleBetTotals.avgEdge) }}
                      >
                        {singleBetTotals.avgEdge > 0 ? '+' : ''}{singleBetTotals.avgEdge.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                parlayCalculations && (
                  <div className="parlay-summary">
                    <div className="summary-row">
                      <span>Parlay Stake:</span>
                      <span className="summary-value">{formatCurrency(parlayCalculations.amount)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Potential Payout:</span>
                      <span className="summary-value">{formatCurrency(parlayCalculations.payout)}</span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Actions */}
            <div className="betslip-actions">
              <button
                onClick={onClearAll}
                className="clear-all-btn"
              >
                <Trash2 size={16} />
                Clear All
              </button>
              <button
                onClick={handlePlaceBets}
                className="place-bets-btn"
                disabled={
                  betType === 'single' 
                    ? singleBetTotals.stake === 0
                    : !parlayCalculations || parlayCalculations.amount === 0
                }
              >
                <CheckCircle2 size={16} />
                Place {betType === 'single' ? `${singleBetTotals.count} Bets` : 'Parlay'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BetSlip;
