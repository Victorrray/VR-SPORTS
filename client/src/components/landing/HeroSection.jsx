import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight, Play } from 'lucide-react';
import './HeroSection.css';

/**
 * Responsive Hero Section Component
 * Adapts layout based on screen size (mobile, tablet, desktop)
 * Features device mockup and dual CTAs
 */
export default function HeroSection() {
  const [width, setWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine breakpoint
  const isMobile = width < 768;
  const isTablet = width < 1280;

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleDemo = () => {
    // Scroll to features section or open demo modal
    const featuresSection = document.querySelector('.features-section-new');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section-responsive">
      {/* Background gradient */}
      <div className="hero-bg-gradient" />
      
      {/* Background image (optional - can be enabled later) */}
      {/* <img 
        src="/images/hero-bg.png" 
        alt="" 
        className="hero-bg-image"
        aria-hidden="true"
      /> */}

      <div className="hero-content-wrapper">
        {/* Text Content */}
        <div className="hero-text-section">
          <div className="hero-text-container">
            {/* Headline */}
            <h1 className="hero-headline">
              {isMobile ? (
                <>
                  Turn $100 Into
                  <span className="gradient-text"> $2,400+</span>
                </>
              ) : (
                <>
                  Turn $100 Into
                  <span className="gradient-text"> $2,400+ in 30 Days</span>
                </>
              )}
            </h1>

            {/* Subheadline */}
            <p className="hero-subheadline">
              Compare live odds across 15+ sportsbooks, find +EV bets with 4.2% average edge, and track your performance with advanced analytics.
            </p>

            {/* CTA Buttons */}
            <div className="hero-buttons">
              <button 
                onClick={handleGetStarted}
                className="btn-primary"
                aria-label="Get Started Today"
              >
                <TrendingUp size={isMobile ? 18 : 20} />
                <span>Get Started Today</span>
                <ArrowRight size={isMobile ? 18 : 20} />
              </button>

              <button 
                onClick={handleDemo}
                className="btn-secondary"
                aria-label="See Live Demo"
              >
                <Play size={isMobile ? 18 : 20} />
                <span>See Live Demo</span>
              </button>
            </div>

            {/* Trust badges */}
            <div className="hero-trust-badges">
              <div className="trust-badge">✓ No credit card required</div>
              <div className="trust-badge">✓ 7-day money back guarantee</div>
              <div className="trust-badge">✓ 4.9★ Rating</div>
            </div>
          </div>
        </div>

        {/* Device Mockup Section */}
        <div className="hero-device-section">
          <div className="device-mockup">
            {/* Device frame */}
            <div className="device-frame">
              {/* Screen content - can be replaced with actual screenshot */}
              <div className="device-screen">
                <div className="screen-content">
                  <div className="screen-header">
                    <div className="screen-notch" />
                  </div>
                  <div className="screen-body">
                    <div className="screen-placeholder">
                      <div className="placeholder-line" />
                      <div className="placeholder-line short" />
                      <div className="placeholder-line" />
                      <div className="placeholder-line short" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Device bezel */}
              <div className="device-bezel" />
            </div>

            {/* Optional: Background glow effect */}
            <div className="device-glow" />
          </div>
        </div>
      </div>
    </section>
  );
}
