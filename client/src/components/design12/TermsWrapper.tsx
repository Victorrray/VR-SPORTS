import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terms } from './Terms';

export function TermsWrapper() {
  const navigate = useNavigate();

  return (
    <Terms
      onBack={() => navigate('/')}
      onLoginClick={() => navigate('/login')}
      onDashboardClick={() => navigate('/dashboard')}
      onSignUpClick={() => navigate('/signup')}
      onRoadmapClick={() => navigate('/roadmap')}
      onPrivacyClick={() => navigate('/privacy')}
      onTermsClick={() => navigate('/terms')}
      onDisclaimerClick={() => navigate('/disclaimer')}
    />
  );
}

export default TermsWrapper;
