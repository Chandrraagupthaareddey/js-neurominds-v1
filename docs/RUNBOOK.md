# Runbook

> **Update (v2.0, Oct 2026):** the public site is now fully static — content is bundled from `/content/**.json`
> at build time and edited through the git-based admin CMS (`admin/`, see `docs/ADMIN_CMS.md`). Apps Script is used
> **only** by the website forms (`gas-public-api/`). `gas-admin-cms/` and `admin-ui/` are archived and not deployed.
> Sections below that describe Sheets-backed content reads or the Apps Script admin are historical.


The admin portal includes a live, editable runbook (Staff + Admin modes). This file is the source-of-record summary.

## Staff guide
- **Handle a callback:** Open Callback Desk -> pick request -> verify patient -> confirm preferred time -> Call/WhatsApp via the drawer buttons.
- **What to ask:** best time to reach, who the consult is for, clinic vs online, preferred doctor/time.
- **What not to ask:** diagnosis, symptoms in detail, current medication, psychiatric history. Never give clinical advice on the call.
- **Follow-up:** set status to "Follow-up required" with a short, non-clinical note.
- **Close/convert:** set Converted or Closed with a brief outcome note.
- **Lab inquiry:** confirm pickup area (~10 km of Chandragiri) and a workable time, then set Verified.

## Admin / system guide
- **Architecture:** Cloudflare Pages + two GAS web apps + two Sheets workbooks + GA4. BigQuery sandbox is archive-only.
- **Content publishing:** edit in CMS -> publish -> Sync approved content -> Cloudflare rebuilds stubs + sitemap.
- **Debug checklist:** System Health -> Email_Logs -> Cloudflare_Deployments -> Script Properties -> re-run health check.
- **Backups:** Super Admin runs a backup; both workbooks are copied to a dated Drive subfolder and logged.
- **Quota risks:** MailApp daily email quota (shown in System Health) and GAS execution limits. Email failures are non-blocking.
