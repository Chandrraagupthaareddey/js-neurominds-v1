/**
 * JS Neurominds V1 — gas-admin-cms/Utils.gs
 * Shared utilities for the Admin CMS (JSON responses, IDs, time, sanitization).
 */
var Utils = {
  json: function (obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  },
  ok: function (data) { return Utils.json({ success: true, data: data }); },
  fail: function (message, code) { return Utils.json({ success: false, error: message || 'error', code: code || 'ERROR' }); },
  sanitizeText: function (v, max) {
    max = max || 1000;
    return String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, max);
  },
  genId: function (prefix) {
    var stamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd');
    var rand = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
    return (prefix || 'ID') + '-' + stamp + '-' + rand;
  },
  nowIso: function () { return Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ssXXX"); },
  today: function () { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'); }
};
