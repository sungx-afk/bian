/**
 * 内测包专用：临时自动登录
 * ------------------------------------------------------------------
 * iOS 自签包（Sideloadly）里 Apple 登录与微信 OpenSDK 都不可用，
 * 为了能在真机上验证界面、祭拜页性能、接口等，启动时用固定 UID 直接登录。
 *
 * 提审前：把 USE_DEBUG_UID 改成 false（或删掉本文件的引用），
 * 正式版登录走 Apple 登录 + 微信 OpenSDK。
 */
export const USE_DEBUG_UID = true
export const DEBUG_UID = 700364
