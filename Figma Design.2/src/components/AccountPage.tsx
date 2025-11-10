import { User, Crown, Mail, Calendar, CreditCard, Settings, Shield, Bell, LogOut } from 'lucide-react';

export function AccountPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-white text-2xl md:text-3xl font-bold">Account Settings</h1>
        <p className="text-white/60 font-bold">Manage your profile and subscription</p>
      </div>

      {/* Profile Section */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            Profile Information
          </h2>
          <button className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold text-sm">
            Edit Profile
          </button>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-400/30 flex items-center justify-center backdrop-blur-xl shadow-lg shadow-purple-500/20">
            <User className="w-10 h-10 text-purple-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-white text-xl font-bold mb-1">NotVic</h3>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-lg backdrop-blur-xl">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-bold text-sm">Platinum Member</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <span className="text-white/50 text-sm font-bold uppercase tracking-wide">Email</span>
            </div>
            <p className="text-white font-bold">notvic@example.com</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-white/50 text-sm font-bold uppercase tracking-wide">Member Since</span>
            </div>
            <p className="text-white font-bold">January 2024</p>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Subscription
          </h2>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-400 hover:to-indigo-400 transition-all font-bold text-sm shadow-lg shadow-purple-500/30">
            Upgrade Plan
          </button>
        </div>

        <div className="p-6 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent backdrop-blur-xl border border-amber-400/30 rounded-xl shadow-lg shadow-amber-500/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-xl border border-amber-400/30 shadow-lg shadow-amber-500/20">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Platinum Plan</h3>
                <p className="text-white/60 text-sm font-bold">Full access to all features</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white text-2xl font-bold">$25</div>
              <div className="text-white/50 text-sm font-bold">/month</div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-400/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 font-bold">Next billing date</span>
              <span className="text-white font-bold">December 10, 2024</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold text-sm">
            Update Payment Method
          </button>
          <button className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-bold text-sm">
            View Billing History
          </button>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-white font-bold flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-purple-400" />
          Preferences
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Email Notifications</div>
                <div className="text-white/50 text-sm font-bold">Receive updates on new picks</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Two-Factor Authentication</div>
                <div className="text-white/50 text-sm font-bold">Add an extra layer of security</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-2xl border border-red-400/30 rounded-2xl p-6 shadow-xl shadow-red-500/10">
        <h2 className="text-red-400 font-bold mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <button className="w-full px-4 py-3 bg-red-500/10 backdrop-blur-xl border border-red-400/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm">
            Cancel Subscription
          </button>
          <button className="w-full px-4 py-3 bg-red-500/10 backdrop-blur-xl border border-red-400/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
