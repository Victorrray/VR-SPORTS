import { TrendingUp, Building2, Zap, BarChart3, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, hasStarted]);

  return { count, ref, setHasStarted };
}

export function Stats() {
  const stats = [
    { label: 'Sportsbooks', value: 45, suffix: '+', icon: Building2, color: 'from-purple-500 to-violet-600' },
    { label: 'Avg Edge Found', value: 4.8, suffix: '%', prefix: '+', icon: TrendingUp, color: 'from-green-500 to-emerald-600', decimal: true },
    { label: 'Real-time Updates', value: 24, suffix: '/7', icon: Clock, color: 'from-blue-500 to-cyan-600' },
    { label: 'Markets Covered', value: 100, suffix: '+', icon: BarChart3, color: 'from-orange-500 to-amber-600' },
  ];

  return (
    <section className="relative py-16 md:py-20 bg-slate-950 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative text-center p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-300">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Value */}
                  <motion.div 
                    className="text-3xl md:text-4xl font-bold text-white mb-2"
                    initial={{ scale: 0.5 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, delay: index * 0.1 + 0.2 }}
                  >
                    {stat.prefix || ''}{stat.decimal ? stat.value.toFixed(1) : stat.value}{stat.suffix || ''}
                  </motion.div>
                  
                  {/* Label */}
                  <div className="text-white/50 text-sm font-medium">
                    {stat.label}
                  </div>

                  {/* Hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <motion.p 
          className="text-center text-white/40 text-sm mt-10 font-medium"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          Trusted by bettors who want an edge
        </motion.p>
      </div>
    </section>
  );
}