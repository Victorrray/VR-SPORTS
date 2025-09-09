import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap, Clock } from 'lucide-react';

const QuotaBadge = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsage();
    // Refresh usage every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const { withApiBase } = require('../config/api');
      const response = await fetch(withApiBase('/api/usage/me'), {
        headers: {
          'x-user-id': 'demo-user' // Replace with actual user ID from auth
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }
      
      const data = await response.json();
      setUsage(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'var(--card-bg)',
        border: '1px solid var(--error)',
        borderRadius: '20px',
        fontSize: '12px',
        color: 'var(--error)'
      }}>
        <AlertCircle size={14} />
        Usage Error
      </div>
    );
  }

  // Platinum users don't need quota display
  if (usage?.plan === 'platinum') {
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

  // Free trial users
  const { calls_made = 0, limit = 1000, remaining = 1000 } = usage || {};
  const percentage = (calls_made / limit) * 100;
  
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
      {remaining} / {limit} calls left
    </div>
  );
};

export default QuotaBadge;
