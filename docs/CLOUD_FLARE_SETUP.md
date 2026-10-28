# Cloudflare Pages setup (frontend deploy)

`git push` is the **only** Cloudflare deployment step. Cloudflare Pages auto-builds on push.

## Project settings
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** repository root
- Node version: 18+

The admin CMS ships inside the public build at `/admin/` (so `https://neurominds.in/admin/` just works). For
`admin.neurominds.in` either add that custom domain to the same project + a redirect rule to `/admin/`, or deploy a
second Pages project from the same repo with build `npm run build:admin`, output `dist-admin`. Details: `docs/ADMIN_CMS.md`.

Clean URLs: Cloudflare Pages serves `about.html` at `/about` (and redirects `/about.html` → `/about`). The site now
links to and declares canonical clean URLs everywhere. `public-site/_headers` and `public-site/_redirects` are copied
into `dist/` (security headers, asset caching, redirects from the old `/p/...` stub URLs).

## Environment variables (Cloudflare dashboard)
Set production values here (NOT in `.env`):
```
VITE_API_MODE=live
VITE_ENV=production
VITE_PUBLIC_API_URL=<Apps Script forms /exec URL>   # only for Enquire/Callback/Lab form submissions
VITE_GA4_MEASUREMENT_ID=G-WKLHEDHC5D
```
(`VITE_ADMIN_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_ALLOWED_ADMIN_EMAILS` are no longer used.)

## Deploy Hook (no longer needed)
Content is committed to GitHub by the admin, so the normal push-triggered build publishes it. The former
"Sync approved content" deploy hook is obsolete; if one exists it can be deleted.

## Custom domain
Map `neurominds.in` to the Pages project in Cloudflare DNS.
