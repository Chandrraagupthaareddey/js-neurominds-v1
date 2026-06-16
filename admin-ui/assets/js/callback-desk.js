/**
 * JS Neurominds V1 — admin-ui/assets/js/callback-desk.js
 * Callback Support Desk. A searchable, filterable request table; clicking a row
 * opens a right-side detail drawer with full details, source, the approved
 * checklist, what to ask / not ask, click-to-call & click-to-WhatsApp, an
 * outcome form, and a status-history timeline. Status changes are RBAC-gated.
 */
import { api } from './api.js';
import { can } from './auth.js';
import { CALLBACK_STATUSES } from '../../../shared/constants.js';
import { toast, openDrawer, closeDrawer } from './admin-app.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

let allRows = [];
let checklist = [];
let questions = { ask: [], dont_ask: [] };
let filterStatus = 'all';
let searchTerm = '';

export async function renderCallbackDesk(mount) {
  const [cbRes, chkRes, qRes] = await Promise.all([
    api.callbacks(), api.callbackChecklist(), api.callbackQuestions()
  ]);
  allRows = cbRes.data; checklist = chkRes.data; questions = qRes.data;

  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head">
        <h3>Callback requests</h3>
        <span class="badge new">${allRows.filter((c) => c.status === 'new').length} new</span>
      </div>
      <div class="toolbar">
        <div class="search"><input type="search" id="cb-search" placeholder="Search by name, mobile, or concern…" aria-label="Search callbacks" /></div>
        <button class="filter-chip active" data-status="all">All</button>
        <button class="filter-chip" data-status="new">New</button>
        <button class="filter-chip" data-status="contacted">Contacted</button>
        <button class="filter-chip" data-status="followup_required">Follow-up</button>
        <button class="filter-chip" data-status="closed">Closed</button>
      </div>
      <div class="panel__body flush" id="cb-table-wrap"></div>
    </div>`;

  mount.querySelector('#cb-search').addEventListener('input', (e) => { searchTerm = e.target.value.toLowerCase(); drawTable(); });
  mount.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filterStatus = chip.dataset.status;
      mount.querySelectorAll('.filter-chip').forEach((c) => c.classList.toggle('active', c === chip));
      drawTable();
    });
  });
  drawTable();
}

function filtered() {
  return allRows.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchTerm) {
      const hay = `${c.patient_name} ${c.mobile_number} ${c.generic_concern_category}`.toLowerCase();
      if (!hay.includes(searchTerm)) return false;
    }
    return true;
  });
}

function drawTable() {
  const wrap = document.getElementById('cb-table-wrap');
  const rows = filtered();
  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔍</div><p>No requests match your filters.</p></div>`;
    return;
  }
  wrap.innerHTML = `
    <table class="table">
      <thead><tr><th>Patient</th><th>Concern</th><th>Preferred</th><th>Source</th><th>Status</th></tr></thead>
      <tbody>
        ${rows.map((c) => `
          <tr class="selectable" data-id="${c.callback_id}">
            <td><strong>${esc(c.patient_name)}</strong><br><span class="muted" style="font-size:12px">${esc(c.mobile_number)}</span></td>
            <td>${esc(c.generic_concern_category)}</td>
            <td style="font-size:12.5px">${esc(c.preferred_call_date)}<br>${esc(c.preferred_call_time_slot)}</td>
            <td><span class="badge new badge--plain">${esc(c.source_hint)}</span></td>
            <td><span class="badge ${c.status}">${esc(c.status.replace('_', ' '))}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  wrap.querySelectorAll('tr.selectable').forEach((tr) => tr.addEventListener('click', () => openDetail(tr.dataset.id)));
}

async function openDetail(id) {
  const c = allRows.find((x) => x.callback_id === id);
  if (!c) return;
  const histRes = await api.callbackHistory(id);
  const history = histRes.data || [];
  const waNumber = (c.whatsapp_number || c.mobile_number || '').replace(/\D/g, '');
  const telNumber = (c.mobile_number || '').replace(/\D/g, '');
  const canClose = can('close_request');

  const body = `
    <dl class="kv">
      <dt>Mobile</dt><dd>${esc(c.mobile_number)}</dd>
      <dt>WhatsApp</dt><dd>${esc(c.whatsapp_number || c.mobile_number)}</dd>
      <dt>Email</dt><dd>${esc(c.patient_email || '—')}</dd>
      <dt>Preferred</dt><dd>${esc(c.preferred_call_date)} · ${esc(c.preferred_call_time_slot)}</dd>
      <dt>For</dt><dd>${esc(c.consultation_for)} · ${esc(c.new_patient_or_followup)}</dd>
      <dt>Doctor</dt><dd>${esc(c.preferred_doctor)}</dd>
      <dt>Concern</dt><dd>${esc(c.generic_concern_category)}</dd>
      <dt>Mode</dt><dd>${esc(c.consultation_mode_interest)}</dd>
      <dt>Source</dt><dd><span class="badge new badge--plain">${esc(c.source_hint)}</span></dd>
    </dl>

    <h4 style="font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-400); margin-bottom:.5rem">Checklist</h4>
    <ul class="checklist">
      ${checklist.map((item) => `<li><input type="checkbox" id="chk-${item.checklist_id}"/> <label for="chk-${item.checklist_id}" style="font-weight:450">${esc(item.label)}</label> ${item.required === 'YES' ? '<span class="badge draft badge--plain" style="margin-left:auto">required</span>' : ''}</li>`).join('')}
    </ul>

    <div class="flex gap wrap">
      <div style="flex:1; min-width:160px">
        <h4 style="font-size:12px; color:var(--ok)">What to ask</h4>
        <ul class="ask-list">${questions.ask.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
      </div>
      <div style="flex:1; min-width:160px">
        <h4 style="font-size:12px; color:var(--err)">What not to ask</h4>
        <ul class="dont-list">${questions.dont_ask.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
      </div>
    </div>

    <h4 style="font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-400); margin:1rem 0 .5rem">Record outcome</h4>
    <div class="field">
      <select id="cb-status" ${canClose ? '' : 'disabled'}>
        ${CALLBACK_STATUSES.map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${cap(s.replace('_', ' '))}</option>`).join('')}
      </select>
    </div>
    <div class="field"><textarea id="cb-note" rows="2" placeholder="Outcome note (no clinical details)" ${canClose ? '' : 'disabled'}></textarea></div>
    <button class="btn btn--primary btn--sm" id="cb-save" ${canClose ? '' : 'disabled title="Your role cannot change status"'}>Save outcome</button>
    ${!canClose ? '<p class="muted" style="font-size:12px; margin-top:.5rem">Your role can view but not change status.</p>' : ''}

    <h4 style="font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-400); margin:1.25rem 0 .75rem">Status history</h4>
    <div class="timeline" id="cb-history">
      ${history.length ? history.map((h) => `
        <div class="timeline__item">
          <div class="timeline__title">${esc(cap(h.status.replace('_', ' ')))}</div>
          <div class="timeline__meta">${esc(h.at)}${h.note ? ' · ' + esc(h.note) : ''}</div>
        </div>`).join('') : '<p class="muted" style="font-size:12.5px">No status changes yet.</p>'}
    </div>`;

  const foot = `
    <a class="btn btn--call" style="flex:1" href="tel:+91${telNumber}">📞 Call patient</a>
    <a class="btn btn--wa" style="flex:1" href="https://wa.me/91${waNumber}" target="_blank" rel="noopener">💬 WhatsApp</a>`;

  openDrawer(esc(c.patient_name), body, foot);

  const saveBtn = document.getElementById('cb-save');
  if (saveBtn && canClose) {
    saveBtn.addEventListener('click', async () => {
      const status = document.getElementById('cb-status').value;
      const note = document.getElementById('cb-note').value.trim();
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
      const res = await api.updateCallbackStatus(c.callback_id, status, note);
      if (res.success) {
        c.status = status;
        toast('Outcome saved');
        drawTable();
        openDetail(c.callback_id); // refresh drawer with new history
      } else { saveBtn.disabled = false; saveBtn.textContent = 'Save outcome'; toast('Could not save'); }
    });
  }
}
