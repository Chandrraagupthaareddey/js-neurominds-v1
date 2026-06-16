/**
 * JS Neurominds V1 — gas-public-api/BookingService.gs
 * Handles private "call back" requests (NOT confirmed appointments). Validates
 * input, writes to the Operations workbook under a lock, records initial status
 * history, then attempts a notification email. Email failure NEVER blocks the
 * save — the request is already persisted before email is attempted.
 */

var BookingService = {
  submitCallback: function (payload) {
    payload = payload || {};

    // Server-side validation (mirrors shared/validators.js).
    var errors = [];
    var name = Utils.sanitizeText(payload.patient_name, 80);
    if (name.length < 2) errors.push('patient_name');
    if (!Utils.isValidMobile(payload.mobile_number)) errors.push('mobile_number');
    if (!Utils.isValidEmail(payload.patient_email)) errors.push('patient_email');
    if (!Utils.isFutureOrToday(payload.preferred_call_date)) errors.push('preferred_call_date');
    if (!payload.preferred_call_time_slot) errors.push('preferred_call_time_slot');
    if (!payload.privacy_consent) errors.push('privacy_consent');
    if (errors.length) return { success: false, error: 'validation_failed', fields: errors };

    var id = Utils.genId('CB');
    var now = Utils.nowIso();
    var record = {
      callback_id: id,
      created_at: now,
      patient_name: name,
      mobile_number: String(payload.mobile_number).replace(/\D/g, '').slice(-10),
      whatsapp_number: payload.whatsapp_number ? String(payload.whatsapp_number).replace(/\D/g, '').slice(-10) : '',
      patient_email: Utils.sanitizeText(payload.patient_email, 120),
      preferred_call_date: Utils.sanitizeText(payload.preferred_call_date, 20),
      preferred_call_time_slot: Utils.sanitizeText(payload.preferred_call_time_slot, 40),
      consultation_for: Utils.sanitizeText(payload.consultation_for, 40),
      new_patient_or_followup: Utils.sanitizeText(payload.new_patient_or_followup, 20),
      preferred_doctor: Utils.sanitizeText(payload.preferred_doctor, 80),
      generic_concern_category: Utils.sanitizeText(payload.generic_concern_category, 60),
      consultation_mode_interest: Utils.sanitizeText(payload.consultation_mode_interest, 40),
      short_note: Utils.sanitizeText(payload.short_note, 300),
      source_hint: Utils.sanitizeText(payload.source_hint || 'website', 40),
      status: 'new',
      assigned_to: '',
      updated_at: now
    };

    var opId = getOperationsAuditId_();
    // Persist FIRST — this is the critical operation.
    SheetService.append(opId, 'Callback_Requests', record);

    // Status history (best-effort; wrapped so a history hiccup can't lose the request).
    try {
      SheetService.append(opId, 'Callback_Status_History', {
        history_id: Utils.genId('HIS'), callback_id: id, old_status: '', new_status: 'new',
        note: 'Request received', actor_email: 'system', created_at: now
      });
    } catch (e) { /* non-fatal */ }

    // Email is non-blocking: a failure here must not fail the request.
    try {
      EmailService.notifyNewCallback(record);
    } catch (e) {
      EmailService.logEmailFailure('callback_new', id, e && e.message);
    }

    return { success: true, data: { callback_id: id } };
  }
};
