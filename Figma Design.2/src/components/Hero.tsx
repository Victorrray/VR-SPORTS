import { ArrowRight, Play, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative container mx-auto px-4 pt-20 md:pt-32 pb-20 md:pb-32 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-[10%] top-[20%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute right-[5%] top-[40%] w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute right-[15%] top-[10%] w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

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
            <button className="w-full sm:w-auto px-8 py-3 md:py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all text-center font-semibold">
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
          {/* 3D-style floating cards */}
          <div className="relative h-[500px]">
            {/* Card 1 */}
            <div className="absolute top-0 right-20 w-80 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
              <div className="text-purple-400 text-xs mb-4 font-bold">POSITIVE EV BET</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm font-semibold">Lakers vs Warriors</span>
                  <span className="text-emerald-400 text-sm font-bold">+4.2% EV</span>
                </div>
                <div className="h-12 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg flex items-center justify-between px-4">
                  <span className="text-white text-sm font-semibold">Lakers -5.5</span>
                  <span className="text-white font-bold">-110</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-white/5 rounded flex items-center justify-center text-xs text-white/40 font-semibold">DraftKings</div>
                  <div className="flex-1 h-8 bg-white/5 rounded flex items-center justify-center text-xs text-white/40 font-semibold">FanDuel</div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="absolute top-32 right-0 w-72 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform">
              <div className="text-cyan-400 text-xs mb-4 font-bold">WIN RATE</div>
              <div className="text-white text-4xl mb-2 font-bold">64.2%</div>
              <div className="flex gap-1 items-end h-24">
                <div className="flex-1 bg-gradient-to-t from-purple-500/40 to-purple-500/20 rounded-t" style={{height: '60%'}}></div>
                <div className="flex-1 bg-gradient-to-t from-purple-500/40 to-purple-500/20 rounded-t" style={{height: '45%'}}></div>
                <div className="flex-1 bg-gradient-to-t from-purple-500/40 to-purple-500/20 rounded-t" style={{height: '70%'}}></div>
                <div className="flex-1 bg-gradient-to-t from-indigo-500/60 to-indigo-500/40 rounded-t" style={{height: '85%'}}></div>
                <div className="flex-1 bg-gradient-to-t from-indigo-500/60 to-indigo-500/40 rounded-t" style={{height: '90%'}}></div>
                <div className="flex-1 bg-gradient-to-t from-indigo-500/60 to-indigo-500/40 rounded-t" style={{height: '100%'}}></div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="absolute bottom-0 right-32 w-64 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform">
              <div className="text-indigo-400 text-xs mb-3 font-bold">MONTHLY ROI</div>
              <div className="text-white text-3xl mb-1 font-bold">+18.5%</div>
              <div className="text-emerald-400 text-sm font-semibold">↑ Above market average</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}