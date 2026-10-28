/**
 * JS Neurominds V1 — public-site/assets/js/ui.js
 * Progressive UX enhancements. All effects are additive and respect
 * prefers-reduced-motion. Nothing here is required for content to work.
 *
 *  - Scroll-reveal: elements with [data-reveal] fade/slide in once on view.
 *  - Smooth anchor scroll for same-page links (with reduced-motion fallback).
 *  - Header elevation: subtle shadow once the page is scrolled.
 *  - Scroll progress bar at the very top of the viewport.
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initUi() {
  scrollProgress();
  headerElevation();
  smoothAnchors();
  scrollReveal();
}

function scrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.transform = `scaleX(${pct / 100})`;
      ticking = false;
    });
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  requestAnimationFrame(onScroll);
}

function headerElevation() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => requestAnimationFrame(() => header.classList.toggle('is-scrolled', window.scrollY > 8));
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function smoothAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', id);
  });
}

function scrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
}
