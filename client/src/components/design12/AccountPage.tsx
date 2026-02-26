import {
  User,
  Crown,
  Mail,
  Calendar,
  CreditCard,
  Settings,
  Shield,
  LogOut,
  Lock,
  Star,
  Loader2,
  Download,
  Eye,
  EyeOff,
  Headphones,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useState } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/SimpleAuth';
import { useMe } from '../../hooks/useMe';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../utils/apiClient';
import { motion } from 'framer-motion';

interface AccountPageProps {
  onNavigateToSettings?: () => void;
  onNavigateToCancelSubscription?: () => void;
  onNavigateToDeleteAccount?: () => void;
  onNavigateToChangePlan?: () => void;
  onSignOut?: () => void;
}

export function AccountPage({
  onNavigateToSettings,
  onNavigateToCancelSubscription,
  onNavigateToDeleteAccount,
  onNavigateToChangePlan,
  onSignOut,
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
        <motion.button
          onClick={onNavigateToSettings}
          className="absolute top-0 right-0 p-2 bg-white/5 border-white/10 text-white/60 border rounded-lg hover:bg-white/10 hover:text-white transition-colors z-10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      )}

      {/* Page Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-white text-xl md:text-2xl font-bold">
            Account Settings
          </h1>
          <p className="text-white/50 font-medium">
            Manage your profile and subscription
          </p>
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div 
        className="relative bg-white/5 border border-white/10 rounded-xl p-5 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            Profile Information
          </h2>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-purple-500/20 border border-purple-400/20 flex items-center justify-center">
            <User className="w-7 h-7 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white text-lg font-bold mb-1.5">
              {profile?.username || user?.email?.split('@')[0] || 'User'}
            </h3>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 ${
                isPlatinum 
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30'
                  : isGold
                    ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/30'
                    : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-400/30'
              } border rounded-full`}>
                <div className="flex items-center gap-1.5">
                  <PlanIcon className={`w-4 h-4 ${
                    isPlatinum ? 'text-amber-400' : isGold ? 'text-yellow-400' : 'text-gray-400'
                  }`} />
                  <span className={`${
                    isPlatinum ? 'text-amber-400' : isGold ? 'text-yellow-400' : 'text-gray-400'
                  } font-semibold text-sm`}>
                    {meLoading ? 'Loading...' : planDisplayName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Email</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white font-medium">
                {showEmail ? (user?.email || 'Not available') : maskEmail(user?.email || '')}
              </p>
              <button
                onClick={() => setShowEmail(!showEmail)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 transition-colors"
                title={showEmail ? 'Hide email' : 'Show email'}
              >
                {showEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Member Since</span>
            </div>
            <p className="text-white font-medium">
              {me?.created_at 
                ? new Date(me.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'Not available'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Billing & Subscription Section */}
      <motion.div 
        className="relative bg-white/5 border border-white/10 rounded-xl p-5 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-white font-bold text-sm flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-green-400" />
          Billing & Subscription
        </h2>

        <div className="space-y-4">
          {/* Current Plan */}
          {isPlatinum ? (
            <div className="p-5 bg-purple-500/10 border-purple-400/20 rounded-lg border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border-amber-400/20 border flex items-center justify-center">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-white font-bold">Platinum Plan</div>
                    <div className="text-white/50 text-sm">Premium features unlocked</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-xl">$25</div>
                  <div className="text-white/50 text-sm">per month</div>
                </div>
              </div>
              
              {me?.cancel_at_period_end ? (
                <div className="flex items-center gap-2 text-orange-400 text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Subscription Ending{me?.subscription_end_date ? ` · Access until ${new Date(me.subscription_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Active Subscription{me?.subscription_end_date ? ` · Next payment ${new Date(me.subscription_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={onNavigateToChangePlan}
                  className="flex-1 px-4 py-2.5 bg-white/5 border-white/10 text-white hover:bg-white/10 border rounded-lg transition-colors text-sm"
                >
                  {me?.cancel_at_period_end ? 'Resubscribe' : 'Change Plan'}
                </button>
              </div>
            </div>
          ) : isGold ? (
            <div className="p-5 bg-yellow-500/10 border-yellow-400/20 rounded-lg border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border-yellow-400/20 border flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-white font-bold">Gold Plan</div>
                    <div className="text-white/50 text-sm">Enhanced features</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-xl">$10</div>
                  <div className="text-white/50 text-sm">per month</div>
                </div>
              </div>
              
              {me?.cancel_at_period_end ? (
                <div className="flex items-center gap-2 text-orange-400 text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Subscription Ending{me?.subscription_end_date ? ` · Access until ${new Date(me.subscription_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Active Subscription{me?.subscription_end_date ? ` · Next payment ${new Date(me.subscription_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={onNavigateToChangePlan}
                  className="flex-1 px-4 py-2.5 bg-white/5 border-white/10 text-white hover:bg-white/10 border rounded-lg transition-colors text-sm"
                >
                  {me?.cancel_at_period_end ? 'Resubscribe' : 'Change Plan'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-white/5 border-white/10 rounded-lg border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 border-white/10 border flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-white font-bold">Free Plan</div>
                    <div className="text-white/50 text-sm">Limited access</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-xl">Free</div>
                  <div className="text-white/50 text-sm">Limited</div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/50 text-sm mb-4">
                  Upgrade to unlock unlimited odds data, arbitrage detection, and more!
                </p>
                <button 
                  onClick={onNavigateToChangePlan}
                  className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
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
              className="w-full flex items-center justify-between p-3.5 bg-white/5 border-white/10 hover:bg-white/10 rounded-lg border transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-white text-sm">Payment Method</div>
                  <div className="text-white/40 text-xs">
                    {portalLoading ? 'Loading...' : 'Manage your payment method'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>
          )}

          {/* Billing History - Only for paid plans */}
          {(isPlatinum || isGold) && (
            <button 
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className="w-full flex items-center justify-between p-3.5 bg-white/5 border-white/10 hover:bg-white/10 rounded-lg border transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-white text-sm">Billing History</div>
                  <div className="text-white/40 text-xs">
                    {portalLoading ? 'Loading...' : 'View and download past invoices'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div 
        className="relative bg-white/5 border border-white/10 rounded-xl p-5 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-white font-bold text-sm flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-blue-400" />
          Security & Privacy
        </h2>

        <div className="space-y-3">
          <button 
            onClick={handlePasswordReset}
            disabled={passwordResetLoading}
            className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {passwordResetLoading ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 text-blue-400" />
              )}
              <div>
                <div className="text-white text-sm">
                  {passwordResetLoading ? 'Sending...' : 'Change Password'}
                </div>
                <div className="text-white/40 text-xs">
                  {passwordResetLoading ? 'Please wait...' : 'Send password reset email'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </button>

          <button 
            onClick={onSignOut}
            className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-white text-sm">Sign Out</div>
                <div className="text-white/40 text-xs">Log out of your account</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </button>
        </div>
      </motion.div>

      {/* Support Section */}
      <motion.div 
        className="relative bg-white/5 border border-white/10 rounded-xl p-5 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-white font-bold text-sm flex items-center gap-2 mb-5">
          <Headphones className="w-4 h-4 text-amber-400" />
          Support
        </h2>

        <div className="space-y-3">
          <a 
            href="mailto:support@oddsightseer.com"
            className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-white text-sm">Contact Support</div>
                <div className="text-white/40 text-xs">support@oddsightseer.com</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </a>

          <a 
            href="/roadmap"
            className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-white text-sm">Feature Roadmap</div>
                <div className="text-white/40 text-xs">See what's coming next</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </a>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div 
        className="relative bg-red-500/5 border border-red-500/20 rounded-xl p-5 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-red-400 font-bold text-sm flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-red-400" />
          Danger Zone
        </h2>
        <div className="space-y-2">
          <button 
            onClick={onNavigateToCancelSubscription}
            className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
          >
            Cancel Subscription
          </button>
          <button 
            onClick={onNavigateToDeleteAccount}
            className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
          >
            Delete Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}