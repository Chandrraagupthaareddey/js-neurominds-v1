/**
 * JS Neurominds V1 — shared/route-map.js
 * Canonical route definitions for the public site. Used by navigation,
 * sitemap generation, and the SEO stub builder so routes stay consistent.
 */

// Top-level static pages.
export const STATIC_ROUTES = [
  { path: '/', file: 'index.html', label: 'Home', in_nav: true },
  { path: '/about', file: 'about.html', label: 'About', in_nav: true },
  { path: '/doctors', file: 'doctors.html', label: 'Doctors', in_nav: true },
  { path: '/conditions', file: 'conditions.html', label: 'Conditions', in_nav: true },
  { path: '/treatments', file: 'treatments.html', label: 'Treatments', in_nav: true },
  { path: '/services', file: 'services.html', label: 'Services', in_nav: true },
  { path: '/lab', file: 'lab.html', label: 'Lab Tests', in_nav: true },
  { path: '/knowledge', file: 'knowledge.html', label: 'Knowledge', in_nav: true },
  { path: '/faq', file: 'faq.html', label: 'FAQ', in_nav: true },
  { path: '/contact', file: 'contact.html', label: 'Contact', in_nav: true },
  { path: '/booking', file: 'booking.html', label: 'Book', in_nav: false },
  { path: '/emergency', file: 'emergency.html', label: 'Emergency Help', in_nav: false },
  { path: '/privacy', file: 'privacy.html', label: 'Privacy', in_nav: false },
  { path: '/terms', file: 'terms.html', label: 'Terms', in_nav: false },
  { path: '/medical-disclaimer', file: 'medical-disclaimer.html', label: 'Medical Disclaimer', in_nav: false }
];

// SEO-critical dynamic page types — each row of the source becomes a static stub
// at build time under /p/<type>/<slug>.html (see scripts/build-stubs.js).
export const STUB_TYPES = [
  { type: 'condition', api: 'conditions', detail: 'condition', dir: 'condition', label: 'Conditions', listFile: 'conditions', priority: 0.8 },
  { type: 'treatment', api: 'treatments', detail: 'treatment', dir: 'treatment', label: 'Treatments', listFile: 'treatments', priority: 0.8 },
  { type: 'doctor', api: 'doctors', detail: 'doctor', dir: 'doctor', label: 'Doctors', listFile: 'doctors', priority: 0.7 },
  { type: 'lab_package', api: 'labPackages', detail: 'lab', dir: 'lab_package', label: 'Lab Packages', listFile: 'lab', priority: 0.6 },
  { type: 'knowledge', api: 'blogs', detail: 'knowledge-detail', dir: 'knowledge', label: 'Knowledge', listFile: 'knowledge', priority: 0.6 }
];

export function navRoutes() {
  return STATIC_ROUTES.filter((r) => r.in_nav);
}
