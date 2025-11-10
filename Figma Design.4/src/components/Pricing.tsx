import { Check, HelpCircle, Star, Crown } from 'lucide-react';

interface PricingProps {
  onLoginClick: () => void;
}

export function Pricing({ onLoginClick }: PricingProps) {
  const goldFeatures = [
    { text: '39+ sportsbooks tracked', tooltip: 'Real-time odds from all major operators' },
    { text: 'Positive EV bet finder', tooltip: 'Algorithm identifies profitable opportunities' },
    { text: 'Player props analytics', tooltip: 'Deep stats on player performance' },
    { text: 'Game lines & spreads', tooltip: 'All major betting markets covered' },
    { text: 'Real-time odds updates', tooltip: 'Updates every second' },
  ];

  const platinumFeatures = [
    { text: 'Everything in Gold, plus:', tooltip: 'All Gold features included' },
    { text: 'Arbitrage opportunities', tooltip: 'Risk-free betting profits' },
    { text: 'Live betting markets', tooltip: 'In-game betting odds' },
    { text: 'Advanced analytics dashboard', tooltip: 'Comprehensive performance tracking' },
    { text: 'Priority support', tooltip: '24/7 dedicated support' },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-6 shadow-lg">
            <Crown className="w-4 h-4 text-white" />
            <span className="text-white font-bold">Simple Pricing</span>
          </div>
          
          <h2 className="text-white text-3xl md:text-5xl mb-4 font-bold">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Winning Plan
            </span>
          </h2>
          
          <p className="text-white/60 text-lg font-semibold">
            Both plans include access to 39+ sportsbooks
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Gold Plan */}
          <div className="relative overflow-hidden rounded-3xl md:rounded-[2rem] bg-gradient-to-br from-purple-500 to-purple-600 p-8 md:p-10 shadow-2xl">
            <div className="relative">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/30 rounded-full mb-6">
                <Star className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-bold uppercase tracking-wide">Best Value</span>
              </div>

              {/* Plan Name */}
              <h3 className="text-white text-4xl md:text-5xl mb-4 font-bold">Gold</h3>

              {/* Price */}
              <div className="mb-2">
                <span className="text-white text-5xl md:text-6xl font-bold">$10</span>
                <span className="text-white/80 text-xl font-semibold ml-2">/month</span>
              </div>
              <p className="text-white/70 mb-8 font-semibold">billed monthly</p>

              {/* Features */}
              <div className="space-y-4 mb-10">
                {goldFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center border border-white/40">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white font-semibold">
                        {feature.text}
                      </span>
                    </div>
                    <HelpCircle className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors cursor-help" />
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button className="w-full bg-white text-purple-600 py-4 rounded-2xl hover:bg-white/90 transition-all font-bold shadow-lg text-center text-sm" onClick={onLoginClick}>
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Platinum Plan */}
          <div className="relative overflow-hidden rounded-3xl md:rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-600 p-8 md:p-10 shadow-2xl">
            <div className="relative">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/30 rounded-full mb-6">
                <Crown className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-bold uppercase tracking-wide">Most Popular</span>
              </div>

              {/* Plan Name */}
              <h3 className="text-white text-4xl md:text-5xl mb-4 font-bold">Platinum</h3>

              {/* Price */}
              <div className="mb-2">
                <span className="text-white text-5xl md:text-6xl font-bold">$25</span>
                <span className="text-white/80 text-xl font-semibold ml-2">/month</span>
              </div>
              <p className="text-white/70 mb-8 font-semibold">billed monthly</p>

              {/* Features */}
              <div className="space-y-4 mb-10">
                {platinumFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center border border-white/40">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white font-semibold">
                        {feature.text}
                      </span>
                    </div>
                    <HelpCircle className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors cursor-help" />
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button className="w-full bg-white text-indigo-600 py-4 rounded-2xl hover:bg-white/90 transition-all font-bold shadow-lg text-center text-sm" onClick={onLoginClick}>
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}