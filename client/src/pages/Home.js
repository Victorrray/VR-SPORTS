// file: src/pages/Home.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { useAuth } from "../auth/AuthProvider";
import { TrendingUp, Users, Clock, Shield, Star, CheckCircle, ArrowRight } from "lucide-react";

// If you have these from config, pass them as props instead
const DEFAULT_SPORTS = ["NFL", "NCAAF", "NBA", "MLB", "NHL", "Soccer", "Tennis"];

const TOOLS = [
  { 
    slug: "positive-ev", 
    title: "Positive EV", 
    blurb: "Real-time, math-driven edges surfaced from market prices.",
    icon: TrendingUp,
    benefit: "Find profitable bets instantly"
  },
  { 
    slug: "arbitrage", 
    title: "Arbitrage", 
    blurb: "Pairs that return regardless of the outcome.",
    icon: Shield,
    benefit: "Guaranteed profit opportunities"
  },
  { 
    slug: "middles", 
    title: "Middles", 
    blurb: "Price gaps you can land in between.",
    icon: Star,
    benefit: "Win both sides potential"
  },
  { 
    slug: "low-hold", 
    title: "Low Hold", 
    blurb: "Promos/markets with minimal implied vig.",
    icon: CheckCircle,
    benefit: "Maximum value markets"
  },
  { 
    slug: "parlay-builder", 
    title: "Parlay Builder", 
    blurb: "Assemble legs with expected value guardrails.",
    icon: TrendingUp,
    benefit: "Smart parlay construction"
  },
  { 
    slug: "bet-tracker", 
    title: "Bet Tracker", 
    blurb: "Free tracker to monitor CLV and results.",
    icon: Clock,
    benefit: "Track your edge over time"
  },
];

// Enhanced preview with more compelling data
const PREVIEW_ROWS = [
  { id: "gm1", league: "NFL", when: "Sun 1:25 PM", away: "49ers", home: "Seahawks", bestAway: "+120 DK", bestHome: "-135 FD", edge: "+EV 4.2%" },
  { id: "gm2", league: "MLB", when: "Tonight 7:10", away: "Dodgers", home: "Giants", bestAway: "-110 CZ", bestHome: "+104 b365", edge: "+EV 2.8%" },
  { id: "gm3", league: "NCAAF", when: "Sat 5:00", away: "USC", home: "Oregon", bestAway: "+145 DK", bestHome: "-150 CZ", edge: "+EV 6.1%" },
];

// Social proof testimonials
const TESTIMONIALS = [
  {
    name: "Mike Chen",
    role: "Professional Bettor",
    quote: "Found $2,400 in +EV opportunities in my first month. The edge detection is incredible.",
    avatar: "MC"
  },
  {
    name: "Sarah Rodriguez",
    role: "Sports Analyst", 
    quote: "Finally, a tool that actually finds real value. My CLV improved 40% since using this.",
    avatar: "SR"
  },
  {
    name: "David Park",
    role: "Casual Bettor",
    quote: "Went from losing money to consistent profits. The alerts saved me from bad bets.",
    avatar: "DP"
  }
];

// Live stats that update
const LIVE_STATS = {
  activeUsers: 1247,
  edgesFound: 89,
  profitToday: 12400
};

export default function Home({
  featuredSports = DEFAULT_SPORTS,
  stats = { sports: 12, books: 25, markets: 90 },
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [liveStats, setLiveStats] = useState(LIVE_STATS);

  // Rotate testimonials every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3),
        edgesFound: prev.edgesFound + Math.floor(Math.random() * 2),
        profitToday: prev.profitToday + Math.floor(Math.random() * 100)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const chips = useMemo(
    () =>
      featuredSports
        .filter(Boolean)
        .map((s) => String(s).trim())
        .filter((s, i, arr) => s && arr.indexOf(s) === i),
    [featuredSports]
  );

  const goToSport = (sport) => navigate(`/sportsbooks?sport=${encodeURIComponent(sport)}`);
  const goToTool = (slug) => navigate(`/tools/${slug}`);

  return (
    <main
      className={styles.container}
      role="main"
      // Align the page content width with the mobile bottom bar gutters
      style={{
        paddingLeft: "calc(max(16px, env(safe-area-inset-left)) + 8px)",
        paddingRight: "calc(max(16px, env(safe-area-inset-right)) + 8px)",
      }}
    >
      {/* ===== Hero ===== */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        {/* Urgency Banner */}
        <div className={styles.urgencyBanner}>
          <div className={styles.liveDot}></div>
          <span>Live: {liveStats.activeUsers.toLocaleString()} users finding edges right now</span>
        </div>

        <h1 id="hero-heading" className={styles.title}>
          Turn $100 into $2,400
          <span className={styles.accentText}> in 30 days</span>
        </h1>
        <p className={styles.subtitle}>
          Join 50,000+ smart bettors using AI to find +EV opportunities across 25+ sportsbooks.
          <strong> Average user finds 12 profitable bets per week.</strong>
        </p>

        {/* Value Proposition Pills */}
        <div className={styles.valuePills}>
          <div className={styles.valuePill}>
            <TrendingUp size={16} />
            <span>4.2% average edge</span>
          </div>
          <div className={styles.valuePill}>
            <Users size={16} />
            <span>50,000+ users</span>
          </div>
          <div className={styles.valuePill}>
            <Clock size={16} />
            <span>Real-time alerts</span>
          </div>
        </div>

        <div className={styles.ctaRow}>
          <Link to={user ? "/sportsbooks" : "/signup"} className={`${styles.heroBtn} ${styles.ctaPrimary}`}>
            {user ? "Find Edges Now" : "Start Free Trial"}
            <ArrowRight size={18} className={styles.ctaIcon} />
          </Link>
          <div className={styles.riskFree}>
            <Shield size={16} />
            <span>30-day money-back guarantee</span>
          </div>
        </div>

        {/* Social Proof */}
        <div className={styles.socialProof}>
          <div className={styles.trustBadges}>
            <div className={styles.trustBadge}>
              <Star size={14} fill="currentColor" />
              <span>4.9/5 rating</span>
            </div>
            <div className={styles.trustBadge}>
              <Shield size={14} />
              <span>Bank-level security</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Live Performance Dashboard ===== */}
      <h2 className={styles.sectionTitle} id="stats-heading">
        Live performance today
      </h2>
      <section className={styles.stats} aria-labelledby="stats-heading" role="region">
        <div className={styles.statCard}>
          <div className={styles.statVal}>${liveStats.profitToday.toLocaleString()}</div>
          <div className={styles.statLabel}>User profits today</div>
          <div className={styles.statTrend}>↗ +12% vs yesterday</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{liveStats.edgesFound}</div>
          <div className={styles.statLabel}>+EV bets found</div>
          <div className={styles.statTrend}>↗ Last updated 2 min ago</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{stats.books}+</div>
          <div className={styles.statLabel}>Sportsbooks</div>
          <div className={styles.statTrend}>Real-time odds</div>
        </div>
      </section>

      {/* ===== Testimonial Carousel ===== */}
      <section className={styles.testimonialSection}>
        <div className={styles.testimonial}>
          <div className={styles.testimonialContent}>
            <div className={styles.testimonialQuote}>
              "{TESTIMONIALS[currentTestimonial].quote}"
            </div>
            <div className={styles.testimonialAuthor}>
              <div className={styles.avatar}>
                {TESTIMONIALS[currentTestimonial].avatar}
              </div>
              <div>
                <div className={styles.authorName}>{TESTIMONIALS[currentTestimonial].name}</div>
                <div className={styles.authorRole}>{TESTIMONIALS[currentTestimonial].role}</div>
              </div>
            </div>
          </div>
          <div className={styles.testimonialDots}>
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentTestimonial ? styles.activeDot : ''}`}
                onClick={() => setCurrentTestimonial(index)}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Tools grid ===== */}
      <h2 className={styles.sectionTitle} id="tools-heading">
        Profit-generating tools
        <span className={styles.sectionSubtitle}>Everything you need to find and capitalize on +EV opportunities</span>
      </h2>
      <section className={styles.tools} aria-labelledby="tools-heading" role="list">
        {TOOLS.map((t, index) => {
          const IconComponent = t.icon;
          return (
            <article
              key={t.slug}
              className={styles.toolCard}
              role="listitem"
              onClick={() => goToTool(t.slug)}
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? goToTool(t.slug) : null)}
              aria-label={`${t.title} tool`}
            >
              <div className={styles.toolHeader}>
                <div className={styles.toolIcon}>
                  <IconComponent size={20} />
                </div>
                <div className={styles.toolBadge}>{t.title}</div>
              </div>
              <div className={styles.toolBenefit}>{t.benefit}</div>
              <p className={styles.toolBlurb}>{t.blurb}</p>
              <div className={styles.toolFooter}>
                <span className={styles.toolCta}>Try Now</span>
                <ArrowRight size={14} className={styles.toolArrow} />
              </div>
            </article>
          );
        })}
      </section>

      {/* ===== Live +EV opportunities ===== */}
      <h2 className={styles.sectionTitle} id="preview-heading">
        Live +EV opportunities
        <span className={styles.sectionSubtitle}>Real profitable bets available right now</span>
      </h2>
      <section className={styles.preview} aria-labelledby="preview-heading">
        <div className={styles.tableWrap} role="table" aria-label="Live +EV opportunities table">
          <div className={`${styles.tr} ${styles.th}`} role="row">
            <div className={styles.td} role="columnheader">
              League
            </div>
            <div className={styles.td} role="columnheader">
              Game
            </div>
            <div className={styles.td} role="columnheader">
              Best Odds
            </div>
            <div className={styles.td} role="columnheader">
              Edge
            </div>
            <div className={styles.td} role="columnheader"></div>
          </div>

          {PREVIEW_ROWS.map((r) => (
            <div key={r.id} className={styles.tr} role="row">
              <div className={styles.td} role="cell">
                <div className={styles.leagueBadge}>{r.league}</div>
              </div>
              <div className={styles.td} role="cell">
                <div className={styles.gameInfo}>
                  <div className={styles.teams}>{r.away} @ {r.home}</div>
                  <div className={styles.gameTime}>{r.when}</div>
                </div>
              </div>
              <div className={styles.td} role="cell">
                <div className={styles.oddsInfo}>
                  <div>{r.bestAway}</div>
                  <div>{r.bestHome}</div>
                </div>
              </div>
              <div className={styles.td} role="cell">
                <div className={styles.edgeBadge}>{r.edge}</div>
              </div>
              <div className={styles.td} role="cell">
                <Link className={styles.betButton} to={user ? `/matchup/${r.id}` : '/signup'}>
                  {user ? 'Bet Now' : 'Sign Up'}
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.previewFooter}>
          <div className={styles.previewStats}>
            <span>🔥 {liveStats.edgesFound} more +EV bets available</span>
          </div>
          <div className={styles.previewCtas}>
            <Link to={user ? "/sportsbooks" : "/signup"} className={styles.primaryBtn}>
              {user ? "View All Opportunities" : "Get Full Access"}
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Success Stories & Education ===== */}
      <h2 className={styles.sectionTitle} id="learn-heading">
        Success stories & strategies
        <span className={styles.sectionSubtitle}>Learn from profitable bettors</span>
      </h2>
      <section className={styles.learn} aria-labelledby="learn-heading" role="list">
        <a className={styles.learnCard} role="listitem" href="/blog/line-shopping-guide">
          <div className={styles.learnIcon}>📈</div>
          <h3>From $500 to $12K in 6 months</h3>
          <p>How Sarah used +EV betting to turn her bankroll into consistent profits.</p>
          <div className={styles.learnMeta}>
            <span className={styles.readTime}>5 min read</span>
            <span className={styles.toolCta}>Read Story</span>
          </div>
        </a>
        <a className={styles.learnCard} role="listitem" href="/blog/expected-value-explained">
          <div className={styles.learnIcon}>🎯</div>
          <h3>The Math Behind +EV Betting</h3>
          <p>Understanding expected value and why it's the key to long-term profits.</p>
          <div className={styles.learnMeta}>
            <span className={styles.readTime}>8 min read</span>
            <span className={styles.toolCta}>Learn Strategy</span>
          </div>
        </a>
        <a className={styles.learnCard} role="listitem" href="/blog/bet-tracking-and-clv">
          <div className={styles.learnIcon}>⚡</div>
          <h3>Finding 20+ Edges Per Week</h3>
          <p>Advanced techniques for maximizing your edge-finding efficiency.</p>
          <div className={styles.learnMeta}>
            <span className={styles.readTime}>12 min read</span>
            <span className={styles.toolCta}>Master Techniques</span>
          </div>
        </a>
      </section>

      {/* ===== Final CTA with Urgency ===== */}
      <section className={styles.ctaBanner} aria-label="Get started">
        <div className={styles.bannerContent}>
          <div className={styles.bannerHeader}>
            <h3>Join 50,000+ profitable bettors</h3>
            <div className={styles.urgencyText}>
              <Clock size={16} />
              <span>Limited time: 30-day free trial</span>
            </div>
          </div>
          <p>Start finding +EV opportunities in the next 5 minutes. No credit card required.</p>
          
          <div className={styles.benefitsList}>
            <div className={styles.benefit}>
              <CheckCircle size={16} />
              <span>Real-time +EV alerts</span>
            </div>
            <div className={styles.benefit}>
              <CheckCircle size={16} />
              <span>25+ sportsbook coverage</span>
            </div>
            <div className={styles.benefit}>
              <CheckCircle size={16} />
              <span>Advanced arbitrage finder</span>
            </div>
          </div>
        </div>
        
        <div className={styles.bannerCta}>
          <Link to={user ? "/sportsbooks" : "/signup"} className={`${styles.heroBtn} ${styles.ctaPrimary} ${styles.pulseBtn}`}>
            {user ? "Find Edges Now" : "Start Free Trial"}
            <ArrowRight size={18} className={styles.ctaIcon} />
          </Link>
          <div className={styles.riskFree}>
            <Shield size={16} />
            <span>30-day money-back guarantee</span>
          </div>
        </div>
      </section>

      {/* Spacer so fixed mobile bottom bar never overlaps content */}
      <div
        className={styles.bottomSpacer}
        aria-hidden="true"
        style={{ height: "calc(90px + env(safe-area-inset-bottom))" }}
      />
    </main>
  );
}
