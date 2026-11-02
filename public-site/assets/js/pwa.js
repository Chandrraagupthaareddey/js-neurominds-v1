/**
 * JS Neurominds V1 — public-site/assets/js/pwa.js
 * Installable web app behaviour:
 *   - registers the service worker (production only; never on localhost)
 *   - shows a small, dismissible "Install the app" hint on phones/tablets:
 *       Android/Chrome → real install button (beforeinstallprompt)
 *       iPhone/iPad Safari → "Share → Add to Home Screen" instructions
 *   - hides the hint when already running as an installed app
 *   - reloads once when a new version of the site has been activated
 * Free, no store, no account: it is just the website with an icon.
 */
const DISMISS_KEY = 'jsnm_install_dismissed';
const VISITS_KEY = 'jsnm_visits';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMobileish = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;

function store(key, val) { try { localStorage.setItem(key, String(val)); } catch (e) { /* ignore */ } }
function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (['localhost', '127.0.0.1'].includes(location.hostname)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      // When a new version is installed while the app is open, apply it on the next navigation.
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) sw.postMessage('SKIP_WAITING');
        });
      });
    }).catch(() => { /* offline support is optional */ });
    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return; refreshed = true;
      // Only auto-refresh when the user is not in the middle of a form.
      if (!document.querySelector('form:focus-within')) location.reload();
    });
  });
}

function bannerHtml(kind) {
  const title = 'Get the JS Neurominds app';
  const body = kind === 'ios'
    ? 'Tap <strong>Share</strong> <span aria-hidden="true">(the square with an arrow)</span> then <strong>Add to Home Screen</strong>. Free, no App Store needed.'
    : 'Install it on your phone for quick, one-tap access — free, no app store needed.';
  const action = kind === 'ios' ? '' : '<button class="btn btn--primary btn--sm" type="button" data-install>Install app</button>';
  return `
    <div class="install-banner" role="dialog" aria-label="${title}">
      <img src="/assets/brand/logo-96.webp" alt="" width="40" height="40" />
      <div class="install-banner__text"><strong>${title}</strong><span>${body}</span></div>
      <div class="install-banner__actions">${action}<button class="btn btn--ghost btn--sm" type="button" data-dismiss aria-label="Not now">Not now</button></div>
    </div>`;
}

export function initInstallHint() {
  if (isStandalone() || !isMobileish()) return;
  if (read(DISMISS_KEY)) return;
  // Don't nag on the very first visit; show from the second page view onwards.
  const visits = Number(read(VISITS_KEY) || 0) + 1;
  store(VISITS_KEY, visits);
  if (visits < 2) return;

  let deferred = null;
  const show = (kind) => {
    if (document.querySelector('.install-banner')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = bannerHtml(kind);
    const el = wrap.firstElementChild;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    el.querySelector('[data-dismiss]').addEventListener('click', () => { store(DISMISS_KEY, Date.now()); el.remove(); });
    const btn = el.querySelector('[data-install]');
    if (btn) btn.addEventListener('click', async () => {
      if (!deferred) return;
      deferred.prompt();
      const choice = await deferred.userChoice.catch(() => null);
      deferred = null;
      store(DISMISS_KEY, Date.now());
      el.remove();
      if (choice && choice.outcome === 'accepted' && window.gtag) window.gtag('event', 'pwa_install', { cta_type: 'banner' });
    });
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();           // we show our own, calmer banner
    deferred = e;
    setTimeout(() => show('android'), 1500);
  });
  window.addEventListener('appinstalled', () => { store(DISMISS_KEY, Date.now()); const b = document.querySelector('.install-banner'); if (b) b.remove(); });

  if (isIOS()) setTimeout(() => show('ios'), 2500);
}

export function initPwa() {
  registerServiceWorker();
  initInstallHint();
}
