import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import "./SportMultiSelect.css";

/* helper — returns an array of keys for the whole list (exclude synthetic ALL) */
const allKeys = list => list.filter(s => s.key !== "ALL").map(s => s.key);

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
  portalAlign = 'down', // 'down' or 'up'
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const menuRef = useRef(null);
  const [portalStyle, setPortalStyle] = useState({});

  /* close dropdown on outside click */
  useEffect(() => {
    const h = e => {
      const box = boxRef.current;
      const menu = menuRef.current;
      if (!box) return setOpen(false);
      if (box.contains(e.target)) return; // click inside toggle
      if (menu && menu.contains && menu.contains(e.target)) return; // click inside portal menu
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* position portal menu on open/resize/scroll */
  useEffect(() => {
    if (!open || !usePortal) return;
    const compute = () => {
      const el = boxRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const base = {
        position: 'fixed',
        zIndex: 9999,
        minWidth: Math.max(r.width, 200),
        left: Math.max(8, Math.min(r.left, window.innerWidth - 8 - Math.max(r.width, 200))),
      };
      if (portalAlign === 'up') {
        base.bottom = Math.max(8, window.innerHeight - r.top + 8);
      } else {
        base.top = Math.min(window.innerHeight - 8, r.bottom + 8);
      }
      setPortalStyle(base);
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, usePortal, portalAlign]);

  /* toggle one league */
  const toggle = key =>
    selected.includes(key)
      ? onChange(selected.filter(k => k !== key))
      : onChange([...selected, key]);

  /* “All” handlers */
  const keysOnly = allKeys(list);
  const allSelected = keysOnly.length > 0 && keysOnly.every(k => selected.includes(k));
  const toggleAll = () => (allSelected ? onChange([]) : onChange(keysOnly));

  /* label when closed */
  const label = (() => {
    if (!selected.length) return placeholderText;
    if (allSelected) return allLabel;
    if (selected.length === 1) {
      const item = list.find(s => s.key === selected[0]);
      return item?.title || selected[0];
    }
    return `${selected.length} selected`;
  })();

  return (
    <div className={`ms-wrap ${disabled ? "disabled" : ""}`} ref={boxRef}>
      <button
        className="ms-toggle"
        onClick={() => !disabled && setOpen(o => !o)}
      >
        {label} ▾
      </button>

      {open && !usePortal && (
        <ul
          className="ms-menu"
          style={grid ? {
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            columnGap: '10px',
            rowGap: '6px',
            textAlign: leftAlign ? 'left' : 'center',
          } : (leftAlign ? { textAlign: 'left' } : undefined)}
        >
          {/* All master switch */}
          <li style={{ borderBottom: "1px solid #444", paddingBottom: 4, marginBottom: 4 }}>
            <label>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
              />{" "}
              <strong>{allLabel}</strong>
            </label>
          </li>

          {/* individual leagues */}
          {list.map(s => (
            <li key={s.key} style={leftAlign ? { textAlign: 'left' } : undefined}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(s.key)}
                  onChange={() => toggle(s.key)}
                />{" "}
                {s.title}
              </label>
            </li>
          ))}
        </ul>
      )}
      {open && usePortal && typeof document !== 'undefined' && ReactDOM.createPortal(
        <ul
          ref={menuRef}
          className="ms-menu"
          style={{
            position: 'fixed',
            ...portalStyle,
            width: 'calc(100vw - 48px)',
            maxWidth: 720,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <li style={{ borderBottom: "1px solid #444", paddingBottom: 4, marginBottom: 4 }}>
            <label>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />{" "}
              <strong>{allLabel}</strong>
            </label>
          </li>
          {list.map(s => (
            <li key={s.key} style={{ textAlign: leftAlign ? 'left' : 'center' }}>
              <label>
                <input type="checkbox" checked={selected.includes(s.key)} onChange={() => toggle(s.key)} />{" "}
                {s.title}
              </label>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
