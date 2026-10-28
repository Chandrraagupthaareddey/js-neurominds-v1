# JS Neurominds V1

Production monorepo for **JS Neurominds and Diagnostic Center** — a psychiatry and mental-health clinic in Chandragiri, Tirupati. Built and maintained by **TCGR Technologies (tcgr.in)**.

This repository contains a premium **static** public website, a **git-based admin CMS** (every public page is editable), and a small Google Apps Script backend used only for the website forms — all on free tiers (Cloudflare Pages + GitHub + Apps Script), with strict privacy guarantees.

---

## 1. Project purpose

- Give patients and families a calm, trustworthy place to learn about the clinic, explore conditions and treatments, and reach out.
- Offer two clear booking paths: a **private call back** (handled by clinic staff) and a **confirmed appointment** (via the PWeNS booking partner).
- Give clinic staff a simple admin (admin.neurominds.in) where **everything on the public site** — clinic details, menu, page text, conditions, treatments, doctors, articles, FAQs, testimonials, feature switches, SEO — can be edited; each save publishes automatically via GitHub → Cloudflare.
- Keep analytics privacy-safe: no patient PII or clinical data ever reaches GA4 or BigQuery.

## 2. Architecture (high level)

```
Editor -> admin.neurominds.in (Sveltia CMS, in-browser)
              | commit /content/**.json
              v
          GitHub (main)  --push-->  Cloudflare Pages build (npm run build)
                                        | bakes content into HTML, pre-renders
                                        | /conditions/<slug>, /doctors/<slug>, ...
                                        v
Visitor -> https://neurominds.in (static, no runtime API for content)
              | Enquire / Callback / Lab forms only
              v
          GAS Public API (web app) --> Google Sheet log + email

Analytics: site -> GA4 (allowlisted, non-PII events)
```

Content never comes from Apps Script or Sheets at runtime any more: `shared/content.js` imports the JSON
under `/content` and Vite bundles it, while `scripts/build-pages.js` + `scripts/vite-plugin-content.js`
put the content directly into the HTML (fast first paint, fully indexable). Full detail in `docs/ARCHITECTURE.md`
and `docs/ADMIN_CMS.md`.

## 3. Folder structure

```
js-neurominds-v1/
  public-site/      Static premium website (Vite, vanilla JS, MPA)
  content/          ALL editable content (JSON) — the single source of truth
    clinic.json, navigation.json, social_links.json
    settings/       feature flags, floating buttons, google reviews, callback options, SEO
    pages/          per-page text + SEO (home, about, booking, ...)
    conditions/ treatments/ services/ doctors/ lab_packages/ blogs/ faqs/ testimonials/
  admin/            Git-based admin CMS (Sveltia): index.html + config.yml
  shared/           content.js (bundled content), render.js (shared HTML), normalize, markdown, constants
  scripts/          build-pages (pre-render + sitemap + robots), vite content plugin, validators
  gas-public-api/   Google Apps Script — website forms only (email + Sheet log)
  docs/             Architecture, deployment, admin CMS, SEO, security, ...
  admin-ui/, gas-admin-cms/   ARCHIVED (former Apps Script admin; not deployed)
  .env.example, wrangler.toml.example
```

## 4. Local setup

```bash
npm install
npm run dev:public    # http://127.0.0.1:5173  (pre-renders content pages, then Vite dev server)
npm run validate      # schema + content + CMS-config validation
npm test              # unit/contract tests
npm run build         # production build of the public site -> dist/ (includes dist/admin/)
npm run build:admin   # standalone admin build -> dist-admin/
```

Local development needs **no backend**: content is read from `/content`. Full guide: `docs/LOCAL_DEVELOPMENT.md`.

## 5. Content (the only data source)

All public content lives in `/content` as JSON and is edited in the admin (or any editor). `npm run build`
recombines the per-entry folders into `content/<type>.json` (`scripts/build-content-index.js`), pre-renders a
real HTML page per entry, and bakes settings/page text into every page. `VITE_API_MODE` no longer affects reads.

## 6. Forms backend (optional)

The Enquire/Feedback, Callback and Lab forms POST to the Apps Script web app when `VITE_PUBLIC_API_URL` is set
(`VITE_API_MODE=live`). Without it the forms show an honest "submission unavailable" notice with the clinic's
verified Call/WhatsApp options — they never fake a success. Production URLs are **never hardcoded**.

## 6a. Admin access

`admin/` is the git-based CMS. Sign-in is with the clinic's GitHub account (token, or the optional
free OAuth Worker). Setup, roles and daily use: **`docs/ADMIN_CMS.md`**.

## 7. GAS deployment

Only `gas-public-api/` (forms) is still deployed. `clasp login` and `clasp push` are backend deployment steps only. See `docs/GAS_DEPLOYMENT.md`. `gas-admin-cms/` is archived.

## 8. Cloudflare deployment

`git push` (including every admin save) is the **only** deployment step: Cloudflare Pages auto-builds on push. No deploy hook is needed. See `docs/CLOUD_FLARE_SETUP.md`.

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
