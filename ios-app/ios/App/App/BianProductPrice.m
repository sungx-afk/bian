#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// 只读商品信息插件：只查询 App Store 商品价格，
// 不注册交易观察者、不发起任何购买（与 cordova-plugin-purchase 完全独立）
CAP_PLUGIN(BianProductPrice, "BianProductPrice",
           CAP_PLUGIN_METHOD(getPrice, CAPPluginReturnPromise);
)
