import Vue from 'vue'
import { Locale } from 'vant'
import zhCN from 'vant/lib/locale/lang/zh-CN'
import zhTW from 'vant/lib/locale/lang/zh-TW'
import jaJP from 'vant/lib/locale/lang/ja-JP'
import enUS from 'vant/lib/locale/lang/en-US'
import koKR from './vant-ko'
import simplified from './locales/zh-CN.json'
import traditional from './locales/zh-TW.json'
import japanese from './locales/ja.json'
import english from './locales/en.json'
import korean from './locales/ko.json'

import { STORAGE_KEY, languages, normalizeLocale, detectLocale } from './locale'
export { STORAGE_KEY, languages, normalizeLocale, detectLocale }
const messages = { 'zh-CN': simplified, 'zh-TW': traditional, ja: japanese, en: english, ko: korean }
const vantMessages = { 'zh-CN': zhCN, 'zh-TW': zhTW, ja: jaJP, en: enUS, ko: koKR }
const vantNames = { ja: 'ja-JP', en: 'en-US', ko: 'ko-KR' }

let storage
try { storage = typeof window !== 'undefined' ? window.localStorage : null } catch (e) {}
const preferred = typeof navigator !== 'undefined' ? (navigator.languages || [navigator.language]) : []
export const state = Vue.observable({ locale: detectLocale(storage, preferred) })

// Keys are original interface text, so Simplified Chinese is also a readable fallback.
export function t(key, params = {}) {
  if (typeof key !== 'string') return key
  const catalog = messages[state.locale]
  const text = Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : key
  return text.replace(/\{(\w+)\}/g, (match, name) => params[name] === undefined ? match : String(params[name]))
}

function syncLocale() {
  Locale.use(vantNames[state.locale] || state.locale, vantMessages[state.locale])
  if (typeof document !== 'undefined') {
    document.documentElement.lang = state.locale
    document.documentElement.setAttribute('data-locale', state.locale)
    document.title = t('彼岸思念')
  }
}

export function setLocale(value) {
  const locale = normalizeLocale(value)
  if (!locale) return false
  state.locale = locale
  try { if (storage) storage.setItem(STORAGE_KEY, locale) } catch (e) {}
  syncLocale()
  return true
}

export function installI18n(VueConstructor) {
  VueConstructor.prototype.$t = t
  VueConstructor.mixin({
    computed: { $locale() { return state.locale } },
    methods: {
      $localizeActions(actions) {
        return (actions || []).map(action => ({ ...action, name: t(action.name), subname: t(action.subname) }))
      }
    }
  })
  syncLocale()
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY) {
        state.locale = normalizeLocale(event.newValue) || detectLocale(null, preferred)
        syncLocale()
      }
    })
  }
}
