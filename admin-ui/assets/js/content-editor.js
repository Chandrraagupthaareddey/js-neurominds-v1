/**
 * JS Neurominds V1 — admin-ui/assets/js/content-editor.js
 * Right-side editor drawer for a single content item. Reuses the shared drawer.
 *
 * Draft/live separation: edits are saved to a DRAFT (never touch the live copy)
 * until an authorized publisher approves. Flow:
 *   editor edits → Save draft (status=draft) → Submit for review (status=pending)
 *   → publisher Publishes (draft applied to live, status=published)
 *   or publisher Requests changes (status=draft, draft kept for revision).
 *
 * Buttons shown depend on role:
 *   - edit_content (content_editor, admin, super_admin): Save draft, Submit for review
 *   - publish     (admin, super_admin):                  Publish, Request changes
 */
import { api } from './api.js';
import { can } from './auth.js';
import { openDrawer, closeDrawer, toast } from './admin-app.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/**
 * @param {object} item      the content row (may carry a `_draft` overlay)
 * @param {object} typeMeta  entry from CONTENT_TYPES
 * @param {function} onDone  called after any successful action to refresh the list
 */
export function openContentEditor(item, typeMeta, onDone) {
  const draft = item._draft || {};
  const valueOf = (key) => (Object.prototype.hasOwnProperty.call(draft, key) ? draft[key] : item[key]) || '';
  const status = item.status || 'published';
  const canEdit = can('edit_content');
  const canPublish = can('publish');
  const keyVal = item[typeMeta.keyCol];

  const body = `
    <div class="editor-status">
      Status: <span class="badge ${esc(status)}">${esc(status)}</span>
      ${item._draft ? '<span class="badge review" style="margin-left:6px">unpublished changes</span>' : ''}
    </div>
    <form id="content-editor-form" class="content-editor" novalidate>
      ${typeMeta.fields.map((f) => `
        <div class="field">
          <label for="ce-${f.key}">${esc(f.label)}</label>
          ${f.type === 'textarea'
            ? `<textarea id="ce-${f.key}" name="${f.key}" rows="3">${esc(valueOf(f.key))}</textarea>`
            : `<input id="ce-${f.key}" name="${f.key}" type="text" value="${esc(valueOf(f.key))}" />`}
        </div>`).join('')}
    </form>
    <p class="muted" style="font-size:12px">Changes are saved as a draft and stay private until published. The live website is unaffected until an admin publishes.</p>`;

  const foot = `
    ${canEdit ? '<button class="btn btn--ghost btn--sm" id="ce-save">Save draft</button>' : ''}
    ${canEdit ? '<button class="btn btn--dark btn--sm" id="ce-submit">Submit for review</button>' : ''}
    ${canPublish && status === 'pending' ? '<button class="btn btn--ghost btn--sm" id="ce-reject">Request changes</button>' : ''}
    ${canPublish ? '<button class="btn btn--primary btn--sm" id="ce-publish">Publish</button>' : ''}`;

  openDrawer(`Edit — ${esc(item[typeMeta.titleField])}`, body, foot);

  const collect = () => {
    const out = {};
    typeMeta.fields.forEach((f) => {
      const el = document.getElementById('ce-' + f.key);
      if (el) out[f.key] = el.value;
    });
    return out;
  };

  const run = async (btnId, label, fn) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const original = btn.textContent;
      btn.disabled = true; btn.textContent = label + '…';
      try {
        const res = await fn();
        if (res && res.success !== false) {
          toast(label + ' — done');
          closeDrawer();
          if (typeof onDone === 'function') onDone();
        } else {
          toast(label + ' failed');
          btn.disabled = false; btn.textContent = original;
        }
      } catch (err) {
        toast(label + ' failed');
        btn.disabled = false; btn.textContent = original;
      }
    });
  };

  run('ce-save', 'Save draft', () => api.saveContentDraft(typeMeta.tab, typeMeta.keyCol, keyVal, collect()));
  run('ce-submit', 'Submit for review', async () => {
    await api.saveContentDraft(typeMeta.tab, typeMeta.keyCol, keyVal, collect());
    return api.submitContentForReview(typeMeta.tab, typeMeta.keyCol, keyVal);
  });
  run('ce-reject', 'Request changes', () => api.requestContentChanges(typeMeta.tab, typeMeta.keyCol, keyVal));
  run('ce-publish', 'Publish', async () => {
    // Persist any in-progress edits first so Publish always ships what's on screen.
    if (can('edit_content')) await api.saveContentDraft(typeMeta.tab, typeMeta.keyCol, keyVal, collect());
    return api.publishContent(typeMeta.tab, typeMeta.keyCol, keyVal);
  });
}
