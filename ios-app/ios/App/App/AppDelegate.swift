import UIKit
import Capacitor
#if canImport(WXApi)
import WXApi
#endif

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its state in case it is terminated later.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    // 微信 SDK 回调：URL Scheme 方式（老方案，保留以兼容）
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        #if canImport(WXApi)
        if WXApi.handleOpen(url) {
            return true
        }
        #endif
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    // 微信 SDK 回调：Universal Link 方式（微信开放平台要求 iOS 新应用使用 Universal Link）
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        #if canImport(WXApi)
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb {
            WXApi.handleOpenUniversalLink(userActivity)
        }
        #endif
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - 微信登录原生插件（Capacitor 自动发现并注册为 "Wechat"）
// 对应 JS 侧 auth.loginByWechat()：plugin('Wechat').authorize({scope,state}) -> {code, state}
// 注意：仅在 WechatOpenSDK（WXApi）可用时编译；未 pod install 前本段被忽略，不影响现有构建。
#if canImport(WXApi)
@objc(WechatPlugin)
public class WechatPlugin: CAPPlugin, WXApiDelegate {

    // TODO: 替换为你在微信开放平台创建的移动应用的 AppId / Universal Link
    private let WECHAT_APPID = "wxREPLACE_WITH_YOUR_APPID"
    private let WECHAT_UNIVERSAL_LINK = "https://replace-with-your-domain/app/"

    private var pendingCall: CAPPluginCall?

    override public func load() {
        // 用 Universal Link 方式注册；老版本 SDK 可用 WXApi.registerApp(WECHAT_APPID)
        WXApi.registerApp(WECHAT_APPID, universalLink: WECHAT_UNIVERSAL_LINK)
        WXApi.delegate = self
    }

    // JS: Wechat.authorize({ scope: 'snsapi_userinfo', state: 'bian_login' })
    @objc func authorize(_ call: CAPPluginCall) {
        let scope = call.getString("scope") ?? "snsapi_userinfo"
        let state = call.getString("state") ?? "bian_login"

        let req = SendAuthReq()
        req.scope = scope
        req.state = state

        pendingCall = call
        if !WXApi.send(req) {
            pendingCall = nil
            call.reject("微信授权发起失败，请确认微信已安装且 AppId 配置正确")
        }
    }

    // 微信授权结果回调
    public func onResp(_ resp: BaseResp) {
        guard let authResp = resp as? SendAuthResp else { return }
        guard let call = pendingCall else { return }
        pendingCall = nil

        if resp.errCode == 0, let code = authResp.code {
            call.resolve([
                "code": code,
                "state": authResp.state ?? ""
            ])
        } else if resp.errCode == -2 {
            call.reject("取消", "USER_CANCEL")
        } else {
            call.reject(resp.errStr ?? "微信授权失败", "WX_ERR")
        }
    }
}
#endif
