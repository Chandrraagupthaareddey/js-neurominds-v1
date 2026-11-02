/**
 * JS Neurominds V1 — public-site/assets/js/own-booking.js
 * The clinic's OWN appointment booking + payment step. Everything is driven by
 * Admin → Site Settings → "Booking & payments" (content/settings/booking.json):
 *
 *   mode: "partner" (PWeNS, default) | "own"  + own_booking_enabled switch
 *   own:  slots, closed weekdays, days ahead, modes, fees, texts
 *   payments: enabled switch + a list of methods, each one of:
 *        upi  → deep link upi://pay?pa=<id>&pn=<name>&am=<fee>  (GPay/PhonePe/Paytm/BHIM) + copy button
 *        qr   → an uploaded QR image
 *        link → any hosted payment page URL (Razorpay / PhonePe / Paytm / Stripe payment link …)
 *
 * Flow: form → reference number → (optional) save via Apps Script → payment step →
 * "I have paid / Send on WhatsApp" opens a pre-filled WhatsApp message to the clinic.
 * The WhatsApp hand-off always works, even with no backend — nothing is ever lost.
 * No card data is ever handled by this site; payments happen in the patient's UPI app
 * or on the provider's hosted page.
 */
import { api } from './api.js';
import { analytics } from './analytics.js';
import { isSubmissionBackendAvailable } from './submission-status.js';
import { esc, yes } from '../../../shared/content-normalize.js';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (iso) => { const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); };
const fmtTime = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`; };
const money = (amt, cur = 'INR') => amt == null || amt === '' ? '' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number(amt));
const opt = (list, sel) => (list || []).map((o) => `<option value="${esc(o)}"${o === sel ? ' selected' : ''}>${esc(o)}</option>`).join('');

export function makeReference(date = new Date()) {
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JSNM-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${rnd}`;
}

export function availableDates(own, from = new Date()) {
  const out = [];
  const closed = new Set((own.closed_weekdays || []).map((d) => String(d).toLowerCase().slice(0, 3)));
  const days = Math.max(1, Math.min(60, Number(own.days_ahead) || 14));
  for (let i = 0; i < days && out.length < days; i++) {
    const d = new Date(from); d.setDate(from.getDate() + i);
    if (closed.has(WEEKDAYS[d.getDay()].toLowerCase().slice(0, 3))) continue;
    // Skip today once all of today's slots have passed.
    if (i === 0 && own.slots && own.slots.length && slotsFor(own, isoDate(d), from).length === 0) continue;
    out.push(isoDate(d));
  }
  return out;
}

export function slotsFor(own, dateIso, now = new Date()) {
  const slots = (own.slots || []).filter((s) => /^\d{2}:\d{2}$/.test(s));
  if (dateIso !== isoDate(now)) return slots;
  // Today: hide slots that have already started (plus a 30-minute buffer).
  const cutoff = now.getHours() * 60 + now.getMinutes() + 30;
  return slots.filter((s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m > cutoff; });
}

/** Slots (HH:MM) on `dateIso` that overlap any busy interval from the clinic calendar. */
export function bookedSlots(dateIso, busy, slotMinutes = 30) {
  const out = new Set();
  const dayStart = new Date(dateIso + 'T00:00:00');
  const dayEnd = new Date(dateIso + 'T23:59:59');
  for (const b of busy || []) {
    const bs = new Date(b.start), be = new Date(b.end);
    if (be <= dayStart || bs >= dayEnd) continue;
    if (b.all_day) { out.add('*'); continue; }
    // Any slot whose [start, start+len) intersects [bs, be).
    const probe = new Date(dayStart);
    for (let m = 0; m < 24 * 60; m += 5) {
      probe.setHours(0, m, 0, 0);
      const pe = new Date(probe.getTime() + slotMinutes * 60000);
      if (probe < be && pe > bs) out.add(`${pad(probe.getHours())}:${pad(probe.getMinutes())}`);
    }
  }
  return out;
}

export function feeFor(own, visitType) {
  const follow = /follow/i.test(visitType || '');
  const fee = follow && own.followup_fee != null && own.followup_fee !== '' ? own.followup_fee : own.consultation_fee;
  return fee == null || fee === '' ? null : Number(fee);
}

export function upiLink(method, amount, note) {
  const u = new URL('upi://pay');
  u.searchParams.set('pa', method.upi_id);
  u.searchParams.set('pn', method.payee_name || 'JS Neurominds');
  if (amount) u.searchParams.set('am', String(amount));
  u.searchParams.set('cu', 'INR');
  if (note) u.searchParams.set('tn', note.slice(0, 60));
  return u.toString();
}

export function enabledMethods(payments) {
  return (payments && payments.methods || [])
    .filter((m) => yes(m.enabled) && ((m.type === 'upi' && m.upi_id) || (m.type === 'qr' && m.image) || (m.type === 'link' && m.url)))
    .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
}

export function whatsappMessage(cfg, booking, paid) {
  const lines = [
    `Hello ${cfg.clinic_short || 'JS Neurominds'}, I would like to book an appointment.`,
    `Reference: ${booking.reference}`,
    `Name: ${booking.name}`,
    `Mobile: ${booking.mobile}`,
    `Date & time: ${fmtDate(booking.date)} at ${fmtTime(booking.slot)}`,
    `Type: ${booking.visit_type} · ${booking.mode}`,
    booking.doctor ? `Doctor: ${booking.doctor}` : '',
    booking.fee ? `Fee: ${money(booking.fee)}` : '',
    paid ? `Payment: done via ${paid}${booking.payment_ref ? ' (ref ' + booking.payment_ref + ')' : ''}` : 'Payment: not yet',
    booking.notes ? `Note: ${booking.notes}` : ''
  ].filter(Boolean);
  return lines.join('\n');
}

function waUrl(cfg, text) {
  const base = (cfg.whatsapp_link || '').replace(/\?.*$/, '') || 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

/* ------------------------------------------------------------------ UI */
export async function renderOwnBooking(mountSel, { settings, cfg, doctors = [] }) {
  const mount = document.querySelector(mountSel);
  if (!mount || !settings || !settings.own) return;
  const own = settings.own;
  const dates = availableDates(own);
  const doctorNames = doctors.map((d) => d.full_name);
  const fee0 = feeFor(own, (own.visit_types || [])[0]);

  mount.innerHTML = `
    <form id="own-booking-form" class="own-booking" novalidate>
      <div class="form-field"><label for="ob-name">Your name <span class="req">*</span></label>
        <input class="input" id="ob-name" name="name" required autocomplete="name" /></div>
      <div class="form-field"><label for="ob-mobile">Mobile number <span class="req">*</span></label>
        <input class="input" id="ob-mobile" name="mobile" inputmode="numeric" required autocomplete="tel" placeholder="10-digit mobile" /></div>
      ${yes(own.collect_email) ? `<div class="form-field"><label for="ob-email">Email (optional)</label><input class="input" id="ob-email" name="email" type="email" autocomplete="email" /></div>` : ''}
      <div class="form-grid-2">
        <div class="form-field"><label for="ob-date">Date <span class="req">*</span></label>
          <select id="ob-date" name="date" required>${dates.map((d) => `<option value="${d}">${esc(fmtDate(d))}</option>`).join('')}</select></div>
        <div class="form-field"><label for="ob-slot">Time <span class="req">*</span></label>
          <select id="ob-slot" name="slot" required></select></div>
      </div>
      <div class="form-grid-2">
        <div class="form-field"><label for="ob-type">Visit type</label><select id="ob-type" name="visit_type">${opt(own.visit_types)}</select></div>
        <div class="form-field"><label for="ob-mode">Consultation</label><select id="ob-mode" name="mode">${opt(own.consultation_modes)}</select></div>
      </div>
      ${doctorNames.length > 1 ? `<div class="form-field"><label for="ob-doctor">Doctor</label><select id="ob-doctor" name="doctor">${opt(doctorNames)}</select></div>` : `<input type="hidden" name="doctor" value="${esc(doctorNames[0] || '')}" />`}
      <div class="form-field"><label for="ob-notes">Note (optional)</label>
        <textarea id="ob-notes" name="notes" maxlength="200" placeholder="${esc(own.notes_placeholder || '')}"></textarea></div>
      ${fee0 != null ? `<div class="notice notice--info own-booking__fee"><div><strong>Fee: <span data-fee>${money(fee0, own.currency)}</span></strong>${own.fee_note ? `<br><span class="hint">${esc(own.fee_note)}</span>` : ''}</div></div>` : ''}
      <div class="checkbox-row form-field">
        <input type="checkbox" id="ob-consent" name="consent" required />
        <label for="ob-consent" style="font-weight:500">${esc(own.terms_text || 'I agree to be contacted to confirm this appointment.')} <span class="req">*</span></label>
      </div>
      <input type="text" name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" />
      <button class="btn btn--primary btn--lg btn--block" type="submit" id="ob-submit">Request appointment</button>
      <p class="hint text-center" style="margin-top:.75rem">Your slot is confirmed by the clinic${settings.payments && yes(settings.payments.enabled) ? ' after payment' : ''}. You will hear from us on WhatsApp or by phone.</p>
    </form>
    <div id="ob-result" class="hide"></div>`;

  const form = mount.querySelector('#own-booking-form');
  const dateEl = form.querySelector('#ob-date');
  const slotEl = form.querySelector('#ob-slot');
  const typeEl = form.querySelector('#ob-type');
  const feeEl = form.querySelector('[data-fee]');
  const slotMinutes = Number(own.slot_minutes) > 0 ? Number(own.slot_minutes) : 30;
  const availCache = new Map();
  const fillSlots = async () => {
    const date = dateEl.value;
    const slots = slotsFor(own, date);
    slotEl.innerHTML = slots.length ? slots.map((s) => `<option value="${s}">${fmtTime(s)}</option>`).join('') : '<option value="">No slots left this day</option>';
    if (!yes(own.calendar_sync)) return;
    slotEl.disabled = true;
    try {
      if (!availCache.has(date)) availCache.set(date, api.availability(date));
      const res = await availCache.get(date);
      const data = (res && res.data) || {};
      const booked = bookedSlots(date, data.busy || [], data.slot_minutes || slotMinutes);
      const allDay = booked.has('*');
      let firstFree = '';
      slotEl.querySelectorAll('option').forEach((o) => {
        if (!o.value) return;
        if (allDay || booked.has(o.value)) { o.disabled = true; o.textContent = `${fmtTime(o.value)} — Booked`; }
        else if (!firstFree) firstFree = o.value;
      });
      if (dateEl.value === date) slotEl.value = firstFree;
      if (!firstFree && slots.length) slotEl.insertAdjacentHTML('afterbegin', '<option value="" selected>All slots booked — choose another date</option>');
      mount.querySelector('[data-live-note]')?.remove();
      if (!data.offline) slotEl.insertAdjacentHTML('afterend', '<p class="hint" data-live-note>Live availability from the clinic calendar.</p>');
    } catch (e) { /* availability is a convenience; the clinic still confirms manually */ }
    finally { slotEl.disabled = false; }
  };
  fillSlots();
  dateEl.addEventListener('change', fillSlots);
  mount.refreshSlots = () => { availCache.clear(); return fillSlots(); };
  if (typeEl && feeEl) typeEl.addEventListener('change', () => { const f = feeFor(own, typeEl.value); feeEl.textContent = f != null ? money(f, own.currency) : ''; });

  form.addEventListener('submit', (e) => onSubmit(e, { mount, form, own, settings, cfg }));
}

async function onSubmit(e, { mount, form, own, settings, cfg }) {
  e.preventDefault();
  const field = (n) => form.elements.namedItem(n);
  const val = (n) => { const el = field(n); return el && el.value != null ? String(el.value) : ''; };
  if (val('company')) return; // honeypot
  const result = mount.querySelector('#ob-result');
  const show = (cls, html) => { result.className = cls; result.innerHTML = html; result.classList.remove('hide'); if (result.scrollIntoView) result.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const mobile = val('mobile').replace(/\D/g, '').slice(-10);
  if (val('name').trim().length < 2) return show('notice notice--err', 'Please enter your name.');
  if (!/^[6-9]\d{9}$/.test(mobile)) return show('notice notice--err', 'Please enter a valid 10-digit mobile number.');
  if (!val('slot')) return show('notice notice--err', 'Please choose a time slot.');
  if (!(field('consent') && field('consent').checked)) return show('notice notice--err', 'Please tick the consent box to continue.');

  const booking = {
    reference: makeReference(),
    name: val('name').trim(), mobile,
    email: val('email').trim(),
    date: val('date'), slot: val('slot'),
    visit_type: val('visit_type'), mode: val('mode'),
    doctor: val('doctor'),
    notes: val('notes').trim().slice(0, 200),
    fee: feeFor(own, val('visit_type')),
    source_hint: 'website'
  };

  const btn = form.querySelector('#ob-submit');
  btn.disabled = true; btn.textContent = 'Sending…';
  let saved = false;
  if (isSubmissionBackendAvailable()) {
    try {
      const res = await api.submitBooking({ ...booking, consent: true });
      if (res && res.code === 'SLOT_TAKEN') {
        btn.disabled = false; btn.textContent = 'Request appointment';
        show('notice notice--err', res.message || 'Sorry, that time was just booked. Please choose another slot.');
        if (mount.refreshSlots) await mount.refreshSlots();
        return;
      }
      saved = !!(res && res.success);
      if (saved && res.data && res.data.booking_id) booking.server_id = res.data.booking_id;
    } catch (err) { saved = false; }
  }
  analytics.supportBookingSubmit && analytics.supportBookingSubmit(booking.reference);
  form.classList.add('hide');
  show('form-success own-booking__done', successHtml({ booking, own, settings, cfg, saved }));
  wireSuccess(result, { booking, settings, cfg });
}

function successHtml({ booking, own, settings, cfg, saved }) {
  const pay = settings.payments || {};
  const methods = yes(pay.enabled) ? enabledMethods(pay) : [];
  const note = `${booking.reference} ${booking.name}`.slice(0, 60);
  const methodHtml = methods.map((m) => {
    if (m.type === 'upi') {
      return `<div class="pay-method">
        <a class="btn btn--primary btn--block" href="${esc(upiLink(m, booking.fee, note))}" data-pay="${esc(m.id)}" data-label="${esc(m.label)}">${esc(m.label)}</a>
        <p class="hint">UPI ID: <code>${esc(m.upi_id)}</code> <button type="button" class="link-btn" data-copy-upi="${esc(m.upi_id)}">Copy</button>${booking.fee ? ` · Amount ${money(booking.fee)}` : ''}. On a computer, pay from your phone using the UPI ID.</p>
      </div>`;
    }
    if (m.type === 'qr') {
      return `<div class="pay-method pay-method--qr"><p><strong>${esc(m.label)}</strong></p><img src="${esc(m.image)}" alt="Payment QR code" width="220" height="220" loading="lazy" /><p class="hint">${booking.fee ? `Amount ${money(booking.fee)} · ` : ''}Reference ${esc(booking.reference)}</p></div>`;
    }
    return `<div class="pay-method"><a class="btn btn--ghost btn--block" href="${esc(m.url)}" target="_blank" rel="noopener" data-pay="${esc(m.id)}" data-label="${esc(m.label)}">${esc(m.label)} ↗</a></div>`;
  }).join('');

  return `
    <h3>${esc(own.success_title || 'Request received')}</h3>
    <p>${esc(own.success_message || '')}</p>
    <div class="own-booking__summary">
      <div><span>Reference</span><strong>${esc(booking.reference)}</strong></div>
      <div><span>When</span><strong>${esc(fmtDate(booking.date))}, ${esc(fmtTime(booking.slot))}</strong></div>
      <div><span>Type</span><strong>${esc(booking.visit_type)} · ${esc(booking.mode)}</strong></div>
      ${booking.fee ? `<div><span>Fee</span><strong>${money(booking.fee)}</strong></div>` : ''}
    </div>
    ${!saved ? `<p class="hint">Please send the details on WhatsApp below so the clinic receives your request.</p>` : ''}
    ${methods.length ? `<div class="pay-block">
      <h4>${esc(pay.title || 'Pay to confirm your slot')}</h4>
      ${pay.intro ? `<p class="hint">${esc(pay.intro)}</p>` : ''}
      ${methodHtml}
      <div class="form-field" style="margin-top:var(--sp-4)"><label for="ob-payref">Payment reference / UTR (optional)</label><input class="input" id="ob-payref" placeholder="e.g. 4258 1234 5678" /></div>
      <button type="button" class="btn btn--primary btn--block" data-paid>✅ I have paid — send details on WhatsApp</button>
    </div>` : ''}
    ${yes(own.whatsapp_handoff) !== false ? `<a class="btn ${methods.length ? 'btn--ghost' : 'btn--primary'} btn--block" style="margin-top:var(--sp-3)" data-wa target="_blank" rel="noopener" href="${esc(waUrl(cfg, whatsappMessage(cfg, booking, '')))}">💬 Send booking details on WhatsApp</a>` : ''}
    <p class="hint" style="margin-top:var(--sp-3)">Need to change anything? Call <a href="${esc(cfg.call_link || '#')}">${esc(cfg.display_phone || 'the clinic')}</a>.</p>`;
}

function wireSuccess(root, { booking, cfg }) {
  let paidVia = '';
  root.querySelectorAll('[data-pay]').forEach((a) => a.addEventListener('click', () => { paidVia = a.dataset.label || a.dataset.id; analytics.pwensBookingClickCta && analytics.pwensBookingClickCta('own_pay_' + a.dataset.pay); }));
  root.querySelectorAll('[data-copy-upi]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copyUpi); b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy'), 1500); } catch (e) { /* ignore */ }
  }));
  const paid = root.querySelector('[data-paid]');
  if (paid) paid.addEventListener('click', () => {
    const ref = (root.querySelector('#ob-payref') || {}).value || '';
    const msg = whatsappMessage(cfg, { ...booking, payment_ref: ref.trim() }, paidVia || 'UPI / online');
    window.open(waUrl(cfg, msg), '_blank', 'noopener');
  });
}
