import React, { useState, useRef, useEffect } from "react";
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
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  /* close dropdown on outside click */
  useEffect(() => {
    const h = e => !boxRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

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

      {open && (
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
    </div>
  );
}
