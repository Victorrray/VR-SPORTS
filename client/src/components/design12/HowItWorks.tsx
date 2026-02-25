import { UserPlus, Settings, Sparkles, ChevronRight, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Sign Up Free',
      description: 'Create your account in seconds. No credit card required to get started.',
      gradient: 'from-purple-500 to-violet-600',
    },
    {
      number: 2,
      icon: Settings,
      title: 'Choose Your Plan',
      description: 'Select Gold at $10/mo or Platinum at $25/mo. Both plans include access to 45+ sportsbooks.',
      gradient: 'from-violet-500 to-indigo-600',
    },
    {
      number: 3,
      icon: Sparkles,
      title: 'Start Finding +EV Bets',
      description: 'Our algorithm instantly identifies profitable opportunities with positive expected value.',
      gradient: 'from-indigo-500 to-purple-600',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-20 md:py-28 overflow-hidden bg-slate-950">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/5 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(139, 92, 246, 0.03) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(139, 92, 246, 0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-14 md:mb-20 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-full mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Rocket className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-semibold">Quick Setup</span>
          </motion.div>
          
          <h2 className="text-white text-3xl md:text-5xl lg:text-6xl mb-6 font-extrabold tracking-tight">
            Start Winning in{' '}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              3 Easy Steps
            </span>
          </h2>
          
          <p className="text-white/60 text-lg md:text-xl font-medium">
            Get up and running in less than 2 minutes
          </p>
        </motion.div>

        {/* Steps - Modern Timeline Design */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={idx} 
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  {/* Connecting Line (Desktop only) */}
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-24 left-[60%] w-full h-[2px]">
                      <div className="w-full h-full bg-gradient-to-r from-purple-500/50 to-transparent" />
                      <motion.div 
                        className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-purple-400 to-transparent"
                        animate={{ x: [0, 100, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                      />
                    </div>
                  )}
                  
                  <motion.div 
                    className="relative group"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Card */}
                    <div className={`relative bg-gradient-to-br ${step.gradient} rounded-3xl p-7 md:p-8 transition-all duration-300 shadow-xl shadow-purple-500/10 group-hover:shadow-2xl group-hover:shadow-purple-500/20 overflow-hidden`}>
                      {/* Background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Step Number Badge */}
                      <div className="absolute -top-3 -right-3 w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 group-hover:rotate-6 transition-transform">
                        <span className="text-purple-600 text-2xl md:text-3xl font-extrabold">{step.number}</span>
                      </div>

                      {/* Icon */}
                      <div className="inline-flex p-4 rounded-2xl bg-white/20 border border-white/30 mb-6 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-white text-xl md:text-2xl mb-3 font-bold relative z-10">
                        {step.title}
                      </h3>
                      
                      <p className="text-white/80 font-medium leading-relaxed relative z-10">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div 
            className="mt-14 md:mt-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <motion.button 
              className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Now
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}