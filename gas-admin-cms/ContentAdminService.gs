/**
 * JS Neurominds V1 — gas-admin-cms/ContentAdminService.gs
 * Read all content (any status) for review, and publish drafts. Publishing is
 * RBAC-checked and recorded. Feedback moderation lives here too.
 */
var ContentAdminService = {
  all: function (user) {
    RoleService.requireView(user, 'content');
    var c = adminConfigContentId_();
    return {
      conditions: SheetService.readAll(c, 'Conditions'),
      treatments: SheetService.readAll(c, 'Treatments'),
      services: SheetService.readAll(c, 'Services'),
      lab_packages: SheetService.readAll(c, 'Lab_Packages'),
      blogs: SheetService.readAll(c, 'Blogs'),
      faqs: SheetService.readAll(c, 'FAQs')
    };
  },
  publish: function (user, tab, keyCol, keyVal) {
    RoleService.requireEdit(user, 'content');
    if (!RoleService.canPublish(user.role, 'content')) throw new Error('FORBIDDEN_PUBLISH');
    var ok = SheetService.update(adminConfigContentId_(), tab, keyCol, keyVal, { status: 'published', updated_at: Utils.nowIso() });
    if (ok) { AuditService.publish(user.email, tab, keyVal, 'publish'); }
    return { success: ok };
  },
  feedback: function (user) {
    RoleService.requireView(user, 'feedback');
    return SheetService.readAll(adminOperationsAuditId_(), 'Feedback')
      .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  },
  moderateFeedback: function (user, feedbackId, status) {
    RoleService.requireEdit(user, 'feedback');
    var ok = SheetService.update(adminOperationsAuditId_(), 'Feedback', 'feedback_id', feedbackId, { status: status, moderated_by: user.email, updated_at: Utils.nowIso() });
    if (ok) AuditService.log(user.email, 'feedback_moderate', 'feedback', feedbackId, status);
    return { success: ok };
  }
};
