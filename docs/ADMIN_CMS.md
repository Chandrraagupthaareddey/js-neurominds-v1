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

## One-time setup

### 1. A GitHub account for the clinic (free)

Editors don't need personal GitHub accounts. Create **one** account for the clinic
(e.g. with `jsneurominds5@gmail.com`) at https://github.com/signup, then — signed in as the
repo owner `Chandrraagupthaareddey` — go to the repo → **Settings → Collaborators → Add people**
and add that account with **Write** access. Accept the invitation from the clinic account's email.

### 2. Sign-in method

**Option A — "Sign in with Token" (default, zero infrastructure)**

1. Signed in to GitHub as the clinic account, open
   https://github.com/settings/personal-access-tokens/new
2. Token name: `JS Neurominds admin`. Expiration: 1 year (set a reminder).
   Repository access: **Only select repositories → js-neurominds-v1**.
   Permissions → Repository permissions: **Contents: Read and write**, **Pull requests: Read and write**.
3. Generate, copy the token.
4. Open https://admin.neurominds.in → **Sign in with Token** → paste. The browser remembers it
   (per device). Repeat once per device/browser the clinic uses.

**Option B — "Sign in with GitHub" button (nicer for staff, still free, ~10 minutes)**

1. Deploy the official authenticator Worker to your Cloudflare account with one click:
   https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fsveltia%2Fsveltia-cms-auth
   Note the Worker URL, e.g. `https://sveltia-cms-auth.<subdomain>.workers.dev`.
2. GitHub → https://github.com/settings/applications/new →
   Homepage `https://admin.neurominds.in`, **Authorization callback URL** `<WORKER_URL>/callback`.
   Copy the Client ID; generate and copy a Client Secret.
3. Cloudflare → Workers → `sveltia-cms-auth` → Settings → Variables:
   `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (encrypt), `ALLOWED_DOMAINS` = `admin.neurominds.in, neurominds.in`.
4. In `admin/config.yml` set:
   ```yaml
   backend:
     ...
     base_url: https://sveltia-cms-auth.<subdomain>.workers.dev
     auth_methods: [oauth, token]
   ```
   Commit → the login page now shows **Sign in with GitHub**.

### 3. Cloudflare Pages

The admin is included in the public build at `dist/admin/`, so **`https://neurominds.in/admin/`
works as soon as the main site deploys.** For the `admin.neurominds.in` subdomain either:

- **Simplest:** in the *existing* Pages project add the custom domain `admin.neurominds.in` too, and
  add a redirect rule (Cloudflare → Rules → Redirect Rules) `admin.neurominds.in/` → `https://neurominds.in/admin/`; or
- **Separate project:** create a Pages project from the same repo with
  **Build command** `npm run build:admin`, **Output directory** `dist-admin`, custom domain `admin.neurominds.in`.
  (If an old project for `admin-ui` exists, just change its build command/output to these.)

Main site project settings stay: build `npm run build`, output `dist`, Node 18+.
Environment variables needed (Production): `VITE_API_MODE=live`, `VITE_PUBLIC_API_URL=<Apps Script forms /exec URL>`
(only for the Enquire/Callback/Lab forms), `VITE_GA4_MEASUREMENT_ID=G-WKLHEDHC5D`. Nothing else.

## Daily use

1. Open https://admin.neurominds.in (or https://neurominds.in/admin/), sign in.
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

The former Apps Script admin (`gas-admin-cms/`, `admin-ui/`) is kept in the repo as an archive and is
no longer deployed; `gas-public-api/` is still used **only** to email/log the website forms.
