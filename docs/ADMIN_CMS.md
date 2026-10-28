# Admin CMS (admin.neurominds.in) — setup & daily use

The admin is a **git-based CMS** ([Sveltia CMS](https://sveltiacms.app), open source, free).
It runs entirely in the browser: every "Save" becomes a commit in the GitHub repo
`Chandrraagupthaareddey/js-neurominds-v1` → Cloudflare Pages rebuilds → the change is live
on https://neurominds.in in about 2 minutes. No database, no server, nothing to pay for.

```
Editor (browser) ──save──▶ GitHub (main branch, /content/**.json)
                                   │  push webhook (automatic)
                                   ▼
                         Cloudflare Pages build (npm run build)
                                   │
                                   ▼
                         https://neurominds.in (static, pre-rendered)
```

## What can be edited

| Admin section | What it changes on the site |
|---|---|
| **Site Settings → Clinic details** | Name, tagline, phone, WhatsApp, email, address, hours, Google Maps link/embed, PWeNS URL, header button label, emergency bar text, footer credit, logo & share image |
| **Site Settings → Navigation menu** | Menu items, their order, show/hide |
| **Site Settings → Feature switches** | Show/hide Lab Tests, Callback form, Testimonials, Google reviews, Knowledge, floating buttons, emergency bar |
| **Site Settings → Floating buttons** | Call / WhatsApp / Enquire buttons, labels, numbers, pre-filled WhatsApp text |
| **Site Settings → Social links** | Footer icons (Instagram, WhatsApp, Google, YouTube, Facebook, LinkedIn) |
| **Site Settings → Google reviews block** | Rating, review count, highlighted reviews |
| **Site Settings → Callback form options** | Dropdown choices on the callback form |
| **Site Settings → SEO defaults** | Default description, share image, Google/Bing verification codes, opening hours, coordinates |
| **Page Text** | Every headline, intro paragraph and button label on Home, About, Booking, Contact, Emergency, Conditions, Treatments, Services, Doctors, Knowledge, FAQ, Lab, Testimonials + each page's SEO title/description |
| **Conditions / Treatments / Services / Doctors / Lab Packages** | The cards and detail pages (one page per entry at `/conditions/<slug>` etc.) |
| **Knowledge Articles** | Articles with Markdown body, cover image, date |
| **FAQs** | FAQ page (also emitted as FAQ structured data for Google) |
| **Testimonials** | Approved testimonials shown on the site |

Anything saved with **Status = Draft** (or Testimonial = Pending) is kept in the repo but not shown on the site.

## One-time setup — Google sign-in with email roles (free)

```
Editor ──Sign in with Google──▶ admin.neurominds.in (Admin Gateway Worker)
                                   ├─ checks email → role (super_admin / admin)
                                   ├─ serves the CMS UI
                                   └─ forwards CMS requests to GitHub using ONE server-held token
```

Who can sign in is just two lists on the Worker (`cloudflare/admin-gateway/wrangler.toml`):

| Role | Emails | Can edit |
|---|---|---|
| **super_admin** | tcgr.8553665381@gmail.com | everything |
| **admin** | jsneurominds5@gmail.com, js@neurominds.in | all content, page text, clinic details, buttons, social links, reviews — but **not** Feature switches, Navigation menu or SEO defaults |

To add/remove a person: edit `SUPER_ADMIN_EMAILS` / `ADMIN_EMAILS` in `wrangler.toml`, run `npm run deploy:gateway`. Takes effect immediately (roles are checked on every request). Every commit message records who made the change (`— by Name <email>`).

### Step 1 — Google OAuth client (5 min, Google Cloud Console, free)
1. https://console.cloud.google.com → create project **JS Neurominds Admin**.
2. **APIs & Services → OAuth consent screen**: External → App name `JS Neurominds Admin`, support email `jsneurominds5@gmail.com`, developer email yours → Save. Scopes: none to add (email/profile are default). Under **Audience**, click **Publish app** (these scopes need no Google review).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → *Web application* → Name `admin.neurominds.in` → **Authorized redirect URIs**: `https://admin.neurominds.in/callback` → Create.
4. Copy the **Client ID** and **Client secret**.

### Step 2 — Free the hostname
Cloudflare → Workers & Pages → the Pages project(s) → **Custom domains**: if `admin.neurominds.in` is attached to any project, **remove** it (the Worker will own it). Keep `neurominds.in` / `www` as they are.

### Step 3 — Deploy the Admin Gateway Worker (one command + 4 secrets)
```bash
cd cloudflare/admin-gateway
npx wrangler login                       # opens the browser once
npx wrangler deploy                      # creates the Worker + admin.neurominds.in
npx wrangler secret put GOOGLE_CLIENT_ID      # paste from Step 1
npx wrangler secret put GOOGLE_CLIENT_SECRET  # paste from Step 1
npx wrangler secret put GITHUB_TOKEN          # the fine-grained GitHub token (Contents RW + Pull requests RW on js-neurominds-v1)
npx wrangler secret put SESSION_SECRET        # any long random string, e.g. output of: openssl rand -hex 32
```
The GitHub token is created once, by the repo owner, at https://github.com/settings/personal-access-tokens/new
(Only select repositories → js-neurominds-v1; Permissions: Contents = Read and write, Pull requests = Read and write).
Nobody else ever sees or needs it. Set a 1-year expiry and a calendar reminder to rotate it (`wrangler secret put GITHUB_TOKEN` again).

### Step 4 — Publish the CMS config
`git push origin main` (the `admin/config.yml` already points at the gateway). Cloudflare Pages rebuilds `neurominds.in/admin/`, which the Worker serves at `admin.neurominds.in`.

### Step 5 — Test
Open https://admin.neurominds.in → **Sign in with Google** → pick the account → the editor opens with your name top-right.
An email that is not in either list sees: *"… is not an admin of this website."*

Troubleshooting:
- `redirect_uri_mismatch` from Google → the redirect URI in Step 1 must be exactly `https://admin.neurominds.in/callback`.
- "GOOGLE_CLIENT_ID is not configured" → the secret was not set; re-run `wrangler secret put`.
- Saves fail with 401/403 from GitHub → the GITHUB_TOKEN expired or lacks Contents RW; create a new one and `wrangler secret put GITHUB_TOKEN`.
- Admin sees "Your role (admin) cannot change …" → that file is super-admin-only by design.
- `https://admin.neurominds.in/healthz` should return `{"ok":true}`; `/api/me` shows your session/role after login.

## Daily use

1. Open https://admin.neurominds.in → **Sign in with Google** with an allowed email.
2. Pick a section, edit, **Save**. The top bar shows the deploy status; ~2 minutes later refresh the site.
3. **Images**: use the image fields (doctor photo, article cover, logo). They are stored in
   `public-site/assets/img/` in the repo. Keep them small (≤ 300 KB; square 600×600 for doctor photos).
4. **New condition/treatment/article**: *Conditions → New*. Fill *Slug* (lowercase-with-dashes) — it is the URL.
5. **Hide something without deleting**: set Status → Draft.
6. **Undo**: every change is a git commit. In GitHub → Commits you can see who changed what and revert.

## Local preview (developers)

```bash
npm install
npm run dev:public     # http://127.0.0.1:5173  (pre-renders pages first)
```
Edit JSON under `content/` and the dev server reloads. To run the admin locally against the
local repo, open http://127.0.0.1:5173/admin/ and choose **Work with Local Repository** in Sveltia.

## Where things live

```
admin/config.yml        ← the CMS definition (fields, labels, hints)
content/clinic.json     ← clinic details & header/footer
content/navigation.json, content/social_links.json
content/settings/*.json ← feature flags, floating buttons, reviews, callback options, SEO
content/pages/*.json    ← page text + per-page SEO
content/<type>/*.json   ← one file per condition/treatment/doctor/service/package/article/faq/testimonial
scripts/build-pages.js  ← pre-renders /conditions/<slug> etc. + sitemap + robots
scripts/vite-plugin-content.js ← bakes content into the static pages at build
```

cloudflare/admin-gateway/ ← Google sign-in + roles + GitHub proxy Worker (wrangler.toml holds the email lists)

The former Apps Script admin (`gas-admin-cms/`, `admin-ui/`) is kept in the repo as an archive and is
no longer deployed; `gas-public-api/` is still used **only** to email/log the website forms.
