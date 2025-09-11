// src/components/DatePicker.js
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";
import "./DatePicker.css";

export default function DatePicker({ value, onChange, placeholder = "Select Date" }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside (matching SportMultiSelect pattern)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!boxRef.current) return;
      if (boxRef.current.contains(event.target)) return;
      
      // Don't close if clicking inside mobile filter sheet or any dropdown content
      if (event.target.closest('.mfs-content') || 
          event.target.closest('.mobile-filters-sheet') ||
          event.target.closest('.dp-menu') ||
          event.target.closest('.dp-mobile-sheet')) return;
      
      setOpen(false);
    };
    
    if (open) {
      // Add small delay to prevent immediate closing on open
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 50);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
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

  const handleDateSelect = (dateValue) => {
    if (isChanging) return; // Prevent multiple rapid changes
    
    setIsChanging(true);
    setOpen(false);
    onChange(dateValue);
    
    // Reset changing flag after a brief delay
    setTimeout(() => setIsChanging(false), 200);
  };

  const MobileSheet = () => (
    <div className="dp-mobile-overlay" onClick={() => setOpen(false)}>
      <div className="dp-mobile-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dp-mobile-header">
          <h3>Select Date</h3>
          <button className="dp-mobile-close" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="dp-mobile-content">
          {dateOptions.map((option) => (
            <div 
              key={option.value} 
              className={`dp-mobile-option ${value === option.value ? 'dp-selected' : ''}`}
              onClick={() => handleDateSelect(option.value)}
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

  return (
    <div className="dp-wrap">
      <button 
        className="dp-toggle" 
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Calendar size={16} />
        <span>{formatDisplayDate(value)}</span>
        <ChevronDown size={16} className={`dp-chevron ${open ? 'dp-open' : ''}`} />
      </button>

      {/* Desktop dropdown */}
      {open && !isMobile && (
        <div className="dp-menu">
          {dateOptions.map((option) => (
            <div 
              key={option.value}
              className={`dp-item ${value === option.value ? 'dp-selected' : ''}`}
              onClick={() => handleDateSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Mobile sheet */}
      {open && isMobile && typeof document !== "undefined" && 
        ReactDOM.createPortal(<MobileSheet />, document.body)
      }
    </div>
  );
}
