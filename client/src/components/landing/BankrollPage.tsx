import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, Minus, Target, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useState } from 'react';
import { useTheme, lightModeColors } from '../contexts/ThemeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'win' | 'loss';
  amount: number;
  date: string;
  description: string;
}

interface BetHistory {
  id: number;
  date: string;
  game: string;
  stake: number;
  result: 'win' | 'loss' | 'pending';
  profit: number;
}

type BankrollStrategy = 'flat' | 'kelly' | 'percentage';

export function BankrollPage() {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  
  const [currentBankroll, setCurrentBankroll] = useState(5000);
  const [startingBankroll] = useState(3000);
  const [strategy, setStrategy] = useState<BankrollStrategy>('flat');
  const [flatBetAmount, setFlatBetAmount] = useState('50');
  const [percentageBet, setPercentageBet] = useState('2');
  const [kellyFraction, setKellyFraction] = useState('0.5');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState('');

  // Mock transaction history
  const transactions: Transaction[] = [
    { id: 1, type: 'deposit', amount: 3000, date: '2024-11-01', description: 'Initial deposit' },
    { id: 2, type: 'win', amount: 450, date: '2024-11-05', description: 'NBA - Lakers ML' },
    { id: 3, type: 'loss', amount: -100, date: '2024-11-06', description: 'NFL - Cowboys spread' },
    { id: 4, type: 'win', amount: 320, date: '2024-11-08', description: 'NHL - Bruins ML' },
    { id: 5, type: 'deposit', amount: 1000, date: '2024-11-09', description: 'Additional deposit' },
    { id: 6, type: 'win', amount: 280, date: '2024-11-10', description: 'NBA - Celtics spread' },
    { id: 7, type: 'win', amount: 150, date: '2024-11-11', description: 'NFL - Chiefs Over' },
  ];

  // Mock bankroll history for chart
  const bankrollHistory = [
    { date: 'Nov 1', balance: 3000 },
    { date: 'Nov 2', balance: 3200 },
    { date: 'Nov 3', balance: 3150 },
    { date: 'Nov 4', balance: 3400 },
    { date: 'Nov 5', balance: 3850 },
    { date: 'Nov 6', balance: 3750 },
    { date: 'Nov 7', balance: 3900 },
    { date: 'Nov 8', balance: 4220 },
    { date: 'Nov 9', balance: 5220 },
    { date: 'Nov 10', balance: 5500 },
    { date: 'Nov 11', balance: 5000 },
  ];

  // Mock betting history
  const bettingHistory: BetHistory[] = [
    { id: 1, date: '2024-11-11', game: 'Chiefs @ Broncos', stake: 100, result: 'pending', profit: 0 },
    { id: 2, date: '2024-11-10', game: 'Celtics @ Magic', stake: 50, result: 'win', profit: 45 },
    { id: 3, date: '2024-11-09', game: 'Lakers @ Warriors', stake: 50, result: 'win', profit: 55 },
    { id: 4, date: '2024-11-08', game: 'Bruins @ Rangers', stake: 75, result: 'win', profit: 68 },
    { id: 5, date: '2024-11-07', game: 'Cowboys @ Giants', stake: 100, result: 'loss', profit: -100 },
  ];

  const totalProfit = currentBankroll - startingBankroll;
  const roi = ((totalProfit / startingBankroll) * 100);
  const wins = bettingHistory.filter(b => b.result === 'win').length;
  const losses = bettingHistory.filter(b => b.result === 'loss').length;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  // Calculate recommended bet size based on strategy
  const getRecommendedBet = () => {
    switch (strategy) {
      case 'flat':
        return parseFloat(flatBetAmount) || 0;
      case 'percentage':
        return (currentBankroll * (parseFloat(percentageBet) / 100)) || 0;
      case 'kelly':
        // Simplified Kelly: (edge / odds) * bankroll * kelly fraction
        // Using mock values: 5% edge, -110 odds
        const edge = 0.05;
        const kellyPercent = edge * parseFloat(kellyFraction);
        return currentBankroll * kellyPercent;
      default:
        return 0;
    }
  };

  const recommendedBet = getRecommendedBet();

  const handleAddFunds = (type: 'deposit' | 'withdrawal') => {
    const amount = parseFloat(fundAmount);
    if (!isNaN(amount) && amount > 0) {
      if (type === 'deposit') {
        setCurrentBankroll(prev => prev + amount);
      } else {
        if (amount <= currentBankroll) {
          setCurrentBankroll(prev => prev - amount);
        }
      }
      setFundAmount('');
      setShowAddFunds(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-2xl md:text-3xl mb-2`}>
          Bankroll Management
        </h2>
        <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>
          Track your betting budget and optimize your stake sizing
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/30'} backdrop-blur-xl rounded-lg border`}>
              <Wallet className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-300'}`} />
            </div>
            <span className={`${isLight ? lightModeColors.textLight : 'text-white/50'} font-bold text-xs uppercase tracking-wide`}>
              Current Bankroll
            </span>
          </div>
          <div className={`${isLight ? lightModeColors.text : 'text-white'} text-3xl font-bold`}>
            ${currentBankroll.toLocaleString()}
          </div>
        </div>

        <div className={`p-5 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 ${isLight ? 'bg-emerald-100 border-emerald-200' : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'} backdrop-blur-xl rounded-lg border`}>
              {totalProfit >= 0 ? (
                <TrendingUp className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-300'}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
              )}
            </div>
            <span className={`${isLight ? lightModeColors.textLight : 'text-white/50'} font-bold text-xs uppercase tracking-wide`}>
              Total P&L
            </span>
          </div>
          <div className={`${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} text-3xl font-bold`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}
          </div>
          <div className={`${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} text-sm font-bold mt-1`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
          </div>
        </div>

        <div className={`p-5 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 ${isLight ? 'bg-blue-100 border-blue-200' : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/30'} backdrop-blur-xl rounded-lg border`}>
              <Target className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-300'}`} />
            </div>
            <span className={`${isLight ? lightModeColors.textLight : 'text-white/50'} font-bold text-xs uppercase tracking-wide`}>
              Win Rate
            </span>
          </div>
          <div className={`${isLight ? lightModeColors.text : 'text-white'} text-3xl font-bold`}>
            {winRate.toFixed(1)}%
          </div>
          <div className={`${isLight ? lightModeColors.textMuted : 'text-white/50'} text-sm font-bold mt-1`}>
            {wins}W - {losses}L
          </div>
        </div>

        <div className={`p-5 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 ${isLight ? 'bg-amber-100 border-amber-200' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30'} backdrop-blur-xl rounded-lg border`}>
              <DollarSign className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-300'}`} />
            </div>
            <span className={`${isLight ? lightModeColors.textLight : 'text-white/50'} font-bold text-xs uppercase tracking-wide`}>
              Recommended Bet
            </span>
          </div>
          <div className={`${isLight ? lightModeColors.text : 'text-white'} text-3xl font-bold`}>
            ${recommendedBet.toFixed(0)}
          </div>
          <div className={`${isLight ? lightModeColors.textMuted : 'text-white/50'} text-sm font-bold mt-1`}>
            {strategy === 'flat' && 'Flat Betting'}
            {strategy === 'percentage' && `${percentageBet}% of Bankroll`}
            {strategy === 'kelly' && 'Kelly Criterion'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowAddFunds(!showAddFunds)}
          className={`px-6 py-3 ${isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-300 hover:from-purple-200 hover:to-indigo-200' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-white hover:from-purple-500/30 hover:to-indigo-500/30'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm flex items-center gap-2`}
        >
          <Plus className="w-4 h-4" />
          Add/Withdraw Funds
        </button>
      </div>

      {/* Add/Withdraw Funds Section */}
      {showAddFunds && (
        <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg mb-4`}>
            Manage Funds
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                Amount ($)
              </label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
                className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
              />
            </div>
            <div className="flex gap-2 items-end">
              <button
                onClick={() => handleAddFunds('deposit')}
                className={`flex-1 px-4 py-3 ${isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/30 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
              >
                Deposit
              </button>
              <button
                onClick={() => handleAddFunds('withdrawal')}
                className={`flex-1 px-4 py-3 ${isLight ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200' : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/30 text-red-400 hover:from-red-500/30 hover:to-orange-500/30'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bankroll Chart */}
      <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
        <div className="flex items-center gap-2 mb-6">
          <Activity className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg`}>
            Bankroll History
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={bankrollHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)'} />
            <XAxis 
              dataKey="date" 
              stroke={isLight ? '#6b7280' : 'rgba(255,255,255,0.5)'}
              style={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <YAxis 
              stroke={isLight ? '#6b7280' : 'rgba(255,255,255,0.5)'}
              style={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: isLight ? '#fff' : 'rgba(15, 23, 42, 0.9)',
                border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontWeight: 'bold',
                backdropFilter: 'blur(12px)'
              }}
              labelStyle={{ color: isLight ? '#111827' : '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke={isLight ? '#8b5cf6' : '#a78bfa'} 
              strokeWidth={3}
              dot={{ fill: isLight ? '#8b5cf6' : '#a78bfa', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Betting Strategy */}
        <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg mb-4`}>
            Betting Strategy
          </h3>

          <div className="space-y-4">
            {/* Strategy Selection */}
            <div>
              <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                Select Strategy
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setStrategy('flat')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    strategy === 'flat'
                      ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                      : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Flat Betting
                </button>
                <button
                  onClick={() => setStrategy('percentage')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    strategy === 'percentage'
                      ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                      : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Percentage of Bankroll
                </button>
                <button
                  onClick={() => setStrategy('kelly')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    strategy === 'kelly'
                      ? isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300' : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/30'
                      : isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Kelly Criterion
                </button>
              </div>
            </div>

            {/* Strategy Parameters */}
            {strategy === 'flat' && (
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  Flat Bet Amount ($)
                </label>
                <input
                  type="number"
                  value={flatBetAmount}
                  onChange={(e) => setFlatBetAmount(e.target.value)}
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-white/5 border-white/10 text-white'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
              </div>
            )}

            {strategy === 'percentage' && (
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  Percentage of Bankroll (%)
                </label>
                <input
                  type="number"
                  value={percentageBet}
                  onChange={(e) => setPercentageBet(e.target.value)}
                  step="0.5"
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-white/5 border-white/10 text-white'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
                <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mt-2`}>
                  Recommended: 1-5% for conservative, 5-10% for aggressive
                </p>
              </div>
            )}

            {strategy === 'kelly' && (
              <div>
                <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
                  Kelly Fraction
                </label>
                <input
                  type="number"
                  value={kellyFraction}
                  onChange={(e) => setKellyFraction(e.target.value)}
                  step="0.1"
                  min="0"
                  max="1"
                  className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-white/5 border-white/10 text-white'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
                />
                <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mt-2`}>
                  Fractional Kelly (0.25-0.5) recommended to reduce variance
                </p>
              </div>
            )}

            {/* Recommended Bet Display */}
            <div className={`p-4 ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-400/20'} border rounded-xl`}>
              <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mb-1`}>
                Your Next Bet Should Be
              </div>
              <div className={`${isLight ? 'text-purple-700' : 'text-purple-400'} text-2xl font-bold`}>
                ${recommendedBet.toFixed(2)}
              </div>
              <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mt-1`}>
                {((recommendedBet / currentBankroll) * 100).toFixed(2)}% of bankroll
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg mb-4`}>
            Recent Activity
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {transactions.slice().reverse().map((transaction) => (
              <div
                key={transaction.id}
                className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'} border rounded-xl`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'deposit' ? isLight ? 'bg-emerald-100 border-emerald-200' : 'bg-emerald-500/10 border-emerald-400/20'
                      : transaction.type === 'withdrawal' ? isLight ? 'bg-red-100 border-red-200' : 'bg-red-500/10 border-red-400/20'
                      : transaction.type === 'win' ? isLight ? 'bg-blue-100 border-blue-200' : 'bg-blue-500/10 border-blue-400/20'
                      : isLight ? 'bg-gray-100 border-gray-200' : 'bg-gray-500/10 border-gray-400/20'
                    } border`}>
                      {transaction.type === 'deposit' && <Plus className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />}
                      {transaction.type === 'withdrawal' && <Minus className={`w-4 h-4 ${isLight ? 'text-red-600' : 'text-red-400'}`} />}
                      {transaction.type === 'win' && <ArrowUpRight className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />}
                      {transaction.type === 'loss' && <ArrowDownRight className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />}
                    </div>
                    <div>
                      <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>
                        {transaction.description}
                      </div>
                      <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold mt-1`}>
                        {new Date(transaction.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${
                    transaction.amount >= 0 
                      ? 'text-emerald-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/20'} border rounded-xl`}>
          <div className={`${isLight ? 'text-blue-700' : 'text-blue-400'} font-bold text-sm mb-2 flex items-center gap-2`}>
            <AlertCircle className="w-4 h-4" />
            Bankroll Management Tips
          </div>
          <ul className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold space-y-1 list-disc list-inside`}>
            <li>Never bet more than you can afford to lose</li>
            <li>Keep at least 20-40 units in your bankroll</li>
            <li>Track every bet to analyze your performance</li>
            <li>Adjust bet sizes as your bankroll grows or shrinks</li>
          </ul>
        </div>
        
        <div className={`p-4 ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-400/20'} border rounded-xl`}>
          <div className={`${isLight ? 'text-purple-700' : 'text-purple-400'} font-bold text-sm mb-2 flex items-center gap-2`}>
            <Target className="w-4 h-4" />
            Strategy Recommendations
          </div>
          <ul className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-xs font-bold space-y-1 list-disc list-inside`}>
            <li>Flat betting: Simple and conservative approach</li>
            <li>Percentage: Grows with bankroll, limits drawdowns</li>
            <li>Kelly: Optimizes growth but requires accurate edge estimates</li>
            <li>Use fractional Kelly (25-50%) to reduce volatility</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
