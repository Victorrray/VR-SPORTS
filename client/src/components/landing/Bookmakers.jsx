import { Gamepad2 } from 'lucide-react';

export function Bookmakers() {
  const topTier = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];
  const dfsApps = ['PrizePicks', 'Underdog', 'DK Pick6', 'Dabble'];
  const majorOperators = ['ESPN BET', 'Fanatics', 'Hard Rock', 'PointsBet', 'BetRivers', 'WynnBET', 'Unibet'];
  const sharpBooks = ['Pinnacle', 'NoVig'];
  const exchanges = ['ProphetX', 'ReBet', 'BetOpenly'];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-white mb-4 md:mb-6 text-3xl md:text-4xl lg:text-5xl font-bold">
            Compare Odds Across
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent text-5xl md:text-6xl lg:text-7xl font-bold">
              39+
            </span>
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent text-3xl md:text-4xl lg:text-5xl font-bold">
              Bookmakers
            </span>
          </div>
          <p className="text-white/50 text-sm md:text-base max-w-2xl mx-auto px-4 font-medium">
            Access the most comprehensive sportsbook coverage in the industry
          </p>
        </div>

        {/* Top Tier */}
        <div className="mb-8 md:mb-12">
          <h3 className="text-white mb-4 text-sm md:text-base font-semibold">
            Top Tier <span className="text-white/40 text-xs md:text-sm">(4 books)</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {topTier.map((book) => (
              <div
                key={book}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-center text-white text-sm md:text-base hover:bg-white/10 transition-all font-semibold"
              >
                {book}
              </div>
            ))}
          </div>
        </div>

        {/* DFS Apps */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            <h3 className="text-white text-sm md:text-base font-semibold">
              DFS Apps <span className="text-white/40 text-xs md:text-sm">(4 books)</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {dfsApps.map((book) => (
              <div
                key={book}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-center text-white text-sm md:text-base hover:bg-white/10 transition-all font-semibold"
              >
                {book}
              </div>
            ))}
          </div>
        </div>

        {/* Major Operators */}
        <div className="mb-8 md:mb-12">
          <h3 className="text-white mb-4 text-sm md:text-base font-semibold">
            Major Operators <span className="text-white/40 text-xs md:text-sm">(7 books)</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
            {majorOperators.map((book) => (
              <div
                key={book}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-center text-white text-xs md:text-sm hover:bg-white/10 transition-all font-semibold"
              >
                {book}
              </div>
            ))}
          </div>
        </div>

        {/* Sharp Books */}
        <div className="mb-8 md:mb-12">
          <h3 className="text-white mb-4 text-sm md:text-base font-semibold">
            Sharp Books <span className="text-white/40 text-xs md:text-sm">(2 books)</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 max-w-2xl">
            {sharpBooks.map((book) => (
              <div
                key={book}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-center text-white text-sm md:text-base hover:bg-white/10 transition-all font-semibold"
              >
                {book}
              </div>
            ))}
          </div>
        </div>

        {/* Exchanges */}
        <div>
          <h3 className="text-white mb-4 text-sm md:text-base font-semibold">
            Exchanges <span className="text-white/40 text-xs md:text-sm">(3 books)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {exchanges.map((book) => (
              <div
                key={book}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-center text-white text-sm md:text-base hover:bg-white/10 transition-all font-semibold"
              >
                {book}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
