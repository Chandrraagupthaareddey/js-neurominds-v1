import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

// Source-level contract: every public form (a) imports the shared status
// helper, (b) renders the unavailable notice, (c) shows failureHtml in its
// catch, and (d) only shows success copy after checking success AND data.
for (const f of ['public-site/assets/js/feedback.js', 'public-site/assets/js/booking.js', 'public-site/assets/js/lab.js']) {
  test(`G0: ${f} is honest about submission state`, () => {
    const src = read(f);
    assert.match(src, /from '\.\/submission-status\.js'/);
    assert.match(src, /unavailableNoticeHtml\(/);
    assert.match(src, /failureHtml\(err\)/);
    assert.match(src, /res\.success/);
    assert.match(src, /res\.data/);
    assert.match(src, /Submission unavailable/);
    // the old silent catch (button reset only) must be gone
    assert.doesNotMatch(src, /catch \(err\) \{\s*btn\.disabled = false; btn\.textContent = '[^']+';\s*\}/);
  });
}

test('G0: public mock-api does not log patient payload values', () => {
  const src = read('public-site/assets/js/mock-api.js');
  assert.doesNotMatch(src, /console\.info\('\[mock\] [a-z ]+ saved', id, payload\)/);
  assert.match(src, /redactForLog\(payload\)/);
});
