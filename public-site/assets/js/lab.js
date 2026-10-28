/**
 * JS Neurominds V1 — public-site/assets/js/lab.js
 * Home sample collection request form. No prescription upload, no diagnosis,
 * no medication or clinical history. Request is not confirmed until staff verify.
 */
import { api } from './api.js';
import { analytics } from './analytics.js';
import { isSubmissionBackendAvailable, unavailableNoticeHtml, failureHtml } from './submission-status.js';

function opt(list) { return list.map((o) => `<option value="${o}">${o}</option>`).join(''); }

export async function renderLabForm(mountSel) {
  const mount = document.querySelector(mountSel);
  if (!mount) return;
  const pkgRes = await api.labPackages();
  const packages = (pkgRes.data || []).map((p) => p.name);

  const available = isSubmissionBackendAvailable();
  mount.innerHTML = `
    ${available ? '' : unavailableNoticeHtml('home collection requests')}
    <form id="lab-form" novalidate>
      <div class="form-field">
        <label for="lab-name">Your name <span class="req">*</span></label>
        <input class="input" id="lab-name" name="name" required autocomplete="name" />
      </div>
      <div class="form-field">
        <label for="lab-mobile">Mobile number <span class="req">*</span></label>
        <input class="input" id="lab-mobile" name="mobile" inputmode="numeric" required autocomplete="tel" />
      </div>
      <div class="form-field">
        <label for="lab-wa">WhatsApp number (optional)</label>
        <input class="input" id="lab-wa" name="whatsapp" inputmode="numeric" autocomplete="tel" />
      </div>
      <div class="form-field">
        <label for="lab-email">Email (optional)</label>
        <input class="input" id="lab-email" name="email" type="email" autocomplete="email" />
      </div>
      <div class="form-field">
        <label for="lab-pkg">Package / test <span class="req">*</span></label>
        <select id="lab-pkg" name="selected_package" required>${opt(packages)}</select>
      </div>
      <div class="form-field">
        <label for="lab-area">Pickup area / landmark <span class="req">*</span></label>
        <input class="input" id="lab-area" name="pickup_area" required placeholder="Area, street, nearby landmark" />
      </div>
      <div class="form-field">
        <label for="lab-date">Preferred pickup date <span class="req">*</span></label>
        <input class="input" id="lab-date" name="preferred_pickup_date" type="date" required />
      </div>
      <div class="form-field">
        <label for="lab-time">Preferred pickup time</label>
        <select id="lab-time" name="preferred_pickup_time">${opt(['Morning','Afternoon','Evening'])}</select>
      </div>
      <div class="notice notice--privacy">Please don't include prescriptions, diagnosis, medication, or medical history. Our team will guide you during confirmation.</div>
      <div class="checkbox-row form-field">
        <input type="checkbox" id="lab-consent" name="consent" required />
        <label for="lab-consent" style="font-weight:500">I consent to be contacted to confirm this request. <span class="req">*</span></label>
      </div>
      <input type="text" name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" />
      <button class="btn btn--primary btn--lg btn--block" type="submit" id="lab-submit">Request home collection</button>
      <p class="hint text-center" style="margin-top:.75rem">This request is not confirmed until our team verifies availability with you.</p>
    </form>
    <div id="lab-result" class="hide"></div>
  `;

  mount.querySelector('#lab-date').min = new Date().toISOString().slice(0, 10);
  mount.querySelector('#lab-form').addEventListener('submit', (e) => onSubmit(e, mount));
  if (!available) {
    const submit = mount.querySelector('#lab-submit');
    if (submit) { submit.disabled = true; submit.setAttribute('aria-disabled', 'true'); submit.textContent = 'Submission unavailable'; }
  }
}

async function onSubmit(e, mount) {
  e.preventDefault();
  const form = e.target;
  if (form.company.value) return;
  const mobile = form.mobile.value.replace(/\D/g, '');
  const result = mount.querySelector('#lab-result');
  if (form.name.value.trim().length < 2) { return show(result, 'notice notice--err', 'Please enter your name.'); }
  if (!/^[6-9]\d{9}$/.test(mobile.slice(-10))) { return show(result, 'notice notice--err', 'Enter a valid 10-digit mobile number.'); }
  if (!form.consent.checked) { return show(result, 'notice notice--err', 'Please give consent to continue.'); }

  const payload = {
    name: form.name.value.trim(), mobile,
    whatsapp: form.whatsapp.value.replace(/\D/g, ''), email: form.email.value.trim(),
    selected_package: form.selected_package.value, pickup_area: form.pickup_area.value.trim(),
    preferred_pickup_date: form.preferred_pickup_date.value,
    preferred_pickup_time: form.preferred_pickup_time.value, consent: 'YES',
    source_hint: 'lab_page'
  };
  const btn = form.querySelector('#lab-submit');
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    const res = await api.submitLabRequest(payload);
    if (!res || !res.success || !res.data || !res.data.lab_request_id) { const e = new Error((res && res.error) || 'Request failed'); e.code = res && res.code; throw e; }
    analytics.labRequestSubmit(res.data.lab_request_id);
    form.classList.add('hide');
    show(result, 'form-success',
      `<h3>Request received</h3><p>Our team will contact you to confirm pickup. Reference: ${res.data.lab_request_id}</p>`, true);
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Request home collection';
    // Honest failure: no "Request received" unless the backend confirmed the save.
    show(result, 'notice notice--err', failureHtml(err), true);
  }
}

function show(node, cls, html, isHtml) {
  node.className = cls; node[isHtml ? 'innerHTML' : 'textContent'] = html; node.classList.remove('hide');
  node.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
