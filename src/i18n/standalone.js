/* Small runtime for the product-introduction, partnership and login callback pages. */
(function (window, document) {
  var core = window.BianLocale
  var storage
  try { storage = window.localStorage } catch (e) {}
  var preferred = (window.navigator.languages && window.navigator.languages.length) ? window.navigator.languages : [window.navigator.language]
  var current = core.detectLocale(storage, preferred)
  var catalogs = { 'zh-CN': {} }
  var requests = {}
  var controls = []

  function translate(key) {
    var catalog = catalogs[current] || {}
    return Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : key
  }
  function update() {
    document.documentElement.lang = current
    document.documentElement.setAttribute('data-locale', current)
    var title = document.body.getAttribute('data-i18n-title')
    if (title) document.title = translate(title)
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
      node.textContent = translate(node.getAttribute('data-i18n'))
    })
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-alt]'), function (node) {
      node.setAttribute('alt', translate(node.getAttribute('data-i18n-alt')))
    })
    controls.forEach(function (select) {
      select.value = current
      select.setAttribute('aria-label', translate('选择语言'))
    })
  }
  function selectLocale(value, persist) {
    var locale = core.normalizeLocale(value)
    if (!locale) return
    current = locale
    if (persist) {
      try { if (storage) storage.setItem(core.STORAGE_KEY, locale) } catch (e) {}
    }
    update()
    if (catalogs[locale] || requests[locale]) return
    requests[locale] = true
    var xhr = new window.XMLHttpRequest()
    xhr.open('GET', 'bian-mobile/i18n/locales/' + locale + '.json', true)
    xhr.onload = function () {
      delete requests[locale]
      if (xhr.status !== 200 && xhr.status !== 0) return
      try { catalogs[locale] = JSON.parse(xhr.responseText) } catch (e) { return }
      if (current === locale) update()
    }
    xhr.onerror = function () { delete requests[locale] }
    xhr.send()
  }
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-language-selector]'), function (container) {
      var label = document.createElement('label')
      var text = document.createElement('span')
      text.setAttribute('data-i18n', '语言')
      label.appendChild(text)
      var select = document.createElement('select')
      core.languages.forEach(function (language) {
        var option = document.createElement('option')
        option.value = language.code
        option.textContent = language.name
        option.lang = language.code
        select.appendChild(option)
      })
      select.addEventListener('change', function () { selectLocale(select.value, true) })
      label.appendChild(select)
      container.appendChild(label)
      controls.push(select)
    })
    selectLocale(current, false)
    window.addEventListener('storage', function (event) {
      if (event.key === core.STORAGE_KEY) selectLocale(core.normalizeLocale(event.newValue) || core.detectLocale(null, preferred), false)
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
}(window, document))
