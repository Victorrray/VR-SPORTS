import { BarChart2, TrendingUp, Crown, LogOut, User, Home, Filter, Search, ChevronDown, Calendar, DollarSign, Target, Sparkles, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface DashboardProps {
  onSignOut: () => void;
}

export function Dashboard({ onSignOut }: DashboardProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');

  const stats = [
    { 
      label: 'Win Rate', 
      value: '67.3%', 
      change: '+5.2%',
      positive: true,
      icon: Target
    },
    { 
      label: 'Average Edge', 
      value: '4.8%', 
      change: '+0.3%',
      positive: true,
      icon: TrendingUp
    },
    { 
      label: 'Total Profit', 
      value: '$3,247', 
      change: '+$892',
      positive: true,
      icon: DollarSign
    },
    { 
      label: 'Active Bets', 
      value: '12', 
      change: '3 today',
      positive: true,
      icon: Sparkles
    },
  ];

  const bets = [
    {
      id: 1,
      teams: 'Detroit Pistons @ Philadelphia 76ers',
      time: 'Sun, Nov 10 4:41 PM PST',
      pick: 'Detroit Pistons -3.5',
      odds: '-118',
      sportsbook: 'DraftKings',
      ev: '+8.2%',
      sport: 'NBA',
      status: 'active',
      confidence: 'High'
    },
    {
      id: 2,
      teams: 'Lakers @ Warriors',
      time: 'Sun, Nov 10 7:00 PM PST',
      pick: 'Over 228.5',
      odds: '-110',
      sportsbook: 'FanDuel',
      ev: '+6.5%',
      sport: 'NBA',
      status: 'active',
      confidence: 'Medium'
    },
    {
      id: 3,
      teams: 'Cowboys @ Giants',
      time: 'Sun, Nov 10 1:00 PM EST',
      pick: 'Cowboys -7.5',
      odds: '-115',
      sportsbook: 'BetMGM',
      ev: '+5.8%',
      sport: 'NFL',
      status: 'active',
      confidence: 'High'
    },
    {
      id: 4,
      teams: 'Celtics @ Heat',
      time: 'Mon, Nov 11 7:30 PM EST',
      pick: 'Celtics ML',
      odds: '-125',
      sportsbook: 'Caesars',
      ev: '+4.3%',
      sport: 'NBA',
      status: 'upcoming',
      confidence: 'Medium'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      <div className="relative flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-72 border-r border-white/5 bg-slate-950/40 backdrop-blur-xl">
          <div className="flex-1 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <span className="text-white font-bold">OS</span>
                </div>
                <span className="text-white font-bold">OddSightSeer</span>
              </div>
            </div>

            {/* User Profile */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold">NotVic</div>
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400 font-bold text-xs">Platinum</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2">
              <a href="#" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-xl text-white font-bold transition-all">
                <Home className="w-5 h-5" />
                Dashboard
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
                <BarChart2 className="w-5 h-5" />
                Analytics
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
                <Clock className="w-5 h-5" />
                Bet History
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
                <User className="w-5 h-5" />
                Account
              </a>
            </nav>

            {/* Sign Out */}
            <div className="p-6 border-t border-white/5">
              <button 
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all font-bold"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <header className="lg:hidden px-4 py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <span className="text-white font-bold">OS</span>
                </div>
                <span className="text-white font-bold">OddSightSeer</span>
              </div>
              <button 
                onClick={onSignOut}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-bold text-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-8">
            {/* Header Section */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">Welcome back, NotVic!</h1>
                  <p className="text-white/60 font-bold">Here are your recommended picks for today</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 border border-white/10 text-white rounded-xl hover:bg-slate-800/60 transition-all font-bold">
                    <Calendar className="w-4 h-4" />
                    Today
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                  <div 
                    key={idx}
                    className="group p-5 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <stat.icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs ${
                        stat.positive 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {stat.change}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-white text-2xl font-bold">{stat.value}</div>
                      <div className="text-white/50 text-sm font-bold uppercase tracking-wide">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  type="text"
                  placeholder="Search games or teams..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:border-purple-500/30 font-bold transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-white/10 text-white rounded-xl hover:bg-slate-800/60 transition-all font-bold">
                  <Filter className="w-4 h-4" />
                  Sport
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-white/10 text-white rounded-xl hover:bg-slate-800/60 transition-all font-bold">
                  EV Range
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bets Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h2 className="text-white font-bold">Top Picks</h2>
                  <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 font-bold text-xs">
                    {bets.length} Available
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg font-bold text-sm hover:bg-purple-500/30 transition-all">
                    All
                  </button>
                  <button className="px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition-all">
                    NBA
                  </button>
                  <button className="px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg font-bold text-sm transition-all">
                    NFL
                  </button>
                </div>
              </div>

              {/* Bet Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {bets.map((bet) => (
                  <div 
                    key={bet.id}
                    className="group bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all"
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b border-white/5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-bold mb-1.5">
                            {bet.teams}
                          </h3>
                          <div className="flex items-center gap-2 text-white/50 text-sm font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {bet.time}
                          </div>
                        </div>
                        <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg shadow-amber-500/20">
                          <span className="text-white font-bold text-sm">{bet.ev}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg font-bold text-xs">
                          {bet.sport}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                          bet.confidence === 'High' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                        }`}>
                          {bet.confidence} Confidence
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-4">
                      {/* Pick Display */}
                      <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl">
                        <div className="text-purple-400 font-bold uppercase tracking-wide mb-2">
                          Recommended Pick
                        </div>
                        <div className="text-white text-xl font-bold">
                          {bet.pick}
                        </div>
                      </div>

                      {/* Odds & Sportsbook */}
                      <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-white/5">
                        <div>
                          <div className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">
                            Sportsbook
                          </div>
                          <div className="text-white font-bold">{bet.sportsbook}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">
                            Odds
                          </div>
                          <div className="text-white text-xl font-bold">{bet.odds}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button className="px-4 py-3 bg-slate-800/60 border border-white/10 text-white rounded-xl hover:bg-slate-700/60 transition-all font-bold text-sm group-hover:border-white/20">
                          Compare Odds
                        </button>
                        <button className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
                          Place Bet
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
