import { ArrowRight, Play, Sparkles } from 'lucide-react';
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

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Grid Background - Full Width */}
      <div 
        className="absolute inset-0 z-0 left-1/2 -translate-x-1/2 w-screen overflow-visible"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168, 85, 247, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: 'center center',
          minWidth: '100vw',
          minHeight: '100%',
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 xl:gap-20 items-center max-w-[90rem] mx-auto w-full py-16 md:py-24 lg:py-32 px-4 md:px-8">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Large Headline */}
            <h1 className="text-white mb-6 md:mb-8 leading-[1.1] font-bold" style={{fontSize: 'clamp(2.5rem, 8vw, 5rem)'}}>
              Bet smarter,<br />
              <span className="text-purple-400">
                Win more.
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-white/60 text-base md:text-lg mb-8 md:mb-10 max-w-lg leading-relaxed font-medium">
              Find positive expected value opportunities across 40+ sportsbooks.
              Make data-driven decisions with real-time odds comparison.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 md:gap-6">
              <button 
                className="w-full sm:w-auto px-8 py-3 md:py-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all text-center font-semibold"
                onClick={onGetStartedClick}
              >
                Get started
              </button>
              
              <a href="#features" className="text-white/70 hover:text-white text-sm flex items-center gap-2 transition-colors group font-semibold">
                See how it works
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Announcement Banner */}
    

          </motion.div>

          {/* Right Visual Element */}
          <motion.div 
            className="relative hidden md:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Bet Card Preview */}
            <div className="relative h-[500px] flex items-center justify-center">
              <div className="w-full max-w-[500px]">
                {/* Featured Pick Badge */}
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 backdrop-blur-xl rounded-full">
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span className="text-white font-bold text-sm">Featured Pick</span>
                  </div>
                </div>
                <BetCard bet={featuredBet} variant="hero" showActions={false} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}