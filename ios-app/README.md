# iOS 壳工程说明（Capacitor + WKWebView）

本目录是 iOS 壳工程，**与原有 Web 工程解耦**：根目录仍是老的 Vue2 工程，这里只放 Capacitor 配置与生成的 Xcode 工程文件。
本机不安装 Xcode / CocoaPods，所有编译签名都在云端（Codemagic）完成。

## 目录

| 路径 | 说明 |
|---|---|
| `capacitor.config.json` | 应用 ID、名称、WebView 配置；当前 `server.url` 指向线上站点 `https://ba.yugusoft.com`，用于最快跑起来看效果 |
| `www/` | Web 资源目录，正式发布前改为 `npm run copy:web`（拷贝根目录 `npm run build` 产物） |
| `ios/App/` | Capacitor 生成的 Xcode 工程（`App.xcworkspace`），Pods 已 gitignore |
| 根目录 `codemagic.yaml` | 云端打包配置（TestFlight / Ad Hoc 两套 workflow） |

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
3. 新建 Application 时选择「Use codemagic.yaml」，分支选 `feature/ios-capacitor`。
4. 触发构建 → 产出 IPA → 自动上传 TestFlight（workflow `ios-testflight`）。

## 四、把 App 装到 iPhone

- **TestFlight（推荐）**：App Store Connect → TestFlight → 添加测试员（内部测试无需审核）→ 对方在 iPhone 装「TestFlight」App 接受邀请即可安装，有效期 90 天。
- **Ad Hoc**：UDID 已注册的设备可直接安装 IPA（通过 Codemagic 下载页或蒲公英分发），1 年有效期。
- 若走 TestFlight 外部测试组，需要过一次轻量 Beta 审核（约 1 天）。

## 五、本地开发时如何调试

- 本机没有 Xcode，**不能本地编译**，只能改配置与 Web 资源后推分支触发云端构建。
- `capacitor.config.json` 里的 `server.url` 指向线上站点，改 Web 代码后刷新 App 即可看到改动（前提是线上已发布）。
- 切回本地打包：删除 `server` 节点，根目录执行 `npm run build`，再在本目录执行 `npm run copy:web`，然后 `npx cap sync ios`。

## 六、常见坑

| 现象 | 原因 | 处理 |
|---|---|---|
| 白屏 / 打不开 | `server.url` 不可达或证书不受信任 | 确认站点 HTTPS 且域名在 `server.url`，且网络可达 |
| 图标字体不显示 | 外链 `//at.alicdn.com` 在 App 内加载失败 | 改为 `https:` 或把字体文件放进 `static/` |
| 微信登录/分享失效 | App 内无微信 JS-SDK 环境 | 后续接微信 OpenSDK（改造清单 P0-9） |
| 构建报签名失败 | API 密钥权限或证书不匹配 | 确认密钥为 App Manager 权限、Bundle ID 一致 |
| 企业自签包掉签 | 使用第三方签名服务 | 仅用于体验，正式上架必须走自己的开发者账号 |
