/**
 * JS Neurominds V1 — public-site/assets/js/feedback.js
 * Floating feedback modal. Consent-based, no clinical data. Tracks feedback_submit.
 * Wires to the left floating "Feedback" button rendered by the shell.
 */
import { api } from './api.js';
import { analytics } from './analytics.js';
import { isSubmissionBackendAvailable, unavailableNoticeHtml, failureHtml } from './submission-status.js';

function modalTemplate() {
  const available = isSubmissionBackendAvailable();
  return `
    <div class="modal-overlay" id="fb-overlay" role="dialog" aria-modal="true" aria-labelledby="fb-title">
      <div class="card modal">
        <h3 id="fb-title">Share your feedback</h3>
        <p class="hint">Your feedback helps us care better. Please don't include any medical details.</p>
        ${available ? '' : unavailableNoticeHtml('feedback')}
        <form id="fb-form">
          <div class="form-field">
            <label for="fb-rating">Rating</label>
            <select id="fb-rating" name="rating">
              <option value="5">★★★★★ Excellent</option>
              <option value="4">★★★★ Good</option>
              <option value="3">★★★ Okay</option>
              <option value="2">★★ Poor</option>
              <option value="1">★ Very poor</option>
            </select>
          </div>
          <div class="form-field">
            <label for="fb-message">Your message</label>
            <textarea id="fb-message" name="message" maxlength="300" placeholder="What went well, or what can we improve?"></textarea>
          </div>
          <div class="checkbox-row form-field">
            <input type="checkbox" id="fb-consent" name="consent_given" />
            <label for="fb-consent" style="font-weight:500">I consent to my feedback being shared publicly (optional).</label>
          </div>
          <input type="text" name="company" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" />
          <div style="display:flex;gap:.5rem;">
            <button type="button" class="btn btn--ghost" id="fb-cancel">Cancel</button>
            <button type="submit" class="btn btn--primary" style="flex:1" ${available ? '' : 'disabled aria-disabled="true"'}>${available ? 'Send feedback' : 'Submission unavailable'}</button>
          </div>
        </form>
        <div id="fb-done" class="hide"></div>
      </div>
    </div>
  `;
}

function openModal() {
  if (document.getElementById('fb-overlay')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = modalTemplate();
  document.body.appendChild(wrap.firstElementChild);

  const overlay = document.getElementById('fb-overlay');
  const close = () => { overlay.remove(); if (lastFocused) lastFocused.focus(); };
  const lastFocused = document.activeElement;
  document.getElementById('fb-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // focus trap
  const focusables = overlay.querySelectorAll('button, [href], input, select, textarea');
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (first) first.focus();
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown', esc);} });

  document.getElementById('fb-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.company.value) return; // honeypot
    const payload = {
      rating: form.rating.value,
      message: form.message.value.trim().slice(0, 300),
      consent_given: form.consent_given.checked ? 'YES' : 'NO',
      source_hint: 'site'
    };
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const res = await api.submitFeedback(payload);
      if (!res || !res.success || !res.data) { const e = new Error((res && res.error) || 'Request failed'); e.code = res && res.code; throw e; }
      analytics.feedbackSubmit();
      form.classList.add('hide');
      const done = document.getElementById('fb-done');
      done.className = 'form-success';
      done.innerHTML = '<h3 style="margin:0 0 .5rem">Thank you</h3><p style="margin:0">Your feedback has been received.</p>';
      done.classList.remove('hide');
      setTimeout(close, 1800);
    } catch (err) {
      // Honest failure: never show "Thank you" unless the backend confirmed the save.
      btn.disabled = false; btn.textContent = 'Send feedback';
      const done = document.getElementById('fb-done');
      done.className = 'notice notice--err';
      done.innerHTML = failureHtml(err);
      done.classList.remove('hide');
    }
  });
}

document.addEventListener('jsnm:shell-ready', () => {
  const btn = document.getElementById('open-feedback');
  if (btn) btn.addEventListener('click', openModal);
});
