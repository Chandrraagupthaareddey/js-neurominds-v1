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
      domain: sys.domain,
      logo_url: sys.logo_url || '/assets/brand/logo.png',
      footer_logo_url: sys.footer_logo_url || '/assets/brand/logo.png',
      social_preview_url: sys.social_preview_url || '/assets/brand/social-preview.png',
      google_review_url: sys.google_review_url || sys.maps_url
    };
  },

  // Feature flags as a typed object (cached). Missing flag -> default below.
  featureFlags: function () {
    var cached = ContentService_._cacheGet('feature_flags');
    if (cached) return cached;
    var defaults = {
      public_lab_tests_enabled: false, public_testimonials_enabled: true, public_reviews_enabled: true,
      public_knowledge_enabled: true, public_announcements_enabled: false, floating_cta_enabled: true
    };
    var rows = SheetService.readAll(getConfigContentId_(), 'Feature_Flags');
    rows.forEach(function (r) { defaults[r.flag_key] = String(r.enabled).toUpperCase() === 'TRUE' || r.enabled === true; });
    ContentService_._cachePut('feature_flags', defaults);
    return defaults;
  },

  navigation: function () {
    var cached = ContentService_._cacheGet('navigation');
    if (cached) return cached;
    var flags = ContentService_.featureFlags();
    var rows = SheetService.readAll(getConfigContentId_(), 'Navigation')
      .filter(function (n) {
        var enabled = String(n.is_enabled).toUpperCase() === 'YES' || n.is_enabled === true ||
                      String(n.visible).toUpperCase() === 'YES' || n.visible === true; // back-compat
        if (!enabled) return false;
        if (n.route === '/lab' && !flags.public_lab_tests_enabled) return false;
        if (n.route === '/knowledge' && flags.public_knowledge_enabled === false) return false;
        return true;
      })
      .sort(function (a, b) { return Number(a.display_order) - Number(b.display_order); })
      .map(function (n) { return { label: n.label, route: n.route }; });
    ContentService_._cachePut('navigation', rows);
    return rows;
  },

  socialLinks: function () {
    var cached = ContentService_._cacheGet('social_links');
    if (cached) return cached;
    var rows = SheetService.readAll(getConfigContentId_(), 'Social_Links')
      .filter(function (s) { return (String(s.is_enabled).toUpperCase() === 'YES') && s.url; })
      .sort(function (a, b) { return Number(a.display_order) - Number(b.display_order); });
    ContentService_._cachePut('social_links', rows);
    return rows;
  },

  floatingCta: function () {
    var cached = ContentService_._cacheGet('floating_cta');
    if (cached) return cached;
    var rows = SheetService.readAll(getConfigContentId_(), 'Floating_CTA')
      .filter(function (c) { return String(c.is_enabled).toUpperCase() === 'YES'; })
      .sort(function (a, b) { return Number(a.display_order) - Number(b.display_order); });
    ContentService_._cachePut('floating_cta', rows);
    return rows;
  },

  testimonials: function () {
    var cached = ContentService_._cacheGet('testimonials');
    if (cached) return cached;
    var rows = SheetService.readWhere(getConfigContentId_(), 'Testimonials', 'status', 'approved')
      .sort(function (a, b) { return Number(a.display_order) - Number(b.display_order); });
    ContentService_._cachePut('testimonials', rows);
    return rows;
  },

  googleReviews: function () {
    var cached = ContentService_._cacheGet('google_reviews');
    if (cached) return cached;
    var sys = getSystemConfig_();
    var reviews = SheetService.readWhere(getConfigContentId_(), 'Google_Reviews', 'status', 'approved')
      .filter(function (r) { return String(r.google_status || 'active') !== 'missing_from_latest_sync'; })
      .sort(function (a, b) { return Number(a.display_order) - Number(b.display_order); });
    var out = {
      summary: {
        rating: Number(sys.google_rating || 0),
        review_count: Number(sys.google_review_count || reviews.length),
        profile_url: sys.google_review_url || '', write_review_url: sys.google_review_url || ''
      },
      reviews: reviews
    };
    ContentService_._cachePut('google_reviews', out);
    return out;
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
