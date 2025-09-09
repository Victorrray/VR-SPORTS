import { useEffect, useState } from "react";
import { Crown, Zap, TrendingUp, AlertCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export default function UsagePlanCard() {
  const [data, setData] = useState({ plan: "free", used: 0, quota: 1000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/me/usage`, { 
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user' // Temporary fallback for development
          }
        });
        
        if (resp.ok) {
          const json = await resp.json();
          setData(json);
        } else {
          console.warn('Usage API failed:', resp.status, resp.statusText);
          // Set default data instead of error to prevent infinite loading
          setData({ plan: "free", used: 0, quota: 1000 });
        }
      } catch (err) {
        console.error('Usage fetch error:', err);
        // Set default data instead of error to prevent infinite loading
        setData({ plan: "free", used: 0, quota: 1000 });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 bg-neutral-900/60 border border-white/10">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-4"></div>
          <div className="h-8 bg-white/10 rounded mb-2"></div>
          <div className="h-2 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-6 bg-neutral-900/60 border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertCircle size={16} />
          <span className="text-sm">Usage data unavailable</span>
        </div>
        <p className="text-xs text-white/60">{error}</p>
      </div>
    );
  }

  const { plan, used, quota } = data;
  const max = quota ?? used; // platinum has no quota
  const percent = quota ? Math.min(100, Math.floor((used / quota) * 100)) : 100;
  const isNearLimit = quota && used >= quota * 0.8;
  const isOverLimit = quota && used >= quota;

  const getPlanBadge = () => {
    switch (plan) {
      case 'platinum':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30">
            <Crown size={12} className="inline mr-1" />
            PLATINUM
          </span>
        );
      case 'free_trial':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Zap size={12} className="inline mr-1" />
            FREE TRIAL
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20">
            FREE
          </span>
        );
    }
  };

  const getProgressColor = () => {
    if (isOverLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-gradient-to-r from-purple-500 to-indigo-500';
  };

  return (
    <div className="rounded-2xl p-6 bg-neutral-900/60 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Usage & Plan</h3>
        {getPlanBadge()}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/80">API Requests</span>
          <span className="text-sm font-mono text-white">
            {used.toLocaleString()}{quota ? ` / ${quota.toLocaleString()}` : " (unlimited)"}
          </span>
        </div>

        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-3 transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>

        {quota && (
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>0</span>
            <span>{quota.toLocaleString()}</span>
          </div>
        )}
      </div>

      {isOverLimit && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>Quota exceeded - upgrade to continue</span>
          </div>
        </div>
      )}

      {isNearLimit && !isOverLimit && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertCircle size={16} />
            <span>Approaching limit - consider upgrading</span>
          </div>
        </div>
      )}

      {plan !== "platinum" && (
        <button
          onClick={() => (window.location.href = "/pricing")}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          <TrendingUp size={16} />
          Upgrade to Platinum
        </button>
      )}

      {plan === "platinum" && (
        <div className="text-center p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <div className="flex items-center justify-center gap-2 text-yellow-300 text-sm font-semibold">
            <Crown size={16} />
            Unlimited API Access
          </div>
        </div>
      )}
    </div>
  );
}
