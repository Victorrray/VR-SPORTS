import React, { useRef, useState, useEffect } from "react";
import { X, Filter } from "lucide-react";
import "./MobileFiltersSheet.css";

export default function MobileFiltersSheet({ open, onClose, title = "Filters", children }) {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const [dy, setDy] = useState(0);
  const threshold = 90; // pixels to trigger close

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setDy(0);
  };
  const onTouchMove = (e) => {
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDy(delta);
  };
  const onTouchEnd = () => {
    if (dy > threshold) onClose?.();
    setDy(0);
  };

  if (!open) return null;
  return (
    <div className="mfs-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={(e)=>{ if (e.target === e.currentTarget) onClose?.(); }}>
      <div
        ref={sheetRef}
        className="mfs-sheet"
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
          <button className="mfs-close" onClick={onClose} aria-label="Close filters">
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
