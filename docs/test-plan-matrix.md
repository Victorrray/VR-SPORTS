# Test Plan Matrix - Authentication & Routing Flows

This document provides a comprehensive test matrix for validating all authentication, routing, and pricing flows in the VR-Odds platform.

## Test Environment Setup

### Prerequisites
- Development environment with `VITE_DEBUG_FLOW=1`
- Test Supabase project with OAuth providers configured
- Test Stripe account with webhook endpoints
- Browser dev tools open for console monitoring

### Feature Flag Testing
- Test with `VITE_FLOW_V2=1` (new flow)
- Test with `VITE_FLOW_V2=0` (legacy flow)
- Test with flag undefined (defaults to new flow)

## Authentication Flow Test Matrix

| Test Case | User State | Action | Expected Result | Debug Logs | Priority |
|-----------|------------|--------|-----------------|------------|----------|
| **Login Flow** |
| AUTH-001 | Unauthenticated | Visit `/login` | Login form displayed | - | High |
| AUTH-002 | Unauthenticated | Submit valid credentials | Redirect to `/app` or stored returnTo | AUTH_SUCCESS, REDIRECT_DECISION | High |
| AUTH-003 | Unauthenticated | Submit invalid credentials | Error message shown, stay on login | AUTH_ERROR | High |
| AUTH-004 | Authenticated | Visit `/login` | Redirect to `/app` | REDIRECT_DECISION | Medium |
| **Signup Flow** |
| AUTH-005 | Unauthenticated | Visit `/signup` | Redirects to `/login` with signup tab | REDIRECT_DECISION | High |
| AUTH-006 | Unauthenticated | OAuth signup (Google/GitHub) | Redirect to AuthCallback | - | High |
| AUTH-007 | Authenticated | Visit `/signup` | Redirect to `/app` | REDIRECT_DECISION | Medium |
| **OAuth Callback** |
| AUTH-008 | OAuth redirect | AuthCallback with valid tokens | Process auth and redirect based on intent | AUTH_CALLBACK, INTENT_PROCESSING | High |
| AUTH-009 | OAuth redirect | AuthCallback with invalid tokens | Redirect to `/login` with error | AUTH_ERROR | High |
| AUTH-010 | OAuth redirect | AuthCallback with intent=upgrade | Redirect to `/pricing?intent=upgrade&autostart=1` | AUTH_CALLBACK, REDIRECT_DECISION | High |
| AUTH-011 | OAuth redirect | AuthCallback with intent=start-free | Redirect to `/app` | AUTH_CALLBACK, REDIRECT_DECISION | High |
| **Sign Out Flow** |
| AUTH-012 | Authenticated | Click sign out button | Clear all data, redirect to `/` | SIGN_OUT, CLEANUP | High |
| AUTH-013 | Authenticated | Sign out with React Router | `signOutAndRedirect()` called | SIGN_OUT, CLEANUP | High |
| AUTH-014 | Authenticated | Sign out with page refresh | `signOutAndRefresh()` called | SIGN_OUT, CLEANUP | High |

## Route Protection Test Matrix

| Test Case | User State | Plan State | Route | Expected Result | Guard Type | Priority |
|-----------|------------|------------|-------|-----------------|------------|----------|
| **Public Routes** |
| ROUTE-001 | Any | Any | `/` | Home page displayed | None | High |
| ROUTE-002 | Any | Any | `/login` | Login page displayed | None | High |
| ROUTE-003 | Any | Any | `/terms` | Terms page displayed | None | Medium |
| ROUTE-004 | Any | Any | `/privacy` | Privacy page displayed | None | Medium |
| **Protected Routes - Unauthenticated** |
| ROUTE-005 | Unauthenticated | N/A | `/sportsbooks` | Redirect to `/` | Manual | High |
| ROUTE-006 | Unauthenticated | N/A | `/scores` | Redirect to `/` | Manual | High |
| ROUTE-007 | Unauthenticated | N/A | `/account` | Redirect to `/` | PrivateRoute | High |
| ROUTE-008 | Unauthenticated | N/A | `/picks` | Redirect to `/` | PrivateRoute | High |
| ROUTE-009 | Unauthenticated | N/A | `/app` | Redirect to `/login` | Manual | High |
| ROUTE-010 | Unauthenticated | N/A | `/dashboard` | Redirect to `/login` | Manual | High |
| **Protected Routes - Authenticated, No Plan** |
| ROUTE-011 | Authenticated | null | `/sportsbooks` | Show PlanGate | PlanGuard | High |
| ROUTE-012 | Authenticated | null | `/scores` | Show PlanGate | PlanGuard | High |
| ROUTE-013 | Authenticated | null | `/account` | Show PlanGate | PlanGuard | High |
| ROUTE-014 | Authenticated | null | `/picks` | Show PlanGate | PlanGuard | High |
| ROUTE-015 | Authenticated | null | `/app` | Show PlanGate | PlanGuard | High |
| **Protected Routes - Authenticated, Valid Plan** |
| ROUTE-016 | Authenticated | free_trial | `/sportsbooks` | SportsbookMarkets displayed | PlanGuard | High |
| ROUTE-017 | Authenticated | platinum | `/scores` | Scores page displayed | PlanGuard | High |
| ROUTE-018 | Authenticated | free_trial | `/account` | Account page displayed | PlanGuard | High |
| ROUTE-019 | Authenticated | platinum | `/picks` | MyPicks page displayed | PlanGuard | High |
| **Redirect Routes** |
| ROUTE-020 | Any | Any | `/signup` | Redirect to `/login` | Redirect | Medium |
| ROUTE-021 | Any | Any | `/pricing` | Redirect to `/` | Redirect | Medium |
| ROUTE-022 | Authenticated | Valid | `/app` | Redirect to `/sportsbooks` | Redirect | Medium |
| ROUTE-023 | Authenticated | Valid | `/dashboard` | Redirect to `/account` | Redirect | Medium |

## Pricing Button Test Matrix

| Test Case | User State | Plan State | Button | Expected Result | Debug Logs | Priority |
|-----------|------------|------------|--------|-----------------|------------|----------|
| **Start Free Trial Button** |
| PRICE-001 | Unauthenticated | N/A | Click "Start Free" | Save intent, redirect to login | PRICING_CLICK, INTENT_SAVE | High |
| PRICE-002 | Authenticated | null | Click "Start Free" | Set plan to free_trial, redirect to `/app` | PRICING_CLICK, PLAN_UPDATE | High |
| PRICE-003 | Authenticated | free_trial | Click "Start Free" | Already has plan, redirect to `/app` | PRICING_CLICK | Medium |
| PRICE-004 | Authenticated | platinum | Click "Start Free" | Already has plan, redirect to `/app` | PRICING_CLICK | Low |
| **Upgrade to Platinum Button** |
| PRICE-005 | Unauthenticated | N/A | Click "Upgrade" | Save intent, redirect to login | PRICING_CLICK, INTENT_SAVE | High |
| PRICE-006 | Authenticated | null | Click "Upgrade" | Create Stripe checkout session | PRICING_CLICK, CHECKOUT_RESULT | High |
| PRICE-007 | Authenticated | free_trial | Click "Upgrade" | Create Stripe checkout session | PRICING_CLICK, CHECKOUT_RESULT | High |
| PRICE-008 | Authenticated | platinum | Click "Upgrade" | Already has plan, redirect to `/app` | PRICING_CLICK | Low |
| **Auto-start Flow** |
| PRICE-009 | Authenticated | Any | Visit `/pricing?intent=upgrade&autostart=1` | Auto-start Stripe checkout | PRICING_CLICK, CHECKOUT_RESULT | High |
| PRICE-010 | Unauthenticated | N/A | Visit `/pricing?intent=upgrade&autostart=1` | Save intent, redirect to login | INTENT_SAVE | High |

## Intent Persistence Test Matrix

| Test Case | Initial State | Action | Intent Stored | Expiry | Expected Flow | Priority |
|-----------|---------------|--------|---------------|--------|---------------|----------|
| **Intent Storage** |
| INTENT-001 | Unauthenticated | Click "Start Free" | `{intent: 'start-free', returnTo: '/app', ts: now}` | 30 min | Login → AuthCallback → `/app` | High |
| INTENT-002 | Unauthenticated | Click "Upgrade" | `{intent: 'upgrade', returnTo: '/pricing', ts: now}` | 30 min | Login → AuthCallback → Pricing autostart | High |
| INTENT-003 | Any | Visit login with returnTo | `{intent: 'login', returnTo: '/custom', ts: now}` | 30 min | Login → AuthCallback → `/custom` | Medium |
| **Intent Expiry** |
| INTENT-004 | Stored intent | Wait 31 minutes | Intent expired | Expired | Login → AuthCallback → Default redirect | Medium |
| INTENT-005 | Stored intent | Clear localStorage | No intent | Cleared | Login → AuthCallback → Default redirect | Low |
| **Intent Processing** |
| INTENT-006 | Valid intent | AuthCallback | Intent processed and cleared | Processed | Redirect based on intent | High |
| INTENT-007 | Multiple intents | AuthCallback | Latest intent used | Processed | Use most recent intent | Medium |

## Plan Gate Test Matrix

| Test Case | User State | Plan State | Action | Expected Result | Priority |
|-----------|------------|------------|--------|-----------------|----------|
| **Plan Gate Display** |
| PLAN-001 | Authenticated | null | Access protected route | PlanGate component shown | High |
| PLAN-002 | Authenticated | undefined | Access protected route | PlanGate component shown | High |
| PLAN-003 | Authenticated | "null" (string) | Access protected route | PlanGate component shown | High |
| **Plan Selection** |
| PLAN-004 | Authenticated | null | Select "Free Trial" | Set plan, redirect to app | High |
| PLAN-005 | Authenticated | null | Select "Platinum" | Create Stripe checkout | High |
| PLAN-006 | Authenticated | null | Plan selection fails | Show error message | Medium |
| **Plan Gate Bypass** |
| PLAN-007 | Authenticated | free_trial | Access protected route | Bypass PlanGate, show content | High |
| PLAN-008 | Authenticated | platinum | Access protected route | Bypass PlanGate, show content | High |

## Error Handling Test Matrix

| Test Case | Scenario | Expected Behavior | Debug Logs | Priority |
|-----------|----------|-------------------|------------|----------|
| **Network Errors** |
| ERROR-001 | Login API failure | Show error message, stay on login | AUTH_ERROR | High |
| ERROR-002 | Plan update failure | Show error message, retry option | PLAN_UPDATE_ERROR | High |
| ERROR-003 | Stripe checkout failure | Show error message, retry option | CHECKOUT_ERROR | High |
| **Auth Errors** |
| ERROR-004 | Invalid auth tokens | Clear session, redirect to login | AUTH_ERROR | High |
| ERROR-005 | Session expired | Clear session, redirect to landing | SESSION_EXPIRED | High |
| ERROR-006 | OAuth callback error | Show error, redirect to login | OAUTH_ERROR | High |
| **State Errors** |
| ERROR-007 | Corrupted localStorage | Clear storage, reset to default | STORAGE_ERROR | Medium |
| ERROR-008 | Invalid plan state | Show PlanGate, force plan selection | PLAN_ERROR | Medium |
| ERROR-009 | Missing user data | Refetch user data, show loading | USER_DATA_ERROR | Medium |

## Feature Flag Test Matrix

| Test Case | VITE_FLOW_V2 | Expected Behavior | Components Affected | Priority |
|-----------|--------------|-------------------|-------------------|----------|
| **V2 Flow Enabled** |
| FLAG-001 | `1` | New flow with enhanced features | All auth components | High |
| FLAG-002 | `true` | New flow with enhanced features | All auth components | High |
| FLAG-003 | undefined | New flow (default) | All auth components | High |
| **Legacy Flow** |
| FLAG-004 | `0` | Legacy flow behavior | All auth components | High |
| FLAG-005 | `false` | Legacy flow behavior | All auth components | High |
| **Feature Differences** |
| FLAG-006 | V2 enabled | Enhanced debug logging | Debug system | Medium |
| FLAG-007 | V2 enabled | Unified supabase imports | Import statements | Medium |
| FLAG-008 | V2 enabled | Improved error handling | Error boundaries | Medium |

## Performance Test Matrix

| Test Case | Scenario | Metric | Expected | Priority |
|-----------|----------|--------|----------|----------|
| **Load Times** |
| PERF-001 | Initial page load | Time to interactive | < 3s | Medium |
| PERF-002 | Auth state change | Component re-render time | < 100ms | Medium |
| PERF-003 | Route navigation | Navigation time | < 500ms | Medium |
| **Memory Usage** |
| PERF-004 | Auth state subscriptions | Memory leaks | No leaks | Medium |
| PERF-005 | Component unmounting | Cleanup completion | Complete | Medium |
| **Network Requests** |
| PERF-006 | Auth operations | API call count | Minimal | Low |
| PERF-007 | Plan checks | Cache utilization | Effective | Low |

## Browser Compatibility Test Matrix

| Test Case | Browser | Version | Expected Result | Priority |
|-----------|---------|---------|-----------------|----------|
| **Desktop Browsers** |
| COMPAT-001 | Chrome | Latest | Full functionality | High |
| COMPAT-002 | Firefox | Latest | Full functionality | High |
| COMPAT-003 | Safari | Latest | Full functionality | High |
| COMPAT-004 | Edge | Latest | Full functionality | Medium |
| **Mobile Browsers** |
| COMPAT-005 | iOS Safari | Latest | Full functionality | High |
| COMPAT-006 | Android Chrome | Latest | Full functionality | High |
| COMPAT-007 | Samsung Internet | Latest | Full functionality | Medium |

## Test Execution Checklist

### Pre-Test Setup
- [ ] Clear browser storage (localStorage, sessionStorage, cookies)
- [ ] Verify environment variables are set correctly
- [ ] Confirm Supabase and Stripe test configurations
- [ ] Enable debug logging (`VITE_DEBUG_FLOW=1`)

### Test Execution
- [ ] Execute high-priority test cases first
- [ ] Document any failures with screenshots and console logs
- [ ] Verify debug logs appear for relevant actions
- [ ] Test both V2 and legacy flows
- [ ] Validate error handling scenarios

### Post-Test Validation
- [ ] Verify no console errors or warnings
- [ ] Confirm proper cleanup of event listeners
- [ ] Check for memory leaks in long-running sessions
- [ ] Validate localStorage/sessionStorage state

## Test Data Requirements

### User Accounts
- Test user with no plan (null)
- Test user with free_trial plan
- Test user with platinum plan
- Test user with expired plan

### OAuth Providers
- Google OAuth configured
- GitHub OAuth configured
- Test accounts for each provider

### Stripe Configuration
- Test mode enabled
- Webhook endpoints configured
- Test payment methods available

## Success Criteria

### Functional Requirements
- ✅ All authentication flows work correctly
- ✅ Route protection enforced properly
- ✅ Intent persistence works across sessions
- ✅ Plan gate blocks users without plans
- ✅ Error handling provides clear feedback

### Non-Functional Requirements
- ✅ No console errors in normal operation
- ✅ Proper cleanup of resources
- ✅ Responsive design works on mobile
- ✅ Accessibility standards met
- ✅ Performance within acceptable limits

### Security Requirements
- ✅ No sensitive data logged
- ✅ Proper session management
- ✅ CSRF protection in place
- ✅ Secure storage of auth tokens
- ✅ Proper logout cleanup

This comprehensive test matrix ensures all authentication and routing flows are thoroughly validated before deployment.
