# Figma Design.5 Migration Plan

## Overview
Complete migration from current design system to Figma Design.5, including:
- New UI component library (Radix UI primitives)
- Updated theme system (next-themes)
- Redesigned page layouts
- Enhanced data visualization
- Modern form handling with react-hook-form

## Migration Phases

### Phase 1: Setup & Dependencies (1-2 hours)
- [ ] Install new dependencies
- [ ] Update Tailwind configuration
- [ ] Set up new theme provider
- [ ] Create theme toggle component

### Phase 2: UI Components (2-3 hours)
- [ ] Copy UI components from Design.5
- [ ] Update component imports
- [ ] Test component rendering
- [ ] Verify Radix UI integration

### Phase 3: Page Components (3-4 hours)
- [ ] Migrate Dashboard.tsx
- [ ] Migrate OddsPage.tsx
- [ ] Migrate PicksPage.tsx
- [ ] Migrate AccountPage.tsx
- [ ] Migrate SettingsPage.tsx
- [ ] Migrate other pages (LoginPage, SignUpPage, etc.)

### Phase 4: API Integration (1-2 hours)
- [ ] Verify API hooks still work
- [ ] Update component data bindings
- [ ] Test real data flow

### Phase 5: Testing & Deployment (1-2 hours)
- [ ] Build and test locally
- [ ] Fix any TypeScript errors
- [ ] Deploy to Render
- [ ] Verify live deployment

## Component Mapping

### UI Components to Copy
```
Design.5/src/components/ui/
├── accordion.tsx
├── alert.tsx
├── alert-dialog.tsx
├── aspect-ratio.tsx
├── avatar.tsx
├── badge.tsx
├── breadcrumb.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── carousel.tsx
├── chart.tsx
├── checkbox.tsx
├── collapsible.tsx
├── command.tsx
├── context-menu.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── hover-card.tsx
├── input.tsx
├── label.tsx
├── menubar.tsx
├── navigation-menu.tsx
├── pagination.tsx
├── popover.tsx
├── progress.tsx
├── radio-group.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── skeleton.tsx
├── slider.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
├── toggle.tsx
├── toggle-group.tsx
├── tooltip.tsx
└── index.ts
```

### Page Components to Migrate
```
Design.5/src/components/
├── Dashboard.tsx          → client/src/components/landing/Dashboard.tsx
├── OddsPage.tsx          → client/src/components/landing/OddsPage.tsx
├── PicksPage.tsx         → client/src/components/landing/PicksPage.tsx
├── AccountPage.tsx       → client/src/components/landing/AccountPage.tsx
├── SettingsPage.tsx      → client/src/components/landing/SettingsPage.tsx
├── LoginPage.tsx         → client/src/components/auth/LoginPage.tsx
├── SignUpPage.tsx        → client/src/components/auth/SignUpPage.tsx
├── ForgotPasswordPage.tsx → client/src/components/auth/ForgotPasswordPage.tsx
├── BetCard.tsx           → client/src/components/landing/BetCard.tsx
├── Header.tsx            → client/src/components/layout/Header.tsx
├── Footer.tsx            → client/src/components/layout/Footer.tsx
└── ThemeSelector.tsx     → client/src/components/theme/ThemeSelector.tsx
```

## Dependencies to Install

### Core UI (Radix UI)
```bash
npm install \
  @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio \
  @radix-ui/react-avatar \
  @radix-ui/react-checkbox \
  @radix-ui/react-collapsible \
  @radix-ui/react-context-menu \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-hover-card \
  @radix-ui/react-label \
  @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-popover \
  @radix-ui/react-progress \
  @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area \
  @radix-ui/react-select \
  @radix-ui/react-separator \
  @radix-ui/react-slider \
  @radix-ui/react-slot \
  @radix-ui/react-switch \
  @radix-ui/react-tabs \
  @radix-ui/react-toggle \
  @radix-ui/react-toggle-group \
  @radix-ui/react-tooltip
```

### Utilities & Styling
```bash
npm install \
  next-themes \
  class-variance-authority \
  clsx \
  cmdk \
  embla-carousel-react \
  input-otp \
  lucide-react \
  react-day-picker \
  react-hook-form \
  react-resizable-panels \
  recharts \
  sonner \
  tailwind-merge \
  vaul
```

### Dev Dependencies
```bash
npm install -D tailwindcss-animate
```

## Key Changes

### 1. Theme System
**Before:**
- Custom ThemeContext with hardcoded colors
- Manual light/dark mode toggle
- Theme stored in component state

**After:**
- next-themes provider for system theme detection
- CSS variables for all colors
- Automatic persistence
- Support for light/dark/system themes

### 2. Component Structure
**Before:**
- Custom styled components
- Inline Tailwind classes
- Manual state management

**After:**
- Radix UI primitives with composition
- CVA (class-variance-authority) for variants
- Built-in accessibility
- Standardized component API

### 3. Form Handling
**Before:**
- Manual form state with useState
- Custom validation

**After:**
- react-hook-form for efficient form management
- Built-in validation
- Better performance

## File Structure After Migration

```
client/src/
├── components/
│   ├── ui/                    # Radix UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── ... (other UI components)
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── landing/
│   │   ├── Dashboard.tsx
│   │   ├── OddsPage.tsx
│   │   ├── PicksPage.tsx
│   │   ├── AccountPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── BetCard.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── SignUpPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeToggle.tsx
│   └── figma/
│       └── ImageWithFallback.tsx
├── contexts/
│   └── ThemeContext.js (deprecated, can be removed after migration)
├── hooks/
│   ├── useMarkets.js
│   ├── useMarketsWithCache.js
│   ├── useCachedOdds.js
│   └── ... (existing hooks)
├── styles/
│   ├── globals.css
│   └── ... (other styles)
└── ... (other directories)
```

## Import Path Changes

### Old Pattern
```typescript
import { useTheme } from '@/contexts/ThemeContext';
import { lightModeColors } from '@/contexts/ThemeContext';
```

### New Pattern
```typescript
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

## Testing Checklist

- [ ] All components render without errors
- [ ] Theme switching works (light/dark/system)
- [ ] API data flows correctly to components
- [ ] Forms submit and validate properly
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility features work (keyboard navigation, screen readers)
- [ ] No console errors or warnings
- [ ] Build completes successfully
- [ ] Live deployment works on Render

## Rollback Plan

If issues arise:
1. Keep current branch: `git branch -m feature/design-5-migration feature/design-5-migration-backup`
2. Create new branch from main: `git checkout -b feature/design-5-migration-v2 main`
3. Or revert: `git reset --hard HEAD~N` (where N is number of commits)

## Timeline Estimate

- **Total Time:** 4-6 hours
- **Phase 1:** 1-2 hours
- **Phase 2:** 2-3 hours
- **Phase 3:** 3-4 hours
- **Phase 4:** 1-2 hours
- **Phase 5:** 1-2 hours

## Notes

- Keep existing API hooks (useMarkets, useMarketsWithCache, etc.)
- Maintain current authentication system
- Preserve all existing functionality
- Update imports gradually to avoid breaking changes
- Test each phase before moving to next
