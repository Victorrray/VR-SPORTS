import { ArrowRight, Play, Sparkles, TrendingUp, Zap, Shield, ChevronRight } from 'lucide-react';
import { BetCard } from './BetCard';
import { motion } from 'framer-motion';
import { useFeaturedPick } from '../../hooks/useFeaturedPick';

interface HeroProps {
  onGetStartedClick?: () => void;
}

export function Hero({ onGetStartedClick = () => {} }: HeroProps) {
  const { bet, loading } = useFeaturedPick();

  // Transform API bet to BetCard format
  const featuredBet = bet ? {
    id: Number(bet.id),
    teams: bet.teams,
    time: bet.gameTime,
    pick: bet.pick,
    odds: String(bet.odds),
    sportsbook: bet.sportsbook,
    ev: bet.ev,
    sport: bet.sport,
    status: 'active',
    confidence: 'High',
  } : {
    id: 0,
    teams: 'Loading...',
    time: 'Loading...',
    pick: 'Loading...',
    odds: '-',
    sportsbook: 'Loading...',
    ev: '-',
    sport: 'NBA',
    status: 'active',
    confidence: 'High',
  };

  const floatingCards = [
    { label: '+EV Found', value: '+4.2%', color: 'from-green-500 to-emerald-600', delay: 0 },
    { label: 'Best Line', value: '-110', color: 'from-purple-500 to-violet-600', delay: 0.2 },
    { label: 'Books Compared', value: '45+', color: 'from-blue-500 to-cyan-600', delay: 0.4 },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute top-20 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 -right-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(139, 92, 246, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(139, 92, 246, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto py-20 md:py-28 lg:py-32">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-full mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-semibold">Free Odds Viewer Available</span>
            </motion.div>

            {/* Large Headline with Gradient */}
            <h1 className="mb-6 leading-[1.05] font-extrabold tracking-tight">
              <span className="text-white block" style={{fontSize: 'clamp(2.5rem, 7vw, 4.5rem)'}}>
                🔥 Stop Leaving
              </span>
              <span 
                className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent block"
                style={{fontSize: 'clamp(2.5rem, 7vw, 4.5rem)'}}
              >
                Money on the Table
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-white/60 text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Compare odds across <span className="text-white font-semibold">45+ sportsbooks</span> instantly. 
              Find +EV bets, arbitrage opportunities, and the best lines in seconds.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-10">
              <motion.button 
                className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all overflow-hidden"
                onClick={onGetStartedClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Start Free
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
              
              <a 
                href="#how-it-works" 
                className="group flex items-center gap-2 px-6 py-4 text-white/80 hover:text-white font-semibold transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                See how it works
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Real-time data</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>45+ sportsbooks</span>
              </div>
            </div>
          </motion.div>

          {/* Right Visual Element - Dynamic Cards */}
          <motion.div 
            className="relative hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-full max-w-lg">
              {/* Main Card */}
              <motion.div 
                className="relative z-10"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-400 text-sm font-semibold">Live Odds</span>
                    </div>
                    <span className="text-white/40 text-xs">Updated 2s ago</span>
                  </div>
                  <BetCard bet={featuredBet} variant="hero" showActions={false} />
                </div>
              </motion.div>

              {/* Floating Stat Cards */}
              {floatingCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  className={`absolute ${
                    index === 0 ? '-top-4 -left-8' : 
                    index === 1 ? 'top-1/2 -right-12' : 
                    '-bottom-4 -left-4'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + card.delay }}
                >
                  <motion.div 
                    className={`bg-gradient-to-br ${card.color} p-4 rounded-2xl shadow-xl`}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: card.delay }}
                  >
                    <div className="text-white/80 text-xs font-medium mb-1">{card.label}</div>
                    <div className="text-white text-xl font-bold">{card.value}</div>
                  </motion.div>
                </motion.div>
              ))}

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full -z-10" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 50L48 45.7C96 41.3 192 32.7 288 35.8C384 39 480 54 576 59.2C672 64.3 768 59.7 864 52.5C960 45.3 1056 35.7 1152 35.8C1248 36 1344 46 1392 51L1440 56V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="rgb(15 23 42)" fillOpacity="0.5"/>
        </svg>
      </div>
    </section>
  );
}