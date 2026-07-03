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

      /* website-management foundation reads (RBAC-gated) */
      case 'socialLinks': RoleService.requireView(user, 'social'); return Utils.ok(SheetService.readAll(adminConfigContentId_(), 'Social_Links'));
      case 'footerSettings': RoleService.requireView(user, 'footer'); return Utils.ok(SheetService.readAll(adminConfigContentId_(), 'Footer_Settings'));
      case 'brandSettings': RoleService.requireView(user, 'brand'); return Utils.ok(AdminRouter._brand());
      case 'themeSettings': RoleService.requireView(user, 'brand'); return Utils.ok(SheetService.readAll(adminConfigContentId_(), 'Theme_Settings'));
      case 'navigationItems': RoleService.requireView(user, 'navigation'); return Utils.ok(SheetService.readAll(adminConfigContentId_(), 'Navigation'));
      case 'featureFlags': RoleService.requireView(user, 'flags'); return Utils.ok(AdminRouter._flags());
      case 'floatingCta': RoleService.requireView(user, 'settings'); return Utils.ok(SheetService.readAll(adminConfigContentId_(), 'Floating_CTA'));
      case 'testimonials': RoleService.requireView(user, 'testimonials'); return Utils.ok(SheetService.readAll(adminConfigContentId_(), 'Testimonials'));
      case 'googleReviews': RoleService.requireView(user, 'reviews'); return Utils.ok(AdminRouter._reviews());
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

  // Brand settings keyed for the admin Brand screen.
  _brand: function () {
    var b = {};
    SheetService.readAll(adminConfigContentId_(), 'Brand_Settings').forEach(function (r) { b[r.setting_key] = r.asset_url || r.setting_value; });
    return {
      logo_url: b.main_logo || '/assets/brand/logo.png',
      footer_logo_url: b.footer_logo || '/assets/brand/logo.png',
      favicon_url: b.favicon || '/assets/brand/favicon-32x32.png',
      social_preview_url: b.social_preview || '/assets/brand/social-preview.png',
      alt_text: 'JS Neurominds and Diagnostic Center'
    };
  },

  // Feature flags as a typed object (TRUE/FALSE strings -> booleans).
  _flags: function () {
    var out = {};
    SheetService.readAll(adminConfigContentId_(), 'Feature_Flags').forEach(function (r) {
      out[r.flag_key] = String(r.enabled).toUpperCase() === 'TRUE' || r.enabled === true;
    });
    return out;
  },

  // Google reviews with summary (rating/count from System_Config).
  _reviews: function () {
    var sys = {};
    SheetService.readAll(adminConfigContentId_(), 'System_Config').forEach(function (r) { sys[r.config_key] = r.config_value; });
    var reviews = SheetService.readAll(adminConfigContentId_(), 'Google_Reviews');
    return {
      summary: {
        rating: Number(sys.google_rating || 0), review_count: Number(sys.google_review_count || reviews.length),
        profile_url: sys.google_review_url || '', write_review_url: sys.google_review_url || ''
      },
      reviews: reviews
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
