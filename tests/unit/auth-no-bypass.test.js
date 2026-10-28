import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as auth from '../../admin-ui/assets/js/auth.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

test('JP-031: bypass primitives no longer exist on auth.js', () => {
  for (const name of ['startPreviewSession', 'signInAs', 'setRole', 'knownUsers']) {
    assert.equal(typeof auth[name], 'undefined', `${name} still exported`);
  }
});

test('JP-031: no source file reads VITE_ADMIN_PREVIEW or exposes CONFIG.PREVIEW', () => {
  for (const f of ['admin-ui/assets/js/config.js', 'admin-ui/assets/js/admin-app.js', 'admin-ui/assets/js/auth.js']) {
    const src = read(f).split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n'); // ignore comments
    assert.doesNotMatch(src, /env\.VITE_ADMIN_PREVIEW|VITE_ADMIN_PREVIEW\s*[=:]/, f);
    assert.doesNotMatch(src, /CONFIG\.PREVIEW\b/, f);
    assert.doesNotMatch(src, /MOCK_LOGIN_ALLOWED/, f);
  }
});

test('JP-031: config.js gates the dev picker on the build-time constant import.meta.env.DEV', async () => {
  const src = read('admin-ui/assets/js/config.js');
  assert.match(src, /env\.DEV === true/);
  // Under Node, import.meta.env is undefined → DEV_LOGIN_ALLOWED must be false and the portal restricted.
  const { CONFIG } = await import('../../admin-ui/assets/js/config.js');
  assert.equal(CONFIG.DEV_LOGIN_ALLOWED, false);
  assert.equal(CONFIG.AUTH_DISABLED, true, 'without a client id the portal is restricted');
  assert.equal('PREVIEW' in CONFIG, false);
});

test('JP-031: admin-app.js imports dev-login.js only behind import.meta.env.DEV', () => {
  const src = read('admin-ui/assets/js/admin-app.js');
  const idx = src.indexOf("import('./dev-login.js')");
  assert.ok(idx > 0, 'dynamic import present');
  const guard = src.lastIndexOf('import.meta.env.DEV', idx);
  assert.ok(guard > 0 && idx - guard < 200, 'dynamic import is guarded by import.meta.env.DEV');
  assert.doesNotMatch(src, /^import .*dev-login/m, 'no static import of dev-login');
});

test('signInWithGoogleProfile enforces the allowlist', () => {
  assert.equal(auth.signInWithGoogleProfile({ email: 'nobody@example.com' }, ['a@example.com']).ok, false);
  assert.equal(auth.signInWithGoogleProfile({ email: 'a@example.com' }, []).ok, false, 'empty allowlist denies');
  assert.equal(auth.signInWithGoogleProfile({ email: 'A@Example.com' }, ['a@example.com']).ok, true);
  auth.signOut();
  assert.equal(auth.getSession(), null);
});
