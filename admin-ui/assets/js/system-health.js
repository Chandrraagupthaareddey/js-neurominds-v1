/**
 * JS Neurominds V1 — admin-ui/assets/js/system-health.js
 * System Health. Surfaces API status, email quota, recent failures, last
 * deploy, and error counts. Email failures (non-blocking) appear here.
 */
import { api } from './api.js';

const esc = (s) => String(s == null ? '' : s);

export async function renderSystemHealth(mount) {
  const res = await api.health();
  const h = res.data || {};
  const dot = (ok) => `<span class="badge ${ok ? 'ok' : 'error'}">${ok ? 'ok' : 'attention'}</span>`;

  mount.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi__label">Public API</div><div class="kpi__value" style="font-size:1.1rem">${dot(h.public_api === 'ok')}</div></div>
      <div class="kpi"><div class="kpi__label">Admin API</div><div class="kpi__value" style="font-size:1.1rem">${dot(h.admin_api === 'ok')}</div></div>
      <div class="kpi"><div class="kpi__label">Email quota left</div><div class="kpi__value">${esc(h.email_quota_remaining)}</div><div class="kpi__delta">MailApp daily remaining</div></div>
      <div class="kpi"><div class="kpi__label">Email failures</div><div class="kpi__value">${esc(h.last_email_failures)}</div><div class="kpi__delta ${h.last_email_failures ? 'down' : 'up'}">Non-blocking</div></div>
      <div class="kpi"><div class="kpi__label">Errors (24h)</div><div class="kpi__value">${esc(h.error_count_24h)}</div></div>
    </div>
    <div class="panel">
      <div class="panel__head"><h3>Deployment</h3></div>
      <div class="panel__body">
        <dl class="kv" style="display:grid;grid-template-columns:160px 1fr;gap:.5rem">
          <dt class="muted">Last deploy status</dt><dd><span class="badge ${h.last_deploy_status}">${esc(h.last_deploy_status)}</span></dd>
          <dt class="muted">Last deploy at</dt><dd>${esc(h.last_deploy_at)}</dd>
        </dl>
      </div>
    </div>
    <p class="muted" style="font-size:12px">Email sending never blocks request saving. Failures are logged to Email_Logs and surfaced here.</p>`;
}
