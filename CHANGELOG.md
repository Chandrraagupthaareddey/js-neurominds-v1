# Changelog

## v1.0.0
- Initial production monorepo for JS Neurominds and Diagnostic Center.
- Premium public website (19 pages) with calm healthcare design system, smooth scroll, scroll-reveal, accessible components.
- Admin operations portal (SPA) with login, in-app RBAC simulator, dashboard + GA4 charts, callback desk (drawer + timeline + search/filter), lab desk, content review, SEO, system health, runbook with API doc cards.
- GAS Public API (11 files): cached content reads + validated callback/lab/feedback writes with LockService and non-blocking email.
- GAS Admin CMS (21 files): runSetup() provisioning, Google-only auth, server-side RBAC, audit trail, GA4 Data API analytics, BigQuery health-only check, Cloudflare deploy hook, backups.
- Two-workbook Google Sheets schema (35 tabs) with validation scripts.
- SEO static stub builder + sitemap generation.
- Strict public-GitHub safety: comprehensive .gitignore, example-only secret files, secrets confined to Script Properties / Cloudflare env.
