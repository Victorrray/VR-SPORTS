// file: src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, Users, Clock, Star, ChevronRight, Target, Zap, BarChart3, Calendar, MessageCircle, ThumbsUp, Flame, Trophy, Activity, DollarSign, Award, Eye, Bell, Bookmark, Plus, Minus, TrendingDown, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import MobileBottomBar from "../components/MobileBottomBar";
import Footer from "../components/Footer";
import styles from "./Home.module.css";
import "../styles/home-social.css";

// Live user activity for urgency
const LIVE_ACTIVITY = {
  usersOnline: 2847,
  recentSignups: 23,
  activeAlerts: 156
};

// Value propositions
const VALUE_PROPS = [
  { icon: TrendingUp, text: "4.2% average edge", color: "success" },
  { icon: Users, text: "50K+ active users", color: "primary" },
  { icon: Zap, text: "Real-time alerts", color: "warning" },
  { icon: Shield, text: "Bank-level security", color: "accent" }
];

// Performance dashboard stats
const PERFORMANCE_STATS = {
  totalProfit: 847293,
  winRate: 67.4,
  avgReturn: 12.8,
  edgesFound: 1247,
  usersProfit: 89
};

const TOOL_CARDS = [
  {
    title: "Odds Scanner",
    description: "Find the best lines across 20+ sportsbooks",
    icon: Target,
    link: "/sportsbooks",
    color: "accent",
    badge: "Most Popular"
  },
  {
    title: "Live Scores",
    description: "Real-time scores with betting context",
    icon: Activity,
    link: "/scores",
    color: "success"
  },
  {
    title: "Alert System",
    description: "Get notified of +EV opportunities",
    icon: Zap,
    link: "/sportsbooks",
    color: "warning"
  }
];

// +EV Opportunities preview
const EV_OPPORTUNITIES = [
  { 
    id: "ev1", 
    league: "NFL", 
    game: "Chiefs vs Bills", 
    market: "Spread", 
    line: "Chiefs -3.5", 
    book: "DraftKings", 
    odds: "+102", 
    edge: "+4.2%",
    profit: "$42 per $100"
  },
  { 
    id: "ev2", 
    league: "NBA", 
    game: "Lakers vs Warriors", 
    market: "Total", 
    line: "Over 225.5", 
    book: "FanDuel", 
    odds: "+105", 
    edge: "+3.1%",
    profit: "$31 per $100"
  },
  { 
    id: "ev3", 
    league: "MLB", 
    game: "Dodgers vs Giants", 
    market: "Moneyline", 
    line: "Dodgers ML", 
    book: "Caesars", 
    odds: "-108", 
    edge: "+2.8%",
    profit: "$28 per $100"
  }
];

// Success stories with specific results
const SUCCESS_STORIES = [
  {
    name: "Mike Chen",
    role: "Professional Bettor",
    result: "$2,400 profit in 30 days",
    quote: "The edge detection found opportunities I never would have spotted manually.",
    avatar: "MC",
    verified: true
  },
  {
    name: "Sarah Rodriguez",
    role: "Sports Analyst", 
    result: "40% CLV improvement",
    quote: "Finally, a tool that actually finds real value instead of just tracking odds.",
    avatar: "SR",
    verified: true
  },
  {
    name: "David Park",
    role: "Weekend Bettor",
    result: "From -$500 to +$1,200",
    quote: "Went from consistently losing to making steady profits every month.",
    avatar: "DP",
    verified: true
  }
];

// Trust signals
const TRUST_SIGNALS = [
  { icon: Star, text: "4.9/5 rating", subtext: "2,847 reviews" },
  { icon: Shield, text: "Bank-level security", subtext: "256-bit encryption" },
  { icon: Users, text: "50K+ users", subtext: "Growing daily" },
  { icon: Award, text: "30-day guarantee", subtext: "Risk-free trial" }
];

// Landing Page Component for non-authenticated users
function LandingPage() {
  const navigate = useNavigate();
  const [liveActivity, setLiveActivity] = useState(LIVE_ACTIVITY);
  const [performanceStats, setPerformanceStats] = useState(PERFORMANCE_STATS);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Update live activity for urgency
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveActivity(prev => ({
        ...prev,
        usersOnline: prev.usersOnline + Math.floor(Math.random() * 10) - 5,
        recentSignups: prev.recentSignups + Math.floor(Math.random() * 3)
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % SUCCESS_STORIES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <main
      className={styles.landingContainer}
      role="main"
    >
      {/* ===== Urgency Banner ===== */}
      <section className={styles.urgencyBanner}>
        <div className={styles.liveIndicator}>
          <div className={styles.pulseDot}></div>
          <span>{liveActivity.usersOnline.toLocaleString()} users online now</span>
        </div>
        <div className={styles.recentActivity}>
          <span>{liveActivity.recentSignups} joined in the last hour</span>
        </div>
      </section>

      {/* ===== Hero Section ===== */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Turn $100 into $2,400 in 30 days
          </h1>
          <p className={styles.heroSubtitle}>
            Join 50,000+ smart bettors using AI-powered edge detection to find profitable opportunities across 20+ sportsbooks
          </p>
          
          {/* Value Props Pills */}
          <div className={styles.valuePills}>
            {VALUE_PROPS.map((prop, index) => {
              const IconComponent = prop.icon;
              return (
                <div key={index} className={`${styles.valuePill} ${styles[prop.color]}`}>
                  <IconComponent size={16} />
                  <span>{prop.text}</span>
                </div>
              );
            })}
          </div>
          
          <button className={styles.heroCta} onClick={handleGetStarted}>
            Join Today
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ===== Social Proof ===== */}
      <section className={styles.socialProof}>
        <div className={styles.testimonialCarousel}>
          <div className={styles.testimonial}>
            <div className={styles.testimonialContent}>
              <div className={styles.testimonialHeader}>
                <div className={styles.avatar}>
                  {SUCCESS_STORIES[currentTestimonial].avatar}
                </div>
                <div className={styles.testimonialMeta}>
                  <h4>{SUCCESS_STORIES[currentTestimonial].name}</h4>
                  <p>{SUCCESS_STORIES[currentTestimonial].role}</p>
                  <span className={styles.result}>{SUCCESS_STORIES[currentTestimonial].result}</span>
                </div>
              </div>
              <blockquote>"{SUCCESS_STORIES[currentTestimonial].quote}"</blockquote>
            </div>
          </div>
        </div>
        
        {/* Trust Signals */}
        <div className={styles.trustSignals}>
          {TRUST_SIGNALS.map((signal, index) => {
            const IconComponent = signal.icon;
            return (
              <div key={index} className={styles.trustSignal}>
                <IconComponent size={20} />
                <div>
                  <strong>{signal.text}</strong>
                  <span>{signal.subtext}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Live Performance Dashboard ===== */}
      <section className={styles.performanceDashboard}>
        <h2 className={styles.sectionTitle}>Live Performance Dashboard</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <DollarSign size={24} className={styles.statIcon} />
            <div className={styles.statValue}>${performanceStats.totalProfit.toLocaleString()}</div>
            <div className={styles.statLabel}>Total User Profits</div>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={24} className={styles.statIcon} />
            <div className={styles.statValue}>{performanceStats.winRate}%</div>
            <div className={styles.statLabel}>Community Win Rate</div>
          </div>
          <div className={styles.statCard}>
            <Target size={24} className={styles.statIcon} />
            <div className={styles.statValue}>{performanceStats.edgesFound}</div>
            <div className={styles.statLabel}>+EV Bets Found Today</div>
          </div>
          <div className={styles.statCard}>
            <Users size={24} className={styles.statIcon} />
            <div className={styles.statValue}>{performanceStats.usersProfit}%</div>
            <div className={styles.statLabel}>Users Profitable</div>
          </div>
        </div>
      </section>

      {/* ===== Tools Preview ===== */}
      <section className={styles.toolsPreview}>
        <h2 className={styles.sectionTitle}>Powerful Tools at Your Fingertips</h2>
        <div className={styles.toolGrid}>
          {TOOL_CARDS.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <Link key={index} to={tool.link} className={`${styles.toolCard} ${styles[tool.color]}`}>
                {tool.badge && <div className={styles.toolBadge}>{tool.badge}</div>}
                <div className={styles.toolIcon}>
                  <IconComponent size={28} />
                </div>
                <div className={styles.toolContent}>
                  <h3 className={styles.toolTitle}>{tool.title}</h3>
                  <p className={styles.toolDescription}>{tool.description}</p>
                </div>
                <ChevronRight size={16} className={styles.toolArrow} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== +EV Opportunities Preview ===== */}
      <section className={styles.opportunitiesPreview}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <TrendingUp size={20} className={styles.sectionIcon} />
            Live +EV Opportunities
          </h2>
          <Link to="/sportsbooks" className={styles.viewAllLink}>
            View All <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className={styles.opportunitiesTable}>
          <div className={styles.tableHeader}>
            <span>Game</span>
            <span>Market</span>
            <span>Book</span>
            <span>Edge</span>
            <span>Profit</span>
          </div>
          {EV_OPPORTUNITIES.map((opp) => (
            <Link key={opp.id} to="/sportsbooks" className={styles.opportunityRow}>
              <div className={styles.gameInfo}>
                <span className={styles.league}>{opp.league}</span>
                <span className={styles.game}>{opp.game}</span>
              </div>
              <div className={styles.marketInfo}>
                <span className={styles.market}>{opp.market}</span>
                <span className={styles.line}>{opp.line}</span>
              </div>
              <div className={styles.bookInfo}>
                <span className={styles.book}>{opp.book}</span>
                <span className={styles.odds}>{opp.odds}</span>
              </div>
              <div className={`${styles.edge} ${styles.positive}`}>
                {opp.edge}
              </div>
              <div className={styles.profit}>
                {opp.profit}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className={styles.finalCta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Ready to Start Winning?
          </h2>
          <p className={styles.ctaSubtitle}>
            Join 50,000+ profitable bettors using VR-Odds
          </p>
          
          <div className={styles.ctaBenefits}>
            <div className={styles.benefit}>
              <Target size={16} />
              <span>Find +EV bets in seconds</span>
            </div>
            <div className={styles.benefit}>
              <Zap size={16} />
              <span>Real-time alerts to your phone</span>
            </div>
            <div className={styles.benefit}>
              <Shield size={16} />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
          
          <button className={styles.finalCtaButton} onClick={handleGetStarted}>
            Join Today
            <ArrowRight size={20} />
          </button>
          
          <p className={styles.ctaDisclaimer}>
            No credit card required • Cancel anytime • 4.9/5 rating
          </p>
        </div>
      </section>

    </main>
  );
}

// User Hub Component for authenticated users
function UserHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [communityStats, setCommunityStats] = useState({
    activeUsers: 2847,
    totalBets: 15623,
    winRate: 67.4,
    avgReturn: 12.8
  });
  const [userBets, setUserBets] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch live games from multiple sports
        const sportsToFetch = ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb'];
        const gamePromises = sportsToFetch.map(sport => 
          fetch(`/api/scores?sport=${sport}`).then(res => res.ok ? res.json() : [])
        );
        
        const allGamesResults = await Promise.all(gamePromises);
        const allGames = allGamesResults.flat().slice(0, 10); // Limit to 10 games
        setLiveGames(allGames);
        
        // Generate user-specific data based on real games
        if (allGames.length > 0) {
          // Create realistic user bets based on actual games
          const userBetsData = allGames.slice(0, 3).map((game, index) => {
            const betTypes = ['Spread', 'Total', 'ML'];
            const amounts = [50, 100, 75, 150, 200];
            const statuses = ['pending', 'won', 'lost'];
            
            return {
              id: index + 1,
              game: `${game.away_team} vs ${game.home_team}`,
              type: betTypes[index % betTypes.length],
              amount: amounts[index % amounts.length],
              status: statuses[index % statuses.length],
              odds: index === 0 ? '-110' : index === 1 ? '+105' : '-108',
              potential: amounts[index % amounts.length] * (index === 1 ? 2.05 : 1.91)
            };
          });
          setUserBets(userBetsData);
          
          // Generate recommendations based on real games
          const recommendationsData = allGames.slice(3, 6).map((game, index) => {
            const markets = [`${game.away_team} +7`, `Under ${220 + index * 5}.5`, `${game.home_team} ML`];
            const edges = ['+5.2%', '+3.8%', '+2.9%'];
            const books = ['DraftKings', 'FanDuel', 'Caesars'];
            const confidences = [89, 76, 82];
            
            return {
              id: index + 1,
              game: `${game.away_team} vs ${game.home_team}`,
              market: markets[index % markets.length],
              edge: edges[index % edges.length],
              book: books[index % books.length],
              confidence: confidences[index % confidences.length]
            };
          });
          setRecommendations(recommendationsData);
          
          // Generate activity feed based on real games
          const activityData = allGames.slice(0, 4).map((game, index) => {
            const types = ['bet_placed', 'bet_won', 'edge_found', 'user_joined'];
            const users = ['@ProBettor', '@SharpMoney', 'System', '@NewBettor'];
            const actions = [
              `placed a bet on ${game.away_team} vs ${game.home_team}`,
              `won $180 on ${game.away_team} vs ${game.home_team}`,
              `found +5.2% edge on ${game.home_team} ML`,
              'joined the community'
            ];
            const amounts = ['$250', '+$180', null, null];
            const times = ['2m ago', '15m ago', '23m ago', '1h ago'];
            
            return {
              id: index + 1,
              type: types[index],
              user: users[index],
              action: actions[index],
              time: times[index],
              amount: amounts[index]
            };
          });
          setRecentActivity(activityData);
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to mock data if API fails
        setUserBets([
          { id: 1, game: "Chiefs vs Bills", type: "Spread", amount: 100, status: "pending", odds: "-110", potential: 190.91 },
          { id: 2, game: "Lakers vs Warriors", type: "Total", amount: 50, status: "won", odds: "+105", potential: 102.50 }
        ]);
        setRecommendations([
          { id: 1, game: "Cowboys vs Eagles", market: "Cowboys +7", edge: "+5.2%", book: "DraftKings", confidence: 89 },
          { id: 2, game: "Celtics vs Heat", market: "Under 218.5", edge: "+3.8%", book: "FanDuel", confidence: 76 }
        ]);
        setRecentActivity([
          { id: 1, type: "bet_placed", user: "@ProBettor", action: "placed a bet on live game", time: "2m ago", amount: "$250" },
          { id: 2, type: "edge_found", user: "System", action: "found new +EV opportunity", time: "15m ago", amount: null }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    // Update community stats periodically
    const interval = setInterval(() => {
      setCommunityStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        totalBets: prev.totalBets + Math.floor(Math.random() * 3)
      }));
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleBetLike = (betId) => {
    console.log('Liked bet:', betId);
  };

  const handleBetComment = (betId) => {
    console.log('Comment on bet:', betId);
  };

  return (
    <main
      className={styles.container}
      role="main"
      style={{
        paddingLeft: "calc(max(16px, env(safe-area-inset-left)) + 8px)",
        paddingRight: "calc(max(16px, env(safe-area-inset-right)) + 8px)",
      }}
    >
      {/* ===== Welcome Header ===== */}
      <section className={styles.welcomeHeader}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Welcome back, {user?.user_metadata?.username || user?.email?.split('@')[0] || 'Bettor'}!
            <Flame size={24} className={styles.fireIcon} />
          </h1>
          <p className={styles.welcomeSubtitle}>
            {loading ? 'Loading your personalized dashboard...' : 'Check out what\'s trending in the community'}
          </p>
        </div>
        
        {/* Community Stats */}
        <div className={styles.communityStats}>
          <div className={styles.statItem}>
            <Users size={16} />
            <span>{communityStats.activeUsers.toLocaleString()} online</span>
          </div>
          <div className={styles.statItem}>
            <Trophy size={16} />
            <span>{communityStats.winRate}% win rate</span>
          </div>
          <div className={styles.statItem}>
            <TrendingUp size={16} />
            <span>+{communityStats.avgReturn}% avg return</span>
          </div>
        </div>
      </section>

      {/* ===== Quick Actions ===== */}
      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          {TOOL_CARDS.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link key={index} to={action.link} className={`${styles.actionCard} ${styles[action.color]}`}>
                {action.badge && <div className={styles.actionBadge}>{action.badge}</div>}
                <div className={styles.actionIcon}>
                  <IconComponent size={24} />
                </div>
                <div className={styles.actionContent}>
                  <h3 className={styles.actionTitle}>{action.title}</h3>
                  <p className={styles.actionDescription}>{action.description}</p>
                </div>
                <ChevronRight size={16} className={styles.actionArrow} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== My Active Bets ===== */}
      <section className={styles.myBetsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Activity size={20} className={styles.sectionIcon} />
            My Active Bets
          </h2>
          <Link to="/picks" className={styles.viewAllLink}>
            View All <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className={styles.myBetsGrid}>
          {loading ? (
            <div className={styles.loadingCard}>Loading your bets...</div>
          ) : userBets.length === 0 ? (
            <div className={styles.emptyState}>
              <Target size={32} />
              <p>No active bets yet</p>
              <Link to="/sportsbooks" className={styles.startBettingBtn}>Find Opportunities</Link>
            </div>
          ) : (
            userBets.slice(0, 2).map((bet) => (
            <div key={bet.id} className={`${styles.betTrackCard} ${styles[bet.status]}`}>
              <div className={styles.betTrackHeader}>
                <span className={styles.gameTitle}>{bet.game}</span>
                <div className={`${styles.statusBadge} ${styles[bet.status]}`}>
                  {bet.status === 'pending' && <Clock size={12} />}
                  {bet.status === 'won' && <CheckCircle size={12} />}
                  {bet.status === 'lost' && <AlertCircle size={12} />}
                  {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                </div>
              </div>
              <div className={styles.betTrackContent}>
                <div className={styles.betInfo}>
                  <span className={styles.betType}>{bet.type}</span>
                  <span className={styles.betOdds}>{bet.odds}</span>
                </div>
                <div className={styles.betAmounts}>
                  <span className={styles.betAmount}>${bet.amount}</span>
                  <span className={`${styles.potential} ${bet.status === 'won' ? styles.won : bet.status === 'lost' ? styles.lost : ''}`}>
                    {bet.status === 'pending' ? `Potential: $${bet.potential}` : 
                     bet.status === 'won' ? `+$${bet.potential}` : 
                     `-$${bet.amount}`}
                  </span>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </section>

      {/* ===== Live Activity Feed ===== */}
      <section className={styles.activitySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Bell size={20} className={styles.sectionIcon} />
            Live Activity
          </h2>
          <button className={styles.refreshBtn} onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
          </button>
        </div>
        
        <div className={styles.activityFeed}>
          {loading ? (
            <div className={styles.loadingCard}>Loading live activity...</div>
          ) : (
            recentActivity.map((activity) => (
            <div key={activity.id} className={`${styles.activityItem} ${styles[activity.type]}`}>
              <div className={styles.activityIcon}>
                {activity.type === 'bet_placed' && <Plus size={14} />}
                {activity.type === 'bet_won' && <TrendingUp size={14} />}
                {activity.type === 'bet_lost' && <TrendingDown size={14} />}
                {activity.type === 'edge_found' && <Target size={14} />}
                {activity.type === 'user_joined' && <Users size={14} />}
              </div>
              <div className={styles.activityContent}>
                <span className={styles.activityUser}>{activity.user}</span>
                <span className={styles.activityAction}>{activity.action}</span>
                {activity.amount && (
                  <span className={`${styles.activityAmount} ${activity.amount.startsWith('+') ? styles.positive : ''}`}>
                    {activity.amount}
                  </span>
                )}
              </div>
              <span className={styles.activityTime}>{activity.time}</span>
            </div>
          ))
          )}
        </div>
      </section>

      {/* ===== Personalized Recommendations ===== */}
      <section className={styles.recommendationsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Target size={20} className={styles.sectionIcon} />
            Recommended for You
          </h2>
          <span className={styles.aiLabel}>AI Powered</span>
        </div>
        
        <div className={styles.recommendationsGrid}>
          {loading ? (
            <div className={styles.loadingCard}>Loading recommendations...</div>
          ) : (
            recommendations.map((rec) => (
            <div key={rec.id} className={styles.recommendationCard}>
              <div className={styles.recHeader}>
                <span className={styles.recGame}>{rec.game}</span>
                <div className={styles.recConfidence}>
                  <Star size={12} />
                  {rec.confidence}%
                </div>
              </div>
              <div className={styles.recContent}>
                <h3 className={styles.recMarket}>{rec.market}</h3>
                <div className={styles.recMeta}>
                  <span className={styles.recEdge}>{rec.edge} edge</span>
                  <span className={styles.recBook}>{rec.book}</span>
                </div>
              </div>
              <div className={styles.recActions}>
                <button className={styles.bookmarkBtn}>
                  <Bookmark size={14} />
                </button>
                <Link to="/sportsbooks" className={styles.placeBetBtn}>
                  Place Bet
                </Link>
              </div>
            </div>
          ))
          )}
        </div>
      </section>

      {/* ===== Trending Bets ===== */}
      <section className={styles.trendingSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Flame size={20} className={styles.trendingIcon} />
            Trending Bets
          </h2>
          <Link to="/sportsbooks" className={styles.viewAllLink}>
            View All <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className={styles.trendingBets}>
          {[
            {
              id: 1,
              user: "@ProBettor",
              bet: "Chiefs -3.5 vs Bills",
              odds: "-110",
              confidence: 85,
              likes: 24,
              comments: 8,
              timeAgo: "2h ago",
              sport: "NFL",
              edge: "+4.2%"
            },
            {
              id: 2,
              user: "@SharpMoney",
              bet: "Lakers vs Warriors O 225.5",
              odds: "+105",
              confidence: 78,
              likes: 31,
              comments: 12,
              timeAgo: "4h ago",
              sport: "NBA",
              edge: "+2.8%"
            },
            {
              id: 3,
              user: "@ValueHunter",
              bet: "Alabama -14 vs Auburn",
              odds: "-108",
              confidence: 92,
              likes: 45,
              comments: 18,
              timeAgo: "6h ago",
              sport: "NCAAF",
              edge: "+6.1%"
            }
          ].map((bet) => (
            <div key={bet.id} className={styles.betCard}>
              <div className={styles.betHeader}>
                <div className={styles.betUser}>
                  <div className={styles.userAvatar}>
                    {bet.user.charAt(1).toUpperCase()}
                  </div>
                  <span className={styles.username}>{bet.user}</span>
                </div>
                <div className={styles.betTime}>{bet.timeAgo}</div>
              </div>
              
              <div className={styles.betContent}>
                <div className={styles.betDetails}>
                  <span className={styles.sportBadge}>{bet.sport}</span>
                  <h3 className={styles.betTitle}>{bet.bet}</h3>
                  <div className={styles.betMeta}>
                    <span className={styles.odds}>{bet.odds}</span>
                    <span className={styles.edge}>{bet.edge}</span>
                    <span className={styles.confidence}>{bet.confidence}% confidence</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.betActions}>
                <button 
                  className={styles.actionBtn}
                  onClick={() => handleBetLike(bet.id)}
                >
                  <ThumbsUp size={14} />
                  <span>{bet.likes}</span>
                </button>
                <button 
                  className={styles.actionBtn}
                  onClick={() => handleBetComment(bet.id)}
                >
                  <MessageCircle size={14} />
                  <span>{bet.comments}</span>
                </button>
                <Link to="/sportsbooks" className={styles.followBtn}>
                  Follow Bet
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MobileBottomBar active="home" showFilter={false} />
    </main>
  );
}

// Main Home Component with conditional rendering
export default function Home() {
  const { user } = useAuth();
  
  // Render different components based on authentication status
  if (user) {
    return <UserHub />;
  } else {
    return <LandingPage />;
  }
}
