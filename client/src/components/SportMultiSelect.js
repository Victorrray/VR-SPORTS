// src/components/SportMultiSelect.js
import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import "./SportMultiSelect.css";

const allKeys = (list) => list.filter(s => s.key !== "ALL").map(s => s.key);

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
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const menuRef = useRef(null);
  const [portalStyle, setPortalStyle] = useState({});
  const [actualAlign, setActualAlign] = useState(portalAlign);

  // Use a portal automatically on small screens
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 800;
  const shouldPortal = usePortal || isMobile;

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      const box = boxRef.current;
      const menu = menuRef.current;
      if (!box) return setOpen(false);
      if (box.contains(e.target)) return;
      if (menu && menu.contains && menu.contains(e.target)) return;
      setOpen(false);
    };
    
    // Prevent closing when clicking inside filter sheet
    const preventClose = (e) => {
      if (e.target.closest('.mfs-content')) {
        e.stopPropagation();
      }
    };
    
    document.addEventListener("mousedown", h);
    document.addEventListener("mousedown", preventClose, true);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("mousedown", preventClose, true);
    };
  }, []);

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
      const newSelection = selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key];
      onChange(newSelection);
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  };

  const keysOnly = allKeys(list);
  const allSelected = keysOnly.length > 0 && keysOnly.every((k) => selected.includes(k));
  const toggleAll = () => {
    try {
      const newSelection = allSelected ? [] : keysOnly;
      onChange(newSelection);
    } catch (error) {
      console.error('Error updating all selection:', error);
    }
  };

  const label = (() => {
    if (!selected.length) return placeholderText;
    if (allSelected) return allLabel;
    if (selected.length === 1) {
      const item = list.find((s) => s.key === selected[0]);
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
        <ul
          className="ms-menu"
          role="listbox"
          style={
            grid
              ? {
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  columnGap: "10px",
                  rowGap: "6px",
                  textAlign: leftAlign ? "left" : "center",
                }
              : leftAlign
              ? { textAlign: "left" }
              : undefined
          }
        >
          <li style={{ borderBottom: "1px solid #444", paddingBottom: 4, marginBottom: 4 }}>
            <label>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />{" "}
              <strong>{allLabel}</strong>
            </label>
          </li>
          {list.map((s) => (
            <li
              key={s.key}
              className={`ms-item ${selected.includes(s.key) ? "ms-selected" : ""}`}
              onClick={() => toggleOne(s.key)}
            >
              <input
                type="checkbox"
                checked={selected.includes(s.key)}
                onChange={() => {}}
                tabIndex={-1}
              />
              <span>{s.title}</span>
            </li>
          ))}
        </ul>
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
              <div className="ms-mobile-content">
                <div className="ms-mobile-option ms-mobile-all" onClick={toggleAll}>
                  <span className={`ms-mobile-checkbox ${allSelected ? 'ms-checked' : ''}`}>
                    {allSelected ? "✓" : "○"}
                  </span>
                  <span className="ms-mobile-label">
                    <strong>{allLabel}</strong>
                  </span>
                </div>
                <div className="ms-mobile-divider"></div>
                {list.map((s) => (
                  <div key={s.key} className="ms-mobile-option" onClick={() => toggleOne(s.key)}>
                    <span className={`ms-mobile-checkbox ${selected.includes(s.key) ? 'ms-checked' : ''}`}>
                      {selected.includes(s.key) ? "✓" : "○"}
                    </span>
                    <span className="ms-mobile-label">{s.title}</span>
                  </div>
                ))}
              </div>
              <div className="ms-mobile-footer">
                <button className="ms-mobile-done" onClick={() => setOpen(false)}>
                  Done ({selected.length} selected)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
