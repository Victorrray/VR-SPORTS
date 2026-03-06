import {
  TrendingUp,
  BarChart2,
  Zap,
  Target,
  Crown,
  LogOut,
  User,
  Home,
  Settings,
  Calculator,
  Sparkles,
  ArrowLeftRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme, lightModeColors, themeConfig } from "../../contexts/ThemeContext";
import { useAuth } from "../../hooks/SimpleAuth";
import { useMe } from "../../hooks/useMe";
import { OddsPage } from "./OddsPage";
import { AccountPage } from "./AccountPage";
import { SettingsPage } from "./SettingsPage";
import { CalculatorPage } from "./CalculatorPage";
import { CancelSubscriptionPage } from "./CancelSubscriptionPage";
import { DeleteAccountPage } from "./DeleteAccountPage";
import { ChangePlanPage } from "./ChangePlanPage";
import { BetCard, BetData } from "./BetCard";
import LiveGamesTicker from "./LiveGamesTicker";
import { Toaster } from "./ui/sonner";
import { useRecommendedPicks } from "../../hooks/useRecommendedPicks";

interface DashboardProps {
  onSignOut: () => void;
}

export function Dashboard({ onSignOut }: DashboardProps) {
  const { theme, colorMode } = useTheme();
  const config = themeConfig[theme];
  const [searchParams] = useSearchParams();
  const isLight = colorMode === "light";
  const { user, profile } = useAuth();
  const { me } = useMe();
  
  // Get plan display info
  const userPlan = me?.plan || 'free';
  const hasPaidPlan = userPlan === 'gold' || userPlan === 'platinum' || me?.unlimited === true;
  const hasPlatinumPlan = userPlan === 'platinum' || me?.unlimited === true;
  const planConfig = useMemo(() => {
    switch (userPlan) {
      case 'platinum':
        return { label: 'Platinum', icon: Crown, color: 'text-amber-400', bg: isLight ? 'bg-amber-100 border-amber-300' : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30' };
      case 'gold':
        return { label: 'Gold', icon: Sparkles, color: 'text-yellow-400', bg: isLight ? 'bg-yellow-100 border-yellow-300' : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30' };
      default:
        return { label: 'Free', icon: Zap, color: 'text-gray-400', bg: isLight ? 'bg-gray-100 border-gray-300' : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-400/30' };
    }
  }, [userPlan, isLight]);
  const PlanIcon = planConfig.icon;
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSport, setSelectedSport] = useState("all");
  
  // Check URL params for initial view (e.g., /dashboard?view=changePlan)
  const urlView = searchParams.get('view');
  const initialView = urlView && ['dashboard', 'odds', 'account', 'settings', 'calculator', 'cancelSubscription', 'deleteAccount', 'changePlan'].includes(urlView)
    ? urlView as "dashboard" | "odds" | "account" | "settings" | "calculator" | "cancelSubscription" | "deleteAccount" | "changePlan"
    : "dashboard";

  const [currentView, setCurrentView] = useState<
    "dashboard" | "odds" | "account" | "settings" | "calculator" | "cancelSubscription" | "deleteAccount" | "changePlan"
  >(initialView);
  const [selectedBetType, setSelectedBetType] = useState<string>('straight');

  // Fetch recommended picks from API
  const { picks: recommendedPicks, loading: picksLoading } = useRecommendedPicks({
    limit: 4,
    minEV: 5,
    enabled: true,
  });

  const bets: BetData[] = recommendedPicks.length > 0 ? recommendedPicks : [];

  return (
    <div
      className={`min-h-screen ${isLight ? lightModeColors.background : config.background} relative overflow-hidden`}
    >
      <Toaster richColors position="top-center" />
      {/* Animated Background Orbs - Only for liquid glass theme in dark mode */}
      {theme === "liquid-glass" && !isLight && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </>
      )}

      {/* Background Pattern - Only for liquid glass and neon in dark mode */}
      {(theme === "liquid-glass" ||
        theme === "neon-cyberpunk") && !isLight && (
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      )}

      <div className="relative flex min-h-screen">
        {/* Sidebar - Minimal Clean Design */}
        <aside className={`hidden lg:flex lg:flex-col w-56 fixed top-0 left-0 h-screen z-40 ${isLight ? 'bg-white' : 'bg-slate-950'} border-r ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
          <div className="flex-1 flex flex-col">
            {/* Logo/Brand - Compact */}
            <div className="px-4 py-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">OS</span>
                </div>
                <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>OddSightSeer</span>
              </div>
              {/* Plan Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 mt-3`}>
                <PlanIcon className={`w-3.5 h-3.5 ${planConfig.color}`} />
                <span className={`text-xs font-medium ${isLight ? 'text-gray-600' : 'text-white/70'}`}>{planConfig.label} Plan</span>
              </div>
            </div>

            {/* Navigation - Clean */}
            <nav className="flex-1 px-3 py-2 overflow-y-auto">
              {/* Main */}
              <div className="space-y-0.5">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentView === "dashboard"
                      ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                      : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </button>
              </div>

              {/* Odds Tools */}
              <div className="mt-6">
                <div className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                  Tools
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setSelectedBetType('straight');
                      setCurrentView("odds");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentView === "odds" && selectedBetType === 'straight'
                        ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                        : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Straight Bets
                  </button>
                  <button
                    onClick={() => {
                      if (!hasPaidPlan) { setCurrentView("changePlan"); return; }
                      setSelectedBetType('props');
                      setCurrentView("odds");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      !hasPaidPlan
                        ? isLight ? 'text-gray-300' : 'text-white/20'
                        : currentView === "odds" && selectedBetType === 'props'
                          ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                          : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    Player Props
                    {!hasPaidPlan && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                  </button>
                  <button
                    onClick={() => {
                      if (!hasPlatinumPlan) { setCurrentView("changePlan"); return; }
                      setSelectedBetType('discrepancy');
                      setCurrentView("odds");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      !hasPlatinumPlan
                        ? isLight ? 'text-gray-300' : 'text-white/20'
                        : currentView === "odds" && selectedBetType === 'discrepancy'
                          ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                          : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    Discrepancy
                    {!hasPlatinumPlan && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                  </button>
                  <button
                    onClick={() => {
                      if (!hasPlatinumPlan) { setCurrentView("changePlan"); return; }
                      setSelectedBetType('exchanges');
                      setCurrentView("odds");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      !hasPlatinumPlan
                        ? isLight ? 'text-gray-300' : 'text-white/20'
                        : currentView === "odds" && selectedBetType === 'exchanges'
                          ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                          : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Exchanges
                    {!hasPlatinumPlan && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                  </button>
                  <button
                    onClick={() => {
                      if (!hasPlatinumPlan) { setCurrentView("changePlan"); return; }
                      setSelectedBetType('arbitrage');
                      setCurrentView("odds");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      !hasPlatinumPlan
                        ? isLight ? 'text-gray-300' : 'text-white/20'
                        : currentView === "odds" && selectedBetType === 'arbitrage'
                          ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                          : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Arbitrage
                    {!hasPlatinumPlan && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                  </button>
                  <button
                    onClick={() => {
                      if (!hasPlatinumPlan) { setCurrentView("changePlan"); return; }
                      setSelectedBetType('middles');
                      setCurrentView("odds");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      !hasPlatinumPlan
                        ? isLight ? 'text-gray-300' : 'text-white/20'
                        : currentView === "odds" && selectedBetType === 'middles'
                          ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                          : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    Middles
                    {!hasPlatinumPlan && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                  </button>
                </div>
              </div>

              {/* Utilities */}
              <div className="mt-6">
                <div className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                  Utilities
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setCurrentView("calculator")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentView === "calculator"
                        ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                        : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    Calculator
                  </button>
                </div>
              </div>
            </nav>

            {/* User & Settings - Bottom */}
            <div className={`px-3 py-3 border-t ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
              <div className="space-y-0.5">
                <button
                  onClick={() => setCurrentView("account")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentView === "account"
                      ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                      : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Account
                </button>
                <button
                  onClick={() => setCurrentView("settings")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentView === "settings"
                      ? isLight ? 'bg-purple-50 text-purple-700' : 'bg-white/5 text-white'
                      : isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={onSignOut}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isLight ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' : 'text-white/50 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto lg:ml-56">
          <div className="px-3 lg:px-8 py-4 lg:py-8 space-y-6 lg:space-y-8 pb-24 lg:pb-8">
            {/* Conditional Content Rendering */}
            {currentView === "dashboard" && (
              <>
                {/* Header Section */}
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLight ? 'bg-purple-100' : 'bg-white/5'}`}>
                        <span className="text-xl">👋</span>
                      </div>
                      <div>
                        <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-xl md:text-2xl lg:text-3xl font-bold`}>
                          Welcome back, {profile?.username || user?.email?.split('@')[0] || 'User'}!
                        </h1>
                        <p className={`${isLight ? lightModeColors.textMuted : 'text-white/50'} text-sm font-medium mt-0.5`}>
                          Here are today's top +EV picks
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Games Ticker */}
                <LiveGamesTicker isLight={isLight} />

                {/* Bets Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-base md:text-lg`}>
                        Top Picks
                      </h2>
                      <span className={`px-2.5 py-1 ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-white/60'} rounded-lg font-medium text-xs`}>
                        {bets.length} Available
                      </span>
                    </div>
                  </div>

                  {/* Bet Cards Grid - Real data from API */}
                  {picksLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`rounded-2xl ${isLight ? 'bg-gray-100' : 'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10'} animate-pulse`}
                          style={{ height: '280px' }}
                        />
                      ))}
                    </div>
                  ) : bets.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                      {bets.map((bet) => (
                        <BetCard key={bet.id} bet={bet} />
                      ))}
                    </div>
                  ) : (
                    <div className={`p-8 rounded-2xl text-center ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10'}`}>
                      <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                        <TrendingUp className={`w-7 h-7 ${isLight ? 'text-gray-400' : 'text-white/40'}`} />
                      </div>
                      <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg mb-2`}>
                        No picks available right now
                      </p>
                      <p className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm max-w-sm mx-auto`}>
                        Check back soon for recommended picks with positive expected value
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Render OddsPage - free users can access Straight Bets */}
            {currentView === "odds" && <OddsPage betType={selectedBetType} onBetTypeChange={setSelectedBetType} />}
            {currentView === "account" && (
              <AccountPage
                onNavigateToSettings={() => setCurrentView("settings")}
                onNavigateToCancelSubscription={() => setCurrentView("cancelSubscription")}
                onNavigateToDeleteAccount={() => setCurrentView("deleteAccount")}
                onNavigateToChangePlan={() => setCurrentView("changePlan")}
                onSignOut={onSignOut}
              />
            )}
            {currentView === "settings" && <SettingsPage onNavigateToChangePlan={() => setCurrentView("changePlan")} onNavigateToCancelSubscription={() => setCurrentView("cancelSubscription")} />}
            {currentView === "calculator" && <CalculatorPage />}
            {currentView === "cancelSubscription" && (
              <CancelSubscriptionPage onBack={() => setCurrentView("account")} />
            )}
            {currentView === "deleteAccount" && (
              <DeleteAccountPage
                onBack={() => setCurrentView("account")}
                onDelete={onSignOut}
              />
            )}
            {currentView === "changePlan" && (
              <ChangePlanPage onBack={() => setCurrentView("account")} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Minimal Dock */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className={`${isLight ? 'bg-white/80 border-t border-gray-200/50' : 'bg-slate-950/90 border-t border-white/5'} backdrop-blur-xl px-6 py-3`}>
          <div className="flex items-center justify-around max-w-md mx-auto">
            <button
              onClick={() => setCurrentView("dashboard")}
              className="flex flex-col items-center gap-1.5 py-1 transition-all relative"
            >
              <Home className={`w-6 h-6 transition-colors ${currentView === "dashboard" ? isLight ? "text-purple-600" : "text-white" : isLight ? "text-gray-400" : "text-white/40"}`} />
              {currentView === "dashboard" && (
                <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${isLight ? 'bg-purple-600' : 'bg-purple-400'}`} />
              )}
            </button>
            <button
              onClick={() => setCurrentView("odds")}
              className="flex flex-col items-center gap-1.5 py-1 transition-all relative"
            >
              <Zap className={`w-6 h-6 transition-colors ${currentView === "odds" ? isLight ? "text-purple-600" : "text-white" : isLight ? "text-gray-400" : "text-white/40"}`} />
              {currentView === "odds" && (
                <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${isLight ? 'bg-purple-600' : 'bg-purple-400'}`} />
              )}
            </button>
            <button
              onClick={() => setCurrentView("calculator")}
              className="flex flex-col items-center gap-1.5 py-1 transition-all relative"
            >
              <Calculator className={`w-6 h-6 transition-colors ${currentView === "calculator" ? isLight ? "text-purple-600" : "text-white" : isLight ? "text-gray-400" : "text-white/40"}`} />
              {currentView === "calculator" && (
                <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${isLight ? 'bg-purple-600' : 'bg-purple-400'}`} />
              )}
            </button>
            <button
              onClick={() => setCurrentView("account")}
              className="flex flex-col items-center gap-1.5 py-1 transition-all relative"
            >
              <User className={`w-6 h-6 transition-colors ${currentView === "account" ? isLight ? "text-purple-600" : "text-white" : isLight ? "text-gray-400" : "text-white/40"}`} />
              {currentView === "account" && (
                <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${isLight ? 'bg-purple-600' : 'bg-purple-400'}`} />
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}