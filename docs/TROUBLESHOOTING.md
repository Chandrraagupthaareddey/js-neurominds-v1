# Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Admin shows "not authorized" | Google account not in Users tab or not active | Add the account to Users (super admin) with an active status |
| Dashboard charts empty | GA4 Data API not enabled / no property access | Enable Analytics Data API; grant the deploying account access to the GA4 property |
| "WORKBOOK_ID not set" error | `runSetup()` not run, or Script Properties missing | Run `runSetup()`; copy IDs into both projects' Script Properties |
| Content sync does nothing | Deploy hook URL not configured | Set `CLOUDFLARE_DEPLOY_HOOK_URL` in Admin CMS Script Properties |
| Callback saved but no email | MailApp quota exhausted | Non-blocking by design; check System Health + Email_Logs. Request is still saved |
| Stubs/sitemap missing after build | build-stubs source empty | In live mode set `STUBS_SOURCE=live` and `PUBLIC_API_URL`; ensure content is published |
| CORS error on submit | Content-Type triggered preflight | Frontend posts `text/plain` by design; do not change to `application/json` |
| Build fails on a page | top-level `await` in inline module script | Wrap inline scripts in `(async () => { ... })()` |
| Shared import 404 in dev | Vite fs.allow too narrow | Configs already allow repo root; restart dev server |

## Health checks
- Public API: `GET <public /exec>?action=health`
- Admin: System Health panel (also runs the BigQuery reachability check)
