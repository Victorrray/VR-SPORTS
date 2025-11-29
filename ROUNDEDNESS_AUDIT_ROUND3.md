# Design.12 Roundedness Audit - Round 3 (Master Design Comparison)

## Overview

Third comprehensive audit comparing current component roundedness against the master Design.12 UI component library specifications.

---

## Master Design.12 UI Component Standards

### From `/design12/ui/` Components

| Component | Master Roundedness | Current Usage | Status |
|-----------|-------------------|----------------|--------|
| **card.tsx** | `rounded-xl` | ✓ Correct | ✅ |
| **button.tsx** | `rounded-md` | ✓ Correct | ✅ |
| **input.tsx** | `rounded-md` | ✓ Correct | ✅ |
| **textarea.tsx** | `rounded-md` | ✓ Correct | ✅ |
| **badge.tsx** | `rounded-md` | ✓ Correct | ✅ |
| **skeleton.tsx** | `rounded-md` | ✓ Correct (after Round 1) | ✅ |
| **carousel.tsx** | `rounded-full` | ✓ Correct | ✅ |
| **select.tsx** | `rounded-md` (items), `rounded-sm` (sub-items) | Need to check | ⚠️ |
| **context-menu.tsx** | `rounded-sm` (items) | Need to check | ⚠️ |
| **dropdown-menu.tsx** | `rounded-sm` (items) | Need to check | ⚠️ |

---

## Issues Found in Round 3

### BetCard.tsx - CRITICAL ISSUES

Looking at your screenshot, the BetCard component needs adjustments:

#### Issue 1: Sport Badge (Line 117)
**Current**: `rounded-lg`
**Should be**: `rounded-md`
**Reason**: Badges should use `rounded-md` per Design.12 badge.tsx spec

```tsx
// WRONG
<span className="... rounded-lg ...">NBA</span>

// CORRECT
<span className="... rounded-md ...">NBA</span>
```

#### Issue 2: Pick Display Container (Line 152)
**Current**: `rounded-lg`
**Should be**: `rounded-xl`
**Reason**: Content containers should use `rounded-xl` per Design.12 card.tsx spec

```tsx
// WRONG
<div className="... rounded-lg ...">
  RECOMMENDED PICK
</div>

// CORRECT
<div className="... rounded-xl ...">
  RECOMMENDED PICK
</div>
```

#### Issue 3: Odds & Sportsbook Container (Line 168)
**Current**: `rounded-lg`
**Should be**: `rounded-xl`
**Reason**: Content containers should use `rounded-xl` per Design.12 card.tsx spec

```tsx
// WRONG
<div className="... rounded-lg ...">
  SPORTSBOOK / ODDS
</div>

// CORRECT
<div className="... rounded-xl ...">
  SPORTSBOOK / ODDS
</div>
```

#### Issue 4: Compare Odds Button (Line 201)
**Current**: `rounded-lg`
**Should be**: `rounded-md`
**Reason**: Buttons should use `rounded-md` per Design.12 button.tsx spec

```tsx
// WRONG
<button className="... rounded-lg ...">Compare Odds</button>

// CORRECT
<button className="... rounded-md ...">Compare Odds</button>
```

---

### OddsPage.tsx - Additional Issues

#### Issue 5: Filter Buttons (Line 514, 595, etc.)
**Current**: `rounded-lg`
**Should be**: `rounded-md`
**Reason**: Buttons should use `rounded-md` per Design.12 button.tsx spec

---

### PlayerPropsPage.tsx - Additional Issues

#### Issue 6: Filter Buttons (Similar to OddsPage)
**Current**: `rounded-lg`
**Should be**: `rounded-md`
**Reason**: Buttons should use `rounded-md` per Design.12 button.tsx spec

---

## Master Design.12 Roundedness Hierarchy (CORRECTED)

Based on actual `/design12/ui/` components:

```
LARGEST (12px)
└─ rounded-xl
   ├─ Cards (card.tsx)
   ├─ Large containers
   └─ Content sections

MEDIUM (6px)
└─ rounded-md
   ├─ Buttons (button.tsx)
   ├─ Inputs (input.tsx)
   ├─ Textareas (textarea.tsx)
   ├─ Badges (badge.tsx)
   ├─ Skeletons (skeleton.tsx)
   └─ Select items

SMALL (2px)
└─ rounded-sm
   ├─ Menu items (dropdown-menu.tsx, context-menu.tsx)
   ├─ Radio items
   └─ Checkbox items

FULL (50%)
└─ rounded-full
   ├─ Avatars
   ├─ Carousel buttons (carousel.tsx)
   └─ Status indicators
```

---

## Summary of Round 3 Issues

### BetCard.tsx (4 issues)
- [ ] Line 117: Sport badge `rounded-lg` → `rounded-md`
- [ ] Line 152: Pick display `rounded-lg` → `rounded-xl`
- [ ] Line 168: Odds container `rounded-lg` → `rounded-xl`
- [ ] Line 201: Compare button `rounded-lg` → `rounded-md`

### OddsPage.tsx (Multiple issues)
- [ ] Filter buttons: `rounded-lg` → `rounded-md`
- [ ] Other secondary buttons: `rounded-lg` → `rounded-md`

### PlayerPropsPage.tsx (Multiple issues)
- [ ] Filter buttons: `rounded-lg` → `rounded-md`
- [ ] Other secondary buttons: `rounded-lg` → `rounded-md`

### Dashboard.tsx (Potential issues)
- [ ] Need to audit for `rounded-lg` buttons that should be `rounded-md`

---

## Why These Were Missed

1. **Inconsistent Naming**: Design.12 uses `rounded-lg` for secondary containers in some places, but master UI components use `rounded-md` for buttons/badges
2. **Component vs Container Confusion**: Secondary containers (like pick display) should use `rounded-xl`, not `rounded-lg`
3. **Master Design Not Fully Reviewed**: Initial audits didn't compare against actual `/design12/ui/` component specs

---

## Next Steps

1. Fix BetCard.tsx (4 critical issues)
2. Audit and fix OddsPage.tsx filter buttons
3. Audit and fix PlayerPropsPage.tsx filter buttons
4. Audit Dashboard.tsx for similar issues
5. Verify all components match master Design.12 UI specs
6. Commit all changes with descriptive message

---

## Files to Modify

Priority order:
1. **BetCard.tsx** - 4 issues (CRITICAL - visible in screenshot)
2. **OddsPage.tsx** - Multiple button issues
3. **PlayerPropsPage.tsx** - Multiple button issues
4. **Dashboard.tsx** - Potential button issues

---

## Verification Checklist

After fixes:
- [ ] All badges use `rounded-md`
- [ ] All buttons use `rounded-md`
- [ ] All inputs use `rounded-md`
- [ ] All content containers use `rounded-xl`
- [ ] All secondary containers use `rounded-xl`
- [ ] All menu items use `rounded-sm`
- [ ] All circular elements use `rounded-full`
- [ ] Visual comparison with Design.12 Figma matches

