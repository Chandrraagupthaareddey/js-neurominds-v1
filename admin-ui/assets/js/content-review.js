/**
 * JS Neurominds V1 — admin-ui/assets/js/content-review.js
 * Content Review & Publishing. Lists content by type with status, lets
 * authorized roles publish drafts and trigger a content sync (which, in
 * production, calls the Cloudflare Deploy Hook to rebuild SEO stubs).
 */
import { api } from './api.js';
import { can } from './auth.js';
import { toast } from './admin-app.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const TYPES = [
  ['conditions', 'Conditions', 'name'],
  ['treatments', 'Treatments', 'name'],
  ['services', 'Services', 'name'],
  ['lab_packages', 'Lab Packages', 'name'],
  ['blogs', 'Knowledge Articles', 'title'],
  ['faqs', 'FAQs', 'question']
];
let activeType = 'conditions';

export async function renderContentReview(mount) {
  const res = await api.content();
  const data = res.data;
  const canPublish = can('publish');
  const canSync = can('sync');

  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head">
        <h3>Content review &amp; publishing</h3>
        <div class="flex gap">
          ${canSync ? `<button class="btn btn--primary btn--sm" id="sync-btn">Sync approved content</button>` : ''}
        </div>
      </div>
      <div class="panel__body">
        <div class="runbook-tabs" id="type-tabs">
          ${TYPES.map(([key, label]) => `<button class="runbook-tab ${key === activeType ? 'active' : ''}" data-type="${key}">${label}</button>`).join('')}
        </div>
        <div id="content-table"></div>
      </div>
    </div>
    <p class="muted" style="font-size:12px">Publishing updates the live content. Syncing triggers a Cloudflare rebuild so SEO stubs and the sitemap regenerate from approved content.</p>`;

  const renderTable = () => {
    const [, , titleField] = TYPES.find((t) => t[0] === activeType);
    const rows = data[activeType] || [];
    document.getElementById('content-table').innerHTML = `
      <table class="table">
        <thead><tr><th>Title</th><th>Status</th>${canPublish ? '<th></th>' : ''}</tr></thead>
        <tbody>
          ${rows.map((r, i) => `
            <tr>
              <td><strong>${esc(r[titleField])}</strong></td>
              <td><span class="badge ${r.status || 'published'}">${esc(r.status || 'published')}</span></td>
              ${canPublish ? `<td>${(r.status && r.status !== 'published') ? `<button class="btn btn--ghost btn--sm publish-btn" data-i="${i}">Publish</button>` : '<span class="muted" style="font-size:12px">Live</span>'}</td>` : ''}
            </tr>`).join('')}
        </tbody>
      </table>`;
    if (canPublish) {
      document.querySelectorAll('.publish-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const r = rows[btn.dataset.i]; r.status = 'published';
          toast(`Published: ${r[titleField]}`); renderTable();
        });
      });
    }
  };

  document.querySelectorAll('#type-tabs .runbook-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeType = tab.dataset.type;
      document.querySelectorAll('#type-tabs .runbook-tab').forEach((t) => t.classList.toggle('active', t.dataset.type === activeType));
      renderTable();
    });
  });
  renderTable();

  if (canSync) {
    document.getElementById('sync-btn').addEventListener('click', async (e) => {
      e.target.disabled = true; e.target.textContent = 'Syncing…';
      const res = await api.syncContent();
      e.target.disabled = false; e.target.textContent = 'Sync approved content';
      toast(res.success ? `Deploy ${res.data.deploy_status} · ${res.data.at}` : 'Sync failed');
    });
  }
}
