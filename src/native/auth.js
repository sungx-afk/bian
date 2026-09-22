import config_server from '@/config/config'
import { isNative, isNativeIOS, plugin } from './platform'
// Capacitor 插件必须在 Web 代码里 import 才会注册（运行时不会自动注册），
// 否则 App 里 window.SignInWithApple 不存在，Apple 登录按钮不会出现。
import { SignInWithApple as AppleSignIn } from '@capacitor-community/apple-sign-in'

// @capacitor-community/apple-sign-in 挂载的全局对象
const APPLE_PLUGIN = 'SignInWithApple'

/** 微信网页授权地址（H5 用） */
export function wechatAuthorizeUrl() {
  const appid = window.app_id || config_server.wechatAppId
  const redirect = encodeURIComponent(`${config_server.domain}/login.html`)
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}` +
    `&redirect_uri=${redirect}&response_type=code&scope=snsapi_userinfo` +
    `&state=wechat_state#wechat_redirect`
}

/**
 * 微信登录
 * H5：跳微信 OAuth 授权页（回调带 code，由 List.vue 用 code 换 token）
 * App：JS-SDK 不可用，需接微信 OpenSDK（见 ios-app/README.md），当前直接返回错误，
 *      由调用方降级到 Apple 登录，避免用户卡在白屏。
 */
export function loginByWechat() {
  if (isNative()) {
    return Promise.reject(new Error('App 内暂未开放微信登录，请先用 Apple 登录'))
  }
  window.location.replace(wechatAuthorizeUrl())
  return Promise.resolve()
}

export function appleLoginAvailable() {
  return isNativeIOS() && !!plugin(APPLE_PLUGIN)
}

/**
 * Apple 登录（审核 4.8：只要提供第三方登录就必须同时提供 Sign in with Apple）
 * 返回 identityToken / authorizationCode / email / 姓名 / appleUserId，
 * 由后端校验 identityToken 后换取本站 token。
 */
export async function loginByApple() {
  // 优先用 import 进来的实例，兜底再查运行时挂载（两种挂载方式都兼容）
  const apple = AppleSignIn || plugin(APPLE_PLUGIN)
  if (!apple) {
    throw new Error('Apple 登录不可用（插件未安装，或当前不是 iOS App）')
  }
  const res = await apple.authorize()
  const data = (res && res.response) ? res.response : (res || {})
  return {
    identityToken: data.identityToken,
    authorizationCode: data.authorizationCode,
    email: data.email,
    fullName: [data.familyName, data.givenName].filter(Boolean).join(''),
    appleUserId: data.user
  }
}

/** 统一登录入口：App 走 Apple 登录，H5 走微信授权 */
export function login() {
  if (isNative()) return loginByApple()
  return loginByWechat()
}
