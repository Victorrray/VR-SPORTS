import React from 'react';
import Pricing from '../components/billing/Pricing';
import MobileBottomBar from '../components/layout/MobileBottomBar';

const Subscribe = () => {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <Pricing />
      <MobileBottomBar active="profile" showFilter={false} />
    </div>
  );
};

export default Subscribe;
