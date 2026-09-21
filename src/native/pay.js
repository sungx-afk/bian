import { isNative, isWechat, plugin } from './platform'
import { wechatPay } from '@/wx/wxSdk'

// 内购插件接入后改这里即可（推荐 cordova-plugin-purchase / capacitor 内购插件）
const IAP_PLUGIN = 'InAppPurchase'

/**
 * 统一支付入口
 * - 微信内：微信 JSAPI 支付（保持原逻辑）
 * - App 内：必须走 IAP，接口未就绪时给出明确报错，避免静默失败误以为"没反应"
 * - 普通浏览器：不支持
 */
export function pay(order) {
  if (isNative()) return iapPay(order)
  if (isWechat()) return wechatPay(order)
  return Promise.reject(new Error('当前环境不支持支付'))
}

async function iapPay(order) {
  const iap = plugin(IAP_PLUGIN)
  if (!iap) {
    throw new Error('内购（IAP）尚未接入，App 内暂不能购买云币/祭品')
  }
  // TODO: 接入内购插件后：拉起商品 -> 购买 -> 拿 receipt -> 调 /pay/apple/service/verify 校验发货
  const result = await iap.order(order && order.productId ? order.productId : order)
  return result
}
