import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountPage } from './AccountPage';

export function AccountPageWrapper() {
  const navigate = useNavigate();

  return (
    <AccountPage
      onNavigateToSettings={() => navigate('/account')}
      onNavigateToCancelSubscription={() => navigate('/account')}
      onNavigateToDeleteAccount={() => navigate('/account')}
      onNavigateToChangePlan={() => navigate('/account')}
    />
  );
}

export default AccountPageWrapper;
