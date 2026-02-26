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

          {/* Hero Image - OddsTable Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 md:mt-16 max-w-4xl mx-auto"
          >
            <div className="relative">
              {/* Glow effect behind */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent blur-2xl -z-10 scale-95" />
              
              {/* Table container */}
              <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-white/5">
                  <div className="col-span-4 text-white/50 text-xs font-semibold uppercase tracking-wider">Matchup</div>
                  <div className="col-span-2 text-white/50 text-xs font-semibold uppercase tracking-wider">Market</div>
                  <div className="col-span-2 text-white/50 text-xs font-semibold uppercase tracking-wider">Best Odds</div>
                  <div className="col-span-2 text-white/50 text-xs font-semibold uppercase tracking-wider">Book</div>
                  <div className="col-span-2 text-white/50 text-xs font-semibold uppercase tracking-wider text-right">Edge</div>
                </div>

                {/* Visible Rows */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5">
                  <div className="col-span-4">
                    <div className="text-white font-semibold">Knicks vs 76ers</div>
                    <div className="text-white/50 text-sm">Knicks -4.5</div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">Spread</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-white font-bold">-105</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-white/70">FanDuel</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-500/20 text-emerald-400">+4.1%</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5">
                  <div className="col-span-4">
                    <div className="text-white font-semibold">Ravens vs Bengals</div>
                    <div className="text-white/50 text-sm">Ravens ML</div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">Moneyline</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-white font-bold">-135</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-white/70">DraftKings</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-500/20 text-emerald-400">+3.5%</span>
                  </div>
                </div>

                {/* Locked Rows */}
                {[1, 2].map((row) => (
                  <div key={row} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 opacity-40">
                    <div className="col-span-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <div>
                        <div className="text-white/30">••••••••••••</div>
                        <div className="text-white/20 text-sm">••••••••</div>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-white/30">•••••</span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-white/30 font-bold">•••</span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-white/30">••••••••</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-white/5 text-white/30">•••</span>
                    </div>
                  </div>
                ))}

                {/* Unlock CTA */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-t border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Unlock Full Access</p>
                        <p className="text-white/50 text-xs">Get real-time odds, all markets, and +EV alerts</p>
                      </div>
                    </div>
                    <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2">
                      Get Started Free
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}