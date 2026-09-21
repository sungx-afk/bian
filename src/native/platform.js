/**
 * 运行环境判定
 * ------------------------------------------------------------------
 * 所有平台差异都从这里取，业务代码不要再直接判断 UA、也不要直接调 wx.xxx，
 * 否则 H5（微信）与 App（iOS/Android）两套逻辑会互相污染。
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
  return isNative() && nativePlatform() === 'ios'
}

export function isWechat() {
  if (typeof navigator === 'undefined') return false
  return /micromessenger/i.test(navigator.userAgent || '')
}

/**
 * 上传给后端的 plat 字段：ios / android / wechat / h5
 * 以前写死 'wechat'，App 内会让后端按微信渠道处理订单与登录，必须区分。
 */
export function appPlat() {
  if (isNative()) {
    return nativePlatform() === 'android' ? 'android' : 'ios'
  }
  return isWechat() ? 'wechat' : 'h5'
}

/** 取 Capacitor 插件：兼容 window.XXX 与 window.Capacitor.Plugins.XXX 两种挂载方式 */
export function plugin(name) {
  if (typeof window === 'undefined') return null
  if (window[name]) return window[name]
  const c = capacitor()
  if (c && c.Plugins && c.Plugins[name]) return c.Plugins[name]
  return null
}
