/**
 * JS Neurominds V1 — public-site/assets/js/mock-api.js
 * Local mock of the GAS Public API. Imports the shared dataset so the public
 * site and admin UI always agree. Returns the same { success, data } envelope
 * the real API uses. Adds small latency to mimic the network.
 */
import {
  CLINIC_CONFIG, NAVIGATION, DOCTORS, CONDITIONS, TREATMENTS, SERVICES,
  LAB_PACKAGES, BLOGS, FAQS, CALLBACK_OPTIONS
} from '../../../shared/mock-public-content.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const okEnv = (data) => ({ success: true, code: 200, data, error: null });

const byStatus = (rows) => rows.filter((r) => r.status === 'published');
const findSlug = (rows, slug) => rows.find((r) => r.slug === slug) || null;

export const mockApi = {
  async config() { await wait(40); return okEnv(CLINIC_CONFIG); },
  async navigation() { await wait(30); return okEnv(NAVIGATION); },

  async doctors() { await wait(60); return okEnv(byStatus(DOCTORS)); },
  async doctor(slug) { await wait(50); return okEnv(findSlug(DOCTORS, slug)); },

  async conditions() { await wait(60); return okEnv(byStatus(CONDITIONS)); },
  async condition(slug) { await wait(50); return okEnv(findSlug(CONDITIONS, slug)); },

  async treatments() { await wait(60); return okEnv(byStatus(TREATMENTS)); },
  async treatment(slug) { await wait(50); return okEnv(findSlug(TREATMENTS, slug)); },

  async services() { await wait(50); return okEnv(byStatus(SERVICES)); },
  async labPackages() { await wait(50); return okEnv(byStatus(LAB_PACKAGES)); },

  async blogs() { await wait(60); return okEnv(byStatus(BLOGS)); },
  async blog(slug) { await wait(50); return okEnv(findSlug(BLOGS, slug)); },

  async faqs() { await wait(40); return okEnv(byStatus(FAQS)); },
  async callbackOptions() { await wait(30); return okEnv(CALLBACK_OPTIONS); },

  // Write paths echo a generated id, mirroring real API behaviour.
  async submitCallback(payload) {
    await wait(180);
    const id = 'cb_' + Math.random().toString(36).slice(2, 8);
    console.info('[mock] callback saved', id, payload);
    return okEnv({ callback_id: id, internal_email_status: 'sent', patient_email_status: payload.patient_email ? 'sent' : 'skipped' });
  },
  async submitLabRequest(payload) {
    await wait(180);
    const id = 'lab_' + Math.random().toString(36).slice(2, 8);
    console.info('[mock] lab request saved', id, payload);
    return okEnv({ lab_request_id: id });
  },
  async submitFeedback(payload) {
    await wait(150);
    const id = 'fb_' + Math.random().toString(36).slice(2, 8);
    console.info('[mock] feedback saved', id, payload);
    return okEnv({ feedback_id: id });
  }
};
