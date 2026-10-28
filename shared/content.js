/**
 * JS Neurominds V1 — shared/content.js
 * THE content source for the public website. Everything under /content is
 * edited in the admin CMS (admin.neurominds.in), committed to GitHub, and baked
 * into the site at build time by Vite/Cloudflare Pages. No runtime API is
 * needed to read content — pages ship with their content already inside.
 *
 * Collections (folders of one JSON file per entry) are recombined into the
 * array files by scripts/build-content-index.js, which runs before every build.
 * Settings and page copy are single JSON files.
 */
import CLINIC_CONFIG from '../content/clinic.json' with { type: 'json' };
import NAVIGATION_JSON from '../content/navigation.json' with { type: 'json' };
import DOCTORS from '../content/doctors.json' with { type: 'json' };
import CONDITIONS from '../content/conditions.json' with { type: 'json' };
import TREATMENTS from '../content/treatments.json' with { type: 'json' };
import SERVICES from '../content/services.json' with { type: 'json' };
import LAB_PACKAGES from '../content/lab_packages.json' with { type: 'json' };
import BLOGS from '../content/blogs.json' with { type: 'json' };
import FAQS from '../content/faqs.json' with { type: 'json' };
import TESTIMONIALS from '../content/testimonials.json' with { type: 'json' };
import SOCIAL_LINKS_JSON from '../content/social_links.json' with { type: 'json' };

import FEATURE_FLAGS from '../content/settings/feature_flags.json' with { type: 'json' };
import FLOATING_CTA_JSON from '../content/settings/floating_cta.json' with { type: 'json' };
import GOOGLE_REVIEWS_JSON from '../content/settings/google_reviews.json' with { type: 'json' };
import CALLBACK_OPTIONS from '../content/settings/callback_options.json' with { type: 'json' };
import SEO from '../content/settings/seo.json' with { type: 'json' };

import PAGE_HOME from '../content/pages/home.json' with { type: 'json' };
import PAGE_ABOUT from '../content/pages/about.json' with { type: 'json' };
import PAGE_BOOKING from '../content/pages/booking.json' with { type: 'json' };
import PAGE_CONTACT from '../content/pages/contact.json' with { type: 'json' };
import PAGE_EMERGENCY from '../content/pages/emergency.json' with { type: 'json' };
import PAGE_CONDITIONS from '../content/pages/conditions.json' with { type: 'json' };
import PAGE_TREATMENTS from '../content/pages/treatments.json' with { type: 'json' };
import PAGE_SERVICES from '../content/pages/services.json' with { type: 'json' };
import PAGE_DOCTORS from '../content/pages/doctors.json' with { type: 'json' };
import PAGE_KNOWLEDGE from '../content/pages/knowledge.json' with { type: 'json' };
import PAGE_FAQ from '../content/pages/faq.json' with { type: 'json' };
import PAGE_LAB from '../content/pages/lab.json' with { type: 'json' };
import PAGE_TESTIMONIALS from '../content/pages/testimonials.json' with { type: 'json' };

// Single-file lists are stored as { items: [...] } so the CMS can edit them as a
// file collection (a bare top-level array cannot be edited there). Both shapes are accepted.
const items = (j) => (Array.isArray(j) ? j : (j && j.items) || []);
export const NAVIGATION = items(NAVIGATION_JSON);
export const SOCIAL_LINKS = items(SOCIAL_LINKS_JSON);

export {
  CLINIC_CONFIG, DOCTORS, CONDITIONS, TREATMENTS, SERVICES,
  LAB_PACKAGES, BLOGS, FAQS, TESTIMONIALS,
  FEATURE_FLAGS, CALLBACK_OPTIONS, SEO
};

// Floating CTA buttons (call / WhatsApp / enquire).
export const FLOATING_CTA = (FLOATING_CTA_JSON && FLOATING_CTA_JSON.items) || [];

// Google reviews: { summary, reviews } shape kept for existing consumers.
export const GOOGLE_REVIEWS = {
  summary: {
    rating: GOOGLE_REVIEWS_JSON.rating,
    review_count: GOOGLE_REVIEWS_JSON.review_count,
    profile_url: GOOGLE_REVIEWS_JSON.profile_url,
    write_review_url: GOOGLE_REVIEWS_JSON.write_review_url || GOOGLE_REVIEWS_JSON.profile_url
  },
  reviews: GOOGLE_REVIEWS_JSON.reviews || []
};

// Page copy keyed by page id (matches the HTML file name without .html;
// index.html -> "home").
export const PAGES = {
  home: PAGE_HOME, about: PAGE_ABOUT, booking: PAGE_BOOKING, contact: PAGE_CONTACT,
  emergency: PAGE_EMERGENCY, conditions: PAGE_CONDITIONS, treatments: PAGE_TREATMENTS,
  services: PAGE_SERVICES, doctors: PAGE_DOCTORS, knowledge: PAGE_KNOWLEDGE, faq: PAGE_FAQ,
  lab: PAGE_LAB, testimonials: PAGE_TESTIMONIALS
};
