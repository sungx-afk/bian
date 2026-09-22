import * as platform from './platform'
import * as auth from './auth'
import { pay } from './pay'
import { share } from './share'
import * as iap from './iap'

export { platform, auth, pay, share, iap }

export const native = {
  isNative: platform.isNative,
  isNativeIOS: platform.isNativeIOS,
  isWechat: platform.isWechat,
  appPlat: platform.appPlat,
  login: auth.login,
  loginByApple: auth.loginByApple,
  loginByWechat: auth.loginByWechat,
  appleLoginAvailable: auth.appleLoginAvailable,
  pay,
  share,
  iap
}

/**
 * 挂载到 Vue：业务代码继续用 this.wechatPay / this.wechatShare，
 * 内部按环境分发，无需改动各业务页面。
 */
export function installNativeBridge(Vue) {
  Vue.prototype.$native = native
  Vue.prototype.$platform = platform
  Vue.prototype.wechatPay = pay
  Vue.prototype.wechatShare = share
}
