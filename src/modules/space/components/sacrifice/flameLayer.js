// 祭拜页烛火统一渲染层
// ------------------------------------------------------------------
// 背景：以前每支烛火（#zu-huo-1、#zu-huo-2、每个长明灯组件、以及两个查不到 DOM 的孤儿
// #change-ming-ding-1/2）都会各自 new PIXI.Application，带来两个硬伤：
//   1) 每个 Application 独占总算一个 WebGL 上下文和一个独立 ticker。浏览器同时存活的
//      WebGL 上下文只有 8~16 个（低端安卓更少），超过后最早的上下文会被浏览器强制丢弃，
//      于是"烛火一多后面的就渲染不出来"。
//   2) N 个 fullscreen  shader filter 每帧各算一遍多层 noise 采样，
//      开销随蜡烛数量线性上涨，手机上直接掉帧。
// 改为：全页只有一个 Application / 一个上下文 / 一个 ticker，
//      每支烛火只是 stage 上一个带同一套 FlameFilter 的小 sprite（10vw 左右），
//      位置每帧用锚点元素 getBoundingClientRect 同步即可。

const NOISE_URL = '/static/bian-mobile/images/noise-texture-11.png?v=9';
// fixed 全屏画布：低于 .messages(6) / .buttons(9)，高于祭拜台
const OVERLAY_Z_INDEX = 5;

function createWhiteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 2;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 2, 2);
  return PIXI.Texture.fromCanvas(canvas);
}

class FlameLayer {
  constructor() {
    this.app = null;
    this.noise = null;
    this.white = null;
    this.FlameFilter = null;
    this.flames = [];
    this.pending = [];
    this.loading = false;
    this.frames = 0;
    this.dirty = false;

    this.onResize = () => this.resizeApp();
    this.onReposition = () => { this.dirty = true; };
    this.onVisibility = () => this.syncTicker();
  }

  // 懒加载：没有烛火时完全不创建 PIXI / 不占 WebGL 上下文
  ensureApp() {
    if (this.app || this.loading || typeof PIXI === 'undefined') return;
    const fragElement = document.querySelector('#flame-frag');
    if (!fragElement) return;

    this.loading = true;
    const flameFrag = fragElement.textContent;

    class FlameFilter extends PIXI.Filter {
      constructor(texture, time = 0.0) {
        super(null, flameFrag);
        this.uniforms.dimensions = new Float32Array(2);
        this.texture = texture;
        this.time = time;
      }

      get texture() {
        return this.uniforms.mapSampler;
      }

      set texture(texture) {
        texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
        this.uniforms.mapSampler = texture;
      }

      apply(filterManager, input, output, clear) {
        this.uniforms.dimensions[0] = input.sourceFrame.width;
        this.uniforms.dimensions[1] = input.sourceFrame.height;
        this.uniforms.time = this.time;
        filterManager.applyFilter(this, input, output, clear);
      }
    }
    this.FlameFilter = FlameFilter;

    if (window.devicePixelRatio > 1) {
      PIXI.settings.RESOLUTION = Math.min(window.devicePixelRatio, 2);
    }
    PIXI.settings.PRECISION_FRAGMENT = 'highp';

    this.white = createWhiteTexture();

    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      transparent: true,
      antialias: false,
      autoResize: true
    });

    const view = this.app.view;
    view.style.cssText = [
      'position:fixed', 'left:0px', 'top:0px',
      'width:100%', 'height:100%',
      'pointer-events:none', `z-index:${OVERLAY_Z_INDEX}`
    ].join(';');
    document.body.appendChild(view);

    // 没有烛火（或纹理还没回来）前不跑渲染循环
    this.app.ticker.stop();
    this.app.ticker.add(this.update, this);

    window.addEventListener('resize', this.onResize);
    // 页面滚动时锚点位置变化，用捕获阶段监听任意滚动容器
    window.addEventListener('scroll', this.onReposition, true);
    document.addEventListener('visibilitychange', this.onVisibility);

    new PIXI.loaders.Loader().add('noise', NOISE_URL).load((loader, resources) => {
      this.loading = false;
      if (!resources.noise || !resources.noise.texture) return;
      this.noise = resources.noise.texture;
      this.pending.splice(0).forEach(flame => this.createSprite(flame));
      this.syncTicker();
    });
  }

  addFlame(el) {
    if (!el) return null;
    this.ensureApp();
    const flame = { el: el, sprite: null, filter: null };
    this.flames.push(flame);
    if (this.noise) {
      this.createSprite(flame);
    } else {
      this.pending.push(flame);
    }
    return flame;
  }

  removeFlame(flame) {
    if (!flame) return;
    const index = this.flames.indexOf(flame);
    if (index > -1) this.flames.splice(index, 1);
    const pendingIndex = this.pending.indexOf(flame);
    if (pendingIndex > -1) this.pending.splice(pendingIndex, 1);

    if (flame.sprite) {
      if (flame.sprite.filters) {
        flame.sprite.filters.forEach(filter => filter.destroy && filter.destroy());
      }
      flame.sprite.destroy({ texture: false, children: true });
    }
    flame.sprite = null;
    flame.filter = null;
    flame.el = null;
    this.syncTicker();
  }

  createSprite(flame) {
    if (!this.app || !this.noise || flame.sprite) return;
    const sprite = new PIXI.Sprite(this.white);
    sprite.anchor.set(0.5);
    // 每支烛火随机相位，避免所有火焰完全同步跳动
    const filter = new this.FlameFilter(this.noise, Math.random() * 200);
    sprite.filters = [filter];
    this.app.stage.addChild(sprite);
    flame.sprite = sprite;
    flame.filter = filter;
    this.dirty = true;
    this.updatePositions();
    this.syncTicker();
  }

  updatePositions() {
    if (!this.app) return;
    for (let i = 0; i < this.flames.length; i++) {
      const flame = this.flames[i];
      if (!flame.sprite) continue;
      const el = flame.el;
      if (!el || !el.isConnected) {
        flame.sprite.visible = false;
        continue;
      }
      const rect = el.getBoundingClientRect();
      // 锚点被隐藏 / 未布局时不渲染
      if (!rect.width || !rect.height) {
        flame.sprite.visible = false;
        continue;
      }
      flame.sprite.visible = true;
      flame.sprite.position.set(rect.left + rect.width / 2, rect.top + rect.height / 2);
      flame.sprite.width = rect.width;
      flame.sprite.height = rect.height;
    }
  }

  update(delta) {
    // getBoundingClientRect 不必每帧算：滚动/resize 时脏标记 + 兜底轮询
    this.frames++;
    if (this.dirty || this.frames % 20 === 0) {
      this.dirty = false;
      this.updatePositions();
    }
    const step = 0.1 * delta;
    for (let i = 0; i < this.flames.length; i++) {
      if (this.flames[i].filter) {
        this.flames[i].filter.time += step;
      }
    }
  }

  resizeApp() {
    if (this.app && this.app.renderer) {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
    }
    this.dirty = true;
  }

  syncTicker() {
    if (!this.app) return;
    const shouldRun = !!this.noise && this.flames.length > 0 && !document.hidden;
    if (shouldRun && !this.app.ticker.started) {
      this.app.ticker.start();
    } else if (!shouldRun && this.app.ticker.started) {
      this.app.ticker.stop();
    }
  }

  destroy() {
    this.flames = [];
    this.pending = [];
    this.dirty = false;
    this.frames = 0;
    this.loading = false;
    if (!this.app) return;

    this.app.ticker.stop();
    this.app.destroy(true);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onReposition, true);
    document.removeEventListener('visibilitychange', this.onVisibility);

    if (this.white) this.white.destroy(true);
    this.app = null;
    this.noise = null;
    this.white = null;
    this.FlameFilter = null;
  }
}

export default new FlameLayer();
