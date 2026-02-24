import { Building2, Gamepad2, TrendingUp, Repeat, Globe, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function Bookmakers() {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  // Featured books shown as pills (top 8 most popular)
  const featuredBooks = [
    'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN BET', 'PrizePicks', 'Pinnacle', 'Bovada'
  ];

  const categories = [
    {
      icon: TrendingUp,
      title: 'US Sportsbooks',
      count: 14,
      gradient: 'from-cyan-500 to-blue-500',
      books: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN BET', 'Fanatics', 'Hard Rock', 'PointsBet', 'BetRivers', 'WynnBET', 'Unibet', 'Bally Bet', 'betPARX', 'theScore Bet'],
    },
    {
      icon: Gamepad2,
      title: 'DFS & Pick\'em',
      count: 5,
      gradient: 'from-emerald-500 to-teal-500',
      books: ['PrizePicks', 'Underdog', 'DK Pick6', 'Dabble', 'Betr'],
    },
    {
      icon: Building2,
      title: 'Sharp & Offshore',
      count: 8,
      gradient: 'from-purple-500 to-violet-500',
      books: ['Pinnacle', 'LowVig', 'Bovada', 'BetOnline', 'MyBookie', 'BetUS', 'BetAnything', 'Fliff'],
    },
    {
      icon: Repeat,
      title: 'Exchanges',
      count: 8,
      gradient: 'from-violet-500 to-purple-500',
      books: ['ProphetX', 'ReBet', 'BetOpenly', 'NoVig', 'Kalshi', 'Polymarket', 'Betfair Exchange', 'Smarkets'],
    },
    {
      icon: Globe,
      title: 'UK Bookmakers',
      count: 12,
      gradient: 'from-blue-500 to-indigo-500',
      books: ['Betfair', 'Bet Victor', 'Betway', 'Ladbrokes', 'Paddy Power', 'Sky Bet', 'William Hill', '888sport', 'Coral', 'Virgin Bet', 'Matchbook', 'BoyleSports'],
    },
  ];

  return (
    <section className="py-16 md:py-24 -mt-20 md:-mt-32 relative">
      <div className="container mx-auto px-4 md:px-6 relative z-0">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-full mb-6">
            <Building2 className="w-4 h-4 text-white" />
            <span className="text-white font-bold">Complete Coverage</span>
          </div>
          
          <h2 className="text-white text-3xl md:text-5xl mb-4 font-bold">
            Compare Odds Across{' '}
            <span className="text-purple-400">
              45+ Bookmakers
            </span>
          </h2>
          
          <p className="text-white/60 text-lg font-semibold mb-8">
            The most comprehensive sportsbook coverage in the industry
          </p>

          {/* Featured Books Pills */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {featuredBooks.map((book) => (
              <motion.span
                key={book}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-sm font-semibold hover:bg-white/20 transition-all cursor-default"
              >
                {book}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Category Cards - Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
          {categories.map((category, idx) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                onClick={() => setExpandedCategory(isExpanded ? null : idx)}
                className={`group relative bg-gradient-to-br ${category.gradient} rounded-2xl p-4 md:p-5 transition-all duration-300 hover:scale-105 cursor-pointer`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-2.5 rounded-xl bg-white/20 border border-white/30 mb-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white text-sm md:text-base font-bold mb-1">
                    {category.title}
                  </h3>
                  <p className="text-white/80 text-xs md:text-sm font-semibold flex items-center gap-1">
                    {category.count} books
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Expanded Books Panel */}
        <AnimatePresence>
          {expandedCategory !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl mx-auto mt-4 overflow-hidden"
            >
              <div className={`bg-gradient-to-br ${categories[expandedCategory].gradient} rounded-2xl p-5 md:p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold text-lg">
                    {categories[expandedCategory].title}
                  </h4>
                  <button
                    onClick={() => setExpandedCategory(null)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {categories[expandedCategory].books.map((book) => (
                    <div
                      key={book}
                      className="bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-center text-white text-sm hover:bg-white/30 transition-all font-semibold"
                    >
                      {book}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}