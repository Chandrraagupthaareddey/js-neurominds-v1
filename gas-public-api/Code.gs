/**
 * JS Neurominds V1 — gas-public-api/Code.gs
 * Web app entry points. Deployed as: execute as USER_DEPLOYING (the clinic
 * owner / TCGR), accessible to ANYONE_ANONYMOUS so the public site can read
 * content and submit requests without sign-in.
 *
 * POST bodies are sent as text/plain by the frontend to avoid a CORS preflight;
 * we parse JSON from e.postData.contents.
 */

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'health';
    return Router.handleGet(action, params);
  } catch (err) {
    _logError('doGet', err);
    return Utils.fail('Server error', 'SERVER_ERROR');
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || (e && e.parameter && e.parameter.action);
    var payload = body.payload || {};
    if (!action) return Utils.fail('Missing action', 'NO_ACTION');
    return Router.handlePost(action, payload);
  } catch (err) {
    _logError('doPost', err);
    return Utils.fail('Server error', 'SERVER_ERROR');
  }
}

/** Best-effort error logging to the Operations workbook (never throws upward). */
function _logError(source, err) {
  try {
    SheetService.append(getOperationsAuditId_(), 'Error_Logs', {
      error_id: Utils.genId('ERR'),
      created_at: Utils.nowIso(),
      source: 'public_api:' + source,
      message: (err && err.message) || String(err),
      stack: (err && err.stack) ? String(err.stack).slice(0, 500) : '',
      context: ''
    });
  } catch (e) { /* swallow */ }
}

/** Manual smoke test from the Apps Script editor. */
function _selfTest() {
  Logger.log(HealthService.check());
}
