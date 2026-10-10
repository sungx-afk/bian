import { isNative, isWechat, plugin } from './platform'
// 插件需要 import 才会注册到运行时
import { Media as NativeMedia } from '@capacitor-community/media'

/**
 * 保存 base64 图片到手机（dataURL 形如 data:image/png;base64,...）
 * - App（iOS/Android）：@capacitor-community/media 直接写入系统相册
 *   （Info.plist 已声明 NSPhotoLibraryAddUsageDescription）
 * - 微信内置浏览器：不支持 a[download]，引导用户长按图片保存
 * - 其他浏览器：a[download] 触发下载
 */
export function saveImageToAlbum(dataUrl, fileName) {
  const name = fileName || `bian_${Date.now()}.png`
  if (!dataUrl) {
    return Promise.reject(new Error('图片尚未生成，请稍后再试'))
  }

  if (isNative()) {
    const Media = NativeMedia || plugin('Media')
    if (!Media) return Promise.reject(new Error('保存插件未安装'))
    // savePhoto 只接受 path 字段（支持 web URL / base64 dataURI / 本地文件路径）
    return Media.savePhoto({
      path: dataUrl
    })
  }

  if (isWechat()) {
    return Promise.reject(new Error('请长按图片保存到手机相册'))
  }

  return new Promise((resolve, reject) => {
    try {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      resolve()
    } catch (e) {
      reject(new Error('保存失败，请长按图片保存'))
    }
  })
}
