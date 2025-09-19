# Client App Structure

This document captures the current organization of the React client so new files can be placed consistently.

## Top-Level Layout (`client/src`)
- `App.js`, `index.js`, `App.css`, etc.: application entry points.
- `assets/`: static images and icons that are imported by the bundle.
- `config/`: environment-aware helpers such as `api.js`.
- `constants/`: shared constant data (e.g., sportsbook lists, team logos).
- `contexts/`: React context providers (`BetSlipContext`).
- `data/`: lightweight JSON-like data helpers.
- `database/`: SQL schema snapshots used by the app.
- `hooks/`: reusable React hooks (`useAuth`, `useMarkets`, `useQuotaHandler`, etc.).
- `lib/`: thin wrappers around third-party SDKs or side-effectful helpers (Supabase, debug utilities).
- `pages/`: route-level screens that compose domain components.
- `services/`: API facades and business logic helpers.
- `styles/`: global CSS (themes, responsive helpers, accessibility styles).
- `utils/`: framework-agnostic utilities and API clients.

## Component Directory (`client/src/components`)
Components are grouped by responsibility so related UI pieces live together. Each folder keeps the component source, styles, and co-located helpers.

- `auth/`: authentication and account gating UI such as `PlanGate`, `PlanGuard`, `PrivateRoute`, and username setup forms.
- `billing/`: billing and plan management widgets, including pricing cards, usage meters, and quota badges.
- `betting/`: core betting experiences (odds tables, bet slips, live betting, arbitrage tools, player props, sport selectors, skeletons).
- `common/`: low-level reusable primitives (buttons, date picker, error boundary, loading indicators, toast system, lazy image).
- `dashboard/`: personalized dashboards and analytic summaries that aggregate user data.
- `debug/`: developer-only surfaces for inspecting auth state or props.
- `layout/`: framing and navigation components (navbar, footer, accessibility widgets, mobile-only shells, SEO head helper).
- `modals/`: modal dialogs and overlays such as game details, quota prompts, and mobile search.
- `profile/`: profile-centric UI such as the user profile card.

### Working with Components
- When adding a component, pick the folder that best matches its domain; colocate its CSS alongside the component file.
- Prefer importing from the specific domain folder (e.g., `import Navbar from '../components/layout/Navbar';`).
- If a component spans multiple domains, consider extracting shared primitives into `components/common` before duplicating logic.

## Pages and Composition
Route-level files inside `pages/` import domain components from these folders. For example:
- Home page composes layout, dashboard, billing, and betting components.
- Sportsbook markets screen pulls from betting (tables, selectors) and layout (mobile shells) modules.
- Account, UsagePlan, and Profile pages lean on `auth/`, `billing/`, and `profile/` components.

## Hooks & Services Interactions
- Hooks located in `src/hooks` back components across folders. Because components now sit one level deeper, reach them with paths like `../../hooks/useAuth`.
- Services under `src/services` and utilities under `src/utils` continue to centralize API traffic—imports now use `../../services/...` or `../../utils/...` from component subdirectories.

## Migration Notes
- The restructure moved legacy plan gate UI into `components/auth`. The older variant lives at `auth/PlanGateLegacy.jsx` for reference.
- Any existing imports should target the new domain folders; `npm run build` will surface missing paths if new components are added elsewhere.

Refer to this guide when organizing new code so the directory hierarchy stays predictable.
