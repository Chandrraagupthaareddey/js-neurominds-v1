import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as shared from '../../shared/permissions.js';
import * as auth from '../../admin-ui/assets/js/auth.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const adminJs = resolve(root, 'admin-ui/assets/js');

test('JP-027: admin-ui defines no RBAC tables of its own', () => {
  for (const f of readdirSync(adminJs).filter((f) => f.endsWith('.js'))) {
    const src = readFileSync(resolve(adminJs, f), 'utf8');
    assert.doesNotMatch(src, /(const|let|var)\s+ROLE_(SECTIONS|ACTIONS|LABELS)\s*=/, `${f} defines its own RBAC table`);
  }
});

test('JP-027: auth.js re-exports the shared tables by identity', () => {
  assert.equal(auth.ROLE_SECTIONS, shared.ROLE_SECTIONS);
  assert.equal(auth.ROLE_ACTIONS, shared.ROLE_ACTIONS);
  assert.equal(auth.ROLE_LABELS, shared.ROLE_LABELS);
});

test('JP-027: can() follows shared roleCanDo for every role/action (incl. the three that had drifted)', () => {
  const actions = new Set(Object.values(shared.ROLE_ACTIONS).flat());
  for (const role of shared.ROLES) {
    const email = `${role}@test.local`;
    const r = auth.signInWithGoogleProfile({ email, name: role }, [email]);
    assert.ok(r.ok);
    // signInWithGoogleProfile maps first-allowlisted email to super_admin; force the role under test
    r.session.role = role;
    for (const a of actions) {
      assert.equal(auth.can(a), shared.roleCanDo(role, a), `${role} / ${a}`);
    }
    for (const a of ['moderate_feedback', 'run_backup', 'update_lab']) {
      assert.equal(auth.can(a), shared.roleCanDo(role, a), `${role} / ${a} (previously drifted)`);
    }
    auth.signOut();
  }
  assert.equal(auth.can('publish'), false, 'no session → no permissions');
});

test('allowedSections() mirrors shared ROLE_SECTIONS', () => {
  for (const role of shared.ROLES) {
    const email = `${role}@test.local`;
    const r = auth.signInWithGoogleProfile({ email }, [email]);
    r.session.role = role;
    assert.deepEqual(auth.allowedSections(), shared.ROLE_SECTIONS[role]);
    auth.signOut();
  }
});
