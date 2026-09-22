import { plugin, isNative } from './platform'

// App Store 商品 ID（与 Apple Developer / App Store Connect 里配置的一致）
export const IAP_PRODUCTS = {
  VIP_YEARLY: 'com.yugusoft.bian.yearly'   // 尊贵馆 按年（自动续期订阅）
}

/**
 * 内购封装（基于 cordova-plugin-purchase / CdvPurchase）
 * ------------------------------------------------------------------
 * 设计原则：
 *  1. 前端只负责拉起 StoreKit 支付、拿到 receipt；
 *  2. 发货必须由后端校验票据（/pay/apple/service/verify）后完成，前端不信任任何本地结果；
 *  3. 插件缺失时给出明确报错，绝不静默失败。
 */
function store() {
  // cordova-plugin-purchase v13 挂载在 window.CdvPurchase.store
  if (typeof window === 'undefined') return null
  const CdvPurchase = window.CdvPurchase || plugin('CdvPurchase')
  if (CdvPurchase && CdvPurchase.store) return CdvPurchase
  return null
}

let registered = false

/** 注册商品（重复调用安全） */
export function register(products) {
  const cdv = store()
  if (!cdv) return false
  if (!registered) {
    const list = (products || Object.keys(IAP_PRODUCTS).map(k => IAP_PRODUCTS[k])).map(id => ({
      id,
      // v13：PAID_SUBSCRIPTION；老版本用字符串 'paid subscription'，两者都兼容
      type: cdv.ProductType ? cdv.ProductType.PAID_SUBSCRIPTION : 'paid subscription',
      platform: cdv.Platform ? cdv.Platform.APPLE_APPSTORE : 'ios-appstore'
    }))
    cdv.store.register(list)
    registered = true
  }
  return true
}

/**
 * 拉起购买
 * @param {string} productId App Store 商品 ID
 * @returns {Promise<{transactionId:string, receipt:string}>}
 */
export function order(productId) {
  return new Promise((resolve, reject) => {
    if (!isNative()) {
      reject(new Error('内购只能在 App 内使用'))
      return
    }
    const cdv = store()
    if (!cdv) {
      reject(new Error('内购插件未安装，无法购买'))
      return
    }
    register([productId])

    const cleanup = () => {
      try {
        cdv.store.off(approved)
        cdv.store.off(failed)
        cdv.store.off(finished)
      } catch (e) {
        // 老版本 API 没有 off，忽略
      }
    }

    const approved = (product) => {
      if (!product || product.id !== productId) return
      const transaction = product.transaction || {}
      cleanup()
      resolve({
        transactionId: transaction.transaction_id || transaction.id || '',
        receipt: cdv.store && cdv.store.getApplicationReceipt ? cdv.store.getApplicationReceipt() : (transaction.transactionReceipt || '')
      })
    }
    const failed = (error) => {
      cleanup()
      reject(new Error((error && error.message) || '购买失败或已取消'))
    }
    const finished = () => { /* 由后端校验后再 finish，这里不处理 */ }

    try {
      cdv.store.when && cdv.store.when().approved(approved)
      cdv.store.when && cdv.store.when().failed(failed)
    } catch (e) {
      // 老版本 API：直接监听事件
      cdv.store.on && cdv.store.on('approved', approved)
      cdv.store.on && cdv.store.on('failed', failed)
    }

    const offer = cdv.store.get ? cdv.store.get(productId) : null
    const request = offer ? cdv.store.order(offer) : cdv.store.order(productId)
    Promise.resolve(request).catch(failed)
  })
}

/** 后端校验完成、发货成功后调用，告诉 StoreKit 交易结束 */
export function finish() {
  const cdv = store()
  if (!cdv || !cdv.store) return
  try {
    cdv.store.refresh && cdv.store.refresh()
  } catch (e) {
    // ignore
  }
}

/** 恢复购买（同一 Apple ID 换设备/重装后必须能恢复） */
export function restore() {
  const cdv = store()
  if (!cdv || !cdv.store) return Promise.reject(new Error('内购插件未安装'))
  return Promise.resolve(cdv.store.restorePurchases ? cdv.store.restorePurchases() : cdv.store.refresh())
}
