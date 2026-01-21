import { Building2, Gamepad2, TrendingUp, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';

export function Bookmakers() {
  const categories = [
    {
      icon: TrendingUp,
      title: 'Popular Books',
      count: 8,
      books: ['Pinnacle', 'ESPN BET', 'Fanatics', 'Hard Rock', 'PointsBet', 'BetRivers', 'WynnBET', 'Unibet'],
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Building2,
      title: 'Top Tier Sportsbooks',
      count: 9,
      books: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetOnline', 'Bovada', 'MyBookie', 'Fliff',],
      gradient: 'bg-purple-500',
    },
    {
      icon: Gamepad2,
      title: 'DFS & Pick\'em Apps',
      count: 4,
      books: ['PrizePicks', 'Underdog', 'DK Pick6', 'Dabble'],
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Repeat,
      title: 'Betting Exchanges',
      count: 4,
      books: ['ProphetX', 'ReBet', 'BetOpenly','NoVig'],
      gradient: 'from-violet-500 to-purple-500',
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
          className="text-center mb-12 md:mb-16 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-full mb-6">
            <Building2 className="w-4 h-4 text-white" />
            <span className="text-white font-bold">Complete Coverage</span>
          </div>
          
          <h2 className="text-white text-3xl md:text-5xl mb-6 font-bold">
            Compare Odds Across{' '}
            <span className="bg-purple-400 bg-clip-text text-transparent">
              40+ Bookmakers
            </span>
          </h2>
          
          <p className="text-white/60 text-lg font-semibold">
            The most comprehensive sportsbook coverage in the industry
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-7xl mx-auto">
          {categories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`group relative bg-gradient-to-br ${category.gradient} rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-300`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-white/20 border border-white/30">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white text-lg md:text-xl font-bold">
                        {category.title}
                      </h3>
                      <p className="text-white/80 text-sm font-semibold">
                        {category.count} bookmakers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {category.books.map((book) => (
                    <div
                      key={book}
                      className="bg-white/20 border border-white/30 rounded-xl px-3 py-2.5 md:py-3 text-center text-white text-sm md:text-base hover:bg-white/30 transition-all font-bold"
                    >
                      {book}
                    </div>
                  ))}
                </div>

                {/* Plus More indicator if needed */}
                {category.books.length > 8 && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs md:text-sm font-bold text-white">
                      + more bookmakers
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}