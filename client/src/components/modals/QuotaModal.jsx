import React from 'react';
import { AlertCircle, Crown, X, TrendingUp } from 'lucide-react';

function QuotaModal({ open, detail, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/60 z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl p-6 max-w-md w-full border border-white/10 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">
            You've hit your free limit
          </h3>
          
          <p className="text-sm text-white/80 mb-4">
            You used <strong>{detail?.used || 0}</strong> of your <strong>{detail?.quota || 250}</strong> free API requests. 
            Upgrade to Platinum to keep pulling live odds and unlock unlimited access.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-300 text-sm font-semibold mb-2">
              <Crown size={16} />
              Platinum Benefits
            </div>
            <ul className="text-xs text-white/80 space-y-1">
              <li>• Unlimited API requests</li>
              <li>• Advanced +EV alerts</li>
              <li>• Player props analysis</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-200" 
            onClick={onClose}
          >
            Continue Browsing
          </button>
          <button 
            className="flex-1 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2" 
            onClick={() => (window.location.href = "/pricing")}
          >
            <TrendingUp size={16} />
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuotaModal;
