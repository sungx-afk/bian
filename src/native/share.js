import { isNative, isWechat, plugin } from './platform'
import { wechatShare } from '@/wx/wxSdk'

/**
 * 统一分享入口
 * - App：系统分享面板（@capacitor/share），这也是规避 4.2「像网页壳」的原生能力之一
 * - 微信内：JS-SDK 自定义分享（保持原逻辑）
 * - 普通浏览器：优先 navigator.share，不支持则拒绝
 */
export function share(data) {
  if (isNative()) {
    const Share = plugin('Share')
    if (!Share) return Promise.reject(new Error('分享插件未安装'))
    return Share.share({
      title: data && data.title,
      text: data && data.desc,
      url: data && data.link,
      dialogTitle: data && data.title
    })
  }

  if (isWechat()) return wechatShare(data)

  if (typeof navigator !== 'undefined' && navigator.share && data && data.link) {
    return navigator.share({ title: data.title, text: data.desc, url: data.link })
  }
  return Promise.reject(new Error('当前环境不支持分享'))
}
