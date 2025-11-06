import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import SEOHelmet from '../components/seo/SEOHelmet';
import { generateSchemaMarkup } from '../utils/seo';
import { 
  Target, 
  Shield, 
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Play,
  ArrowRight,
  Zap,
  Eye,
  DollarSign,
  CheckCircle,
  Star,
  Sparkles,
  Trophy,
  Clock,
  Copy,
  Check,
  ChevronRight,
  Flame,
  AlertCircle,
  Gamepad2
} from 'lucide-react';

// Components
import EdgeCalculator from '../components/betting/EdgeCalculator';
import Pricing from '../components/billing/Pricing';

// Styles
import '../styles/landing-revamp.css';

const QUICK_ACTIONS = [
  {
    title: "Odds Scanner",
    description: "Find the best lines across sportsbooks",
    icon: Target,
    link: "/sportsbooks",
    color: "var(--accent)"
  },
  {
    title: "Analytics",
    description: "Advanced betting analytics", 
    icon: BarChart3,
    link: "/picks",
    color: "var(--info)"
  }
];

// Stats for social proof
const STATS = [
  { number: "15+", label: "Sportsbooks" },
  { number: "4.2%", label: "Avg Edge" },
  { number: "24/7", label: "Live Updates" }
];

// Features showcase
const FEATURES = [
  {
    icon: Eye,
    title: "Real-Time Odds Comparison",
    description: "Compare odds across 39+ sportsbooks instantly. Never miss the best line again.",
    color: "#8b5cf6"
  },
  {
    icon: TrendingUp,
    title: "+EV Bet Finder",
    description: "Our algorithm identifies positive expected value bets with edge calculations in real-time.",
    color: "#10b981"
  },
  {
    icon: Target,
    title: "Player Props Analysis",
    description: "Deep dive into player props with historical data, trends, and line movement tracking.",
    color: "#f59e0b"
  },
  {
    icon: Zap,
    title: "Arbitrage Detection",
    description: "Automatically find arbitrage opportunities across sportsbooks for guaranteed profits.",
    color: "#ec4899"
  }
];

// Testimonials
const TESTIMONIALS = [
  {
    name: "Mike Johnson",
    role: "Professional Bettor",
    content: "OddSightSeer helped me increase my ROI by 15% in just 3 months. The +EV finder is a game-changer.",
    rating: 5
  },
  {
    name: "Sarah Chen",
    role: "Sports Analyst",
    content: "Best odds comparison tool I've used. The player props analysis is incredibly detailed and accurate.",
    rating: 5
  },
  {
    name: "David Martinez",
    role: "Casual Bettor",
    content: "Finally found a platform that makes line shopping easy. Saved hundreds on better odds already.",
    rating: 5
  }
];

// Bookmakers showcase
const BOOKMAKERS = {
  'Top Tier': [
    { name: 'DraftKings', key: 'draftkings' },
    { name: 'FanDuel', key: 'fanduel' },
    { name: 'BetMGM', key: 'betmgm' },
    { name: 'Caesars', key: 'caesars' }
  ],
  'DFS Apps': [
    { name: 'PrizePicks', key: 'prizepicks', isDFS: true },
    { name: 'Underdog', key: 'underdog', isDFS: true },
    { name: 'DK Pick6', key: 'pick6', isDFS: true },
    { name: 'Dabble', key: 'dabble_au', isDFS: true }
  ],
  'Major Operators': [
    { name: 'ESPN BET', key: 'espnbet' },
    { name: 'Fanatics', key: 'fanatics' },
    { name: 'Hard Rock', key: 'hardrock' },
    { name: 'PointsBet', key: 'pointsbetus' },
    { name: 'BetRivers', key: 'betrivers' },
    { name: 'WynnBET', key: 'wynnbet' },
    { name: 'Unibet', key: 'unibet_us' }
  ],
  'Sharp Books': [
    { name: 'Pinnacle', key: 'pinnacle' },
    { name: 'NoVig', key: 'novig' }
  ],
  'Exchanges': [
    { name: 'ProphetX', key: 'prophetx', isExchange: true },
    { name: 'ReBet', key: 'rebet', isExchange: true },
    { name: 'BetOpenly', key: 'betopenly', isExchange: true }
  ]
};

// Landing Page Component for non-authenticated users
export default function Landing() {
  const [showEdgeCalculator, setShowEdgeCalculator] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSignOutMessage, setShowSignOutMessage] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const navigate = useNavigate();
  const PROMO_CODE = 'Plat';
  const PROMO_DISCOUNT = '50%';

  const copyPromoCode = () => {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  useEffect(() => {
    const signedOut = searchParams.get('signed_out');
    if (signedOut) {
      setShowSignOutMessage(true);
      // Clear the URL parameter after showing the message
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('signed_out');
      setSearchParams(newParams, { replace: true });
      
      // Hide the message after 5 seconds
      setTimeout(() => setShowSignOutMessage(false), 5000);
    }
  }, [searchParams, setSearchParams]);

  // Scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const organizationSchema = generateSchemaMarkup('Organization');
  const webAppSchema = generateSchemaMarkup('WebApplication');

  return (
    <div className="landing-page-revamp" style={{ background: 'var(--bg-primary)' }}>
      <SEOHelmet
        title="OddSightSeer — Find +EV Bets & Compare Sportsbook Odds"
        description="Find +EV bets with real-time odds comparison across 15+ major sportsbooks. Spot arbitrage opportunities, track line movement, and maximize your betting edge."
        path="/"
        type="website"
        schema={organizationSchema}
      />
      
      {/* Sign Out Success Message */}
      {showSignOutMessage && (
        <div className="success-toast">
          ✅ You have been signed out successfully
        </div>
      )}

      
      {/* Hero Section - Revamped */}
      <section className="hero-revamp">
        <div className="hero-background-effects">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-grid"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-badge-new">
            <Sparkles size={14} />
            <span>Trusted by Serious Sports Bettors</span>
          </div>
          
          <h1 className="hero-title-new">
            Turn $100 Into
            <span className="gradient-text"> $2,400+ in 30 Days</span>
          </h1>
          
          <p className="hero-subtitle-new">
            Compare live odds across 15+ sportsbooks, find +EV bets with 4.2% average edge, and track your performance with advanced analytics.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-group" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} className="cta-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} />
              Get Started Today
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section animate-on-scroll">
        <div className="stats-container">
          {STATS.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section-new animate-on-scroll">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              Everything You Need to <span className="gradient-text">Win More</span>
            </h2>
            <p className="section-subtitle">
              Powerful tools designed for serious sports bettors
            </p>
          </div>

          <div className="features-grid-new">
            {FEATURES.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="feature-card-new">
                  <div className="feature-icon-wrapper" style={{background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`}}>
                    <IconComponent size={28} />
                  </div>
                  <h3 className="feature-title-new">{feature.title}</h3>
                  <p className="feature-desc-new">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bookmakers Showcase Section */}
      <section className="bookmakers-section animate-on-scroll" style={{
        padding: '80px 20px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.05) 100%)'
      }}>
        <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-header" style={{ marginBottom: '60px' }}>
            <h2 className="section-title">
              Compare Odds Across <span className="gradient-text">39+ Bookmakers</span>
            </h2>
            <p className="section-subtitle">
              Access the most comprehensive sportsbook coverage in the industry
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
            {Object.entries(BOOKMAKERS).map(([category, books]) => (
              <div key={category}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {category === 'DFS Apps' && <Gamepad2 size={24} color="#8b5cf6" />}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {category}
                  </h3>
                  <span style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    fontWeight: '500'
                  }}>
                    ({books.length} {books.length === 1 ? 'book' : 'books'})
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px'
                }}>
                  {books.map((book, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(139, 92, 246, 0.08)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '50px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {book.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '60px',
            padding: '24px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.6'
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Free users</strong> can compare DraftKings, FanDuel, and Caesars. 
              <br />
              <strong style={{ color: 'var(--text-primary)' }}>Gold & Platinum users</strong> get access to all 39+ bookmakers including DFS apps, sharp books, and exchanges.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works animate-on-scroll" style={{
        padding: '80px 20px',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)'
      }}>
        <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-header" style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ margin: 0, display: 'inline' }}>
                How It <span className="gradient-text">Works</span>
              </h2>
            </div>
            <p className="section-subtitle">
              Start finding +EV bets in 3 simple steps
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
            marginBottom: '40px'
          }}>
            {[
              {
                step: '1',
                title: 'Choose Your Plan',
                description: 'Select Gold ($10/mo) or Platinum ($25/mo). Both include access to 25+ sportsbooks.',
                icon: Users
              },
              {
                step: '2',
                title: 'Select Your Sportsbooks',
                description: 'Choose which sportsbooks you use. We compare odds across all of them.',
                icon: Target
              },
              {
                step: '3',
                title: 'Find +EV Bets',
                description: 'Our algorithm identifies profitable bets with positive expected value.',
                icon: TrendingUp
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: '#fff'
                  }}>
                    <Icon size={28} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    width: '30px',
                    height: '30px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    {item.step}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="social-proof animate-on-scroll" style={{ padding: '80px 20px' }}>
        <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-header" style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ margin: 0, display: 'inline' }}>
                Trusted by <span className="gradient-text">Winning Bettors</span>
              </h2>
            </div>
            <p className="section-subtitle">
              See what real users are saying
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {TESTIMONIALS.map((testimonial, idx) => (
              <div key={idx} style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px', flex: 1 }}>
                  "{testimonial.content}"
                </p>
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px', margin: '0 0 2px 0' }}>
                    {testimonial.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section animate-on-scroll" style={{
        padding: '80px 20px',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)'
      }}>
        <div className="section-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="section-header" style={{ marginBottom: '60px', textAlign: 'center' }}>
            <h2 className="section-title" style={{ margin: 0, display: 'inline' }}>
              <span className="gradient-text">FAQ</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                q: 'What\'s the difference between Gold and Platinum?',
                a: 'Both plans include access to 25+ sportsbooks, +EV finder, and player props. Platinum ($25/mo) adds arbitrage opportunities, live betting markets, and advanced analytics for serious bettors.'
              },
              {
                q: 'How accurate is the +EV calculation?',
                a: 'Our algorithm uses industry-standard EV calculations based on real market data from 25+ sportsbooks. Results depend on your betting discipline.'
              },
              {
                q: 'Can I use this with my current sportsbooks?',
                a: 'Absolutely! OddSightSeer works with DraftKings, FanDuel, BetMGM, Caesars, and 20+ other major sportsbooks.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, you can cancel your subscription at any time. You\'ll have access until the end of your current billing period.'
              }
            ].map((faq, idx) => (
              <details key={idx} style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer'
              }}>
                <summary style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'none'
                }}>
                  {faq.q}
                  <ChevronRight size={20} />
                </summary>
                <p style={{
                  marginTop: '12px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section-landing animate-on-scroll">
        <div className="section-container">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ margin: 0, display: 'inline' }}>
                Choose Your <span className="gradient-text">Winning Plan</span>
              </h2>
            </div>
            <p className="section-subtitle">
              Both plans include access to 25+ sportsbooks.
            </p>
          </div>
          <Pricing />
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        textAlign: 'center'
      }}>
        <div className="section-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
            Ready to Win More Bets?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '32px' }}>
            Join bettors who are using OddSightSeer to find +EV bets and maximize their ROI.
          </p>
          <button onClick={() => navigate('/login')} style={{
            padding: '14px 32px',
            background: '#fff',
            color: '#8b5cf6',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Zap size={18} />
            Get Started Now
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Edge Calculator Modal */}
      {showEdgeCalculator && (
        <EdgeCalculator 
          onClose={() => setShowEdgeCalculator(false)} 
          onNavigateToSportsbooks={() => {
            setShowEdgeCalculator(false);
            window.location.href = '/sportsbooks';
          }}
        />
      )}
    </div>
  );
}
