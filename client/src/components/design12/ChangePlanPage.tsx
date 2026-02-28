import { Crown, Check, ArrowLeft, Zap, TrendingUp, Target, BarChart2, Sparkles } from 'lucide-react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useMe } from '../../hooks/useMe';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';

interface ChangePlanPageProps {
  onBack: () => void;
}

export function ChangePlanPage({ onBack }: ChangePlanPageProps) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const { me } = useMe();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Get user's current plan
  const currentPlan = me?.plan || 'free';
  const isGold = currentPlan === 'gold';
  const isPlatinum = currentPlan === 'platinum' || me?.unlimited === true;
  const isFree = currentPlan === 'free' && !me?.unlimited;

  const plans = [
    {
      name: 'Gold',
      price: 10,
      period: 'month',
      icon: Zap,
      iconColor: isLight ? 'text-yellow-600' : 'text-yellow-400',
      iconBg: isLight ? 'bg-yellow-50' : 'bg-yellow-500/10',
      description: 'Essential tools for smart betting',
      features: [
        { text: 'Straight Bets with EV', included: true },
        { text: 'Player Props', included: true },
        { text: 'Advanced Filters', included: true },
      ],
      lockedFeatures: [
        'Arbitrage Finder',
        'Middles Detector',
        'Discrepancy Tool',
        'Exchanges',
      ],
      buttonText: isGold ? 'Current Plan' : (isPlatinum ? 'Downgrade' : 'Get Gold'),
      buttonDisabled: isGold,
      current: isGold,
    },
    {
      name: 'Platinum',
      price: 25,
      period: 'month',
      icon: Crown,
      iconColor: isLight ? 'text-purple-600' : 'text-purple-400',
      iconBg: isLight ? 'bg-purple-50' : 'bg-purple-500/10',
      description: 'Full access to all premium tools',
      popular: true,
      features: [
        { text: 'Everything in Gold', included: true },
        { text: 'Arbitrage Finder', included: true },
        { text: 'Middles Detector', included: true },
        { text: 'Discrepancy Tool', included: true },
        { text: 'Exchanges Access', included: true },
      ],
      lockedFeatures: [],
      buttonText: isPlatinum ? 'Current Plan' : 'Get Platinum',
      buttonDisabled: isPlatinum,
      current: isPlatinum,
    },
  ];

  const handleSelectPlan = async (planName: string) => {
    const planLower = planName.toLowerCase();
    
    // If already on this plan, do nothing
    if ((planLower === 'gold' && isGold) || (planLower === 'platinum' && isPlatinum)) {
      toast.info(`You are already on the ${planName} plan`);
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }
      
      // Create Stripe checkout session
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:10000'}/api/billing/create-checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: planLower })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || data.detail || data.error || 'Checkout failed';
        toast.error(errorMsg);
        setLoading(false);
        return;
      }
      
      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast.error('No checkout URL received');
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Failed to handle plan selection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process upgrade');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className={`flex items-center gap-2 ${isLight ? 'text-gray-600 hover:text-gray-900' : 'text-white/60 hover:text-white'} transition-colors`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className={`${isLight ? 'text-gray-900' : 'text-white'} text-2xl md:text-3xl font-bold`}>
          Choose Your Plan
        </h1>
        <p className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm`}>
          Unlock premium betting tools. Cancel anytime.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative ${
              plan.popular && !plan.current
                ? isLight
                  ? 'bg-white border-purple-200 ring-2 ring-purple-100'
                  : 'bg-white/[0.03] border-purple-500/30 ring-1 ring-purple-500/20'
                : plan.current
                ? isLight
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-emerald-500/5 border-emerald-500/20'
                : isLight
                ? 'bg-white border-gray-200'
                : 'bg-white/[0.02] border-white/10'
            } border rounded-2xl p-5 transition-all`}
          >
            {/* Popular Badge */}
            {plan.popular && !plan.current && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <div className={`px-3 py-0.5 ${isLight ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'} rounded-full text-xs font-bold`}>
                  MOST POPULAR
                </div>
              </div>
            )}

            {/* Current Plan Badge */}
            {plan.current && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <div className={`px-3 py-0.5 ${isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'} rounded-full text-xs font-bold flex items-center gap-1`}>
                  <Check className="w-3 h-3" />
                  CURRENT
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div className="flex items-start justify-between mb-4 pt-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${plan.iconBg} flex items-center justify-center`}>
                  <plan.icon className={`w-5 h-5 ${plan.iconColor}`} />
                </div>
                <div>
                  <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>
                    {plan.name}
                  </h3>
                  <p className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>
                    {plan.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-2xl font-bold`}>
                  ${plan.price}
                </div>
                <div className={`${isLight ? 'text-gray-400' : 'text-white/40'} text-xs`}>
                  /month
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-2 mb-5">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                  <span className={`${isLight ? 'text-gray-700' : 'text-white/80'} text-sm`}>
                    {feature.text}
                  </span>
                </div>
              ))}
              {plan.lockedFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 opacity-40">
                  <span className={`w-4 h-4 flex-shrink-0 flex items-center justify-center ${isLight ? 'text-gray-400' : 'text-white/30'} text-xs`}>✕</span>
                  <span className={`${isLight ? 'text-gray-400' : 'text-white/40'} text-sm line-through`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleSelectPlan(plan.name)}
              disabled={plan.buttonDisabled || loading}
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                plan.buttonDisabled
                  ? isLight
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-purple-600 text-white hover:bg-purple-500'
                  : isLight
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              {loading ? 'Processing...' : plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Value Props */}
      <div className={`${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.02] border-white/5'} border rounded-xl p-4`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>15+</div>
            <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>Sportsbooks</div>
          </div>
          <div>
            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>Real-time</div>
            <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>Odds Updates</div>
          </div>
          <div>
            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>7-day</div>
            <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>Money Back</div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-3">
        <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm`}>
          Common Questions
        </h3>
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/5'} border rounded-xl divide-y ${isLight ? 'divide-gray-100' : 'divide-white/5'}`}>
          <div className="p-4">
            <h4 className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium text-sm mb-1`}>
              Can I cancel anytime?
            </h4>
            <p className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>
              Yes, cancel with one click. No fees, no hassle.
            </p>
          </div>
          <div className="p-4">
            <h4 className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium text-sm mb-1`}>
              What's the difference between plans?
            </h4>
            <p className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>
              Gold includes Straight Bets & Player Props. Platinum adds Arbitrage, Middles, Discrepancy, and Exchanges tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}