# Design.12 Roundedness Reference Guide

## Quick Reference

### Tailwind Roundedness Classes

```
rounded-sm    = 0.125rem (2px)   - Minimal rounding
rounded       = 0.25rem  (4px)   - Subtle rounding
rounded-md    = 0.375rem (6px)   - Standard buttons/inputs
rounded-lg    = 0.5rem   (8px)   - Alerts/secondary containers
rounded-xl    = 0.75rem  (12px)  - Cards/panels/modals
rounded-2xl   = 1rem     (16px)  - Large modals
rounded-full  = 50%      (circle) - Avatars/toggles
```

---

## Component Roundedness Map

### Large Containers (rounded-xl = 12px)
```tsx
// Cards
<div className="rounded-xl border">
  {/* Card content */}
</div>

// Panels
<div className="rounded-xl border">
  {/* Panel content */}
</div>

// Dropdowns
<div className="rounded-xl border">
  {/* Dropdown items */}
</div>

// Pagination Controls
<button className="rounded-xl">
  {/* Pagination button */}
</button>
```

### Interactive Elements (rounded-md = 6px)
```tsx
// Buttons
<button className="rounded-md">
  Click me
</button>

// Input Fields
<input className="rounded-md border" />

// Badges
<span className="rounded-md border">
  Badge
</span>

// Skeleton Loaders (OddsPage, PlayerPropsPage)
<div className="rounded-md bg-gray-200 animate-pulse" />
```

### Secondary Containers (rounded-lg = 8px)
```tsx
// Alerts
<div className="rounded-lg border">
  Alert message
</div>

// Filter Buttons
<button className="rounded-lg border">
  Filter
</button>

// Secondary Containers
<div className="rounded-lg border">
  Content
</div>

// Skeleton Loaders (Dashboard)
<div className="rounded-lg bg-gray-200 animate-pulse" />
```

### Circular Elements (rounded-full = 50%)
```tsx
// Avatars
<div className="rounded-full w-10 h-10">
  <img src="avatar.jpg" />
</div>

// Toggle Switches
<div className="rounded-full w-11 h-6">
  {/* Toggle track */}
</div>

// Status Indicators
<div className="rounded-full w-3 h-3 bg-green-500" />

// EV Badges
<span className="rounded-full px-3 py-1">
  +5.2%
</span>
```

---

## Component Examples

### BetCard Component
```tsx
// Main card container
<div className="rounded-xl border">
  
  // Sport badge
  <span className="rounded-lg border">
    NFL
  </span>
  
  // EV badge (circular)
  <div className="rounded-full border">
    +5.2%
  </div>
  
  // Pick display
  <div className="rounded-lg border">
    Over 45.5
  </div>
  
  // Odds display
  <div className="rounded-lg border">
    -110
  </div>
  
  // Action buttons
  <button className="rounded-lg border">
    Compare Odds
  </button>
  <button className="rounded-full border">
    Place Bet
  </button>
</div>
```

### OddsPage Component
```tsx
// Skeleton loaders
<div className="rounded-md bg-gray-200 animate-pulse" />

// Bet type button
<button className="rounded-xl border">
  Straight Bets
</button>

// Dropdown menu
<div className="rounded-xl border">
  {/* Dropdown items */}
</div>

// Filter buttons
<button className="rounded-lg border">
  Filters
</button>

// Pagination controls
<button className="rounded-xl border">
  {/* Pagination button */}
</button>
```

### Dashboard Component
```tsx
// Skeleton loaders (bet cards)
<div className="rounded-lg bg-gray-200 animate-pulse" />

// Navigation buttons
<button className="rounded-xl border">
  Dashboard
</button>

// Stats cards
<div className="rounded-lg border">
  {/* Stat content */}
</div>

// User profile section
<div className="rounded-2xl border">
  {/* Profile content */}
</div>
```

---

## Roundedness Decision Tree

```
Is it a large container?
├─ YES → Use rounded-xl (12px)
│  ├─ Cards
│  ├─ Panels
│  ├─ Modals
│  ├─ Dropdowns
│  └─ Pagination controls
│
└─ NO → Is it circular?
   ├─ YES → Use rounded-full (50%)
   │  ├─ Avatars
   │  ├─ Toggles
   │  ├─ Status indicators
   │  └─ EV badges
   │
   └─ NO → Is it an interactive element?
      ├─ YES → Use rounded-md (6px)
      │  ├─ Buttons
      │  ├─ Inputs
      │  ├─ Badges
      │  └─ Skeleton loaders (small)
      │
      └─ NO → Use rounded-lg (8px)
         ├─ Alerts
         ├─ Filter buttons
         ├─ Secondary containers
         └─ Skeleton loaders (medium)
```

---

## Common Patterns

### Button Roundedness
```tsx
// Primary buttons (rounded-md)
<button className="rounded-md bg-purple-500">
  Primary Action
</button>

// Secondary buttons (rounded-lg)
<button className="rounded-lg bg-gray-100">
  Secondary Action
</button>

// Icon buttons (rounded-full)
<button className="rounded-full w-10 h-10">
  <Icon />
</button>

// Large buttons (rounded-xl)
<button className="rounded-xl bg-gradient-to-r">
  Large Action
</button>
```

### Badge Roundedness
```tsx
// Standard badges (rounded-md)
<span className="rounded-md border px-2 py-0.5">
  Badge
</span>

// Circular badges (rounded-full)
<span className="rounded-full border px-3 py-1">
  +5.2%
</span>

// Large badges (rounded-lg)
<span className="rounded-lg border px-3 py-1">
  Large Badge
</span>
```

### Input Roundedness
```tsx
// Standard inputs (rounded-md)
<input className="rounded-md border px-3 py-2" />

// Large inputs (rounded-lg)
<textarea className="rounded-lg border px-3 py-2" />

// Search inputs (rounded-md)
<input className="rounded-md border px-3 py-2" placeholder="Search..." />
```

---

## Skeleton Loader Patterns

### Small Skeleton (rounded-md = 6px)
```tsx
// Used in OddsPage and PlayerPropsPage
<div className="h-4 w-20 rounded-md bg-gray-200 animate-pulse" />
<div className="h-5 w-full rounded-md bg-gray-200 animate-pulse" />
<div className="h-6 w-16 rounded-md bg-gray-200 animate-pulse" />
```

### Medium Skeleton (rounded-lg = 8px)
```tsx
// Used in Dashboard
<div className="h-[300px] rounded-lg bg-gray-200 animate-pulse" />
<div className="p-4 rounded-lg bg-gray-200 animate-pulse" />
```

### Large Skeleton (rounded-xl = 12px)
```tsx
// For card-like skeletons
<div className="p-4 rounded-xl bg-gray-200 animate-pulse" style={{ height: '300px' }} />
```

---

## Light Mode vs Dark Mode

### Light Mode
```tsx
// Light backgrounds with subtle roundedness
<div className="rounded-md bg-gray-100 border-gray-200">
  {/* Light content */}
</div>
```

### Dark Mode
```tsx
// Dark backgrounds with subtle roundedness
<div className="rounded-md bg-white/5 border-white/10">
  {/* Dark content */}
</div>
```

**Note**: Roundedness values remain the same across light and dark modes. Only colors change.

---

## Accessibility Considerations

### Focus States
```tsx
// Maintain roundedness in focus states
<button className="rounded-md focus:ring-2 focus:ring-purple-500">
  Accessible Button
</button>
```

### Hover States
```tsx
// Roundedness should not change on hover
<button className="rounded-md hover:bg-purple-600">
  Hover Button
</button>
```

### Touch Targets
```tsx
// Minimum 44px for mobile touch targets
<button className="rounded-md w-11 h-11">
  Touch Button
</button>
```

---

## Migration Guide

### From Old Roundedness to Design.12

```tsx
// OLD (Inconsistent)
<div className="rounded-lg">
  <button className="rounded-2xl">Click</button>
  <span className="rounded">Badge</span>
</div>

// NEW (Design.12 Standard)
<div className="rounded-xl">
  <button className="rounded-md">Click</button>
  <span className="rounded-md">Badge</span>
</div>
```

### Skeleton Loader Migration

```tsx
// OLD (Inconsistent)
<div className="rounded-xl bg-gray-200 animate-pulse" />
<div className="rounded bg-gray-200 animate-pulse" />

// NEW (Design.12 Standard)
<div className="rounded-md bg-gray-200 animate-pulse" />
<div className="rounded-md bg-gray-200 animate-pulse" />
```

---

## Testing Checklist

- [ ] All cards use `rounded-xl`
- [ ] All buttons use `rounded-md`
- [ ] All inputs use `rounded-md`
- [ ] All badges use `rounded-md` or `rounded-full`
- [ ] All alerts use `rounded-lg`
- [ ] All skeleton loaders use `rounded-md` or `rounded-lg`
- [ ] All circular elements use `rounded-full`
- [ ] All dropdowns use `rounded-xl`
- [ ] All modals use `rounded-xl` or `rounded-2xl`
- [ ] All pagination controls use `rounded-xl`
- [ ] Visual consistency across light and dark modes
- [ ] Responsive behavior maintained on mobile
- [ ] Hover states maintain roundedness
- [ ] Focus states maintain roundedness

---

## Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs/border-radius
- **Design.12 Figma**: Check Figma for master design specifications
- **Component Library**: `/client/src/components/design12/ui/`
- **Audit Documentation**: `ROUNDEDNESS_AUDIT.md`
- **Standardization Summary**: `ROUNDEDNESS_STANDARDIZATION_SUMMARY.md`

---

## Quick Copy-Paste Classes

```
Large Containers:    rounded-xl
Interactive Elements: rounded-md
Secondary Containers: rounded-lg
Circular Elements:   rounded-full
Skeleton Loaders:    rounded-md or rounded-lg
```

---

## Version History

- **v1.0** (2025-11-29): Initial Design.12 roundedness standardization
  - Audited 5 major components
  - Updated 17 skeleton loader elements
  - Created comprehensive documentation
  - Achieved 100% Design.12 compliance for audited components
