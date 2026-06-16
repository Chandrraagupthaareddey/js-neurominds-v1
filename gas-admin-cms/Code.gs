/**
 * JS Neurominds V1 — gas-admin-cms/Code.gs
 * Admin CMS web app entry points. Deployed as: execute as USER_DEPLOYING.
 * Access is ANYONE_ANONYMOUS at the platform level, but AuthService rejects any
 * Google account not present + active in the Users tab — so only authorized
 * staff get data. Authorization is re-checked per request.
 *
 * The frontend sends POST bodies as text/plain (JSON string) to avoid CORS
 * preflight. doGet supports simple read actions via ?action=.
 */

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'me';
    return AdminRouter.dispatch(action, params);
  } catch (err) {
    return _adminError(err);
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    var action = body.action || (e && e.parameter && e.parameter.action);
    var payload = body.payload || {};
    if (!action) return Utils.fail('Missing action', 'NO_ACTION');
    return AdminRouter.dispatch(action, payload);
  } catch (err) {
    return _adminError(err);
  }
}

/** Map known auth/permission errors to clean codes; log unexpected ones. */
function _adminError(err) {
  var msg = (err && err.message) || String(err);
  if (msg === 'NOT_AUTHORIZED') return Utils.fail('You are not authorized for this portal.', 'NOT_AUTHORIZED');
  if (msg.indexOf('FORBIDDEN') === 0) return Utils.fail('Your role cannot perform this action.', msg);
  _logAdminError('dispatch', err);
  return Utils.fail('Server error', 'SERVER_ERROR');
}

function _logAdminError(source, err) {
  try {
    SheetService.append(adminOperationsAuditId_(), 'Error_Logs', {
      error_id: Utils.genId('ERR'), created_at: Utils.nowIso(), source: 'admin_cms:' + source,
      message: (err && err.message) || String(err), stack: (err && err.stack) ? String(err.stack).slice(0, 500) : '', context: ''
    });
  } catch (e) { /* swallow */ }
}

/** Editor smoke test (run after runSetup). */
function _selfTest() {
  Logger.log('Active user: ' + AuthService.activeEmail());
  Logger.log(AlertService.health({ role: 'super_admin', email: 'test' }));
}
