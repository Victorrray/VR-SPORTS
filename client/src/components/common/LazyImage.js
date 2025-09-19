import React, { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '../../hooks/useVirtualization';

export default function LazyImage({ 
  src, 
  alt, 
  placeholder = '/placeholder.png',
  className = '',
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();
  
  const { entries, observe } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  useEffect(() => {
    if (imgRef.current) {
      observe(imgRef.current);
    }
  }, [observe]);

  useEffect(() => {
    const entry = entries.find(entry => entry.target === imgRef.current);
    if (entry?.isIntersecting) {
      setIsInView(true);
    }
  }, [entries]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsLoaded(false);
  };

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`}>
      {isInView && (
        <img
          src={isLoaded ? src : placeholder}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          loading="lazy"
          {...props}
        />
      )}
      {!isInView && (
        <div className="lazy-placeholder" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
          Loading...
        </div>
      )}
    </div>
  );
}
