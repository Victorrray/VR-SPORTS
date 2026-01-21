import { Zap, Target, TrendingUp, Shield, BarChart3, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export function Features() {
  const features = [
    {
      icon: Target,
      title: 'EV Calculator',
      description: 'Advanced expected value analysis to identify profitable betting opportunities.',
    },
    {
      icon: Shield,
      title: 'Bankroll Management',
      description: 'Kelly Criterion calculator and variance tracking for optimal bet sizing.',
    },
    {
      icon: BarChart3,
      title: 'Performance Tracking',
      description: 'Detailed analytics on your betting history, ROI, and closing line value.',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-white mb-4 font-bold" style={{fontSize: 'clamp(2rem, 6vw, 3.5rem)'}}>
            Everything you need to{' '}
            <span className="bg-purple-400 bg-clip-text text-transparent">
              win
            </span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto font-medium">
            Professional-grade tools for serious sports bettors
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-purple-500/20 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-6 md:p-8 transition-all"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-500 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <h3 className="text-white mb-2 md:mb-3 font-bold text-lg md:text-xl">
                {feature.title}
              </h3>
              <p className="text-white/60 text-sm md:text-base font-medium leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}