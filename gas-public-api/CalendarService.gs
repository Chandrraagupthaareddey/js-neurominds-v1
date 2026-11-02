/**
 * JS Neurominds V1 — gas-public-api/CalendarService.gs
 * Live availability + calendar sync for the clinic's OWN booking form.
 *
 *   - availability(from, to)  → busy intervals from the clinic Google Calendar, so the
 *                               website can mark taken slots as "Booked" (and anything the
 *                               clinic blocks by hand — holidays, lunch — becomes unavailable).
 *   - isFree(date, slot, min) → server-side double-booking guard at submit time.
 *   - createEvent(record)     → puts the appointment on the calendar immediately.
 *
 * Which calendar: Script Property BOOKING_CALENDAR_ID (e.g. jsneurominds5@gmail.com).
 * Default = the primary calendar of the Google account that deployed this script.
 * To use another account's calendar, share it with the deploying account
 * ("Make changes to events") and set BOOKING_CALENDAR_ID to that email.
 * Script Property BOOKING_SLOT_MINUTES (default 30) sets the appointment length.
 */

var CalendarService = {
  _cal: function () {
    var id = getProp_('BOOKING_CALENDAR_ID');
    var cal = id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar();
    if (!cal) throw new Error('Calendar not accessible: ' + (id || 'primary') + '. Share it with the script owner and set BOOKING_CALENDAR_ID.');
    return cal;
  },

  slotMinutes: function () {
    var n = Number(getProp_('BOOKING_SLOT_MINUTES'));
    return n > 0 ? n : 30;
  },

  _dateAt: function (dateIso, hhmm) {
    var p = String(dateIso).split('-').map(Number);
    var t = String(hhmm || '00:00').split(':').map(Number);
    return new Date(p[0], p[1] - 1, p[2], t[0], t[1], 0, 0); // script timezone (Asia/Kolkata)
  },

  /** Busy intervals between two ISO dates (inclusive). Cached for 60s to stay well inside quotas. */
  availability: function (fromIso, toIso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromIso || '')) throw new Error('from must be YYYY-MM-DD');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(toIso || '')) toIso = fromIso;
    var cache = CacheService.getScriptCache();
    var key = 'avail:' + fromIso + ':' + toIso;
    var hit = cache.get(key);
    if (hit) return JSON.parse(hit);

    var start = CalendarService._dateAt(fromIso, '00:00');
    var end = CalendarService._dateAt(toIso, '23:59');
    var events = CalendarService._cal().getEvents(start, end);
    var busy = events.filter(function (ev) {
      // Ignore events the clinic marked "free"/transparent and declined invitations.
      return ev.getTransparency && ev.getTransparency() === CalendarApp.EventTransparency.TRANSPARENT ? false : true;
    }).map(function (ev) {
      return { start: ev.getStartTime().toISOString(), end: ev.getEndTime().toISOString(), all_day: ev.isAllDayEvent() };
    });
    var out = { from: fromIso, to: toIso, slot_minutes: CalendarService.slotMinutes(), busy: busy };
    cache.put(key, JSON.stringify(out), 60);
    return out;
  },

  /** True when no non-transparent event overlaps [slot, slot + minutes). */
  isFree: function (dateIso, hhmm, minutes) {
    var s = CalendarService._dateAt(dateIso, hhmm);
    var e = new Date(s.getTime() + (minutes || CalendarService.slotMinutes()) * 60000);
    var overlapping = CalendarService._cal().getEvents(s, e).filter(function (ev) {
      return !(ev.getTransparency && ev.getTransparency() === CalendarApp.EventTransparency.TRANSPARENT);
    });
    return overlapping.length === 0;
  },

  /** Create the appointment event; returns the event id. Never includes clinical details. */
  createEvent: function (record) {
    var s = CalendarService._dateAt(record.appointment_date, record.appointment_slot);
    var e = new Date(s.getTime() + CalendarService.slotMinutes() * 60000);
    var title = 'Appointment · ' + record.patient_name + ' · ' + record.reference;
    var desc = [
      'Reference: ' + record.reference,
      'Mobile: ' + record.mobile_number,
      'Type: ' + record.visit_type + ' · ' + record.consultation_mode,
      'Doctor: ' + record.doctor,
      'Fee: ' + record.fee + ' · Payment: ' + record.payment_status,
      record.notes ? 'Note: ' + record.notes : '',
      '',
      'Booked via neurominds.in. Status: requested — confirm with the patient on WhatsApp/phone.'
    ].filter(Boolean).join('\n');
    var ev = CalendarService._cal().createEvent(title, s, e, { description: desc });
    try { ev.setColor(CalendarApp.EventColor.PALE_GREEN); } catch (ignore) { /* optional */ }
    // Invalidate the availability cache for that day so the next visitor sees it as booked.
    try { CacheService.getScriptCache().remove('avail:' + record.appointment_date + ':' + record.appointment_date); } catch (ignore) { /* optional */ }
    return ev.getId();
  }
};
