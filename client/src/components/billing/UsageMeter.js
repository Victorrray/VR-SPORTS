import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan';
import styles from "./Navbar.module.css";

const UsageMeter = () => {
  const { user } = useAuth();
  const { plan, planLoading, stale } = usePlan();

  if (!user) return null;
  if (planLoading && !plan) return <div className="usage-meter">Loading usage...</div>;
  if (!plan) return <div className="usage-meter error">Usage data unavailable</div>;

  const planId = (plan.plan || 'free').toLowerCase();
  const used = plan.used ?? plan.calls_made ?? 0;
  const quota = plan.quota ?? plan.limit ?? null;
  const isUnlimited = planId === 'platinum' || quota === null;
  const percentage = isUnlimited ? 100 : Math.min(Math.round((used / quota) * 100), 100);
  const isNearLimit = !isUnlimited && used >= quota * 0.8;
  const isOverLimit = !isUnlimited && used >= quota;
  const showUpgradeLink = planId === 'free';

  return (
    <div className={styles.usageMeter}>
      <div className={styles.usageHeader}>
        <span>
          API Usage: {used} / {isUnlimited ? '∞' : quota} requests
          {stale && (
            <span style={{ marginLeft: 6, fontSize: '0.75rem', opacity: 0.7 }}>(refreshing)</span>
          )}
        </span>
        {showUpgradeLink && (
          <span 
            className={styles.upgradeLink} 
            onClick={() => window.location.href = '/pricing'}
          >
            {isNearLimit ? 'Upgrade to Pro' : 'Upgrade'}
          </span>
        )}
      </div>
      <div className={styles.progressBar}>
        <div 
          className={`${styles.progressFill} ${isNearLimit ? styles.warning : ''} ${isOverLimit ? styles.danger : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default UsageMeter;
