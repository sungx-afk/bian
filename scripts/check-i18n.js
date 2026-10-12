/* Run without a browser or backend: npm run check:i18n */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const babel = require('babel-core')
const Module = require('module')
const compiler = require('vue-template-compiler')
const parser = require('babylon')
const traverse = require('babel-traverse').default
const root = path.resolve(__dirname, '..')
const locales = ['zh-CN', 'zh-TW', 'ja', 'en', 'ko']
const catalogs = locales.map(locale => require('../src/i18n/locales/' + locale + '.json'))
const placeholderNames = text => (text.match(/\{\w+\}/g) || []).sort()
for (const catalog of catalogs) {
  assert.deepStrictEqual(Object.keys(catalog).sort(), Object.keys(catalogs[0]).sort(), 'Locale keys differ')
  for (const key of Object.keys(catalog)) {
    assert.strictEqual(typeof catalog[key], 'string', 'Invalid translation: ' + key)
    assert.deepStrictEqual(placeholderNames(catalog[key]), placeholderNames(catalogs[0][key]), 'Placeholders differ: ' + key)
  }
}

// Load the real runtime with its module syntax converted for this older project.
function loadSource(relative) {
  const filename = path.resolve(root, relative)
  const source = babel.transform(fs.readFileSync(filename, 'utf8'), {
    babelrc: false, presets: ['env', 'stage-2']
  }).code
  const instance = new Module(filename, module)
  instance.filename = filename
  instance.paths = Module._nodeModulePaths(path.dirname(filename))
  // The runtime uses Vant's real locale adapter; UI components are unnecessary here.
  instance.require = function (id) { return id === 'vant' ? { Locale } : Module.prototype.require.call(this, id) }
  instance._compile(source, filename)
  require.cache[filename] = instance
  return instance.exports
}
require('babel-register')({ babelrc: false, presets: ['env', 'stage-2'], ignore: /node_modules/ })
const Vue = require('vue')
const Locale = require('vant/lib/locale').default
const memory = {}
global.window = {
  localStorage: { getItem: key => memory[key] || null, setItem: (key, value) => { memory[key] = value } },
  addEventListener: () => {}
}
// Vue and the locale adapter are loaded before this limited storage stub exists.
const i18n = loadSource('src/i18n/index.js')
const dates = loadSource('src/i18n/dates.js')
const systemText = loadSource('src/i18n/system-text.js')
i18n.installI18n(Vue)
assert.strictEqual(i18n.normalizeLocale('zh-Hant-HK'), 'zh-TW')
assert.strictEqual(i18n.normalizeLocale('zh_SG'), 'zh-CN')
assert.strictEqual(i18n.normalizeLocale('zh-Hans-HK'), 'zh-CN')
assert.strictEqual(i18n.normalizeLocale('ja-JP'), 'ja')
assert.strictEqual(i18n.normalizeLocale('en-GB'), 'en')
assert.strictEqual(i18n.normalizeLocale('ko-KR'), 'ko')
assert.strictEqual(i18n.normalizeLocale('fr'), null)
assert.strictEqual(i18n.detectLocale({ getItem: () => 'ko' }, ['en-US']), 'ko')
assert.strictEqual(i18n.detectLocale({ getItem: () => 'bad' }, ['fr', 'ja-JP']), 'ja')
assert.strictEqual(i18n.detectLocale({ getItem: () => { throw new Error('Denied') } }, ['zh-HK']), 'zh-TW')
assert.strictEqual(i18n.detectLocale(null, ['fr']), 'zh-CN')
assert.strictEqual(i18n.setLocale('fr'), false)

const rendered = compiler.compileToFunctions('<section><b>{{ $t("设置") }}</b><p>{{ name }}</p><p>{{ draft }}</p><i v-for="action in $localizeActions(actions)">{{ action.name }}</i></section>')
const action = { id: 'cancel', name: '取消', data: { owner: '保存' } }
const vm = new Vue({ data: { name: '保存', draft: '留言', actions: [action] }, render: rendered.render, staticRenderFns: rendered.staticRenderFns })
let changes = 0
vm.$watch(() => vm.$t('语言'), () => { changes++ }, { sync: true })
function textOf(vnode) { return vnode.text || (vnode.children || []).map(textOf).join('') }
for (let index = 0; index < locales.length; index++) {
  const locale = locales[index]
  i18n.setLocale(locale)
  assert.strictEqual(memory[i18n.STORAGE_KEY], locale, 'Preference was not saved')
  assert.strictEqual(Locale.messages().cancel, catalogs[index]['取消'], 'Vant locale did not update')
  const output = textOf(vm._render())
  assert(output.includes(catalogs[index]['设置']), 'Rendered label did not update')
  assert(output.includes(catalogs[index]['取消']), 'Menu did not update')
  assert(output.includes('保存留言'), 'User content changed')
  assert.strictEqual(vm.draft, '留言', 'Draft changed')
  assert.strictEqual(action.name, '取消', 'Action source changed')
  assert.strictEqual(vm.$localizeActions([action])[0].data, action.data, 'Action payload changed')
  assert.strictEqual(i18n.t('未知文案'), '未知文案')
  assert.strictEqual(i18n.t('__proto__'), '__proto__')
  assert.strictEqual(i18n.t('纪念馆名称默认', { name: '保存' }), catalogs[index]['纪念馆名称默认'].replace('{name}', '保存'))
}
assert(changes >= 4, 'Locale changes were not reactive')
i18n.setLocale('en')
assert.strictEqual(dates.formatMemorialDate('2026年10月12日'), '2026-10-12')
assert.strictEqual(dates.formatMemorialDate('2026年闰二月初三'), 'Lunar: 2026 · Leap month 2 · Day 3')
assert.strictEqual(dates.formatMemorialDate('User-provided date'), 'User-provided date')
assert.strictEqual(dates.datePickerOptions().translate('确定'), 'Confirm')
i18n.setLocale('ko')
assert.strictEqual(dates.formatMemorialDate('2026年10月12日'), '2026년 10월 12일')
i18n.setLocale('zh-TW')
assert.strictEqual(dates.formatMemorialDate('2026年闰二月初三'), '2026年閏二月初三')
i18n.setLocale('en')
assert.strictEqual(dates.formatMemorialDate('2026年閏二月初三'), 'Lunar: 2026 · Leap month 2 · Day 3')
assert.strictEqual(systemText.formatSystemText('上次祭拜：昨天'), 'Last tribute: Yesterday')
assert.strictEqual(systemText.formatSystemText('上次祭拜：3分钟前'), 'Last tribute: 3 min ago')
assert.strictEqual(systemText.formatSystemText('保存上香'), '保存 offered incense')
assert.strictEqual(systemText.formatSystemText('新用户注册，系统赠送10云币'), 'New account bonus: 10 coins')
assert.strictEqual(systemText.formatSystemText('User text with 上香 in the middle'), 'User text with 上香 in the middle')

// Validate all templates and literal translation references in real components.
let templateCount = 0
function checkTree(directory) {
  for (const entry of fs.readdirSync(directory)) {
    const filename = path.join(directory, entry)
    if (fs.statSync(filename).isDirectory()) { checkTree(filename); continue }
    if (!filename.endsWith('.vue')) continue
    const parts = compiler.parseComponent(fs.readFileSync(filename, 'utf8'))
    if (parts.template) {
      const compiled = compiler.compile(parts.template.content)
      // Legacy templates contain known non-fatal parser warnings; render functions must compile.
      for (const source of [compiled.render, ...compiled.staticRenderFns]) new Function(source)
      templateCount++
      const seen = new Set()
      function auditNode(node) {
        if (!node || seen.has(node)) return
        seen.add(node)
        if (node.type === 1) {
          for (const attr of node.attrsList) {
            if (!/^[:@]|^v-/.test(attr.name)) assert(!/[\u3400-\u9fff]/.test(attr.value), 'Raw UI attribute in ' + filename + ': ' + attr.value)
          }
          node.children.forEach(auditNode)
          ;(node.ifConditions || []).forEach(condition => auditNode(condition.block))
          Object.values(node.scopedSlots || {}).forEach(auditNode)
        } else if (node.type === 2) {
          for (const token of node.tokens || []) if (typeof token === 'string') assert(!/[\u3400-\u9fff]/.test(token), 'Raw UI text in ' + filename + ': ' + token)
        } else if (node.type === 3 && !node.isComment) assert(!/[\u3400-\u9fff]/.test(node.text), 'Raw UI text in ' + filename + ': ' + node.text)
      }
      auditNode(compiled.ast)
      for (const match of parts.template.content.matchAll(/\$t\('((?:\\.|[^'])*)'/g)) {
        const key = parser.parseExpression("'" + match[1] + "'").value
        assert(Object.prototype.hasOwnProperty.call(catalogs[0], key), 'Missing template key: ' + key + ' in ' + filename)
      }
    }
    if (parts.script) {
      const ast = parser.parse(parts.script.content, { sourceType: 'module', plugins: ['dynamicImport', 'objectRestSpread'] })
      traverse(ast, { CallExpression(p) {
        if (p.node.callee.name !== 't') return
        const arg = p.node.arguments[0]
        if (arg && arg.type === 'StringLiteral') assert(Object.prototype.hasOwnProperty.call(catalogs[0], arg.value), 'Missing script key: ' + arg.value)
      } })
    }
  }
}
checkTree(path.join(root, 'src/modules'))
console.log('Passed: ' + locales.length + ' locales, ' + Object.keys(catalogs[0]).length + ' keys, ' + templateCount + ' templates; language detection, storage, reactivity, Vant, dates and user-content preservation.')
vm.$destroy()
const renders = require('./check-i18n-components')({ Vue, i18n, dates, systemText })
console.log('Passed: ' + renders + ' real component renders with dates, action logs, account settings and theme names.')

const standaloneLabels = require('./check-i18n-standalone')(catalogs)
console.log('Passed: ' + standaloneLabels + ' standalone labels; shared preference, asynchronous loading and stale-request handling.')
require('./check-i18n-webpack')().then(() => {
  console.log('Passed: actual webpack/Babel named imports and shared locale runtime.')
}).catch(error => {
  console.error(error)
  process.exitCode = 1
})
