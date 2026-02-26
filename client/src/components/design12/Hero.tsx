import { ChevronRight, Shield, Clock, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  onGetStartedClick?: () => void;
}

export function Hero({ onGetStartedClick = () => {} }: HeroProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Simplified Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="pt-32 md:pt-40 pb-16">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
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

          {/* Hero Image - App Screenshot Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 md:mt-16 max-w-5xl mx-auto"
          >
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent blur-2xl -z-10 scale-95" />
              
              {/* Browser mockup frame */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Browser header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/10 rounded-lg px-4 py-1.5 text-white/40 text-sm text-center max-w-xs mx-auto">
                      oddsightseer.com
                    </div>
                  </div>
                </div>
                
                {/* App content preview */}
                <div className="p-4 md:p-6 bg-slate-900/50">
                  {/* Mini toolbar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20" />
                      <div className="h-3 w-24 bg-white/20 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-white/10 rounded-lg" />
                      <div className="h-8 w-20 bg-purple-500/30 rounded-lg" />
                    </div>
                  </div>
                  
                  {/* Table preview */}
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((row) => (
                      <div key={row} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-white/10" />
                        <div className="flex-1">
                          <div className="h-3 w-32 bg-white/20 rounded mb-2" />
                          <div className="h-2 w-20 bg-white/10 rounded" />
                        </div>
                        <div className="text-right">
                          <div className="h-3 w-12 bg-white/20 rounded mb-2" />
                          <div className="h-4 w-16 bg-emerald-500/30 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 md:top-4 md:right-4 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                Live Data
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}