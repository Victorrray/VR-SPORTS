// src/components/DatePicker.js
import React, { useState, useEffect, useMemo } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import "./DatePicker.css";

export default function DatePicker({ value, onChange, placeholder = "Select Date" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState(() => {
    return value ? [value] : [];
  });

  // Generate date options with categories
  const dateOptions = useMemo(() => {
    const today = new Date();
    
    const quickOptions = [
      { key: "", title: "All Dates", category: "quick" },
      { key: "live", title: "Live Games", category: "quick" }
    ];
    
    const todayOptions = [
      { 
        key: today.toISOString().split('T')[0], 
        title: "Today", 
        category: "today" 
      }
    ];
    
    const upcomingOptions = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const key = date.toISOString().split('T')[0];
      const title = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
      upcomingOptions.push({ key, title, category: "upcoming" });
    }
    
    return { quickOptions, todayOptions, upcomingOptions };
  }, []);

  // Get display text for selected value
  const displayText = useMemo(() => {
    if (!value) return placeholder;
    if (value === "live") return "🔴 Live Games";
    if (value === "") return "All Dates";
    
    // Check all categories for the option
    const allOptions = [
      ...dateOptions.quickOptions,
      ...dateOptions.todayOptions,
      ...dateOptions.upcomingOptions
    ];
    const option = allOptions.find(opt => opt.key === value);
    if (option) return option.title;
    
    // Fallback for custom dates
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return placeholder;
    }
  }, [value, dateOptions, placeholder]);

  // Handle checkbox toggle
  const handleDateToggle = (dateKey) => {
    if (dateKey === "" || dateKey === "live") {
      // Quick options are single-select
      setSelectedDates([dateKey]);
    } else {
      // Other dates can be multi-select, but for now keep single-select behavior
      setSelectedDates([dateKey]);
    }
  };

  // Handle Done button
  const handleDone = () => {
    const selectedDate = selectedDates.length > 0 ? selectedDates[0] : "";
    onChange(selectedDate);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dp-wrap')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Update selectedDates when value changes
  useEffect(() => {
    setSelectedDates(value ? [value] : []);
  }, [value]);

  return (
    <div className="dp-wrap">
      <button 
        className="dp-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Calendar size={16} />
        <span className="dp-text">{displayText}</span>
        <ChevronDown size={16} className={`dp-chevron ${isOpen ? 'dp-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="dp-mobile-overlay">
          <div className="dp-mobile-sheet">
            <div className="dp-mobile-header">
              <h3>Select Dates</h3>
              <button 
                className="dp-mobile-close"
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="dp-mobile-content">
              {/* Quick Options */}
              <div className="dp-mobile-category-header">
                <span>Quick Options</span>
              </div>
              {dateOptions.quickOptions.map((option) => (
                <div
                  key={option.key}
                  className="dp-mobile-option"
                  onClick={() => handleDateToggle(option.key)}
                >
                  <div className={`dp-mobile-checkbox ${selectedDates.includes(option.key) ? 'dp-checked' : ''}`}>
                    {selectedDates.includes(option.key) && '✓'}
                  </div>
                  <span className="dp-mobile-label">
                    {option.key === "live" ? "🔴 Live Games" : option.title}
                  </span>
                </div>
              ))}

              {/* Today */}
              <div className="dp-mobile-category-header">
                <span>Today</span>
              </div>
              {dateOptions.todayOptions.map((option) => (
                <div
                  key={option.key}
                  className="dp-mobile-option"
                  onClick={() => handleDateToggle(option.key)}
                >
                  <div className={`dp-mobile-checkbox ${selectedDates.includes(option.key) ? 'dp-checked' : ''}`}>
                    {selectedDates.includes(option.key) && '✓'}
                  </div>
                  <span className="dp-mobile-label">{option.title}</span>
                </div>
              ))}

              {/* Upcoming Days */}
              <div className="dp-mobile-category-header">
                <span>Upcoming Days</span>
              </div>
              {dateOptions.upcomingOptions.map((option) => (
                <div
                  key={option.key}
                  className="dp-mobile-option"
                  onClick={() => handleDateToggle(option.key)}
                >
                  <div className={`dp-mobile-checkbox ${selectedDates.includes(option.key) ? 'dp-checked' : ''}`}>
                    {selectedDates.includes(option.key) && '✓'}
                  </div>
                  <span className="dp-mobile-label">{option.title}</span>
                </div>
              ))}
            </div>

            <div className="dp-mobile-footer">
              <button 
                className="dp-mobile-done"
                onClick={handleDone}
              >
                Done ({selectedDates.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
