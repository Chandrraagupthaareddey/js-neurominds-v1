/**
 * JS Neurominds V1 — gas-admin-cms/EmailTemplateService.gs
 * Builds plain-text email bodies for admin-side notifications (e.g. status
 * updates the clinic may send to itself). Templates are kept here so wording is
 * consistent and easy to adjust. No PII is logged by these helpers.
 */
var EmailTemplateService = {
  callbackAssigned: function (record, staffEmail) {
    return {
      subject: 'Callback assigned · ' + record.patient_name,
      body: [
        'A callback request has been assigned to ' + staffEmail + '.',
        '', 'Name: ' + record.patient_name, 'Preferred: ' + record.preferred_call_date + ' · ' + record.preferred_call_time_slot,
        'Concern: ' + record.generic_concern_category, '', 'Open the Callback Desk to proceed.'
      ].join('\n')
    };
  },
  labVerified: function (record) {
    return {
      subject: 'Lab pickup verified · ' + record.name,
      body: ['Lab home collection has been verified.', '', 'Name: ' + record.name, 'Pickup: ' + record.pickup_area, 'When: ' + record.preferred_pickup_date + ' · ' + record.preferred_pickup_time].join('\n')
    };
  }
};
