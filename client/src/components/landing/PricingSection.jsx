import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PricingSection() {
  const navigate = useNavigate();

  const goldFeatures = [
    '25+ sportsbooks',
    '+EV bet finder',
    'Player props',
    'Game lines & spreads',
    'Real-time odds'
  ];

  const platinumFeatures = [
    '25+ sportsbooks',
    '+EV bet finder',
    'Player props & spreads',
    'Arbitrage opportunities',
    'Live betting markets',
    'Advanced analytics'
  ];

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-white text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-6 font-bold">
            Choose Your <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Winning Plan</span>
          </h2>
          <p className="text-white/50 text-sm md:text-base">
            Both plans include access to 25+ sportsbooks.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Gold Plan */}
          <div className="relative">
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-900 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm shadow-lg z-10 font-bold">
              BEST VALUE
            </div>

            {/* Card */}
            <div className="relative bg-gradient-to-b from-purple-900/40 to-purple-950/40 backdrop-blur-xl border border-yellow-500/30 rounded-3xl md:rounded-[2rem] p-8 md:p-10 pt-10 md:pt-12 hover:border-yellow-500/50 transition-all shadow-xl shadow-purple-900/20">
              {/* Header */}
              <div className="text-center mb-8 md:mb-10">
                <h3 className="text-white text-2xl md:text-3xl mb-2 md:mb-3 font-bold">Gold Plan</h3>
                <p className="text-white/50 text-sm md:text-base mb-6 md:mb-8 font-medium">Perfect for serious bettors</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-yellow-400 text-lg md:text-xl font-bold">$</span>
                  <span className="text-white text-6xl md:text-7xl font-bold">10</span>
                  <span className="text-white/50 text-base md:text-lg mb-2 md:mb-3 font-semibold">/month</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 md:space-y-5 mb-8 md:mb-10">
                {goldFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 md:gap-4">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
                      <Check className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <span className="text-white/80 text-sm md:text-base font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-900 py-4 md:py-5 rounded-3xl hover:from-yellow-400 hover:to-orange-400 transition-all shadow-[0_20px_50px_rgba(234,179,8,0.4)] hover:shadow-[0_25px_60px_rgba(234,179,8,0.5)] text-sm md:text-base font-bold">
                Start Gold Plan →
              </button>
            </div>
          </div>

          {/* Platinum Plan */}
          <div className="relative">
            {/* Most Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm shadow-lg shadow-purple-500/50 z-10 font-bold">
              MOST POPULAR
            </div>

            {/* Card */}
            <div className="relative bg-gradient-to-b from-purple-900/40 to-purple-950/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl md:rounded-[2rem] p-8 md:p-10 pt-10 md:pt-12 hover:border-purple-500/50 transition-all shadow-xl shadow-purple-900/20">
              {/* Header */}
              <div className="text-center mb-8 md:mb-10">
                <h3 className="text-white text-2xl md:text-3xl mb-2 md:mb-3 font-bold">Platinum Access</h3>
                <p className="text-white/50 text-sm md:text-base mb-6 md:mb-8 font-medium">Everything you need to win</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-purple-400 text-lg md:text-xl font-bold">$</span>
                  <span className="text-white text-6xl md:text-7xl font-bold">25</span>
                  <span className="text-white/50 text-base md:text-lg mb-2 md:mb-3 font-semibold">/month</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 md:space-y-5 mb-8 md:mb-10">
                {platinumFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 md:gap-4">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <span className="text-white/80 text-sm md:text-base font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 md:py-5 rounded-3xl hover:from-purple-400 hover:to-indigo-400 transition-all shadow-[0_20px_50px_rgba(168,85,247,0.4)] hover:shadow-[0_25px_60px_rgba(168,85,247,0.5)] text-sm md:text-base font-bold">
                Start Winning Today →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
