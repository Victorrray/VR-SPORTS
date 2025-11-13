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

    // Simulate progressive loading with shorter delays
    const intervals = [
      { delay: 0, progress: 20 },
      { delay: 50, progress: 50 },
      { delay: 100, progress: 80 },
      { delay: 150, progress: 100 }
    ];

    const timeouts = intervals.map(({ delay, progress: targetProgress }) =>
      setTimeout(() => setProgress(targetProgress), delay)
    );

    // Complete loading quickly
    const completeTimeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0); // Reset progress to prevent interference
      }, 100);
    }, 300);

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
