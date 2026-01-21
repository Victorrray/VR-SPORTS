import { BetCard, BetData } from './BetCard';
import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export function FreeBetSection() {
  // Sample free bet of the day
  const freeBet: BetData = {
    id: 1,
    teams: 'Lakers @ Warriors',
    time: 'Today, 7:00 PM ET',
    pick: 'Lakers ML',
    odds: '+145',
    sportsbook: 'DraftKings',
    ev: '+4.2%',
    sport: 'NBA',
    status: 'pending',
    confidence: 'high'
  };

  return (
    <section className="md:hidden pt-20 pb-40 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto max-w-md relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-white mb-3 font-bold text-3xl">
            Today's{' '}
            <span className="bg-purple-400 bg-clip-text text-transparent">
              Featured Pick
            </span>
          </h2>
          
          
          {/* Free Bet Badge */}
          
        </motion.div>

        {/* Bet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <BetCard bet={freeBet} variant="hero" showActions={true} />
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-6"
        >
          <a 
            href="#pricing"
            className="inline-block px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 text-sm mb-3"
          >
            Get Premium Access
          </a>
          <p className="text-white/40 text-xs font-medium">
            Want more picks like this? Unlock unlimited access with Premium
          </p>
        </motion.div>
      </div>
    </section>
  );
}