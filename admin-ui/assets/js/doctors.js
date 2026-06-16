/**
 * JS Neurominds V1 — admin-ui/assets/js/doctors.js
 * Doctors Management. Lists doctors with their booking/consultation toggles.
 * Editing is gated by the edit_content action.
 */
import { api } from './api.js';
import { can } from './auth.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export async function renderDoctors(mount) {
  const res = await api.doctors();
  const docs = res.data;
  const editable = can('edit_content');

  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h3>Doctors</h3>${editable ? '<button class="btn btn--primary btn--sm" disabled title="Editing UI is part of the CMS build">Add doctor</button>' : ''}</div>
      <div class="panel__body">
        ${docs.map((d) => `
          <div class="panel" style="margin-bottom:1rem">
            <div class="panel__body">
              <div class="flex between center" style="flex-wrap:wrap;gap:1rem">
                <div>
                  <h3 style="margin-bottom:.25rem">${esc(d.full_name)}</h3>
                  <span class="badge ${d.status}">${esc(d.status)}</span>
                  <p class="muted" style="margin:.5rem 0 0">${esc(d.qualification)} · ${esc(d.experience_years)} yrs</p>
                  <p style="margin:.25rem 0 0;font-size:13px">${esc(d.specialization)}</p>
                </div>
                <div style="font-size:12.5px">
                  ${toggle('Support booking', d.support_booking_enabled)}
                  ${toggle('Direct booking', d.direct_booking_enabled)}
                  ${toggle('Online', d.online_consultation_enabled)}
                  ${toggle('Clinic visit', d.clinic_visit_enabled)}
                </div>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function toggle(label, val) {
  const on = val === 'YES';
  return `<div class="flex between" style="gap:1rem;margin-bottom:.3rem"><span class="muted">${label}</span><span class="badge ${on ? 'ok' : 'closed'}">${on ? 'on' : 'off'}</span></div>`;
}
