/**
 * JS Neurominds V1 — public-site/assets/js/api.js
 * Single API surface for the public site. Routes to the local mock in dev,
 * or the deployed GAS Public API in production. UI code never branches on env.
 */
import { CONFIG } from './config.js';
import { mockApi } from './mock-api.js';

async function realGet(action, params = {}) {
  const url = new URL(CONFIG.PUBLIC_API_URL);
  url.searchParams.set('action', action);
  Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));
  const res = await fetch(url.toString(), { method: 'GET' });
  return res.json();
}

async function realPost(action, payload) {
  // text/plain avoids a CORS preflight against the GAS endpoint.
  const res = await fetch(CONFIG.PUBLIC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}

export const api = CONFIG.USE_MOCK ? mockApi : {
  config: () => realGet('config'),
  navigation: () => realGet('navigation'),
  doctors: () => realGet('doctors'),
  doctor: (slug) => realGet('doctor', { slug }),
  conditions: () => realGet('conditions'),
  condition: (slug) => realGet('condition', { slug }),
  treatments: () => realGet('treatments'),
  treatment: (slug) => realGet('treatment', { slug }),
  services: () => realGet('services'),
  labPackages: () => realGet('labPackages'),
  blogs: () => realGet('blogs'),
  blog: (slug) => realGet('blog', { slug }),
  faqs: () => realGet('faqs'),
  socialLinks: () => realGet('socialLinks'),
  testimonials: () => realGet('testimonials'),
  googleReviews: () => realGet('googleReviews'),
  featureFlags: () => realGet('featureFlags'),
  floatingCta: () => realGet('floatingCta'),
  callbackOptions: () => realGet('callbackOptions'),
  submitCallback: (payload) => realPost('submitCallback', payload),
  submitLabRequest: (payload) => realPost('submitLabRequest', payload),
  submitFeedback: (payload) => realPost('submitFeedback', payload)
};

// Small helper for query-string slugs on detail pages.
export function getSlugParam(name = 'slug') {
  return new URLSearchParams(location.search).get(name) || '';
}
