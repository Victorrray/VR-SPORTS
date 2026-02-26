import { ChevronRight, Shield, Clock, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  onGetStartedClick?: () => void;
}

export function Hero({ onGetStartedClick = () => {} }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-950">
      {/* Simplified Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/8 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto py-24 md:py-32">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Free Viewer Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-full mb-6 shadow-lg shadow-purple-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span className="text-white text-sm font-semibold">Free Odds Viewer Available</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Bet smarter,{' '}
              <span className="text-purple-400">win more.</span>
            </h1>
            
            {/* Subheading */}
            <p className="text-white/50 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Compare odds across 45+ sportsbooks instantly. Find +EV bets, arbitrage opportunities, and the best lines in seconds.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button 
                className="group w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
                onClick={onGetStartedClick}
              >
                Get Started Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <a 
                href="#how-it-works" 
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all"
              >
                See How It Works
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Real-time data</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>45+ sportsbooks</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}