import { isNative, plugin } from './platform'
// 同 auth.js：插件需要 import 才会注册到运行时
import { Share as NativeShare } from '@capacitor/share'

/**
 * 统一分享入口（已移除微信 JS-SDK，不再依赖微信环境）
 * - App：系统分享面板（@capacitor/share），也是规避"像网页壳"的原生能力之一
 * - 普通浏览器：优先 Web Share API（navigator.share），不支持则明确报错
 */
export function share(data) {
  if (isNative()) {
    const Share = NativeShare || plugin('Share')
    if (!Share) return Promise.reject(new Error('分享插件未安装'))
    return Share.share({
      title: data && data.title,
      text: data && data.desc,
      url: data && data.link,
      dialogTitle: data && data.title
    })
  }

  if (typeof navigator !== 'undefined' && navigator.share && data && data.link) {
    return navigator.share({ title: data.title, text: data.desc, url: data.link })
  }
  return Promise.reject(new Error('当前环境不支持分享，请用系统分享或复制链接'))
}
