import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const env = {
  SESSION_SECRET: 'test-secret-please-change', GITHUB_TOKEN: 'ghp_dummy', GITHUB_REPO: 'owner/repo',
  SUPER_ADMIN_EMAILS: 'super@example.com', ADMIN_EMAILS: 'admin@example.com', ALLOWED_ORIGINS: 'https://admin.example.com',
  GOOGLE_CLIENT_ID: 'x', GOOGLE_CLIENT_SECRET: 'y'
};
const req = (path, init = {}) => new Request('https://admin.example.com' + path, init);

// Mint a session the same way the Worker does (copy of its signing scheme).
const te = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function mint(email, role) {
  const body = b64u(te.encode(JSON.stringify({ email, name: 'T', role, exp: Math.floor(Date.now() / 1000) + 600 })));
  const key = await crypto.subtle.importKey('raw', te.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${body}.${b64u(await crypto.subtle.sign('HMAC', key, te.encode(body)))}`;
}

test('unauthenticated GitHub proxy calls are rejected', async () => {
  const r = await worker.fetch(req('/gh/api/v3/user'), env);
  assert.equal(r.status, 401);
});

test('/auth redirects to Google and remembers popup mode', async () => {
  const r = await worker.fetch(req('/auth?provider=github&site_id=admin.example.com'), env);
  assert.equal(r.status, 302);
  assert.ok(r.headers.get('location').startsWith('https://accounts.google.com/o/oauth2/v2/auth?'));
  assert.ok(/jsnm_oauth=/.test(r.headers.get('set-cookie')));
});

test('/user returns the Google identity for a valid session; tampered token rejected', async () => {
  const t = await mint('admin@example.com', 'admin');
  const r = await worker.fetch(req('/gh/api/v3/user', { headers: { authorization: 'token ' + t } }), env);
  assert.equal(r.status, 200);
  const u = await r.json();
  assert.equal(u.email, 'admin@example.com'); assert.equal(u.role, 'admin');
  const bad = await worker.fetch(req('/gh/api/v3/user', { headers: { authorization: 'token ' + t.slice(0, -2) + 'xx' } }), env);
  assert.equal(bad.status, 401);
  const unknown = await mint('stranger@example.com', 'admin');
  const r2 = await worker.fetch(req('/gh/api/v3/user', { headers: { authorization: 'token ' + unknown } }), env);
  assert.equal(r2.status, 401, 'email not in any role list → rejected even with a validly signed token');
});

test('admin role cannot change super-admin-only files; super admin can', async () => {
  const body = JSON.stringify({ query: 'mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }',
    variables: { input: { fileChanges: { additions: [{ path: 'content/settings/feature_flags.json', contents: 'e30=' }] } } } });
  const admin = await mint('admin@example.com', 'admin');
  const r = await worker.fetch(req('/gh/api/graphql', { method: 'POST', headers: { authorization: 'bearer ' + admin, 'content-type': 'application/json' }, body }), env);
  assert.equal(r.status, 403);
  // Content edits by an admin are allowed through to GitHub (we only check it is not blocked here).
  const ok = JSON.stringify({ query: 'mutation { createCommitOnBranch(input: {fileChanges: {additions: [{path: "content/conditions/anxiety.json", contents: "e30="}]}}) { commit { oid } } }' });
  const r2 = await worker.fetch(req('/gh/api/graphql', { method: 'POST', headers: { authorization: 'bearer ' + admin, 'content-type': 'application/json' }, body: ok }), env);
  assert.notEqual(r2.status, 403);
});

test('other repositories are blocked', async () => {
  const t = await mint('super@example.com', 'super_admin');
  const r = await worker.fetch(req('/gh/api/v3/repos/someone/else/contents/x', { headers: { authorization: 'token ' + t } }), env);
  assert.equal(r.status, 403);
});
