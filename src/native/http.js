// Capacitor 5 起 CapacitorHttp 已并入 @capacitor/core，不需要单独装插件
import { CapacitorHttp } from '@capacitor/core'
import { isNative } from './platform'

/**
 * App 内用原生网络层发请求（@capacitor/http）
 * ------------------------------------------------------------------
 * 为什么：App 页面源是 capacitor://localhost，用 WebView 的 XHR 请求线上接口属于跨域，
 *  1) 每次非简单请求都会多一次 OPTIONS 预检；
 *  2) 后端没配 CORS 时请求会被 WKWebView 直接拦掉（表现为登录/列表毫无反应）。
 * 走原生层就没有同源策略，也不需要后端配合改 CORS，更可靠。
 *
 * 用法：把本文件的 adapter 挂到 axios 实例上即可，业务代码调用方式完全不变。
 */

function buildUrl(config) {
  let url = (config.baseURL || '') + (config.url || '')
  const params = config.params
  if (params) {
    const query = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    if (query) {
      url += (url.indexOf('?') > -1 ? '&' : '?') + query
    }
  }
  return url
}

function normalizeHeaders(headers) {
  const result = {}
  if (!headers) return result
  Object.keys(headers).forEach(key => {
    const value = headers[key]
    if (value === undefined || value === null) return
    // axios 会把 common / get / post 分组挂在一起，这里统一拍平
    if (typeof value === 'object') {
      Object.assign(result, normalizeHeaders(value))
    } else {
      result[key] = value
    }
  })
  return result
}

export function capacitorAdapter(config) {
  return new Promise((resolve, reject) => {
    const method = (config.method || 'get').toUpperCase()
    const headers = normalizeHeaders(config.headers)
    const options = {
      url: buildUrl(config),
      method: method,
      headers: headers
    }
    // GET 不带 body，避免被当成非简单请求
    if (config.data !== undefined && config.data !== null && method !== 'GET') {
      options.data = config.data
    }
    options.responseType = 'text'

    CapacitorHttp.request(options).then(res => {
      // 有 HTTP 状态码就交给 axios 自己按 validateStatus 判定（4xx 由 axios 抛错），
      // 这样与 H5 下的行为完全一致，响应拦截器才能正常处理 401 跳转等逻辑
      resolve({
        data: res.data,
        status: res.status,
        statusText: res.statusText || '',
        headers: res.headers || {},
        config: config
      })
    }).catch(err => {
      if (err && err.status) {
        resolve({
          data: err.data,
          status: err.status,
          statusText: '',
          headers: err.headers || {},
          config: config
        })
        return
      }
      const error = new Error((err && (err.error || err.message)) || '网络请求失败')
      error.config = config
      error.request = options
      reject(error)
    })
  })
}

/** 给 axios 实例装上原生适配器（非 App 环境保持默认 XHR） */
export function installHttpAdapter(axiosInstance) {
  if (isNative() && typeof CapacitorHttp !== 'undefined') {
    axiosInstance.defaults.adapter = capacitorAdapter
  }
}
