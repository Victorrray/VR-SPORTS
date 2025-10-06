// src/components/betting/SportMultiSelect.js
import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import { Search, X, Star, TrendingUp, Gamepad2 } from "lucide-react";
import "./SportMultiSelect.css";

const allKeys = (list) => (list || []).filter(s => s.key !== "ALL" && !s.isHeader).map(s => s.key);

// Categorize sportsbooks by popularity and type
const SPORTSBOOK_CATEGORIES = {
  popular: {
    title: "Popular Sportsbooks",
    icon: Star,
    books: ["draftkings", "fanduel", "betmgm", "caesars", "pointsbet"]
  },
  dfs: {
    title: "DFS Apps",
    icon: Gamepad2,
    books: ["prizepicks", "underdog", "pick6", "sleeper"]
  },
  premium: {
    title: "Premium Options", 
    icon: TrendingUp,
    books: ["pinnacle", "circa", "superbook", "westgate", "rebet"]
  },
  regional: {
    title: "Regional & Others",
    icon: null,
    books: [] // Will be populated with remaining books
  }
};

// Categorize sports by type
const SPORT_CATEGORIES = {
  major: {
    title: "Major US Sports",
    sports: ["americanfootball_nfl", "americanfootball_ncaaf", "basketball_nba", "basketball_ncaab", "baseball_mlb", "icehockey_nhl"]
  },
  soccer: {
    title: "Soccer", 
    sports: ["soccer_epl", "soccer_uefa_champs_league", "soccer_fifa_world_cup", "soccer_conmebol_copa_america", "soccer_uefa_european_championship", "soccer_spain_la_liga", "soccer_germany_bundesliga", "soccer_italy_serie_a", "soccer_france_ligue_one"]
  },
  tennis: {
    title: "Tennis",
    sports: ["tennis_atp", "tennis_wta", "tennis_atp_french_open", "tennis_atp_us_open", "tennis_atp_wimbledon", "tennis_atp_australian_open", "tennis_wta_french_open", "tennis_wta_us_open", "tennis_wta_wimbledon", "tennis_wta_australian_open"]
  },
  combat: {
    title: "Combat Sports",
    sports: ["boxing_heavyweight", "mma_mixed_martial_arts", "boxing", "mma"]
  },
  golf: {
    title: "Golf",
    sports: ["golf_pga", "golf_masters", "golf_us_open", "golf_british_open", "golf_pga_championship", "golf_the_open_championship"]
  },
  motorsports: {
    title: "Motorsports & Racing",
    sports: ["motorsport_nascar", "motorsport_f1", "motorsport_indycar", "horse_racing"]
  },
  international_leagues: {
    title: "International Leagues",
    sports: ["australianrules_afl", "rugby_league_nrl", "cricket_icc_world_cup", "cricket_big_bash", "cricket_the_hundred", "basketball_euroleague", "basketball_nbl", "basketball_wnba", "americanfootball_cfl"]
  },
  other: {
    title: "Other Sports",
    sports: [] // Will be populated with remaining sports
  }
};

export default function SportMultiSelect({
  list,
  selected,
  onChange,
  disabled,
  placeholderText = "Choose sports…",
  allLabel = "All Sports",
  grid = false,
  columns = 2,
  leftAlign = false,
  usePortal = false,
  // 'down' | 'up' | 'auto'  (auto = pick best based on space; default is auto on mobile)
  portalAlign = "down",
  // New props for enhanced functionality
  enableSearch = false,
  enableCategories = false,
  isSportsbook = false,
  showDFSApps = true, // New prop to control DFS apps visibility
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const boxRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const [portalStyle, setPortalStyle] = useState({});
  const [actualAlign, setActualAlign] = useState(portalAlign);

  // Detect if we're inside the desktop filters sidebar
  const isInDesktopSidebar = typeof window !== "undefined" && 
    boxRef.current?.closest('.desktop-filters-sidebar');
  
  // Use a portal automatically on small screens, but NOT in desktop sidebar
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 800;
  const shouldPortal = isInDesktopSidebar ? false : (usePortal || isMobile);

  // Categorized and filtered list
  const { categorizedList, filteredList } = useMemo(() => {
    let filtered = list || [];
    
    // Filter out DFS apps if showDFSApps is false
    if (isSportsbook && !showDFSApps) {
      const dfsAppKeys = ['prizepicks', 'underdog', 'pick6', 'dabble_au', 'sleeper', 'prophetx'];
      filtered = filtered.filter(item => !dfsAppKeys.includes(item.key));
    }
    
    // Apply search filter
    if (enableSearch && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.key.toLowerCase().includes(term)
      );
    }

    // If categories are disabled, return simple filtered list
    if (!enableCategories) {
      return { categorizedList: null, filteredList: filtered };
    }

    // Categorize items
    const categories = isSportsbook ? SPORTSBOOK_CATEGORIES : SPORT_CATEGORIES;
    const categorized = {};
    const usedKeys = new Set();

    // Populate defined categories
    Object.entries(categories).forEach(([key, category]) => {
      if (key === 'regional' || key === 'other') return; // Handle these last
      
      // Skip DFS category if showDFSApps is false
      if (key === 'dfs' && !showDFSApps) return;
      
      const categoryItems = filtered.filter(item => {
        const itemKeys = isSportsbook ? category.books : category.sports;
        const matches = itemKeys.includes(item.key);
        if (matches) usedKeys.add(item.key);
        return matches;
      });
      
      if (categoryItems.length > 0) {
        categorized[key] = {
          ...category,
          items: categoryItems
        };
      }
    });

    // Add remaining items to 'other' category
    const remainingItems = filtered.filter(item => !usedKeys.has(item.key));
    if (remainingItems.length > 0) {
      const otherKey = isSportsbook ? 'regional' : 'other';
      categorized[otherKey] = {
        ...categories[otherKey],
        items: remainingItems
      };
    }

    return { categorizedList: categorized, filteredList: filtered };
  }, [list, searchTerm, enableSearch, enableCategories, isSportsbook, showDFSApps]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      const box = boxRef.current;
      const menu = menuRef.current;
      if (!box) return;
      
      // Don't close if clicking inside the toggle button or menu
      if (box.contains(e.target)) return;
      if (menu && menu.contains && menu.contains(e.target)) return;
      
      // Don't close if clicking inside mobile filter sheet or any dropdown content
      if (e.target.closest('.mfs-content') || 
          e.target.closest('.mobile-filters-sheet') ||
          e.target.closest('.ms-menu') ||
          e.target.closest('.ms-mobile-sheet')) return;
      
      setOpen(false);
      setSearchTerm(""); // Clear search when closing
    };
    
    if (open) {
      document.addEventListener("mousedown", h);
      return () => {
        document.removeEventListener("mousedown", h);
      };
    }
  }, [open]);

  // Focus search input when opening on desktop
  useEffect(() => {
    if (open && enableSearch && !isMobile && searchRef.current) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [open, enableSearch, isMobile]);

  // Position + size portal menu; auto-flip on mobile
  useEffect(() => {
    if (!open || !shouldPortal) return;

    const compute = () => {
      const el = boxRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 12;
      const minW = Math.max(r.width, 220);

      // available space
      const spaceAbove = r.top - pad;
      const spaceBelow = vh - r.bottom - pad - 80; // 80px guess for bottom actions

      // Decide direction
      let align = portalAlign;
      if (isMobile && (portalAlign === "down" || portalAlign === "auto")) {
        // prefer "up" on mobile if below space is tight
        align = spaceBelow < 240 && spaceAbove > spaceBelow ? "up" : "down";
      }
      if (portalAlign === "auto") {
        align = spaceAbove > spaceBelow ? "up" : "down";
      }
      setActualAlign(align);

      const base = {
        position: "fixed",
        zIndex: 2000,
        minWidth: minW,
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
  }, [open, shouldPortal, portalAlign, isMobile]);

  const toggleOne = (key) => {
    try {
      const currentSelected = selected || [];
      const newSelection = currentSelected.includes(key)
        ? currentSelected.filter((k) => k !== key)
        : [...currentSelected, key];
      onChange(newSelection);
      // Keep dropdown open for multiple selections
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  };

  const keysOnly = allKeys(filteredList);
  const currentSelected = selected || [];
  const allSelected = keysOnly && keysOnly.length > 0 && keysOnly.every((k) => currentSelected.includes(k));
  const toggleAll = () => {
    try {
      const newSelection = allSelected ? [] : keysOnly || [];
      onChange(newSelection);
    } catch (error) {
      console.error('Error updating all selection:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    searchRef.current?.focus();
  };

  const label = (() => {
    if (!selected || !selected.length) return placeholderText;
    if (allSelected) return allLabel;
    if (selected.length === 1) {
      const item = (list || []).find((s) => s.key === selected[0]);
      return item?.title || selected[0];
    }
    return `${selected.length} selected`;
  })();

  return (
    <div className={`ms-wrap ${disabled ? "disabled" : ""}`} ref={boxRef}>
      <button
        className="ms-toggle"
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {label} ▾
      </button>

      {/* Non-portal desktop dropdown */}
      {open && !shouldPortal && (
        <div 
          className="ms-menu" 
          role="listbox"
          style={isInDesktopSidebar ? {
            position: 'fixed',
            top: boxRef.current ? `${boxRef.current.getBoundingClientRect().bottom + 4}px` : 'auto',
            left: boxRef.current ? `${boxRef.current.getBoundingClientRect().left}px` : 'auto',
            width: '320px'
          } : {}}
        >
          {/* Search bar */}
          {enableSearch && (
            <div className="ms-search-container">
              <div className="ms-search-wrapper">
                <Search size={16} className="ms-search-icon" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="ms-search-input"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="ms-search-clear"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Select All */}
          <div className="ms-select-all">
            <label>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <strong>{allLabel}</strong>
            </label>
          </div>

          {/* Content */}
          <div className="ms-content">
            {enableCategories && categorizedList ? (
              // Categorized view
              Object.entries(categorizedList).map(([categoryKey, category]) => (
                <div key={categoryKey} className="ms-category">
                  <div className="ms-category-header">
                    {category.icon && <category.icon size={16} />}
                    <span>{category.title}</span>
                  </div>
                  <div className="ms-category-items">
                    {category.items.map((item) => (
                      <div
                        key={item.key}
                        className={`ms-item ${currentSelected.includes(item.key) ? "ms-selected" : ""}`}
                        onClick={() => toggleOne(item.key)}
                      >
                        <input
                          type="checkbox"
                          checked={currentSelected.includes(item.key)}
                          onChange={() => {}}
                          tabIndex={-1}
                        />
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Simple list view
              <div className="ms-simple-list">
                {filteredList.map((item) => (
                  item.isHeader ? (
                    <div key={item.key} className="ms-header-item">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontWeight: 600, 
                        color: 'var(--text-secondary)', 
                        fontSize: '12px' 
                      }}>
                        {item.icon && <item.icon size={14} />}
                        <span>{item.title}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={item.key}
                      className={`ms-item ${currentSelected.includes(item.key) ? "ms-selected" : ""}`}
                      onClick={() => toggleOne(item.key)}
                    >
                      <input
                        type="checkbox"
                        checked={currentSelected.includes(item.key)}
                        onChange={() => {}}
                        tabIndex={-1}
                      />
                      <span>{item.title}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portal dropdown (mobile / forced) */}
      {open &&
        shouldPortal &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div className="ms-mobile-overlay" onClick={() => setOpen(false)}>
            <div className="ms-mobile-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="ms-mobile-header">
                <h3>{allLabel}</h3>
                <button className="ms-mobile-close" onClick={() => setOpen(false)}>×</button>
              </div>
              
              {/* Mobile Search */}
              {enableSearch && (
                <div className="ms-mobile-search">
                  <div className="ms-search-wrapper">
                    <Search size={18} className="ms-search-icon" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="ms-search-input"
                    />
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="ms-search-clear"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="ms-mobile-content">
                {/* Select All */}
                <div className="ms-mobile-option ms-mobile-all" onClick={toggleAll}>
                  <span className={`ms-mobile-checkbox ${allSelected ? 'ms-checked' : ''}`}>
                    {allSelected ? "✓" : "○"}
                  </span>
                  <span className="ms-mobile-label">
                    <strong>{allLabel}</strong>
                  </span>
                </div>
                <div className="ms-mobile-divider"></div>

                {/* Items */}
                {enableCategories && categorizedList ? (
                  // Categorized mobile view
                  Object.entries(categorizedList).map(([categoryKey, category]) => (
                    <div key={categoryKey}>
                      <div className="ms-mobile-category-header">
                        {category.icon && <category.icon size={16} />}
                        <span>{category.title}</span>
                      </div>
                      {category.items.map((item) => (
                        <div key={item.key} className="ms-mobile-option" onClick={() => toggleOne(item.key)}>
                          <span className={`ms-mobile-checkbox ${currentSelected.includes(item.key) ? 'ms-checked' : ''}`}>
                            {currentSelected.includes(item.key) ? "✓" : "○"}
                          </span>
                          <span className="ms-mobile-label">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  // Simple mobile list
                  filteredList.map((item) => (
                    item.isHeader ? (
                      <div key={item.key} className="ms-mobile-header-item" style={{ 
                        padding: '12px 16px', 
                        fontWeight: 600, 
                        color: 'var(--text-secondary)', 
                        fontSize: '12px',
                        borderBottom: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {item.icon && <item.icon size={14} />}
                        <span>{item.title}</span>
                      </div>
                    ) : (
                      <div key={item.key} className="ms-mobile-option" onClick={() => toggleOne(item.key)}>
                        <span className={`ms-mobile-checkbox ${currentSelected.includes(item.key) ? 'ms-checked' : ''}`}>
                          {currentSelected.includes(item.key) ? "✓" : "○"}
                        </span>
                        <span className="ms-mobile-label">{item.title}</span>
                      </div>
                    )
                  ))
                )}
              </div>
              
              <div className="ms-mobile-footer">
                <button className="ms-mobile-done" onClick={() => setOpen(false)}>
                  Done ({currentSelected.length} selected)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
