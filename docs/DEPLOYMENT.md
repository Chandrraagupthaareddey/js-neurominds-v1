# Deployment (phased)

Deployment is intentionally phased. Local testing requires no backend, Cloudflare, or Git.

## Phase 1 - Local mock test
```bash
npm install
npm run validate
npm run dev:public   # http://localhost:5173
npm run dev:admin    # http://localhost:5174
npm run build
```
Review the full experience in mock mode (including the admin RBAC simulator).

## Phase 2 - GAS DEV deploy/test
1. `clasp login`.
2. Push `gas-public-api` and `gas-admin-cms` (see `docs/GAS_DEPLOYMENT.md`).
3. Run `runSetup()` once in the Admin CMS to provision the database + seed data.
4. Set Script Properties (workbook IDs auto-set; add `CLOUDFLARE_DEPLOY_HOOK_URL` later).
5. Deploy both as Web apps; copy the `/exec` URLs.

## Phase 3 - Connect local UI to GAS DEV
Create `.env`:
```
VITE_API_MODE=live
VITE_ENV=dev
VITE_PUBLIC_API_URL=<public /exec>
VITE_ADMIN_API_URL=<admin /exec>
```
Re-run the dev servers and verify live reads/writes against DEV.

## Phase 4 - Git push / Cloudflare preview
1. Push to a branch; Cloudflare Pages builds a preview.
2. Set Cloudflare env vars (production GAS URLs).
3. Verify the preview deployment.

## Phase 5 - Production
1. Merge to `main` → Cloudflare production build.
2. Configure the Cloudflare Deploy Hook and store its URL in Script Properties.
3. Map `neurominds.in`.
4. Run the go-live checklist (below).

## Go-live checklist (essentials)
- [ ] `runSetup()` completed; both workbooks + 35 tabs exist
- [ ] Users/roles seeded; super admin can sign in
- [ ] Public API + Admin CMS deployed as Web apps
- [ ] GA4 Data API enabled; dashboard shows data
- [ ] BigQuery health check returns reachable (optional)
- [ ] Cloudflare Deploy Hook stored in Script Properties
- [ ] Content reviewed and published from the CMS
- [ ] `npm run build` clean; sitemap + stubs generated
- [ ] No secrets committed (`git check-ignore` verified)
- [ ] PWeNS booking URL verified
