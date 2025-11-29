# Design.12 Roundedness Audit & Standardization Guide

## DESIGN.12 STANDARD ROUNDEDNESS RULES

Based on analysis of `/client/src/components/design12/ui/` components:

### Primary Components
| Component | Roundedness | Tailwind Class | Pixels |
|-----------|------------|-----------------|--------|
| Card | Extra Large | `rounded-xl` | 12px |
| Button | Medium | `rounded-md` | 6px |
| Input | Medium | `rounded-md` | 6px |
| Badge | Medium | `rounded-md` | 6px |
| Alert | Large | `rounded-lg` | 8px |
| Circular Elements | Full | `rounded-full` | 50% |

### Secondary Components (Inferred from Design.12)
| Component | Roundedness | Tailwind Class | Pixels |
|-----------|------------|-----------------|--------|
| Dropdowns | Extra Large | `rounded-xl` | 12px |
| Modals | Extra Large | `rounded-xl` | 12px |
| Panels | Extra Large | `rounded-xl` | 12px |
| Filter Buttons | Large | `rounded-lg` | 8px |
| Toggle/Switch | Full | `rounded-full` | 50% |
| Pagination Buttons | Extra Large | `rounded-xl` | 12px |

---

## AUDIT FINDINGS

### OddsPage.tsx

#### ✅ CORRECT (Already matches Design.12)
- Line 320: Bet Type Button - `rounded-xl` ✓
- Line 334: Dropdown Menu - `rounded-xl` ✓
- Line 412: Refresh Button - `rounded-xl` ✓
- Line 427: Pagination Button (Previous) - `rounded-xl` ✓
- Line 436: Pagination Display - `rounded-xl` ✓
- Line 445: Pagination Button (Next) - `rounded-xl` ✓
- Line 462: Pagination Button (Previous) - `rounded-xl` ✓
- Line 471: Pagination Display - `rounded-xl` ✓
- Line 480: Pagination Button (Next) - `rounded-xl` ✓
- Line 501: Side Panel - `rounded-t-3xl` (mobile) ✓
- Line 514: Close Button - `rounded-lg` ✓
- Line 530: Apply Button - `rounded-lg` ✓
- Line 549: Reset Button - `rounded-lg` ✓
- Line 568: Auto Refresh Toggle - `rounded-lg` ✓
- Line 595: Date Filter Button - `rounded-lg` ✓

#### ⚠️ NEEDS REVIEW (Skeleton Loaders)
- Line 260: Skeleton - `rounded-xl` (for small skeleton elements, should be `rounded-md` or `rounded-lg`)
- Line 263: Skeleton - `rounded` (should be `rounded-md` or `rounded-lg`)
- Line 264: Skeleton - `rounded` (should be `rounded-md` or `rounded-lg`)
- Line 267: Skeleton - `rounded` (should be `rounded-md` or `rounded-lg`)
- Line 270: Skeleton - `rounded` (should be `rounded-md` or `rounded-lg`)
- Line 273: Skeleton - `rounded` (should be `rounded-md` or `rounded-lg`)
- Line 277: Skeleton - `rounded` (should be `rounded-md` or `rounded-lg`)
- Line 278: Skeleton - `rounded` (should be `rounded-md` or `rounded-lg`)

#### ⚠️ NEEDS REVIEW (Empty State)
- Line 286: Empty State Icon - `rounded-full` ✓ (correct for circular)
- Line 302: Clear Filters Button - `rounded-xl` ✓ (correct)

---

### STANDARDIZATION RULES FOR SKELETON LOADERS

**Decision**: Skeleton loaders should use `rounded-md` for consistency with input/button elements they're mimicking.

**Rationale**: 
- Skeletons are placeholders for actual content
- They should match the roundedness of the content they'll be replaced with
- Most content uses `rounded-md` or `rounded-lg`
- Using `rounded-xl` makes skeletons appear too rounded compared to actual content

**Update**: Change all skeleton `rounded` and `rounded-xl` to `rounded-md`

---

## COMPONENTS TO AUDIT

### Priority 1 (High Impact - Main Pages)
- [ ] OddsPage.tsx - Skeleton loaders (Lines 260-278)
- [ ] PlayerPropsPage.tsx - Full audit needed
- [ ] Dashboard.tsx - Full audit needed
- [ ] BetCard.tsx - Full audit needed
- [ ] BetSlip.tsx - Full audit needed

### Priority 2 (Medium Impact - Secondary Pages)
- [ ] CalculatorPage.tsx
- [ ] SettingsPage.tsx
- [ ] AccountPage.tsx
- [ ] BankrollPage.tsx

### Priority 3 (Low Impact - Landing Pages)
- [ ] LoginPage.tsx
- [ ] SignUpPage.tsx
- [ ] Hero.tsx
- [ ] Features.tsx

---

## IMPLEMENTATION CHECKLIST

### OddsPage.tsx Updates
- [ ] Line 260: `rounded-xl` → `rounded-md` (skeleton badge)
- [ ] Line 263: `rounded` → `rounded-md` (skeleton label)
- [ ] Line 264: `rounded` → `rounded-md` (skeleton content)
- [ ] Line 267: `rounded` → `rounded-md` (skeleton content)
- [ ] Line 270: `rounded` → `rounded-md` (skeleton content)
- [ ] Line 273: `rounded` → `rounded-md` (skeleton content)
- [ ] Line 277: `rounded` → `rounded-md` (skeleton mobile)
- [ ] Line 278: `rounded` → `rounded-md` (skeleton mobile)

### Testing After Updates
- [ ] Visual consistency check - all components have proper roundedness
- [ ] Light mode appearance
- [ ] Dark mode appearance
- [ ] Mobile responsiveness
- [ ] Hover states
- [ ] Focus states

---

## NOTES

1. **Tailwind Roundedness Values**:
   - `rounded-sm` = 0.125rem (2px)
   - `rounded` = 0.25rem (4px)
   - `rounded-md` = 0.375rem (6px)
   - `rounded-lg` = 0.5rem (8px)
   - `rounded-xl` = 0.75rem (12px)
   - `rounded-2xl` = 1rem (16px)
   - `rounded-full` = 50%

2. **Design.12 Philosophy**: 
   - Larger containers (cards, panels, modals) use `rounded-xl`
   - Interactive elements (buttons, inputs) use `rounded-md` or `rounded-lg`
   - Circular elements use `rounded-full`
   - Skeletons should match the content they replace

3. **Consistency Benefits**:
   - Professional appearance
   - Better visual hierarchy
   - Improved user experience
   - Matches Figma design specifications
