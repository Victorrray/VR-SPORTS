import { Building2, Gamepad2, TrendingUp, Repeat } from 'lucide-react';

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
      gradient: 'from-purple-500 to-indigo-500',
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
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-6">
            <Building2 className="w-4 h-4 text-white" />
            <span className="text-white font-bold">Complete Coverage</span>
          </div>
          
          <h2 className="text-white text-3xl md:text-5xl mb-6 font-bold">
            Compare Odds Across{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              40+ Bookmakers
            </span>
          </h2>
          
          <p className="text-white/60 text-lg font-semibold">
            The most comprehensive sportsbook coverage in the industry
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-7xl mx-auto">
          {categories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div
                key={idx}
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}