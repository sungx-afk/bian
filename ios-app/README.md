# iOS 壳工程说明（Capacitor + WKWebView）

本目录是 iOS 壳工程，**与原有 Web 工程解耦**：根目录仍是老的 Vue2 工程，这里只放 Capacitor 配置与生成的 Xcode 工程文件。
本机不安装 Xcode / CocoaPods，所有编译签名都在云端（Codemagic）完成。

## 目录

| 路径 | 说明 |
|---|---|
| `capacitor.config.json` | 应用 ID、名称、WebView 配置；当前 `server.url` 指向线上站点 `https://ba.yugusoft.com`，用于最快跑起来看效果 |
| `www/` | Web 资源目录，**已加入 .gitignore、不入库**；由根目录 `npm run build` + 本目录 `npm run copy:web` 生成，CI 里也会自动生成 |
| `ios/App/` | Capacitor 生成的 Xcode 工程（`App.xcworkspace`），Pods 已 gitignore |
| 根目录 `codemagic.yaml` | 云端打包配置（TestFlight / Ad Hoc 两套 workflow） |

## 零、安全红线（务必遵守）

**签名证书、p8 私钥、描述文件绝对不要提交进仓库。** 本仓库已在 `.gitignore` 里屏蔽 `*.p8 / *.p12 / *.mobileprovision / *.cer / private_keys/`。

- 云端签名只用 GitHub Actions 的 **Encrypted Secrets**（加密存储，不进 git，运行日志里也会打码）；
- 如果密钥不小心被提交过：立刻去 Apple Developer 后台**吊销**对应的 API Key / 证书，重新生成，再清掉 git 历史里的文件；
- 本仓库当前是**公开**仓库，源码里的接口地址、Bundle ID 都是公开信息，但密钥不是。

## 一、上架前要确认的两处配置

1. Bundle ID：`com.yugusoft.bian`（`capacitor.config.json` 的 `appId`），必须与 Apple Developer 后台的 App ID 一致。
2. 应用名称：`appName` 当前为「纪念馆」，正式名称在 `ios/App/App/Info.plist` 的 `CFBundleDisplayName` 里改。

## 二、Apple Developer 后台要做的事（浏览器操作，约 15 分钟）

1. **App ID**：Certificates, Identifiers & Profiles → Identifiers → 新建 App ID（`com.yugusoft.bian`），勾选 Push Notifications（后续要用）。
2. **设备 UDID**（走 Ad Hoc 才需要）：Devices → 添加测试机 UDID（手机 Safari 打开 `https://udid.io` 或用爱思助手取）。
3. **App Store Connect API 密钥**（给 Codemagic 自动签名用）：
   App Store Connect → 用户和访问 → 密钥 → 生成 API 密钥（App Manager 权限），记录 **Issuer ID**、**Key ID**，下载 `.p8` 文件（只能下载一次）。
4. **App Store Connect 新 App**：我的 App → 新建 App，选好 Bundle ID 与 SKU（TestFlight 上传需要）。

## 三、Codemagic 配置步骤

1. 注册并登录 Codemagic，添加仓库（GitLab 自托管需公网可访问；不可访问就先镜像一份到 GitLab.com/GitHub 私有仓库）。
2. Teams → Integrations → App Store Connect，填入 Issuer ID、Key ID、`.p8` 内容、证书私钥。
3. 新建 Application 时选择「Use codemagic.yaml」。
4. 触发构建 → 产出 IPA → 自动上传 TestFlight（workflow `ios-testflight`）。
   **当前 Codemagic 只在打 tag 时触发**（`git tag v1.0.1 && git push origin v1.0.1`）；
   分支推送由 GitHub Actions（`.github/workflows/ios-build.yml`）负责，两者不会同时跑。

## 四、把 App 装到 iPhone

- **TestFlight（推荐）**：CI 上传成功后会自动把构建加入**内部测试组**（`ios-app/ci/add-build-to-beta-group.rb`），
  你只需要在 App Store Connect → TestFlight 里**加一次测试员**，对方在 iPhone 装「TestFlight」App 接受邀请即可安装，有效期 90 天。
  之后每次 push，测试员打开 TestFlight 就能看到新版本，不用再手工添加构建。
- 想发到**外部测试组**：手动 Run workflow 时填 `beta_group` 参数。**但外部组要过一次 Beta 审核**（约 1 天），
  且 App 必须先在后台填好测试信息（反馈邮箱、演示账号等），否则接口会拒绝。
- **Ad Hoc**：UDID 已注册的设备可直接安装 IPA（通过 Codemagic 下载页或蒲公英分发），1 年有效期。
- 若走 TestFlight 外部测试组，需要过一次轻量 Beta 审核（约 1 天）。

## 五、本地开发时如何调试

- 本机没有 Xcode，**不能本地编译**，只能改配置与 Web 资源后推分支触发云端构建。
- **`www/` 不再入库**，本地跑 `npx cap sync ios` 之前必须先生成它，否则会把空目录打进 App：
  ```bash
  cd .. && npm run build      # 根目录产出 dist/
  cd ios-app && npm run copy:web && npx cap sync ios
  ```
  云端（GitHub Actions / Codemagic）已内置这两步，不需要手工提交 `www/`。

## 六、常见坑

| 现象 | 原因 | 处理 |
|---|---|---|
| 白屏 / 打不开 | `server.url` 不可达或证书不受信任 | 确认站点 HTTPS 且域名在 `server.url`，且网络可达 |
| 图标字体不显示 | 外链 `//at.alicdn.com` 在 App 内加载失败 | 改为 `https:` 或把字体文件放进 `static/` |
| 微信登录/分享失效 | App 内无微信 JS-SDK 环境 | 后续接微信 OpenSDK（改造清单 P0-9） |
| 构建报签名失败 | API 密钥权限或证书不匹配 | 确认密钥为 App Manager 权限、Bundle ID 一致 |
| 上传报 "bundle version 已使用" | TestFlight 要求 `CFBundleVersion` 每次递增 | CI 已自动递增（GitHub 用 `GITHUB_RUN_NUMBER`，Codemagic 用 `BUILD_NUMBER`）；本地打包前先跑 `xcrun agvtool new-version -all <更大的号>` |
| 企业自签包掉签 | 使用第三方签名服务 | 仅用于体验，正式上架必须走自己的开发者账号 |

## 七、已完成的桥接改造（src/native）

Web 端与 App 共用一套业务代码，平台差异统一收敛在 `src/native/`：

| 模块 | H5（微信） | App（iOS） |
|---|---|---|
| `platform.js` | 判定 wechat / h5 / ios / android；`appPlat()` 决定上传后端的 `plat` 字段 | 同左 |
| `auth.js` | 跳微信 OAuth 授权页拿 code | `SignInWithApple.authorize()`（@capacitor-community/apple-sign-in），拿到 identityToken |
| `pay.js` | 微信 JSAPI `chooseWXPay` | 预留 IAP 入口，未接入时给出明确报错，不静默失败 |
| `share.js` | 微信 JS-SDK 自定义分享 | `@capacitor/share` 系统分享面板 |

挂载方式：`src/main.js` 里 `installNativeBridge(Vue)`，`this.wechatPay / this.wechatShare` 仍可用，业务页面无需改动。
登录入口：`List.vue` 在 iOS App 内只展示引导页（不再自动跳微信授权），引导页新增「通过 Apple 登录」按钮。

## 八、后端需要配合实现的接口

| 接口 | 用途 | 备注 |
|---|---|---|
| `POST /users/oauth2/apple/service/login_by_token` | 校验 Apple identityToken（Apple JWKS 公钥）、建号/绑号、下发 token | 前端已实现调用（`user.js` 的 `loginWithApple`），返回结构需与微信登录一致 |
| `POST /users/my/delete` | 注销账号并清除/脱敏数据 | 审核 5.1.1(v) 硬性要求 |
| `POST /pay/apple/service/verify` | IAP receipt 校验与发货（下一步接入内购时用） | 需防重复发货 |
| 现有接口 | 需识别 `plat=ios`，不要再按微信渠道处理登录与订单 | 前端已在 `api.js` 按环境上报 plat |

## 九、当前仍不能用的功能（App 内）

- **微信登录 / 分享 / 支付**：App 内无 JS-SDK 环境。登录已降级到 Apple 登录；分享已走系统面板；支付需接 IAP（改造清单 P0-1）。
- **微信 OpenSDK 登录**：需微信开放平台移动应用 AppID + Universal Link，已在 entitlements 预留 `applinks:ba.yugusoft.com`。
- **拍照上传**：iOS WKWebView 支持 `input[type=file]` 调相机/相册，plist 权限文案已加，待真机验证。
