/**
 * JS Neurominds V1 — gas-public-api/ContentService.gs
 * Read-only content endpoints for the public site. Only PUBLISHED content is
 * exposed. Results are cached (CacheService) to stay fast and within quotas.
 */

var ContentService_ = {
  _cacheGet: function (key) {
    var c = CacheService.getScriptCache().get(key);
    return c ? JSON.parse(c) : null;
  },
  _cachePut: function (key, val) {
    CacheService.getScriptCache().put(key, JSON.stringify(val), CONFIG.CACHE_TTL_SECONDS);
  },

  _publishedFromTab: function (tabName, cacheKey) {
    var cached = ContentService_._cacheGet(cacheKey);
    if (cached) return cached;
    var rows = SheetService.readWhere(getConfigContentId_(), tabName, 'status', 'published');
    ContentService_._cachePut(cacheKey, rows);
    return rows;
  },

  /** Clinic config (subset of System_Config that is safe + useful to the site). */
  config: function () {
    var sys = getSystemConfig_();
    return {
      clinic_name: sys.clinic_name, clinic_short: sys.clinic_short,
      display_phone: sys.display_phone, cta_phone: sys.cta_phone,
      call_link: sys.call_link, whatsapp_link: sys.whatsapp_link,
      maps_url: sys.maps_url, address: sys.address, footer: sys.footer,
      pwens_booking_url: sys.pwens_booking_url, email_support: sys.support_email,
      domain: sys.domain
    };
  },

  navigation: function () {
    var cached = ContentService_._cacheGet('navigation');
    if (cached) return cached;
    var rows = SheetService.readAll(getConfigContentId_(), 'Navigation')
      .filter(function (n) { return String(n.visible).toUpperCase() === 'YES' || n.visible === true; })
      .sort(function (a, b) { return Number(a.display_order) - Number(b.display_order); })
      .map(function (n) { return { label: n.label, route: n.route }; });
    ContentService_._cachePut('navigation', rows);
    return rows;
  },

  conditions: function () { return ContentService_._publishedFromTab('Conditions', 'pub_conditions'); },
  treatments: function () { return ContentService_._publishedFromTab('Treatments', 'pub_treatments'); },
  services: function () { return ContentService_._publishedFromTab('Services', 'pub_services'); },
  doctors: function () { return ContentService_._publishedFromTab('Doctors', 'pub_doctors'); },
  labPackages: function () { return ContentService_._publishedFromTab('Lab_Packages', 'pub_lab'); },
  blogs: function () { return ContentService_._publishedFromTab('Blogs', 'pub_blogs'); },

  faqs: function () {
    var cached = ContentService_._cacheGet('pub_faqs');
    if (cached) return cached;
    var rows = SheetService.readWhere(getConfigContentId_(), 'FAQs', 'status', 'published')
      .sort(function (a, b) { return Number(a.display_order) - Number(b.display_order); });
    ContentService_._cachePut('pub_faqs', rows);
    return rows;
  },

  conditionBySlug: function (slug) { return SheetService.findOne(getConfigContentId_(), 'Conditions', 'slug', slug); },
  treatmentBySlug: function (slug) { return SheetService.findOne(getConfigContentId_(), 'Treatments', 'slug', slug); },
  doctorBySlug: function (slug) { return SheetService.findOne(getConfigContentId_(), 'Doctors', 'slug', slug); },
  blogBySlug: function (slug) { return SheetService.findOne(getConfigContentId_(), 'Blogs', 'slug', slug); }
};
