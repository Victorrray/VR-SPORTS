import { AlertCircle, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/SimpleAuth';
import { useMe } from '../../hooks/useMe';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface DeleteAccountPageProps {
  onBack: () => void;
  onDelete: () => void;
}

export function DeleteAccountPage({ onBack, onDelete }: DeleteAccountPageProps) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  const { user, profile } = useAuth();
  const { me } = useMe();
  const [isDeleting, setIsDeleting] = useState(false);

  // Format member since date
  const formatMemberSince = () => {
    if (!user?.created_at) return 'Not available';
    try {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'Not available';
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // First cancel any active subscription
      if (me?.has_billing) {
        try {
          await fetch('/api/billing/cancel-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
        } catch (e) {
          console.warn('Could not cancel subscription:', e);
        }
      }

      // Delete user data from Supabase users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user?.id);

      if (deleteError) {
        console.error('Error deleting user data:', deleteError);
      }

      // Sign out and delete auth user
      await supabase.auth.signOut();
      
      toast.success('Account deleted successfully', {
        description: 'Your account and data have been removed'
      });
      
      setTimeout(() => {
        onDelete();
      }, 1000);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account', {
        description: error.message || 'Please try again or contact support'
      });
      setIsDeleting(false);
    }
  };

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
            Delete Account
          </h1>
          <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm mt-1`}>
            Permanently remove your account and data
          </p>
        </div>
      </div>

      {/* Critical Warning Banner */}
      <div className={`p-4 ${isLight ? 'bg-red-50 border-red-300' : 'bg-red-500/10 border-red-400/30'} border rounded-2xl`}>
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className={`${isLight ? 'text-red-900' : 'text-red-400'} font-bold mb-1`}>
              This action cannot be undone
            </h3>
            <p className={`${isLight ? 'text-red-800' : 'text-red-400/80'} text-sm`}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
        </div>
      </div>

      {/* What Will Happen */}
      <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
        <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold mb-4`}>
          What will be deleted
        </h3>
        <ul className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} space-y-3`}>
          <li className="flex items-start gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'} flex-shrink-0 mt-2`} />
            <div>
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold block mb-0.5`}>
                Your profile and account information
              </span>
              <span className="text-sm">All personal data associated with your account</span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'} flex-shrink-0 mt-2`} />
            <div>
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold block mb-0.5`}>
                All your picks and bet history
              </span>
              <span className="text-sm">Complete history of saved picks and tracking data</span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'} flex-shrink-0 mt-2`} />
            <div>
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold block mb-0.5`}>
                Bankroll records and statistics
              </span>
              <span className="text-sm">All financial tracking and performance analytics</span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'} flex-shrink-0 mt-2`} />
            <div>
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold block mb-0.5`}>
                Premium subscription
              </span>
              <span className="text-sm">Active subscription will be cancelled immediately</span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400'} flex-shrink-0 mt-2`} />
            <div>
              <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold block mb-0.5`}>
                Preferences and settings
              </span>
              <span className="text-sm">All customizations and saved configurations</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Account Summary */}
      <div className={`p-6 ${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl`}>
        <h3 className={`${isLight ? lightModeColors.text : 'text-white'} font-bold mb-4`}>
          Account Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Username</span>
            <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>{profile?.username || user?.email?.split('@')[0] || 'User'}</span>
          </div>
          <div className="flex justify-between">
            <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Email</span>
            <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>{user?.email || 'Not available'}</span>
          </div>
          <div className="flex justify-between">
            <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Member since</span>
            <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>{formatMemberSince()}</span>
          </div>
          <div className="flex justify-between">
            <span className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} text-sm`}>Current plan</span>
            <span className={`${isLight ? lightModeColors.text : 'text-white'} font-bold`}>
              {me?.plan === 'platinum' || me?.unlimited ? 'Platinum' : me?.plan === 'gold' ? 'Gold' : 'Free'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse md:flex-row gap-3">
        <button
          onClick={onBack}
          disabled={isDeleting}
          className={`flex-1 px-6 py-3 ${isLight ? 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold disabled:opacity-50`}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`flex-1 px-6 py-3 ${isLight ? 'bg-red-600 border-red-700 text-white hover:bg-red-700' : 'bg-red-500 border-red-600 text-white hover:bg-red-600'} border rounded-xl transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50`}
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete My Account Permanently
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <p className={`${isLight ? lightModeColors.textMuted : 'text-white/40'} text-center text-xs`}>
        Changed your mind? Contact support at support@oddsightseer.com
      </p>
    </div>
  );
}
