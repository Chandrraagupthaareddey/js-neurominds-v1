# Security and privacy

This repository may become public. These rules are non-negotiable.

## 1. Files that must NEVER be committed
- `.env` and any `.env.*` (except `.env.example`)
- `.clasp.json`, `.clasprc.json`, any `*.clasp.json` (except `.clasp.example.json`)
- `service-account.json`, `credentials.json`, `token.json`, `*.key`, `*.pem`, `*.p12`, `*.secret.json`
- Real `wrangler.toml` (only `wrangler.toml.example` is committed)
- The Cloudflare Deploy Hook URL, any API keys, OAuth tokens, refresh tokens, private keys
- Patient data exports (`exports/`, `backups/`, `*.csv`, `*.xlsx`, ...)
- `node_modules/`, build output, generated SEO stubs, `.DS_Store`

All of the above are covered by `.gitignore`.

## 2. Using `.env.example`
Copy it to `.env` for local overrides. Only **non-secret**, public-safe `VITE_*` values belong in any env file, because Vite exposes them to browser JavaScript:
```
VITE_API_MODE=mock
VITE_ENV=local
VITE_PUBLIC_API_URL=
VITE_ADMIN_API_URL=
VITE_GA4_MEASUREMENT_ID=G-WKLHEDHC5D
```
**Never** put these in frontend/env: `CLOUDFLARE_DEPLOY_HOOK_URL`, `PWENS_API_KEY`, `GEMINI_API_KEY`, `SERVICE_ACCOUNT_JSON`, `GOOGLE_PRIVATE_KEY`, `OAUTH_REFRESH_TOKEN`, `ADMIN_SECRET`.

## 3. Using `.clasp.example.json`
Copy to `.clasp.json` (gitignored) and paste your Apps Script `scriptId`:
```json
{ "scriptId": "PASTE_SCRIPT_ID_HERE", "rootDir": "." }
```

## 4. Where to store secrets
- **Apps Script Script Properties** — workbook IDs, `CLOUDFLARE_DEPLOY_HOOK_URL`, any API keys used server-side.
- **Cloudflare environment/secret settings** — production `VITE_*` URLs (non-secret) and any build-time secrets.
- **GitHub Actions secrets** — only if CI is added later.
- **Local machine files ignored by Git** — `.env`, `.clasp.json`.

## 5. Pre-commit checks
```bash
git status
git diff --cached
git check-ignore -v .env .clasp.json credentials.json token.json service-account.json
```
The last command should print a matching `.gitignore` rule for each file (proving they are ignored).

## 6. Application-level privacy
- Allowlisted, non-PII GA4 events only; PII blocklist enforced by `sanitizeGa4Params()`.
- No clinical data is stored anywhere — only logistical contact details.
- Admin is Google-only sign in; every request re-validates the active user against the Users tab and re-checks role permissions server-side.
- All Sheets writes use `LockService`; `getActiveSheet()` is never used.
- Email sending is non-blocking and can never lose a saved request.

## 7. Do not expose secrets in docs/logs/screenshots
Generated docs, READMEs, and logs in this repo intentionally contain no real secrets. Keep it that way.
