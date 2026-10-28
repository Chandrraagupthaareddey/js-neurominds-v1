/**
 * JS Neurominds V1 — public-site/assets/js/booking.js
 * Two booking CTAs:
 *   1) Request Clinic Callback — dropdown-driven, patient-friendly form.
 *      Captures preferred call date/time only (no live calendar). Saves via API.
 *   2) Book Confirmed Appointment — redirects to PWeNS/Doctor24x7, tracked in GA4.
 *
 * The form never collects diagnosis, prescriptions, medications, history, or
 * detailed symptoms. A short note field shows a clear warning if present.
 */
import { api, getSlugParam } from './api.js';
import { analytics } from './analytics.js';
import { isSubmissionBackendAvailable, unavailableNoticeHtml, failureHtml } from './submission-status.js';

const CLINICAL_WARNING =
  'Please do not enter diagnosis, prescriptions, medication details, or detailed medical history here. Our clinic team will guide you during the call.';

function opt(list) { return list.map((o) => `<option value="${o}">${o}</option>`).join(''); }

export async function renderCallbackForm(mountSel) {
  const mount = document.querySelector(mountSel);
  if (!mount) return;

  const [optsRes, docsRes] = await Promise.all([api.callbackOptions(), api.doctors()]);
  const o = optsRes.data;
  const doctors = (docsRes.data || []).map((d) => d.full_name);
  const doctorOptions = doctors.length ? doctors : ['Dr. Jayapriya T'];

  const available = isSubmissionBackendAvailable();
  mount.innerHTML = `
    ${available ? '' : unavailableNoticeHtml('callback requests')}
    <form id="callback-form" novalidate>
      <div class="form-field">
        <label for="cb-name">Your name <span class="req">*</span></label>
        <input class="input" id="cb-name" name="patient_name" required autocomplete="name" />
      </div>
      <div class="form-field">
        <label for="cb-mobile">Mobile number <span class="req">*</span></label>
        <input class="input" id="cb-mobile" name="mobile_number" inputmode="numeric" required autocomplete="tel" />
      </div>
      <div class="form-field">
        <label>Is WhatsApp the same as your mobile?</label>
        <select id="cb-wa-same" name="whatsapp_same_as_mobile">
          <option value="yes">Yes, same number</option>
          <option value="no">No, different number</option>
        </select>
      </div>
      <div class="form-field hide" id="cb-wa-wrap">
        <label for="cb-whatsapp">WhatsApp number</label>
        <input class="input" id="cb-whatsapp" name="whatsapp_number" inputmode="numeric" autocomplete="tel" />
      </div>
      <div class="form-field">
        <label for="cb-email">Email (optional)</label>
        <input class="input" id="cb-email" name="patient_email" type="email" autocomplete="email" />
        <p class="hint">If you add an email, we'll send a confirmation that your request was received.</p>
      </div>
      <div class="form-field">
        <label for="cb-date">Preferred call date <span class="req">*</span></label>
        <input class="input" id="cb-date" name="preferred_call_date" type="date" required />
      </div>
      <div class="form-field">
        <label for="cb-slot">Preferred time <span class="req">*</span></label>
        <select id="cb-slot" name="preferred_call_time_slot" required>${opt(o.time_slots)}</select>
      </div>
      <div class="form-field">
        <label for="cb-for">Consultation for</label>
        <select id="cb-for" name="consultation_for">${opt(o.consultation_for)}</select>
      </div>
      <div class="form-field">
        <label for="cb-type">New or follow-up</label>
        <select id="cb-type" name="new_patient_or_followup">${opt(o.patient_type)}</select>
      </div>
      <div class="form-field">
        <label for="cb-doc">Preferred doctor</label>
        <select id="cb-doc" name="preferred_doctor">${opt(doctorOptions)}</select>
      </div>
      <div class="form-field">
        <label for="cb-concern">What's this about?</label>
        <select id="cb-concern" name="generic_concern_category">${opt(o.concern_categories)}</select>
      </div>
      <div class="form-field">
        <label for="cb-mode">Consultation interest</label>
        <select id="cb-mode" name="consultation_mode_interest">${opt(o.consultation_mode)}</select>
      </div>

      <div class="notice notice--privacy">${CLINICAL_WARNING}</div>
      <div class="form-field">
        <label for="cb-note">Short note (optional)</label>
        <textarea id="cb-note" name="short_note" maxlength="200" placeholder="A brief, general note for the team (no medical details)."></textarea>
      </div>

      <div class="checkbox-row form-field">
        <input type="checkbox" id="cb-consent" name="privacy_consent" required />
        <label for="cb-consent" style="font-weight:500">I agree to be contacted by the clinic team and accept the privacy policy. <span class="req">*</span></label>
      </div>

      <!-- honeypot (hidden from humans) -->
      <input type="text" name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" />

      <button class="btn btn--primary btn--lg btn--block" type="submit" id="cb-submit">Request Clinic Callback</button>
      <p class="hint text-center" style="margin-top:.75rem">This is not a confirmed appointment. Our clinic team will call you to guide the next step.</p>
    </form>
    <div id="cb-result" class="hide"></div>
  `;

  // preset date min = today; default doctor from ?slug if on a doctor page
  const dateEl = mount.querySelector('#cb-date');
  dateEl.min = new Date().toISOString().slice(0, 10);

  const waSame = mount.querySelector('#cb-wa-same');
  const waWrap = mount.querySelector('#cb-wa-wrap');
  waSame.addEventListener('change', () => waWrap.classList.toggle('hide', waSame.value !== 'no'));

  analytics.supportBookingFormOpen();

  const form = mount.querySelector('#callback-form');
  if (!available) {
    const submit = form.querySelector('#cb-submit');
    if (submit) { submit.disabled = true; submit.setAttribute('aria-disabled', 'true'); submit.textContent = 'Submission unavailable'; }
  }
  form.addEventListener('submit', (e) => onSubmit(e, mount));
}

async function onSubmit(e, mount) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('#cb-submit');

  // honeypot
  if (form.company.value) { return; }

  const name = form.patient_name.value.trim();
  const mobile = form.mobile_number.value.replace(/\D/g, '');
  if (name.length < 2) return flagError(form.patient_name, 'Please enter your name.');
  if (!/^[6-9]\d{9}$/.test(mobile.slice(-10))) return flagError(form.mobile_number, 'Enter a valid 10-digit mobile number.');
  if (!form.privacy_consent.checked) return flagError(form.cb_consent || form.privacy_consent, 'Please accept to continue.');

  const waSame = form.whatsapp_same_as_mobile.value === 'yes';
  const payload = {
    patient_name: name,
    mobile_number: mobile,
    whatsapp_number: waSame ? mobile : form.whatsapp_number.value.replace(/\D/g, ''),
    patient_email: form.patient_email.value.trim(),
    preferred_call_date: form.preferred_call_date.value,
    preferred_call_time_slot: form.preferred_call_time_slot.value,
    consultation_for: form.consultation_for.value,
    new_patient_or_followup: form.new_patient_or_followup.value,
    preferred_doctor: form.preferred_doctor.value,
    generic_concern_category: form.generic_concern_category.value,
    consultation_mode_interest: form.consultation_mode_interest.value,
    short_note: form.short_note.value.trim(),
    privacy_consent: true,
    source_hint: detectSource()
  };

  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    const res = await api.submitCallback(payload);
    if (res && res.success && res.data && res.data.callback_id) {
      analytics.supportBookingSubmit(res.data.callback_id);
      showSuccess(mount, res.data);
    } else {
      const e = new Error((res && res.error) || 'Request failed'); e.code = res && res.code; throw e;
    }
  } catch (err) {
    // Honest failure: the form stays visible, no success copy, verified contacts only.
    analytics.supportBookingError();
    btn.disabled = false; btn.textContent = 'Request Clinic Callback';
    const result = mount.querySelector('#cb-result');
    result.className = 'notice notice--err';
    result.innerHTML = failureHtml(err);
    result.classList.remove('hide');
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function showSuccess(mount, data) {
  const form = mount.querySelector('#callback-form');
  const result = mount.querySelector('#cb-result');
  form.classList.add('hide');
  result.className = 'form-success';
  result.innerHTML = `
    <h3>Your clinic callback request has been received</h3>
    <p>This is not a confirmed appointment. Our clinic team will contact you shortly at your preferred time.</p>
    <p class="hint">Reference: ${data.callback_id}</p>
  `;
  result.classList.remove('hide');
  result.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function flagError(field, msg) {
  const result = document.querySelector('#cb-result');
  if (result) { result.className = 'notice notice--err'; result.textContent = msg; result.classList.remove('hide'); }
  if (field && field.focus) field.focus();
  return false;
}

function detectSource() {
  const p = new URLSearchParams(location.search);
  const utm = p.get('utm_source');
  if (utm) return utm.toLowerCase();
  const r = document.referrer.toLowerCase();
  if (!r) return 'direct';
  if (r.includes('instagram')) return 'instagram';
  if (r.includes('facebook')) return 'facebook';
  if (r.includes('whatsapp') || r.includes('wa.me')) return 'whatsapp';
  if (r.includes('google')) return 'google';
  return 'referral';
}

// ---- Confirmed booking redirect ----
export function wireConfirmedBooking(sel, { doctorId = '', pwensUrl = '' } = {}) {
  const btn = document.querySelector(sel);
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    analytics.pwensBookingClick(doctorId);
    const url = pwensUrl || (window.__JSNM__ && window.__JSNM__.cfg && window.__JSNM__.cfg.pwens_booking_url) || 'https://jsneurominds.pwens.com/waselffollowuppage';
    window.open(url, '_blank', 'noopener');
  });
}
