import React, { useState, useRef, useEffect } from "react";
import "./SportMultiSelect.css";

/* helper — returns an array of keys for the whole list */
const allKeys = list => list.map(s => s.key);

export default function SportMultiSelect({ list, selected, onChange, disabled }) {
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

  /* “All Sports” handlers */
  const allSelected = selected.length === list.length;
  const toggleAll = () =>
    allSelected ? onChange([]) : onChange(allKeys(list));

  /* label when closed */
  const label =
    !selected.length      ? "Choose sports…" :
    selected.length === 1 ? selected[0]      :
    `${selected.length} selected`;

  return (
    <div className={`ms-wrap ${disabled ? "disabled" : ""}`} ref={boxRef}>
      <button
        className="ms-toggle"
        onClick={() => !disabled && setOpen(o => !o)}
      >
        {label} ▾
      </button>

      {open && (
        <ul className="ms-menu">
          {/* All-sports master switch */}
          <li style={{ borderBottom: "1px solid #444", paddingBottom: 4, marginBottom: 4 }}>
            <label>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
              />{" "}
              <strong>All Sports</strong>
            </label>
          </li>

          {/* individual leagues */}
          {list.map(s => (
            <li key={s.key}>
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
