import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, unwrap, wrapApi, describeApiError } from '../../admin-ui/assets/js/api-envelope.js';

// Exact envelope observed from the live Apps Script admin API (audit evidence/runtime/gas_admin_probes.txt)
const NOT_AUTHORIZED = { success: false, error: 'You are not authorized for this portal.', code: 'NOT_AUTHORIZED' };

test('unwrap: success envelope passes through', () => {
  const res = { success: true, code: 200, data: { kpis: { callbacks_new: 1 } }, error: null };
  assert.equal(unwrap(res, 'dashboard'), res);
});

test('unwrap: null data is a valid answer', () => {
  assert.doesNotThrow(() => unwrap({ success: true, data: null }));
});

test('unwrap: failure envelope (NOT_AUTHORIZED) throws ApiError with code, not TypeError', () => {
  assert.throws(() => unwrap(NOT_AUTHORIZED, 'dashboard'), (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.code, 'NOT_AUTHORIZED');
    assert.equal(err.action, 'dashboard');
    return true;
  });
});

test('unwrap: success without data throws NO_DATA', () => {
  assert.throws(() => unwrap({ success: true }), (e) => e.code === 'NO_DATA');
});

test('unwrap: non-object / undefined throws BAD_RESPONSE', () => {
  assert.throws(() => unwrap(undefined), (e) => e.code === 'BAD_RESPONSE');
  assert.throws(() => unwrap('<!doctype html>'), (e) => e.code === 'BAD_RESPONSE');
});

test('wrapApi: every method rejects with ApiError on failure envelope and never resolves with success:false', async () => {
  const impl = {
    dashboard: async () => NOT_AUTHORIZED,
    health: async () => ({ success: true, data: { ok: true } }),
    boom: async () => { throw new TypeError('Failed to fetch'); },
    notAFunction: 42
  };
  const api = wrapApi(impl);
  await assert.rejects(api.dashboard(), (e) => e instanceof ApiError && e.code === 'NOT_AUTHORIZED');
  const ok = await api.health();
  assert.equal(ok.data.ok, true);
  await assert.rejects(api.boom(), (e) => e instanceof ApiError && e.code === 'NETWORK');
  assert.equal(api.notAFunction, 42);
});

test('regression JP-001: reading res.data.kpis after the wrapper can no longer throw a TypeError', async () => {
  const api = wrapApi({ dashboard: async () => NOT_AUTHORIZED });
  let caught;
  try { const res = await api.dashboard(); void res.data.kpis; }
  catch (e) { caught = e; }
  assert.ok(caught instanceof ApiError, 'expected ApiError, got ' + (caught && caught.constructor.name));
  assert.notEqual(caught.constructor, TypeError);
});

test('describeApiError: NOT_AUTHORIZED maps to actionable copy without a stack trace', () => {
  const d = describeApiError(new ApiError('x', { code: 'NOT_AUTHORIZED' }));
  assert.match(d.title, /did not recognise your account/i);
  assert.equal(d.code, 'NOT_AUTHORIZED');
  assert.doesNotMatch(d.body, /undefined|TypeError|at /);
});

test('describeApiError: unknown errors still produce a title and body', () => {
  const d = describeApiError(new Error('Cannot read properties of undefined (reading \'kpis\')'));
  assert.ok(d.title && d.body);
  assert.equal(d.code, 'ERROR');
});
