# Design.12 Integration Guide

## Overview
Design.12 components have been successfully copied to `/client/src/components/design12/`. This guide explains the integration process and how to use these updated components in production.

## Folder Structure

```
client/src/components/
├── design12/                    # NEW - Design.12 components
│   ├── OddsPage.tsx            # Updated odds display page
│   ├── OddsTable.tsx           # (if exists) Updated odds table
│   ├── BetCard.tsx             # Updated bet card component
│   ├── PicksPage.tsx           # Updated picks/my picks page
│   ├── Dashboard.tsx           # Updated dashboard
│   ├── BetSlip.tsx             # Updated bet slip
│   ├── ui/                     # shadcn/ui components (48 files)
│   ├── figma/                  # Figma-specific utilities
│   └── [other components]      # Additional Design.12 components
├── design11/                   # Previous design system
├── design10/                   # Legacy design system
└── [other folders]
```

## Key Components Updated in Design.12

### 1. **OddsPage.tsx** (85,553 bytes)
- Complete redesign of the odds display interface
- Enhanced filtering system (Sport, Market, Bet Type, Date, Sportsbooks)
- Improved table layout and responsiveness
- Better visual hierarchy and user feedback

**Location:** `/client/src/components/design12/OddsPage.tsx`

### 2. **BetCard.tsx** (13,722 bytes)
- Redesigned bet card component
- Support for multiple variants (default, hero)
- Enhanced comparison view for sportsbooks
- Better visual indicators for EV and confidence

**Location:** `/client/src/components/design12/BetCard.tsx`

### 3. **PicksPage.tsx** (14,207 bytes)
- Updated "My Picks" page interface
- Better organization and filtering
- Improved visual design and interactions

**Location:** `/client/src/components/design12/PicksPage.tsx`

### 4. **Dashboard.tsx** (28,283 bytes)
- Redesigned dashboard with new layout
- Updated stats display
- Better visual organization

**Location:** `/client/src/components/design12/Dashboard.tsx`

### 5. **BetSlip.tsx** (16,503 bytes)
- Updated bet slip component
- Better layout and interactions
- Improved visual design

**Location:** `/client/src/components/design12/BetSlip.tsx`

## UI Components Library

Design.12 includes 48 shadcn/ui components:
- accordion, alert, alert-dialog, aspect-ratio, avatar, badge
- breadcrumb, button, calendar, card, carousel, chart
- checkbox, collapsible, command, context-menu, dialog, drawer
- dropdown-menu, form, hover-card, input, input-otp, label
- menubar, navigation-menu, pagination, popover, progress
- radio-group, resizable, scroll-area, select, separator, sheet
- sidebar, skeleton, slider, sonner, switch, table, tabs
- textarea, toggle, toggle-group, tooltip, use-mobile

**Location:** `/client/src/components/design12/ui/`

## Integration Steps

### Step 1: Import Design.12 Components
Replace imports from old design systems with Design.12:

```typescript
// OLD
import OddsPage from '../components/design11/OddsPage';

// NEW
import { OddsPage } from '../components/design12/OddsPage';
```

### Step 2: Update Routes
Update your routing to use Design.12 components:

```typescript
// In App.tsx or routing file
import { OddsPage } from './components/design12/OddsPage';
import { PicksPage } from './components/design12/PicksPage';
import { Dashboard } from './components/design12/Dashboard';

// Update route definitions
<Route path="/odds" element={<OddsPage />} />
<Route path="/picks" element={<PicksPage />} />
<Route path="/dashboard" element={<Dashboard />} />
```

### Step 3: Update Component Props
Design.12 components may have different prop interfaces. Check each component's TypeScript definitions.

Example - BetCard:
```typescript
interface BetCardProps {
  bet: BetData;
  variant?: 'default' | 'hero';
  showActions?: boolean;
  onAddPick?: (bet: BetData) => void;
}
```

### Step 4: Theme Context Integration
Design.12 components use the ThemeContext. Ensure it's properly set up:

```typescript
import { useTheme } from './contexts/ThemeContext';

// In your component
const { colorMode } = useTheme();
const isDark = colorMode === 'dark';
```

### Step 5: Sonner Toast Integration
Design.12 uses Sonner for notifications:

```typescript
import { toast } from 'sonner';

// Usage
toast.success('Bet added to My Picks!');
toast.error('Error adding bet');
```

## Migration Checklist

- [ ] Copy Design.12 folder to client/src/components/ ✅ DONE
- [ ] Update App.tsx routes to use Design.12 components
- [ ] Update OddsPage imports and usage
- [ ] Update OddsTable imports and usage
- [ ] Update BetCard imports and usage
- [ ] Update PicksPage imports and usage
- [ ] Update Dashboard imports and usage
- [ ] Test all components with real data
- [ ] Verify responsive design on mobile
- [ ] Test dark/light mode switching
- [ ] Verify all icons load correctly
- [ ] Test form submissions and interactions
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Commit and push changes

## File Mapping

| Component | Design.12 Location | Current Production | Status |
|-----------|-------------------|-------------------|--------|
| OddsPage | design12/OddsPage.tsx | pages/SportsbookMarkets.js | Ready to integrate |
| BetCard | design12/BetCard.tsx | components/BetCard.tsx | Ready to integrate |
| PicksPage | design12/PicksPage.tsx | (needs creation) | Ready to integrate |
| Dashboard | design12/Dashboard.tsx | pages/Dashboard.tsx | Ready to integrate |
| BetSlip | design12/BetSlip.tsx | components/betting/BetSlip.js | Ready to integrate |

## Important Notes

1. **TypeScript vs JavaScript**: Design.12 uses TypeScript (.tsx). Ensure your build system supports this.

2. **Dependencies**: Design.12 requires:
   - React 18+
   - lucide-react (icons)
   - sonner (toasts)
   - shadcn/ui components
   - ThemeContext

3. **Styling**: Design.12 uses Tailwind CSS. Ensure your tailwind.config.js is properly configured.

4. **Context Providers**: Ensure these providers are in your app:
   - ThemeContext (for dark/light mode)
   - BetSlipContext (for bet management)
   - Sonner provider (for toasts)

## Testing Design.12 Components

### Local Testing
```bash
# Start development server
npm start

# Navigate to pages using Design.12 components
# Test all interactions and responsive design
```

### Checklist
- [ ] All buttons are clickable and functional
- [ ] Filters work correctly
- [ ] Data displays properly
- [ ] Responsive design works on mobile
- [ ] Dark/light mode switching works
- [ ] Toasts appear correctly
- [ ] No console errors

## Rollback Plan

If issues arise, you can revert to the previous design system:

```bash
# Revert to design11
git checkout HEAD -- client/src/components/design12

# Or restore from backup
cp -r client/src/components/design11 client/src/components/design12
```

## Next Steps

1. Update App.tsx to import Design.12 components
2. Test each component individually
3. Verify integration with backend APIs
4. Deploy to staging environment
5. Get user feedback
6. Deploy to production

## Support

For issues or questions about Design.12 components:
1. Check the component's TypeScript definitions
2. Review the Figma design file
3. Check console for error messages
4. Verify all dependencies are installed

---

**Last Updated:** November 21, 2025
**Design Version:** Design.12
**Status:** Ready for Integration
