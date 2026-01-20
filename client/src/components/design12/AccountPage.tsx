import {
  User,
  Crown,
  Mail,
  Calendar,
  CreditCard,
  Settings,
  Shield,
  Bell,
  LogOut,
  Lock,
  Star,
  Loader2,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/SimpleAuth';
import { useMe } from '../../hooks/useMe';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../utils/apiClient';

interface AccountPageProps {
  onNavigateToSettings?: () => void;
  onNavigateToCancelSubscription?: () => void;
  onNavigateToDeleteAccount?: () => void;
  onNavigateToChangePlan?: () => void;
}

export function AccountPage({
  onNavigateToSettings,
  onNavigateToCancelSubscription,
  onNavigateToDeleteAccount,
  onNavigateToChangePlan,
}: AccountPageProps) {
  const { colorMode } = useTheme();
  // Dark mode only - no light mode support
  const isLight = false;
  const { user, profile } = useAuth();
  const { me, loading: meLoading } = useMe();
  const [portalLoading, setPortalLoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  
  // Mask email for privacy
  const maskEmail = (email: string) => {
    if (!email) return 'Not available';
    const [localPart, domain] = email.split('@');
    if (!domain) return '••••••••';
    const maskedLocal = localPart.length > 2 
      ? localPart[0] + '•'.repeat(Math.min(localPart.length - 2, 6)) + localPart[localPart.length - 1]
      : '••';
    return `${maskedLocal}@${domain}`;
  };
  
  // Determine plan display
  const userPlan = me?.plan || 'free';
  const isPlatinum = userPlan === 'platinum' || me?.unlimited === true;
  const isGold = userPlan === 'gold';
  const planDisplayName = isPlatinum ? 'Platinum Member' : isGold ? 'Gold Member' : 'Free Plan';
  const PlanIcon = isPlatinum ? Crown : isGold ? Star : User;

  // Open Stripe Customer Portal
  const openCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      console.log('Opening customer portal...');
      const response = await apiClient.post('/api/billing/customer-portal');
      console.log('Customer portal response:', response.data);
      
      if (!response.data?.url) {
        throw new Error('No portal URL returned');
      }
      
      // Redirect to Stripe Customer Portal
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Please try again later';
      toast.error('Unable to open billing portal', {
        description: errorMessage
      });
    } finally {
      setPortalLoading(false);
    }
  };

  // Send password reset email
  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error('No email found', {
        description: 'Unable to send password reset email'
      });
      return;
    }

    setPasswordResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Password reset email sent', {
        description: `Check your inbox at ${user.email}`
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send reset email', {
        description: error.message || 'Please try again later'
      });
    } finally {
      setPasswordResetLoading(false);
    }
  };
  
  return (
    <div className="space-y-6 relative">
      {/* Settings Icon - Top Right */}
      {onNavigateToSettings && (
        <button
          onClick={onNavigateToSettings}
          className={`absolute top-0 right-0 p-2.5 ${isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300'} backdrop-blur-xl border rounded-xl ${isLight ? 'hover:from-purple-200 hover:to-indigo-200' : 'hover:from-purple-500/30 hover:to-indigo-500/30'} transition-all z-10`}
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-2xl md:text-3xl font-bold`}>
            Account Settings
          </h1>
          <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>
            Manage your profile and subscription
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2`}>
            <User className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
            Profile Information
          </h2>
          
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className={`w-20 h-20 rounded-2xl ${isLight ? 'bg-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border-purple-400/30'} border flex items-center justify-center backdrop-blur-xl`}>
            <User className={`w-10 h-10 ${isLight ? 'text-purple-600' : 'text-purple-300'}`} />
          </div>
          <div className="flex-1">
            <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} text-xl font-bold mb-1`}>
              {profile?.username || user?.email?.split('@')[0] || 'User'}
            </h3>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 ${
                isPlatinum 
                  ? (isLight ? 'bg-amber-100 border-amber-200' : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30')
                  : isGold
                    ? (isLight ? 'bg-yellow-100 border-yellow-200' : 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/30')
                    : (isLight ? 'bg-gray-100 border-gray-200' : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-400/30')
              } border rounded-full backdrop-blur-xl`}>
                <div className="flex items-center gap-1.5">
                  <PlanIcon className={`w-4 h-4 ${
                    isPlatinum 
                      ? (isLight ? 'text-amber-600' : 'text-amber-400')
                      : isGold
                        ? (isLight ? 'text-yellow-600' : 'text-yellow-400')
                        : (isLight ? 'text-gray-600' : 'text-gray-400')
                  }`} />
                  <span className={`${
                    isPlatinum 
                      ? (isLight ? 'text-amber-700' : 'text-amber-400')
                      : isGold
                        ? (isLight ? 'text-yellow-700' : 'text-yellow-400')
                        : (isLight ? 'text-gray-700' : 'text-gray-400')
                  } font-bold text-sm`}>
                    {meLoading ? 'Loading...' : planDisplayName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-xl border`}>
            <div className="flex items-center gap-3 mb-2">
              <Mail className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold uppercase tracking-wide`}>
                Email
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                {showEmail ? (user?.email || 'Not available') : maskEmail(user?.email || '')}
              </p>
              <button
                onClick={() => setShowEmail(!showEmail)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight 
                    ? 'hover:bg-gray-200 text-gray-500' 
                    : 'hover:bg-white/10 text-white/50'
                }`}
                title={showEmail ? 'Hide email' : 'Show email'}
              >
                {showEmail ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-xl border`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold uppercase tracking-wide`}>
                Member Since
              </span>
            </div>
            <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
              {me?.created_at 
                ? new Date(me.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'Not available'}
            </p>
          </div>
        </div>
      </div>

      {/* Billing & Subscription Section */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6 shadow-xl`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <CreditCard className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Billing & Subscription
        </h2>

        <div className="space-y-4">
          {/* Current Plan */}
          {isPlatinum ? (
            <div className={`p-6 ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-transparent border-purple-400/30'} backdrop-blur-xl rounded-xl border shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${isLight ? 'bg-amber-100 border-amber-200' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30'} border flex items-center justify-center backdrop-blur-xl`}>
                    <Crown className={`w-6 h-6 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>Platinum Plan</div>
                    <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold`}>Premium features unlocked</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-2xl`}>$25</div>
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>per month</div>
                </div>
              </div>
              
              {me?.cancel_at_period_end ? (
                <div className={`flex items-center gap-2 ${isLight ? 'text-orange-600' : 'text-orange-400'} text-sm font-bold mb-4`}>
                  <Calendar className="w-4 h-4" />
                  <span>Subscription Ending{me?.subscription_end_date ? ` · Access until ${new Date(me.subscription_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 ${isLight ? 'text-green-600' : 'text-green-400'} text-sm font-bold mb-4`}>
                  <Calendar className="w-4 h-4" />
                  <span>Active Subscription{me?.subscription_end_date ? ` · Next payment ${new Date(me.subscription_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={onNavigateToChangePlan}
                  className={`flex-1 px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
                >
                  {me?.cancel_at_period_end ? 'Resubscribe' : 'Change Plan'}
                </button>
              </div>
            </div>
          ) : isGold ? (
            <div className={`p-6 ${isLight ? 'bg-yellow-50 border-yellow-200' : 'bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-transparent border-yellow-400/30'} backdrop-blur-xl rounded-xl border shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${isLight ? 'bg-yellow-100 border-yellow-200' : 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/30'} border flex items-center justify-center backdrop-blur-xl`}>
                    <Star className={`w-6 h-6 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} />
                  </div>
                  <div>
                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>Gold Plan</div>
                    <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold`}>Enhanced features</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-2xl`}>$10</div>
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>per month</div>
                </div>
              </div>
              
              {me?.cancel_at_period_end ? (
                <div className={`flex items-center gap-2 ${isLight ? 'text-orange-600' : 'text-orange-400'} text-sm font-bold mb-4`}>
                  <Calendar className="w-4 h-4" />
                  <span>Subscription Ending{me?.subscription_end_date ? ` · Access until ${new Date(me.subscription_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 ${isLight ? 'text-green-600' : 'text-green-400'} text-sm font-bold mb-4`}>
                  <Calendar className="w-4 h-4" />
                  <span>Active Subscription{me?.subscription_end_date ? ` · Next payment ${new Date(me.subscription_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={onNavigateToChangePlan}
                  className={`flex-1 px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}
                >
                  {me?.cancel_at_period_end ? 'Resubscribe' : 'Change Plan'}
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-6 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-gray-500/10 via-slate-500/10 to-transparent border-gray-400/30'} backdrop-blur-xl rounded-xl border`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-gradient-to-br from-gray-500/20 to-slate-500/20 border-gray-400/30'} border flex items-center justify-center backdrop-blur-xl`}>
                    <User className={`w-6 h-6 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>Free Plan</div>
                    <div className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold`}>Limited access</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-2xl`}>Free</div>
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>Limited</div>
                </div>
              </div>
              <div className={`pt-4 border-t ${isLight ? 'border-gray-200' : 'border-gray-400/20'}`}>
                <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm mb-4`}>
                  Upgrade to unlock unlimited odds data, arbitrage detection, and more!
                </p>
                <button 
                  onClick={onNavigateToChangePlan}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-sm"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}

          {/* Payment Method - Only for paid plans */}
          {(isPlatinum || isGold) && (
            <button 
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left disabled:opacity-50`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                <div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Payment Method</div>
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>
                    {portalLoading ? 'Loading...' : 'Manage your payment method'}
                  </div>
                </div>
              </div>
              <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
            </button>
          )}

          {/* Billing History - Only for paid plans */}
          {(isPlatinum || isGold) && (
            <button 
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left disabled:opacity-50`}
            >
              <div className="flex items-center gap-3">
                <Download className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                <div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Billing History</div>
                  <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>
                    {portalLoading ? 'Loading...' : 'View and download past invoices'}
                  </div>
                </div>
              </div>
              <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Section */}
      
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-[16px] p-6`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <Shield className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Security & Privacy
        </h2>

        <div className="space-y-4">
          <button 
            onClick={handlePasswordReset}
            disabled={passwordResetLoading}
            className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left disabled:opacity-50`}
          >
            <div className="flex items-center gap-3">
              {passwordResetLoading ? (
                <Loader2 className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'} animate-spin`} />
              ) : (
                <Lock className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              )}
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                  {passwordResetLoading ? 'Sending...' : 'Change Password'}
                </div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>
                  {passwordResetLoading ? 'Please wait...' : 'Send password reset email'}
                </div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </button>
        </div>
      </div>
      {/* Danger Zone */}
      <div className={`${isLight ? 'bg-red-50 border-red-200' : 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-400/30'} backdrop-blur-2xl border rounded-2xl p-6`}>
        <h2 className={`${isLight ? 'text-red-600' : 'text-red-400'} font-bold mb-4`}>
          Danger Zone
        </h2>
        <div className="space-y-3">
          <button 
            onClick={onNavigateToCancelSubscription}
            className={`w-full px-4 py-3 ${isLight ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200' : 'bg-red-500/10 border-red-400/30 text-red-400 hover:bg-red-500/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}>
            Cancel Subscription
          </button>
          <button 
            onClick={onNavigateToDeleteAccount}
            className={`w-full px-4 py-3 ${isLight ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200' : 'bg-red-500/10 border-red-400/30 text-red-400 hover:bg-red-500/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}