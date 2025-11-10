import { Plus, Minus, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does OddSightSeer find +EV bets?',
      answer: 'Our proprietary algorithm scans odds across 39+ sportsbooks in real-time, calculates true probability, and identifies bets where the implied odds are in your favor. We use advanced statistical models and historical data to determine expected value.',
    },
    {
      question: 'What\'s the difference between Gold and Platinum?',
      answer: 'Gold ($10/mo) includes access to all 39+ sportsbooks, +EV finder, and basic analytics. Platinum ($25/mo) adds arbitrage opportunities, live betting markets, advanced analytics, bankroll management tools, and priority support.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes! Both plans are month-to-month with no long-term commitment. You can cancel anytime from your account settings. We also offer a 7-day money-back guarantee if you\'re not satisfied.',
    },
    {
      question: 'Do I need accounts at all 39+ sportsbooks?',
      answer: 'No. During setup, you select which sportsbooks you have access to. Our algorithm will only show you opportunities available on your selected books. Most users start with 3-5 sportsbooks and expand over time.',
    },
    {
      question: 'How quickly do I receive alerts?',
      answer: 'Alerts are sent in under 0.5 seconds when a profitable opportunity is detected. You\'ll receive push notifications on mobile and desktop. Time-sensitive opportunities are marked as "urgent" for immediate action.',
    },
    {
      question: 'Is sports betting legal?',
      answer: 'Sports betting legality varies by state and country. OddSightSeer is a analytics tool and does not facilitate betting. You are responsible for ensuring sports betting is legal in your jurisdiction before using any sportsbook.',
    },
    {
      question: 'What sports and markets are covered?',
      answer: 'We cover all major sports including NFL, NBA, MLB, NHL, soccer, tennis, golf, MMA, and more. Markets include moneylines, spreads, totals, player props, futures, and live betting (Platinum plan).',
    },
    {
      question: 'Do you offer a free trial?',
      answer: 'We don\'t offer a traditional free trial, but we do provide a 7-day money-back guarantee. This allows you to try the full platform risk-free and cancel for a full refund if it\'s not the right fit.',
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full mb-6 shadow-lg">
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
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <div
                key={index}
                className="group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300"
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
              </div>
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