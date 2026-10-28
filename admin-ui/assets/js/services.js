/**
 * JS Neurominds V1 — admin-ui/assets/js/services.js
 * Services & Lab Packages management (read view in V1 local build).
 */
import { api } from './api.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export async function renderServices(mount) {
  const res = await api.content();
  const { services = [], lab_packages = [] } = res.data || {};
  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h3>Services</h3></div>
      <div class="panel__body flush">
        <table class="table"><thead><tr><th>Service</th><th>Summary</th><th>Status</th></tr></thead><tbody>
          ${services.map((s) => `<tr><td><strong>${esc(s.name)}</strong></td><td style="font-size:13px">${esc(s.summary)}</td><td><span class="badge ${s.status}">${esc(s.status)}</span></td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>
    <div class="panel">
      <div class="panel__head"><h3>Lab packages</h3></div>
      <div class="panel__body flush">
        <table class="table"><thead><tr><th>Package</th><th>Turnaround</th><th>Status</th></tr></thead><tbody>
          ${lab_packages.map((p) => `<tr><td><strong>${esc(p.name)}</strong></td><td style="font-size:13px">${esc(p.turnaround)}</td><td><span class="badge ${p.status}">${esc(p.status)}</span></td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>`;
}
