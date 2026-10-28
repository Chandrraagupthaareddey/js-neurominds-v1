# SEO

## Strategy
Every page ships **with its content in the HTML** (no JS needed for Google to read it):
- Static pages get their title/description/canonical/Open Graph/Twitter/JSON-LD from `content/pages/*.json`
  and `content/settings/seo.json` at build time (`scripts/vite-plugin-content.js`), and lists/cards/FAQs are
  pre-rendered into the page.
- Every condition, treatment, doctor and article becomes a **real page**: `/conditions/<slug>`,
  `/treatments/<slug>`, `/doctors/<slug>`, `/knowledge/<slug>` (`scripts/build-pages.js`), each with
  `MedicalWebPage` / `Physician` / `Article` JSON-LD, `BreadcrumbList`, and `FAQPage` when FAQs exist.
- Home carries `MedicalClinic` + `LocalBusiness` JSON-LD (address, phone, hours, map, profiles, lead physician).
- Clean canonical URLs (`/about`, not `/about.html`) matching what Cloudflare Pages actually serves.
- `sitemap.xml` (with `lastmod` from git) and `robots.txt` are generated on every build.
- Legacy `?slug=` shells (`/condition?slug=…`) are `noindex` and point visitors to the canonical pages; old
  `/p/<type>/<slug>.html` stub URLs 301-redirect (`public-site/_redirects`).

## Editing SEO in the admin
- **Site Settings → SEO defaults**: default description, share image, Google Search Console / Bing verification codes,
  opening hours, coordinates, official profile URLs.
- **Page Text → <page>**: SEO title (≤ 60 chars) and description (120–160 chars) per static page.
- **Conditions / Treatments / Doctors / Articles**: per-entry `SEO title` and `SEO description`; `npm run validate`
  warns when they are too long.

## After deploying
1. Google Search Console → add property `neurominds.in` → verify (paste the code in SEO defaults) → submit
   `https://neurominds.in/sitemap.xml`.
2. Bing Webmaster Tools: same with the Bing code.
3. Google Business Profile: keep name/address/phone identical to the site (NAP consistency).
4. Re-check with https://search.google.com/test/rich-results on a condition page and the home page.
