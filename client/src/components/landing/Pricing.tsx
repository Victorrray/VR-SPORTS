import { Check, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PricingProps {
  onGetStarted?: () => void;
}

export function Pricing({ onGetStarted }: PricingProps = {}) {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate('/login');
    }
  };
  const plans = [
    {
      name: 'Gold',
      price: '$10',
      period: '/month',
      description: 'Essential tools for serious bettors',
      features: [
        'Real-time odds from 40+ sportsbooks',
        'Basic EV calculator',
        'Up to 50 picks per day',
        'Email alerts',
        'Performance tracking',
        'Mobile app access'
      ]
    },
    {
      name: 'Platinum',
      price: '$25',
      period: '/month',
      description: 'Advanced analytics for professionals',
      features: [
        'Everything in Gold, plus:',
        'Unlimited picks',
        'Advanced market analysis',
        'Kelly Criterion calculator',
        'Instant push notifications',
        'Priority support',
        'API access',
        'Custom filters & alerts'
      ],
      popular: true
    }
  ];

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-white mb-4 font-bold" style={{fontSize: 'clamp(2rem, 6vw, 3.5rem)'}}>
            Simple,{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              transparent pricing
            </span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto font-medium">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border ${
                plan.popular ? 'border-purple-400/50' : 'border-purple-400/30'
              } rounded-2xl p-6 md:p-8 shadow-xl ${
                plan.popular ? 'shadow-purple-500/20' : 'shadow-purple-500/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-500/50 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white mb-2 font-bold text-2xl md:text-3xl">
                  {plan.name}
                </h3>
                <p className="text-white/60 text-sm font-medium">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-white font-bold" style={{fontSize: 'clamp(2.5rem, 6vw, 4rem)'}}>
                  {plan.price}
                </span>
                <span className="text-white/60 ml-2 font-medium">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-sm font-medium">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={handleGetStarted}
                className="w-full py-3 md:py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 text-center"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}