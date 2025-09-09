import React from 'react';
import { AlertCircle, Zap, X } from 'lucide-react';

const QuotaExceededModal = ({ isOpen, onClose, quotaError, onUpgrade }) => {
  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      const { withApiBase } = require('../config/api');
      const response = await fetch(withApiBase('/api/billing/create-checkout-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user' // Replace with actual user ID from auth
        }
      });
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'end of month';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        position: 'relative',
        border: '1px solid var(--border-color)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={24} color="white" />
          </div>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Quota Exceeded
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              margin: '4px 0 0 0',
              fontSize: '14px'
            }}>
              Monthly limit reached
            </p>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <p style={{
            color: 'var(--text-primary)',
            margin: '0 0 16px 0',
            fontSize: '16px'
          }}>
            {quotaError?.message || 'You have reached your monthly API limit of 1,000 calls.'}
          </p>
          
          {quotaError?.calls_made && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Calls Used
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  {quotaError.calls_made} / {quotaError.limit}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Resets On
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  {formatDate(quotaError.period_end)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Zap size={20} color="white" />
            <h3 style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              margin: 0
            }}>
              Upgrade to Platinum
            </h3>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 16px 0',
            fontSize: '14px'
          }}>
            Get unlimited API calls, advanced analytics, and priority support for just $25/month.
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            <li style={{ marginBottom: '6px' }}>✓ Unlimited API calls</li>
            <li style={{ marginBottom: '6px' }}>✓ Advanced analytics</li>
            <li>✓ Priority support</li>
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            style={{
              flex: 2,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Zap size={16} />
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotaExceededModal;
