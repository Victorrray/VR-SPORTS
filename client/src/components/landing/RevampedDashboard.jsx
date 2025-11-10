import { BarChart2, TrendingUp, Crown, LogOut, User, Home, Filter, Search, ChevronDown, Calendar, DollarSign, Target, Sparkles, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/SimpleAuth';

export function RevampedDashboard() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth() || {};

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
      navigate('/?signed_out=true');
    }
  };

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
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
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
                  <div className="text-white font-bold">{user?.email?.split('@')[0] || 'User'}</div>
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400 font-bold text-xs">{profile?.plan?.toUpperCase() || 'FREE'}</span>
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
              <a href="/sportsbooks" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
                <BarChart2 className="w-5 h-5" />
                Odds Scanner
              </a>
              <a href="/picks" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
                <Clock className="w-5 h-5" />
                My Picks
              </a>
              <a href="/account" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
                <User className="w-5 h-5" />
                Account
              </a>
            </nav>

            {/* Sign Out */}
            <div className="p-6 border-t border-white/5">
              <button 
                onClick={handleSignOut}
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
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
            {mobileMenuOpen && (
              <nav className="mt-4 space-y-2">
                <a href="#" className="block px-4 py-2 text-white/60 hover:text-white font-bold">Dashboard</a>
                <a href="/sportsbooks" className="block px-4 py-2 text-white/60 hover:text-white font-bold">Odds Scanner</a>
                <a href="/picks" className="block px-4 py-2 text-white/60 hover:text-white font-bold">My Picks</a>
                <a href="/account" className="block px-4 py-2 text-white/60 hover:text-white font-bold">Account</a>
                <button onClick={handleSignOut} className="w-full mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold">Sign Out</button>
              </nav>
            )}
          </header>

          <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-8">
            {/* Header Section */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">Welcome back, {user?.email?.split('@')[0] || 'User'}!</h1>
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
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div 
                      key={idx}
                      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/60 to-purple-900/20 backdrop-blur-sm border border-white/10 p-6"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5"></div>
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <Icon className="w-5 h-5 text-purple-400" />
                          {stat.positive && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="text-white text-2xl font-bold mb-1">{stat.value}</div>
                        <div className="text-white/60 text-sm font-semibold mb-2">{stat.label}</div>
                        <div className="text-emerald-400 text-xs font-bold">{stat.change}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bets Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-bold">Recommended Picks</h2>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 bg-slate-900/60 border border-white/10 text-white rounded-lg hover:bg-slate-800/60 transition-all font-bold text-sm">
                    <Filter className="w-4 h-4 inline mr-2" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {bets.map((bet) => (
                  <div 
                    key={bet.id}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/60 to-purple-900/20 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5"></div>
                    <div className="relative">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        {/* Match Info */}
                        <div className="md:col-span-2">
                          <div className="text-white font-bold mb-1">{bet.teams}</div>
                          <div className="text-white/60 text-sm font-semibold">{bet.time}</div>
                        </div>

                        {/* Pick */}
                        <div>
                          <div className="text-white/60 text-xs font-bold uppercase mb-1">Pick</div>
                          <div className="text-white font-bold">{bet.pick}</div>
                        </div>

                        {/* Sportsbook & EV */}
                        <div>
                          <div className="text-white/60 text-xs font-bold uppercase mb-1">Sportsbook</div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{bet.sportsbook}</span>
                            <span className="text-emerald-400 font-bold text-sm">{bet.ev}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-end">
                          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
                            bet.status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {bet.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                            {bet.status === 'active' ? 'Active' : 'Upcoming'}
                          </div>
                        </div>
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
