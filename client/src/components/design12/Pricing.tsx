import { Check, Crown, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function Pricing() {
  const plans = [
    {
      name: 'Gold',
      price: '$10',
      period: '/month',
      description: 'Essential tools for serious bettors',
      gradient: 'from-amber-500 to-orange-600',
      features: [
        'Real-time odds from 45+ sportsbooks',
        '+EV bet finder',
        'Player Props tool',
        'Personalized dashboard',
        'Email support'
      ]
    },
    {
      name: 'Platinum',
      price: '$25',
      period: '/month',
      description: 'Advanced analytics for professionals',
      gradient: 'from-purple-500 to-violet-600',
      features: [
        'Everything in Gold, plus:',
        'Arbitrage opportunity scanner',
        'Middles betting tool',
        'Auto-refresh odds (real-time)',
        'Live betting markets',
        'Priority support',
        'Early access to new features'
      ],
      popular: true
    }
  ];

  return (
    <section id="pricing" className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/3 -right-40 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div 
          className="text-center mb-14 md:mb-20"
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
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-semibold">Simple Pricing</span>
          </motion.div>

          <h2 className="text-white text-3xl md:text-5xl lg:text-6xl mb-6 font-extrabold tracking-tight">
            Simple,{' '}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              transparent pricing
            </span>
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-6">
            Choose the plan that works best for you
          </p>
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-green-300 text-sm font-semibold">
              🎉 Legacy Pricing - Lock in these rates now
            </span>
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity -z-10`} />
              
              <div className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border ${
                plan.popular ? 'border-purple-400/50' : 'border-white/20'
              } rounded-3xl p-8 md:p-10 shadow-2xl h-full transition-all duration-300 group-hover:border-purple-400/50`}>
                
                {plan.popular && (
                  <motion.div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-full text-sm font-bold shadow-xl shadow-purple-500/30 flex items-center gap-2"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown className="w-4 h-4" />
                    Most Popular
                  </motion.div>
                )}

                {/* Plan Header */}
                <div className="mb-8">
                  <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white mb-2 font-bold text-2xl md:text-3xl">
                    {plan.name}
                  </h3>
                  <p className="text-white/60 text-sm font-medium">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-white font-extrabold text-5xl md:text-6xl">
                    {plan.price}
                  </span>
                  <span className="text-white/60 ml-2 font-medium text-lg">
                    {plan.period}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, fIndex) => (
                    <motion.li 
                      key={fIndex} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: fIndex * 0.05 }}
                    >
                      <div className={`p-1 rounded-full bg-gradient-to-br ${plan.gradient}`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white/80 font-medium">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button 
                  className={`w-full py-4 bg-gradient-to-r ${plan.gradient} text-white rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 group/btn`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                  <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}