/**
 * JS Neurominds V1 — gas-public-api/FeedbackService.gs
 * Stores patient feedback (rating + optional short message + consent flag).
 * Feedback is held as "pending" until an admin moderates it. No PII required.
 */

var FeedbackService = {
  submitFeedback: function (payload) {
    payload = payload || {};
    var rating = Number(payload.rating);
    if (!(rating >= 1 && rating <= 5)) return { success: false, error: 'invalid_rating' };

    var id = Utils.genId('FB');
    var now = Utils.nowIso();
    var record = {
      feedback_id: id,
      created_at: now,
      rating: rating,
      message: Utils.sanitizeText(payload.message, 300),
      consent_given: payload.consent_given ? 'YES' : 'NO',
      source_hint: Utils.sanitizeText(payload.source_hint || 'website', 40),
      status: 'pending',
      moderated_by: '',
      updated_at: now
    };

    SheetService.append(getOperationsAuditId_(), 'Feedback', record);
    return { success: true, data: { feedback_id: id } };
  }
};
