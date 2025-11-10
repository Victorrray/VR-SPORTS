import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { BetCard } from './BetCard';

export function Hero() {
  // TODO: Replace this mock data with a cached bet from the API
  const featuredBet = {
    id: 1,
    teams: "Detroit Pistons @ Philadelphia 76ers",
    time: "Sun, Nov 10 4:41 PM PST",
    pick: "Detroit Pistons -3.5",
    odds: "-118",
    sportsbook: "DraftKings",
    ev: "+8.2%",
    sport: "NBA",
    status: "active",
    confidence: "High",
  };

  return (
    <section className="relative container mx-auto px-4 pt-20 md:pt-32 pb-20 md:pb-32 overflow-hidden">
      <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-7xl mx-auto">
        {/* Left Content */}
        <div>
          {/* Large Headline */}
          <h1 className="text-white mb-4 md:mb-6 leading-[1.1] font-bold" style={{fontSize: 'clamp(2.5rem, 8vw, 5rem)'}}>
            Bet smarter,<br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Win more.
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-white/60 text-base md:text-lg mb-6 md:mb-8 max-w-lg leading-relaxed font-medium">
            Find positive expected value opportunities across 39+ sportsbooks.
            Make data-driven decisions with real-time odds comparison.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 md:gap-6">
            <button className="w-full sm:w-auto px-8 py-3 md:py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 hover:shadow-2xl hover:shadow-purple-500/50 transition-all text-center font-semibold">
              Get started
            </button>
            
            <a href="#features" className="text-white/70 hover:text-white text-sm flex items-center gap-2 transition-colors group font-semibold">
              See how it works
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Announcement Banner */}
          <div className="mt-8 md:mt-12 inline-flex items-center gap-2 text-xs md:text-sm text-white/50 font-medium">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>Now tracking live odds from 39+ major sportsbooks</span>
            <ArrowRight className="w-3 h-3 flex-shrink-0" />
          </div>
        </div>

        {/* Right Visual Element */}
        <div className="relative hidden md:block">
          {/* Bet Card Preview */}
          <div className="relative h-[500px] flex items-center justify-center">
            <div className="w-full max-w-[500px]">
              <BetCard bet={featuredBet} variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}