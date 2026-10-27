// Particle-based incense smoke, ported from the `xiang-particles` reference editor.
// The look (wispy white→grey columns rising from three parallel sticks) uses the
// exact tuned parameters from xiang-particles-202610261447.json.
//
// The reference simulates in a 1280×2781 "image pixel" space. We keep that space
// verbatim and simply map a small window of it onto this canvas with a transform,
// so the tuned numbers stay byte-for-byte correct.

// ---------------------------------------------------------------------------
// noise.js — Perlin noise + 2D curl noise (pure math, no DOM).
// ---------------------------------------------------------------------------
const Noise = (function () {
  'use strict';
  const perm = new Uint8Array(512);
  (function seed(s) {
    const rnd = () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })(1337);

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  function grad(h, x, y, z) {
    h &= 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function perlin3(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
           lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
           lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w);
  }
  const E = 0.05;
  function curl2(x, y, t) {
    const dy = (perlin3(x, y + E, t) - perlin3(x, y - E, t)) / (2 * E);
    const dx = (perlin3(x + E, y, t) - perlin3(x - E, y, t)) / (2 * E);
    return [dy, -dx];
  }
  return { perlin3, curl2 };
})();

// ---------------------------------------------------------------------------
// particles.js — the particle engine (Emitter + ParticleSystem), no DOM/UI.
// Coordinates are in the reference image-pixel space.
// ---------------------------------------------------------------------------
const Particles = (function () {
  'use strict';
  const { perlin3, curl2 } = Noise;
  const DEG = Math.PI / 180;
  const TAU = Math.PI * 2;
  const SPRITE_STEPS = 32;
  const SPRITE_SIZE = 64;

  const DEFAULTS = {
    name: 'Emitter',
    kind: 'fire',
    style: '',
    enabled: true,
    x: 0, y: 0,
    rate: 100,
    maxParticles: 1000,
    lifeMin: 1, lifeMax: 1,
    shape: 'circle',
    radius: 4,
    angle: -90,
    spread: 20,
    speedMin: 20, speedMax: 40,
    buoyancy: 0,
    drag: 0,
    windX: 0,
    centerPull: 0,
    spiralAmp: 0,
    spiralFreq: 1,
    densityVar: 0,
    densityFreq: 0.5,
    pulse: 0,
    jitter: 0,
    jitterScale: 0.08,
    diffuse: 0,
    strands: 1,
    strandSplit: 0.1,
    turbulence: 0,
    turbScale: 0.02,
    turbSpeed: 0.5,
    turbDelay: 0,
    sway: 0,
    swayFreq: 1,
    flicker: 0,
    sizeStart: 5, sizeEnd: 1,
    sizeJitter: 0.2,
    sizeCurve: 'linear',
    color0: '#ffffff', color1: '#ffd27a', color2: '#ff6a00', color3: '#400800',
    opacity: 1,
    fadeIn: 0.1,
    fadeOut: 0.3,
    render: 'soft',
    blend: 'lighter',
    hardness: 0.3,
    stretch: 0.04,
    blur: 0,
    glow: 0,
    glowRadius: 60,
    glowOffsetY: -30,
    glowColor: '#ff9a30',
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const CURVES = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => 1 - (1 - t) * (1 - t),
    bell: (t) => Math.sin(t * Math.PI),
  };
  function hexToRgb(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  class Emitter {
    constructor(cfg) {
      this.cfg = Object.assign({}, DEFAULTS, cfg);
      this.particles = [];
      this.pool = [];
      this.acc = 0;
      this.serial = 0;
      this.time = 0;
      this.seed = Math.random() * 100;
      this.swayX = 0;
      this.intensity = 1;
      this._spriteKey = '';
      this._sprites = null;
      this._palette = null;
    }

    set(patch) { Object.assign(this.cfg, patch); }
    clear() { this.pool.push(...this.particles); this.particles.length = 0; this.acc = 0; }
    origin() { return [this.cfg.x + this.swayX, this.cfg.y]; }

    update(dt) {
      const c = this.cfg;
      this.time += dt;
      const T = this.time;

      this.swayX = c.sway * perlin3(T * c.swayFreq, 0.5, this.seed);
      this.intensity = Math.max(0.15, 1 + c.flicker * 1.6 * perlin3(T * 7, 3.3, this.seed));

      if (c.enabled) {
        const pulse = c.pulse ? lerp(1, this._density(T, 0), c.pulse) : 1;
        this.acc += c.rate * dt * this.intensity * pulse;
        let n = Math.floor(this.acc);
        this.acc -= n;
        n = Math.min(n, c.maxParticles - this.particles.length);
        for (let i = 0; i < n; i++) this._spawn(n > 1 ? i / n : 0);
      } else {
        this.acc = 0;
      }

      const [ox] = this.origin();
      const ps = this.particles;
      let w = 0;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const h = dt * (1 - p.sub);
        p.sub = 0;
        p.age += h;
        if (p.age >= p.life) { this.pool.push(p); continue; }
        this._integrate(p, h, ox, T);
        ps[w++] = p;
      }
      ps.length = w;
    }

    _spawn(sub) {
      const c = this.cfg;
      const p = this.pool.pop() || {};
      let [x, y] = this.origin();
      const strands = Math.max(1, Math.round(c.strands));
      p.strand = this.serial % strands;
      x += (p.strand - (strands - 1) / 2) * 0.6;
      if (c.shape === 'circle') {
        const r = c.radius * Math.sqrt(Math.random()), a = Math.random() * TAU;
        x += Math.cos(a) * r; y += Math.sin(a) * r;
      } else if (c.shape === 'line') {
        x += (Math.random() * 2 - 1) * c.radius;
      }
      const ang = (c.angle + (Math.random() - 0.5) * c.spread) * DEG;
      const sp = lerp(c.speedMin, c.speedMax, Math.random());
      p.x = x; p.y = y;
      p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp;
      p.age = 0; p.sub = sub;
      p.life = lerp(c.lifeMin, c.lifeMax, Math.random());
      p.seed = Math.random();
      p.phase = this.time * 2.0;
      p.sizeMul = 1 + (Math.random() * 2 - 1) * c.sizeJitter;
      p.side = Math.random() * 2 - 1;
      p.dens = c.densityVar ? this._density(this.time, p.strand) : 1;
      p.id = this.serial++;
      this.particles.push(p);
    }

    _density(t, strand) {
      const c = this.cfg;
      return Math.min(2, Math.max(0, 1 + c.densityVar * 2.5 * perlin3(t * c.densityFreq, strand * 7.3 + 0.5, this.seed)));
    }

    _integrate(p, h, ox, T) {
      const c = this.cfg;
      const t = p.age / ((c.lifeMin + c.lifeMax) * 0.5 || 1);
      let ax = c.windX, ay = -c.buoyancy;

      if (c.turbulence) {
        let k = 1;
        if (c.turbDelay > 0 && t < c.turbDelay) { k = t / c.turbDelay; k *= k; }
        const f = curl2(p.x * c.turbScale, p.y * c.turbScale, T * c.turbSpeed + this.seed + p.strand * c.strandSplit);
        ax += f[0] * c.turbulence * k;
        ay += f[1] * c.turbulence * k;
      }
      let jx = 0, jy = 0;
      if (c.jitter) {
        const k = Math.max(0, 1 - t);
        const f = curl2(p.x * c.jitterScale, p.y * c.jitterScale, T * c.turbSpeed * 4 + this.seed + 40);
        jx = f[0] * c.jitter * k * k;
        jy = f[1] * c.jitter * k * k;
      }
      if (c.diffuse) ax += c.diffuse * p.side * Math.min(1.5, t);
      if (c.centerPull) ax += (ox - p.x) * c.centerPull;
      if (c.spiralAmp) ax += Math.cos(TAU * c.spiralFreq * p.age + p.phase) * c.spiralAmp * (0.3 + Math.min(1, t));

      p.vx += ax * h;
      p.vy += ay * h;
      if (c.drag) { const d = Math.exp(-c.drag * h); p.vx *= d; p.vy *= d; }
      p.x += (p.vx + jx) * h;
      p.y += (p.vy + jy) * h;
    }

    sizeAt(p) {
      const c = this.cfg, t = p.age / p.life;
      const e = (CURVES[c.sizeCurve] || CURVES.linear)(t);
      return Math.max(0.1, lerp(c.sizeStart, c.sizeEnd, e) * p.sizeMul * (0.35 + 0.65 * p.dens));
    }
    alphaAt(p) {
      const c = this.cfg, t = p.age / p.life;
      const fi = c.fadeIn > 0 ? clamp01(t / c.fadeIn) : 1;
      const fo = c.fadeOut > 0 ? clamp01((1 - t) / c.fadeOut) : 1;
      return c.opacity * fi * fo * p.dens;
    }
    _ensurePalette() {
      const c = this.cfg;
      const key = [c.color0, c.color1, c.color2, c.color3, c.hardness].join('|');
      if (key === this._spriteKey) return;
      this._spriteKey = key;
      const stops = [c.color0, c.color1, c.color2, c.color3].map(hexToRgb);
      this._palette = [];
      this._sprites = [];
      for (let i = 0; i < SPRITE_STEPS; i++) {
        const t = (i / (SPRITE_STEPS - 1)) * 3;
        const k = Math.min(2, Math.floor(t)), f = t - k;
        const rgb = [0, 1, 2].map((j) => Math.round(lerp(stops[k][j], stops[k + 1][j], f)));
        this._palette.push(rgb);
        this._sprites.push(makeSoftSprite(rgb, c.hardness));
      }
    }
    _colorIndex(p) { return Math.min(SPRITE_STEPS - 1, ((p.age / p.life) * SPRITE_STEPS) | 0); }

    render(ctx) {
      const c = this.cfg;
      this._ensurePalette();
      ctx.save();
      if (c.glow > 0) this._renderGlow(ctx);
      ctx.globalCompositeOperation = c.blend;
      const draw = RENDERERS[c.render] || RENDERERS.soft;
      draw(this, ctx);
      ctx.restore();
    }

    _renderGlow(ctx) {
      const c = this.cfg;
      const [ox, oy] = this.origin();
      const cy = oy + c.glowOffsetY;
      const [r, g, b] = hexToRgb(c.glowColor);
      const a = Math.min(1, c.glow * this.intensity);
      const grd = ctx.createRadialGradient(ox, cy, 0, ox, cy, c.glowRadius);
      grd.addColorStop(0, `rgba(${r},${g},${b},${a})`);
      grd.addColorStop(0.35, `rgba(${r},${g},${b},${a * 0.35})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grd;
      ctx.fillRect(ox - c.glowRadius, cy - c.glowRadius, c.glowRadius * 2, c.glowRadius * 2);
    }
  }

  function makeSoftSprite([r, g, b], hardness) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = SPRITE_SIZE;
    const g2 = cv.getContext('2d');
    const R = SPRITE_SIZE / 2;
    const grd = g2.createRadialGradient(R, R, 0, R, R, R);
    const hd = clamp01(hardness) * 0.9;
    grd.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grd.addColorStop(hd, `rgba(${r},${g},${b},0.85)`);
    grd.addColorStop(hd + (1 - hd) * 0.5, `rgba(${r},${g},${b},0.25)`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    g2.fillStyle = grd;
    g2.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    return cv;
  }

  const RENDERERS = {
    streak(em, ctx) {
      const m = ctx.getTransform();
      const k = em.cfg.stretch;
      for (const p of em.particles) {
        const a = em.alphaAt(p);
        if (a <= 0.003) continue;
        const s = em.sizeAt(p);
        const sp = Math.hypot(p.vx, p.vy) || 1e-6;
        const cs = p.vx / sp, sn = p.vy / sp;
        const L = s * (1 + sp * k);
        // compose on top of the current transform so non-uniform base scale
        // (tight x, full-height y) stays correct
        ctx.setTransform(m);
        ctx.translate(p.x, p.y);
        ctx.transform(cs, sn, -sn, cs, 0, 0);
        ctx.globalAlpha = a;
        ctx.drawImage(
          em._sprites[em._colorIndex(p)],
          -L, -s * SMOKE_WIDTH_SCALE,
          L * 2, s * 2 * SMOKE_WIDTH_SCALE
        );
      }
      ctx.setTransform(m);
    },
    soft(em, ctx) {
      for (const p of em.particles) {
        const a = em.alphaAt(p);
        if (a <= 0.003) continue;
        const s = em.sizeAt(p);
        ctx.globalAlpha = a;
        ctx.drawImage(em._sprites[em._colorIndex(p)], p.x - s, p.y - s, s * 2, s * 2);
      }
    },
    circle(em, ctx) {
      for (const p of em.particles) {
        const a = em.alphaAt(p);
        if (a <= 0.003) continue;
        const [r, g, b] = em._palette[em._colorIndex(p)];
        ctx.globalAlpha = a;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, em.sizeAt(p), 0, TAU);
        ctx.fill();
      }
    },
    spark(em, ctx) {
      const k = em.cfg.stretch;
      ctx.lineCap = 'round';
      for (const p of em.particles) {
        const a = em.alphaAt(p);
        if (a <= 0.003) continue;
        const [r, g, b] = em._palette[em._colorIndex(p)];
        ctx.globalAlpha = a;
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = em.sizeAt(p);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * k - 0.01, p.y - p.vy * k);
        ctx.stroke();
      }
    },
  };

  class ParticleSystem {
    constructor(configs = []) {
      this.emitters = configs.map((c) => new Emitter(c));
    }
    add(cfg) { const e = new Emitter(cfg); this.emitters.push(e); return e; }
    remove(em) { this.emitters = this.emitters.filter((e) => e !== em); }
    update(dt) { for (const e of this.emitters) e.update(dt); }
    count() { return this.emitters.reduce((n, e) => n + e.particles.length, 0); }
    prewarm(seconds, step = 1 / 60) { for (let t = 0; t < seconds; t += step) this.update(step); }
    toJSON() { return this.emitters.map((e) => Object.assign({}, e.cfg)); }
    load(configs) { this.emitters = configs.map((c) => new Emitter(c)); }
  }

  return { Emitter, ParticleSystem };
})();

// ---------------------------------------------------------------------------
// IncenseSmoke — drives three smoke emitters (left / center / right stick).
// ---------------------------------------------------------------------------

// Tuned parameters from xiang-particles-202610261447.json (smoke emitters only).
const SMOKE_BASE = {
  kind: 'smoke',
  style: 'Natural',
  enabled: true,
  rate: 340,
  maxParticles: 5000,
  lifeMin: 4,
  lifeMax: 5.2,
  shape: 'circle',
  radius: 4,
  angle: -90,
  spread: 3,
  speedMin: 62,
  speedMax: 70,
  buoyancy: 10,
  drag: 0.15,
  windX: 0,
  centerPull: 0,
  spiralAmp: 0,
  spiralFreq: 1,
  densityVar: 0.09,
  densityFreq: 12,
  pulse: 0.035,
  jitter: 5,
  jitterScale: 0.3,
  diffuse: 0,
  strands: 1,
  strandSplit: 0.1,
  turbulence: 0.3,
  turbScale: 0.005,
  turbSpeed: 0.25,
  turbDelay: 0.3,
  sway: 0,
  swayFreq: 1,
  flicker: 0,
  sizeStart: 1.65,
  sizeEnd: 7.6,
  sizeJitter: 0.6,
  sizeCurve: 'easeIn',
  color0: '#ffffff',
  color1: '#e2e2e2',
  color2: '#c4c4c4',
  color3: '#9a9a9a',
  opacity: 0.06,
  fadeIn: 0.01,
  fadeOut: 0.9,
  render: 'streak',
  blend: 'screen',
  hardness: 0,
  stretch: 0.05,
  blur: 0.5,
  glow: 0,
  glowRadius: 60,
  glowOffsetY: -30,
  glowColor: '#ff9a30',
};

// Reference coordinate window we map onto this canvas. The emitters sit at the
// bottom; smoke rises toward smaller y (up).
// The three stick tips in item_xiang_parallel_violet_v2.png (1024x1536) sit at
// x ~= 444 / 513 / 581, which on the 42px box (background-size auto 100%,
// centered) lands at ~17.4 / 21 / 24.7 css px. The window below maps the
// emitters (x 604/637/670) onto those tightened positions, while the vertical
// scale is kept independent so the plume keeps its full height.
const EMIT_Y = 1714;                 // emit origin (bottom of window)
const WORLD_XMIN = 464.7;            // left edge of window
const WORLD_W = 343;                 // window width in reference px (maps onto stick tips)
const WORLD_H = 464;                 // window height (plume fills ~71% of canvas height)
const SMOKE_WIDTH_SCALE = 2;         // widen each plume without increasing opacity or length

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default class IncenseSmoke {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas && canvas.getContext('2d');
    // Display size stays the same as the old ribbon so the layout is untouched.
    this.cssW = 42;
    this.cssH = 112;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.time = 0;
    this.lastTime = 0;
    this.raf = 0;
    this.running = false;

    if (!this.ctx) return;

    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    this.canvas.style.width = this.cssW + 'px';
    this.canvas.style.height = this.cssH + 'px';

    // scale: reference-window px -> canvas buffer px (x and y are independent
    // so the tight stick spacing and the full plume height can both hold)
    this.scaleX = this.canvas.width / WORLD_W;
    this.scaleY = this.canvas.height / WORLD_H;

    this.system = new Particles.ParticleSystem([
      Object.assign({}, SMOKE_BASE, { name: '左香', x: 604, y: EMIT_Y }),
      Object.assign({}, SMOKE_BASE, { name: '中香', x: 637, y: EMIT_Y }),
      Object.assign({}, SMOKE_BASE, { name: '右香', x: 670, y: EMIT_Y }),
    ]);
    this.system.prewarm(3); // start with the smoke already lit

    this.loop = this.loop.bind(this);
    this.start();
  }

  start() {
    if (this.running || !this.ctx) return;
    this.running = true;
    this.lastTime = 0;
    this.raf = window.requestAnimationFrame(this.loop);
  }

  loop(now) {
    if (!this.running || !this.ctx) return;
    const delta = this.lastTime ? clamp((now - this.lastTime) / 1000, 1 / 120, 1 / 30) : 1 / 60;
    this.lastTime = now;
    this.time += delta;

    const ctx = this.ctx;
    const bw = this.canvas.width;
    const bh = this.canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Map the reference window onto the canvas (emit origin -> bottom).
    ctx.setTransform(
      this.scaleX, 0, 0, this.scaleY,
      -WORLD_XMIN * this.scaleX,
      -EMIT_Y * this.scaleY + bh  // y = EMIT_Y maps to bottom (bh)
    );

    this.system.update(delta);
    for (const emitter of this.system.emitters) emitter.render(ctx);

    this.raf = window.requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    if (this.raf) window.cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.system) this.system.emitters.forEach((e) => e.clear());
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
