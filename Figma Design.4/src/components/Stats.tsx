import { Activity, Users, Zap, TrendingUp } from 'lucide-react';

export function Stats() {
  const stats = [
    { 
      icon: Activity,
      value: '39+', 
      label: 'Sportsbooks',
      description: 'Real-time monitoring',
      gradient: 'from-purple-500 to-purple-600'
    },
    { 
      icon: TrendingUp,
      value: '4.2%', 
      label: 'Average Edge',
      description: 'Positive EV found',
      gradient: 'from-purple-600 to-indigo-600'
    },
    { 
      icon: Users,
      value: '10K+', 
      label: 'Active Users',
      description: 'Growing daily',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    { 
      icon: Zap,
      value: '24/7', 
      label: 'Live Updates',
      description: 'Never miss a bet',
      gradient: 'from-indigo-600 to-purple-600'
    },
  ];

  return (
    <section className="container mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`group relative bg-gradient-to-br ${stat.gradient} rounded-2xl md:rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300`}
            >
              <div className="relative">
                {/* Icon */}
                <div className="inline-flex p-3 rounded-xl bg-white/20 border border-white/30 mb-4">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                
                {/* Value */}
                <div className="text-white mb-2 font-bold">
                  <span className="text-3xl md:text-5xl">{stat.value}</span>
                </div>
                
                {/* Label */}
                <div className="text-white mb-1 font-bold">{stat.label}</div>
                
                {/* Description */}
                <div className="text-white/80 text-sm font-medium">{stat.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}