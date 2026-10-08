import { isNative, isNativeIOS, plugin } from './platform'
// Capacitor 插件必须在 Web 代码里 import 才会注册（运行时不会自动注册），
// 否则 App 里 window.SignInWithApple 不存在，Apple 登录按钮不会出现。
import { SignInWithApple as AppleSignIn } from '@capacitor-community/apple-sign-in'

// @capacitor-community/apple-sign-in 挂载的全局对象
const APPLE_PLUGIN = 'SignInWithApple'

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

/**
 * 统一登录入口：App 走 Apple 登录；H5 不再有微信授权，统一到登录页用 ?uid= 调试。
 */
export function login() {
  if (isNative()) return loginByApple()
  return Promise.reject(new Error('当前环境不支持该登录方式，请在 iOS App 内使用 Apple 登录，或用 ?uid= 调试'))
}
