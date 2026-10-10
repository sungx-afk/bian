import { registerPlugin } from '@capacitor/core'
import { isNative } from './platform'

// 原生只读商品查询插件（BianProductPrice）。
// 必须 registerPlugin：Capacitor 只有在 JS 侧注册后才会生成插件代理并写入 Capacitor.Plugins，
// 直接取 window.Capacitor.Plugins.BianProductPrice 是 undefined（那时会静默回退到兜底价）。
const BianProductPrice = registerPlugin('BianProductPrice')

// App Store 商品 ID（与 Apple Developer / App Store Connect 里配置的一致）
export const IAP_PRODUCTS = {
  VIP_YEARLY: 'com.yugusoft.bian.yearly'   // 会员 按年（自动续期订阅）
}

const ALL_PRODUCTS = Object.keys(IAP_PRODUCTS).map(k => IAP_PRODUCTS[k])

/**
 * 内购封装（cordova-plugin-purchase v13 / CdvPurchase）
 * ------------------------------------------------------------------
 * 设计原则：
 *  1. 前端只负责拉起 StoreKit 支付、拿到 Apple 的交易 ID（transactionId）；
 *  2. 发货必须由后端调 Apple App Store Server API 核实（/pay/ios/verify）后完成，
 *     前端不信任任何本地结果，也不需要上传整包票据；
 *  3. 后端确认发货后才 finish 交易，防止「扣了钱没开通」；
 *  4. 插件缺失 / 拿不到交易 ID 时给出明确报错，绝不静默失败。
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
/**
 * transactionId -> StoreKit 交易对象。
 * 一次恢复购买可能同时回调多笔交易，后端校验是异步的，
 * 必须按 ID 各自 finish 自己的那一笔，不能用「最近一次」这种全局变量 ——
 * 否则后到的交易会覆盖前面的，导致前面的永远结束不了、下次继续重放。
 */
const transactions = new Map()

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
 * App Store 交易描述（排查用）
 * 后端 /pay/ios/verify 走 App Store Server API，只需要拿 transactionId 去问 Apple，
 * 不再依赖整包票据 —— 所以 SK1 / SK2 都能用，取不到票据也不会再卡住。
 */
export function describeTransaction(payload) {
  const tid = (payload && payload.transactionId) || ''
  const oid = (payload && payload.originalTransactionId) || ''
  return {
    productId: (payload && payload.productId) || '',
    transactionId: tid,
    transactionIdLen: tid.length,
    originalTransactionId: oid,
    originalIdLen: oid.length
  }
}

/** 一次支付/恢复成功：把结果交给等待方 */
function deliver(transaction) {
  const payload = {
    productId: productIdOf(transaction),
    transactionId: (transaction && transaction.transactionId) || '',
    originalTransactionId: (transaction && transaction.originalTransactionId) || ''
  }
  lastTransaction = transaction
  if (payload.transactionId) transactions.set(payload.transactionId, transaction)
  console && console.log && console.log('[iap] StoreKit 交易: ' + JSON.stringify(describeTransaction(payload)))

  const rejectIt = (err) => {
    if (restoreWaiting) {
      const w = restoreWaiting
      restoreWaiting = null
      w.reject(err)
      return
    }
    const w = waiting.get(payload.productId)
    if (w) {
      waiting.delete(payload.productId)
      w.reject(err)
    }
  }
  const resolveIt = () => {
    if (restoreWaiting) {
      const w = restoreWaiting
      restoreWaiting = null
      w.resolve(payload)
      return
    }
    const w = waiting.get(payload.productId)
    if (w) {
      waiting.delete(payload.productId)
      w.resolve(payload)
      return
    }
    // 没有人等着（例如上次付了钱但后端校验失败、交易没 finish，
    // 这次启动 StoreKit 又回调了）：交给兜底处理器补发货
    if (approvedHandler) approvedHandler(payload)
  }

  if (payload.transactionId) resolveIt()
  else rejectIt(new Error('未能取到 Apple 交易 ID，无法完成发货'))
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
    if (!C || !C.store) throw new Error('内购插件未加载，App 内暂不能开通会员')
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
      // 后端 /pay/ios/verify 只需要 transactionId，不用再拉整包票据
      options: { autoFinish: false }
    }])
    if (errors && errors.length) {
      const { ErrorCode } = constants()
      const fatal = errors.filter(e => !e || e.code !== ErrorCode.PAYMENT_NOT_ALLOWED)
      if (fatal.length) throw new Error((fatal[0] && fatal[0].message) || '内购初始化失败')
    }

    // 信息性日志：新方案只需要 transactionId，SK1 / SK2 都能提供
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
 * @returns {Promise<{productId:string, transactionId:string, originalTransactionId:string}>}
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
 * 只读商品信息：只查询 App Store 上的价格，完全不参与交易。
 * 走原生 BianProductPrice 插件（StoreKit 2 的 Product.products(for:)），
 * 不初始化内购插件、不注册交易观察者，因此不可能发起购买或触发补单 ——
 * 页面一打开就能安全地展示真实价格。
 * @param {string} productId App Store 商品 ID
 * @returns {Promise<string>} 本地化价格文案（如 "¥199.00"）；取不到时返回 ''
 */
export function getPriceOnly(productId) {
  if (!isNative() || !BianProductPrice) return Promise.resolve('')
  return Promise.resolve(BianProductPrice.getPrice({ ids: [productId] })).then(r => {
    const prices = (r && r.prices) || {}
    const text = prices[productId] || ''
    // 用 ?debug=1 打开 vConsole 可以看到真价到底有没有取到
    console && console.log && console.log('[iap] 只读商品查询 ' + productId + ' => ' + (text || '(空)'))
    return text
  }).catch(e => {
    console && console.log && console.log('[iap] 只读商品查询失败: ' + (e && (e.message || JSON.stringify(e))))
    return ''
  })
}

/**
 * 读取商品在 App Store 的本地化价格（订阅页展示「按年支付，¥199.00/年」）。
 * 价格必须来自 StoreKit：App Store Connect 调价、不同国家/地区的货币与税费
 * 都会自动跟随，前端写死会与审核看到的实际价格不一致。
 * @param {string} productId App Store 商品 ID
 * @returns {Promise<string>} 本地化价格文案（如 "¥199.00"）；取不到时返回 ''
 */
export function getPrice(productId) {
  if (!isNative()) return Promise.resolve('')
  return ensureInit([productId]).then(store => {
    const product = store.get(productId)
    if (!product) return ''
    const offer = typeof product.getOffer === 'function' ? product.getOffer() : null
    const pricing = (offer && offer.pricing) || product.pricing || null
    if (!pricing) return ''
    // 优先用 StoreKit 已本地化的价格字符串（自带货币符号，随区域变化）
    if (pricing.price) return String(pricing.price)
    // 回退：priceMicros（微单位，199 元 = 199000000）
    if (pricing.priceMicros !== undefined && pricing.priceMicros !== null) {
      const value = Number(pricing.priceMicros) / 1000000
      if (!isNaN(value)) {
        const prefix = pricing.currency === 'CNY' ? '¥' : ''
        return prefix + (Number.isInteger(value) ? value : value.toFixed(2))
      }
    }
    return ''
  }).catch(e => {
    console && console.log && console.log('[iap] 获取价格失败: ' + (e && e.message))
    return ''
  })
}

/**
 * 注册兜底回调：收到「没有对应购买请求的 approved」时触发。
 * 典型场景：上次付款后后端校验失败/断网，交易没 finish，App 下次启动会再回调一次。
 * @param {(payload:{productId,transactionId,originalTransactionId}) => void} fn
 */
export function setApprovedHandler(fn) {
  approvedHandler = typeof fn === 'function' ? fn : null
}

/**
 * 后端校验完成、发货成功后调用，告诉 StoreKit 交易结束。
 * @param {string|object} transactionOrId 传 transactionId 最稳妥 —— 多笔交易并发时
 *        各自结束自己那一笔；不传则退回「最近一次交易」。
 */
export function finish(transactionOrId) {
  let tx = null
  if (transactionOrId && typeof transactionOrId.finish === 'function') {
    tx = transactionOrId
  } else if (typeof transactionOrId === 'string' && transactions.has(transactionOrId)) {
    tx = transactions.get(transactionOrId)
  }
  if (!tx) tx = lastTransaction
  lastTransaction = null

  if (!tx || typeof tx.finish !== 'function') return Promise.resolve()
  // 从缓存移除，避免重复 finish 和无谓的内存占用
  if (tx.transactionId) transactions.delete(tx.transactionId)
  try {
    return Promise.resolve(tx.finish())
  } catch (e) {
    return Promise.resolve()
  }
}

/**
 * 恢复购买（同一 Apple ID 换设备/重装后必须能恢复）
 * @returns {Promise<{productId:string, transactionId:string, originalTransactionId:string}>}
 *          恢复成功时把交易 ID 交给业务层，由后端核实后发货并 finish。
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
