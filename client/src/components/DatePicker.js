// src/components/DatePicker.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";
import "./DatePicker.css";

export default function DatePicker({ value, onChange, placeholder = "Select Date" }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const menuRef = useRef(null);
  const [portalStyle, setPortalStyle] = useState({});

  // Use a portal automatically on small screens
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 800;
  const shouldPortal = isMobile;

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      if (!open) return;
      if (boxRef.current?.contains(e.target)) return;
      if (shouldPortal && e.target.closest('.dp-mobile-overlay, .dp-mobile-sheet')) return;
      if (!shouldPortal && menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, [open, shouldPortal]);

  // Portal positioning (desktop only)
  useEffect(() => {
    if (!open || !boxRef.current || shouldPortal) return;

    const compute = () => {
      const r = boxRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const pad = 8;
      const minW = 200;
      
      const spaceBelow = vh - r.bottom - pad;
      const spaceAbove = r.top - pad;
      const align = spaceBelow >= 200 ? "down" : "up";

      const base = {
        position: "fixed",
        zIndex: 9999,
        minWidth: Math.max(minW, r.width),
        left: Math.max(pad, Math.min(r.left, vw - pad - minW)),
        borderRadius: 12,
        overflow: "auto",
      };

      if (align === "up") {
        base.bottom = Math.max(8, vh - r.top + 8);
        base.maxHeight = Math.max(160, spaceAbove);
      } else {
        base.top = Math.min(vh - pad, r.bottom + 8);
        base.maxHeight = Math.max(160, spaceBelow);
      }

      setPortalStyle(base);
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, shouldPortal]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return placeholder;
    if (dateStr === "live") return "🔴 Live Games";
    // Parse YYYY-MM-DD format in local timezone to avoid UTC offset issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const dateOptions = useMemo(() => {
    const options = [];
    // Get current date in user's local timezone
    const today = new Date();
    // Create a new date object using local date components to avoid timezone issues
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Add "All Dates" option
    options.push({ key: "", title: "All Dates" });
    
    // Add "Live Games" option
    options.push({ key: "live", title: "🔴 Live Games" });
    
    // Add today
    options.push({ 
      key: localToday.toISOString().split('T')[0], 
      title: "Today" 
    });
    
    // Add next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(localToday);
      date.setDate(localToday.getDate() + i);
      const key = date.toISOString().split('T')[0];
      const title = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
      options.push({ key, title });
    }
    
    return options;
  }, []); // Empty dependency array - only compute once

  const handleDateSelect = (dateValue) => {
    try {
      setOpen(false);
      onChange(dateValue);
    } catch (error) {
      console.error('Error updating date selection:', error);
    }
  };

  const displayText = useMemo(() => {
    if (!value) return placeholder;
    if (value === "live") return "🔴 Live Games";
    
    const option = dateOptions.find(opt => opt.key === value);
    if (option) return option.title;
    
    // Fallback formatting
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, [value, dateOptions, placeholder]);

  const MobileSheet = () => {
    return (
      <div className="dp-mobile-overlay" onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}>
        <div className="dp-mobile-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="dp-mobile-header">
            <h3>Select Date</h3>
            <button className="dp-mobile-close" onClick={() => setOpen(false)} type="button">
              <X size={20} />
            </button>
          </div>
          <div className="dp-mobile-content">
            {dateOptions.map((option) => (
              <div 
                key={option.key} 
                className={`dp-mobile-option ${value === option.key ? 'dp-selected' : ''}`}
                onClick={() => handleDateSelect(option.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDateSelect(option.key);
                  }
                }}
              >
                <span className={`dp-mobile-checkbox ${value === option.key ? 'dp-checked' : ''}`}>
                  {value === option.key ? "✓" : "○"}
                </span>
                <span className="dp-mobile-label">{option.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dp-wrap" ref={boxRef}>
      <button 
        className="dp-toggle" 
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        type="button"
      >
        <Calendar size={16} />
        <span>{displayText}</span>
        <ChevronDown size={16} className={`dp-chevron ${open ? 'dp-open' : ''}`} />
      </button>

      {/* Desktop dropdown */}
      {open && !shouldPortal && (
        <div 
          ref={menuRef}
          className="dp-menu" 
          style={portalStyle}
          role="listbox"
        >
          {dateOptions.map((option) => (
            <div 
              key={option.key}
              className={`dp-item ${value === option.key ? 'dp-selected' : ''}`}
              onClick={() => handleDateSelect(option.key)}
              role="option"
              aria-selected={value === option.key}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDateSelect(option.key);
                }
              }}
            >
              {option.title}
            </div>
          ))}
        </div>
      )}

      {/* Mobile sheet */}
      {open && shouldPortal && typeof document !== "undefined" && 
        ReactDOM.createPortal(<MobileSheet />, document.body)
      }
    </div>
  );
}
