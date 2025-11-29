import { Plus, Minus, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does OddSightSeer find +EV bets?',
      answer: 'Our proprietary algorithm scans odds across 40+ sportsbooks in real-time, calculates true probability, and identifies bets where the implied odds are in your favor.',
    },
    {
      question: 'What\'s the difference between Gold and Platinum?',
      answer: 'Gold ($10/mo) includes access to all 40+ sportsbooks, +EV finder, and player props tool. Platinum ($25/mo) adds arbitrage opportunities, middles tool, and live betting markets.',
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
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div 
          className="text-center mb-12 md:mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full mb-6">
            <HelpCircle className="w-4 h-4 text-white" />
            <span className="text-white font-bold">FAQ</span>
          </div>
          
          <h2 className="text-white text-3xl md:text-5xl mb-4 font-bold">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          
          <p className="text-white/60 text-lg font-semibold">
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
                className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300"
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
                  <span className="text-white text-lg md:text-xl font-bold pr-4">
                    {faq.question}
                  </span>
                  
                  <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? (
                      <Minus className="w-5 h-5 text-white" />
                    ) : (
                      <Plus className="w-5 h-5 text-white" />
                    )}
                  </div>
                </button>

                {/* Answer */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 md:px-8 pb-5 md:pb-6 pt-2">
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-white/70 leading-relaxed font-semibold">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4 font-semibold">Still have questions?</p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-full transition-all font-bold text-white">
            <HelpCircle className="w-5 h-5" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </section>
  );
}