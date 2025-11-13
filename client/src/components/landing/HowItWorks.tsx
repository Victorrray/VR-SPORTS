import { UserPlus, Settings, Sparkles } from 'lucide-react';

interface HowItWorksProps {
  onGetStarted?: () => void;
}

export function HowItWorks({ onGetStarted }: HowItWorksProps = {}) {
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
      description: 'Pick the sportsbooks you use from our list of 40+ operators. We\'ll customize the odds comparison for you.',
      gradient: 'from-purple-600 to-indigo-600',
      iconGradient: 'from-indigo-400 to-indigo-600',
    },
    {
      number: 3,
      icon: Sparkles,
      title: 'Start Finding +EV Bets',
      description: 'Our algorithm instantly identifies profitable opportunities with positive expected value. Get alerts in real-time.',
      gradient: 'from-indigo-500 to-indigo-600',
      iconGradient: 'from-violet-400 to-violet-600',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white font-bold">Simple Process</span>
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
                    <div className={`bg-gradient-to-br ${step.gradient} rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-300`}>
                      {/* Step Number Badge */}
                      <div className="absolute -top-4 -right-4 w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center border-4 border-gray-900">
                        <span className="text-purple-600 text-lg md:text-xl font-bold">{step.number}</span>
                      </div>

                      {/* Icon */}
                      <div className="inline-flex p-4 rounded-2xl bg-white/20 border border-white/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-white text-xl md:text-2xl mb-3 font-bold">
                        {step.title}
                      </h3>
                      
                      <p className="text-white/80 font-semibold leading-relaxed">
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
            <button 
              onClick={onGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:from-purple-600 hover:to-indigo-600 transition-all font-bold inline-flex items-center gap-2"
            >
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