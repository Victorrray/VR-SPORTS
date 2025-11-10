import { Eye, TrendingUp, Target, Zap, Shield, BarChart3 } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Eye,
      title: 'Real-Time Odds Scanner',
      description: 'Automatically scan and compare odds across 15+ major sportsbooks every second to find the best lines.',
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
    },
    {
      icon: TrendingUp,
      title: 'Positive EV Finder',
      description: 'Our algorithm identifies bets with positive expected value, giving you a mathematical edge over the bookies.',
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
    },
    {
      icon: Target,
      title: 'Player Props Analytics',
      description: 'Deep dive into player statistics, trends, and matchup analysis for informed prop betting decisions.',
      gradient: 'from-cyan-500 to-cyan-600',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
    },
    {
      icon: Zap,
      title: 'Instant Alerts',
      description: 'Get notified immediately when profitable opportunities arise. Never miss a valuable bet again.',
      gradient: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      borderColor: 'border-violet-500/30',
    },
    {
      icon: Shield,
      title: 'Bankroll Management',
      description: 'Smart staking suggestions and bankroll tracking to help you bet responsibly and maximize growth.',
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track your betting history, analyze your performance, and identify your strongest betting markets.',
      gradient: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
    },
  ];

  return (
    <section id="features" className="container mx-auto px-4 py-20">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <div className="inline-block px-4 py-2 bg-purple-500/10 backdrop-blur-sm border border-purple-500/30 rounded-full mb-6">
          <span className="text-purple-400 font-semibold">Features</span>
        </div>
        <h2 className="text-white mb-4 font-bold text-3xl md:text-4xl lg:text-5xl">
          Everything You Need to{' '}
          <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Dominate Sports Betting
          </span>
        </h2>
        <p className="text-white/60 text-lg font-medium">
          Professional-grade tools designed for serious sports bettors who want to gain an edge
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className={`group relative bg-white/5 backdrop-blur-sm border ${feature.borderColor} rounded-2xl p-8 hover:bg-white/10 transition-all hover:scale-105`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <div className="relative">
                <div className={`w-14 h-14 ${feature.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-white mb-3 font-bold">{feature.title}</h3>
                <p className="text-white/60 font-medium">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
