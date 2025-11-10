import { Plus, Minus, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

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
    
      
        {/* Header */}
        
          
            
            FAQ
          
          
          
            Frequently Asked{' '}
            
              Questions
            
          
          
          
            Everything you need to know about OddSightSeer
          
        

        {/* FAQ Accordion */}
        
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              
                {/* Question Button */}
                 setOpenIndex(isOpen ? null )}
                  className="w-full px-6 md:px-8 py-5 md:py-6 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                >
                  
                    {faq.question}
                  
                  
                  
                    {isOpen ? (
                      
                    ) : (
                      
                    )}
                  
                

                {/* Answer */}
                
                  
                    
                      
                        {faq.answer}
                      
                    
                  
                
              
            );
          })}
        

        {/* Bottom CTA */}
        
          Still have questions?
          
            
            Contact Support
          
        
      
    
  );
}
