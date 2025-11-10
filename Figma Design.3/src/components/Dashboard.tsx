import { BarChart2, TrendingUp, Crown, LogOut, User, Home, Filter, Search, ChevronDown, Calendar, DollarSign, Target, Sparkles, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Zap, BarChart, Settings } from 'lucide-react';
import { useState } from 'react';
import { PicksPage } from './PicksPage';
import { OddsPage } from './OddsPage';
import { AccountPage } from './AccountPage';
import { SettingsPage } from './SettingsPage';

interface DashboardProps {
  onSignOut: () => void;
}

export function Dashboard({ onSignOut }: DashboardProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [currentView, setCurrentView] = useState<'dashboard' | 'picks' | 'odds' | 'account' | 'settings'>('dashboard');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      <div className="relative flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-72 border-r border-white/10 bg-slate-950/30 backdrop-blur-2xl">
          <div className="flex-1 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <span className="text-white font-bold">OS</span>
                </div>
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent font-bold">OddSightSeer</span>
              </div>
            </div>

            {/* User Profile */}
            <div className="p-6 border-b border-white/10">
              <button 
                onClick={() => setCurrentView('account')}
                className="w-full p-4 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-transparent backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-purple-500/10 hover:border-purple-400/30 hover:shadow-purple-500/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-400/30 flex items-center justify-center backdrop-blur-xl shadow-lg shadow-purple-500/20">
                    <User className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-bold">NotVic</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-md backdrop-blur-xl">
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400 font-bold text-xs">Platinum</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-transparent backdrop-blur-xl border border-purple-400/30 text-white shadow-lg shadow-purple-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10'
                }`}
              >
                <Home className="w-5 h-5" />
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('odds')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === 'odds'
                    ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-transparent backdrop-blur-xl border border-purple-400/30 text-white shadow-lg shadow-purple-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10'
                }`}
              >
                <Zap className="w-5 h-5" />
                Odds
              </button>
              <button 
                onClick={() => setCurrentView('picks')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === 'picks'
                    ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-transparent backdrop-blur-xl border border-purple-400/30 text-white shadow-lg shadow-purple-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10'
                }`}
              >
                <Target className="w-5 h-5" />
                My Picks
              </button>
              <button 
                onClick={() => setCurrentView('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === 'settings'
                    ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-transparent backdrop-blur-xl border border-purple-400/30 text-white shadow-lg shadow-purple-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10'
                }`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>
              <button 
                onClick={() => setCurrentView('account')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === 'account'
                    ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-transparent backdrop-blur-xl border border-purple-400/30 text-white shadow-lg shadow-purple-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10'
                }`}
              >
                <User className="w-5 h-5" />
                Account
              </button>
            </nav>

            {/* Sign Out */}
            <div className="p-6 border-t border-white/10">
              <button 
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 backdrop-blur-xl border border-red-400/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all font-bold shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {/* Mobile Header */}
          <header className="lg:hidden px-4 py-4 border-b border-white/10 bg-slate-950/30 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <span className="text-white font-bold">OS</span>
                </div>
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent font-bold">OddSightSeer</span>
              </div>
              <button 
                onClick={onSignOut}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 backdrop-blur-xl border border-red-400/30 text-red-400 rounded-lg font-bold text-sm shadow-lg shadow-red-500/10"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-8 pb-24 lg:pb-8">
            {/* Conditional Content Rendering */}
            {currentView === 'dashboard' && (
              <>
                {/* Header Section */}
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">Welcome back, NotVic!</h1>
                      <p className="text-white/60 font-bold">Here are your recommended picks for today</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold shadow-lg hover:shadow-purple-500/10 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Today</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {stats.map((stat, idx) => (
                      <div 
                        key={idx}
                        className="group p-4 md:p-6 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-xl md:rounded-2xl hover:border-purple-400/40 transition-all shadow-lg hover:shadow-purple-500/20"
                      >
                        <div className="flex items-start justify-between mb-3 md:mb-4">
                          <div className="p-2 md:p-2.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-lg md:rounded-xl border border-purple-400/30 shadow-lg shadow-purple-500/20">
                            <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-purple-300" />
                          </div>
                          <div className={`flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-lg font-bold text-xs backdrop-blur-xl ${
                            stat.positive 
                              ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shadow-lg shadow-emerald-500/10' 
                              : 'bg-red-500/20 border border-red-400/30 text-red-300 shadow-lg shadow-red-500/10'
                          }`}>
                            {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span className="hidden sm:inline">{stat.change}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-white text-xl md:text-2xl font-bold">{stat.value}</div>
                          <div className="text-white/50 text-xs md:text-sm font-bold uppercase tracking-wide">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input 
                      type="text"
                      placeholder="Search games or teams..."
                      className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white placeholder:text-white/40 rounded-xl focus:outline-none focus:border-purple-400/40 focus:bg-white/10 font-bold transition-all shadow-lg text-sm"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                    <button className="flex items-center gap-2 px-4 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-purple-400/30 transition-all font-bold shadow-lg whitespace-nowrap text-sm">
                      <Filter className="w-4 h-4" />
                      <span>Sport</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-purple-400/30 transition-all font-bold shadow-lg whitespace-nowrap text-sm">
                      <span>EV Range</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bets Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <h2 className="text-white font-bold">Top Picks</h2>
                      <span className="px-2.5 md:px-3 py-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 rounded-lg text-purple-300 font-bold text-xs shadow-lg shadow-purple-500/10">
                        {bets.length} Available
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                      <button className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/40 text-purple-300 rounded-lg font-bold text-sm hover:from-purple-500/30 hover:to-indigo-500/30 transition-all shadow-lg shadow-purple-500/20 whitespace-nowrap">
                        All
                      </button>
                      <button className="px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/5 backdrop-blur-xl rounded-lg font-bold text-sm transition-all border border-transparent hover:border-white/10 whitespace-nowrap">
                        NBA
                      </button>
                      <button className="px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/5 backdrop-blur-xl rounded-lg font-bold text-sm transition-all border border-transparent hover:border-white/10 whitespace-nowrap">
                        NFL
                      </button>
                    </div>
                  </div>

                  {/* Bet Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {bets.map((bet) => (
                      <div 
                        key={bet.id}
                        className="group bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-400/40 transition-all shadow-xl hover:shadow-purple-500/20"
                      >
                        {/* Card Header */}
                        <div className="p-5 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                          <div className="mb-3">
                            <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 text-purple-300 rounded-lg font-bold text-xs shadow-lg shadow-purple-500/10">
                              {bet.sport}
                            </span>
                          </div>
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
                            <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/90 to-green-500/90 backdrop-blur-xl rounded-lg shadow-lg shadow-emerald-500/30 border border-emerald-400/30">
                              <span className="text-white font-bold text-sm">{bet.ev}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 space-y-4">
                          {/* Pick Display */}
                          <div className="text-center p-4 bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 backdrop-blur-xl border border-purple-400/30 rounded-xl shadow-lg shadow-purple-500/10">
                            <div className="text-purple-300 font-bold uppercase tracking-wide mb-2 text-sm">
                              Recommended Pick
                            </div>
                            <div className="text-white text-xl font-bold">
                              {bet.pick}
                            </div>
                          </div>

                          {/* Odds & Sportsbook */}
                          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 shadow-lg">
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
                            <button className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm shadow-lg">
                              Compare Odds
                            </button>
                            <button className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 border border-purple-400/30">
                              Place Bet
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentView === 'picks' && <PicksPage />}
            {currentView === 'odds' && <OddsPage />}
            {currentView === 'account' && <AccountPage onNavigateToSettings={() => setCurrentView('settings')} />}
            {currentView === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 pb-4">
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-full px-3 py-3 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-around gap-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                currentView === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 backdrop-blur-xl border border-purple-400/40 shadow-lg shadow-purple-500/20'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              <Home className={`w-5 h-5 ${currentView === 'dashboard' ? 'text-purple-300' : ''}`} />
              <span className={`text-xs font-bold ${currentView === 'dashboard' ? 'text-white' : ''}`}>
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setCurrentView('odds')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                currentView === 'odds'
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 backdrop-blur-xl border border-purple-400/40 shadow-lg shadow-purple-500/20'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              <Zap className={`w-5 h-5 ${currentView === 'odds' ? 'text-purple-300' : ''}`} />
              <span className={`text-xs font-bold ${currentView === 'odds' ? 'text-white' : ''}`}>
                Odds
              </span>
            </button>
            <button
              onClick={() => setCurrentView('picks')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                currentView === 'picks'
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 backdrop-blur-xl border border-purple-400/40 shadow-lg shadow-purple-500/20'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              <Target className={`w-5 h-5 ${currentView === 'picks' ? 'text-purple-300' : ''}`} />
              <span className={`text-xs font-bold ${currentView === 'picks' ? 'text-white' : ''}`}>
                My Picks
              </span>
            </button>
            <button
              onClick={() => setCurrentView('account')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                currentView === 'account'
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 backdrop-blur-xl border border-purple-400/40 shadow-lg shadow-purple-500/20'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              <User className={`w-5 h-5 ${currentView === 'account' ? 'text-purple-300' : ''}`} />
              <span className={`text-xs font-bold ${currentView === 'account' ? 'text-white' : ''}`}>
                Account
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}