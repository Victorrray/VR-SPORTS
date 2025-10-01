import React from 'react';
import { AlertCircle, Zap, Clock } from 'lucide-react';
import { usePlan } from '../../hooks/SimplePlan';

const QuotaBadge = () => {
  const { plan, planLoading, stale } = usePlan();

  if (planLoading && !plan) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <Clock size={14} />
        Loading...
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <AlertCircle size={14} />
        Usage unavailable
      </div>
    );
  }

  const planId = (plan.plan || 'free').toLowerCase();

  if (planId === 'platinum') {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        borderRadius: '20px',
        fontSize: '12px',
        color: 'white',
        fontWeight: '600'
      }}>
        <Zap size={14} />
        Platinum
      </div>
    );
  }

  const used = plan.used ?? plan.calls_made ?? 0;
  const quota = plan.quota ?? plan.limit ?? 250;
  const remaining = plan.remaining ?? (quota != null ? Math.max(0, quota - used) : 0);
  const percentage = quota ? (used / quota) * 100 : 0;
  
  // Determine color based on usage
  let badgeColor = 'var(--success)';
  let textColor = 'white';
  
  if (percentage >= 90) {
    badgeColor = 'var(--error)';
  } else if (percentage >= 75) {
    badgeColor = 'var(--warning)';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: badgeColor,
      borderRadius: '20px',
      fontSize: '12px',
      color: textColor,
      fontWeight: '600'
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${100 - percentage}%`,
          background: 'white',
          transition: 'height 0.3s ease'
        }} />
      </div>
      {remaining} / {quota ?? '∞'} calls left
      {stale && (
        <span style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>(stale)</span>
      )}
    </div>
  );
};

export default QuotaBadge;
