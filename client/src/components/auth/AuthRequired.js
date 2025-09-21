import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield } from 'lucide-react';

const AuthRequired = ({ message = "Authentication required to view odds data" }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      minHeight: '400px'
    }}>
      <div style={{
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '50%',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <Shield size={48} color="#8b5cf6" />
      </div>
      
      <h2 style={{
        color: 'var(--text-primary)',
        marginBottom: '12px',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        Authentication Required
      </h2>
      
      <p style={{
        color: 'var(--text-secondary)',
        marginBottom: '32px',
        maxWidth: '400px',
        lineHeight: '1.5'
      }}>
        {message}
      </p>
      
      <button
        onClick={() => navigate('/login')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }}
        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
      >
        <LogIn size={20} />
        Sign In to Continue
      </button>
    </div>
  );
};

export default AuthRequired;
