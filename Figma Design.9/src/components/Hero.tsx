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
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Grid Background - Full Width */}
      <div 
        className="absolute inset-0 z-0 left-1/2 -translate-x-1/2 w-screen overflow-visible"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168, 85, 247, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: 'center center',
          minWidth: '100vw',
          minHeight: '100%',
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 xl:gap-20 items-center max-w-[90rem] mx-auto w-full py-16 md:py-24 lg:py-32 px-4 md:px-8">
          {/* Left Content */}
          <div>
            {/* Large Headline */}
            <h1 className="text-white mb-6 md:mb-8 leading-[1.1] font-bold" style={{fontSize: 'clamp(2.5rem, 8vw, 5rem)'}}>
              Bet smarter,<br />
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Win more.
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-white/60 text-base md:text-lg mb-8 md:mb-10 max-w-lg leading-relaxed font-medium">
              Find positive expected value opportunities across 40+ sportsbooks.
              Make data-driven decisions with real-time odds comparison.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 md:gap-6">
              <button className="w-full sm:w-auto px-8 py-3 md:py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all text-center font-semibold">
                Get started
              </button>
              
              <a href="#features" className="text-white/70 hover:text-white text-sm flex items-center gap-2 transition-colors group font-semibold">
                See how it works
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Announcement Banner */}
            <div className="mt-10 md:mt-14 inline-flex items-center gap-2 text-xs md:text-sm text-white/50 font-medium">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>Now tracking live odds from 40+ major sportsbooks</span>
              <ArrowRight className="w-3 h-3 flex-shrink-0" />
            </div>
          </div>

          {/* Right Visual Element */}
          <div className="relative hidden md:block">
            {/* Bet Card Preview */}
            <div className="relative h-[500px] flex items-center justify-center">
              <div className="w-full max-w-[500px]">
                <BetCard bet={featuredBet} variant="hero" showActions={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}