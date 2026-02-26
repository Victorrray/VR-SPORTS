import { UserPlus, CreditCard, Target, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HowItWorksProps {
  onSignIn?: () => void;
}

export function HowItWorks({ onSignIn }: HowItWorksProps = {}) {
  const steps = [
    {
      number: '01',
      icon: UserPlus,
      title: 'Sign Up Free',
      description: 'Create your account in seconds. No credit card required.',
    },
    {
      number: '02',
      icon: CreditCard,
      title: 'Choose Your Plan',
      description: 'Select Gold ($10/mo) or Platinum ($25/mo) for full access.',
    },
    {
      number: '03',
      icon: Target,
      title: 'Find +EV Bets',
      description: 'Our algorithm identifies profitable opportunities instantly.',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-16 md:py-20 bg-slate-950">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div 
          className="text-center mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-white/50 text-lg">
            Get started in less than 2 minutes
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-purple-400 text-sm font-bold">{step.number}</span>
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <button className="group px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all flex items-center gap-2 mx-auto">
              Get Started Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={onSignIn}
              className="mt-4 text-white/50 hover:text-white text-sm transition-colors"
            >
              Already have an account? <span className="text-purple-400">Sign In</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}