# Routing & Authentication Audit

## Current Implementation Analysis

### Route Table

| Path | Component | Guard | Data Dependencies | Issues Found |
|------|-----------|-------|-------------------|--------------|
| `/` | Home | None | useAuth, useMarkets (conditional) | ✅ Landing page for unauth, dashboard for auth |
| `/login` | Login | None | useAuth, savePricingIntent | ⚠️ Uses different supabase import path |
| `/signup` | Login | None | useAuth, savePricingIntent | ✅ Same as login |
| `/auth/callback` | AuthCallback | None | supabase.auth.getSession | ⚠️ Uses different supabase import path |
| `/app` | Navigate redirect | None | user check | ✅ Redirects to /sportsbooks or /login |
| `/dashboard` | Navigate redirect | None | user check | ✅ Redirects to /account or /login |
| `/pricing` | Home | None | Same as / | ⚠️ No dedicated pricing page |
| `/sportsbooks` | SportsbookMarkets | Manual check | user, onRegisterMobileSearch | ⚠️ Inconsistent guard pattern |
| `/account` | Account | PrivateRoute | user, useMe | ✅ Proper guard |
| `/picks` | MyPicks | PrivateRoute | user | ✅ Proper guard |
| `/scores` | Scores | Manual check | user | ⚠️ Inconsistent guard pattern |
| `/terms` | Terms | None | None | ✅ Public |
| `/privacy` | Privacy | None | None | ✅ Public |
| `*` | Navigate to / | None | None | ✅ Catch-all |

### Redirect Matrix

#### Sign-in Success
| From | To | Condition | Issues |
|------|----|-----------| -------|
| Login | `next` param or `/account` | Default | ⚠️ Should honor intent |
| AuthCallback | Based on intent | Intent-driven | ⚠️ Different supabase import |

#### Sign-up Success  
| From | To | Condition | Issues |
|------|----|-----------| -------|
| Login | `next` param or `/account` | Default | ⚠️ Should honor intent |
| AuthCallback | Based on intent | Intent-driven | ⚠️ Different supabase import |

#### Sign-out
| From | To | Condition | Issues |
|------|----|-----------| -------|
| Any protected | `/` | Always | ✅ Fixed in recent changes |

#### Session Expired
| From | To | Condition | Issues |
|------|----|-----------| -------|
| PrivateRoute protected | `/` | No session | ✅ Fixed in recent changes |
| Manual check protected | `/` | No session | ✅ App.js handles this |

#### Unauthenticated Access
| From | To | Condition | Issues |
|------|----|-----------| -------|
| Protected routes | `/` | No user | ✅ Multiple mechanisms |

#### Pricing Flow - Unauthenticated
| Action | From | To | Intent Stored | Issues |
|--------|------|----| ------------- | -------|
| Start Free | Pricing | `/signup?returnTo=/pricing&intent=start-free` | ✅ localStorage | ⚠️ Should go to /login too |
| Upgrade | Pricing | `/login?returnTo=/pricing&intent=upgrade` | ✅ localStorage | ✅ Correct |

#### Pricing Flow - Authenticated  
| Action | From | To | API Call | Issues |
|--------|------|----| -------- | -------|
| Start Free | Pricing | `/app` | POST /api/users/plan | ✅ Correct |
| Upgrade | Pricing | Stripe Checkout | POST /api/billing/create-checkout-session | ✅ Correct |

#### Stripe Flow
| Event | From | To | Condition | Issues |
|-------|------|----| --------- | -------|
| Success | Stripe | `/account` (assumed) | Webhook updates plan | ⚠️ No explicit success handling |
| Cancel | Stripe | `/pricing` (assumed) | User cancelled | ⚠️ No explicit cancel handling |

### State/Parameter Map

#### URL Parameters
- `intent`: `start-free` | `upgrade` - Pricing flow intention
- `returnTo`: URL path - Where to go after auth
- `next`: URL path - Legacy returnTo parameter  
- `autostart`: `1` - Auto-trigger checkout after auth
- `debug`: `1` - Enable debug logging

#### localStorage Keys
- `pricingIntent`: `{intent, returnTo, timestamp}` - Persists across OAuth redirects
- `userSelectedSportsbooks`: Array - User sportsbook preferences
- `DEBUG_PRICING`: `1` - Enable pricing debug logs

#### sessionStorage Keys
- Cleared on sign out - no specific keys identified

### Supabase Import Inconsistencies

**Critical Issue**: Multiple supabase import paths causing potential client mismatch:

1. **Main client**: `/src/lib/supabase.js` - Used by most components
2. **Legacy path**: `/src/utils/supabase.js` - Used by Login, AuthCallback, useMe, Pricing

This could cause auth state inconsistencies between components.

### Auth State Management Issues

1. **Multiple auth hooks**: `useAuth` and `useMe` serve different purposes but could conflict
2. **Mixed guard patterns**: Some routes use PrivateRoute, others use manual checks
3. **Intent handling**: Inconsistent between components (localStorage vs URL params)

### Known Edge Cases & Race Conditions

1. **Double auth listeners**: Both useAuth and useMe subscribe to onAuthStateChange
2. **Stale session handling**: No explicit session refresh on app focus
3. **Intent expiry**: 30-minute expiry could lose user context
4. **OAuth redirect loops**: If intent handling fails, user could get stuck
5. **Plan gate missing**: No blocking UI if user has null plan
6. **Stripe webhook timing**: UI might not update immediately after payment

### Root Cause Analysis

#### Sign Out Issues
- ✅ **FIXED**: Now redirects to `/` consistently
- ✅ **FIXED**: Uses centralized authActions.js

#### Pricing Button Issues  
- ⚠️ **PARTIAL**: Intent persistence works but supabase import inconsistency
- ⚠️ **PARTIAL**: Start Free goes to signup, should also support login

#### Post-Auth Redirection Issues
- ⚠️ **PARTIAL**: AuthCallback handles intents but uses wrong supabase client
- ⚠️ **PARTIAL**: Login doesn't fully honor stored intents

#### Old vs New User Issues
- ❌ **UNFIXED**: No plan gate for users with null plans
- ❌ **UNFIXED**: No explicit handling for users without plans

## Recommended Fixes

### High Priority
1. **Unify supabase imports** - All components use `/src/lib/supabase.js`
2. **Add feature flag** - `VITE_FLOW_V2` for safe rollback
3. **Fix pricing buttons** - Start Free should support both login/signup
4. **Add plan gate** - Block users with null plans

### Medium Priority  
5. **Add debug instrumentation** - `VITE_DEBUG_FLOW` logging
6. **Stripe success/cancel handlers** - Explicit redirect handling
7. **Session refresh** - On app focus/visibility change

### Low Priority
8. **Consolidate auth patterns** - Use PrivateRoute consistently
9. **Intent cleanup** - Remove expired intents on app start
10. **Error boundaries** - Better error handling for auth failures
