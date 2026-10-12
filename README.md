# yugu-wechat

> A Vue.js project

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).    

## 多语言

支持简体中文（`zh-CN`）、繁体中文（`zh-TW`）、日语（`ja`）、英文（`en`）和韩语（`ko`）。登录页、引导页、纪念馆列表和账号设置都有语言选择入口。首次使用匹配设备语言；手动选择保存在 `localStorage.bian_language`，之后刷新或重启仍生效。切换语言无需刷新页面。

词表位于 `src/i18n/locales/`，使用 `$t('原始中文文案', { 参数 })` 翻译界面文案。新增词条须同步五个词表并保持插值参数一致。姓名、馆名、文章、留言、挽联和用户编辑的讣告等内容保留原文。菜单只转换显示名称，操作 ID 和业务数据保持不变。历法和日期仍按原有格式保存，日期选择器仅转换显示。

运行 `npm run check:i18n` 检查词表一致性、插值参数、设备语言匹配、选择记忆、Vue 响应式更新、Vant 语言包、日期显示及用户内容保留；运行 `npm run build` 验证生产构建。

iOS 已声明五种语言，并加入 `InfoPlist.strings` 的应用名称和相机/相册权限说明。原生系统菜单和权限提示跟随 iOS 的 App 语言设置；应用内的语言选择作用于网页界面。iOS 打包前按既有流程运行 `npm run ios:sync` 同步网页资源。

复核还覆盖独立的 `intro.html`、`bd.html` 页面，二者与主应用共用 `src/i18n/locale.js` 的语言匹配规则和词表。`build/i18n-assets.js` 同时用于开发、生产构建，保证独立页面及其语言资源被打包。`systemText` 过滤器仅用于服务端生成的祭拜、到访、充值记录，按已知系统模板转换显示，不用于用户留言或文章。核验脚本额外检查原始中文标签、真实组件在五种语言下的渲染、独立页面标签覆盖和异步请求竞态。
