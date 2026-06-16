/**
 * JS Neurominds V1 — gas-public-api/Router.gs
 * Dispatches API actions to services. GET actions are read-only content;
 * POST actions are validated writes (callback/lab/feedback). Unknown actions
 * return a clean error. Soft rate limiting applies to write actions.
 */

var Router = {
  handleGet: function (action, params) {
    switch (action) {
      case 'config': return Utils.ok(ContentService_.config());
      case 'navigation': return Utils.ok(ContentService_.navigation());
      case 'conditions': return Utils.ok(ContentService_.conditions());
      case 'treatments': return Utils.ok(ContentService_.treatments());
      case 'services': return Utils.ok(ContentService_.services());
      case 'doctors': return Utils.ok(ContentService_.doctors());
      case 'labPackages': return Utils.ok(ContentService_.labPackages());
      case 'blogs': return Utils.ok(ContentService_.blogs());
      case 'faqs': return Utils.ok(ContentService_.faqs());
      case 'condition': return Utils.ok(ContentService_.conditionBySlug(params.slug));
      case 'treatment': return Utils.ok(ContentService_.treatmentBySlug(params.slug));
      case 'doctor': return Utils.ok(ContentService_.doctorBySlug(params.slug));
      case 'blog': return Utils.ok(ContentService_.blogBySlug(params.slug));
      case 'health': return Utils.ok(HealthService.check());
      default: return Utils.fail('Unknown action: ' + action, 'UNKNOWN_ACTION');
    }
  },

  handlePost: function (action, payload) {
    // Write actions are rate-limited per action per minute.
    if (!Utils.rateLimitOk(action)) return Utils.fail('Too many requests, please try again shortly.', 'RATE_LIMITED');

    switch (action) {
      case 'submitCallback': return Utils.json(BookingService.submitCallback(payload));
      case 'submitLabRequest': return Utils.json(LabService.submitLabRequest(payload));
      case 'submitFeedback': return Utils.json(FeedbackService.submitFeedback(payload));
      default: return Utils.fail('Unknown action: ' + action, 'UNKNOWN_ACTION');
    }
  }
};
