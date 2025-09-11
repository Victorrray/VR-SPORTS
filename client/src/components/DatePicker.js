// src/components/DatePicker.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";
import "./DatePicker.css";

export default function DatePicker({ value, onChange, placeholder = "Select Date" }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const boxRef = useRef(null);
  const timeoutRef = useRef(null);
  const clickTimeoutRef = useRef(null);

  // Debounced mobile detection to prevent rapid state changes
  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth <= 600;
    if (mobile !== isMobile) {
      setIsMobile(mobile);
    }
  }, [isMobile]);

  useEffect(() => {
    checkMobile();
    const debouncedResize = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(checkMobile, 100);
    };
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [checkMobile]);

  // Improved click outside handler with better timing
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!open || !boxRef.current) return;
      
      // Check if click is inside our component
      if (boxRef.current.contains(event.target)) return;
      
      // Check for portal elements
      const portalElements = [
        '.dp-mobile-overlay',
        '.dp-mobile-sheet', 
        '.dp-menu',
        '.mfs-content',
        '.mobile-filters-sheet',
        '.ms-mobile-overlay',
        '.ms-mobile-sheet'
      ];
      
      for (const selector of portalElements) {
        if (event.target.closest(selector)) return;
      }
      
      // Close with slight delay to prevent race conditions
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 10);
    };
    
    if (open) {
      // Wait for render before adding listener
      const timer = setTimeout(() => {
        setIsRendered(true);
        document.addEventListener('mousedown', handleClickOutside, { passive: true });
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
      }, 100);
      
      return () => {
        clearTimeout(timer);
        setIsRendered(false);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      };
    }
  }, [open]);

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

  const dateOptions = React.useMemo(() => {
    const options = [];
    // Get current date in user's local timezone
    const today = new Date();
    // Create a new date object using local date components to avoid timezone issues
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Add "All Dates" option
    options.push({ value: "", label: "All Dates" });
    
    // Add "Live Games" option
    options.push({ value: "live", label: "🔴 Live Games" });
    
    // Add today
    options.push({ 
      value: localToday.toISOString().split('T')[0], 
      label: "Today" 
    });
    
    // Add next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(localToday);
      date.setDate(localToday.getDate() + i);
      const value = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
      options.push({ value, label });
    }
    
    return options;
  }, []); // Empty dependency array - only compute once

  const handleDateSelect = useCallback((dateValue) => {
    if (isChanging) return; // Prevent multiple rapid changes
    
    setIsChanging(true);
    
    // Close dropdown immediately for better UX
    setOpen(false);
    
    // Delay the onChange to prevent conflicts
    setTimeout(() => {
      onChange(dateValue);
      setIsChanging(false);
    }, 50);
  }, [isChanging, onChange]);

  const handleToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isChanging) return;
    
    setOpen(prev => !prev);
  }, [isChanging]);

  const MobileSheet = useCallback(() => {
    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        setOpen(false);
      }
    };

    const handleClose = () => {
      setOpen(false);
    };

    const handleOptionClick = (optionValue) => {
      handleDateSelect(optionValue);
    };

    return (
      <div className="dp-mobile-overlay" onClick={handleOverlayClick}>
        <div className="dp-mobile-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="dp-mobile-header">
            <h3>Select Date</h3>
            <button className="dp-mobile-close" onClick={handleClose} type="button">
              <X size={20} />
            </button>
          </div>
          <div className="dp-mobile-content">
            {dateOptions.map((option) => (
              <div 
                key={option.value} 
                className={`dp-mobile-option ${value === option.value ? 'dp-selected' : ''}`}
                onClick={() => handleOptionClick(option.value)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOptionClick(option.value);
                  }
                }}
              >
                <span className={`dp-mobile-checkbox ${value === option.value ? 'dp-checked' : ''}`}>
                  {value === option.value ? "✓" : "○"}
                </span>
                <span className="dp-mobile-label">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }, [dateOptions, value, handleDateSelect]);

  return (
    <div className="dp-wrap">
      <button 
        className="dp-toggle" 
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        type="button"
        disabled={isChanging}
      >
        <Calendar size={16} />
        <span>{formatDisplayDate(value)}</span>
        <ChevronDown size={16} className={`dp-chevron ${open ? 'dp-open' : ''}`} />
      </button>

      {/* Desktop dropdown */}
      {open && !isMobile && isRendered && (
        <div className="dp-menu" role="listbox">
          {dateOptions.map((option) => (
            <div 
              key={option.value}
              className={`dp-item ${value === option.value ? 'dp-selected' : ''}`}
              onClick={() => handleDateSelect(option.value)}
              role="option"
              aria-selected={value === option.value}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDateSelect(option.value);
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Mobile sheet */}
      {open && isMobile && isRendered && typeof document !== "undefined" && 
        ReactDOM.createPortal(<MobileSheet />, document.body)
      }
    </div>
  );
}
