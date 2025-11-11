import { Settings, Bell, Shield, Globe, Moon, Sun, Smartphone, Mail, Lock, Eye, Database, Download, Trash2, ToggleLeft, CreditCard, Crown, Calendar, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from "next-themes";

const lightModeColors = {
  text: "text-foreground",
  textMuted: "text-muted-foreground",
  statsCard: "bg-card",
  statsIcon: "bg-primary/10",
  statsIconColor: "text-primary",
  textLight: "text-muted-foreground",
  background: "bg-background",
};

export function SettingsPage() {
  const { colorMode, setColorMode } = useTheme();
  const isLight = theme === 'light';
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-2xl md:text-3xl font-bold`}>Settings</h1>
        <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>Customize your OddSightSeer experience</p>
      </div>

      {/* Billing & Subscription Section */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6 shadow-xl`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <CreditCard className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Billing & Subscription
        </h2>

        <div className="space-y-4">
          {/* Current Plan */}
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
            
            <div className={`flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-white/60'} text-sm font-bold mb-4`}>
              <Calendar className="w-4 h-4" />
              <span>Next billing date: December 10, 2025</span>
            </div>

            <div className="flex gap-2">
              <button className={`flex-1 px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}>
                Change Plan
              </button>
              <button className={`flex-1 px-4 py-3 ${isLight ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'} backdrop-blur-xl border rounded-xl transition-all font-bold text-sm`}>
                Cancel Subscription
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <button className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left`}>
            <div className="flex items-center gap-3">
              <CreditCard className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Payment Method</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>Visa ending in 4242</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </button>

          {/* Billing History */}
          <button className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left`}>
            <div className="flex items-center gap-3">
              <Download className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Billing History</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>View and download past invoices</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </button>
        </div>
      </div>

      {/* Display & Preferences */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6 shadow-xl`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <Globe className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Display & Preferences
        </h2>

        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-xl border`}>
            <div className="flex items-center gap-3 flex-1">
              {colorMode === 'dark' ? (
                <Moon className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              ) : (
                <Sun className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              )}
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>{colorMode === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>Currently enabled</div>
              </div>
            </div>
            <label className="relative inline-flex items-cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={colorMode === 'dark'}
                onChange={(e) => setColorMode(e.target.checked ? 'dark' : 'light')}
              />
              <div className={`w-11 h-6 ${isLight ? 'bg-gray-200' : 'bg-white/10'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500`}></div>
            </label>
          </div>

          <button className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left`}>
            <div className="flex items-center gap-3">
              <Globe className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Language & Region</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>English (US)</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </button>

          <button className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left`}>
            <div className="flex items-center gap-3">
              <DollarSign className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Default Odds Format</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>American (-110, +150)</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </button>
        </div>
      </div>
      {/* Security Section */}

      {/* Data & Performance */}

      {/* Advanced Settings */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6 shadow-xl`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <Settings className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Advanced
        </h2>

        <div className="space-y-3">

          <button className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left`}>
            <div className="flex items-center gap-3">
              <Trash2 className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Clear Cache</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>Remove stored data to improve performance</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}