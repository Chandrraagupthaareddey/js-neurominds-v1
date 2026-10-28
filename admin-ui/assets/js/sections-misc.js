/**
 * JS Neurominds V1 — admin-ui/assets/js/sections-misc.js
 * Lighter admin sections sharing one module: Booking dashboard, Feedback
 * Center, Marketing (GA4), Media Library, Backup Registry, Settings.
 */
import { api } from './api.js';
import { can } from './auth.js';
import { CLINIC } from '../../../shared/constants.js';
import { bars, donut } from './charts.js';
import { toast } from './admin-app.js';
import { describeApiError } from './api-envelope.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export async function renderSimple(mount, key) {
  if (key === 'booking') return booking(mount);
  if (key === 'feedback') return feedback(mount);
  if (key === 'marketing') return marketing(mount);
  if (key === 'media') return media(mount);
  if (key === 'backup') return backup(mount);
  if (key === 'settings') return settings(mount);
  mount.innerHTML = `<div class="panel"><div class="panel__body"><p>Section not found.</p></div></div>`;
}

async function booking(mount) {
  const res = await api.dashboard();
  const ga = (res.data && res.data.ga4) || {};
  ga.events = ga.events || {};
  mount.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi__label">Support booking clicks</div><div class="kpi__value">${ga.events.support_booking_click}</div></div>
      <div class="kpi"><div class="kpi__label">Callback submits</div><div class="kpi__value">${ga.events.support_booking_submit}</div></div>
      <div class="kpi"><div class="kpi__label">PWeNS clicks</div><div class="kpi__value">${ga.events.pwens_booking_click}</div></div>
    </div>
    <div class="panel"><div class="panel__head"><h3>Booking funnel · last 7 days</h3></div>
      <div class="panel__body">${bars([
        { label: 'Booking CTA clicks', value: ga.events.support_booking_click },
        { label: 'Callback form submits', value: ga.events.support_booking_submit },
        { label: 'PWeNS booking clicks', value: ga.events.pwens_booking_click }
      ])}</div></div>
    <p class="muted" style="font-size:12px">Confirmed appointments live in PWeNS/Doctor24x7 in V1. This view tracks intent via GA4.</p>`;
}

async function feedback(mount) {
  const res = await api.feedback();
  const rows = Array.isArray(res.data) ? res.data : [];
  const canMod = can('moderate_feedback');
  mount.innerHTML = `
    <div class="panel"><div class="panel__head"><h3>Feedback Center</h3><span class="badge pending">${rows.filter((r) => r.status === 'pending').length} pending</span></div>
      <div class="panel__body flush">
        <table class="table"><thead><tr><th>Rating</th><th>Message</th><th>Consent</th><th>Status</th>${canMod ? '<th></th>' : ''}</tr></thead><tbody>
          ${rows.map((r, i) => `<tr>
            <td>${'★'.repeat(r.rating)}</td>
            <td style="font-size:13px">${esc(r.message)}</td>
            <td>${r.consent_given === 'YES' ? '<span class="badge ok">yes</span>' : '<span class="badge closed">no</span>'}</td>
            <td><span class="badge ${r.status}">${esc(r.status)}</span></td>
            ${canMod ? `<td><div class="flex gap">
              <button class="btn btn--ghost btn--sm fb-approve" data-i="${i}">Approve</button>
              <button class="btn btn--danger btn--sm fb-reject" data-i="${i}">Reject</button>
            </div></td>` : ''}
          </tr>`).join('')}
        </tbody></table>
      </div></div>`;
  if (canMod) {
    const act = async (i, status) => {
      const r = rows[i];
      try {
        await api.updateFeedbackStatus(r.feedback_id, status); // throws ApiError on failure
        r.status = status; toast(`Feedback ${status}`); feedback(mount);
      } catch (err) {
        toast('Could not update feedback: ' + describeApiError(err).title);
      }
    };
    mount.querySelectorAll('.fb-approve').forEach((b) => b.addEventListener('click', () => act(b.dataset.i, 'approved')));
    mount.querySelectorAll('.fb-reject').forEach((b) => b.addEventListener('click', () => act(b.dataset.i, 'rejected')));
  }
}

async function marketing(mount) {
  const res = await api.dashboard();
  const ga = (res.data && res.data.ga4) || {};
  ga.by_source = Array.isArray(ga.by_source) ? ga.by_source : [];
  ga.by_device = Array.isArray(ga.by_device) ? ga.by_device : [];
  mount.innerHTML = `
    <div class="panel"><div class="panel__head"><h3>Marketing · GA4</h3><span class="badge ok">GA4 Data API</span></div>
      <div class="panel__body">
        <div class="chart-row" style="margin:0">
          <div>${bars(ga.by_source.map((s) => ({ label: cap(s.source), value: s.sessions })))}</div>
          <div>${donut(ga.by_device.map((s) => ({ label: cap(s.device), value: s.sessions })), { size: 140 })}</div>
        </div>
      </div></div>
    <p class="muted" style="font-size:12px">Anonymized traffic only. No PII is sent to GA4. A future Marketing role sees this view exclusively.</p>`;
}

function media(mount) {
  mount.innerHTML = `
    <div class="panel"><div class="panel__head"><h3>Media Library</h3></div>
      <div class="panel__body">
        <p class="muted">Media is stored in Google Drive via the CMS. Uploads return a Drive file ID + URL recorded in Media_Library. The upload UI ships with the GAS Admin CMS build (Part F).</p>
        <div class="kpi-grid" style="margin-top:1rem">
          <div class="kpi"><div class="kpi__label">Storage</div><div class="kpi__value" style="font-size:1.1rem">Google Drive</div></div>
          <div class="kpi"><div class="kpi__label">Index</div><div class="kpi__value" style="font-size:1.1rem">Media_Library tab</div></div>
        </div>
      </div></div>`;
}

function backup(mount) {
  const canRun = can('run_backup');
  mount.innerHTML = `
    <div class="panel"><div class="panel__head"><h3>Backup Registry</h3>${canRun ? '<button class="btn btn--primary btn--sm" id="run-backup">Run backup now</button>' : ''}</div>
      <div class="panel__body flush">
        <table class="table"><thead><tr><th>When</th><th>Kind</th><th>Status</th></tr></thead><tbody>
          <tr><td>2026-06-15 02:00</td><td>Sheets snapshot</td><td><span class="badge success">success</span></td></tr>
          <tr><td>2026-06-14 02:00</td><td>Sheets snapshot</td><td><span class="badge success">success</span></td></tr>
        </tbody></table>
      </div></div>
    <p class="muted" style="font-size:12px">Backups copy both workbooks to a dated Drive folder. Registry rows are written to Backup_Registry.</p>`;
  if (canRun) document.getElementById('run-backup').addEventListener('click', () => toast('Backup queued (mock)'));
}

async function settings(mount) {
  const canEdit = can('edit_settings');
  const res = await api.config();
  const c = res.data || {};
  const row = (label, val) => `<div class="field"><label>${label}</label><input value="${esc(val)}" ${canEdit ? '' : 'disabled'} /></div>`;
  mount.innerHTML = `
    <div class="panel"><div class="panel__head"><h3>Settings</h3>${canEdit ? '<button class="btn btn--primary btn--sm" id="save-settings">Save</button>' : '<span class="badge closed">read-only for your role</span>'}</div>
      <div class="panel__body">
        ${row('Clinic name', c.clinic_name)}
        ${row('Display phone', c.display_phone)}
        ${row('CTA phone', c.cta_phone)}
        ${row('WhatsApp link', c.whatsapp_link)}
        ${row('Maps URL', c.maps_url)}
        ${row('PWeNS booking URL', c.pwens_booking_url)}
        ${row('Support email', c.email_support || CLINIC.support_email)}
        <p class="muted" style="font-size:12px">These map to System_Config. Editing requires Super Admin. Secrets (Deploy Hook URL, API keys) live in Script Properties, never here.</p>
      </div></div>`;
  if (canEdit) document.getElementById('save-settings').addEventListener('click', () => toast('Settings saved (mock)'));
}

const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
