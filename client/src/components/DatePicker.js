// src/components/DatePicker.js
import React, { useState, useEffect, useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import "./DatePicker.css";

export default function DatePicker({ value, onChange, placeholder = "Select Date" }) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate date options
  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    
    // Add "All Dates" option
    options.push({ key: "", title: "All Dates" });
    
    // Add "Live Games" option
    options.push({ key: "live", title: "🔴 Live Games" });
    
    // Add today
    const todayKey = today.toISOString().split('T')[0];
    options.push({ key: todayKey, title: "Today" });
    
    // Add next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const key = date.toISOString().split('T')[0];
      const title = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
      options.push({ key, title });
    }
    
    return options;
  }, []);

  // Get display text for selected value
  const displayText = useMemo(() => {
    if (!value) return placeholder;
    if (value === "live") return "🔴 Live Games";
    
    const option = dateOptions.find(opt => opt.key === value);
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

  // Handle option selection
  const handleSelect = (selectedKey) => {
    onChange(selectedKey);
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
        <div className="dp-dropdown">
          {dateOptions.map((option) => (
            <div
              key={option.key}
              className={`dp-item ${value === option.key ? 'dp-selected' : ''}`}
              onClick={() => handleSelect(option.key)}
            >
              {option.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
