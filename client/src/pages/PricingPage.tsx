import { useNavigate } from 'react-router-dom';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Header } from '../components/design12/Header';
import { Footer } from '../components/design12/Footer';
import { Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { PAGE_TITLES, PAGE_DESCRIPTIONS, SITE_CONFIG } from '../utils/seo';
import { useAuth } from '../hooks/SimpleAuth';

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/signup');
  const handleDashboardClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };
  const handleRoadmapClick = () => navigate('/roadmap');
  const handlePrivacyClick = () => navigate('/privacy');
  const handleTermsClick = () => navigate('/terms');
  const handleDisclaimerClick = () => navigate('/disclaimer');

  const plans = [
    {
      name: 'Gold',
      price: '$10',
      period: '/month',
      description: 'Essential tools for serious bettors',
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
    <div className="min-h-screen bg-slate-950">
      <Helmet>
        <title>Pricing - {PAGE_TITLES.home}</title>
        <meta name="description" content="Simple, transparent pricing for OddSightSeer. Choose Gold ($10/mo) or Platinum ($25/mo) plans." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_CONFIG.domain}/pricing`} />
      </Helmet>

      <Header 
        onLoginClick={handleLoginClick} 
        onDashboardClick={handleDashboardClick}
        onRoadmapClick={handleRoadmapClick}
        onSignupClick={handleSignUpClick}
      />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div 
            className="text-center mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple Pricing
            </h1>
            <p className="text-white/50 text-lg">
              Choose the plan that works best for you. No hidden fees.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mt-6">
              <span className="text-green-400 text-sm font-medium">
                🎉 Legacy Pricing - Lock in these rates now
              </span>
            </div>
          </motion.div>

          {/* Plans - Clean Minimal Design */}
          <div className="max-w-3xl mx-auto">
            {/* Plan Toggle Header */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1 bg-white/5 rounded-full border border-white/10">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all cursor-default ${
                      plan.popular 
                        ? 'bg-purple-600 text-white' 
                        : 'text-white/50'
                    }`}
                  >
                    {plan.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Plans Side by Side */}
            <div className="grid md:grid-cols-2 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  {/* Plan Name & Badge */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h3 className="text-white text-2xl font-bold">{plan.name}</h3>
                      {plan.popular && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-sm">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <span className="text-5xl md:text-6xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/40 text-lg">{plan.period}</span>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={handleSignUpClick}
                    className={`group w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-8 ${
                      plan.popular
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    Get Started
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Features List */}
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-white/60 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-12" />

            {/* Bottom comparison note */}
            <p className="text-center text-white/30 text-sm">
              Both plans include a 7-day free trial. Cancel anytime.
            </p>
          </div>

          {/* FAQ Link */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-white/40 text-sm">
              Have questions?{' '}
              <a href="/#faq" className="text-purple-400 hover:text-purple-300 transition-colors">
                Check our FAQ
              </a>
            </p>
          </motion.div>
        </div>
      </main>

      <Footer 
        onRoadmapClick={handleRoadmapClick}
        onPrivacyClick={handlePrivacyClick}
        onTermsClick={handleTermsClick}
        onDisclaimerClick={handleDisclaimerClick}
      />
    </div>
  );
}
