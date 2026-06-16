/**
 * JS Neurominds V1 — gas-admin-cms/AdminRouter.gs
 * Every admin request is authenticated (Google account → Users tab) and then
 * dispatched. Services re-check the role for the specific section/action, so
 * authorization is enforced server-side regardless of what the UI shows.
 */
var AdminRouter = {
  dispatch: function (action, payload) {
    payload = payload || {};
    var user = AuthService.requireUser(); // throws NOT_AUTHORIZED if unknown

    switch (action) {
      /* identity + config */
      case 'me': return Utils.ok({ email: user.email, role: user.role, name: user.name });
      case 'config': return Utils.ok(AdminRouter._config());

      /* dashboard + analytics (GA4 primary) */
      case 'dashboard': return Utils.ok(AdminRouter._dashboard(user));

      /* callbacks */
      case 'callbacks': return Utils.ok(CallbackDeskService.list(user));
      case 'callbackChecklist': return Utils.ok(CallbackDeskService.checklist(user));
      case 'callbackQuestions': return Utils.ok(CallbackDeskService.questions(user));
      case 'callbackHistory': return Utils.ok(CallbackDeskService.history(user, payload.id));
      case 'updateCallbackStatus': return Utils.json(CallbackDeskService.updateStatus(user, payload.id, payload.status, payload.note));

      /* lab */
      case 'labRequests': return Utils.ok(LabAdminService.list(user));
      case 'updateLabStatus': return Utils.json(LabAdminService.updateStatus(user, payload.id, payload.status));

      /* content + feedback */
      case 'content': return Utils.ok(ContentAdminService.all(user));
      case 'doctors': return Utils.ok(DoctorAdminService.list(user));
      case 'feedback': return Utils.ok(ContentAdminService.feedback(user));
      case 'updateFeedbackStatus': return Utils.json(ContentAdminService.moderateFeedback(user, payload.id, payload.status));
      case 'publishContent': return Utils.json(ContentAdminService.publish(user, payload.tab, payload.keyCol, payload.keyVal));
      case 'syncContent': return Utils.json(CloudflareDeployService.triggerRebuild(user, 'content_sync'));

      /* system */
      case 'health': return Utils.ok(AdminRouter._health(user));
      case 'publishHistory': return Utils.ok(SheetService.readAll(adminOperationsAuditId_(), 'Publish_History'));
      case 'users': RoleService.requireView(user, 'settings'); return Utils.ok(SheetService.readAll(adminConfigContentId_(), 'Users'));
      case 'runBackup': return Utils.json(BackupService.run(user));
      case 'runbook': return Utils.ok(RunbookService.get(user, payload.mode));

      default: return Utils.fail('Unknown action: ' + action, 'UNKNOWN_ACTION');
    }
  },

  _config: function () {
    var sys = {};
    SheetService.readAll(adminConfigContentId_(), 'System_Config').forEach(function (r) { sys[r.config_key] = r.config_value; });
    return {
      clinic_name: sys.clinic_name, clinic_short: sys.clinic_short, display_phone: sys.display_phone,
      cta_phone: sys.cta_phone, whatsapp_link: sys.whatsapp_link, maps_url: sys.maps_url,
      pwens_booking_url: sys.pwens_booking_url, email_support: sys.support_email
    };
  },

  _dashboard: function (user) {
    var oId = adminOperationsAuditId_();
    var callbacks = SheetService.readAll(oId, 'Callback_Requests');
    var labs = SheetService.readAll(oId, 'Lab_Requests');
    var feedback = SheetService.readAll(oId, 'Feedback');
    var ga = AnalyticsGa4Service.dashboard(user);
    return {
      kpis: {
        callbacks_new: callbacks.filter(function (c) { return c.status === 'new'; }).length,
        followups: callbacks.filter(function (c) { return c.status === 'followup_required'; }).length,
        lab_new: labs.filter(function (l) { return l.status === 'new'; }).length,
        pwens_clicks_7d: (ga.events && ga.events.pwens_booking_click) || 0,
        feedback_pending: feedback.filter(function (f) { return f.status === 'pending'; }).length
      },
      ga4: ga,
      recent_callbacks: callbacks.sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); }).slice(0, 6)
    };
  },

  _health: function (user) {
    var h = AlertService.health(user);
    h.bigquery = BigQueryHealthService.check(user).bigquery;
    return h;
  }
};
