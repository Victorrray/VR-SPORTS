import { TrendingUp, Users, Award, Zap } from 'lucide-react';

export function Stats() {
  const stats = [
    { label: 'Active Users', value: '100', icon: Users },
    { label: 'Average Edge', value: '+4.8%', icon: TrendingUp },
    { label: 'Daily Picks', value: '500+', icon: Zap },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto place-items-center">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-6 md:p-8 text-center w-full"
            >
              <stat.icon className="w-8 h-8 md:w-10 md:h-10 text-purple-400 mx-auto mb-3 md:mb-4" />
              <div className="text-white mb-1 md:mb-2 font-bold" style={{fontSize: 'clamp(1.5rem, 4vw, 2.5rem)'}}>
                {stat.value}
              </div>
              <div className="text-white/60 text-xs md:text-sm font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}