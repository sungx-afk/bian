import { isNative, plugin } from './platform'

// 内购插件接入后改这里即可（推荐 cordova-plugin-purchase / capacitor 内购插件）
const IAP_PLUGIN = 'InAppPurchase'

/**
 * 统一支付入口（已移除微信 JSAPI 支付，不再依赖微信环境）
 * - App 内：走 Apple IAP（CdvPurchase），由后端 /pay/ios/verify 校验发货
 * - 非 App 环境：明确报错，避免静默失败误以为"没反应"
 */
export function pay(order) {
  if (isNative()) return iapPay(order)
  return Promise.reject(new Error('当前环境不支持支付，请在 iOS App 内购买'))
}

async function iapPay(order) {
  const iap = plugin(IAP_PLUGIN)
  if (!iap) {
    throw new Error('内购（IAP）尚未接入，App 内暂不能开通会员')
  }
  // TODO: 接入内购插件后：拉起商品 -> 购买 -> 拿 transactionId -> 调 /pay/ios/verify 校验发货
  const result = await iap.order(order && order.productId ? order.productId : order)
  return result
}
