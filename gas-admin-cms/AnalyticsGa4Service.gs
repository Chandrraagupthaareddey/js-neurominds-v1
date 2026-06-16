/**
 * JS Neurominds V1 — gas-admin-cms/AnalyticsGa4Service.gs
 * PRIMARY analytics source: the GA4 Data API (AnalyticsData advanced service).
 * BigQuery is NEVER queried for these dashboards in V1 (sandbox/optional).
 *
 * Everything here reads aggregated, non-PII metrics only. If the GA4 API is not
 * yet enabled or returns an error, we degrade to a clearly-labelled empty
 * structure so the dashboard still renders.
 */
var AnalyticsGa4Service = {
  _propertyResource: function () { return 'properties/' + ga4PropertyId_(); },

  /** Safe wrapper: returns null on any GA4 error so callers can fall back. */
  _run: function (request) {
    try {
      if (typeof AnalyticsData === 'undefined') return null;
      return AnalyticsData.Properties.runReport(request, AnalyticsGa4Service._propertyResource());
    } catch (e) { return null; }
  },

  /** Dashboard analytics block (sessions, sources, devices, key events). */
  dashboard: function (user) {
    RoleService.requireView(user, 'dashboard');
    var empty = AnalyticsGa4Service._emptyGa();

    // Daily sessions (last 7 days)
    var sessionsReport = AnalyticsGa4Service._run({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }]
    });
    if (!sessionsReport) return empty; // GA4 not ready → labelled empty

    var daily = [];
    var totalSessions = 0, totalUsers = 0;
    (sessionsReport.rows || []).forEach(function (row) {
      var s = Number(row.metricValues[0].value || 0);
      var u = Number(row.metricValues[1].value || 0);
      daily.push(s); totalSessions += s; totalUsers += u;
    });

    var bySource = AnalyticsGa4Service._dimensionBreakdown('sessionDefaultChannelGroup', 'sessions', 'source');
    var byDevice = AnalyticsGa4Service._dimensionBreakdown('deviceCategory', 'sessions', 'device');
    var events = AnalyticsGa4Service._eventCounts();

    return {
      range: 'Last 7 days', source: 'ga4',
      daily_sessions: daily.length ? daily : [0],
      totals: { sessions: totalSessions, active_users: totalUsers },
      by_source: bySource, by_device: byDevice, events: events
    };
  },

  _dimensionBreakdown: function (dimension, metric, label) {
    var rep = AnalyticsGa4Service._run({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: dimension }], metrics: [{ name: metric }],
      limit: 6
    });
    if (!rep) return [];
    return (rep.rows || []).map(function (r) {
      var o = {}; o[label] = r.dimensionValues[0].value; o[metric] = Number(r.metricValues[0].value || 0); return o;
    });
  },

  _eventCounts: function () {
    var rep = AnalyticsGa4Service._run({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }],
      limit: 50
    });
    var keys = ['condition_view', 'doctor_profile_view', 'whatsapp_click', 'call_click', 'support_booking_submit', 'support_booking_click', 'pwens_booking_click'];
    var out = {}; keys.forEach(function (k) { out[k] = 0; });
    if (!rep) return out;
    (rep.rows || []).forEach(function (r) {
      var name = r.dimensionValues[0].value;
      if (out.hasOwnProperty(name)) out[name] = Number(r.metricValues[0].value || 0);
    });
    return out;
  },

  bookingEvents: function (user) {
    RoleService.requireView(user, 'booking');
    return { events: AnalyticsGa4Service._eventCounts() };
  },

  _emptyGa: function () {
    return {
      range: 'Last 7 days', source: 'ga4_unavailable',
      daily_sessions: [0], totals: { sessions: 0, active_users: 0 },
      by_source: [], by_device: [],
      events: { condition_view: 0, doctor_profile_view: 0, whatsapp_click: 0, call_click: 0, support_booking_submit: 0, support_booking_click: 0, pwens_booking_click: 0 }
    };
  }
};
