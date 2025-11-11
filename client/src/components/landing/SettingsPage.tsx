import { Settings, Bell, Shield, Globe, Moon, Sun, Smartphone, Mail, Lock, Eye, Database, Download, Trash2, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from 'next-themes';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-white text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-white/60 font-bold">Customize your OddSightSeer experience</p>
      </div>

      {/* Notifications Section */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-white font-bold flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-purple-400" />
          Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <Bell className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Push Notifications</div>
                <div className="text-white/50 text-sm font-bold">Get notified about new picks and updates</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <Mail className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Email Alerts</div>
                <div className="text-white/50 text-sm font-bold">Receive daily email summaries of top picks</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <Smartphone className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">SMS Alerts</div>
                <div className="text-white/50 text-sm font-bold">Text notifications for high-value bets</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-white font-bold flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-purple-400" />
          Security & Privacy
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <Lock className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Two-Factor Authentication</div>
                <div className="text-white/50 text-sm font-bold">Add an extra layer of security to your account</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>

          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Change Password</div>
                <div className="text-white/50 text-sm font-bold">Update your account password</div>
              </div>
            </div>
            <span className="text-white/40">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Privacy Settings</div>
                <div className="text-white/50 text-sm font-bold">Manage your data and privacy preferences</div>
              </div>
            </div>
            <span className="text-white/40">→</span>
          </button>
        </div>
      </div>

      {/* Display & Preferences */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-white font-bold flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-purple-400" />
          Display & Preferences
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <Moon className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Dark Mode</div>
                <div className="text-white/50 text-sm font-bold">Currently enabled</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={colorMode === 'dark'}
                onChange={(e) => setColorMode(e.target.checked ? 'dark' : 'light')}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>

          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Language & Region</div>
                <div className="text-white/50 text-sm font-bold">English (US)</div>
              </div>
            </div>
            <span className="text-white/40">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Default Odds Format</div>
                <div className="text-white/50 text-sm font-bold">American (-110, +150)</div>
              </div>
            </div>
            <span className="text-white/40">→</span>
          </button>
        </div>
      </div>

      {/* Data & Performance */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-white font-bold flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-purple-400" />
          Data & Performance
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <Database className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Auto-Refresh Odds</div>
                <div className="text-white/50 text-sm font-bold">Automatically update odds every 30 seconds</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>

          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Export Bet History</div>
                <div className="text-white/50 text-sm font-bold">Download your betting data as CSV</div>
              </div>
            </div>
            <span className="text-white/40">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Clear Cache</div>
                <div className="text-white/50 text-sm font-bold">Remove stored data to improve performance</div>
              </div>
            </div>
            <span className="text-white/40">→</span>
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-white font-bold flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-purple-400" />
          Advanced
        </h2>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">API Settings</div>
                <div className="text-white/50 text-sm font-bold">Configure external integrations</div>
              </div>
            </div>
            <span className="text-white/40">→</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-xl border border-white/10 hover:bg-white/10 transition-all text-left">
            <div className="flex items-center gap-3">
              <ToggleLeft className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-bold">Experimental Features</div>
                <div className="text-white/50 text-sm font-bold">Try new features before official release</div>
              </div>
            </div>
            <span className="text-white/40">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DollarSign({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
