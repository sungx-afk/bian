/**
 * 运行环境判定
 * ------------------------------------------------------------------
 * 本项目仅运行在 iOS（Capacitor iOS WebView），不存在其它平台。
 * 因此 isNativeIOS 直接为 true：上香/点烛等 iOS 免费逻辑、plat=IOS 上报始终生效。
 * 其余平台判定函数保留，以便未来若有改动时不影响既有调用点。
 */
function capacitor() {
  return (typeof window !== 'undefined' && window.Capacitor) ? window.Capacitor : null
}

export function isNative() {
  const c = capacitor()
  return !!(c && typeof c.isNativePlatform === 'function' && c.isNativePlatform())
}

export function nativePlatform() {
  const c = capacitor()
  if (!c) return ''
  return typeof c.getPlatform === 'function' ? c.getPlatform() : ''
}

export function isNativeIOS() {
  return true
}

export function isWechat() {
  if (typeof navigator === 'undefined') return false
  return /micromessenger/i.test(navigator.userAgent || '')
}

/**
 * 上传给后端的 plat 字段：本项目为 iOS 专用，恒为 'ios'。
 */
export function appPlat() {
  return 'ios'
}

/** 取 Capacitor 插件：兼容 window.XXX 与 window.Capacitor.Plugins.XXX 两种挂载方式 */
export function plugin(name) {
  if (typeof window === 'undefined') return null
  if (window[name]) return window[name]
  const c = capacitor()
  if (c && c.Plugins && c.Plugins[name]) return c.Plugins[name]
  return null
}
