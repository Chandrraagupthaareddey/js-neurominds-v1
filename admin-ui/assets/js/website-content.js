/**
 * JS Neurominds V1 — admin-ui/assets/js/website-content.js
 * Phase 1 foundation screens for no-code website management. These present the
 * admin-editable website data in simple, staff-friendly tables (no raw JSON,
 * no technical config). Full inline editing + the Draft→Review→Approve→Publish
 * workflow lands in Phase 2; these screens establish the structure and let
 * staff see exactly what controls the public site.
 */
import { api } from './api.js';
import { can } from './auth.js';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const onoff = (v) => String(v).toUpperCase() === 'YES' || v === true
  ? '<span class="badge ok">enabled</span>' : '<span class="badge closed">hidden</span>';

const phase2Note = (what) =>
  `<p class="muted" style="font-size:12px">Inline editing, reordering, and the approve &amp; publish workflow for ${what} arrive in the next phase. This screen shows exactly what is live on the public website today.</p>`;

/* ---------------- Social Links ---------------- */
export async function renderSocialLinks(mount) {
  const res = await api.socialLinks();
  const rows = (res.data || []).slice().sort((a, b) => Number(a.display_order) - Number(b.display_order));
  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h3>Social Links</h3>${can('edit_content') ? '<button class="btn btn--primary btn--sm" disabled title="Editing arrives with the publish workflow">Add link</button>' : ''}</div>
      <div class="panel__body flush">
        <table class="table">
          <thead><tr><th>Order</th><th>Platform</th><th>URL</th><th>New tab</th><th>Visibility</th></tr></thead>
          <tbody>
            ${rows.map((s) => `
              <tr>
                <td>${esc(s.display_order)}</td>
                <td><strong>${esc(s.label)}</strong><br><span class="muted" style="font-size:12px">${esc(s.platform)}</span></td>
                <td style="font-size:12.5px">${s.url ? esc(s.url) : '<span class="muted">— not set —</span>'}</td>
                <td>${String(s.open_in_new_tab).toUpperCase() === 'YES' ? 'Yes' : 'No'}</td>
                <td>${(s.url && String(s.is_enabled).toUpperCase() === 'YES') ? onoff('YES') : onoff('NO')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="muted" style="font-size:12px">Only links that are <strong>enabled</strong> and have a URL appear in the public footer. Empty or disabled links are hidden automatically.</p>
    ${phase2Note('social links')}`;
}

/* ---------------- Footer Settings ---------------- */
export async function renderFooterSettings(mount) {
  const res = await api.footerSettings();
  const rows = res.data || [];
  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h3>Footer Settings</h3></div>
      <div class="panel__body flush">
        <table class="table">
          <thead><tr><th>Setting</th><th>Value</th><th>Visibility</th></tr></thead>
          <tbody>
            ${rows.map((r) => `
              <tr><td><strong>${esc(r.setting_key.replace(/_/g, ' '))}</strong></td>
              <td style="font-size:13px">${esc(r.setting_value)}</td>
              <td>${onoff(r.is_enabled)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ${phase2Note('footer settings')}`;
}

/* ---------------- Brand Settings ---------------- */
export async function renderBrandSettings(mount) {
  const res = await api.brandSettings();
  const b = res.data || {};
  const row = (label, val, isImg) => `
    <div class="field" style="display:flex;align-items:center;gap:1rem">
      <div style="flex:1"><label>${label}</label><input value="${esc(val || '')}" disabled /></div>
      ${isImg && val ? `<img src="${esc(val)}" alt="" style="width:48px;height:48px;border-radius:10px;object-fit:contain;background:var(--ink-900);padding:4px" />` : ''}
    </div>`;
  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h3>Brand Settings</h3></div>
      <div class="panel__body">
        ${row('Header logo URL', b.logo_url, true)}
        ${row('Footer logo URL', b.footer_logo_url, true)}
        ${row('Favicon URL', b.favicon_url, true)}
        ${row('Social preview image URL', b.social_preview_url, true)}
        ${row('Logo alt text', b.alt_text, false)}
      </div>
    </div>
    <p class="muted" style="font-size:12px">These assets control the logo, browser-tab icon, and social-share image across the public website and this portal.</p>
    ${phase2Note('brand assets')}`;
}

/* ---------------- Navigation Management ---------------- */
export async function renderNavigation(mount) {
  const res = await api.navigationItems();
  const rows = (res.data || []).slice().sort((a, b) => Number(a.order || a.display_order || 0) - Number(b.order || b.display_order || 0));
  const flagRes = await api.featureFlags();
  const flags = flagRes.data || {};
  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h3>Navigation Management</h3></div>
      <div class="panel__body flush">
        <table class="table">
          <thead><tr><th>Order</th><th>Label</th><th>Route</th><th>Public visibility</th></tr></thead>
          <tbody>
            ${rows.map((n) => {
              let vis = '<span class="badge ok">visible</span>';
              if (n.route === '/lab' && !flags.public_lab_tests_enabled) vis = '<span class="badge closed">hidden by flag</span>';
              if (n.route === '/knowledge' && flags.public_knowledge_enabled === false) vis = '<span class="badge closed">hidden by flag</span>';
              return `<tr><td>${esc(n.order || n.display_order || '')}</td><td><strong>${esc(n.label)}</strong></td><td style="font-size:12.5px">${esc(n.route)}</td><td>${vis}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="muted" style="font-size:12px">Lab Tests is intentionally hidden by the <strong>public_lab_tests_enabled</strong> feature flag. Turn it on in Feature Flags to show it everywhere — no code change needed.</p>
    ${phase2Note('navigation (reorder, rename, show/hide)')}`;
}

/* ---------------- Feature Flags ---------------- */
export async function renderFeatureFlags(mount) {
  const res = await api.featureFlags();
  const flags = res.data || {};
  const canEdit = can('edit_settings');
  const labelFor = {
    public_lab_tests_enabled: 'Lab Tests — public visibility',
    public_testimonials_enabled: 'Testimonials page',
    public_reviews_enabled: 'Google Reviews section',
    public_knowledge_enabled: 'Knowledge hub',
    public_announcements_enabled: 'Announcement banner',
    floating_cta_enabled: 'Floating contact buttons'
  };
  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h3>Feature Flags</h3>${canEdit ? '<span class="badge new badge--plain">Super Admin / Admin</span>' : '<span class="badge closed">read-only for your role</span>'}</div>
      <div class="panel__body flush">
        <table class="table">
          <thead><tr><th>Feature</th><th>Key</th><th>State</th></tr></thead>
          <tbody>
            ${Object.keys(flags).map((k) => `
              <tr>
                <td><strong>${esc(labelFor[k] || k.replace(/_/g, ' '))}</strong></td>
                <td><code style="font-size:12px">${esc(k)}</code></td>
                <td>${flags[k] === true ? '<span class="badge ok">Enabled</span>' : '<span class="badge closed">Disabled</span>'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="muted" style="font-size:12px"><strong>Lab Tests are disabled by default</strong> while the clinic focuses on consultations. When re-enabled, all Lab content (nav, footer, homepage, sitemap) returns automatically with no deployment.</p>
    ${phase2Note('feature-flag toggles')}`;
}

/* ---------------- Testimonials ---------------- */
export async function renderTestimonialsAdmin(mount) {
  const res = await api.testimonials();
  const rows = res.data || [];
  mount.innerHTML = `
    <div class="panel">
      <div class="panel__head"><h3>Testimonials</h3><span class="badge ${rows.length ? 'ok' : 'closed'}">${rows.length} approved</span></div>
      <div class="panel__body flush">
        <table class="table">
          <thead><tr><th>Author</th><th>Rating</th><th>Quote</th><th>Status</th></tr></thead>
          <tbody>
            ${rows.map((t) => `
              <tr>
                <td><strong>${esc(t.author_display)}</strong><br><span class="muted" style="font-size:12px">${esc(t.area || '')}</span></td>
                <td>${'★'.repeat(t.rating)}</td>
                <td style="font-size:13px">${esc(t.quote)}</td>
                <td><span class="badge ${t.status}">${esc(t.status)}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="muted" style="font-size:12px">Only <strong>approved</strong> testimonials show publicly. Patient experiences only — no clinical details.</p>
    ${phase2Note('testimonials (add, moderate, order)')}`;
}

/* ---------------- Google Reviews ---------------- */
export async function renderReviewsAdmin(mount) {
  const res = await api.googleReviews();
  const data = res.data || {};
  const s = data.summary || {};
  const rows = data.reviews || [];
  mount.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi__label">Average rating</div><div class="kpi__value">${esc(s.rating || '—')}</div><div class="kpi__delta">Google profile</div></div>
      <div class="kpi"><div class="kpi__label">Total reviews</div><div class="kpi__value">${esc(s.review_count || rows.length)}</div></div>
      <div class="kpi"><div class="kpi__label">Shown publicly</div><div class="kpi__value">${rows.filter((r) => r.status === 'approved').length}</div><div class="kpi__delta">Approved only</div></div>
    </div>
    <div class="panel">
      <div class="panel__head"><h3>Google Reviews</h3><a class="btn btn--ghost btn--sm" href="${esc(s.profile_url || '#')}" target="_blank" rel="noopener">Open Google profile</a></div>
      <div class="panel__body flush">
        <table class="table">
          <thead><tr><th>Author</th><th>Rating</th><th>Review</th><th>Status</th></tr></thead>
          <tbody>
            ${rows.map((r) => `
              <tr>
                <td><strong>${esc(r.author_display)}</strong><br><span class="muted" style="font-size:12px">${esc(r.relative_time || '')}</span></td>
                <td>${'★'.repeat(r.rating)}</td>
                <td style="font-size:13px">${esc(r.text)}</td>
                <td><span class="badge ${r.status}">${esc(r.status)}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="muted" style="font-size:12px">Reviews are curated manually and require approval before they appear publicly. Public cards link back to the Google profile.</p>
    ${phase2Note('Google reviews (add, approve, sync)')}`;
}
