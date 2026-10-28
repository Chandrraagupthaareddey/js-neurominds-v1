/**
 * JS Neurominds V1 — admin-ui/assets/js/lab-desk.js
 * Lab Requests Desk. Staff review home-collection requests and move them
 * through verification. No clinical data is shown — only logistics.
 */
import { api } from './api.js';
import { can } from './auth.js';
import { LAB_STATUSES } from '../../../shared/constants.js';
import { toast } from './admin-app.js';
import { describeApiError } from './api-envelope.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export async function renderLabDesk(mount) {
  const res = await api.labRequests();
  const rows = Array.isArray(res.data) ? res.data : [];
  const canUpdate = can('update_lab');

  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head">
        <h3>Home sample collection requests</h3>
        <span class="badge new">${rows.filter((r) => r.status === 'new').length} new</span>
      </div>
      <div class="panel__body flush">
        <table class="table">
          <thead><tr><th>Name</th><th>Contact</th><th>Pickup</th><th>Package</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${rows.map((r) => `
              <tr>
                <td><strong>${esc(r.name)}</strong></td>
                <td style="font-size:12.5px">${esc(r.mobile)}<br>${esc(r.email || '—')}</td>
                <td style="font-size:12.5px">${esc(r.pickup_area)}<br>${esc(r.preferred_pickup_date)} · ${esc(r.preferred_pickup_time)}</td>
                <td>${esc(r.selected_package)}</td>
                <td><span class="badge ${r.status}">${esc(r.status)}</span></td>
                <td>
                  <div class="flex gap">
                    <a class="btn btn--call btn--sm" href="tel:+91${esc((r.mobile||'').replace(/\\D/g,''))}">Call</a>
                    ${canUpdate ? `<select class="lab-status btn--sm" data-id="${r.lab_request_id}" style="padding:.3rem">
                      ${LAB_STATUSES.map((s) => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="muted" style="font-size:12px">Requests are not confirmed until staff verify availability with the patient. No prescriptions or clinical data are collected.</p>`;

  if (canUpdate) {
    mount.querySelectorAll('.lab-status').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await api.updateLabStatus(sel.dataset.id, sel.value); // throws ApiError on failure
          const badge = sel.closest('tr').querySelector('.badge');
          badge.className = 'badge ' + sel.value; badge.textContent = sel.value;
          toast('Lab request updated');
        } catch (err) {
          toast('Could not update: ' + describeApiError(err).title);
        }
      });
    });
  }
}
