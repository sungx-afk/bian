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

祭拜风格绑定界面语言：简中、繁中使用中式双烛；日语、英语、韩语使用西式白烛，每次点烛新增一支。西式烛列支持横向滑动，不限制为两支；没有有效点烛记录时显示一支未燃白烛。点烛请求携带 `memorialStyle`，后端 `yugu-ba/SpaceController` 在西式模式下为每次点烛新增独立的有效期记录，详情接口的 `products` 数组保留重复记录以恢复数量，中式继续续时。此逻辑需要前后端同步发布。核验脚本覆盖成功与失败购买、请求防重入、详情响应顺序、刷新恢复、过期移除、语言切换及火焰裁切。

西式模式隐藏祭拜页的全部挽联内容和卷轴装饰（包含已保存、已开启显示的挽联），并隐藏设置页的“自定义挽联”入口。已有挽联数据保留，中文模式仍按原有显示开关展示。

西式香炉固定在与中式相同的中央槽位，蜡烛分布在两侧，左右烛列分别横向滚动；增减蜡烛或滚动不会改变香炉和香的位置。

主题 1 的背景、桌子和选择页预览按语言区分四套视觉素材：简中/繁中为中式，英文为西式，日语为日式，韩语为韩式。视觉风格由 `getMemorialThemeVariant` 选择；日语/韩语继续使用海外点烛规则与挽联隐藏规则。

主题 1 四套素材统一按 393×852 手机构图重绘，位于 `src/modules/space/components/sacrifice/images/generated/mobile-theme1/`。背景采用窄竖屏画布，地域建筑元素放在照片两侧的可见区域；桌子共用双层位置和透视，独立透明底叠加。生成提示词与素材尺寸记录见该目录的 `README.md`。

iOS 已声明五种语言，并加入 `InfoPlist.strings` 的应用名称和相机/相册权限说明。原生系统菜单和权限提示跟随 iOS 的 App 语言设置；应用内的语言选择作用于网页界面。iOS 打包前按既有流程运行 `npm run ios:sync` 同步网页资源。

复核还覆盖独立的 `intro.html`、`bd.html` 页面，二者与主应用共用 `src/i18n/locale.js` 的语言匹配规则和词表。`build/i18n-assets.js` 同时用于开发、生产构建，保证独立页面及其语言资源被打包。`systemText` 过滤器仅用于服务端生成的祭拜、到访、充值记录，按已知系统模板转换显示，不用于用户留言或文章。核验脚本额外检查原始中文标签、真实组件在五种语言下的渲染、独立页面标签覆盖和异步请求竞态。
