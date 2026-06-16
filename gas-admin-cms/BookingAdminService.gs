/**
 * JS Neurominds V1 — gas-admin-cms/BookingAdminService.gs
 * Booking-intent insights for the admin dashboard. Confirmed appointments live
 * in PWeNS in V1; this surfaces GA4 booking-intent events only.
 */
var BookingAdminService = {
  summary: function (user) {
    RoleService.requireView(user, 'booking');
    // Delegates to GA4 service for event counts; kept thin intentionally.
    return AnalyticsGa4Service.bookingEvents(user);
  }
};
