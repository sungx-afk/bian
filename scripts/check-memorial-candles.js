// Exercise real purchase/render methods against isolated API records; no live purchases.
module.exports = function ({ renderSource, i18n }) {
  const assert = require('assert')
  const fs = require('fs')
  const path = require('path')
  const Module = require('module')
  const babel = require('babel-core')
  const file = 'src/modules/space/components/sacrifice/Index.vue'
  const previousAPI = global.$API
  const previousAxios = global.$axios
  const previousLocale = i18n.state.locale
  const base = { id: 1, name: 'Memorial', type: 2, creatorId: 42, products: [], logs: [], spaceUsers: [{ id: 7 }], config: { friendIds: [] } }
  let records = [], pendingDetails = [], purchases = [], fail = false, hold = false, pendingBuy
  const flames = new Map()
  const layer = {
    addFlame(el, clipEl) { const flame = { el, clipEl }; flames.set(el.id, flame); return flame },
    removeFlame(flame) { flames.delete(flame.el.id) },
    updatePositions() {}
  }
  const response = () => ({ ...base, products: records.filter(record => !record.expired).map(() => 'item-la-zu') })
  global.$API = { space: {
    buy(params, callback) {
      purchases.push(params)
      const finish = () => {
        if (fail) return callback({ error: 'Purchase failed' })
        if (params.memorialStyle === 'western' || !records.length) records.push({ expired: false })
        else records[0].expired = false
        callback({})
      }
      if (hold) pendingBuy = finish
      else finish()
    },
    getSpaceDetail(params, callback) {
      const snapshot = response()
      pendingDetails.push(() => callback(snapshot))
    }
  } }
  function mount(locale, inspect) {
    i18n.setLocale(locale)
    flames.clear()
    renderSource(file, { space: response(), bgmInited: true }, vm => {
      const nodes = {}
      const trays = [{ id: 'left-tray' }, { id: 'right-tray' }]
      vm.$nextTick = callback => callback()
      vm.$el = { querySelectorAll() {
        const ids = vm.memorialStyle === 'western'
          ? Array.from({ length: vm.westernCandleCount }, (_, i) => 'western-candle-' + (i + 1))
          : ['zu-huo-1', 'zu-huo-2']
        return ids.map(id => nodes[id] || (nodes[id] = { id, closest: () => trays[Number(id.split('-').pop()) % 2 === 1 ? 0 : 1] }))
      } }
      vm.$toast = () => {}
      vm.checkCanIn = () => 0
      vm.rememberLastSpace = () => {}
      inspect(vm, trays)
    }, { './flameLayer': layer })
  }
  function renderedCandles(vm) {
    function count(node) {
      if (!node) return 0
      const own = node.data && /\bitem-la-zu\b/.test(node.data.staticClass || '') ? 1 : 0
      return own + (node.children || []).reduce((sum, child) => sum + count(child), 0)
    }
    return count(vm._render())
  }
  try {
    for (const locale of ['en', 'ja', 'ko']) {
      records = []; pendingDetails = []; purchases = []
      mount(locale, (vm, trays) => {
        assert.strictEqual(renderedCandles(vm), 1, 'One unlit candle before the first action')
        vm.showLaZuHuo()
        assert.strictEqual(flames.size, 0)
        vm.doDianlazu()
        assert.strictEqual(vm.westernCandleCount, 1)
        vm.doDianlazu()
        assert.strictEqual(vm.westernCandleCount, 2)
        pendingDetails[0]() // Older snapshot must not erase the second candle.
        assert.strictEqual(vm.westernCandleCount, 2)
        pendingDetails[1]()
        assert.strictEqual(renderedCandles(vm), 2)
        assert.strictEqual(flames.size, 2)
        assert(purchases.every(purchase => purchase.memorialStyle === 'western'))
        assert.strictEqual(flames.get('western-candle-1').clipEl, trays[0])
        assert.strictEqual(flames.get('western-candle-2').clipEl, trays[1])
        vm.showLaZuHuo()
        assert.strictEqual(flames.size, 2, 'Repeated refresh must not duplicate flames')
        fail = true; vm.doDianlazu(); fail = false
        assert.strictEqual(vm.westernCandleCount, 2, 'Failed purchases must not add a candle')
        hold = true; const requestsBefore = purchases.length
        vm.doDianlazu(); vm.doDianlazu()
        assert.strictEqual(purchases.length, requestsBefore + 1, 'In-flight taps must not double-purchase')
        pendingBuy(); hold = false
        assert.strictEqual(vm.westernCandleCount, 3)
        for (let i = 0; i < 17; i++) vm.doDianlazu()
        pendingDetails[pendingDetails.length - 1]()
        assert.strictEqual(renderedCandles(vm), 20, 'Multiple candles must not be capped at a pair')
        assert.strictEqual(flames.size, 20)
        i18n.setLocale('zh-CN'); vm.showLaZuHuo()
        assert.strictEqual(renderedCandles(vm), 2)
        assert.deepStrictEqual([...flames.keys()], ['zu-huo-1', 'zu-huo-2'])
        i18n.setLocale(locale); vm.showLaZuHuo()
        assert.strictEqual(flames.size, 20, 'Changing language must restore the active candles')
      })
      mount(locale, vm => {
        vm.getSpaceDetail(); pendingDetails[pendingDetails.length - 1]()
        assert.strictEqual(renderedCandles(vm), 20, 'Reload restores active records')
        records.forEach(record => { record.expired = true })
        vm.getSpaceDetail(); pendingDetails[pendingDetails.length - 1]()
        assert.strictEqual(renderedCandles(vm), 1)
        assert.strictEqual(flames.size, 0, 'Expired records remove their flames')
      })
    }
    for (const locale of ['zh-CN', 'zh-TW']) {
      records = []; pendingDetails = []; purchases = []
      mount(locale, vm => {
        assert.strictEqual(renderedCandles(vm), 2)
        vm.doDianlazu(); pendingDetails[pendingDetails.length - 1]()
        vm.doDianlazu(); pendingDetails[pendingDetails.length - 1]()
        assert.strictEqual(records.length, 1, 'Chinese mode keeps renewal semantics')
        assert.strictEqual(renderedCandles(vm), 2)
        assert.strictEqual(flames.size, 2)
        assert(purchases.every(purchase => purchase.memorialStyle === 'chinese'))
      })
    }
    const filename = path.resolve(__dirname, '../src/modules/space/components/sacrifice/flameLayer.js')
    const moduleInstance = new Module(filename, module)
    moduleInstance.filename = filename
    moduleInstance.paths = Module._nodeModulePaths(path.dirname(filename))
    moduleInstance._compile(babel.transform(fs.readFileSync(filename, 'utf8'), { babelrc: false, presets: ['env', 'stage-2'] }).code, filename)
    const realLayer = moduleInstance.exports.default
    const sprite = { position: { set() {} } }
    let rect = { left: 20, right: 24, top: 5, bottom: 9, width: 4, height: 4 }
    realLayer.app = {}
    realLayer.flames = [{ sprite, el: { isConnected: true, getBoundingClientRect: () => rect }, clipEl: { getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 14 }) } }]
    realLayer.updatePositions(); assert.strictEqual(sprite.visible, true)
    rect = { ...rect, left: 108, right: 112 }
    realLayer.updatePositions(); assert.strictEqual(sprite.visible, false, 'Scrolled-out flames stay clipped')
    realLayer.app = null; realLayer.flames = []
    const apiFilename = path.resolve(__dirname, '../src/modules/space/api/modules/space.js')
    const apiModule = new Module(apiFilename, module)
    apiModule.filename = apiFilename
    apiModule.paths = Module._nodeModulePaths(path.dirname(apiFilename))
    apiModule._compile(babel.transform(fs.readFileSync(apiFilename, 'utf8'), { babelrc: false, presets: ['env', 'stage-2'] }).code, apiFilename)
    let sent
    global.$axios = { post(url, body) { sent = { url, body: JSON.parse(body) }; return Promise.resolve({ data: {} }) } }
    apiModule.exports.default.buy({ spaceId: 1, productId: 'item-la-zu', memorialStyle: 'western' })
    assert.deepStrictEqual(sent, { url: '/buy', body: { spaceId: 1, productId: 'item-la-zu', memorialStyle: 'western' } })
    apiModule.exports.default.buy({ spaceId: 1, productId: 'item-xiang' })
    assert.deepStrictEqual(sent.body, { spaceId: 1, productId: 'item-xiang' }, 'Other purchases keep their existing payload')
    console.log('Passed: candle purchases in 5 languages; repeated taps, failures, refresh, expiry, language changes and flame clipping.')
  } finally {
    global.$API = previousAPI
    global.$axios = previousAxios
    i18n.setLocale(previousLocale)
  }
}
