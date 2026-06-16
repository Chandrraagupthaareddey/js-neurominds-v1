/**
 * JS Neurominds V1 — gas-public-api/EmailService.gs
 * Notification emails. Every send is wrapped by callers in try/catch so a
 * failure never blocks request saving. This module also writes Email_Logs rows
 * so failures are visible in admin System Health.
 *
 * Recipients are read from System_Config (support_email) — never hardcoded.
 */

var EmailService = {
  _supportEmail: function () {
    var sys = getSystemConfig_();
    return sys.support_email || Session.getEffectiveUser().getEmail();
  },

  _logEmail: function (kind, relatedId, status, errorMessage) {
    try {
      SheetService.append(getOperationsAuditId_(), 'Email_Logs', {
        email_log_id: Utils.genId('EML'),
        created_at: Utils.nowIso(),
        kind: kind,
        recipient_type: 'clinic',
        related_id: relatedId,
        status: status,
        error_message: errorMessage || ''
      });
    } catch (e) { /* logging must never throw upward */ }
  },

  logEmailFailure: function (kind, relatedId, message) {
    EmailService._logEmail(kind, relatedId, 'failed', message);
  },

  /** True if MailApp has remaining quota; used to skip sends gracefully. */
  _hasQuota: function () {
    try { return MailApp.getRemainingDailyQuota() > 0; } catch (e) { return false; }
  },

  notifyNewCallback: function (record) {
    if (!EmailService._hasQuota()) { EmailService._logEmail('callback_new', record.callback_id, 'skipped_quota', ''); return; }
    var subject = 'New call back request · ' + record.patient_name;
    var body = [
      'A new private call back request has been received.',
      '',
      'Name: ' + record.patient_name,
      'Mobile: ' + record.mobile_number,
      'Preferred: ' + record.preferred_call_date + ' · ' + record.preferred_call_time_slot,
      'Concern: ' + record.generic_concern_category,
      'For: ' + record.consultation_for + ' (' + record.new_patient_or_followup + ')',
      'Source: ' + record.source_hint,
      '',
      'Open the Admin Callback Desk to respond. (This is not a confirmed appointment.)'
    ].join('\n');
    MailApp.sendEmail(EmailService._supportEmail(), subject, body);
    EmailService._logEmail('callback_new', record.callback_id, 'sent', '');
  },

  notifyNewLab: function (record) {
    if (!EmailService._hasQuota()) { EmailService._logEmail('lab_new', record.lab_request_id, 'skipped_quota', ''); return; }
    var subject = 'New lab home collection request · ' + record.name;
    var body = [
      'A new lab home sample collection request has been received.',
      '',
      'Name: ' + record.name,
      'Mobile: ' + record.mobile,
      'Pickup area: ' + record.pickup_area,
      'Preferred: ' + record.preferred_pickup_date + ' · ' + record.preferred_pickup_time,
      'Package: ' + record.selected_package,
      '',
      'Verify availability with the patient before confirming pickup.'
    ].join('\n');
    MailApp.sendEmail(EmailService._supportEmail(), subject, body);
    EmailService._logEmail('lab_new', record.lab_request_id, 'sent', '');
  }
};
