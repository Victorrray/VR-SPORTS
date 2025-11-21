import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Disclaimer } from './Disclaimer';

export function DisclaimerWrapper() {
  const navigate = useNavigate();

  return (
    <Disclaimer
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

export default DisclaimerWrapper;
