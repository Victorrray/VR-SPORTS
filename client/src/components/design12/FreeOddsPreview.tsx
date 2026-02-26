import { motion } from 'framer-motion';
import { Sparkles, Lock, TrendingUp, ArrowRight, Building2, Clock } from 'lucide-react';

interface FreeOddsPreviewProps {
  onGetStartedClick: () => void;
}

// Sample data for the preview
const sampleBets = [
  {
    id: 1,
    matchup: 'Knicks vs 76ers',
    market: 'Spread',
    pick: 'Knicks -4.5',
    bestOdds: '-105',
    bestBook: 'FanDuel',
    edge: '+4.1%',
    isLocked: false,
  },
  {
    id: 2,
    matchup: 'Ravens vs Bengals',
    market: 'Moneyline',
    pick: 'Ravens ML',
    bestOdds: '-135',
    bestBook: 'DraftKings',
    edge: '+3.5%',
    isLocked: false,
  },
  {
    id: 3,
    matchup: 'Dodgers vs Padres',
    market: 'Total',
    pick: 'Over 7.5',
    bestOdds: '-108',
    bestBook: 'BetMGM',
    edge: '+2.9%',
    isLocked: true,
  },
  {
    id: 4,
    matchup: 'Celtics vs Heat',
    market: 'Spread',
    pick: 'Heat +6.5',
    bestOdds: '-110',
    bestBook: 'Caesars',
    edge: '+3.2%',
    isLocked: true,
  },
  {
    id: 5,
    matchup: 'Chiefs vs Chargers',
    market: 'Moneyline',
    pick: 'Chiefs ML',
    bestOdds: '-155',
    bestBook: 'PointsBet',
    edge: '+2.7%',
    isLocked: true,
  },
];

export function FreeOddsPreview({ onGetStartedClick }: FreeOddsPreviewProps) {
  return (
    <section className="relative py-12 md:py-16 bg-slate-950">

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Free Odds Preview
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Get a taste of our odds viewer. Upgrade for full access to all features.
          </p>
        </motion.div>

        {/* Preview Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl overflow-hidden">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="col-span-4 text-white/50 text-xs font-semibold uppercase tracking-wider">Matchup</div>
              <div className="col-span-2 text-white/50 text-xs font-semibold uppercase tracking-wider">Market</div>
              <div className="col-span-2 text-white/50 text-xs font-semibold uppercase tracking-wider">Best Odds</div>
              <div className="col-span-2 text-white/50 text-xs font-semibold uppercase tracking-wider">Book</div>
              <div className="col-span-2 text-white/50 text-xs font-semibold uppercase tracking-wider text-right">Edge</div>
            </div>

            {/* Table Rows */}
            {sampleBets.map((bet, index) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className={`px-4 md:px-6 py-3 md:py-4 border-b border-white/5 last:border-b-0 transition-all ${
                  bet.isLocked ? 'opacity-50' : 'hover:bg-white/5'
                }`}
              >
                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {bet.isLocked && (
                        <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className={`font-semibold text-sm truncate ${bet.isLocked ? 'text-white/30' : 'text-white'}`}>
                          {bet.isLocked ? '••••••••••••' : bet.matchup}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            bet.isLocked ? 'bg-white/5 text-white/30' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {bet.isLocked ? '•••' : bet.market}
                          </span>
                          <span className={`text-xs ${bet.isLocked ? 'text-white/20' : 'text-white/50'}`}>
                            {bet.isLocked ? '•••' : bet.pick}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`font-bold text-sm ${bet.isLocked ? 'text-white/30' : 'text-white'}`}>
                        {bet.isLocked ? '•••' : bet.bestOdds}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        bet.isLocked ? 'bg-white/5 text-white/30' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {bet.isLocked ? '•••' : bet.edge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-12 gap-4">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      {bet.isLocked && (
                        <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                      <div>
                        <div className={`font-semibold ${bet.isLocked ? 'text-white/30' : 'text-white'}`}>
                          {bet.isLocked ? '••••••••••••' : bet.matchup}
                        </div>
                        <div className={`text-sm ${bet.isLocked ? 'text-white/20' : 'text-white/50'}`}>
                          {bet.isLocked ? '••••••••' : bet.pick}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bet.isLocked ? 'bg-white/5 text-white/30' : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {bet.isLocked ? '•••••' : bet.market}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`font-bold ${bet.isLocked ? 'text-white/30' : 'text-white'}`}>
                      {bet.isLocked ? '•••' : bet.bestOdds}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={bet.isLocked ? 'text-white/30' : 'text-white/70'}>
                      {bet.isLocked ? '••••••••' : bet.bestBook}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      bet.isLocked ? 'bg-white/5 text-white/30' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {bet.isLocked ? '•••' : bet.edge}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Locked Overlay Message */}
            <div className="px-6 py-5 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-t border-purple-500/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Unlock Full Access</p>
                    <p className="text-white/50 text-sm">Get real-time odds, all markets, and +EV alerts</p>
                  </div>
                </div>
                <button
                  onClick={onGetStartedClick}
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
        >
          {[
            { icon: TrendingUp, text: '+EV Bets Highlighted' },
            { icon: Clock, text: 'Real-time Updates' },
            { icon: Building2, text: '45+ Sportsbooks' },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
            >
              <feature.icon className="w-4 h-4 text-purple-400" />
              <span className="text-white/70 text-sm font-medium">{feature.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
