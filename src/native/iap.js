import { isNative } from './platform'

// App Store 商品 ID（与 Apple Developer / App Store Connect 里配置的一致）
export const IAP_PRODUCTS = {
  VIP_YEARLY: 'com.yugusoft.bian.yearly'   // 尊贵馆 按年（自动续期订阅）
}

const ALL_PRODUCTS = Object.keys(IAP_PRODUCTS).map(k => IAP_PRODUCTS[k])

/**
 * 内购封装（cordova-plugin-purchase v13 / CdvPurchase）
 * ------------------------------------------------------------------
 * 设计原则：
 *  1. 前端只负责拉起 StoreKit 支付、拿到 receipt；
 *  2. 发货必须由后端校验票据（/pay/apple/service/verify）后完成，前端不信任任何本地结果；
 *  3. 后端确认发货后才 finish 交易，防止「扣了钱没开通」；
 *  4. 插件缺失/票据取不到时给出明确报错，绝不静默失败。
 */

let initPromise = null
let hooksBound = false
/** productId -> {resolve, reject}：正在等待 StoreKit 回调的购买请求 */
const waiting = new Map()
/** 「恢复购买」时等待 approved 回调的那个请求 */
let restoreWaiting = null
/** 兜底：App 启动/进页面时，StoreKit 会为「上次没 finish 的交易」再回调一次 approved */
let approvedHandler = null
/** 最近一次 approved 的交易，后端校验通过后由 finish() 结束它 */
let lastTransaction = null

function cdv() {
  if (typeof window === 'undefined') return null
  const C = window.CdvPurchase
  return (C && C.store) ? C : null
}

function constants() {
  const C = cdv()
  if (!C) return {}
  return {
    Platform: C.Platform || { APPLE_APPSTORE: 'ios-appstore' },
    ProductType: C.ProductType || { PAID_SUBSCRIPTION: 'paid subscription' },
    ErrorCode: C.ErrorCode || {},
    LogLevel: C.LogLevel || {}
  }
}

function productIdOf(transaction) {
  const p = transaction && transaction.products && transaction.products[0]
  return p ? p.id : ''
}

function isCancelled(err) {
  if (!err) return false
  const { ErrorCode } = constants()
  if (ErrorCode && ErrorCode.PAYMENT_CANCELLED !== undefined && err.code === ErrorCode.PAYMENT_CANCELLED) return true
  const text = `${err.code || ''} ${err.message || ''}`.toLowerCase()
  return text.indexOf('cancel') >= 0 || text.indexOf('取消') >= 0
}

function toError(err) {
  if (err instanceof Error) return err
  if (isCancelled(err)) return new Error('已取消购买')
  return new Error((err && err.message) || '购买失败')
}

/**
 * 取 App Store 票据（base64）。
 * 后端 /pay/apple/service/verify 走的是 Apple verifyReceipt 老接口，必须要这串 base64。
 * 注意：只有 SK1 模式下才有值。插件一旦发现 CdvPurchaseCapacitor 或 StoreKit2 扩展就会
 * 切到 SK2，那时只有 jwsRepresentation，老接口校验不了 —— 取不到就明确报错，别静默放行。
 */
/**
 * 票据特征描述（排查用，不打印完整票据）
 * App receipt 是 base64（通常 MII 开头，长度几百到几千）；
 * SK2 的 JWS 是 eyJ 开头的三段式，后端 /pay/apple/service/verify 老接口校验不了。
 */
export function describeReceipt(receipt) {
  const r = receipt || ''
  const len = r.length
  const head = r.slice(0, 24)
  let kind = '空'
  if (len > 0) {
    if (/^eyJ/.test(r)) kind = 'JWS（SK2 票据，后端老接口校验不了）'
    else if (/^[A-Za-z0-9+/=]+$/.test(r) && /^M/i.test(r)) kind = 'App receipt（base64）'
    else kind = '未知格式'
  }
  return { len, head, kind }
}

async function appReceipt() {
  const r = await loadReceipt()
  const info = describeReceipt(r)
  console && console.log && console.log('[iap] 取到票据: ' + JSON.stringify(info))
  if (r && typeof window !== 'undefined') {
    // 排障用：控制台里直接取出来跟 Apple 对账，不落任何日志
    window.__iapLastReceipt = r
  }
  if (!r) {
    console && console.warn && console.warn('[iap] 没取到票据：检查插件是否走了 SK2（装了 CdvPurchaseCapacitor / StoreKit2 扩展就会）')
  }
  return r
}

async function loadReceipt() {
  const C = cdv()
  if (!C) return ''
  const store = C.store
  const { Platform } = constants()
  const adapter = typeof store.getAdapter === 'function' ? store.getAdapter(Platform.APPLE_APPSTORE) : null

  if (adapter) {
    if (typeof adapter.refreshReceipt === 'function') {
      try {
        const r = await adapter.refreshReceipt()
        if (r && typeof r.appStoreReceipt === 'string' && r.appStoreReceipt) return r.appStoreReceipt
      } catch (e) {
        // 落到下面的缓存兜底
      }
    }
    const cached = adapter._receipt || adapter.receipt
    const native = cached && cached.nativeData
    if (native && typeof native.appStoreReceipt === 'string' && native.appStoreReceipt) return native.appStoreReceipt
  }

  // 老版本 API 兜底
  if (typeof store.getApplicationReceipt === 'function') {
    const r = store.getApplicationReceipt()
    if (typeof r === 'string' && r) return r
  }
  return ''
}

/** 一次支付/恢复成功：把结果交给等待方 */
function deliver(transaction) {
  const productId = productIdOf(transaction)
  lastTransaction = transaction
  appReceipt().then(receipt => {
    const payload = {
      productId,
      transactionId: (transaction && transaction.transactionId) || '',
      receipt
    }
    if (restoreWaiting) {
      const w = restoreWaiting
      restoreWaiting = null
      w.resolve(payload)
      return
    }
    const w = waiting.get(productId)
    if (w) {
      waiting.delete(productId)
      w.resolve(payload)
      return
    }
    // 没有人等着（例如上次付了钱但后端校验失败、交易没 finish，
    // 这次启动 StoreKit 又回调了）：交给兜底处理器补发货
    if (approvedHandler && payload.receipt) approvedHandler(payload)
  })
}

function failAll(err) {
  const e = toError(err)
  if (restoreWaiting) {
    const w = restoreWaiting
    restoreWaiting = null
    w.reject(e)
  }
  waiting.forEach(w => w.reject(e))
  waiting.clear()
}

function bindHooks() {
  if (hooksBound) return
  const C = cdv()
  if (!C) return
  const store = C.store
  hooksBound = true

  store.when().approved(transaction => {
    // v13 里 approved 可能在 App 启动时为「上次没 finish 的交易」再触发一次，
    // 这里只做事：把票据交给业务层，由后端校验结果决定是否 finish。
    deliver(transaction)
  })

  if (typeof store.error === 'function') {
    store.error(err => {
      // 错误未必对应某个商品（如 SETUP/LOAD），统一广播给所有等待中的请求
      if (waiting.size > 0 || restoreWaiting) failAll(err)
      else console && console.log && console.log('[iap]', err && err.message)
    })
  }
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ])
}

/** 初始化插件并加载商品（重复调用安全） */
function ensureInit(products) {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const C = cdv()
    if (!C || !C.store) throw new Error('内购插件未加载，App 内暂不能开通尊贵馆')
    const store = C.store
    const { Platform, ProductType, LogLevel } = constants()

    if (LogLevel.DEBUG !== undefined) store.verbosity = LogLevel.DEBUG

    store.register((products || ALL_PRODUCTS).map(id => ({
      id,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.APPLE_APPSTORE
    })))
    bindHooks()

    // autoFinish=false：交易要等后端校验通过再结束，避免扣款后没发货
    const errors = await store.initialize([{
      platform: Platform.APPLE_APPSTORE,
      options: { autoFinish: false, needAppReceipt: true }
    }])
    if (errors && errors.length) {
      const { ErrorCode } = constants()
      const fatal = errors.filter(e => !e || e.code !== ErrorCode.PAYMENT_NOT_ALLOWED)
      if (fatal.length) throw new Error((fatal[0] && fatal[0].message) || '内购初始化失败')
    }

    // 排查关键：SK2 模式下没有整包票据，后端老接口必然校验失败
    const adapter = typeof store.getAdapter === 'function' ? store.getAdapter(Platform.APPLE_APPSTORE) : null
    console && console.log && console.log('[iap] 插件已初始化: useSK2=' + !!(adapter && adapter.useSK2))

    // 商品信息没加载完时 store.get() 拿不到 offer，order 会失败；但别无限等
    try {
      await withTimeout(store.ready(), 10000, '获取商品信息超时')
    } catch (e) {
      // 超时不致命：order 里还会再校验 product 是否存在
      console && console.log && console.log('[iap] ready:', e.message)
    }
    return store
  })().catch(e => {
    initPromise = null   // 失败允许重试
    throw e
  })
  return initPromise
}

/**
 * 拉起购买
 * @param {string} productId App Store 商品 ID
 * @returns {Promise<{productId:string, transactionId:string, receipt:string}>}
 */
export function order(productId) {
  return new Promise((resolve, reject) => {
    if (!isNative()) {
      reject(new Error('内购只能在 App 内使用'))
      return
    }
    ensureInit([productId]).then(store => {
      const product = store.get(productId)
      if (!product) {
        reject(new Error('未能从 App Store 获取商品信息，请检查网络后重试'))
        return
      }
      waiting.set(productId, { resolve, reject })
      const offer = typeof product.getOffer === 'function' ? product.getOffer() : null
      Promise.resolve(store.order(offer || product)).then(err => {
        if (err) {
          waiting.delete(productId)
          reject(toError(err))
        }
        // 无错时等待 approved 回调，由 deliver() resolve
      }, e => {
        waiting.delete(productId)
        reject(toError(e))
      })
    }).catch(reject)
  })
}

/**
 * 注册兜底回调：收到「没有对应购买请求的 approved」时触发。
 * 典型场景：上次付款后后端校验失败/断网，交易没 finish，App 下次启动会再回调一次。
 * @param {(payload:{productId,transactionId,receipt}) => void} fn
 */
export function setApprovedHandler(fn) {
  approvedHandler = typeof fn === 'function' ? fn : null
}

/** 后端校验完成、发货成功后调用，告诉 StoreKit 交易结束 */
export function finish(transaction) {
  const tx = transaction || lastTransaction
  lastTransaction = null
  if (!tx || typeof tx.finish !== 'function') return Promise.resolve()
  try {
    return Promise.resolve(tx.finish())
  } catch (e) {
    return Promise.resolve()
  }
}

/**
 * 恢复购买（同一 Apple ID 换设备/重装后必须能恢复）
 * @returns {Promise<{productId:string, transactionId:string, receipt:string}>}
 *          恢复成功时票据交给业务层，由后端校验后发货并 finish。
 */
export function restore() {
  return new Promise((resolve, reject) => {
    if (!isNative()) {
      reject(new Error('恢复购买只能在 App 内使用'))
      return
    }
    ensureInit().then(store => {
      restoreWaiting = { resolve, reject }
      // 没买过的话 Apple 不会回调 approved，这里给个超时兜底
      const timer = setTimeout(() => {
        if (restoreWaiting) {
          restoreWaiting = null
          reject(new Error('该 Apple ID 下没有可恢复的购买记录'))
        }
      }, 20000)
      const originalResolve = resolve
      restoreWaiting.resolve = (payload) => {
        clearTimeout(timer)
        originalResolve(payload)
      }
      Promise.resolve(store.restorePurchases()).then(err => {
        if (err && !isCancelled(err)) {
          clearTimeout(timer)
          restoreWaiting = null
          reject(toError(err))
        }
      }, e => {
        clearTimeout(timer)
        restoreWaiting = null
        reject(toError(e))
      })
    }).catch(reject)
  })
}
