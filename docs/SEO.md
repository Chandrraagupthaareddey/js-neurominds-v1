# SEO

## Strategy
SEO-critical pages (conditions, treatments, doctors, lab packages, blog) are pre-rendered as lightweight **static stubs** at build time, each with full metadata and structured data, while the interactive site hydrates the same content client-side.

## Stub generation
`scripts/build-stubs.js`:
- Source: mock content locally, or the GAS Public API in live mode (`STUBS_SOURCE=live`, `PUBLIC_API_URL=...`).
- Output: `public-site/p/<type>/<slug>.html` (gitignored; built at deploy time).
- Includes: title, meta description, canonical, Open Graph, Twitter card, JSON-LD (`MedicalWebPage` / `Physician` / `Article`), breadcrumb, and a first answer paragraph.
- Also writes `public-site/sitemap.xml` covering static pages + all stubs.

## Per-type JSON-LD
- Conditions/treatments -> `MedicalWebPage` with an `about` `MedicalCondition`.
- Doctors -> `Physician` with specialty + address.
- Blog -> `Article`.

## Refresh on publish
When content is approved and an admin clicks **Sync approved content**, the Cloudflare Deploy Hook triggers a rebuild, regenerating stubs + sitemap from the latest published content.

## Notes
- Keep `seo_title` and `seo_description` filled in the CMS; the SEO panel flags any missing fields.
- The sitemap should be submitted in Google Search Console once live.
