/**
 * JS Neurominds V1 — admin-ui/assets/js/seo.js
 * SEO Dashboard. Shows which content types generate static stubs, their SEO
 * fields completeness, and the last sync/deploy status.
 */
import { api } from './api.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export async function renderSeo(mount) {
  const [contentRes, healthRes] = await Promise.all([api.content(), api.health()]);
  const { conditions, treatments, blogs } = contentRes.data;
  const h = healthRes.data;
  const all = [
    ...conditions.map((c) => ({ type: 'condition', slug: c.slug, title: c.seo_title, desc: c.seo_description })),
    ...treatments.map((t) => ({ type: 'treatment', slug: t.slug, title: t.seo_title, desc: t.seo_description })),
    ...blogs.map((b) => ({ type: 'blog', slug: b.slug, title: b.seo_title, desc: b.seo_description }))
  ];
  const complete = all.filter((r) => r.title && r.desc).length;

  mount.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi__label">Stub pages</div><div class="kpi__value">${all.length}</div><div class="kpi__delta">SEO-critical pages</div></div>
      <div class="kpi"><div class="kpi__label">SEO complete</div><div class="kpi__value">${complete}/${all.length}</div><div class="kpi__delta ${complete === all.length ? 'up' : ''}">Title + description set</div></div>
      <div class="kpi"><div class="kpi__label">Last deploy</div><div class="kpi__value" style="font-size:1rem">${esc(h.last_deploy_status)}</div><div class="kpi__delta">${esc(h.last_deploy_at)}</div></div>
    </div>
    <div class="panel">
      <div class="panel__head"><h3>SEO field coverage</h3></div>
      <div class="panel__body flush">
        <table class="table"><thead><tr><th>Type</th><th>Slug</th><th>Meta title</th><th>Meta description</th></tr></thead><tbody>
          ${all.map((r) => `<tr><td><span class="badge new">${esc(r.type)}</span></td><td>${esc(r.slug)}</td>
            <td>${r.title ? '<span class="badge ok">set</span>' : '<span class="badge error">missing</span>'}</td>
            <td>${r.desc ? '<span class="badge ok">set</span>' : '<span class="badge error">missing</span>'}</td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>
    <p class="muted" style="font-size:12px">Stubs are generated at Cloudflare build time from approved content (see Runbook → SEO stub flow).</p>`;
}
