// Wrapper component to use Design.12 OddsPage in JavaScript app
import React from 'react';
import { OddsPage } from './OddsPage';

export function OddsPageWrapper(props) {
  return <OddsPage {...props} />;
}

export default OddsPageWrapper;
