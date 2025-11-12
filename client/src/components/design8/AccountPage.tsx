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
} from "lucide-react";
import { useTheme, lightModeColors } from '../../contexts/ThemeContext';

interface AccountPageProps {
  onNavigateToSettings?: () => void;
}

export function AccountPage({
  onNavigateToSettings,
}: AccountPageProps) {
  const { colorMode } = useTheme();
  const isLight = colorMode === 'light';
  
  return (
    <div className="space-y-6">
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
        {onNavigateToSettings && (
          <button
            onClick={onNavigateToSettings}
            className={`flex items-center gap-2 px-4 py-2.5 ${isLight ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 text-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/30 text-purple-300'} backdrop-blur-xl border rounded-xl ${isLight ? 'hover:from-purple-200 hover:to-indigo-200' : 'hover:from-purple-500/30 hover:to-indigo-500/30'} transition-all font-bold text-sm whitespace-nowrap self-start sm:self-auto`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        )}
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
              NotVic
            </h3>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 ${isLight ? 'bg-amber-100 border-amber-200' : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30'} border rounded-lg backdrop-blur-xl`}>
                <div className="flex items-center gap-1.5">
                  <Crown className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span className={`${isLight ? 'text-amber-700' : 'text-amber-400'} font-bold text-sm`}>
                    Platinum Member
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
            <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
              notvic@example.com
            </p>
          </div>

          <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-xl border`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <span className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold uppercase tracking-wide`}>
                Member Since
              </span>
            </div>
            <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>January 2024</p>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2`}>
            <CreditCard className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
            Subscription
          </h2>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-sm">
            Upgrade Plan
          </button>
        </div>

        <div className={`p-6 ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent border-amber-400/30'} backdrop-blur-xl border rounded-xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${isLight ? 'bg-amber-100 border-amber-200' : 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-amber-400/30'} rounded-xl border`}>
                <Crown className={`w-6 h-6 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              </div>
              <div>
                <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                  Platinum Plan
                </h3>
                <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold`}>
                  Full access to all features
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`${isLight ? 'text-gray-900' : 'text-white'} text-2xl font-bold`}>
                $25
              </div>
              <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>
                /month
              </div>
            </div>
          </div>

          <div className={`pt-4 border-t ${isLight ? 'border-amber-200' : 'border-amber-400/20'}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={`${isLight ? 'text-gray-600' : 'text-white/60'} font-bold`}>
                Next billing date
              </span>
              <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                December 10, 2024
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button className={`px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}>
            Update Payment Method
          </button>
          <button className={`px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}>
            View Billing History
          </button>
        </div>
      </div>

      {/* Settings Section */}
      
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-[16px] p-6`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <Shield className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Security & Privacy
        </h2>

        <div className="space-y-4">
          <button className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left`}>
            <div className="flex items-center gap-3">
              <Lock className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>
                  Change Password
                </div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>
                  Update your account password
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
          <button className={`w-full px-4 py-3 ${isLight ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200' : 'bg-red-500/10 border-red-400/30 text-red-400 hover:bg-red-500/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}>
            Cancel Subscription
          </button>
          <button className={`w-full px-4 py-3 ${isLight ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200' : 'bg-red-500/10 border-red-400/30 text-red-400 hover:bg-red-500/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}