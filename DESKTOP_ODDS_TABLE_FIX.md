# 🖥️ DESKTOP ODDS TABLE IMPROVEMENTS

## 🎯 ISSUES IDENTIFIED

Based on your screenshot:

### Layout Problems:
1. **TEAM column too narrow** - Text wrapping (Houston Texans, Baltimore Ravens)
2. **Poor spacing** - Columns cramped together
3. **Inconsistent widths** - Some columns have too much space, others too little
4. **Date/time display** - Takes up too much vertical space
5. **Book name** - "Underdog" could be more prominent

### Current Column Widths (Desktop):
- EV %: 9%
- MATCH: 28%
- TEAM: 16% ❌ TOO NARROW
- LINE: 10%
- BOOK: 13%
- ODDS: 12%
- DE-VIG: 12%

---

## ✅ RECOMMENDED IMPROVEMENTS

### Better Column Distribution:
- **EV %**: 8% (slightly smaller)
- **MATCH**: 20% (reduce - date/time can be smaller)
- **TEAM**: 25% ⭐ (increase significantly)
- **LINE**: 10% (keep)
- **BOOK**: 15% (increase slightly)
- **ODDS**: 12% (keep)
- **DE-VIG**: 10% (reduce)

### Visual Improvements:
1. **Larger team names** - Make them bold and prominent
2. **Compact date/time** - Single line format
3. **Better book display** - Logo + name
4. **More padding** - Breathing room between columns
5. **Hover effects** - Better row highlighting

---

## 🔧 CSS FIXES

### Option 1: Quick Fix (Adjust Widths)
```css
@media (min-width: 1100px) {
  .odds-table-card.revamp .odds-grid th:nth-child(1),
  .odds-table-card.revamp .odds-grid td:nth-child(1) {
    width: 8%;  /* EV % */
  }

  .odds-table-card.revamp .odds-grid th:nth-child(2),
  .odds-table-card.revamp .odds-grid td:nth-child(2) {
    width: 20%;  /* MATCH - reduced */
  }

  .odds-table-card.revamp .odds-grid th:nth-child(3),
  .odds-table-card.revamp .odds-grid td:nth-child(3) {
    width: 25%;  /* TEAM - increased ⭐ */
    text-align: left;
  }

  .odds-table-card.revamp .odds-grid th:nth-child(4),
  .odds-table-card.revamp .odds-grid td:nth-child(4) {
    width: 10%;  /* LINE */
  }

  .odds-table-card.revamp .odds-grid th:nth-child(5),
  .odds-table-card.revamp .odds-grid td:nth-child(5) {
    width: 15%;  /* BOOK - increased */
  }

  .odds-table-card.revamp .odds-grid th:nth-child(6),
  .odds-table-card.revamp .odds-grid td:nth-child(6) {
    width: 12%;  /* ODDS */
  }

  .odds-table-card.revamp .odds-grid th:nth-child(7),
  .odds-table-card.revamp .odds-grid td:nth-child(7) {
    width: 10%;  /* DE-VIG - reduced */
  }
}
```

### Option 2: Enhanced Layout
```css
@media (min-width: 1100px) {
  /* Better table spacing */
  .odds-table-card.revamp .odds-grid {
    font-size: 0.95em;
    table-layout: fixed;
    border-spacing: 0 8px;  /* Add vertical spacing between rows */
  }

  /* Better cell padding */
  .odds-table-card.revamp .odds-grid th,
  .odds-table-card.revamp .odds-grid td {
    padding: 12px 16px;  /* More padding */
    vertical-align: middle;
  }

  /* Team name styling */
  .odds-table-card.revamp .odds-grid td:nth-child(3) {
    font-weight: 600;  /* Bolder team names */
    font-size: 1.05em;  /* Slightly larger */
    line-height: 1.4;
  }

  /* Book name styling */
  .odds-table-card.revamp .odds-grid td:nth-child(5) {
    font-weight: 500;
  }

  /* Better hover effect */
  .odds-table-card.revamp .odds-grid tbody tr.odds-row:hover td {
    background: linear-gradient(90deg, rgba(72, 109, 255, 0.15), rgba(72, 109, 255, 0.08));
    transform: scale(1.01);
    transition: all 0.2s ease;
  }
}
```

---

## 🎨 VISUAL ENHANCEMENTS

### 1. Compact Date/Time Display
Instead of:
```
Sun,
Oct
5 at
10:01
AM
```

Show:
```
Sun, Oct 5 • 10:01 AM
```

### 2. Team Name Emphasis
```css
.team-name {
  font-weight: 600;
  font-size: 15px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 3. Book Display with Icon
```
[📊] Underdog
```

Or with actual logo if available.

---

## 📊 RESPONSIVE BREAKPOINTS

### Current: 1100px+
Good for most desktops

### Recommended: Add 1440px+ breakpoint
For larger screens, increase all widths proportionally:

```css
@media (min-width: 1440px) {
  .odds-table-card.revamp {
    max-width: 1400px;
    margin: 0 auto;
  }

  .odds-table-card.revamp .odds-grid {
    font-size: 1em;  /* Larger text */
  }

  .odds-table-card.revamp .odds-grid th,
  .odds-table-card.revamp .odds-grid td {
    padding: 14px 20px;  /* More padding */
  }
}
```

---

## 🚀 IMPLEMENTATION PRIORITY

### High Priority (Do First):
1. ✅ Increase TEAM column width to 25%
2. ✅ Reduce MATCH column to 20%
3. ✅ Increase BOOK column to 15%
4. ✅ Add more cell padding (12px 16px)

### Medium Priority:
5. ✅ Make team names bolder (font-weight: 600)
6. ✅ Compact date/time format
7. ✅ Better hover effects

### Low Priority:
8. Add book logos
9. Add 1440px+ breakpoint
10. Animated transitions

---

## 📝 FILES TO EDIT

1. **`OddsTable.css`** - Lines 1254-1318
   - Update column widths
   - Add better padding
   - Enhance hover effects

2. **`OddsTable.js`** - Desktop matchup rendering
   - Compact date/time format
   - Team name styling

---

**Want me to apply these fixes now?**
