// Render real component scripts/templates with fixtures, without hooks or network calls.
module.exports = function ({ Vue, i18n, dates, systemText }) {
  const assert = require('assert')
  const fs = require('fs')
  const path = require('path')
  const Module = require('module')
  const babel = require('babel-core')
  const compiler = require('vue-template-compiler')
  const root = path.resolve(__dirname, '..')
  const user = { id: 42, name: 'Alexander', vip: 0, point: 100, avatarUrl: '' }
  const departed = { id: 7, name: 'Robin', birthday: new Date(1950, 0, 2).getTime(), dieDay: new Date(2026, 9, 1).getTime(), birthdayStr: '', dieDayStr: '', avatarUrl: '', summary: '' }
  const space = { id: 1, name: 'Robin Memorial', type: 0, creatorId: 42, creator: user, currentUser: user, createDate: new Date(2026, 9, 12).getTime(), visitedTimes: 8, spaceUsers: [departed], products: [], logs: ['Alexander上香', '上次祭拜：昨天'], config: { friendIds: [], commentScope: 'all' }, epitaph: '', frameId: 1, backgroundId: 1 }
  const getters = { 'userStore/user': user, 'userStore/userSetting': {}, 'userStore/merchant': null, 'spaceStore/spaceDetail': space, 'spaceStore/detailShowTab': 'info' }
  const store = { getters, _modulesNamespaceMap: { 'userStore/': {}, 'spaceStore/': {} }, dispatch: () => Promise.resolve() }
  const stub = { functional: true, render: (h, ctx) => h('span', { attrs: { ...ctx.data.attrs, ...ctx.props } }, ctx.children) }
  const timeToDate = (value, pattern) => {
    if (!value) return ''
    const d = new Date(value)
    const pad = n => ('0' + n).slice(-2)
    const parts = { yyyy: d.getFullYear(), MM: pad(d.getMonth() + 1), dd: pad(d.getDate()), HH: pad(d.getHours()), mm: pad(d.getMinutes()) }
    return pattern.replace(/yyyy|MM|dd|HH|mm/g, token => parts[token])
  }
  Vue.filter('timesToDate', (value, pattern) => timeToDate(value, i18n.t(pattern || 'yyyy-MM-dd HH:mm')))
  Vue.filter('memorialDate', dates.formatMemorialDate)
  Vue.filter('systemText', systemText.formatSystemText)
  Vue.filter('translate', i18n.t)
  Vue.filter('filterMoney', value => String(value || 0))
  global.config_server = { supportPay: true, supportPoint: true }
  global.getPlat = () => 'h5'
  global.getRequestParam = () => ({ plat: 'h5' })
  global.window.location = { search: '', pathname: '/' }
  global.window.navigator = { userAgent: 'test' }
  const renderErrors = []
  const previousHandler = Vue.config.errorHandler
  Vue.config.errorHandler = err => { renderErrors.push(err) }

  function renderSource(file, overrides = {}) {
    const filename = path.join(root, file)
    const parts = compiler.parseComponent(fs.readFileSync(filename, 'utf8'))
    const instance = new Module(filename, module)
    instance.filename = filename
    instance.paths = Module._nodeModulePaths(path.dirname(filename))
    instance.require = id => {
      if (id === '@/i18n') return i18n
      if (id === '@/i18n/dates') return dates
      if (id === 'vue' || id === 'vuex' || id === 'qs') return require(id)
      if (id === 'vant') return new Proxy({}, { get: () => ({ install() {} }) })
      if (id === '@/config/utils') return { timesToDate: timeToDate, isIphone: () => false, accAdd: (a, b) => a + b, accMul: (a, b) => a * b }
      if (id === '@/config/constant') return {}
      if (id === '@/config/frame') return { getFrame: () => ({ slice: [80, 120, 90, 110] }), getFrameImage: () => '', getFrameCombineImage: () => '' }
      if (id.indexOf('@/native/') === 0) return { isNative: () => false, isNativeIOS: () => false }
      if (/\.(webp|png|jpg|jpeg|svg)$/.test(id)) return '/fixture-image'
      return stub
    }
    instance._compile(babel.transform(parts.script.content, { babelrc: false, presets: ['env', 'stage-2'] }).code, filename)
    const options = instance.exports.default
    for (const hook of ['beforeCreate', 'created', 'beforeMount', 'mounted', 'activated', 'deactivated', 'beforeDestroy', 'destroyed']) delete options[hook]
    delete options.watch
    options.beforeCreate = function () { this.$store = store; this.$route = { query: {} }; this.$router = {} }
    const originalData = options.data
    const fixtureData = {}
    const fixtureProps = { space, user: departed }
    for (const key of Object.keys(overrides)) {
      if (options.props && (Array.isArray(options.props) ? options.props.indexOf(key) !== -1 : options.props[key])) fixtureProps[key] = overrides[key]
      else fixtureData[key] = overrides[key]
    }
    options.data = function () { return { ...(originalData ? originalData.call(this) : {}), ...fixtureData } }
    Object.assign(options, compiler.compileToFunctions(parts.template.content))
    const vm = new Vue({ ...options, propsData: fixtureProps })
    const output = vm._render()
    vm.$destroy()
    return output
  }
  function visibleText(vnode) {
    if (!vnode || vnode.isComment) return ''
    let text = vnode.text || ''
    const attrs = vnode.data && vnode.data.attrs || {}
    for (const prop of ['title', 'label', 'placeholder', 'value', 'aria-label', 'alt']) {
      if (typeof attrs[prop] === 'string') text += ' ' + attrs[prop]
    }
    for (const action of attrs.actions || []) text += ' ' + action.name
    const children = vnode.children || (vnode.componentOptions && vnode.componentOptions.children) || []
    return text + children.map(visibleText).join('')
  }
  const cases = [
    ['src/modules/space/components/detail/Info.vue', {}, 'Born:'],
    ['src/modules/space/components/userinfo/Summary.vue', {}, 'Born:'],
    ['src/modules/space/components/SpaceCreate.vue', { theme: { name: '春谷' } }, 'Create memorial'],
    ['src/modules/home/components/UserCenter.vue', {}, 'Account settings'],
    ['src/modules/space/components/sacrifice/Index.vue', { space }, 'offered incense'],
    ['src/modules/space/components/manage/Event.vue', { list: [{ id: 1, creator: user, content: 'Alexander上香', hasHeader: true, date: '2026年10月12日', time: '12:00' }] }, 'offered incense'],
    ['src/modules/space/components/userinfo/UserInfo.vue', { user: { ...departed, calType: 1 } }, 'Lunar:'],
    ['src/modules/widget/select-date/main.vue', { show: true }, 'Date of birth:'],
    ['src/modules/mortuary/components/order/OrderItem.vue', { item: { id: 1, creatorId: 42, createDate: space.createDate, status: 'CREATED', senderName: 'Alexander', spaceName: 'Robin Memorial', spaceUserName: 'Robin', summary: 'In memory', products: [{ id: 1, name: 'Flowers', num: 2, price: 10 }] } }, 'Items: 2'],
    ['src/modules/space/components/store/Logs.vue', { list: [{ id: 1, createDate: space.createDate, type: 'RECHARGE', summary: '新用户注册，系统赠送10云币', change: 10 }] }, 'New account bonus']
  ]
  let renders = 0
  for (const locale of ['zh-CN', 'zh-TW', 'ja', 'en', 'ko']) {
    i18n.setLocale(locale)
    for (const [file, overrides, expected] of cases) {
      const output = visibleText(renderSource(file, overrides))
      assert(!renderErrors.length, 'Component render error in ' + file + ': ' + renderErrors.map(error => error.stack).join('\n'))
      assert(output.trim(), 'Empty component render: ' + file)
      if (locale === 'en') {
        assert(output.includes(expected), 'Missing visible label in ' + file + ': ' + expected)
        assert(!/[\u3400-\u9fff]/.test(output), 'Untranslated interface text in ' + file + ': ' + output)
      }
      renders++
    }
  }
  Vue.config.errorHandler = previousHandler
  assert.deepStrictEqual(renderErrors, [], 'Real component rendering failed')
  assert.strictEqual(user.name, 'Alexander')
  assert.strictEqual(space.logs[0], 'Alexander上香', 'Stored log mutated')
  assert.strictEqual(departed.birthdayStr, '', 'Stored date mutated')
  return renders
}
