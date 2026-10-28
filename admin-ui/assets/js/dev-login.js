/**
 * JS Neurominds V1 — admin-ui/assets/js/dev-login.js
 * DEV-SERVER-ONLY simulated sign-in picker.
 *
 * This module is loaded exclusively via `if (import.meta.env.DEV) import(...)`
 * in admin-app.js. Vite replaces `import.meta.env.DEV` with `false` during
 * `vite build`, so the import is dead code and this file is never emitted into
 * a production bundle. It also requires VITE_ENABLE_MOCK_LOGIN=true and no real
 * OAuth client id (see config.js). There is no runtime switch that can enable
 * it in a deployed build (audit JP-031).
 *
 * It does not add any new session primitive: it calls the same
 * signInWithGoogleProfile() allowlist path as the real Google flow, passing the
 * mock user list as the allowlist.
 */
import { MOCK_USERS } from '../../../shared/mock-public-content.js';
import { ROLE_LABELS } from '../../../shared/permissions.js';
import { signInWithGoogleProfile } from './auth.js';

export function renderDevLogin(root, { onSignedIn, denied } = {}) {
  const users = MOCK_USERS.filter((u) => u.status === 'active');
  root.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand__mark"><img src="/assets/brand/logo.png" alt="JS Neurominds" width="52" height="52" /></div>
        <h2>JS Neurominds</h2>
        <p class="muted" style="margin-top:0">Admin Portal · <b>developer sign-in (dev server only)</b></p>
        <div class="field" style="text-align:left; margin-top:1.25rem">
          <label for="login-email">Sign in as</label>
          <select id="login-email">
            ${users.map((u) => `<option value="${u.email}">${u.name} — ${ROLE_LABELS[u.role_key] || u.role_key}</option>`).join('')}
          </select>
        </div>
        <button class="google-btn" id="login-btn"><span class="google-g"></span> Continue</button>
        ${denied ? `<div class="access-denied"><strong>Access denied.</strong> <b>${denied}</b> is not authorized.</div>` : ''}
      </div>
    </div>`;
  root.querySelector('#login-btn').addEventListener('click', () => {
    const email = root.querySelector('#login-email').value;
    const user = users.find((u) => u.email === email);
    const res = signInWithGoogleProfile({ email, name: user && user.name }, users.map((u) => u.email));
    if (res.ok) onSignedIn && onSignedIn();
    else renderDevLogin(root, { onSignedIn, denied: res.email });
  });
}
