/* Shared by the Vue app and the standalone HTML pages; no framework dependency. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.BianLocale = factory()
}(typeof window !== 'undefined' ? window : this, function () {
  var STORAGE_KEY = 'bian_language'
  var languages = [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
    { code: 'ko', name: '한국어' }
  ]
  function normalizeLocale(value) {
    var locale = String(value || '').replace(/_/g, '-').toLowerCase()
    if (/^zh(?:-|$)/.test(locale)) {
      if (locale.indexOf('-hans') !== -1) return 'zh-CN'
      return /(?:hant|tw|hk|mo)/.test(locale) ? 'zh-TW' : 'zh-CN'
    }
    return /^(ja|en|ko)(?:-|$)/.test(locale) ? locale.split('-')[0] : null
  }
  function detectLocale(storage, preferredLanguages) {
    try {
      var saved = normalizeLocale(storage && storage.getItem(STORAGE_KEY))
      if (saved) return saved
    } catch (e) { /* Storage may be unavailable in a private WebView. */ }
    for (var i = 0; i < (preferredLanguages || []).length; i++) {
      var locale = normalizeLocale(preferredLanguages[i])
      if (locale) return locale
    }
    return 'zh-CN'
  }
  return { STORAGE_KEY: STORAGE_KEY, languages: languages, normalizeLocale: normalizeLocale, detectLocale: detectLocale }
}))
