import qs from 'qs'
import base64 from 'js-base64'
import config_server from '@/config/config'
import { isNative, plugin } from './platform'
import { share as systemShare } from './share'

/**
 * 微信 SDK 分享（点击分享 -> 拉起微信 -> 选好友/群 -> 直接发送网页卡片）
 * ------------------------------------------------------------------
 * - 依赖 iOS 原生侧的 Capacitor 自定义插件 WechatShare（内部集成微信开放 SDK，
 *   注册 appid 为移动应用 wx514a6e8640d7b303，见 yugu-ba 的 WeiXinOpenUtil.IOS_APP_APPID）。
 *   插件约定：share({ title, description, url, thumb, scene })，
 *   scene: 'session'（好友/群，微信弹出选人页）| 'timeline'（朋友圈）
 * - 原生插件未就绪时自动降级为系统分享面板（@capacitor/share），面板中同样可选"微信"，
 *   区别仅是微信里以普通链接消息呈现，无自定义卡片标题/缩略图。
 */

/**
 * 好友在微信内点开的 H5 入口：/list（List.vue 负责授权登录并按 copylink 直达纪念馆）
 * 注意：这里不走 /home，也不走 /ios-app-share —— 前者会多一次中转，后者是给 Universal Link 拉起 App 用的，
 *       在微信内置浏览器里 Universal Link 会被屏蔽，好友会卡在"在 Safari 中打开"。
 */
const WECHAT_SHARE_PATH = '/list'

/**
 * direct_to=web：告诉分享中转页"直接用网页浏览"，
 * 不再弹"打开 App / 下载"让用户选（H5 里 List.vue 的 showOpenAppTip 会据此跳过）。
 */
const DIRECT_TO_WEB = 'web'

/**
 * 生成微信分享链接
 * 好友点开后：H5 -> 服务号网页授权登录（wechatAppId）-> 解析 copylink -> 直达对应纪念馆
 * 注意：不能用 /ios-app-share（微信内置浏览器屏蔽 Universal Link，会卡在"在 Safari 中打开"）
 * @param extra {origin_from, invite_user_id, space_id, space_name?}
 */
export function buildWechatShareLink(extra) {
  const content = Object.assign({}, extra)
  delete content.space_name // space_name 只用于卡片描述，不进链接（与 /share 页一致）
  const encoded = base64.Base64.encode(qs.stringify(content, { indices: false }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${config_server.domain}${WECHAT_SHARE_PATH}?app_id=${config_server.wechatAppId}`
    + `&direct_to=${DIRECT_TO_WEB}&copylink=${encoded}`
}

/**
 * 拉起微信分享
 * @param data {title, desc, link, thumb?, scene?} scene 默认会话（微信内自选好友/群）
 */
export function shareToWechat(data) {
  const WechatShare = isNative() ? plugin('WechatShare') : null
  if (WechatShare && typeof WechatShare.share === 'function') {
    return WechatShare.share({
      title: data && data.title,
      description: data && data.desc,
      url: data && data.link,
      thumb: (data && data.thumb) || '',
      scene: (data && data.scene) || 'session'
    })
  }
  // 降级：系统分享面板（内含"微信"选项）
  return systemShare({ title: data && data.title, desc: data && data.desc, link: data && data.link })
}
