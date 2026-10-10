/**
 * 把 App 内自写的 Capacitor 插件类名补进 ios/App/App/capacitor.config.json
 * ------------------------------------------------------------------
 * Capacitor iOS 桥（CapacitorBridge.registerPlugins）只会注册
 * capacitor.config.json 里 packageClassList 中列出的类；
 * 而这个文件是 `cap sync ios` 根据 npm 依赖里的插件**重新生成**的 ——
 * 放在 ios/App/App/ 下的自写插件（BianProductPrice）不在依赖里，会被漏掉，
 * 表现为 JS 侧调用报：
 *   `"BianProductPrice" plugin is not implemented on ios`
 * 所以每次 `cap sync ios` 之后都要跑一次本脚本（CI 已接入）。
 *
 * 用法：cd ios-app && node ci/register-custom-plugins.js
 */
const fs = require('fs')
const path = require('path')

/** App 内自写的原生插件类名（与 Swift 里 @objc(...) / CAP_PLUGIN 的第一个参数一致） */
const CUSTOM_PLUGINS = ['BianProductPrice']

const configPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'capacitor.config.json')

if (!fs.existsSync(configPath)) {
  console.error('[cap] 找不到 ' + configPath + '，请先执行 cap sync ios')
  process.exit(1)
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const list = Array.isArray(config.packageClassList) ? config.packageClassList : []

let added = 0
CUSTOM_PLUGINS.forEach(name => {
  if (list.indexOf(name) < 0) {
    list.push(name)
    added++
  }
})
config.packageClassList = list

fs.writeFileSync(configPath, JSON.stringify(config, null, '\t') + '\n')
console.log('[cap] packageClassList 已补入自定义插件（新增 ' + added + ' 个）: ' + CUSTOM_PLUGINS.join(', '))
