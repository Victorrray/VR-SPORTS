import { Plus, Minus, HelpCircle, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Does OddSightSeer offer a free odds viewer?',
      answer: 'Yes! OddSightSeer offers a free odds viewer that gives you access to our Straight Bets tool. Compare real-time odds across multiple sportsbooks at no cost. Upgrade to Gold or Platinum for access to +EV finder, player props, arbitrage opportunities, and more advanced features.',
    },
    {
      question: 'Is OddSightSeer a sportsbook?',
      answer: 'No, OddSightSeer is not a sportsbook. We are strictly a sports data and analytics platform. We do not facilitate betting or hold user funds. We provide real-time odds data, +EV analysis, and betting tools to help you make informed decisions on the sportsbooks of your choice.',
    },
    {
      question: 'How does OddSightSeer find +EV bets?',
      answer: 'Our proprietary algorithm scans odds across 45+ sportsbooks in real-time, calculates true probability, and identifies bets where the implied odds are in your favor.',
    },
    {
      question: 'What\'s the difference between Gold and Platinum?',
      answer: 'Gold ($10/mo) includes access to all 45+ sportsbooks, +EV finder, and player props tool. Platinum ($25/mo) adds arbitrage opportunities, middles tool, and live betting markets.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes! Both plans are month-to-month with no long-term commitment. You can cancel anytime from your account settings.',
    },
    {
      question: 'Is sports betting legal?',
      answer: 'Sports betting legality varies by state and country. OddSightSeer is a analytics tool and does not facilitate betting. You are responsible for ensuring sports betting is legal in your jurisdiction before using any sportsbook.',
    },
    {
      question: 'What sports and markets are covered?',
      answer: 'We cover all major sports including NFL, NBA, MLB, NHL, NCAA Basketball & football. Markets include moneylines, spreads, totals, player props, and live betting (Platinum plan).',
    },
  ];

  return (
    <section id="faq" className="relative py-20 md:py-28 overflow-hidden bg-slate-950">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
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
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-semibold">FAQ</span>
          </motion.div>
          
          <h2 className="text-white text-3xl md:text-5xl lg:text-6xl mb-6 font-extrabold tracking-tight">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          
          <p className="text-white/60 text-lg md:text-xl font-medium">
            Everything you need to know about OddSightSeer
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div
                key={index}
                className={`group bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-purple-400/50 shadow-lg shadow-purple-500/10' : 'border-white/10 hover:border-white/20'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                {/* Question Button */}
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-white text-base md:text-lg font-bold pr-4">
                    {faq.question}
                  </span>
                  
                  <motion.div 
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isOpen ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-white/10'
                    }`}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isOpen ? (
                      <Minus className="w-5 h-5 text-white" />
                    ) : (
                      <Plus className="w-5 h-5 text-white/70" />
                    )}
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-8 pb-6">
                        <div className="border-t border-white/10 pt-4">
                          <p className="text-white/70 leading-relaxed font-medium">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          className="mt-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-white/50 mb-5 font-medium">Still have questions?</p>
          <motion.button 
            onClick={() => window.location.href = 'mailto:support@oddsightseer.com'}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 rounded-2xl transition-all font-bold text-white shadow-xl"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <span>Contact Support</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}