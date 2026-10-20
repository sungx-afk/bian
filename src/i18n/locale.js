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
  // 是否跟随系统语言：
  //   false（当前）= 不跟随，固定默认中文（除非用户手动切换并写入了 localStorage）
  //   true        = 跟随浏览器/系统语言
  // 后续需要恢复「跟随系统语言」时，把这里改成 true 即可，无需动其它代码。
  var FOLLOW_SYSTEM_LOCALE = false
  function detectLocale(storage, preferredLanguages) {
    try {
      var saved = normalizeLocale(storage && storage.getItem(STORAGE_KEY))
      if (saved) return saved
    } catch (e) { /* Storage may be unavailable in a private WebView. */ }
    if (FOLLOW_SYSTEM_LOCALE) {
      for (var i = 0; i < (preferredLanguages || []).length; i++) {
        var locale = normalizeLocale(preferredLanguages[i])
        if (locale) return locale
      }
    }
    return 'zh-CN'
  }
  return { STORAGE_KEY: STORAGE_KEY, languages: languages, normalizeLocale: normalizeLocale, detectLocale: detectLocale }
}))
