/**
 * JS Neurominds V1 — gas-admin-cms/AuthService.gs
 * Google-only authentication. There is NO password, OTP, reset, or self-
 * registration. We trust the Google session: Session.getActiveUser().getEmail()
 * is matched against the Users tab. The web app executes as the deployer, but
 * every request re-validates the *active* user and their role.
 */
var AuthService = {
  /** Returns the active user's email (the signed-in Google account). */
  activeEmail: function () {
    var email = Session.getActiveUser().getEmail();
    return email ? String(email).toLowerCase() : '';
  },

  /** Resolve the active user to a Users row, or null if not authorized. */
  currentUser: function () {
    var email = AuthService.activeEmail();
    if (!email) return null;
    var user = SheetService.findOne(adminConfigContentId_(), 'Users', 'email', email);
    if (!user) return null;
    if (String(user.status).toLowerCase() !== 'active') return null;
    return { email: email, role: user.role_key, name: user.name };
  },

  /** Throw if not authorized; otherwise return the user. */
  requireUser: function () {
    var u = AuthService.currentUser();
    if (!u) throw new Error('NOT_AUTHORIZED');
    return u;
  },

  /** Update last_login timestamp (best-effort). */
  touchLogin: function (email) {
    try { SheetService.update(adminConfigContentId_(), 'Users', 'email', email, { last_login_at: Utils.nowIso() }); }
    catch (e) { /* non-fatal */ }
  }
};
