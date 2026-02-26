import { TrendingUp, Building2, Clock, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export function Stats() {
  const stats = [
    { label: 'Sportsbooks', value: '45+', icon: Building2 },
    { label: 'Avg Edge', value: '+4.8%', icon: TrendingUp },
    { label: 'Updates', value: '24/7', icon: Clock },
    { label: 'Markets', value: '100+', icon: BarChart3 },
  ];

  return (
    <section className="relative py-12 md:py-16 bg-slate-950">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <Icon className="w-5 h-5 text-purple-400 mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-white/40 text-sm">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}