// Canvas2D port of the memorial incense ribbon used in the memery Pixi scene.
// Keep only the smoke: the parallel incense sticks are supplied by the page asset.
const STREAMS = [
  { x: 15, speed: 0.72, width: 2.5, densityPhase: 0.2 },
  { x: 21, speed: 0.76, width: 3.3, densityPhase: 1.5 },
  { x: 27, speed: 0.74, width: 2.7, densityPhase: 2.7 }
]

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export default class IncenseSmoke {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas && canvas.getContext('2d')
    this.width = 42
    this.height = 112
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.time = 0
    this.frame = 0
    this.lastTime = 0
    this.raf = 0
    this.trails = STREAMS.map(() => [])
    this.running = false

    if (!this.ctx) return
    canvas.width = Math.round(this.width * this.dpr)
    canvas.height = Math.round(this.height * this.dpr)
    canvas.style.width = this.width + 'px'
    canvas.style.height = this.height + 'px'
    this.ctx.scale(this.dpr, this.dpr)
    this.loop = this.loop.bind(this)
    this.start()
  }

  start() {
    if (this.running || !this.ctx) return
    this.running = true
    this.lastTime = 0
    this.raf = window.requestAnimationFrame(this.loop)
  }

  loop(now) {
    if (!this.running || !this.ctx) return
    const delta = this.lastTime ? clamp((now - this.lastTime) / 16.667, 0.5, 2.5) : 1
    this.lastTime = now
    this.time += 0.0167 * delta
    this.frame += 1
    this.update(delta)
    this.draw()
    this.raf = window.requestAnimationFrame(this.loop)
  }

  update(delta) {
    if (this.frame % 2 === 0) {
      STREAMS.forEach((stream, index) => {
        this.trails[index].unshift({
          x: stream.x,
          y: this.height - 1,
          vx: 0,
          vy: -stream.speed,
          age: 0,
          maxAge: 148 + (index === 1 ? 12 : 0),
          width: 0.55,
          widthFactor: 0.88 + Math.random() * 0.24,
          densityFactor: 0.68 + Math.random() * 0.52,
          phase: Math.random() * Math.PI * 2,
          alpha: 0
        })
      })
    }

    this.trails.forEach((trail, index) => {
      const stream = STREAMS[index]
      for (let i = trail.length - 1; i >= 0; i--) {
        const node = trail[i]
        node.age += delta
        if (node.age >= node.maxAge || node.y < 0) {
          trail.splice(i, 1)
          continue
        }

        node.y += node.vy * delta
        // 烟柱按香头的固定 X 轴垂直上升，不加横向摆动或 S 弯。
        node.x = stream.x

        const life = node.age / node.maxAge
        if (life < 0.2) {
          const t = life / 0.2
          node.width = (1.0 + t * (stream.width - 1.0)) * node.widthFactor
          node.alpha = 0.32 + t * 0.4
        } else if (life < 0.72) {
          node.width = stream.width * node.widthFactor * (0.82 + 0.08 * Math.sin(life * 11 + stream.densityPhase))
          node.alpha = 0.68 - ((life - 0.2) / 0.52) * 0.14
        } else {
          const t = (life - 0.72) / 0.28
          node.width = Math.max(0.18, stream.width * Math.pow(1 - t, 0.5))
          node.alpha = 0.62 * Math.pow(1 - t, 1.25)
        }
        // 每个烟粒有轻微的浓淡差异，并在上升中缓慢呼吸，避免烟柱看起来像固定透明贴图。
        node.alpha *= node.densityFactor * (0.9 + 0.1 * Math.sin(this.time * 2.4 + node.phase))
      }
    })
  }

  draw() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    this.trails.forEach((trail, streamIndex) => {
      if (trail.length < 3) return
      const left = []
      const right = []
      trail.forEach((node) => {
        const half = node.width * 0.45
        left.push({ x: node.x - half, y: node.y })
        right.push({ x: node.x + half, y: node.y })
      })

      ctx.beginPath()
      ctx.moveTo(left[0].x, left[0].y)
      for (let i = 0; i < left.length - 1; i++) {
        const x = (left[i].x + left[i + 1].x) / 2
        const y = (left[i].y + left[i + 1].y) / 2
        ctx.quadraticCurveTo(left[i].x, left[i].y, x, y)
      }
      const tip = trail[trail.length - 1]
      ctx.lineTo(tip.x, tip.y - 0.5)
      ctx.lineTo(right[right.length - 1].x, right[right.length - 1].y)
      for (let i = right.length - 1; i > 0; i--) {
        const x = (right[i].x + right[i - 1].x) / 2
        const y = (right[i].y + right[i - 1].y) / 2
        ctx.quadraticCurveTo(right[i].x, right[i].y, x, y)
      }
      ctx.closePath()

      const bottomY = trail[0].y
      const topY = tip.y
      const density = 0.9 + Math.sin(this.time * 1.3 + STREAMS[streamIndex].densityPhase) * 0.1
      const alphaAt = (progress, weight) => {
        const node = trail[Math.min(trail.length - 1, Math.round(progress * (trail.length - 1)))]
        return clamp(node.alpha * density * weight, 0, 0.48)
      }
      const gradient = ctx.createLinearGradient(0, bottomY, 0, topY)
      gradient.addColorStop(0, `rgba(247, 243, 234, ${alphaAt(0, 0.2)})`)
      gradient.addColorStop(0.12, `rgba(247, 243, 234, ${alphaAt(0.12, 0.78)})`)
      gradient.addColorStop(0.34, `rgba(242, 239, 231, ${alphaAt(0.34, 0.82)})`)
      gradient.addColorStop(0.52, `rgba(247, 243, 234, ${alphaAt(0.52, 0.62)})`)
      gradient.addColorStop(0.67, `rgba(242, 239, 231, ${alphaAt(0.67, 0.7)})`)
      gradient.addColorStop(0.86, `rgba(230, 225, 216, ${alphaAt(0.86, 0.36)})`)
      gradient.addColorStop(1, 'rgba(220, 215, 206, 0)')
      ctx.fillStyle = gradient
      ctx.shadowColor = 'rgba(238, 235, 228, 0.2)'
      ctx.shadowBlur = 3
      ctx.fill()
      ctx.shadowBlur = 0

      // Fine highlight down the center gives the ribbon the same airy, hand-drawn feel.
      ctx.beginPath()
      ctx.moveTo(trail[0].x, trail[0].y)
      const limit = Math.max(3, Math.floor(trail.length * 0.78))
      for (let i = 0; i < limit - 1; i++) {
        const x = (trail[i].x + trail[i + 1].x) / 2
        const y = (trail[i].y + trail[i + 1].y) / 2
        ctx.quadraticCurveTo(trail[i].x, trail[i].y, x, y)
      }
      const core = ctx.createLinearGradient(0, bottomY, 0, topY)
      core.addColorStop(0, 'rgba(255, 255, 255, 0)')
      core.addColorStop(0.18, `rgba(255, 252, 245, ${0.19 * density})`)
      core.addColorStop(0.52, `rgba(255, 252, 245, ${0.11 * density})`)
      core.addColorStop(0.82, 'rgba(255, 252, 245, 0)')
      ctx.strokeStyle = core
      ctx.lineWidth = 0.35
      ctx.stroke()
    })
  }

  destroy() {
    this.running = false
    if (this.raf) window.cancelAnimationFrame(this.raf)
    this.raf = 0
    this.trails = [[], [], []]
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height)
    this.canvas = null
    this.ctx = null
  }
}
