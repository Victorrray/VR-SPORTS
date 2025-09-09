# Authentication Flow Sequence Diagram

This document provides a visual representation of the authentication flows in the VR-Odds platform.

## Main Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant H as Home Page
    participant L as Login Page
    participant S as Supabase Auth
    participant AC as AuthCallback
    participant P as Pricing Page
    participant PG as PlanGate
    participant A as App/Dashboard

    Note over U,A: Standard Login Flow
    U->>H: Visits landing page
    H->>U: Shows CTA buttons
    U->>L: Clicks "Login" or "Sign Up"
    L->>L: saveIntent('login', '/app')
    L->>S: User enters credentials
    S->>AC: Redirects with auth tokens
    AC->>AC: Processes auth success
    AC->>AC: Checks stored intent
    AC->>A: Redirects to /app (or stored returnTo)
    A->>PG: Check if user has plan
    alt User has valid plan
        PG->>A: Render protected content
    else User has null/no plan
        PG->>PG: Show plan selection UI
        U->>PG: Selects plan (free/paid)
        PG->>A: Navigate to app after plan set
    end
```

## Pricing Button Flows

```mermaid
sequenceDiagram
    participant U as User
    participant P as Pricing Page
    participant S as Supabase Auth
    participant L as Login Page
    participant AC as AuthCallback
    participant ST as Stripe Checkout
    participant A as App

    Note over U,A: Start Free Flow
    U->>P: Clicks "Start Free Trial"
    P->>S: Check auth status
    alt User not authenticated
        P->>P: saveIntent('start-free', '/app')
        P->>L: Redirect to login with intent
        L->>S: User authenticates
        S->>AC: Auth callback
        AC->>AC: Process intent='start-free'
        AC->>A: Redirect to /app
    else User authenticated
        P->>P: Set plan to 'free_trial'
        P->>A: Navigate to /app
    end

    Note over U,ST: Upgrade Flow
    U->>P: Clicks "Upgrade to Platinum"
    P->>S: Check auth status
    alt User not authenticated
        P->>P: saveIntent('upgrade', '/pricing')
        P->>L: Redirect to login with intent
        L->>S: User authenticates
        S->>AC: Auth callback
        AC->>AC: Process intent='upgrade'
        AC->>P: Redirect to pricing with autostart
        P->>ST: Auto-start Stripe checkout
    else User authenticated
        P->>ST: Create and redirect to Stripe checkout
    end
```

## Sign Out Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as Account/Profile
    participant SA as signOutActions
    participant S as Supabase
    participant B as Backend
    participant H as Home Page

    U->>A: Clicks "Sign Out"
    A->>SA: Call signOutAndRefresh()
    SA->>S: supabase.auth.signOut()
    SA->>SA: Clear localStorage
    SA->>SA: Clear sessionStorage
    SA->>SA: Clear service worker caches
    SA->>B: POST /api/logout (clear cookies)
    SA->>H: window.location.href = '/'
    H->>U: Shows landing page (signed out)
```

## Protected Route Access

```mermaid
sequenceDiagram
    participant U as User
    participant PR as PrivateRoute
    participant PG as PlanGuard
    participant S as Supabase
    participant ME as useMe Hook
    participant C as Protected Component

    U->>PR: Accesses protected route
    PR->>S: Check auth session
    alt User not authenticated
        PR->>H: Redirect to landing page
    else User authenticated
        PR->>PG: Pass to PlanGuard
        PG->>ME: Check user plan
        ME->>ME: Fetch user data from backend
        alt User has valid plan
            PG->>C: Render protected component
        else User has null/no plan
            PG->>PG: Show PlanGate component
            U->>PG: Select plan
            PG->>C: Navigate to app after plan selection
        end
    end
```

## OAuth Callback Processing

```mermaid
sequenceDiagram
    participant S as Supabase OAuth
    participant AC as AuthCallback
    participant LS as LocalStorage
    participant P as Pricing Page
    participant A as App

    S->>AC: Redirect with auth tokens + URL params
    AC->>AC: Extract URL params (intent, returnTo)
    AC->>LS: Check stored pricingIntent
    AC->>AC: Determine final intent and returnTo
    AC->>LS: Clear stored intent
    
    alt intent === 'upgrade'
        AC->>P: Navigate to /pricing?intent=upgrade&autostart=1
        P->>P: Auto-start Stripe checkout
    else intent === 'start-free'
        AC->>A: Navigate to /app
    else Default case
        AC->>AC: Navigate to returnTo or /app
    end
```

## Feature Flag Integration

```mermaid
sequenceDiagram
    participant C as Component
    participant E as Environment
    participant L as Legacy Flow
    participant V2 as V2 Flow

    C->>E: Check VITE_FLOW_V2 flag
    alt VITE_FLOW_V2 !== '0'
        C->>V2: Use enhanced flow
        Note over V2: - Unified supabase imports<br/>- Enhanced debug logging<br/>- Improved intent handling<br/>- Better error handling
    else VITE_FLOW_V2 === '0'
        C->>L: Use legacy flow
        Note over L: - Original behavior<br/>- Minimal changes<br/>- Safe fallback
    end
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant D as Debug Logger
    participant E as Error Handler

    C->>C: Auth operation fails
    C->>D: Log error details (if debug enabled)
    C->>E: Handle error gracefully
    E->>U: Show user-friendly error message
    E->>C: Reset component state
    
    Note over C,E: Common Error Scenarios:
    Note over C,E: - Network failures
    Note over C,E: - Invalid auth tokens
    Note over C,E: - Stripe checkout failures
    Note over C,E: - Plan update failures
```

## Key Components and Their Roles

### Authentication Components
- **PrivateRoute**: Guards protected routes, redirects unauthenticated users to landing page
- **PlanGuard**: Ensures authenticated users have valid plans, shows PlanGate if needed
- **AuthCallback**: Processes OAuth redirects and handles intent-based routing
- **signOutActions**: Centralized sign out logic with comprehensive cleanup

### Intent Persistence
- **saveIntent()**: Stores user intent in localStorage with 30-minute expiry
- **getIntent()**: Retrieves and validates stored intent
- **clearIntent()**: Removes expired or processed intents

### Debug System
- **debugLog()**: General purpose logging gated by VITE_DEBUG_FLOW
- **debugPricingClick()**: Logs pricing button interactions
- **debugCheckoutResult()**: Logs Stripe checkout outcomes
- **debugRedirectDecision()**: Logs routing decisions

### Feature Flags
- **VITE_FLOW_V2**: Gates new authentication and routing logic
- **VITE_DEBUG_FLOW**: Enables debug logging in development

This sequence diagram shows how all components work together to provide a seamless authentication experience with proper intent preservation and error handling.
