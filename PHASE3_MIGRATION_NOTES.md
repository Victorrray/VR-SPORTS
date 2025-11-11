# Phase 3 Migration - Page Components

## Status: In Progress

### Challenge Identified
The page components (Dashboard, OddsPage, PicksPage, AccountPage, SettingsPage) have extensive styling that depends on the old `lightModeColors` object from ThemeContext. These components need to be simplified to work with next-themes and CSS variables.

### Approach
Instead of trying to map every `lightModeColors` property, we'll:

1. **Simplify styling** - Use basic Tailwind classes with next-themes
2. **Use CSS variables** - Leverage the new theme system's CSS variables
3. **Keep functionality** - Preserve all component logic and features

### CSS Variable Mapping

Old System → New System:
- `lightModeColors.text` → `text-foreground`
- `lightModeColors.textMuted` → `text-muted-foreground`
- `lightModeColors.statsCard` → `bg-card`
- `lightModeColors.statsIcon` → `bg-primary/10`
- `lightModeColors.statsIconColor` → `text-primary`
- `lightModeColors.textLight` → `text-muted-foreground`
- `lightModeColors.background` → `bg-background`

### Components to Update
1. ✅ Dashboard.tsx - Started
2. ⏳ OddsPage.tsx
3. ⏳ PicksPage.tsx
4. ⏳ AccountPage.tsx
5. ⏳ SettingsPage.tsx

### Next Steps
1. Complete Dashboard.tsx migration
2. Migrate remaining components
3. Test all components in light/dark modes
4. Build and deploy

### Notes
- All components already have `useTheme` from next-themes imported
- CSS variables are defined in `/client/src/styles/globals.css`
- Tailwind config has been updated to support CSS variables
- No breaking changes to component logic or props
