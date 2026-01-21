import { Calculator, DollarSign, TrendingUp, Percent, Plus, X, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { toast } from 'sonner';

type CalculatorMode = 'single' | 'parlay' | 'arbitrage';

interface ParleyLeg {
  id: number;
  odds: string;
  stake: string;
}

export function CalculatorPage() {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const [mode, setMode] = useState<CalculatorMode>('single');
  
  // Single Bet Calculator
  const [odds, setOdds] = useState('');
  const [stake, setStake] = useState('');
  
  // Parlay Calculator
  const [parlayLegs, setParlayLegs] = useState<ParleyLeg[]>([
    { id: 1, odds: '', stake: '' },
    { id: 2, odds: '', stake: '' }
  ]);
  
  // Arbitrage Calculator
  const [arbOdds1, setArbOdds1] = useState('');
  const [arbOdds2, setArbOdds2] = useState('');
  const [arbTotalStake, setArbTotalStake] = useState('');

  // Convert American odds to decimal
  const americanToDecimal = (americanOdds: string): number => {
    const odds = parseFloat(americanOdds);
    if (isNaN(odds)) return 0;
    if (odds > 0) {
      return (odds / 100) + 1;
    } else {
      return (100 / Math.abs(odds)) + 1;
    }
  };

  // Calculate single bet payout
  const calculateSingleBet = () => {
    const stakeAmount = parseFloat(stake);
    const oddsValue = parseFloat(odds);
    
    if (isNaN(stakeAmount) || isNaN(oddsValue) || stakeAmount <= 0) {
      return { toWin: 0, totalPayout: 0, profit: 0, impliedProbability: 0 };
    }

    let toWin = 0;
    if (oddsValue > 0) {
      toWin = (stakeAmount * oddsValue) / 100;
    } else {
      toWin = (stakeAmount * 100) / Math.abs(oddsValue);
    }

    const totalPayout = stakeAmount + toWin;
    const impliedProbability = oddsValue > 0 
      ? (100 / (oddsValue + 100)) * 100 
      : (Math.abs(oddsValue) / (Math.abs(oddsValue) + 100)) * 100;

    return {
      toWin: toWin,
      totalPayout: totalPayout,
      profit: toWin,
      impliedProbability: impliedProbability
    };
  };

  // Calculate parlay payout
  const calculateParlay = () => {
    const validLegs = parlayLegs.filter(leg => 
      leg.odds !== '' && !isNaN(parseFloat(leg.odds))
    );

    if (validLegs.length === 0) {
      return { totalOdds: 0, toWin: 0, totalPayout: 0, impliedProbability: 0 };
    }

    // Get stake from first leg or use a default
    const stakeAmount = parseFloat(parlayLegs[0].stake) || 0;
    if (stakeAmount <= 0) {
      return { totalOdds: 0, toWin: 0, totalPayout: 0, impliedProbability: 0 };
    }

    // Convert all odds to decimal and multiply
    let combinedDecimalOdds = 1;
    let combinedImpliedProb = 1;

    validLegs.forEach(leg => {
      const decimalOdds = americanToDecimal(leg.odds);
      combinedDecimalOdds *= decimalOdds;
      
      const oddsValue = parseFloat(leg.odds);
      const impliedProb = oddsValue > 0 
        ? (100 / (oddsValue + 100))
        : (Math.abs(oddsValue) / (Math.abs(oddsValue) + 100));
      combinedImpliedProb *= impliedProb;
    });

    const totalPayout = stakeAmount * combinedDecimalOdds;
    const toWin = totalPayout - stakeAmount;

    // Convert back to American odds for display
    let americanOdds = 0;
    if (combinedDecimalOdds >= 2) {
      americanOdds = (combinedDecimalOdds - 1) * 100;
    } else {
      americanOdds = -100 / (combinedDecimalOdds - 1);
    }

    return {
      totalOdds: americanOdds,
      toWin: toWin,
      totalPayout: totalPayout,
      impliedProbability: combinedImpliedProb * 100
    };
  };

  // Calculate arbitrage opportunity
  const calculateArbitrage = () => {
    const odds1 = parseFloat(arbOdds1);
    const odds2 = parseFloat(arbOdds2);
    const totalStake = parseFloat(arbTotalStake);

    if (isNaN(odds1) || isNaN(odds2) || isNaN(totalStake) || totalStake <= 0) {
      return { isArbitrage: false, profit: 0, stake1: 0, stake2: 0, roi: 0 };
    }

    const decimal1 = americanToDecimal(arbOdds1);
    const decimal2 = americanToDecimal(arbOdds2);

    const impliedProb1 = 1 / decimal1;
    const impliedProb2 = 1 / decimal2;
    const totalImplied = impliedProb1 + impliedProb2;

    const isArbitrage = totalImplied < 1;

    const stake1 = totalStake * (impliedProb1 / totalImplied);
    const stake2 = totalStake * (impliedProb2 / totalImplied);

    const payout1 = stake1 * decimal1;
    const payout2 = stake2 * decimal2;
    
    const guaranteedPayout = Math.min(payout1, payout2);
    const profit = guaranteedPayout - totalStake;
    const roi = (profit / totalStake) * 100;

    return {
      isArbitrage,
      profit,
      stake1,
      stake2,
      roi
    };
  };

  const singleResult = calculateSingleBet();
  const parlayResult = calculateParlay();
  const arbResult = calculateArbitrage();

  const addParlayLeg = () => {
    const newId = Math.max(...parlayLegs.map(l => l.id), 0) + 1;
    setParlayLegs([...parlayLegs, { id: newId, odds: '', stake: '' }]);
  };

  const removeParlayLeg = (id: number) => {
    if (parlayLegs.length > 2) {
      setParlayLegs(parlayLegs.filter(leg => leg.id !== id));
    }
  };

  const updateParlayLeg = (id: number, field: 'odds' | 'stake', value: string) => {
    setParlayLegs(parlayLegs.map(leg => 
      leg.id === id ? { ...leg, [field]: value } : leg
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-2xl md:text-3xl mb-2`}>
          Betting Calculator
        </h2>
        <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>
          Calculate payouts, parlays, and arbitrage opportunities
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setMode('single')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            mode === 'single'
              ? isLight ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-purple-500/30 text-white border border-purple-400/30'
              : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Single Bet
          </div>
        </button>
        <button
          onClick={() => setMode('parlay')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            mode === 'parlay'
              ? isLight ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-purple-500/30 text-white border border-purple-400/30'
              : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Parlay
          </div>
        </button>
        <button
          onClick={() => setMode('arbitrage')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            mode === 'arbitrage'
              ? isLight ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-purple-500/30 text-white border border-purple-400/30'
              : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Arbitrage
          </div>
        </button>
      </div>

      {/* Calculator Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6`}>
          <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg mb-4`}>
            {mode === 'single' && 'Single Bet Calculator'}
            {mode === 'parlay' && 'Parlay Calculator'}
            {mode === 'arbitrage' && 'Arbitrage Calculator'}
          </h3>

          {/* Single Bet Mode */}
          {mode === 'single' && (
            <div className="space-y-4">
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  American Odds
                </label>
                <input
                  type="text"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  placeholder="e.g., +150 or -110"
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
              </div>
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  Stake Amount ($)
                </label>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="100"
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
              </div>
            </div>
          )}

          {/* Parlay Mode */}
          {mode === 'parlay' && (
            <div className="space-y-4">
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  Total Stake ($)
                </label>
                <input
                  type="number"
                  value={parlayLegs[0]?.stake || ''}
                  onChange={(e) => updateParlayLeg(parlayLegs[0].id, 'stake', e.target.value)}
                  placeholder="100"
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
              </div>
              
              <div className="space-y-3">
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm block`}>
                  Parlay Legs
                </label>
                {parlayLegs.map((leg, index) => (
                  <div key={leg.id} className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={leg.odds}
                        onChange={(e) => updateParlayLeg(leg.id, 'odds', e.target.value)}
                        placeholder={`Leg ${index + 1} odds (e.g., -110)`}
                        className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                      />
                    </div>
                    {parlayLegs.length > 2 && (
                      <button
                        onClick={() => {
                          removeParlayLeg(leg.id);
                          toast.success('Leg removed');
                        }}
                        className={`px-3 ${isLight ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200' : 'bg-red-500/10 border-red-400/30 text-red-400 hover:bg-red-500/20'} border rounded-xl transition-all`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    addParlayLeg();
                    toast.success('Leg added to parlay');
                  }}
                  className={`w-full px-4 py-3 ${isLight ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' : 'bg-purple-500/20 border-purple-400/30 text-white hover:bg-purple-500/40'} border rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2`}
                >
                  <Plus className="w-4 h-4" />
                  Add Leg
                </button>
              </div>
            </div>
          )}

          {/* Arbitrage Mode */}
          {mode === 'arbitrage' && (
            <div className="space-y-4">
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  Outcome 1 Odds
                </label>
                <input
                  type="text"
                  value={arbOdds1}
                  onChange={(e) => setArbOdds1(e.target.value)}
                  placeholder="e.g., +150"
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
              </div>
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  Outcome 2 Odds
                </label>
                <input
                  type="text"
                  value={arbOdds2}
                  onChange={(e) => setArbOdds2(e.target.value)}
                  placeholder="e.g., -120"
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
              </div>
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  Total Stake ($)
                </label>
                <input
                  type="number"
                  value={arbTotalStake}
                  onChange={(e) => setArbTotalStake(e.target.value)}
                  placeholder="1000"
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6`}>
          <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg mb-4`}>
            Results
          </h3>

          {/* Single Bet Results */}
          {mode === 'single' && (
            <div className="space-y-4">
              <div className={`p-4 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-400/20'} border rounded-xl`}>
                <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold mb-1`}>
                  To Win
                </div>
                <div className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} text-3xl font-bold`}>
                  ${singleResult.toWin.toFixed(2)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                  <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mb-1`}>
                    Total Payout
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold`}>
                    ${singleResult.totalPayout.toFixed(2)}
                  </div>
                </div>
                <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                  <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mb-1`}>
                    Implied Prob.
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold`}>
                    {singleResult.impliedProbability.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parlay Results */}
          {mode === 'parlay' && (
            <div className="space-y-4">
              <div className={`p-4 ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-500/10 border-purple-400/20'} border rounded-xl`}>
                <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold mb-1`}>
                  Combined Odds
                </div>
                <div className={`${isLight ? 'text-purple-700' : 'text-purple-400'} text-3xl font-bold`}>
                  {parlayResult.totalOdds >= 0 ? '+' : ''}{parlayResult.totalOdds.toFixed(0)}
                </div>
              </div>

              <div className={`p-4 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-400/20'} border rounded-xl`}>
                <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold mb-1`}>
                  To Win
                </div>
                <div className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} text-3xl font-bold`}>
                  ${parlayResult.toWin.toFixed(2)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                  <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mb-1`}>
                    Total Payout
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold`}>
                    ${parlayResult.totalPayout.toFixed(2)}
                  </div>
                </div>
                <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                  <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mb-1`}>
                    Win Probability
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold`}>
                    {parlayResult.impliedProbability.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Arbitrage Results */}
          {mode === 'arbitrage' && (
            <div className="space-y-4">
              {arbResult.isArbitrage ? (
                <>
                  <div className={`p-4 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-400/20'} border rounded-xl`}>
                    <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold mb-1 flex items-center gap-2`}>
                      <TrendingUp className="w-4 h-4" />
                      Arbitrage Opportunity Found!
                    </div>
                    <div className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} text-3xl font-bold`}>
                      ${arbResult.profit.toFixed(2)}
                    </div>
                    <div className={`${isLight ? 'text-emerald-600' : 'text-emerald-300'} text-sm font-bold mt-1`}>
                      {arbResult.roi.toFixed(2)}% ROI
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                      <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mb-1`}>
                        Stake on Outcome 1
                      </div>
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold`}>
                        ${arbResult.stake1.toFixed(2)}
                      </div>
                    </div>
                    <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}>
                      <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mb-1`}>
                        Stake on Outcome 2
                      </div>
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold`}>
                        ${arbResult.stake2.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`p-6 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl text-center`}>
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${isLight ? 'bg-gray-200' : 'bg-white/5'} flex items-center justify-center`}>
                    <ArrowRightLeft className={`w-6 h-6 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold mb-1`}>
                    No Arbitrage Found
                  </div>
                  <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold`}>
                    These odds don't create an arbitrage opportunity
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}