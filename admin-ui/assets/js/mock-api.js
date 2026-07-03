/**
 * JS Neurominds V1 — admin-ui/assets/js/mock-api.js
 * Local mock of the GAS Admin CMS API. Imports the shared dataset so the
 * admin UI and public site stay in sync. Returns the { success, data } envelope.
 */
import {
  CLINIC_CONFIG, DOCTORS, CONDITIONS, TREATMENTS, SERVICES, LAB_PACKAGES,
  BLOGS, FAQS, MOCK_CALLBACK_REQUESTS, MOCK_CALLBACK_CHECKLIST,
  MOCK_CALLBACK_QUESTIONS, MOCK_LAB_REQUESTS, MOCK_FEEDBACK, MOCK_GA4_SUMMARY,
  MOCK_HEALTH, MOCK_USERS, MOCK_PUBLISH_HISTORY,
  SOCIAL_LINKS, TESTIMONIALS, GOOGLE_REVIEWS, FEATURE_FLAGS, FLOATING_CTA, NAVIGATION
} from '../../../shared/mock-public-content.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (data) => ({ success: true, code: 200, data, error: null });

// Local mutable copies so the desk can update status during a session.
let callbacks = structuredClone(MOCK_CALLBACK_REQUESTS);
let labRequests = structuredClone(MOCK_LAB_REQUESTS);
let feedback = structuredClone(MOCK_FEEDBACK);
const statusHistory = {}; // callback_id -> [{status, note, at}]

export const adminApi = {
  async config() { await wait(30); return ok(CLINIC_CONFIG); },

  async dashboard() {
    await wait(80);
    const newCb = callbacks.filter((c) => c.status === 'new').length;
    const followups = callbacks.filter((c) => c.status === 'followup_required').length;
    const newLab = labRequests.filter((l) => l.status === 'new').length;
    return ok({
      kpis: {
        callbacks_total: callbacks.length, callbacks_new: newCb,
        followups, lab_new: newLab,
        pwens_clicks_7d: MOCK_GA4_SUMMARY.events.pwens_booking_click,
        feedback_pending: feedback.filter((f) => f.status === 'pending').length
      },
      ga4: MOCK_GA4_SUMMARY,
      recent_callbacks: callbacks.slice(0, 5)
    });
  },

  async callbacks() { await wait(60); return ok(callbacks); },
  async callbackChecklist() { await wait(30); return ok(MOCK_CALLBACK_CHECKLIST); },
  async callbackQuestions() { await wait(30); return ok(MOCK_CALLBACK_QUESTIONS); },
  async updateCallbackStatus(id, status, note) {
    await wait(120);
    const cb = callbacks.find((c) => c.callback_id === id);
    if (cb) cb.status = status;
    (statusHistory[id] = statusHistory[id] || []).push({
      status, note: note || '', at: new Date().toISOString().slice(0, 16).replace('T', ' ')
    });
    return ok({ callback_id: id, status, history: statusHistory[id] });
  },
  async callbackHistory(id) { await wait(30); return ok(statusHistory[id] || []); },

  async labRequests() { await wait(60); return ok(labRequests); },
  async updateLabStatus(id, status) {
    await wait(100);
    const lr = labRequests.find((l) => l.lab_request_id === id);
    if (lr) lr.status = status;
    return ok({ lab_request_id: id, status });
  },

  async content() {
    await wait(70);
    return ok({
      conditions: CONDITIONS, treatments: TREATMENTS, services: SERVICES,
      lab_packages: LAB_PACKAGES, blogs: BLOGS, faqs: FAQS
    });
  },
  async doctors() { await wait(50); return ok(DOCTORS); },
  async feedback() { await wait(50); return ok(feedback); },
  async updateFeedbackStatus(id, status) {
    await wait(80);
    const fb = feedback.find((f) => f.feedback_id === id);
    if (fb) fb.status = status;
    return ok({ feedback_id: id, status });
  },

  async health() { await wait(60); return ok(MOCK_HEALTH); },
  async publishHistory() { await wait(50); return ok(MOCK_PUBLISH_HISTORY); },
  async users() { await wait(40); return ok(MOCK_USERS); },

  // Simulated content sync -> Cloudflare deploy hook trigger.
  async syncContent() {
    await wait(400);
    return ok({ triggered: true, deploy_status: 'queued', at: new Date().toISOString().slice(0, 16).replace('T', ' ') });
  },

  // --- Admin foundation: website-content management (read views in V1) ---
  async socialLinks() { await wait(40); return ok(structuredClone(SOCIAL_LINKS)); },
  async testimonials() { await wait(40); return ok(structuredClone(TESTIMONIALS)); },
  async googleReviews() { await wait(40); return ok(structuredClone(GOOGLE_REVIEWS)); },
  async featureFlags() { await wait(30); return ok(structuredClone(FEATURE_FLAGS)); },
  async floatingCta() { await wait(30); return ok(structuredClone(FLOATING_CTA)); },
  async navigationItems() { await wait(30); return ok(structuredClone(NAVIGATION)); },
  async brandSettings() {
    await wait(30);
    return ok({
      logo_url: CLINIC_CONFIG.logo_url, footer_logo_url: CLINIC_CONFIG.footer_logo_url,
      favicon_url: '/assets/brand/favicon-32x32.png', social_preview_url: CLINIC_CONFIG.social_preview_url,
      alt_text: 'JS Neurominds and Diagnostic Center'
    });
  },
  async footerSettings() {
    await wait(30);
    return ok([
      { setting_key: 'footer_about', setting_value: 'Compassionate psychiatry, mental health, and diagnostic care.', is_enabled: 'YES', display_order: 1 },
      { setting_key: 'footer_attribution', setting_value: CLINIC_CONFIG.footer || 'Built and maintained by tcgr.in', is_enabled: 'YES', display_order: 2 },
      { setting_key: 'footer_show_map', setting_value: 'YES', is_enabled: 'YES', display_order: 3 }
    ]);
  }
};
