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
  },

  /**
   * Own appointment request (website booking form, Admin → Booking & payments).
   * Writes to the "Appointment_Requests" tab (created on first use) and emails the clinic.
   * Payment is NOT processed here — the website hands the patient to UPI / a hosted payment
   * link and the clinic confirms manually; this record carries the reference to match against.
   */
  submitBooking: function (payload) {
    payload = payload || {};
    var errors = [];
    var name = Utils.sanitizeText(payload.name, 80);
    if (name.length < 2) errors.push('name');
    if (!Utils.isValidMobile(payload.mobile)) errors.push('mobile');
    if (!Utils.isValidEmail(payload.email)) errors.push('email');
    if (!Utils.isFutureOrToday(payload.date)) errors.push('date');
    if (!/^\d{2}:\d{2}$/.test(String(payload.slot || ''))) errors.push('slot');
    if (!payload.consent) errors.push('consent');
    if (errors.length) return { success: false, error: 'validation_failed', fields: errors };

    var id = Utils.genId('BK');
    var now = Utils.nowIso();
    var record = {
      booking_id: id,
      reference: Utils.sanitizeText(payload.reference, 40),
      created_at: now,
      patient_name: name,
      mobile_number: String(payload.mobile).replace(/\D/g, '').slice(-10),
      patient_email: Utils.sanitizeText(payload.email, 120),
      appointment_date: Utils.sanitizeText(payload.date, 20),
      appointment_slot: Utils.sanitizeText(payload.slot, 10),
      visit_type: Utils.sanitizeText(payload.visit_type, 40),
      consultation_mode: Utils.sanitizeText(payload.mode, 40),
      doctor: Utils.sanitizeText(payload.doctor, 80),
      fee: payload.fee != null ? Number(payload.fee) || '' : '',
      notes: Utils.sanitizeText(payload.notes, 200),
      payment_status: 'pending',
      payment_ref: '',
      status: 'new',
      source_hint: Utils.sanitizeText(payload.source_hint || 'website', 40),
      updated_at: now
    };

    // Live calendar guard: the slot may have been taken since the page loaded.
    var calendarOk = true;
    try {
      if (!CalendarService.isFree(record.appointment_date, record.appointment_slot)) {
        return { success: false, error: 'slot_taken', code: 'SLOT_TAKEN', message: 'Sorry, that time was just booked. Please choose another slot.' };
      }
    } catch (e) { calendarOk = false; /* calendar not configured → fall back to sheet-only */ }

    var opId = getOperationsAuditId_();
    BookingService._ensureTab(opId, 'Appointment_Requests', Object.keys(record).concat(['calendar_event_id']));
    if (calendarOk) {
      try { record.calendar_event_id = CalendarService.createEvent(record); } catch (e) { record.calendar_event_id = ''; }
    }
    SheetService.append(opId, 'Appointment_Requests', record);

    try { EmailService.notifyNewBooking(record); } catch (e) { EmailService.logEmailFailure('booking_new', id, e && e.message); }
    return { success: true, data: { booking_id: id, reference: record.reference, calendar_synced: !!record.calendar_event_id } };
  },

  /** Create a tab with a header row if it does not exist yet (first own-booking request). */
  _ensureTab: function (spreadsheetId, tabName, headers) {
    var ss = SpreadsheetApp.openById(spreadsheetId);
    if (ss.getSheetByName(tabName)) return;
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (!ss.getSheetByName(tabName)) {
        var sh = ss.insertSheet(tabName);
        sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
        sh.setFrozenRows(1);
      }
    } finally { lock.releaseLock(); }
  }
};
