/* JS Neurominds — service worker (installable web app)
 * Strategy:
 *   - HTML pages: network first, fall back to cache, then to /offline (so content is always fresh
 *     when online, and the app still opens when offline).
 *   - Hashed build assets (/assets/*): cache first (immutable).
 *   - Brand images, manifest, fonts: stale-while-revalidate.
 *   - Never touches the admin, the gateway, Apps Script, analytics or cross-origin API calls.
 * __BUILD__ is replaced at build time so every deploy invalidates the old cache.
 */
const VERSION = '__BUILD__';
const CACHE = `jsnm-${VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE = ['/', OFFLINE_URL, '/conditions', '/booking', '/contact', '/emergency', '/site.webmanifest',
  '/assets/brand/logo-96.webp', '/assets/brand/favicon-192x192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => null)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('jsnm-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isHtml = (req) => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                       // fonts/GA/gateway: let the browser handle
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/cdn-cgi') || url.pathname === '/sw.js') return;

  if (isHtml(req)) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(async () => (await caches.match(req)) || (await caches.match(OFFLINE_URL)) || Response.error())
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') && !url.pathname.startsWith('/assets/brand/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }

  // Brand images, manifest, sitemap etc.: stale-while-revalidate.
  event.respondWith(caches.match(req).then((hit) => {
    const network = fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || network;
  }));
});

self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
