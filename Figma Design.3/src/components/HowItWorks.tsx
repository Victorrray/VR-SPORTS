import { UserPlus, Settings, Sparkles } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Choose Your Plan',
      description: 'Start with Gold at $10/mo or upgrade to Platinum for $25/mo. Both plans include full access to our platform.',
      gradient: 'from-purple-500 to-purple-600',
      iconGradient: 'from-purple-400 to-purple-600',
    },
    {
      number: 2,
      icon: Settings,
      title: 'Select Your Sportsbooks',
      description: 'Pick the sportsbooks you use from our list of 39+ operators. We\'ll customize the odds comparison for you.',
      gradient: 'from-indigo-500 to-indigo-600',
      iconGradient: 'from-indigo-400 to-indigo-600',
    },
    {
      number: 3,
      icon: Sparkles,
      title: 'Start Finding +EV Bets',
      description: 'Our algorithm instantly identifies profitable opportunities with positive expected value. Get alerts in real-time.',
      gradient: 'from-violet-500 to-violet-600',
      iconGradient: 'from-violet-400 to-violet-600',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 font-bold">Simple Process</span>
          </div>
          
          <h2 className="text-white text-3xl md:text-5xl mb-4 font-bold">
            Start Winning in{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              3 Easy Steps
            </span>
          </h2>
          
          <p className="text-white/60 text-lg font-semibold">
            Get up and running in less than 2 minutes
          </p>
        </div>

        {/* Steps - Modern Timeline Design */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  {/* Connecting Line (Desktop only) */}
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-20 left-[60%] w-full h-0.5 bg-gradient-to-r from-white/20 to-white/5"></div>
                  )}
                  
                  <div className="relative group">
                    {/* Card */}
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-white/20 hover:from-white/10 hover:to-white/5 transition-all duration-300">
                      {/* Step Number Badge */}
                      <div className={`absolute -top-4 -right-4 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 border-4 border-slate-950`}>
                        <span className="text-white text-lg md:text-xl font-bold">{step.number}</span>
                      </div>

                      {/* Icon */}
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${step.iconGradient} bg-opacity-10 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-white text-xl md:text-2xl mb-3 font-bold">
                        {step.title}
                      </h3>
                      
                      <p className="text-white/60 font-semibold leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 md:mt-16 text-center">
            <button className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:from-purple-400 hover:to-indigo-400 transition-all shadow-[0_20px_50px_rgba(168,85,247,0.3)] hover:shadow-[0_25px_60px_rgba(168,85,247,0.4)] font-bold inline-flex items-center gap-2">
              <span>Get Started Now</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
