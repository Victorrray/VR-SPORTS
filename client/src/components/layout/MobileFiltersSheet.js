import React, { useRef, useState, useEffect } from "react";
import { X, Filter } from "lucide-react";
import "./MobileFiltersSheet.css";

// Animation duration in ms - should match CSS animation duration
const ANIMATION_DURATION = 300;

export default function MobileFiltersSheet({ open, onClose, title = "Filters", children }) {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const [dy, setDy] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const threshold = 90; // pixels to trigger close

  // Handle open/close animations
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      // Start closing animation
      setIsClosing(true);
      // After animation completes, hide the component
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [open, isVisible]);
  
  // Handle escape key
  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible]);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setDy(0);
  };
  const onTouchMove = (e) => {
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDy(delta);
  };
  const onTouchEnd = () => {
    if (dy > threshold) handleClose();
    setDy(0);
  };

  const handleClose = () => {
    // Ensure any open dropdowns are closed before closing the sheet
    const openDropdowns = document.querySelectorAll('.ms-menu');
    openDropdowns.forEach(dropdown => {
      const toggle = dropdown.parentElement?.querySelector('.ms-toggle');
      if (toggle) {
        toggle.click();
      }
    });
    
    // Start closing animation
    setIsClosing(true);
    
    // Call onClose after animation completes
    setTimeout(() => {
      onClose();
    }, ANIMATION_DURATION);
  };

  // Don't render anything if not visible
  if (!isVisible && !open) return null;
  
  return (
    <div 
      className={`mfs-backdrop ${isClosing ? 'closing' : ''}`} 
      role="dialog" 
      aria-modal="true" 
      aria-label={title} 
      onClick={(e)=>{ if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        ref={sheetRef}
        className={`mfs-sheet ${isClosing ? 'closing' : ''}`}
        style={{ transform: dy ? `translateY(${dy}px)` : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="mfs-grabber" aria-hidden="true" />
        <div className="mfs-header">
          <div className="mfs-title-section">
            <Filter size={20} className="mfs-title-icon" />
            <span className="mfs-title">{title}</span>
          </div>
          <button className="mfs-close" onClick={handleClose} aria-label="Close filters">
            <X size={20} />
          </button>
        </div>
        <div className="mfs-content">
          {children}
        </div>
      </div>
    </div>
  );
}
