import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { secureFetch } from '../../utils/security';
import styles from "./Navbar.module.css";

const UsageMeter = () => {
  const { user } = useAuth();
  
  const { data: usageData, isLoading, error } = useQuery(
    'usage',
    async () => {
      const response = await secureFetch('/api/me/usage');
      if (!response.ok) throw new Error('Failed to fetch usage data');
      return response.json();
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      enabled: !!user, // Only fetch if user is logged in
    }
  );

  if (!user) return null;
  if (isLoading) return <div className="usage-meter">Loading usage...</div>;
  if (error) return <div className="usage-meter error">Error loading usage data</div>;

  const { used = 0, quota = 1000, plan = 'free' } = usageData || {};
  const percentage = Math.min(Math.round((used / quota) * 100), 100);
  const isNearLimit = used >= quota * 0.8; // 80% or more usage

  return (
    <div className={styles.usageMeter}>
      <div className={styles.usageHeader}>
        <span>API Usage: {used} / {plan === 'platinum' ? '∞' : quota} requests</span>
        {plan === 'free' && (
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
          className={`${styles.progressFill} ${isNearLimit ? styles.warning : ''} ${used >= quota ? styles.danger : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default UsageMeter;
