# Cloudflare Pages setup (frontend deploy)

`git push` is the **only** Cloudflare deployment step. Cloudflare Pages auto-builds on push.

## Project settings
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** repository root
- Node version: 18+

The admin portal can be deployed as a second Pages project (build `npm run build:admin`, output `dist-admin`) or served behind an access-restricted path.

## Environment variables (Cloudflare dashboard)
Set production values here (NOT in `.env`):
```
VITE_API_MODE=live
VITE_ENV=production
VITE_PUBLIC_API_URL=<public GAS /exec URL>
VITE_ADMIN_API_URL=<admin GAS /exec URL>
VITE_GA4_MEASUREMENT_ID=G-WKLHEDHC5D
```

## Deploy Hook (content sync)
1. In Cloudflare Pages → Settings → Builds & deployments → **Deploy hooks**, create a hook (e.g. `content-sync`).
2. Copy the hook URL.
3. Store it as a **secret** in the Admin CMS Script Properties under `CLOUDFLARE_DEPLOY_HOOK_URL`.
4. Never put the hook URL in code, `.env`, or any committed file.

When an admin clicks **Sync approved content**, the CMS calls this hook; Cloudflare rebuilds, and `scripts/build-stubs.js` regenerates SEO stubs + the sitemap from approved content.

## Custom domain
Map `neurominds.in` to the Pages project in Cloudflare DNS.
