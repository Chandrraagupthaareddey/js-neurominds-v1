/**
 * JS Neurominds V1 — public-site/assets/js/static.js
 * Small render helpers for static pages (contact card from config).
 */
import { analytics } from './analytics.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderContact(cfg) {
  const card = document.querySelector('#contact-card');
  if (!card) return;
  card.innerHTML = `
    <div class="grid grid--2" style="gap:var(--sp-5); align-items:start">
      <div>
        <div class="card__icon">📍</div>
        <h3>${esc(cfg.clinic_name)}</h3>
        <p>${esc(cfg.address)}</p>
        <p><strong>Phone:</strong> <a href="${esc(cfg.call_link)}">${esc(cfg.display_phone)}</a></p>
      </div>
      <div class="stack">
        <a class="btn btn--primary btn--block" href="${esc(cfg.call_link)}" id="contact-call-btn">📞 Call the clinic</a>
        <a class="btn btn--ghost btn--block" href="${esc(cfg.whatsapp_link)}" target="_blank" rel="noopener" id="contact-wa-btn">💬 WhatsApp us</a>
        <a class="btn btn--ghost btn--block" href="${esc(cfg.maps_url)}" target="_blank" rel="noopener">🗺 Get directions</a>
      </div>
    </div>`;
  const call = document.querySelector('#contact-call-btn');
  const wa = document.querySelector('#contact-wa-btn');
  if (call) call.addEventListener('click', () => analytics.callClick('contact'));
  if (wa) wa.addEventListener('click', () => analytics.whatsappClick('contact'));
}
