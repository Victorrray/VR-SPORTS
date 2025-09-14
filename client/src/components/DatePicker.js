// src/components/DatePicker.js
import React, { useState, useCallback, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";
import "./DatePicker.css";

export default function DatePicker({ value, onChange, placeholder = "Select Date" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Determine if we should use mobile layout
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 800);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Stable toggle function to prevent rapid open/close
  const toggleDropdown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsOpen(prev => !prev);
  }, []);

  // Close dropdown function
  const closeDropdown = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(false);
  }, []);

  // Handle clicks outside the component
  const handleDocumentClick = useCallback((e) => {
    if (!isOpen) return;
    
    // Don't close if clicking inside the component
    if (containerRef.current?.contains(e.target)) return;
    if (dropdownRef.current?.contains(e.target)) return;
    
    // Don't close if clicking on mobile overlay elements
    if (e.target.closest('.dp-mobile-overlay, .dp-mobile-sheet')) return;
    
    closeDropdown();
  }, [isOpen, closeDropdown]);

  // Set up document click listener
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('touchstart', handleDocumentClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, handleDocumentClick]);

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

  // Add ref to prevent multiple selections
  const isSelectingRef = useRef(false);

  // Handle date selection with immediate close and debounce protection
  const handleDateSelect = useCallback((selectedKey) => {
    // Prevent multiple rapid calls
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;
    
    onChange(selectedKey);
    setIsOpen(false);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  }, [onChange]);

  // Display text for the selected date
  const displayText = useMemo(() => {
    if (!value) return placeholder;
    if (value === "live") return "🔴 Live Games";
    
    const option = dateOptions.find(opt => opt.key === value);
    if (option) return option.title;
    
    // Fallback formatting
    try {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return placeholder;
    }
  }, [value, dateOptions, placeholder]);

  // Handle option click with debounce protection
  const handleOptionClick = useCallback((optionKey) => {
    // Prevent multiple rapid calls
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;
    
    handleDateSelect(optionKey);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  }, [handleDateSelect]);

  // Mobile sheet component
  const MobileSheet = useCallback(() => {
    return (
      <div className="dp-mobile-overlay" onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}>
        <div className="dp-mobile-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="dp-mobile-header">
            <h3>Select Date</h3>
            <button 
              className="dp-mobile-close" 
              onClick={() => setIsOpen(false)} 
              type="button"
            >
              <X size={20} />
            </button>
          </div>
          <div className="dp-mobile-content">
            {dateOptions.map((option) => (
              <div 
                key={option.key} 
                className={`dp-mobile-option ${value === option.key ? 'dp-selected' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOptionClick(option.key);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOptionClick(option.key);
                  }
                }}
                style={{
                  pointerEvents: 'auto',
                  touchAction: 'manipulation'
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
  }, [dateOptions, value, handleOptionClick]);

  return (
    <div className="dp-wrap" ref={containerRef}>
      <button 
        className="dp-toggle" 
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        <Calendar size={16} />
        <span>{displayText}</span>
        <ChevronDown size={16} className={`dp-chevron ${isOpen ? 'dp-open' : ''}`} />
      </button>

      {/* Desktop dropdown */}
      {isOpen && !isMobile && (
        <div 
          ref={dropdownRef}
          className="dp-menu"
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
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
      {isOpen && isMobile && typeof document !== "undefined" && 
        ReactDOM.createPortal(<MobileSheet />, document.body)
      }
    </div>
  );
}
