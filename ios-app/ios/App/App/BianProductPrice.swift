import Foundation
import Capacitor
import StoreKit

/**
 * 只读商品信息插件（不参与任何交易）
 * ------------------------------------------------------------------
 * 背景：订阅页要展示 App Store 的真实价格，但不能用 cordova-plugin-purchase 的
 * store.initialize() 去取 —— 那一步会启动交易观察者，把上次未结束的交易重新投递给
 * StoreKit，真机上表现为「一进页面就自动发起开通会员」。
 *
 * 本插件只调用 StoreKit 2 的 Product.products(for:)：这是纯粹的商品信息请求
 * （等价于 SK1 的 SKProductsRequest），不涉及 SKPaymentQueue，
 * 因此不可能发起购买、也不可能有任何交易回调。
 *
 * 要求 iOS 15+（工程 IPHONEOS_DEPLOYMENT_TARGET = 15.0）。
 */
@objc(BianProductPrice)
public class BianProductPrice: CAPPlugin {

    /// 查询商品在 App Store 的本地化价格
    /// 入参：{ ids: ["com.yugusoft.bian.yearly"] }
    /// 返回：{ prices: { "com.yugusoft.bian.yearly": "¥199.00" } }
    @objc func getPrice(_ call: CAPPluginCall) {
        guard let ids = call.getArray("ids", String.self), ids.isEmpty == false else {
            call.reject("缺少商品 ID")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: ids)
                var prices: [String: String] = [:]
                for product in products {
                    // displayPrice 是 App Store 本地化价格字符串（含货币符号，随区域/调价变化）
                    prices[product.id] = product.displayPrice
                }
                call.resolve(["prices": prices])
            } catch {
                call.reject("查询商品信息失败", nil, error)
            }
        }
    }
}
