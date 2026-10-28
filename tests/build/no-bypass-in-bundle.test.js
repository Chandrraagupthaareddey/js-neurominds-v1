import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Opt-in build assertion. Set ADMIN_DIST to a FRESH
 * `vite build --config vite.admin.config.js --outDir <dir>` output and run
 * `npm test`. Asserts that no development/bypass code reached the bundle.
 * (Not pointed at dist-admin/ by default: a stale local build would fail the
 * unit run for unrelated reasons.)
 */
const dist = process.env.ADMIN_DIST ? resolve(process.env.ADMIN_DIST) : '';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

test('JP-031: built admin bundle contains no bypass / dev-login code', { skip: !(dist && existsSync(dist)) && 'set ADMIN_DIST=<fresh admin build dir> to run' }, () => {
  const files = walk(dist).filter((f) => /\.(js|html)$/.test(f));
  assert.ok(files.length > 0, 'bundle has files');
  // Note: the literal key "VITE_ADMIN_PREVIEW" may still appear inside Vite's
  // inlined import.meta.env object if a developer's local .env still defines it;
  // that is data, not code. We assert that no CODE reads it (CONFIG.PREVIEW /
  // startPreviewSession) and that the dev picker is absent.
  const banned = ['dev-login', 'renderDevLogin', 'developer sign-in', 'startPreviewSession', 'signInAs(', 'role-sel', 'Preview access by role'];
  let sawDevFalse = false;
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const b of banned) assert.equal(src.includes(b), false, `${b} found in ${f}`);
    // CONFIG.PREVIEW property must be gone (the env key VITE_ADMIN_PREVIEW: is preceded by "_", so exclude it)
    assert.doesNotMatch(src, /[^_A-Z]PREVIEW\s*:/, `CONFIG.PREVIEW property found in ${f}`);
    if (/DEV:\s*(!1|false)/.test(src)) sawDevFalse = true;
  }
  assert.ok(sawDevFalse, 'expected import.meta.env.DEV to be compiled to false in the production bundle');
});
