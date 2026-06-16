/**
 * JS Neurominds V1 — gas-public-api/Utils.gs
 * Shared utilities for the Public API: JSON responses, input sanitization,
 * validation, soft rate limiting, and ID generation. No PII ever leaves here
 * toward analytics; sanitizeText strips angle brackets as defense in depth.
 */

var Utils = {
  /** Build a JSON ContentService response (CORS-friendly; text/plain POST avoids preflight). */
  json: function (obj) {
    return ContentService
      .createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  },

  ok: function (data) { return Utils.json({ success: true, data: data }); },
  fail: function (message, code) { return Utils.json({ success: false, error: message || 'error', code: code || 'ERROR' }); },

  /** Strip control chars + angle brackets, trim, cap length. */
  sanitizeText: function (v, max) {
    max = max || 500;
    return String(v == null ? '' : v).replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
  },

  isValidMobile: function (v) {
    var digits = String(v || '').replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(digits.slice(-10));
  },

  isValidEmail: function (v) {
    if (!v) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
  },

  isFutureOrToday: function (dateStr) {
    if (!dateStr) return false;
    var d = new Date(dateStr + 'T00:00:00');
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return !isNaN(d.getTime()) && d >= t;
  },

  /** Time-ordered unique id, e.g. CB-20260616-AB12CD. */
  genId: function (prefix) {
    var now = new Date();
    var stamp = Utilities.formatDate(now, 'Asia/Kolkata', 'yyyyMMdd');
    var rand = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
    return (prefix || 'ID') + '-' + stamp + '-' + rand;
  },

  nowIso: function () {
    return Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ssXXX");
  },

  /**
   * Soft per-window rate limit using CacheService counters. Keyed by a coarse
   * bucket (action + minute). Returns true if allowed.
   */
  rateLimitOk: function (bucketKey) {
    var cache = CacheService.getScriptCache();
    var minute = Math.floor(Date.now() / 60000);
    var key = 'rl_' + bucketKey + '_' + minute;
    var count = Number(cache.get(key) || 0);
    if (count >= CONFIG.RATE_LIMIT_PER_MIN) return false;
    cache.put(key, String(count + 1), 90);
    return true;
  },

  /** Clamp a requested page size to the configured maximum. */
  pageSize: function (requested) {
    var n = Number(requested) || CONFIG.MAX_PAGE_SIZE;
    return Math.max(1, Math.min(n, CONFIG.MAX_PAGE_SIZE));
  }
};
