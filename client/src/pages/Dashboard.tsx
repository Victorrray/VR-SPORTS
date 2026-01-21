import {
  BarChart2,
  TrendingUp,
  Crown,
  LogOut,
  User,
  Home,
  Filter,
  Search,
  ChevronDown,
  Calendar,
  DollarSign,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Zap,
  BarChart,
  Settings,
  Calculator,
  Wallet,
} from "lucide-react";
import { useState, useEffect } from "react";
import { PicksPage } from "../components/design12/PicksPage";
import { OddsPage } from "../components/design12/OddsPage";
import { AccountPage } from "../components/design12/AccountPage";
import { SettingsPage } from "../components/design12/SettingsPage";
import { CalculatorPage } from "../components/design12/CalculatorPage";
import { BankrollPage } from "../components/design12/BankrollPage";
import { BetCard, BetData } from "../components/design12/BetCard";
import {
  useTheme,
  themeConfig,
  lightModeColors,
} from "../contexts/ThemeContext";
import { Toaster } from "../components/ui/sonner";
import { useRecommendedPicks } from "../hooks/useRecommendedPicks";
import { useUserStats } from "../hooks/useUserStats";
import { useAuth } from "../hooks/SimpleAuth";
import { useMe } from "../hooks/useMe";

interface DashboardProps {
  onSignOut: () => void;
}

export function Dashboard({ onSignOut }: DashboardProps) {
  const { theme, colorMode } = useTheme();
  const config = themeConfig[theme];
  const isLight = colorMode === "light";
  const { user, profile } = useAuth();
  const { me } = useMe();
  
  // Get plan display info
  const userPlan = me?.plan || 'free';
  const getPlanConfig = () => {
    switch (userPlan) {
      case 'platinum':
        return { label: 'Platinum', icon: Crown, color: 'text-amber-400', bg: isLight ? 'bg-amber-100 border-amber-300' : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30' };
      case 'gold':
        return { label: 'Gold', icon: Sparkles, color: 'text-yellow-400', bg: isLight ? 'bg-yellow-100 border-yellow-300' : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30' };
      default:
        return { label: 'Free', icon: Zap, color: 'text-gray-400', bg: isLight ? 'bg-gray-100 border-gray-300' : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-400/30' };
    }
  };
  const planConfig = getPlanConfig();
  const PlanIcon = planConfig.icon;
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSport, setSelectedSport] = useState("all");
  const [currentView, setCurrentView] = useState<
    "dashboard" | "picks" | "odds" | "account" | "settings" | "calculator" | "bankroll"
  >("dashboard");
  
  // Initialize savedPicks from localStorage
  const [savedPicks, setSavedPicks] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('my_picks_v1');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading picks from localStorage:', error);
      return [];
    }
  });

  // Persist savedPicks to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('my_picks_v1', JSON.stringify(savedPicks));
    } catch (error) {
      console.error('Error saving picks to localStorage:', error);
    }
  }, [savedPicks]);

  // Fetch recommended picks from API
  const { picks: recommendedPicks, loading: picksLoading } = useRecommendedPicks({
    limit: 4,
    minEV: 5,
    enabled: true,
  });

  // Fetch user stats - pass savedPicks so stats update when picks change
  const userStats = useUserStats(savedPicks);

  const addPickToMyPicks = (pick: any) => {
    setSavedPicks((prev) => {
      const updated = [...prev, pick];
      return updated;
    });
  };

  const removePickFromMyPicks = (pickId: number | string) => {
    setSavedPicks((prev) => {
      const updated = prev.filter(pick => pick.id !== pickId);
      return updated;
    });
  };

  // Calculate dynamic change values based on actual data
  const profitIsPositive = !userStats.totalProfit.startsWith('-');
  const edgeIsPositive = parseFloat(userStats.averageEdge) > 0;
  
  const stats = [
    {
      label: "Win Rate",
      value: userStats.loading ? "—" : userStats.winRate,
      change: userStats.loading ? "" : `${userStats.totalPicks} picks`,
      positive: parseFloat(userStats.winRate) >= 50,
      icon: Target,
    },
    {
      label: "Average Edge",
      value: userStats.loading ? "—" : userStats.averageEdge,
      change: userStats.loading ? "" : edgeIsPositive ? "Positive EV" : "Track more bets",
      positive: edgeIsPositive,
      icon: TrendingUp,
    },
    {
      label: "Total Profit",
      value: userStats.loading ? "—" : userStats.totalProfit,
      change: userStats.loading ? "" : profitIsPositive ? "Keep it up!" : "Stay disciplined",
      positive: profitIsPositive,
      icon: DollarSign,
    },
    {
      label: "Active Bets",
      value: userStats.loading ? "—" : userStats.activeBets.toString(),
      change: userStats.loading ? "" : userStats.activeBets > 0 ? "In play" : "Add picks",
      positive: userStats.activeBets > 0,
      icon: Sparkles,
    },
  ];

  // Use recommended picks from API, fallback to empty array if loading
  const bets: BetData[] = recommendedPicks.length > 0 ? recommendedPicks : [];

  return (
    <div
      className={`min-h-screen ${isLight ? lightModeColors.background : config.background} relative overflow-hidden`}
    >
      <Toaster richColors position="top-center" />

      <div className="relative flex">
        {/* Sidebar */}
        <aside className={`hidden lg:flex lg:flex-col w-72 h-screen border-r rounded-2xl ${isLight ? 'border-gray-200 bg-white/80' : 'border-white/10 bg-slate-950/30'} backdrop-blur-2xl`}>
          <div className="flex-1 flex flex-col">
            {/* Logo */}
            <div className={`p-6 border-b ${isLight ? 'border-gray-200' : 'border-white/10'} relative overflow-hidden`}>
              {/* Background decoration */}
              <div className={`absolute inset-0 ${isLight ? 'bg-purple-50/50' : 'bg-purple-500/5'} opacity-50`} />
              
              <div className="relative flex flex-col gap-4">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-2xl ${isLight ? 'bg-purple-400' : 'bg-purple-500'} blur-xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                    
                    {/* Logo container */}
                    <div className={`relative w-12 h-12 rounded-2xl ${isLight ? lightModeColors.logoGradient : 'bg-purple-500'} flex items-center justify-center transform transition-transform group-hover:scale-105`}>
                      <span className="text-white font-bold text-lg">
                        OS
                      </span>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className={`${isLight ? lightModeColors.logoGradient : 'text-purple-400'} bg-clip-text text-transparent font-bold text-lg tracking-tight`}>
                      OddSightSeer
                    </span>
                    <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/40'} font-bold tracking-wide`}>
                      PREMIUM ANALYTICS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className={`p-6 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <button
                onClick={() => setCurrentView("account")}
                className={`w-full p-4 ${isLight ? 'bg-purple-50 border-purple-200 hover:border-purple-300' : 'bg-purple-500/10 border-white/10 hover:border-purple-400/30'} border backdrop-blur-xl rounded-2xl transition-all`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl ${isLight ? 'bg-purple-100 border-purple-300' : 'bg-purple-500/30 border-purple-400/30'} border flex items-center justify-center backdrop-blur-xl`}>
                    <User className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-300'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                      {profile?.username || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`px-2 py-0.5 ${planConfig.bg} border rounded-md backdrop-blur-xl`}>
                        <div className="flex items-center gap-1">
                          <PlanIcon className={`w-3 h-3 ${planConfig.color}`} />
                          <span className={`${planConfig.color} font-bold text-xs`}>
                            {planConfig.label}
                          </span>
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
                onClick={() => setCurrentView("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === "dashboard"
                    ? isLight ? lightModeColors.navActive : "bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 text-white"
                    : isLight ? lightModeColors.navInactive : "text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10"
                }`}
              >
                <Home className="w-5 h-5" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("odds")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === "odds"
                    ? isLight ? lightModeColors.navActive : "bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 text-white"
                    : isLight ? lightModeColors.navInactive : "text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10"
                }`}
              >
                <Zap className="w-5 h-5" />
                Odds
              </button>
              <button
                onClick={() => setCurrentView("picks")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === "picks"
                    ? isLight ? lightModeColors.navActive : "bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 text-white"
                    : isLight ? lightModeColors.navInactive : "text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10"
                }`}
              >
                <Target className="w-5 h-5" />
                My Picks
              </button>

              <button
                onClick={() => setCurrentView("calculator")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === "calculator"
                    ? isLight ? lightModeColors.navActive : "bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 text-white"
                    : isLight ? lightModeColors.navInactive : "text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10"
                }`}
              >
                <Calculator className="w-5 h-5" />
                Calculator
              </button>

              <button
                onClick={() => setCurrentView("bankroll")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === "bankroll"
                    ? isLight ? lightModeColors.navActive : "bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 text-white"
                    : isLight ? lightModeColors.navInactive : "text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10"
                }`}
              >
                <Wallet className="w-5 h-5" />
                Bankroll
              </button>

              <button
                onClick={() => setCurrentView("account")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === "account"
                    ? isLight ? lightModeColors.navActive : "bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 text-white"
                    : isLight ? lightModeColors.navInactive : "text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10"
                }`}
              >
                <User className="w-5 h-5" />
                Account
              </button>
            </nav>

            {/* Sign Out */}
            <div className={`p-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} space-y-3`}>
              <button
                onClick={() => setCurrentView("settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentView === "settings"
                    ? isLight ? lightModeColors.navActive : "bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 text-white"
                    : isLight ? lightModeColors.navInactive : "text-white/60 hover:text-white hover:bg-white/5 hover:backdrop-blur-xl border border-transparent hover:border-white/10"
                }`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>

              <button
                onClick={onSignOut}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${isLight ? lightModeColors.signOutButton : 'bg-red-500/10 border-red-400/30 text-red-400 hover:bg-red-500/20'} backdrop-blur-xl border rounded-xl transition-all font-bold`}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-8 pb-24 lg:pb-8">
            {/* Conditional Content Rendering */}
            {currentView === "dashboard" && (
              <>
                {/* Header Section */}
                <div className="space-y-6">
                  <div>
                    <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-2xl md:text-3xl font-bold mb-2`}>
                      Welcome back, {profile?.username || user?.email?.split('@')[0] || 'User'}!
                    </h1>
                    <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>
                      Here are your recommended picks for today
                    </p>
                  </div>

                  {/* Stats Grid - Hidden for now */}
                  {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {stats.map((stat, idx) => (
                      <div
                        key={idx}
                        className={`p-4 md:p-5 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border-white/10'} border rounded-xl md:rounded-2xl`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 ${isLight ? lightModeColors.statsIcon : 'bg-purple-500/20 border-purple-400/30'} backdrop-blur-xl rounded-xl border`}>
                            <stat.icon className={`w-4 h-4 ${isLight ? lightModeColors.statsIconColor : 'text-purple-300'}`} />
                          </div>
                          <span className={`${isLight ? lightModeColors.textLight : 'text-white/50'} font-bold text-xs md:text-sm uppercase tracking-wide`}>
                            {stat.label}
                          </span>
                        </div>
                        <div className={`${isLight ? lightModeColors.text : 'text-white'} text-xl md:text-2xl font-bold`}>
                          {stat.value}
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-2 text-xs font-bold ${stat.positive ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {stat.positive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span>{stat.change}</span>
                        </div>
                      </div>
                    ))}
                  </div> */}
                </div>

                {/* Bets Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                    <h2 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>
                      Top Picks
                    </h2>
                    <span className={`px-2.5 md:px-3 py-1 ${isLight ? lightModeColors.statsBadge : 'bg-purple-500/20 border-purple-400/30 text-white'} backdrop-blur-xl border rounded-lg font-bold text-xs`}>
                      {picksLoading ? 'Loading...' : `${bets.length} Available`}
                    </span>
                  </div>

                  {/* Bet Cards Grid - Real data from API */}
                  {picksLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-xl ${isLight ? 'bg-gray-100' : 'bg-white/5'} animate-pulse`}
                          style={{ height: '300px' }}
                        />
                      ))}
                    </div>
                  ) : bets.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {bets.map((bet) => (
                        <BetCard key={bet.id} bet={bet} />
                      ))}
                    </div>
                  ) : (
                    <div className={`p-6 rounded-xl text-center ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                      <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-semibold`}>
                        No high-value picks available at the moment
                      </p>
                      <p className={`${isLight ? 'text-gray-500' : 'text-white/40'} text-sm mt-2`}>
                        Check back soon for recommended picks with positive expected value
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {currentView === "picks" && <PicksPage savedPicks={savedPicks} onRemovePick={removePickFromMyPicks} />}
            {currentView === "odds" && <OddsPage onAddPick={addPickToMyPicks} />}
            {currentView === "account" && (
              <AccountPage
                onNavigateToSettings={() =>
                  setCurrentView("settings")
                }
              />
            )}
            {currentView === "settings" && <SettingsPage />}
            {currentView === "calculator" && <CalculatorPage />}
            {currentView === "bankroll" && <BankrollPage />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 pb-4">
        <div className={`${isLight ? 'bg-white/80 border-gray-200' : 'bg-slate-950/60 border-white/10'} backdrop-blur-xl border rounded-full px-3 py-3`}>
          <div className="flex items-center justify-around gap-2">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                currentView === "dashboard"
                  ? isLight ? "bg-purple-100 border border-purple-300" : "bg-purple-500/30 backdrop-blur-xl border border-purple-400/40"
                  : isLight ? "text-gray-600 hover:bg-gray-100" : "text-white/60 hover:bg-white/10"
              }`}
            >
              <Home
                className={`w-5 h-5 ${currentView === "dashboard" ? isLight ? "text-purple-600" : "text-purple-300" : ""}`}
              />
              <span
                className={`text-xs font-bold ${currentView === "dashboard" ? isLight ? "text-purple-900" : "text-white" : ""}`}
              >
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setCurrentView("odds")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                currentView === "odds"
                  ? isLight ? "bg-purple-100 border border-purple-300" : "bg-purple-500/30 backdrop-blur-xl border border-purple-400/40"
                  : isLight ? "text-gray-600 hover:bg-gray-100" : "text-white/60 hover:bg-white/10"
              }`}
            >
              <Zap
                className={`w-5 h-5 ${currentView === "odds" ? isLight ? "text-purple-600" : "text-purple-300" : ""}`}
              />
              <span
                className={`text-xs font-bold ${currentView === "odds" ? isLight ? "text-purple-900" : "text-white" : ""}`}
              >
                Odds
              </span>
            </button>
            <button
              onClick={() => setCurrentView("picks")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                currentView === "picks"
                  ? isLight ? "bg-purple-100 border border-purple-300" : "bg-purple-500/30 backdrop-blur-xl border border-purple-400/40"
                  : isLight ? "text-gray-600 hover:bg-gray-100" : "text-white/60 hover:bg-white/10"
              }`}
            >
              <Target
                className={`w-5 h-5 ${currentView === "picks" ? isLight ? "text-purple-600" : "text-purple-300" : ""}`}
              />
              <span
                className={`text-xs font-bold ${currentView === "picks" ? isLight ? "text-purple-900" : "text-white" : ""}`}
              >
                Picks
              </span>
            </button>
            <button
              onClick={() => setCurrentView("account")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full transition-all ${
                currentView === "account"
                  ? isLight ? "bg-purple-100 border border-purple-300" : "bg-purple-500/30 backdrop-blur-xl border border-purple-400/40"
                  : isLight ? "text-gray-600 hover:bg-gray-100" : "text-white/60 hover:bg-white/10"
              }`}
            >
              <User
                className={`w-5 h-5 ${currentView === "account" ? isLight ? "text-purple-600" : "text-purple-300" : ""}`}
              />
              <span
                className={`text-xs font-bold ${currentView === "account" ? isLight ? "text-purple-900" : "text-white" : ""}`}
              >
                Account
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}