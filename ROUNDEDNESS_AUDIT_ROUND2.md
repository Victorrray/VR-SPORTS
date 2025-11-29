# Design.12 Roundedness Audit - Round 2 (Missed Issues)

## Overview
Second comprehensive audit to catch roundedness inconsistencies missed in Round 1. Focus on authentication pages and other components.

---

## Issues Found

### 1. LoginPage.tsx - CRITICAL ISSUES

#### Issue 1.1: Tab Toggle Container (Line 119)
**Current**: `rounded-xl md:rounded-2xl`
**Should be**: `rounded-lg md:rounded-xl`
**Reason**: Container for toggle buttons should use rounded-lg, not rounded-xl

```tsx
// WRONG
<div className="flex gap-2 p-1 bg-slate-950/50 rounded-xl md:rounded-2xl border border-white/5">

// CORRECT
<div className="flex gap-2 p-1 bg-slate-950/50 rounded-lg md:rounded-xl border border-white/5">
```

#### Issue 1.2: Tab Toggle Buttons (Lines 122, 132)
**Current**: `rounded-lg md:rounded-xl`
**Should be**: `rounded-md md:rounded-lg`
**Reason**: Individual toggle buttons should use rounded-md, not rounded-lg

```tsx
// WRONG
<button className="... rounded-lg md:rounded-xl ...">
  Login
</button>

// CORRECT
<button className="... rounded-md md:rounded-lg ...">
  Login
</button>
```

#### Issue 1.3: Email Input (Line 152)
**Current**: `rounded-lg md:rounded-xl`
**Should be**: `rounded-md md:rounded-lg`
**Reason**: Input fields should use rounded-md, not rounded-lg

```tsx
// WRONG
<input className="... rounded-lg md:rounded-xl ...">

// CORRECT
<input className="... rounded-md md:rounded-lg ...">
```

#### Issue 1.4: Password Input (Line 166)
**Current**: `rounded-lg md:rounded-xl`
**Should be**: `rounded-md md:rounded-lg`
**Reason**: Input fields should use rounded-md, not rounded-lg

```tsx
// WRONG
<input className="... rounded-lg md:rounded-xl ...">

// CORRECT
<input className="... rounded-md md:rounded-lg ...">
```

#### Issue 1.5: Checkbox (Line 185)
**Current**: `rounded`
**Should be**: `rounded-sm`
**Reason**: Checkbox should use rounded-sm for consistency with form elements

```tsx
// WRONG
<input className="... rounded bg-slate-950/50 ...">

// CORRECT
<input className="... rounded-sm bg-slate-950/50 ...">
```

#### Issue 1.6: Submit Button (Line 205)
**Current**: `rounded-lg md:rounded-xl`
**Should be**: `rounded-md md:rounded-lg`
**Reason**: Buttons should use rounded-md, not rounded-lg

```tsx
// WRONG
<button className="... rounded-lg md:rounded-xl ...">

// CORRECT
<button className="... rounded-md md:rounded-lg ...">
```

#### Issue 1.7: Google Login Button (Line 222)
**Current**: `rounded-lg md:rounded-xl`
**Should be**: `rounded-md md:rounded-lg`
**Reason**: Buttons should use rounded-md, not rounded-lg

```tsx
// WRONG
<button className="... rounded-lg md:rounded-xl ...">

// CORRECT
<button className="... rounded-md md:rounded-lg ...">
```

#### Issue 1.8: Main Form Container (Line 103)
**Current**: `rounded-2xl md:rounded-3xl`
**Should be**: `rounded-xl md:rounded-2xl`
**Reason**: Large containers should use rounded-xl, not rounded-2xl

```tsx
// WRONG
<div className="... rounded-2xl md:rounded-3xl ...">

// CORRECT
<div className="... rounded-xl md:rounded-2xl ...">
```

---

### 2. SignUpPage.tsx - CRITICAL ISSUES

#### Issue 2.1: Main Form Container (Line 106)
**Current**: `rounded-3xl`
**Should be**: `rounded-xl`
**Reason**: Large containers should use rounded-xl, not rounded-3xl

```tsx
// WRONG
<div className="... rounded-3xl ...">

// CORRECT
<div className="... rounded-xl ...">
```

#### Issue 2.2: Name Input (Line 133)
**Current**: `rounded-xl`
**Should be**: `rounded-md`
**Reason**: Input fields should use rounded-md, not rounded-xl

```tsx
// WRONG
<input className="... rounded-xl ...">

// CORRECT
<input className="... rounded-md ...">
```

#### Issue 2.3: Email Input (Line 146)
**Current**: `rounded-xl`
**Should be**: `rounded-md`
**Reason**: Input fields should use rounded-md, not rounded-xl

```tsx
// WRONG
<input className="... rounded-xl ...">

// CORRECT
<input className="... rounded-md ...">
```

---

## Summary of Changes Needed

### LoginPage.tsx (8 changes)
- [ ] Line 103: `rounded-2xl md:rounded-3xl` → `rounded-xl md:rounded-2xl`
- [ ] Line 119: `rounded-xl md:rounded-2xl` → `rounded-lg md:rounded-xl`
- [ ] Line 122: `rounded-lg md:rounded-xl` → `rounded-md md:rounded-lg`
- [ ] Line 132: `rounded-lg md:rounded-xl` → `rounded-md md:rounded-lg`
- [ ] Line 152: `rounded-lg md:rounded-xl` → `rounded-md md:rounded-lg`
- [ ] Line 166: `rounded-lg md:rounded-xl` → `rounded-md md:rounded-lg`
- [ ] Line 185: `rounded` → `rounded-sm`
- [ ] Line 205: `rounded-lg md:rounded-xl` → `rounded-md md:rounded-lg`
- [ ] Line 222: `rounded-lg md:rounded-xl` → `rounded-md md:rounded-lg`

### SignUpPage.tsx (3 changes)
- [ ] Line 106: `rounded-3xl` → `rounded-xl`
- [ ] Line 133: `rounded-xl` → `rounded-md`
- [ ] Line 146: `rounded-xl` → `rounded-md`

---

## Design.12 Roundedness Hierarchy (Reference)

```
LARGEST (12px)
└─ rounded-xl
   ├─ Cards
   ├─ Panels
   ├─ Modals
   └─ Large containers

MEDIUM-LARGE (8px)
└─ rounded-lg
   ├─ Alerts
   ├─ Filter buttons
   ├─ Secondary containers
   └─ Toggle containers

MEDIUM (6px)
└─ rounded-md
   ├─ Buttons
   ├─ Input fields
   ├─ Badges
   └─ Toggle buttons

SMALL (2px)
└─ rounded-sm
   ├─ Checkboxes
   ├─ Radio buttons
   └─ Small form elements
```

---

## Root Cause Analysis

**Why These Were Missed:**
1. Authentication pages (LoginPage, SignUpPage) were not included in Round 1 audit
2. Responsive breakpoint classes (md:rounded-*) were not thoroughly checked
3. Form elements (inputs, checkboxes) need special attention for consistency

**Prevention Strategy:**
- Always audit ALL pages, not just main content pages
- Check responsive variants (sm:, md:, lg:, xl:)
- Create checklist for form elements specifically
- Review authentication/onboarding flows thoroughly

---

## Next Steps

1. Fix all identified issues in LoginPage.tsx
2. Fix all identified issues in SignUpPage.tsx
3. Audit remaining pages:
   - ForgotPasswordPage.tsx
   - CalculatorPage.tsx
   - SettingsPage.tsx
   - AccountPage.tsx
   - BankrollPage.tsx
   - PicksPage.tsx
4. Create comprehensive checklist for future audits
5. Commit all changes with descriptive message
