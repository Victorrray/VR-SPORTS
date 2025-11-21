# Design.12 Quick Start Guide

## 🎯 What You Need to Know

Design.12 components have been successfully copied to your production client folder. This guide shows you how to start using them immediately.

## 📁 Where Everything Is

```
client/src/components/design12/
├── OddsPage.tsx              ← Main odds display page
├── BetCard.tsx               ← Individual bet card component
├── PicksPage.tsx             ← My Picks page
├── Dashboard.tsx             ← Dashboard/home page
├── BetSlip.tsx               ← Bet slip modal
├── CalculatorPage.tsx        ← EV calculator
├── BankrollPage.tsx          ← Bankroll management
├── SettingsPage.tsx          ← User settings
├── LoginPage.tsx             ← Login form
├── SignUpPage.tsx            ← Sign up form
├── AccountPage.tsx           ← Account management
├── ui/                       ← 48 shadcn/ui components
└── figma/                    ← Figma utilities
```

## 🚀 Quick Integration Examples

### 1. Using OddsPage Component

```typescript
// In your App.tsx or routing file
import { OddsPage } from './components/design12/OddsPage';

// Add to your routes
<Route path="/odds" element={<OddsPage />} />

// Or use directly
<OddsPage onAddPick={handleAddPick} savedPicks={myPicks} />
```

### 2. Using BetCard Component

```typescript
import { BetCard, BetData } from './components/design12/BetCard';

const bet: BetData = {
  id: 1,
  teams: 'Kansas City @ Buffalo',
  time: '6:30 PM ET',
  pick: 'Kansas City -2.5',
  odds: '-110',
  sportsbook: 'DraftKings',
  ev: '+2.5%',
  sport: 'NFL',
  status: 'pending',
  confidence: 'High'
};

<BetCard 
  bet={bet} 
  variant="default"
  showActions={true}
  onAddPick={handleAddPick}
/>
```

### 3. Using PicksPage Component

```typescript
import { PicksPage } from './components/design12/PicksPage';

<Route path="/picks" element={<PicksPage />} />
```

### 4. Using Dashboard Component

```typescript
import { Dashboard } from './components/design12/Dashboard';

<Route path="/dashboard" element={<Dashboard />} />
```

### 5. Using UI Components

```typescript
// Button
import { Button } from './components/design12/ui/button';
<Button>Click me</Button>

// Card
import { Card, CardContent, CardHeader, CardTitle } from './components/design12/ui/card';
<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>

// Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/design12/ui/dialog';
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>

// Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/design12/ui/select';
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

## 🎨 Theme Integration

Design.12 uses ThemeContext for dark/light mode:

```typescript
import { useTheme } from './contexts/ThemeContext';

export function MyComponent() {
  const { colorMode } = useTheme();
  const isDark = colorMode === 'dark';
  
  return (
    <div className={isDark ? 'bg-dark text-white' : 'bg-white text-dark'}>
      Content
    </div>
  );
}
```

## 📢 Toast Notifications

Design.12 uses Sonner for toasts:

```typescript
import { toast } from 'sonner';

// Success
toast.success('Bet added to My Picks!');

// Error
toast.error('Failed to add bet');

// Info
toast.info('This is an info message');

// Custom
toast.custom((t) => (
  <div>Custom toast content</div>
));
```

## 🔄 Migration Path

### Step 1: Update Imports
```typescript
// OLD
import OddsPage from '../pages/SportsbookMarkets';

// NEW
import { OddsPage } from '../components/design12/OddsPage';
```

### Step 2: Update Routes
```typescript
// OLD
<Route path="/odds" element={<SportsbookMarkets />} />

// NEW
<Route path="/odds" element={<OddsPage />} />
```

### Step 3: Test Component
- Navigate to the page
- Verify all features work
- Check responsive design
- Test dark/light mode

### Step 4: Repeat for Other Components
- BetCard
- PicksPage
- Dashboard
- BetSlip

## ✅ Checklist for Each Component

- [ ] Import component from design12
- [ ] Update route/usage
- [ ] Pass required props
- [ ] Test with real data
- [ ] Verify responsive design
- [ ] Test dark/light mode
- [ ] Check console for errors
- [ ] Test all interactions
- [ ] Verify API integration

## 📱 Responsive Design

All Design.12 components are mobile-first:

```typescript
// Components automatically adapt to:
// - Mobile (< 640px)
// - Tablet (640px - 1024px)
// - Desktop (> 1024px)

// No additional CSS needed!
```

## 🎯 Key Features in Design.12

### OddsPage
- ✅ Advanced filtering (Sport, Market, Date, Sportsbooks)
- ✅ Sortable columns
- ✅ Pagination
- ✅ Auto-refresh toggle
- ✅ Mobile-optimized

### BetCard
- ✅ Multiple variants (default, hero)
- ✅ Sportsbook comparison
- ✅ EV highlighting
- ✅ Add to picks functionality
- ✅ Responsive design

### PicksPage
- ✅ View all saved picks
- ✅ Filter and sort
- ✅ Remove picks
- ✅ Track status
- ✅ Mobile-friendly

### Dashboard
- ✅ Performance stats
- ✅ Recent picks
- ✅ Quick actions
- ✅ Personalized recommendations
- ✅ Beautiful layout

## 🐛 Troubleshooting

### Component Not Rendering
```typescript
// Check imports
import { OddsPage } from './components/design12/OddsPage';

// Check props
<OddsPage onAddPick={handleAddPick} />

// Check console for errors
```

### Styling Issues
```typescript
// Ensure Tailwind CSS is configured
// Check tailwind.config.js

// Verify CSS is imported
import './styles/globals.css';
```

### Theme Not Working
```typescript
// Ensure ThemeContext provider is in App.tsx
<ThemeProvider>
  <App />
</ThemeProvider>

// Check useTheme hook
const { colorMode } = useTheme();
```

### Toasts Not Showing
```typescript
// Ensure Sonner provider is in App.tsx
<Toaster />

// Import toast correctly
import { toast } from 'sonner';
```

## 📚 Available UI Components

Design.12 includes 48 shadcn/ui components:

**Form Components:**
- Button, Input, Textarea, Select, Checkbox, Radio, Toggle, Switch, Slider

**Layout Components:**
- Card, Separator, Tabs, Accordion, Collapsible, Drawer, Sheet, Sidebar

**Display Components:**
- Badge, Avatar, Breadcrumb, Pagination, Progress, Skeleton, Table

**Dialog Components:**
- Dialog, Alert Dialog, Popover, Hover Card, Tooltip, Context Menu, Dropdown Menu

**Navigation Components:**
- Navigation Menu, Menubar

**Data Components:**
- Calendar, Carousel, Chart, Command

**Utilities:**
- Aspect Ratio, Scroll Area, Resizable, use-mobile hook

## 🔗 Component Dependencies

Design.12 components require:
- React 18+
- TypeScript
- Tailwind CSS
- lucide-react (icons)
- sonner (toasts)
- class-variance-authority
- clsx

## 🚦 Integration Priority

1. **High Priority** (Do First)
   - OddsPage
   - BetCard
   - Dashboard

2. **Medium Priority** (Do Next)
   - PicksPage
   - BetSlip
   - CalculatorPage

3. **Low Priority** (Do Last)
   - Settings pages
   - Account pages
   - Legal pages

## 💡 Pro Tips

1. **Start with one component** - Don't try to replace everything at once
2. **Test thoroughly** - Each component should be tested with real data
3. **Keep old components** - design11 and design10 are still available as fallback
4. **Use TypeScript** - Design.12 is fully typed for better development experience
5. **Check console** - Always check browser console for errors during integration

## 🎓 Learning Resources

- Check component TypeScript definitions for prop types
- Review Figma design file for visual reference
- Look at example usage in component files
- Test components in isolation first

## 📞 Need Help?

1. Check the component's TypeScript interface
2. Review DESIGN12_INTEGRATION_GUIDE.md
3. Look at component examples in design12 folder
4. Check browser console for error messages

---

**Status:** ✅ Ready to Use  
**Last Updated:** November 21, 2025  
**Version:** Design.12
