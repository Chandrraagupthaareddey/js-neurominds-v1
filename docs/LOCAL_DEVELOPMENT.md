# Local development

## Prerequisites
- Node.js 18+ and npm.

## Install
```bash
npm install
```

## Run (no backend required)
```bash
npm run dev:public   # http://localhost:5173
npm run dev:admin    # http://localhost:5174
```
Both default to **mock mode** on localhost, driven by `shared/mock-public-content.js`.

## Validate + build
```bash
npm run validate     # schema + seed checks (35 tabs, slugs, GA4 PII guardrail)
npm run build        # clean + SEO stubs + Vite production build of public site
npm run build:admin  # production build of the admin SPA
npm run check:env    # reports current API/env mode resolution
npm run clean        # remove build output + generated stubs
```

## Environment modes
Copy `.env.example` to `.env` to override defaults:
```
VITE_API_MODE=mock|live
VITE_ENV=local|dev|production
VITE_PUBLIC_API_URL=...   # only in live mode
VITE_ADMIN_API_URL=...    # only in live mode
VITE_GA4_MEASUREMENT_ID=G-WKLHEDHC5D
```

## Admin RBAC simulator
On the admin login screen, pick any authorized user to sign in (simulated). Use the in-app **Role** switcher (top bar) to preview how each role sees the portal. Selecting the unauthorized account demonstrates the access-denied path.

## Notes
- `shared/` is imported via relative paths; the Vite dev server is configured to allow file access to the repo root.
- Inline page scripts are wrapped in `(async () => { ... })()` — never use top-level `await` in inline module scripts (it breaks the build).
