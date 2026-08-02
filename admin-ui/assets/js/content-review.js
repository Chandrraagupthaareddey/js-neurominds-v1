/**
 * JS Neurominds V1 — admin-ui/assets/js/content-review.js
 * Content Review, editing & publishing. Lists content by type with status,
 * opens a per-item editor (draft → review → publish), and triggers a content
 * sync (which, in production, calls the Cloudflare Deploy Hook to rebuild SEO
 * stubs + sitemap from published content).
 */
import { api } from './api.js';
import { can } from './auth.js';
import { toast } from './admin-app.js';
import { CONTENT_TYPES, CONTENT_TYPE_ORDER } from './content-fields.js';
import { openContentEditor } from './content-editor.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

let activeType = 'conditions';

export async function renderContentReview(mount) {
  const canEdit = can('edit_content');
  const canSync = can('sync');
  let data = (await api.content()).data;

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
          ${CONTENT_TYPE_ORDER.map((key) => `<button class="runbook-tab ${key === activeType ? 'active' : ''}" data-type="${key}">${CONTENT_TYPES[key].label}</button>`).join('')}
        </div>
        <div id="content-table"></div>
      </div>
    </div>
    <p class="muted" style="font-size:12px">${canEdit ? 'Click any item to edit it. Edits are saved as a private draft; the live site changes only when an admin publishes. ' : ''}Syncing triggers a Cloudflare rebuild so SEO stubs and the sitemap regenerate from published content.</p>`;

  const refresh = async () => { data = (await api.content()).data; renderTable(); };

  const renderTable = () => {
    const meta = CONTENT_TYPES[activeType];
    const rows = data[activeType] || [];
    document.getElementById('content-table').innerHTML = `
      <table class="table">
        <thead><tr><th>Title</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${rows.map((r, i) => {
            const status = r.status || 'published';
            const hasDraft = !!r._draft;
            return `
            <tr class="${canEdit ? 'selectable' : ''}" data-i="${i}">
              <td><strong>${esc(r[meta.titleField])}</strong>${hasDraft ? ' <span class="badge review" style="font-size:.62rem">draft pending</span>' : ''}</td>
              <td><span class="badge ${esc(status)}">${esc(status)}</span></td>
              <td style="text-align:right">${canEdit ? '<span class="muted" style="font-size:12px">Edit ›</span>' : '<span class="muted" style="font-size:12px">Live</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    if (canEdit) {
      document.querySelectorAll('#content-table tr.selectable').forEach((tr) => {
        tr.addEventListener('click', () => {
          const item = rows[tr.dataset.i];
          openContentEditor(item, meta, refresh);
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
