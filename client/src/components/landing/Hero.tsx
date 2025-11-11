import { ArrowRight, Play, Sparkles, Clock, Check } from 'lucide-react';

export function Hero() {
  // Mock bet data for display
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
        className="absolute inset-0 z-0 left-1/2 -translate-x-1/2 w-screen"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168, 85, 247, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
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
            {/* Bet Card Preview - Static mock to avoid ThemeProvider issues */}
            <div className="relative h-[500px] flex items-center justify-center">
              <div className="w-full max-w-[500px] bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border border-white/10 backdrop-blur-2xl rounded-xl overflow-hidden hover:border-purple-400/40 transition-all">
                {/* Card Header */}
                <div className="p-3 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/60 uppercase">{featuredBet.sport}</span>
                    </div>
                    <span className="text-xs font-medium text-green-400">+{featuredBet.ev}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4">
                  {/* Teams */}
                  <div>
                    <p className="text-sm text-white/60 mb-1">{featuredBet.teams}</p>
                    <p className="text-xs text-white/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {featuredBet.time}
                    </p>
                  </div>

                  {/* Pick */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-white/60 mb-1">Pick</p>
                    <p className="text-lg font-semibold text-white">{featuredBet.pick}</p>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-white/60">{featuredBet.sportsbook}</p>
                      <p className="text-lg font-bold text-white">{featuredBet.odds}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">Confidence</p>
                      <p className="text-lg font-semibold text-yellow-400 flex items-center gap-1 justify-end">
                        <Check className="w-4 h-4" />
                        {featuredBet.confidence}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}