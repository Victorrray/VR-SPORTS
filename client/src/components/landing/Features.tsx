import { Eye, TrendingUp, Target, Zap, Shield, BarChart3 } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Eye,
      title: 'Real-Time Odds Scanner',
      description: 'Instantly compare odds across 39+ sportsbooks. Our system scans every line, every second.',
      stats: '1M+ scans/day',
      gradient: 'from-purple-500 to-purple-600',
      delay: 'delay-0',
    },
    {
      icon: TrendingUp,
      title: 'Positive EV Finder',
      description: 'Mathematical edge detection. Let our algorithm find the profitable bets for you.',
      stats: '4.2% avg edge',
      gradient: 'from-emerald-500 to-emerald-600',
      delay: 'delay-75',
    },
    {
      icon: Target,
      title: 'Player Props Analytics',
      description: 'Deep statistical analysis on player performance, trends, and matchup data.',
      stats: '10K+ props daily',
      gradient: 'from-cyan-500 to-cyan-600',
      delay: 'delay-150',
    },
    {
      icon: Zap,
      title: 'Instant Alerts',
      description: 'Get notified the moment a profitable opportunity appears. Lightning-fast notifications.',
      stats: '<0.5s alert time',
      gradient: 'from-violet-500 to-violet-600',
      delay: 'delay-0',
    },
    {
      icon: Shield,
      title: 'Bankroll Management',
      description: 'Smart staking recommendations based on Kelly Criterion and your risk tolerance.',
      stats: 'Optimized sizing',
      gradient: 'from-blue-500 to-blue-600',
      delay: 'delay-75',
    },
    {
      icon: BarChart3,
      title: 'Performance Tracking',
      description: 'Comprehensive analytics dashboard. Track every bet, analyze patterns, improve results.',
      stats: 'Full history',
      gradient: 'from-indigo-500 to-indigo-600',
      delay: 'delay-150',
    },
  ];

  return (
    <section id="features" className="container mx-auto px-4 py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 backdrop-blur-sm border border-purple-500/30 rounded-full mb-6">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <span className="text-purple-400 font-bold">Powerful Features</span>
        </div>
        <h2 className="text-white text-3xl md:text-5xl mb-4 font-bold">
          Everything You Need to{' '}
          <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Beat the Books
          </span>
        </h2>
        <p className="text-white/60 text-lg font-semibold">
          Professional tools built for serious sports bettors
        </p>
      </div>

      {/* Features Grid - Bento Box Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-white/20 hover:from-white/10 hover:to-white/5 transition-all duration-500 ${feature.delay}`}
            >
              {/* Gradient glow on hover */}
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${feature.gradient} rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}></div>
              
              <div className="relative">
                {/* Icon with animated background */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-white text-xl md:text-2xl mb-3 font-bold">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-white/60 mb-4 font-semibold leading-relaxed">
                  {feature.description}
                </p>

                {/* Stats badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${feature.gradient} bg-opacity-10 rounded-full border border-white/10`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  <span className="text-white/80 text-xs md:text-sm font-bold">
                    {feature.stats}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
