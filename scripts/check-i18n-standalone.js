module.exports = function (catalogs) {
  const assert = require('assert')
  const fs = require('fs')
  const path = require('path')
  const vm = require('vm')
  const htmlparser = require('htmlparser2')
  const root = path.resolve(__dirname, '..')
  let labels = 0
  for (const file of ['intro.html', 'bd.html', 'login.html']) {
    const html = fs.readFileSync(path.join(root, 'src', file), 'utf8')
    function walk(nodes, marked) {
      for (const node of nodes) {
        if (node.type === 'script' || node.type === 'style' || node.name === 'title') continue
        const attrs = node.attribs || {}
        for (const attr of ['data-i18n', 'data-i18n-alt', 'data-i18n-title']) {
          if (attrs[attr]) {
            assert(Object.prototype.hasOwnProperty.call(catalogs[0], attrs[attr]), 'Missing standalone key: ' + attrs[attr])
            labels++
          }
        }
        if (node.type === 'text' && /[\u3400-\u9fff]/.test(node.data)) assert(marked, 'Untranslated standalone text in ' + file + ': ' + node.data)
        if (node.children) walk(node.children, marked || !!attrs['data-i18n'])
      }
    }
    walk(htmlparser.parseDOM(html), false)
    assert(html.includes('bian-mobile/i18n/locale.js') && html.includes('bian-mobile/i18n/standalone.js'))
  }
  for (const asset of require('../build/i18n-assets')) assert(fs.existsSync(asset.from), 'Missing standalone build asset: ' + asset.from)

  // Execute the real standalone scripts against a minimal DOM and controllable XHR.
  const nodes = []
  class Node {
    constructor(tag) { this.tag = tag; this.attrs = {}; this.children = []; this.listeners = {}; this.textContent = ''; nodes.push(this) }
    getAttribute(key) { return this.attrs[key] }
    setAttribute(key, value) { this.attrs[key] = value }
    appendChild(node) { this.children.push(node) }
    addEventListener(type, callback) { this.listeners[type] = callback }
  }
  const body = new Node('body'); body.setAttribute('data-i18n-title', '商务合作')
  const element = new Node('html')
  const label = new Node('p'); label.setAttribute('data-i18n', '长按二维码图片添加微信')
  const control = new Node('div'); control.setAttribute('data-language-selector', '')
  const pending = []
  const memory = { bian_language: 'en' }
  const events = {}
  const window = {
    navigator: { languages: ['ja-JP'] },
    localStorage: { getItem: key => memory[key], setItem: (key, value) => { memory[key] = value } },
    addEventListener: (name, callback) => { events[name] = callback },
    XMLHttpRequest: class {
      open(method, url) { this.url = url }
      send() { pending.push(this) }
    }
  }
  const document = {
    readyState: 'complete', body, documentElement: element,
    createElement: tag => new Node(tag),
    querySelectorAll: selector => nodes.filter(node => Object.prototype.hasOwnProperty.call(node.attrs, selector.slice(1, -1)))
  }
  const context = vm.createContext({ window, document })
  for (const file of ['locale.js', 'standalone.js']) vm.runInContext(fs.readFileSync(path.join(root, 'src/i18n', file), 'utf8'), context)
  function respond(request, locale) { request.status = 200; request.responseText = JSON.stringify(catalogs[['zh-CN', 'zh-TW', 'ja', 'en', 'ko'].indexOf(locale)]); request.onload() }
  const select = control.children[0].children[1]
  assert.strictEqual(element.lang, 'en', 'Standalone page ignored saved preference')
  respond(pending.shift(), 'en')
  assert.strictEqual(document.title, 'Partnerships')
  assert.strictEqual(label.textContent, catalogs[3]['长按二维码图片添加微信'])
  select.value = 'ko'; select.listeners.change()
  const koreanRequest = pending.shift()
  select.value = 'ja'; select.listeners.change()
  const japaneseRequest = pending.shift()
  respond(koreanRequest, 'ko')
  assert.strictEqual(element.lang, 'ja', 'Stale translation request changed active language')
  respond(japaneseRequest, 'ja')
  assert.strictEqual(label.textContent, catalogs[2]['长按二维码图片添加微信'])
  assert.strictEqual(memory.bian_language, 'ja', 'Standalone language preference not saved')
  events.storage({ key: 'bian_language', newValue: 'zh-TW' })
  respond(pending.shift(), 'zh-TW')
  assert.strictEqual(label.textContent, catalogs[1]['长按二维码图片添加微信'])
  events.storage({ key: 'bian_language', newValue: 'zh-CN' })
  assert.strictEqual(document.title, '商务合作')
  return labels
}
