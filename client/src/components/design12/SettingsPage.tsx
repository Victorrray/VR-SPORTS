import { Settings, Bell, Shield, Globe, Smartphone, Mail, Lock, Eye, Database, Download, Trash2, ToggleLeft, CreditCard, Crown, Calendar, DollarSign, Check, X, AlertTriangle, FileText } from 'lucide-react';
import { useState } from 'react';
import { useTheme, lightModeColors, OddsFormat } from '../../contexts/ThemeContext';
import { useBankroll } from '../../contexts/BankrollContext';
import { toast } from 'sonner';

interface SettingsPageProps {
  onNavigateToChangePlan?: () => void;
  onNavigateToCancelSubscription?: () => void;
}

export function SettingsPage({ onNavigateToChangePlan, onNavigateToCancelSubscription }: SettingsPageProps = {}) {
  const { colorMode, oddsFormat, setOddsFormat } = useTheme();
  const { currentBankroll, startingBankroll, setStartingBankroll, setCurrentBankroll, resetBankroll } = useBankroll();
  const isLight = colorMode === 'light';
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Modal states
  const [showBankrollModal, setShowBankrollModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [bankrollInput, setBankrollInput] = useState('');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className={`${isLight ? lightModeColors.text : 'text-white'} text-2xl md:text-3xl font-bold`}>Settings</h1>
        <p className={`${isLight ? lightModeColors.textMuted : 'text-white/60'} font-bold`}>Customize your OddSightSeer experience</p>
      </div>

      {/* Display & Preferences */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6 shadow-xl`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <Globe className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Display & Preferences
        </h2>

        <div className="space-y-4">
          <div className={`p-4 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'} backdrop-blur-xl rounded-xl border`}>
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Default Odds Format</div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {/* American */}
              <button
                onClick={() => setOddsFormat('american')}
                className={`p-3 rounded-xl border transition-all ${
                  oddsFormat === 'american'
                    ? isLight
                      ? 'bg-purple-100 border-purple-400 text-purple-700'
                      : 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                    : isLight
                      ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {oddsFormat === 'american' && <Check className="w-3.5 h-3.5" />}
                  <span className="font-bold text-sm">American</span>
                </div>
                <div className={`text-xs ${oddsFormat === 'american' ? '' : isLight ? 'text-gray-500' : 'text-white/50'}`}>
                  -110, +150
                </div>
              </button>

              {/* Decimal */}
              <button
                onClick={() => setOddsFormat('decimal')}
                className={`p-3 rounded-xl border transition-all ${
                  oddsFormat === 'decimal'
                    ? isLight
                      ? 'bg-purple-100 border-purple-400 text-purple-700'
                      : 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                    : isLight
                      ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {oddsFormat === 'decimal' && <Check className="w-3.5 h-3.5" />}
                  <span className="font-bold text-sm">Decimal</span>
                </div>
                <div className={`text-xs ${oddsFormat === 'decimal' ? '' : isLight ? 'text-gray-500' : 'text-white/50'}`}>
                  1.91, 2.50
                </div>
              </button>

              {/* Fractional */}
              <button
                onClick={() => setOddsFormat('fractional')}
                className={`p-3 rounded-xl border transition-all ${
                  oddsFormat === 'fractional'
                    ? isLight
                      ? 'bg-purple-100 border-purple-400 text-purple-700'
                      : 'bg-purple-500/20 border-purple-400/50 text-purple-300'
                    : isLight
                      ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {oddsFormat === 'fractional' && <Check className="w-3.5 h-3.5" />}
                  <span className="font-bold text-sm">Fractional</span>
                </div>
                <div className={`text-xs ${oddsFormat === 'fractional' ? '' : isLight ? 'text-gray-500' : 'text-white/50'}`}>
                  10/11, 3/2
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bankroll Settings - Hidden for now */}
      {/* Security Section */}

      {/* Data & Performance */}

      {/* Advanced Settings */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6 shadow-xl`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <Settings className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Advanced
        </h2>

        <div className="space-y-3">

          <button 
            onClick={() => {
              // Keys to PRESERVE (user settings)
              const preserveKeys = [
                'vr_bankroll_current',
                'vr_bankroll_starting', 
                'vr_bankroll_strategy',
                'vr_bankroll_kelly',
                'vr_bankroll_flat',
                'vr_bankroll_percentage',
                'vr_odds_format',
                'userSelectedSportsbooks',
                'userBankroll',
              ];
              
              // Save preserved values
              const preserved: Record<string, string | null> = {};
              preserveKeys.forEach(key => {
                preserved[key] = localStorage.getItem(key);
              });
              
              // Clear all localStorage
              localStorage.clear();
              
              // Restore preserved values
              Object.entries(preserved).forEach(([key, value]) => {
                if (value !== null) {
                  localStorage.setItem(key, value);
                }
              });
              
              // Clear sessionStorage (temporary data only)
              sessionStorage.clear();
              
              toast.success('Cache Cleared', {
                description: 'Temporary data cleared. Your settings have been preserved.'
              });
            }}
            className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all text-left`}
          >
            <div className="flex items-center gap-3">
              <Trash2 className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Clear Cache</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>Remove temporary data (preserves your settings)</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </button>
        </div>
      </div>

      {/* Legal Links */}
      <div className={`${isLight ? lightModeColors.statsCard : 'bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent border-white/10'} backdrop-blur-2xl border rounded-2xl p-6 shadow-xl`}>
        <h2 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold flex items-center gap-2 mb-6`}>
          <Shield className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          Legal
        </h2>

        <div className="space-y-3">
          <a 
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Privacy Policy</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>How we handle your data</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </a>

          <a 
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Terms of Service</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>Rules and guidelines</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </a>

          <a 
            href="/disclaimer"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-between p-4 ${isLight ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-gradient-to-br from-white/5 to-transparent border-white/10 hover:bg-white/10'} backdrop-blur-xl rounded-xl border transition-all`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <div>
                <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold`}>Disclaimer</div>
                <div className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-sm font-bold`}>Important legal notices</div>
              </div>
            </div>
            <span className={`${isLight ? 'text-gray-400' : 'text-white/40'}`}>→</span>
          </a>
        </div>
      </div>

      {/* Starting Bankroll Modal */}
      {showBankrollModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowBankrollModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md ${isLight ? 'bg-white' : 'bg-gray-900'} rounded-2xl shadow-2xl border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              {/* Header */}
              <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg`}>Set Starting Bankroll</h3>
                <button 
                  onClick={() => setShowBankrollModal(false)}
                  className={`p-2 ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'} rounded-xl transition-all`}
                >
                  <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-white/60'}`} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm`}>
                  Enter your starting bankroll amount. This will be used to track your profit/loss and calculate recommended bet sizes.
                </p>
                
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    value={bankrollInput}
                    onChange={(e) => setBankrollInput(e.target.value)}
                    placeholder="1000"
                    className={`w-full pl-12 pr-4 py-3 ${
                      isLight 
                        ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500' 
                        : 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-purple-400'
                    } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-bold text-lg`}
                    autoFocus
                  />
                </div>
                
                {startingBankroll > 0 && (
                  <p className={`${isLight ? 'text-gray-500' : 'text-white/50'} text-xs`}>
                    Current starting bankroll: ${startingBankroll.toLocaleString()}
                  </p>
                )}
              </div>
              
              {/* Footer */}
              <div className={`flex gap-3 p-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <button
                  onClick={() => setShowBankrollModal(false)}
                  className={`flex-1 py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/10 hover:bg-white/20 text-white'} rounded-xl font-bold transition-all`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const amount = parseFloat(bankrollInput);
                    if (!isNaN(amount) && amount > 0) {
                      setStartingBankroll(amount);
                      // If current bankroll is 0, also set it to starting amount
                      if (currentBankroll === 0) {
                        setCurrentBankroll(amount);
                      }
                      toast.success('Bankroll Updated', {
                        description: `Starting bankroll set to $${amount.toLocaleString()}`
                      });
                      setShowBankrollModal(false);
                    } else {
                      toast.error('Invalid Amount', {
                        description: 'Please enter a valid bankroll amount'
                      });
                    }
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white rounded-xl font-bold transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reset Bankroll Confirmation Modal */}
      {showResetModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowResetModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md ${isLight ? 'bg-white' : 'bg-gray-900'} rounded-2xl shadow-2xl border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              {/* Header */}
              <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-lg flex items-center gap-2`}>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Reset Bankroll
                </h3>
                <button 
                  onClick={() => setShowResetModal(false)}
                  className={`p-2 ${isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'} rounded-xl transition-all`}
                >
                  <X className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-white/60'}`} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <p className={`${isLight ? 'text-gray-600' : 'text-white/60'} text-sm`}>
                  Are you sure you want to reset all bankroll data? This action cannot be undone.
                </p>
                
                <div className={`p-4 ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'} border rounded-xl`}>
                  <p className={`${isLight ? 'text-red-700' : 'text-red-400'} text-sm font-bold`}>
                    This will reset:
                  </p>
                  <ul className={`${isLight ? 'text-red-600' : 'text-red-300'} text-sm mt-2 space-y-1`}>
                    <li>• Current bankroll: ${currentBankroll.toLocaleString()}</li>
                    <li>• Starting bankroll: ${startingBankroll.toLocaleString()}</li>
                    <li>• Betting strategy settings</li>
                    <li>• Kelly fraction and bet amounts</li>
                  </ul>
                </div>
              </div>
              
              {/* Footer */}
              <div className={`flex gap-3 p-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <button
                  onClick={() => setShowResetModal(false)}
                  className={`flex-1 py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/10 hover:bg-white/20 text-white'} rounded-xl font-bold transition-all`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetBankroll();
                    toast.success('Bankroll Reset', {
                      description: 'All bankroll data has been cleared'
                    });
                    setShowResetModal(false);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl font-bold transition-all"
                >
                  Reset All Data
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}