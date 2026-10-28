/**
 * JS Neurominds V1 — admin-ui/assets/js/dashboard.js
 * Executive + booking dashboard. Primary analytics source is the GA4 Data API
 * (mocked locally). BigQuery is not queried here — sandbox/optional only.
 */
import { api } from './api.js';
import { sparkline, donut, bars } from './charts.js';
import { CONFIG } from './config.js';

const GA_BADGE = CONFIG.ANALYTICS_CONNECTED
  ? '<span class="badge ok">GA4 Data API</span>'
  : '<span class="badge attention" title="Connect the GA4 Data API to show live numbers">Not connected</span>';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

export async function renderDashboard(mount) {
  const res = await api.dashboard(); // api wrapper guarantees success + data (JP-001)
  const d = res.data || {};
  const k = { callbacks_new: 0, followups: 0, lab_new: 0, pwens_clicks_7d: 0, feedback_pending: 0, ...(d.kpis || {}) };
  const ga = { range: '', totals: {}, events: {}, by_source: [], by_device: [], daily_sessions: [], ...(d.ga4 || {}) };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  mount.innerHTML = `
    <div class="welcome">
      <h2>${greeting} 👋</h2>
      <p>Here's what's happening at JS Neurominds today. You have <strong style="color:#fff">${k.callbacks_new} new callback${k.callbacks_new === 1 ? '' : 's'}</strong> and <strong style="color:#fff">${k.lab_new} new lab request${k.lab_new === 1 ? '' : 's'}</strong> awaiting attention.</p>
    </div>

    <div class="kpi-grid">
      ${kpi('New callbacks', k.callbacks_new, 'Awaiting first contact')}
      ${kpi('Follow-ups due', k.followups, 'Need a follow-up call')}
      ${kpi('New lab requests', k.lab_new, 'Awaiting verification')}
      ${kpi('Confirmed-booking clicks', k.pwens_clicks_7d, 'PWeNS · last 7 days', 'up')}
      ${kpi('Feedback pending', k.feedback_pending, 'Awaiting moderation')}
    </div>

    ${CONFIG.ANALYTICS_CONNECTED ? `
    <div class="chart-row">
      <div class="panel">
        <div class="panel__head">
          <h3>Sessions &amp; leads · ${esc(ga.range)}</h3>
          ${GA_BADGE}
        </div>
        <div class="panel__body">
          ${sparkline(ga.daily_sessions)}
          <div class="flex between" style="margin-top:.75rem;font-size:13px">
            <span class="muted">Daily sessions</span>
            <span><strong>${ga.totals.sessions}</strong> sessions · <strong>${ga.totals.active_users}</strong> users</span>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel__head"><h3>Traffic sources</h3></div>
        <div class="panel__body">${donut(ga.by_source.map((s) => ({ label: cap(s.source), value: s.sessions })))}</div>
      </div>
    </div>

    <div class="chart-row">
      <div class="panel">
        <div class="panel__head"><h3>Key actions · last 7 days</h3></div>
        <div class="panel__body">
          ${bars([
            { label: 'Condition views', value: ga.events.condition_view },
            { label: 'Doctor views', value: ga.events.doctor_profile_view },
            { label: 'WhatsApp clicks', value: ga.events.whatsapp_click },
            { label: 'Call clicks', value: ga.events.call_click },
            { label: 'Callback submits', value: ga.events.support_booking_submit },
            { label: 'PWeNS clicks', value: ga.events.pwens_booking_click }
          ])}
        </div>
      </div>
      <div class="panel">
        <div class="panel__head"><h3>Devices</h3></div>
        <div class="panel__body">${donut(ga.by_device.map((s) => ({ label: cap(s.device), value: s.sessions })), { size: 140 })}</div>
      </div>
    </div>
    ` : `
    <div class="panel">
      <div class="panel__head"><h3>Website analytics</h3>${GA_BADGE}</div>
      <div class="panel__body">
        <div class="empty-state" style="padding:2rem 1rem;text-align:center">
          <p style="font-size:15px;font-weight:500;margin:0 0 .35rem">Real analytics not connected yet.</p>
          <p class="muted" style="font-size:13px;margin:0">Sessions, traffic sources, and key website actions will appear here once the GA4 Data API is connected.</p>
        </div>
      </div>
    </div>
    `}

    <div class="panel">
      <div class="panel__head"><h3>Recent callback requests</h3></div>
      <div class="panel__body flush">
        <table class="table">
          <thead><tr><th>Name</th><th>Concern</th><th>Preferred</th><th>Source</th><th>Status</th></tr></thead>
          <tbody>
            ${d.recent_callbacks.map((c) => `
              <tr>
                <td><strong>${esc(c.patient_name)}</strong></td>
                <td>${esc(c.generic_concern_category)}</td>
                <td>${esc(c.preferred_call_date)} · ${esc(c.preferred_call_time_slot)}</td>
                <td>${esc(c.source_hint)}</td>
                <td><span class="badge ${c.status}">${esc(c.status.replace('_', ' '))}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <p class="muted" style="font-size:12px">Analytics are powered by the GA4 Data API. BigQuery is an optional sandbox archive and is not queried for these dashboards in V1.</p>
    ${CONFIG.ANALYTICS_CONNECTED ? '' : '<p class="muted" style="font-size:12px"><strong>Real analytics not connected yet.</strong> Live sessions, leads, and bookings will appear here once the GA4 Data API is connected.</p>'}
  `;
}

function kpi(label, value, sub, dir) {
  return `
    <div class="kpi">
      <div class="kpi__label">${label}</div>
      <div class="kpi__value">${value}</div>
      <div class="kpi__delta ${dir || ''}">${sub}</div>
    </div>`;
}

const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
