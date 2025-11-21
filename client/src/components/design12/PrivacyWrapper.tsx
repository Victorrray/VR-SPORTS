import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Privacy } from './Privacy';

export function PrivacyWrapper() {
  const navigate = useNavigate();

  return (
    <Privacy
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

export default PrivacyWrapper;
