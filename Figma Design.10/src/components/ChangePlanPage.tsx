import { Crown, Check, ArrowLeft, Sparkles, Zap, Rocket } from 'lucide-react';
import { useTheme, lightModeColors } from '../contexts/ThemeContext';
import { toast } from 'sonner';

interface ChangePlanPageProps {
  onBack: () => void;
}

export function ChangePlanPage({ onBack }: ChangePlanPageProps) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';

  const plans = [
    {
      name: 'Gold',
      price: 15,
      period: 'month',
      icon: Zap,
      iconColor: isLight ? 'text-yellow-600' : 'text-yellow-400',
      iconBg: isLight ? 'bg-yellow-100 border-yellow-200' : 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/30',
      description: 'For serious bettors',
      features: [
        'Everything in Free',
        'Unlimited picks',
        'Advanced analytics',
        'EV calculations',
        'Bet tracking',
        'Email & chat support',
      ],
      unavailableFeatures: [
        'Premium features',
        'Priority support',
      ],
      buttonText: 'Downgrade to Gold',
      buttonDisabled: false,
      current: false,
    },
    {
      name: 'Platinum',
      price: 25,
      period: 'month',
      icon: Crown,
      iconColor: isLight ? 'text-amber-600' : 'text-amber-400',
      iconBg: isLight ? 'bg-amber-100 border-amber-200' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30',
      description: 'Maximum value and features',
      popular: true,
      features: [
        'Everything in Gold',
        'Bankroll management',
        'Betting calculator',
        'Sharp book access',
        'API access',
        'Priority support',
        'Custom alerts',
        'Advanced filters',
      ],
      unavailableFeatures: [],
      buttonText: 'Current Plan',
      buttonDisabled: true,
      current: true,
    },
  ];

  const handleSelectPlan = (planName: string) => {
    if (planName === 'Platinum') {
      toast.info('You are already on the Platinum plan');
    } else if (planName === 'Gold') {
      toast.success('Plan change initiated. Check your email to confirm.');
    } else {
      toast.success('Plan change initiated. You will lose premium features.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className={`flex items-center gap-2 ${isLight ? 'text-gray-700 hover:text-gray-900' : 'text-white/70 hover:text-white'} transition-colors`}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-bold">Back</span>
      </button>

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-3xl md:text-4xl font-bold`}>
          Choose Your Plan
        </h1>
        <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold text-lg max-w-2xl mx-auto`}>
          Upgrade or downgrade your subscription at any time. Changes take effect immediately.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative ${
              plan.current
                ? isLight
                  ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300'
                  : 'bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-purple-500/10 border-purple-400/50'
                : isLight
                ? lightModeColors.statsCard
                : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'
            } backdrop-blur-2xl border rounded-2xl p-6 transition-all hover:scale-[1.02] ${
              plan.popular ? 'md:scale-105' : ''
            }`}
          >
            {/* Current Plan Badge */}
            {plan.current && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className={`px-3 py-1 ${isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/30 text-emerald-400'} backdrop-blur-xl border rounded-full font-bold text-xs flex items-center gap-1`}>
                  <Check className="w-3 h-3" />
                  CURRENT
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6 pt-2">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${plan.iconBg} border flex items-center justify-center backdrop-blur-xl`}>
                <plan.icon className={`w-8 h-8 ${plan.iconColor}`} />
              </div>
              <h3 className={`${isLight ? lightModeColors.text : 'text-white'} text-2xl font-bold mb-2`}>
                {plan.name}
              </h3>
              <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm font-bold mb-4`}>
                {plan.description}
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`${isLight ? lightModeColors.text : 'text-white'} text-4xl font-bold`}>
                  ${plan.price}
                </span>
                <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm font-bold`}>
                  /{plan.period}
                </span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${isLight ? 'bg-emerald-100' : 'bg-emerald-500/20'} flex items-center justify-center`}>
                    <Check className={`w-3 h-3 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  </div>
                  <span className={`${isLight ? lightModeColors.text : 'text-white'} text-sm font-bold`}>
                    {feature}
                  </span>
                </div>
              ))}
              {plan.unavailableFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 opacity-40">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${isLight ? 'bg-gray-200' : 'bg-white/10'} flex items-center justify-center`}>
                    <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>×</span>
                  </div>
                  <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold line-through`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleSelectPlan(plan.name)}
              disabled={plan.buttonDisabled}
              className={`w-full px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                plan.buttonDisabled
                  ? isLight
                    ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white/10 border-white/20 text-white/50 cursor-not-allowed'
                  : plan.current
                  ? isLight
                    ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-300 hover:from-purple-200 hover:to-indigo-200'
                    : 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border-purple-400/30 hover:from-purple-500/40 hover:to-indigo-500/40'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-400/30 hover:from-purple-400 hover:to-indigo-400'
              } border`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6 mt-8`}>
        <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg mb-4`}>
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold mb-1`}>
              Can I change my plan at any time?
            </h4>
            <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm font-bold`}>
              Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.
            </p>
          </div>
          <div>
            <h4 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold mb-1`}>
              What happens to my data if I downgrade?
            </h4>
            <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm font-bold`}>
              Your data is always safe. If you downgrade, you'll simply lose access to premium features but all your historical data will be preserved.
            </p>
          </div>
          <div>
            <h4 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold mb-1`}>
              Is there a refund policy?
            </h4>
            <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm font-bold`}>
              We offer a 7-day money-back guarantee on all new subscriptions. No questions asked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}