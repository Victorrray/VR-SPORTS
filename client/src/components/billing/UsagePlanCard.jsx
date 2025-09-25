import { useEffect } from "react";
import { Crown, Zap, TrendingUp, AlertCircle, Sparkles, BarChart3, Shield, Infinity, Clock } from "lucide-react";
import "./UsagePlanCard.css";
import { withApiBase } from "../../config/api";
import { secureFetch } from "../../utils/security";
import { useAuth } from "../../hooks/useAuth";
import { usePlan } from "../../hooks/usePlan";

export default function UsagePlanCard() {
  const { user } = useAuth();
  const { plan, planLoading, stale, refreshPlan } = usePlan();

  useEffect(() => {
    if (!plan && !planLoading) {
      refreshPlan({ force: true });
    }
  }, [plan, planLoading, refreshPlan]);

  const fallbackPlan = { plan: "free", used: 0, quota: 250, remaining: 250 };
  const planData = plan || fallbackPlan;
  const planId = (planData.plan || 'free').toLowerCase();
  const used = planData.used ?? planData.calls_made ?? 0;
  const quota = planData.quota ?? planData.limit ?? null;
  const remaining = planData.remaining ?? (quota != null ? Math.max(0, quota - used) : null);
  const percent = quota ? Math.min(100, Math.floor((used / quota) * 100)) : 100;
  const isNearLimit = quota != null && used >= quota * 0.8;
  const isOverLimit = quota != null && used >= quota;

  if (planLoading && !plan) {
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

  if (!plan && !planLoading) {
    return (
      <div className="rounded-2xl p-6 bg-neutral-900/60 border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertCircle size={16} />
          <span className="text-sm">Usage data unavailable</span>
        </div>
        <p className="text-xs text-white/60">We could not load your usage information. Please try again shortly.</p>
      </div>
    );
  }

  const getPlanBadge = () => {
    switch (planId) {
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
            GUEST
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
    <div className="usage-plan-card">
      {/* Header Section */}
      <div className="usage-header">
        <div className="header-content">
          <div className="header-title">
            <BarChart3 size={24} className="header-icon" />
            <div>
              <h3>Usage & Plan</h3>
              <p>Track your API usage and manage your subscription</p>
            </div>
          </div>
          {getPlanBadge()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <Zap size={16} className="stat-icon" />
            <span>Requests Used</span>
          </div>
          <div className="stat-value">{used.toLocaleString()}</div>
          <div className="stat-change">+0 today</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <Shield size={16} className="stat-icon" />
            <span>Plan Limit</span>
          </div>
          <div className="stat-value">
            {quota ? quota.toLocaleString() : (
              <span className="unlimited">
                <Infinity size={20} />
                Unlimited
              </span>
            )}
          </div>
          <div className="stat-change">{planId === 'platinum' || quota === null ? 'No limits' : `${remaining} remaining`}</div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Usage Progress</span>
          <span className="progress-percentage">{percent}%</span>
        </div>
        
        <div className="progress-container">
          <div className="progress-track">
            <div 
              className={`progress-fill ${getProgressColor()}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            >
              <div className="progress-glow"></div>
            </div>
          </div>
          
          {quota && (
            <div className="progress-markers">
              <span>0</span>
              <span className="marker-25">25%</span>
              <span className="marker-50">50%</span>
              <span className="marker-75">75%</span>
              <span>{quota.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {isOverLimit && (
        <div className="status-alert alert-error">
          <AlertCircle size={18} />
          <div>
            <div className="alert-title">Quota Exceeded</div>
            <div className="alert-message">Upgrade to Platinum for unlimited access</div>
          </div>
        </div>
      )}

      {isNearLimit && !isOverLimit && (
        <div className="status-alert alert-warning">
          <AlertCircle size={18} />
          <div>
            <div className="alert-title">Approaching Limit</div>
            <div className="alert-message">Consider upgrading to avoid interruptions</div>
          </div>
        </div>
      )}

      {stale && (
        <div className="status-alert alert-warning">
          <Clock size={18} />
          <div>
            <div className="alert-title">Refreshing usage</div>
            <div className="alert-message">Latest usage will appear once the sync completes.</div>
          </div>
        </div>
      )}

      {/* Plan Action Section */}
      {planId !== "platinum" ? (
        <div className="plan-action">
          <div className="upgrade-content">
            <div className="upgrade-header">
              <Sparkles size={20} />
              <div>
                <h4>Unlock Full Potential</h4>
                <p>Get unlimited API requests, priority support, and advanced features</p>
              </div>
            </div>
            
            <div className="upgrade-benefits">
              <div className="benefit">
                <Infinity size={14} />
                <span>Unlimited API calls</span>
              </div>
              <div className="benefit">
                <Zap size={14} />
                <span>Priority processing</span>
              </div>
              <div className="benefit">
                <Shield size={14} />
                <span>Advanced analytics</span>
              </div>
            </div>
            
            <button
              onClick={async () => {
                try {
                  const response = await secureFetch(withApiBase('/api/billing/create-checkout-session'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      supabaseUserId: user?.id
                    })
                  });
                  const data = await response.json();
                  if (data?.url) {
                    window.location.href = data.url;
                  } else {
                    console.error('No checkout URL returned');
                    window.location.href = "/pricing";
                  }
                } catch (error) {
                  console.error('Failed to create checkout:', error);
                  window.location.href = "/pricing";
                }
              }}
              className="upgrade-button"
            >
              <TrendingUp size={16} />
              <span>Upgrade to Platinum</span>
              <div className="button-glow"></div>
            </button>
          </div>
        </div>
      ) : (
        <div className="platinum-status">
          <div className="platinum-content">
            <Crown size={24} className="platinum-crown" />
            <div>
              <h4>Platinum Member</h4>
              <p>You have unlimited access to all features</p>
            </div>
          </div>
          <div className="platinum-perks">
            <div className="perk">
              <Infinity size={14} />
              <span>Unlimited requests</span>
            </div>
            <div className="perk">
              <Zap size={14} />
              <span>Priority support</span>
            </div>
            <div className="perk">
              <Shield size={14} />
              <span>Advanced features</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
