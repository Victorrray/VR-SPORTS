import { Users, Target, TrendingUp } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: Users,
      title: 'Choose Your Plan',
      description: 'Select Gold ($10/mo) or Platinum ($25/mo). Both include access to 25+ sportsbooks.'
    },
    {
      number: 2,
      icon: Target,
      title: 'Select Your Sportsbooks',
      description: 'Choose which sportsbooks you use. We compare odds across all of them.'
    },
    {
      number: 3,
      icon: TrendingUp,
      title: 'Find +EV Bets',
      description: 'Our algorithm identifies profitable bets with positive expected value.'
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-white text-3xl md:text-4xl lg:text-5xl mb-3 md:mb-4 font-bold">
            How It <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-white/50 text-sm md:text-base font-medium">
            Start finding +EV bets in 3 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:bg-white/10 transition-all"
            >
              {/* Step Number Badge */}
              <div className="absolute -top-3 -right-3 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/50 text-sm md:text-base font-bold">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto">
                <step.icon className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
              </div>

              {/* Content */}
              <h3 className="text-white text-center mb-2 md:mb-3 text-base md:text-lg font-bold">
                {step.title}
              </h3>
              <p className="text-white/50 text-center text-xs md:text-sm leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}