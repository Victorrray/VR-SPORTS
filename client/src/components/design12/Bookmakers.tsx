import { Building2, Gamepad2, TrendingUp, Repeat, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export function Bookmakers() {
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
      count: 10,
      gradient: 'from-blue-500 to-indigo-500',
      books: ['Betfair', 'Bet Victor', 'Betway', 'Ladbrokes', 'Paddy Power', 'Sky Bet', 'William Hill', '888sport', 'Coral', 'Virgin Bet'],
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
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
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
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`group relative bg-gradient-to-br ${category.gradient} rounded-2xl p-4 md:p-5 transition-all duration-300 hover:scale-105 cursor-default`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-2.5 rounded-xl bg-white/20 border border-white/30 mb-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white text-sm md:text-base font-bold mb-1">
                    {category.title}
                  </h3>
                  <p className="text-white/80 text-xs md:text-sm font-semibold">
                    {category.count} books
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* "And many more" text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-white/40 text-sm mt-6 font-medium"
        >
          Plus Matchbook, BoyleSports, Smarkets, and many more...
        </motion.p>
      </div>
    </section>
  );
}