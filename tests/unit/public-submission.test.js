import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserStubs } from '../helpers/browser-stubs.js';

let status, mockApi;
before(async () => {
  installBrowserStubs({ hostname: 'localhost' }); // public config.js reads location.hostname
  status = await import('../../public-site/assets/js/submission-status.js');
  mockApi = (await import('../../public-site/assets/js/mock-api.js')).mockApi;
});

test('G0 / JP-004: mock API write paths never return success', async () => {
  for (const [name, payload] of [
    ['submitCallback', { patient_name: 'Test', mobile_number: '9000000001' }],
    ['submitLabRequest', { name: 'Test', mobile: '9000000001', selected_package: 'x' }],
    ['submitFeedback', { rating: '5', message: 'x' }]
  ]) {
    const res = await mockApi[name](payload);
    assert.equal(res.success, false, name);
    assert.equal(res.code, status.SUBMISSION_UNAVAILABLE_CODE, name);
    assert.equal(res.data, null, name);
    assert.ok(!JSON.stringify(res).includes('_id'), `${name} must not fabricate an id`);
  }
});

test('mock API read paths still succeed (behaviour preserved)', async () => {
  const res = await mockApi.conditions();
  assert.equal(res.success, true);
  assert.ok(Array.isArray(res.data) && res.data.length > 0);
});

test('isSubmissionBackendAvailable: mock mode or missing API URL → false', () => {
  assert.equal(status.isSubmissionBackendAvailable({ USE_MOCK: true, PUBLIC_API_URL: 'https://x' }), false);
  assert.equal(status.isSubmissionBackendAvailable({ USE_MOCK: false, PUBLIC_API_URL: '' }), false);
  assert.equal(status.isSubmissionBackendAvailable({ USE_MOCK: false, PUBLIC_API_URL: 'https://example.invalid/exec' }), true);
  assert.equal(status.isSubmissionBackendAvailable(null), false);
});

test('notices offer only the verified clinic contacts from constants (not the floating CTA number)', () => {
  const cfg = { CALL_LINK: 'tel:+918553665381', WHATSAPP_LINK: 'https://wa.me/918553665381', CTA_PHONE: '+91 8553665381' };
  const html = status.unavailableNoticeHtml('feedback', cfg);
  assert.match(html, /tel:\+918553665381/);
  assert.match(html, /wa\.me\/918553665381/);
  assert.doesNotMatch(html, /9986559998/, 'unconfirmed FAB number must not appear');
  assert.match(html, /not available at the moment/i);
  assert.match(html, /nothing you enter here will reach the clinic/i);
});

test('failureHtml distinguishes unavailable vs generic error and never says thank you', () => {
  const cfg = { CALL_LINK: 'tel:+910000000000', WHATSAPP_LINK: '', CTA_PHONE: '' };
  const unavailable = status.failureHtml({ code: status.SUBMISSION_UNAVAILABLE_CODE }, cfg);
  assert.match(unavailable, /not available/i);
  assert.match(unavailable, /<u>not<\/u> sent/);
  const generic = status.failureHtml(new Error('boom'), cfg);
  assert.match(generic, /could not send/i);
  for (const h of [unavailable, generic]) {
    assert.doesNotMatch(h, /thank you|received/i);
    assert.match(h, /tel:\+910000000000/);
    assert.doesNotMatch(h, /wa\.me/, 'empty WhatsApp link omitted');
  }
});

test('contact HTML escapes attribute values', () => {
  const html = status.contactOptionsHtml({ CALL_LINK: 'tel:1"><script>', WHATSAPP_LINK: '', CTA_PHONE: '<b>' });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&quot;&gt;&lt;script&gt;/);
});
