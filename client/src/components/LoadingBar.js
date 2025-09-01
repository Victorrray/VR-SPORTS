import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './LoadingBar.css';

export default function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Start loading when location changes
    setIsLoading(true);
    setProgress(0);

    // Simulate progressive loading
    const intervals = [
      { delay: 0, progress: 10 },
      { delay: 100, progress: 30 },
      { delay: 200, progress: 60 },
      { delay: 400, progress: 85 },
      { delay: 600, progress: 100 }
    ];

    const timeouts = intervals.map(({ delay, progress: targetProgress }) =>
      setTimeout(() => setProgress(targetProgress), delay)
    );

    // Complete loading after a short delay
    const completeTimeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 200);
    }, 800);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="loading-bar-container">
      <div 
        className="loading-bar"
        style={{ 
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1
        }}
      />
      <div className="loading-glow" style={{ left: `${progress - 10}%` }} />
    </div>
  );
}
