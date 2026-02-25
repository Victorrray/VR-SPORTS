import { Building2, Gamepad2, TrendingUp, Repeat, Globe, ChevronDown, X, Zap } from 'lucide-react';
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
      gradient: 'from-cyan-500 to-blue-600',
      books: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN BET', 'Fanatics', 'Hard Rock', 'PointsBet', 'BetRivers', 'WynnBET', 'Unibet', 'Bally Bet', 'betPARX', 'theScore Bet'],
    },
    {
      icon: Gamepad2,
      title: 'DFS & Pick\'em',
      count: 5,
      gradient: 'from-emerald-500 to-teal-600',
      books: ['PrizePicks', 'Underdog', 'DK Pick6', 'Dabble', 'Betr'],
    },
    {
      icon: Building2,
      title: 'Sharp & Offshore',
      count: 8,
      gradient: 'from-purple-500 to-violet-600',
      books: ['Pinnacle', 'LowVig', 'Bovada', 'BetOnline', 'MyBookie', 'BetUS', 'BetAnything', 'Fliff'],
    },
    {
      icon: Repeat,
      title: 'Exchanges',
      count: 8,
      gradient: 'from-violet-500 to-purple-600',
      books: ['ProphetX', 'ReBet', 'BetOpenly', 'NoVig', 'Kalshi', 'Polymarket', 'Betfair Exchange', 'Smarkets'],
    },
    {
      icon: Globe,
      title: 'UK Bookmakers',
      count: 12,
      gradient: 'from-blue-500 to-indigo-600',
      books: ['Betfair', 'Bet Victor', 'Betway', 'Ladbrokes', 'Paddy Power', 'Sky Bet', 'William Hill', '888sport', 'Coral', 'Virgin Bet', 'Matchbook', 'BoyleSports'],
    },
  ];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 -left-40 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 max-w-4xl mx-auto"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-full mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-semibold">Complete Coverage</span>
          </motion.div>
          
          <h2 className="text-white text-3xl md:text-5xl lg:text-6xl mb-6 font-extrabold tracking-tight">
            Compare Odds Across{' '}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              45+ Bookmakers
            </span>
          </h2>
          
          <p className="text-white/60 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto">
            The most comprehensive sportsbook coverage in the industry
          </p>

          {/* Featured Books Pills - Animated */}
          <div className="flex flex-wrap justify-center gap-3">
            {featuredBooks.map((book, index) => (
              <motion.span
                key={book}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-5 py-2.5 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-full text-white text-sm font-semibold hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-default"
              >
                {book}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Category Cards - Bold Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 max-w-6xl mx-auto">
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
                whileHover={{ scale: 1.03, y: -5 }}
                className={`group relative bg-gradient-to-br ${category.gradient} rounded-2xl p-5 md:p-6 transition-all duration-300 cursor-pointer shadow-xl shadow-black/20 hover:shadow-2xl`}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity -z-10`} />
                
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-white/20 border border-white/30 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white text-sm md:text-base font-bold mb-1">
                    {category.title}
                  </h3>
                  <p className="text-white/80 text-xs md:text-sm font-semibold flex items-center gap-1">
                    {category.count} books
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
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
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-6xl mx-auto mt-6 overflow-hidden"
            >
              <div className={`bg-gradient-to-br ${categories[expandedCategory].gradient} rounded-3xl p-6 md:p-8 shadow-2xl`}>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-white font-bold text-xl">
                    {categories[expandedCategory].title}
                  </h4>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedCategory(null); }}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {categories[expandedCategory].books.map((book, index) => (
                    <motion.div
                      key={book}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-center text-white text-sm hover:bg-white/30 transition-all font-semibold hover:scale-105"
                    >
                      {book}
                    </motion.div>
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