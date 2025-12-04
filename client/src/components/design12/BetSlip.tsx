import { X, DollarSign, TrendingUp, Check, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useBankroll } from '../../contexts/BankrollContext';
import { formatOdds as convertOdds } from '../../utils/oddsConverter';

interface BetSlipProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (betAmount: number) => void;
  betData: {
    teams?: string;
    pick?: string;
    odds?: string | number;
    sportsbook?: string;
    ev?: string;
    sport?: string;
  } | null;
}

export function BetSlip({ isOpen, onClose, onConfirm, betData }: BetSlipProps) {
  const { colorMode, oddsFormat } = useTheme();
  const isLight = colorMode === 'light';
  
  // Format odds based on user's selected format
  const formatOdds = (odds: string | number): string => convertOdds(odds, oddsFormat);
  const { currentBankroll, kellyFraction: globalKellyFraction } = useBankroll();
  const [betAmount, setBetAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kellyFraction, setKellyFraction] = useState<number>(parseFloat(globalKellyFraction) || 0.5);

  // Reset bet amount when modal opens with new bet
  useEffect(() => {
    if (isOpen) {
      setBetAmount('');
      setIsSubmitting(false);
    }
  }, [isOpen, betData]);

  if (!isOpen || !betData) return null;

  const handleConfirm = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    setIsSubmitting(true);
    onConfirm(amount);
  };

  const calculatePotentialWin = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return '0.00';
    
    // Handle odds as either string or number
    const oddsStr = String(betData.odds || '0');
    const oddsNum = parseInt(oddsStr.replace('+', ''));
    if (isNaN(oddsNum)) return '0.00';
    
    let multiplier = 1;
    
    if (oddsNum > 0) {
      // Positive odds: +200 means you win $200 on $100 bet
      multiplier = oddsNum / 100;
    } else {
      // Negative odds: -150 means you bet $150 to win $100
      multiplier = 100 / Math.abs(oddsNum);
    }
    
    const profit = amount * multiplier;
    const total = amount + profit;
    return total.toFixed(2);
  };

  const calculateProfit = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return '0.00';
    
    const total = parseFloat(calculatePotentialWin());
    const profit = total - amount;
    return profit.toFixed(2);
  };

  const calculateKellyBet = () => {
    // Parse EV - remove % sign if present and convert to decimal (e.g., "102.58%" -> 1.0258)
    const evString = String(betData?.ev || '0').replace('%', '').replace('+', '');
    const evPercent = parseFloat(evString);
    if (isNaN(evPercent) || evPercent <= 0) return 0;
    
    const ev = evPercent / 100; // Convert percentage to decimal
    
    // Parse odds - handle both string and number formats
    const oddsStr = String(betData?.odds || '0').replace('+', '');
    const oddsNum = parseInt(oddsStr);
    if (isNaN(oddsNum) || oddsNum === 0) return 0;
    
    let decimalOdds = 2; // Default to even odds
    
    if (oddsNum > 0) {
      // Positive odds: +200 means you win $200 on a $100 bet
      decimalOdds = 1 + (oddsNum / 100);
    } else {
      // Negative odds: -150 means you need to bet $150 to win $100
      decimalOdds = 1 + (100 / Math.abs(oddsNum));
    }
    
    // Kelly formula: f* = (bp - q) / b where b = decimal odds - 1, p = win probability, q = 1 - p
    // Simplified with EV: f* = EV / (decimal odds - 1)
    const b = decimalOdds - 1;
    if (b <= 0) return 0;
    
    const kellyBet = ev / b;
    const recommendedBet = kellyBet * kellyFraction * currentBankroll;
    
    // Cap at 25% of bankroll for safety, ensure non-negative
    const result = Math.min(Math.max(recommendedBet, 0), currentBankroll * 0.25);
    return isNaN(result) ? 0 : result;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <div 
          className={`w-full md:max-w-lg ${isLight ? 'bg-white' : 'bg-gray-900'} md:rounded-2xl rounded-t-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
            <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-xl`}>
              Place Bet
            </h2>
            <button
              onClick={onClose}
              className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-xl transition-all`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Bet Details Card */}
            <div className={`${isLight ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200' : 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-400/20'} border rounded-xl p-4 space-y-3`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base mb-1`}>
                    {betData.teams || 'Game'}
                  </div>
                  <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm`}>
                    {betData.sport || 'Sport'}
                  </div>
                </div>
                <div className={`px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border ${isLight ? 'border-emerald-300' : 'border-emerald-400/30'} rounded-full`}>
                  <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-400'} font-bold text-sm`}>
                    {betData.ev || '--'}
                  </span>
                </div>
              </div>

              <div className={`h-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />

              {/* Pick with Odds Badge */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs mb-1`}>
                    Pick
                  </div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-base`}>
                    {betData.pick || 'Pick'}
                  </div>
                </div>
                <div className={`px-4 py-2 ${isLight ? 'bg-purple-100 border-purple-300' : 'bg-purple-500/20 border-purple-400/30'} border rounded-xl`}>
                  <span className={`${isLight ? 'text-purple-700' : 'text-purple-300'} font-bold text-lg`}>
                    {formatOdds(betData.odds || 0)}
                  </span>
                </div>
              </div>

              <div className={`h-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />

              {/* Sportsbook */}
              <div className="flex items-center justify-between">
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-medium`}>
                  Sportsbook
                </div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>
                  {betData.sportsbook || 'Sportsbook'}
                </div>
              </div>
            </div>

            {/* Recommended Bet Amount - Kelly Criterion */}
            <div className={`${isLight ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200' : 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-400/20'} border rounded-xl p-4 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
                  <span className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm`}>
                    Recommended Bet
                  </span>
                </div>
                <button
                  onClick={() => setBetAmount(calculateKellyBet().toFixed(2))}
                  className={`px-3 py-1.5 ${isLight ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300' : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-400/30'} border rounded-full font-bold text-xs transition-all`}
                >
                  Use This Amount
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`${isLight ? 'text-indigo-900' : 'text-white'} font-bold text-3xl`}>
                  ${calculateKellyBet().toFixed(2)}
                </span>
                <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>
                  ({currentBankroll > 0 ? ((calculateKellyBet() / currentBankroll) * 100).toFixed(1) : '0.0'}% of bankroll)
                </span>
              </div>

              <div className={`h-px ${isLight ? 'bg-gray-200' : 'bg-white/10'}`} />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold text-xs`}>
                    Kelly Fraction
                  </span>
                  <div className="flex items-center gap-1">
                    <Info className={`w-3.5 h-3.5 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
                    <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>
                      Lower = More Conservative
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setKellyFraction(0.25)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                      kellyFraction === 0.25
                        ? isLight
                          ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700'
                          : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400/50 text-white'
                        : isLight
                        ? 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    1/4
                  </button>
                  <button
                    onClick={() => setKellyFraction(0.5)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                      kellyFraction === 0.5
                        ? isLight
                          ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700'
                          : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400/50 text-white'
                        : isLight
                        ? 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    1/2
                  </button>
                  <button
                    onClick={() => setKellyFraction(0.75)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                      kellyFraction === 0.75
                        ? isLight
                          ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700'
                          : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400/50 text-white'
                        : isLight
                        ? 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    3/4
                  </button>
                  <button
                    onClick={() => setKellyFraction(1)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                      kellyFraction === 1
                        ? isLight
                          ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700'
                          : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400/50 text-white'
                        : isLight
                        ? 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    Full
                  </button>
                </div>
              </div>

              <div className={`${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-400/20'} border rounded-xl p-3`}>
                <div className="flex items-start gap-2">
                  <Info className={`w-4 h-4 mt-0.5 ${isLight ? 'text-blue-600' : 'text-blue-400'} flex-shrink-0`} />
                  <div className={`${isLight ? 'text-blue-700' : 'text-blue-300'} text-xs`}>
                    <span className="font-bold">Kelly Criterion</span> suggests optimal bet sizing based on your edge and bankroll to maximize long-term growth.
                  </div>
                </div>
              </div>
            </div>

            {/* Bet Amount Input */}
            <div>
              <label className={`block ${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2`}>
                Bet Amount
              </label>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full pl-12 pr-4 py-3 ${
                    isLight 
                      ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20' 
                      : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-purple-400 focus:ring-purple-400/20'
                  } border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold text-lg`}
                  autoFocus
                />
              </div>
            </div>

            {/* Potential Returns */}
            {betAmount && parseFloat(betAmount) > 0 && (
              <div className={`${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm`}>
                    Potential Profit
                  </span>
                  <span className={`${isLight ? 'text-emerald-600' : 'text-emerald-400'} font-bold text-base`}>
                    ${calculateProfit()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm`}>
                    Total Payout
                  </span>
                  <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>
                    ${calculatePotentialWin()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} space-y-3`}>
            <button
              onClick={handleConfirm}
              disabled={!betAmount || parseFloat(betAmount) <= 0 || isSubmitting}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                !betAmount || parseFloat(betAmount) <= 0 || isSubmitting
                  ? isLight
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Check className="w-5 h-5" />
                  Adding to My Picks...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm & Add to My Picks
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className={`w-full py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-bold text-base transition-all`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}