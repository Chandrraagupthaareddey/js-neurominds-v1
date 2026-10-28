/**
 * JS Neurominds V1 — admin-ui/assets/js/api-envelope.js
 * Pure helpers (no DOM, no fetch) for the { success, data, error, code } API
 * envelope. Introduced for audit JP-001 / JP-029: admin sections used to read
 * `res.data.*` without checking `success`, so a failure envelope such as
 * {success:false, code:"NOT_AUTHORIZED"} produced
 * "Cannot read properties of undefined (reading 'kpis')".
 *
 * Every API method (mock or live) is wrapped with `wrapApi`, which turns any
 * non-success envelope into a thrown ApiError. Sections may therefore assume
 * `res.data` exists when a call resolves; the section router shows a clear
 * message when it does not.
 */

export class ApiError extends Error {
  constructor(message, { code = 'UNKNOWN', action = '', status = 0, cause } = {}) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.code = code;
    this.action = action;
    this.status = status;
    if (cause) this.cause = cause;
  }
}

/**
 * Validate an envelope. Returns it unchanged when `success === true` and `data`
 * is present (null counts as present: "found nothing" is a valid answer).
 * Throws ApiError otherwise.
 */
export function unwrap(res, action = '') {
  if (res == null || typeof res !== 'object') {
    throw new ApiError('Empty or invalid response from the admin API.', { code: 'BAD_RESPONSE', action });
  }
  if (res.success !== true) {
    throw new ApiError(res.error || 'The admin API rejected the request.', { code: res.code || 'REQUEST_FAILED', action });
  }
  if (!('data' in res) || res.data === undefined) {
    throw new ApiError('The admin API returned no data.', { code: 'NO_DATA', action });
  }
  return res;
}

/** Wrap every function on an API implementation so it resolves only with a valid success envelope. */
export function wrapApi(impl) {
  const out = {};
  Object.keys(impl).forEach((name) => {
    const fn = impl[name];
    if (typeof fn !== 'function') { out[name] = fn; return; }
    out[name] = async (...args) => {
      let res;
      try { res = await fn.apply(impl, args); }
      catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(err && err.message ? err.message : 'Network error', { code: 'NETWORK', action: name, cause: err });
      }
      return unwrap(res, name);
    };
  });
  return out;
}

/** Map an error to user-facing copy. Never leaks stack traces; always actionable. */
export function describeApiError(err) {
  const code = (err && err.code) || '';
  switch (code) {
    case 'NOT_AUTHORIZED':
      return {
        title: 'The backend did not recognise your account',
        body: 'You are signed in to this portal, but the data service refused the request. This is a known configuration issue being fixed; no data is available until the backend can verify your identity.',
        code
      };
    case 'FORBIDDEN':
    case 'ROLE_FORBIDDEN':
      return { title: 'Not permitted for your role', body: 'Your role does not allow this section or action.', code };
    case 'NETWORK':
      return { title: 'Could not reach the admin service', body: 'Check your connection and try again. Nothing was changed.', code };
    case 'HTTP_ERROR':
      return { title: 'The admin service returned an error', body: (err && err.message) || 'Please try again shortly.', code };
    case 'BAD_RESPONSE':
    case 'NO_DATA':
      return { title: 'Unexpected response from the admin service', body: 'The service answered, but not in the expected format. Please try again or report this.', code };
    case 'UNKNOWN_ACTION':
      return { title: 'This section is not supported by the backend', body: 'The portal asked for something the data service does not provide.', code };
    case 'RATE_LIMITED':
      return { title: 'Too many requests', body: 'Please wait a moment and try again.', code };
    default:
      return {
        title: 'Could not load this section',
        body: (err && err.message) ? String(err.message) : 'Something went wrong. Please try again.',
        code: code || 'ERROR'
      };
  }
}
