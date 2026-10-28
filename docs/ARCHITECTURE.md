# Architecture

> **Update (v2.0, Oct 2026):** the public site is now fully static — content is bundled from `/content/**.json`
> at build time and edited through the git-based admin CMS (`admin/`, see `docs/ADMIN_CMS.md`). Apps Script is used
> **only** by the website forms (`gas-public-api/`). `gas-admin-cms/` and `admin-ui/` are archived and not deployed.
> Sections below that describe Sheets-backed content reads or the Apps Script admin are historical.


## Components

| Layer | Technology | Role |
|---|---|---|
| Public website | Cloudflare Pages + Vite (vanilla JS, MPA) | Static, fast, SEO-friendly patient-facing site |
| Admin portal | Cloudflare Pages + Vite (vanilla JS, SPA) | Staff operations dashboard (Google sign-in) |
| Public API | Google Apps Script web app | Read content, accept callback/lab/feedback submissions |
| Admin CMS | Google Apps Script web app | Manage operations, content, analytics, deploys, setup |
| Database | Google Sheets (2 workbooks) | Operational + content data |
| Analytics (primary) | GA4 Data API | Dashboard metrics |
| Analytics (archive) | BigQuery sandbox | Optional daily GA4 export; never queried by dashboards |
| Media | Google Drive | Image storage, indexed in Media_Library |
| Booking partner | PWeNS | Confirmed appointments + payment |

## Two-workbook database

- **JSNM_V1_CONFIG_CONTENT** (21 tabs): pages, conditions, treatments, doctors, services, lab packages/tests, locations, blogs, FAQs, SEO metadata, media, navigation, promotions, users, roles, role permissions, system config, analytics config, runbook, feature flags.
- **JSNM_V1_OPERATIONS_AUDIT** (14 tabs): callback requests + checklist/question config + staff responses + status history, lab requests, feedback, email logs, admin audit, backup registry, publish history, error logs, health checks, Cloudflare deployments.

Column-level schema lives in `shared/schemas.js` (validated by `npm run validate`) and is mirrored in `gas-admin-cms/SetupService.gs`.

## Request flow (write)

1. Visitor submits the callback form on the public site.
2. `api.js` POSTs (as `text/plain`, avoiding CORS preflight) to the GAS Public API.
3. `BookingService` validates server-side, then **persists the record first** under a `LockService` lock.
4. Initial status history is recorded.
5. A notification email is attempted — **failure here never affects the saved request**.

## Analytics flow

- The site emits only allowlisted, non-PII events (`shared/constants.js` → `GA4_EVENTS`, `GA4_ALLOWED_PARAMS`).
- `sanitizeGa4Params()` strips anything on the PII blocklist before sending.
- GA4 exports daily to the BigQuery sandbox dataset as a raw archive.
- The admin dashboard reads the **GA4 Data API** (never BigQuery streaming).

## Booking model

- **Private call back** = lead captured into Operations; handled in the Callback Desk. Explicitly *not* a confirmed appointment.
- **Confirmed appointment** = redirect to PWeNS; `pwens_booking_click` event fired. No appointment is stored in V1.

## Scalability

The architecture is content-driven (Sheets) and stateless at the edge (Cloudflare). Multi-clinic / multi-specialty expansion is a matter of additional content rows and config, not code rewrites.
