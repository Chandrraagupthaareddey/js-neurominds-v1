# JS Neurominds V1

Production monorepo for **JS Neurominds and Diagnostic Center** — a psychiatry and mental-health clinic in Chandragiri, Tirupati. Built and maintained by **TCGR Technologies (tcgr.in)**.

This repository contains a premium public website, an operations admin portal, and two Google Apps Script backends — all on free-tier Google + Cloudflare infrastructure, with strict privacy guarantees.

---

## 1. Project purpose

- Give patients and families a calm, trustworthy place to learn about the clinic, explore conditions and treatments, and reach out.
- Offer two clear booking paths: a **private call back** (handled by clinic staff) and a **confirmed appointment** (via the PWeNS booking partner).
- Give clinic staff a simple operations dashboard to manage callback requests, lab home-collection requests, feedback, content, and SEO — without touching spreadsheets directly.
- Keep analytics privacy-safe: no patient PII or clinical data ever reaches GA4 or BigQuery.

## 2. Architecture (high level)

```
Visitor -> Cloudflare Pages (static public site)
                |  reads content / submits requests
                v
        GAS Public API (web app)  -->  Google Sheets: JSNM_V1_OPERATIONS_AUDIT
                                  +-->  Google Sheets: JSNM_V1_CONFIG_CONTENT (read)

Staff -> Admin Portal (static)  -->  GAS Admin CMS (web app, Google sign-in)
                                       +-> both Sheets workbooks
                                       +-> GA4 Data API (dashboards)
                                       +-> BigQuery (health check only)
                                       +-> Cloudflare Deploy Hook (content sync)

Analytics: site -> GA4 (allowlisted, non-PII events) -> daily export -> BigQuery (archive only)
```

Full detail in `docs/ARCHITECTURE.md`.

## 3. Folder structure

```
js-neurominds-v1/
  public-site/      Static premium website (Vite, vanilla JS, MPA)
  admin-ui/         Admin operations portal (Vite, vanilla JS, SPA)
  shared/           Constants, schemas, validators, permissions, mock content
  gas-public-api/   Google Apps Script - public read/write API
  gas-admin-cms/    Google Apps Script - admin CMS + setup + analytics
  scripts/          Validation, SEO stub builder, env + clean helpers
  docs/             Architecture, deployment, runbook, security, etc.
  .env.example      Safe example env (no secrets)
  wrangler.toml.example
```

## 4. Local setup

```bash
npm install
npm run dev:public    # http://localhost:5173
npm run dev:admin     # http://localhost:5174
npm run validate      # schema + seed validation
npm run build         # SEO stubs + production build of the public site
```

Local development needs **no backend** - see Mock mode below. Full guide: `docs/LOCAL_DEVELOPMENT.md`.

## 5. Mock mode

By default on `localhost`, both apps run in **mock mode** (`VITE_API_MODE=mock`): the UI is driven by `shared/mock-public-content.js`, so you can develop and demo the entire experience - including the admin RBAC simulator - with no GAS, Cloudflare, or Git required.

## 6. Live mode

Set `VITE_API_MODE=live` and point the apps at deployed GAS web app URLs:

```
VITE_API_MODE=live
VITE_PUBLIC_API_URL=https://script.google.com/macros/s/XXXX/exec
VITE_ADMIN_API_URL=https://script.google.com/macros/s/YYYY/exec
```

Production GAS URLs are **never hardcoded** - they are injected via environment at build time.

## 6a. Admin access modes (Preview / OAuth / Restricted)

The admin portal (`admin-ui/`) resolves access from environment variables at build time — no code change is ever needed to switch modes. Precedence:

| Priority | Environment | Behavior |
|----------|-------------|----------|
| 1 | `VITE_ADMIN_PREVIEW=true` | **Preview Mode** — bypasses only the auth gate, auto-signs in as `super_admin`, loads the real dashboard with **full** create/update/delete/publish/save. Routing, sections, and RBAC are identical to production. |
| 2 | `VITE_GOOGLE_CLIENT_ID=<id>` (and preview off) | **Production** — real Google OAuth sign-in (Google Identity Services → ID token → GAS verification → Users tab → role → session). |
| 3 | none of the above | **Restricted** — clean access page: *"Admin access is restricted. Google authentication will be enabled before live admin use."* |

**Going live later requires configuration only, not code:**

1. Set `VITE_ADMIN_PREVIEW=false`
2. Set `VITE_GOOGLE_CLIENT_ID` to the OAuth client ID
3. Add authorized emails to the `Users` tab in the CONFIG_CONTENT workbook

```bash
# Preview (demo/dev before OAuth is ready)
VITE_ADMIN_PREVIEW=true

# Production (real auth)
VITE_ADMIN_PREVIEW=false
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
```



## 7. GAS deployment

`clasp login` and `clasp push` are **backend deployment steps only**. See `docs/GAS_DEPLOYMENT.md`. The admin `runSetup()` provisions the Drive folder, both Sheets workbooks, all tabs, and seed data.

## 8. Cloudflare deployment

`git push` is the **Cloudflare deployment step only** (Cloudflare Pages auto-builds on push). Content-only rebuilds are triggered from the admin via the Cloudflare Deploy Hook. See `docs/CLOUD_FLARE_SETUP.md`.

## 9. GA4 setup

GA4 is the **primary analytics source** for the admin dashboard (via the GA4 Data API). The measurement ID `G-WKLHEDHC5D` is a public identifier and ships in the page. See `docs/GA4_BIGQUERY_SETUP.md`.

## 10. BigQuery sandbox status

BigQuery is **optional / sandbox / future archive only**. The dashboards never query it; a health check confirms reachability. **`BigQuery.Tabledata.insertAll()` is never used** - the sandbox blocks streaming inserts. GA4's daily export is the only path into BigQuery.

## 11. Security and privacy rules

- No patient PII or clinical data is ever sent to GA4 or BigQuery (allowlisted events only).
- No clinical records are stored anywhere in this system - only logistical contact details for call backs and lab pickups.
- All Sheets writes use `LockService`; the code never uses `getActiveSheet()`.
- Email sending never blocks request saving.
- Secrets live only in Apps Script **Script Properties** and Cloudflare env - never in code, the frontend, or committed files.

Full policy: `docs/SECURITY.md`.

## 12. What not to commit

Never commit: `.env`, `.clasp.json`, `service-account.json`, `credentials.json`, `token.json`, the Cloudflare Deploy Hook URL, any API keys/tokens/private keys, or patient data exports. These are all covered by `.gitignore`. Before committing, run:

```bash
git status
git diff --cached
git check-ignore -v .env .clasp.json credentials.json token.json service-account.json
```

---

(c) JS Neurominds and Diagnostic Center. Built and maintained by TCGR Technologies (tcgr.in).
