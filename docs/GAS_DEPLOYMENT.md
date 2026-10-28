# GAS deployment (backend only)

> **Update (v2.0, Oct 2026):** the public site is now fully static — content is bundled from `/content/**.json`
> at build time and edited through the git-based admin CMS (`admin/`, see `docs/ADMIN_CMS.md`). Apps Script is used
> **only** by the website forms (`gas-public-api/`). `gas-admin-cms/` and `admin-ui/` are archived and not deployed.
> Sections below that describe Sheets-backed content reads or the Apps Script admin are historical.


`clasp login` and `clasp push` deploy the **backend** Apps Script projects. They are unrelated to Cloudflare/Git deployment of the frontend.

## One-time tooling
```bash
npm install -g @google/clasp
clasp login
```

## Public API
```bash
cd gas-public-api
cp .clasp.example.json .clasp.json     # paste your script ID (gitignored)
clasp push
```
Deploy as a **Web app**: execute as the deploying user, access *Anyone*. Copy the `/exec` URL → this becomes `VITE_PUBLIC_API_URL`.

## Admin CMS
```bash
cd gas-admin-cms
cp .clasp.example.json .clasp.json
clasp push
```
Enable the advanced services declared in `appsscript.json` (Analytics Data API, BigQuery, Drive) in the Apps Script project, plus in the linked Google Cloud project.

## First-run setup
In the Apps Script editor for the Admin CMS, run **`runSetup()`** once. It creates:
- Drive folder `JSNM_V1_DATABASE`
- Both Sheets workbooks with all tabs + headers
- Seed users, roles, permissions, system/analytics config, callback checklist + questions, 60 condition rows, service/lab drafts, runbook
- Script Properties with folder + workbook IDs

Then deploy the Admin CMS as a **Web app** and copy its `/exec` URL → `VITE_ADMIN_API_URL`.

## Required Script Properties
Set under **Project Settings → Script properties** (admin project):
- `CLOUDFLARE_DEPLOY_HOOK_URL` (secret — set manually, never committed)
- Workbook/folder IDs (set automatically by `runSetup()`)

The Public API project needs `CONFIG_CONTENT_WORKBOOK_ID` and `OPERATIONS_AUDIT_WORKBOOK_ID` (copy the values that `runSetup()` logged).

## Re-provisioning
`runSetup()` refuses to run twice. To re-provision into fresh workbooks, run `resetSetupProperties()` first (old workbooks remain in Drive).
