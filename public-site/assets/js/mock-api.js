/**
 * JS Neurominds V1 — public-site/assets/js/mock-api.js
 * Static content API. All public READS resolve from the content bundled at
 * build time (shared/content.js ← /content/**.json, edited in the admin CMS).
 * There is no runtime backend for content any more — pages are fast, work
 * offline-ish, and Google sees real HTML.
 *
 * WRITE paths (forms) are intentionally NOT implemented here: this module
 * never fabricates a success (audit JP-004). api.js routes writes to the
 * Apps Script endpoint when VITE_PUBLIC_API_URL is configured, otherwise the
 * forms show the honest "unavailable" notice with verified contact options.
 *
 * Exported as `mockApi` for backwards compatibility (tests, legacy admin-ui)
 * and as `contentApi` for new code.
 */
import {
  CLINIC_CONFIG, NAVIGATION, DOCTORS, CONDITIONS, TREATMENTS, SERVICES,
  LAB_PACKAGES, BLOGS, FAQS, CALLBACK_OPTIONS,
  SOCIAL_LINKS, TESTIMONIALS, GOOGLE_REVIEWS, FEATURE_FLAGS, FLOATING_CTA, PAGES, SEO
} from '../../../shared/content.js';
import { yes, published, approved, enabledSorted, byOrder } from '../../../shared/content-normalize.js';
import { unavailableEnvelope } from './submission-status.js';

const okEnv = (data) => ({ success: true, code: 200, data, error: null });
const findSlug = (rows, slug) => rows.find((r) => r.slug === slug) || null;
// Never print patient-entered values to the console; log only the field names.
const redactForLog = (payload) => ({ fields: Object.keys(payload || {}) });

/** Navigation filtered by feature flags, sorted by order. */
export function visibleNavigation(flags = FEATURE_FLAGS) {
  return NAVIGATION.filter((n) => {
    if (n.route === '/lab' && !yes(flags.public_lab_tests_enabled)) return false;
    if (n.route === '/knowledge' && !yes(flags.public_knowledge_enabled)) return false;
    if (n.route === '/testimonials' && flags.public_testimonials_enabled === false) return false;
    if (n.is_enabled === false) return false;
    return true;
  }).slice().sort(byOrder('order'));
}

export const contentApi = {
  async config() { return okEnv(CLINIC_CONFIG); },
  async navigation() { return okEnv(visibleNavigation()); },
  async featureFlags() { return okEnv(FEATURE_FLAGS); },
  async floatingCta() { return okEnv(enabledSorted(FLOATING_CTA)); },
  async page(id) { return okEnv(PAGES[id] || null); },
  async seo() { return okEnv(SEO); },

  async doctors() { return okEnv(published(DOCTORS)); },
  async doctor(slug) { return okEnv(findSlug(published(DOCTORS), slug)); },

  async conditions() { return okEnv(published(CONDITIONS)); },
  async condition(slug) { return okEnv(findSlug(published(CONDITIONS), slug)); },

  async treatments() { return okEnv(published(TREATMENTS)); },
  async treatment(slug) { return okEnv(findSlug(published(TREATMENTS), slug)); },

  async services() { return okEnv(published(SERVICES)); },
  async labPackages() { return okEnv(published(LAB_PACKAGES)); },

  async blogs() { return okEnv(published(BLOGS)); },
  async blog(slug) { return okEnv(findSlug(published(BLOGS), slug)); },

  async faqs() { return okEnv(published(FAQS).slice().sort(byOrder('order'))); },
  async callbackOptions() { return okEnv(CALLBACK_OPTIONS); },

  // Trust + brand modules (only enabled/approved records surface).
  async socialLinks() { return okEnv(enabledSorted(SOCIAL_LINKS, 'url')); },
  async testimonials() { return okEnv(approved(TESTIMONIALS).slice().sort(byOrder('display_order'))); },
  async googleReviews() {
    return okEnv({ summary: GOOGLE_REVIEWS.summary, reviews: approved(GOOGLE_REVIEWS.reviews) });
  },

  // Write paths: no persistence here. Never fabricate a success (audit JP-004).
  async submitCallback(payload) {
    console.info('[content-api] callback NOT saved — no write backend configured', redactForLog(payload));
    return unavailableEnvelope();
  },
  async submitLabRequest(payload) {
    console.info('[content-api] lab request NOT saved — no write backend configured', redactForLog(payload));
    return unavailableEnvelope();
  },
  async submitFeedback(payload) {
    console.info('[content-api] feedback NOT saved — no write backend configured', redactForLog(payload));
    return unavailableEnvelope();
  }
};

export const mockApi = contentApi;
