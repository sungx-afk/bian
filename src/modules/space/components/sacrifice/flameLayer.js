// 祭拜页火苗统一渲染层（DOM + 预渲染 GIF 版）
// ------------------------------------------------------------------
// 历史：
//   v1 每支烛火一个 PIXI.Application —— 每个 WebGL 上下文 + 独立 ticker，
//      蜡烛一多超出浏览器上下文上限，后面的火苗渲染不出来；
//   v2 合并成单一 PIXI Canvas —— 上下文问题解决了，但 iPad 真机上
//      FlameFilter 着色器应用失败，白色贴图直接画成白方块（Mac 上正常）；
//   v3 现在：预渲染火苗 GIF + DOM 定位。
//      不依赖 WebGL/GPU，所有设备表现完全一致；不再占用 WebGL 上下文，
//      也不再每帧跑 shader，性能问题一并消失。
//
// 对外接口保持不变（addFlame / removeFlame / destroy），
// ChangeMingDeng.vue 与 Index.vue 无需感知实现变化。

const FLAME_GIF = require('./images/flame.gif')
// 位置同步：滚动/resize 实时 + 低频轮询兜底（锚点可能因图片加载等被动变化）
const SYNC_INTERVAL = 400

class FlameLayer {
  constructor() {
    this.layer = null
    this.flames = []
    this.timer = null
    this.onReposition = () => this.updatePositions()
  }

  ensureLayer() {
    if (this.layer) return
    const layer = document.createElement('div')
    // 全屏透明层：只负责画火苗，不能挡住下面的按钮（pointer-events:none）
    layer.style.cssText = [
      'position:fixed', 'left:0', 'top:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:5', 'overflow:hidden'
    ].join(';')
    document.body.appendChild(layer)
    this.layer = layer

    window.addEventListener('resize', this.onReposition)
    window.addEventListener('scroll', this.onReposition, true)
    this.timer = setInterval(() => this.updatePositions(), SYNC_INTERVAL)
  }

  addFlame(el) {
    if (!el) return null
    this.ensureLayer()

    const img = document.createElement('img')
    img.src = FLAME_GIF
    img.alt = ''
    img.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;'
    this.layer.appendChild(img)

    const flame = { el: el, img: img }
    this.flames.push(flame)

    // 等 DOM 插入后下一帧再定位
    const raf = window.requestAnimationFrame || function (fn) { setTimeout(fn, 16) }
    raf(() => this.updatePositions())
    return flame
  }

  removeFlame(flame) {
    if (!flame) return
    const index = this.flames.indexOf(flame)
    if (index > -1) this.flames.splice(index, 1)
    if (flame.img && flame.img.parentNode) {
      flame.img.parentNode.removeChild(flame.img)
    }
    flame.img = null
    flame.el = null
  }

  updatePositions() {
    if (!this.layer) return
    for (let i = 0; i < this.flames.length; i++) {
      const flame = this.flames[i]
      const el = flame.el
      if (!el || !el.isConnected) {
        flame.img.style.display = 'none'
        continue
      }
      const rect = el.getBoundingClientRect()
      // 锚点被隐藏 / 未布局时不显示
      if (!rect.width || !rect.height) {
        flame.img.style.display = 'none'
        continue
      }
      flame.img.style.display = 'block'
      flame.img.style.left = rect.left + 'px'
      flame.img.style.top = rect.top + 'px'
      flame.img.style.width = rect.width + 'px'
      flame.img.style.height = rect.height + 'px'
    }
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    window.removeEventListener('resize', this.onReposition)
    window.removeEventListener('scroll', this.onReposition, true)
    if (this.layer && this.layer.parentNode) {
      this.layer.parentNode.removeChild(this.layer)
    }
    this.layer = null
    this.flames = []
  }
}

export default new FlameLayer()
