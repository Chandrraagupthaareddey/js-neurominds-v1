/**
 * JS Neurominds V1 — scripts/validate-seed.js
 * Validates the seed/mock content the UIs and GAS setup rely on:
 *   - unique slugs per content type
 *   - valid status values
 *   - GA4 event + param allowlists contain no PII keys
 *   - default users map to known roles
 *
 * Run: npm run validate  (this is the second half)
 */
import {
  CONDITIONS, TREATMENTS, SERVICES, LAB_PACKAGES, BLOGS, DOCTORS
} from '../shared/mock-public-content.js';
import {
  GA4_EVENTS, GA4_ALLOWED_PARAMS, PII_BLOCKLIST,
  CONTENT_STATUSES, DEFAULT_USERS, CONCERN_CATEGORIES
} from '../shared/constants.js';
import { ROLES } from '../shared/permissions.js';
import { yes, faqList, list } from '../shared/content-normalize.js';
import { FAQS, TESTIMONIALS, SOCIAL_LINKS, NAVIGATION, FEATURE_FLAGS, PAGES } from '../shared/content.js';

let errors = 0;
const fail = (m) => { errors++; console.error('  ✗', m); };

console.log('Validating seed content…');

function checkSlugs(rows, name) {
  const slugs = rows.map((r) => r.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length) fail(`${name}: duplicate slugs ${[...new Set(dupes)].join(', ')}`);
  rows.forEach((r) => {
    if (!r.slug || !/^[a-z0-9-]+$/.test(r.slug)) fail(`${name}: bad slug "${r.slug}"`);
    if (r.status && !CONTENT_STATUSES.includes(r.status)) fail(`${name}: invalid status "${r.status}" on ${r.slug}`);
  });
}

checkSlugs(CONDITIONS, 'Conditions');
checkSlugs(TREATMENTS, 'Treatments');
checkSlugs(SERVICES, 'Services');
checkSlugs(LAB_PACKAGES, 'Lab_Packages');
checkSlugs(BLOGS, 'Blogs');
checkSlugs(DOCTORS, 'Doctors');

// GA4 guardrail: no event name or allowed param may be a PII key.
GA4_ALLOWED_PARAMS.forEach((p) => {
  if (PII_BLOCKLIST.includes(p)) fail(`GA4 allowed param "${p}" is on the PII blocklist`);
});
if (GA4_EVENTS.length !== new Set(GA4_EVENTS).size) fail('Duplicate GA4 event names');
if (GA4_ALLOWED_PARAMS.length !== new Set(GA4_ALLOWED_PARAMS).size) fail('Duplicate GA4 allowed params');

// Default users map to known roles.
DEFAULT_USERS.forEach((u) => {
  if (!ROLES.includes(u.role_key)) fail(`Default user ${u.email} has unknown role ${u.role_key}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) fail(`Default user has invalid email ${u.email}`);
});

// At least one super admin must exist.
if (!DEFAULT_USERS.some((u) => u.role_key === 'super_admin')) fail('No super_admin in default users');

// Concern categories non-empty and unique.
if (CONCERN_CATEGORIES.length !== new Set(CONCERN_CATEGORIES).size) fail('Duplicate concern categories');

// Emergency conditions must carry the emergency flag for safe rendering.
const selfHarm = CONDITIONS.find((c) => c.slug === 'self-harm-thoughts');
if (selfHarm && !yes(selfHarm.is_emergency)) fail('self-harm-thoughts must be flagged is_emergency=true');

// CMS content sanity (git CMS writes typed JSON; the site also tolerates legacy strings).
CONDITIONS.forEach((c) => {
  faqList(c.faqs).forEach((f) => { if (!f.question || !f.answer) fail(`Conditions: empty FAQ on ${c.slug}`); });
  if (c.faqs && !Array.isArray(c.faqs) && typeof c.faqs !== 'string') fail(`Conditions: faqs must be a list on ${c.slug}`);
  if (!c.one_line_summary) fail(`Conditions: missing one_line_summary on ${c.slug}`);
  if (c.seo_title && c.seo_title.length > 70) console.warn(`  ! Conditions: seo_title > 70 chars on ${c.slug}`);
  if (c.seo_description && c.seo_description.length > 165) console.warn(`  ! Conditions: seo_description > 165 chars on ${c.slug}`);
});
FAQS.forEach((f) => { if (!f.question || !f.answer) fail(`FAQs: empty question/answer (${f.faq_id})`); });
TESTIMONIALS.forEach((t) => { if (!['pending', 'approved'].includes(t.status)) fail(`Testimonials: invalid status "${t.status}" (${t.testimonial_id})`); if (Number(t.rating) < 1 || Number(t.rating) > 5) fail(`Testimonials: rating out of range (${t.testimonial_id})`); });
SOCIAL_LINKS.forEach((s) => { if (yes(s.is_enabled) && !s.url) fail(`Social links: ${s.platform} is enabled but has no url`); });
NAVIGATION.forEach((n) => { if (!n.label || !n.route || !n.route.startsWith('/')) fail(`Navigation: bad entry ${JSON.stringify(n)}`); });
Object.entries(PAGES).forEach(([id, p]) => { if (!p.seo_title || !p.seo_description) fail(`Pages: ${id}.json needs seo_title and seo_description`); });
Object.values(FEATURE_FLAGS).forEach((v, i) => { if (typeof v !== 'boolean') fail(`Feature flags: value #${i} must be true/false`); });

console.log('');
if (errors) {
  console.error(`Seed validation FAILED — ${errors} error(s).`);
  process.exit(1);
}
console.log('Seed validation passed — slugs unique, statuses valid, GA4 guardrails clean, users mapped.');
