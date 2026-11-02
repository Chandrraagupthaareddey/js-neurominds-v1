# Changelog

## 2.1.0 — 2026-11-02 — Installable apps (PWA), Google sign-in gateway, performance
- **Installable web apps**: public site (`site.webmanifest`, `sw.js`, offline page, install hint, iOS tags,
  maskable icons, app shortcuts) and admin (`admin/manifest.webmanifest`, separate icon). Free, no store.
- **Admin Gateway Worker** (`cloudflare/admin-gateway`): Google sign-in with email roles (super_admin/admin),
  single server-held GitHub token, role-based write guard, `/healthz`.
- Pre-rendered site shell on every page (CLS ≈ 0), inlined CSS, lazy fonts, 96px WebP logo, real 404 page,
  `llms.txt`, `email_off` markers (no Cloudflare email-decode script), a11y fixes (contrast, link underlines,
  heading order). Lighthouse: desktop 99/100/100/100, mobile 89–96/100/100/100.

## 2.0.0 — 2026-10-28 — Static + git-based admin
- **Content is now bundled at build time** from `/content/**.json`; the public site no longer calls Apps Script /
  Google Sheets for content (faster, works without a backend, fully indexable).
- **Admin CMS (Sveltia) at `/admin` and admin.neurominds.in**: every public element is editable — clinic details,
  menu, feature switches, floating buttons, social links, Google reviews, callback options, SEO defaults, per-page
  text, conditions, treatments, services, doctors, lab packages, articles, FAQs, testimonials. Save = commit =
  Cloudflare rebuild. See `docs/ADMIN_CMS.md`.
- **Pre-rendered detail pages** `/conditions/<slug>`, `/treatments/<slug>`, `/doctors/<slug>`, `/knowledge/<slug>`
  with JSON-LD, breadcrumbs, FAQ schema; sitemap with `lastmod`; robots.txt; clean canonical URLs; `_headers`
  (security + caching) and `_redirects` (old stub URLs).
- Content JSON migrated to proper types (booleans, arrays, FAQ objects); site accepts legacy strings too.
- Markdown rendering for articles (safe, dependency-free); callback form section on Booking (flag-gated);
  map embed support; opening hours/email in footer; legal links in footer.
- Archived (kept in repo, not deployed): `admin-ui/`, `gas-admin-cms/`. `gas-public-api/` remains for form emails.


## v1.0.0
- Initial production monorepo for JS Neurominds and Diagnostic Center.
- Premium public website (19 pages) with calm healthcare design system, smooth scroll, scroll-reveal, accessible components.
- Admin operations portal (SPA) with login, in-app RBAC simulator, dashboard + GA4 charts, callback desk (drawer + timeline + search/filter), lab desk, content review, SEO, system health, runbook with API doc cards.
- GAS Public API (11 files): cached content reads + validated callback/lab/feedback writes with LockService and non-blocking email.
- GAS Admin CMS (21 files): runSetup() provisioning, Google-only auth, server-side RBAC, audit trail, GA4 Data API analytics, BigQuery health-only check, Cloudflare deploy hook, backups.
- Two-workbook Google Sheets schema (35 tabs) with validation scripts.
- SEO static stub builder + sitemap generation.
- Strict public-GitHub safety: comprehensive .gitignore, example-only secret files, secrets confined to Script Properties / Cloudflare env.
