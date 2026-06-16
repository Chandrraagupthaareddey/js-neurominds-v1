/**
 * JS Neurominds V1 — gas-public-api/LabService.gs
 * Handles lab home-sample-collection requests. Logistics only — no clinical
 * data or prescriptions are collected. Persist first, then notify (non-blocking).
 */

var LabService = {
  submitLabRequest: function (payload) {
    payload = payload || {};

    var errors = [];
    var name = Utils.sanitizeText(payload.name, 80);
    if (name.length < 2) errors.push('name');
    if (!Utils.isValidMobile(payload.mobile)) errors.push('mobile');
    if (!Utils.isValidEmail(payload.email)) errors.push('email');
    if (!Utils.sanitizeText(payload.pickup_area, 120)) errors.push('pickup_area');
    if (!Utils.isFutureOrToday(payload.preferred_pickup_date)) errors.push('preferred_pickup_date');
    if (!payload.selected_package) errors.push('selected_package');
    if (!payload.consent) errors.push('consent');
    if (errors.length) return { success: false, error: 'validation_failed', fields: errors };

    var id = Utils.genId('LAB');
    var now = Utils.nowIso();
    var record = {
      lab_request_id: id,
      created_at: now,
      name: name,
      mobile: String(payload.mobile).replace(/\D/g, '').slice(-10),
      whatsapp: payload.whatsapp ? String(payload.whatsapp).replace(/\D/g, '').slice(-10) : '',
      email: Utils.sanitizeText(payload.email, 120),
      pickup_area: Utils.sanitizeText(payload.pickup_area, 120),
      preferred_pickup_date: Utils.sanitizeText(payload.preferred_pickup_date, 20),
      preferred_pickup_time: Utils.sanitizeText(payload.preferred_pickup_time, 40),
      selected_package: Utils.sanitizeText(payload.selected_package, 80),
      status: 'new',
      assigned_to: '',
      updated_at: now
    };

    var opId = getOperationsAuditId_();
    SheetService.append(opId, 'Lab_Requests', record); // persist first

    try { EmailService.notifyNewLab(record); }
    catch (e) { EmailService.logEmailFailure('lab_new', id, e && e.message); }

    return { success: true, data: { lab_request_id: id } };
  }
};
