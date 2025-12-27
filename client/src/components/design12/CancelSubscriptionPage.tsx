import { AlertCircle, ArrowLeft, ChevronDown, X, Loader2, Check, Crown, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useMe } from '../../hooks/useMe';
import { toast } from 'sonner';

interface CancelSubscriptionPageProps {
  onBack: () => void;
  onNavigateToChangePlan?: () => void;
}

export function CancelSubscriptionPage({ onBack, onNavigateToChangePlan }: CancelSubscriptionPageProps) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const { me, refetch } = useMe();
  const [selectedReason, setSelectedReason] = useState('');
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Get plan details
  const userPlan = me?.plan || 'free';
  const isPlatinum = userPlan === 'platinum' || me?.unlimited === true;
  const isGold = userPlan === 'gold';
  const isFree = userPlan === 'free' && !me?.unlimited;
  const hasActivePlan = isPlatinum || isGold;
  const planDisplayName = isPlatinum ? 'Platinum' : isGold ? 'Gold' : 'Free';
  const planPrice = isPlatinum ? '$25' : isGold ? '$15' : '$0';
  
  // Format next billing date
  const formatBillingDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Not available';
    }
  };

  const reasons = [
    'Too expensive',
    'Not using it enough',
    'Missing features I need',
    'Found a better alternative',
    'Technical issues',
    'Just trying it out',
    'Other',
  ];

  const handleCancel = () => {
    setShowConfirmation(true);
  };

  const handleFinalCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: selectedReason,
          feedback: feedback,
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Format the end date if available
      const endDate = data.current_period_end 
        ? new Date(data.current_period_end * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

      toast.success('Subscription cancelled', {
        description: endDate 
          ? `Your access continues until ${endDate}`
          : 'Your subscription has been cancelled'
      });

      // Refresh user data
      if (refetch) refetch();

      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription', {
        description: error.message || 'Please try again or contact support'
      });
      setIsCancelling(false);
    }
  };

  // Confirmation Screen
  if (showConfirmation) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowConfirmation(false)}
            className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-xl transition-all`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-xl md:text-2xl`}>
              Confirm Cancellation
            </h1>
            <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm mt-1`}>
              Please review the details below
            </p>
          </div>
        </div>

        {/* Final Warning */}
        <div className={`p-6 ${isLight ? 'bg-red-50 border-red-300' : 'bg-red-500/10 border-red-400/30'} border rounded-2xl`}>
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className={`${isLight ? 'text-red-900' : 'text-red-400'} font-bold mb-2`}>
                Are you absolutely sure?
              </h3>
              <p className={`${isLight ? 'text-red-800' : 'text-red-400/80'} text-sm`}>
                This action will cancel your subscription. You'll lose access to all premium features at the end of your current billing cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Cancellation Summary */}
        <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold mb-4`}>
            Cancellation Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Plan</span>
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>Platinum Monthly</span>
            </div>
            <div className="flex justify-between">
              <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Access until</span>
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>December 15, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Final charge</span>
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>$0.00</span>
            </div>
            {selectedReason && (
              <div className="pt-3 border-t border-white/10">
                <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm block mb-1`}>Cancellation reason</span>
                <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>{selectedReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* What You'll Lose */}
        <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
          <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold mb-4`}>
            What you'll lose access to
          </h3>
          <ul className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm space-y-2`}>
            <li>• Advanced odds analytics and comparisons</li>
            <li>• AI-powered pick recommendations</li>
            <li>• Bankroll management tools</li>
            <li>• Comprehensive betting calculator</li>
            <li>• Historical performance tracking</li>
          </ul>
        </div>

        {/* Final Action Buttons */}
        <div className="flex flex-col-reverse md:flex-row gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isCancelling}
            className={`flex-1 px-6 py-3 ${isLight ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold disabled:opacity-50`}
          >
            Go Back
          </button>
          <button
            onClick={handleFinalCancel}
            disabled={isCancelling}
            className={`flex-1 px-6 py-3 ${isLight ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'} backdrop-blur-xl rounded-xl transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel My Subscription'
            )}
          </button>
        </div>

        {/* Help Text */}
        <p className={`${isLight ? lightModeColors.textMuted : 'text-white/40'} text-center text-xs`}>
          Changed your mind? Click "Go Back" to keep your subscription
        </p>
      </div>
    );
  }

  // If user doesn't have an active plan, show upgrade cards
  if (!hasActivePlan) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-xl transition-all`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-xl md:text-2xl`}>
              No Active Subscription
            </h1>
            <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm mt-1`}>
              Upgrade to unlock premium features
            </p>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Gold Plan */}
          <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${isLight ? 'bg-yellow-100' : 'bg-yellow-500/20'} flex items-center justify-center`}>
                <Zap className={`w-6 h-6 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} />
              </div>
              <div>
                <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg`}>Gold</h3>
                <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>For serious bettors</p>
              </div>
            </div>
            <div className="mb-6">
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-3xl`}>$10</span>
              <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} ml-2`}>/month</span>
            </div>
            <ul className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm space-y-2 mb-6`}>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Real-time odds from 40+ sportsbooks
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                EV tool access
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Player Props tool
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Performance tracking
              </li>
            </ul>
            <button
              onClick={onNavigateToChangePlan}
              className={`w-full px-4 py-3 ${isLight ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'} rounded-xl font-bold transition-all`}
            >
              Upgrade to Gold
            </button>
          </div>

          {/* Platinum Plan */}
          <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/50'} backdrop-blur-2xl border rounded-2xl`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${isLight ? 'bg-purple-100' : 'bg-purple-500/20'} flex items-center justify-center`}>
                <Crown className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              </div>
              <div>
                <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-lg`}>Platinum</h3>
                <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Maximum value</p>
              </div>
            </div>
            <div className="mb-6">
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-3xl`}>$25</span>
              <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} ml-2`}>/month</span>
            </div>
            <ul className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm space-y-2 mb-6`}>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Everything in Gold, plus:
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Arbitrage detection
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Middles tool
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Advanced analytics
              </li>
            </ul>
            <button
              onClick={onNavigateToChangePlan}
              className={`w-full px-4 py-3 ${isLight ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'} rounded-xl font-bold transition-all`}
            >
              Upgrade to Platinum
            </button>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className={`w-full px-6 py-3 ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-white/5 text-white hover:bg-white/10'} rounded-xl font-bold transition-all`}
        >
          Back to Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className={`p-2 ${isLight ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/60'} rounded-xl transition-all`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold text-xl md:text-2xl`}>
            Cancel Subscription
          </h1>
          <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm mt-1`}>
            We're sorry to see you go
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className={`p-4 ${isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-500/10 border-amber-400/30'} border rounded-2xl`}>
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className={`${isLight ? 'text-amber-900' : 'text-amber-400'} font-bold mb-1`}>
              What happens when you cancel
            </h3>
            <ul className={`${isLight ? 'text-amber-800' : 'text-amber-400/80'} text-sm space-y-1`}>
              <li>• You'll lose access to premium features at the end of your billing cycle</li>
              <li>• Your picks history and stats will be saved for 90 days</li>
              <li>• You can reactivate anytime before data deletion</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Plan Info */}
      <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
        <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold mb-4`}>
          Current Plan
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Plan</span>
            <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>{planDisplayName} Monthly</span>
          </div>
          <div className="flex justify-between">
            <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Next billing date</span>
            <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>{formatBillingDate(me?.subscription_end_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Amount</span>
            <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>{planPrice}/month</span>
          </div>
        </div>
      </div>

      {/* Cancellation Form */}
      <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl space-y-4`}>
        <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>
          Tell us why you're leaving
        </h3>

        {/* Reason Dropdown */}
        <div className="relative">
          <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
            Reason for canceling (optional)
          </label>
          <button
            onClick={() => setShowReasonDropdown(!showReasonDropdown)}
            className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-white/5 border-white/10 text-white'} border rounded-xl font-bold text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
          >
            <span className={selectedReason ? '' : isLight ? 'text-gray-400' : 'text-white/40'}>
              {selectedReason || 'Select a reason'}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showReasonDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showReasonDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowReasonDropdown(false)}
              />
              
              {/* Dropdown */}
              <div className={`absolute top-full mt-2 left-0 right-0 ${isLight ? 'bg-white border-gray-200' : 'bg-slate-900 border-white/10'} border rounded-xl overflow-hidden z-50 backdrop-blur-xl`}>
                {reasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => {
                      setSelectedReason(reason);
                      setShowReasonDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left ${isLight ? 'hover:bg-gray-100 text-gray-900' : 'hover:bg-white/5 text-white'} font-bold text-sm transition-colors`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Additional Feedback */}
        <div>
          <label className={`${isLight ? 'text-gray-700' : 'text-white/80'} font-bold text-sm mb-2 block`}>
            Additional feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Help us improve by sharing more details..."
            rows={4}
            className={`w-full px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40'} border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/40 resize-none`}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse md:flex-row gap-3">
        <button
          onClick={onBack}
          className={`flex-1 px-6 py-3 ${isLight ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold`}
        >
          Keep My Subscription
        </button>
        <button
          onClick={handleCancel}
          className={`flex-1 px-6 py-3 ${isLight ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200' : 'bg-red-500/10 border-red-400/30 text-red-400 hover:bg-red-500/20'} backdrop-blur-xl border rounded-xl transition-all font-bold`}
        >
          Cancel Subscription
        </button>
      </div>

      {/* Help Text */}
      <p className={`${isLight ? lightModeColors.textMuted : 'text-white/40'} text-center text-xs`}>
        Need help? Contact support at support@oddsightseer.com
      </p>
    </div>
  );
}