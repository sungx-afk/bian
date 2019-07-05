<template>
  <div class="sacrifice">
    <div class="xiang_kuang">
      <div id="yi_xiang" style=""></div>
    </div>

    <div id="dui_lian_box">
      <div class="inner" style="padding: 30px 15px 0px;">
        <div class="dui_lian" style="float: left;">仿佛音容犹如梦</div>
        <div class="dui_lian" style="float: right;">依稀笑语痛伤心</div>
      </div>
    </div>

    <div id="main-box">
      <div class="inner">
        <div id="item_hua_bg">
          <div class="inner" style="padding-top: 30vw; padding-left: 5vw;padding-right: 5vw;">
            <div id="hua_box">
              <div class="hua"></div>
              <div class="hua"></div>
              <div class="hua"></div>
              <div class="hua"></div>
              <div class="hua"></div>
              <div class="hua"></div>
            </div>
          </div>
        </div>

        <div id="item_zuo_zi_box">
          <div id="item_zuo_zi_box_inner" style="padding: 0em 4vw">
            <div id="item_zuo_zi">
              <div class="inner">
                <div class="item item-01"></div>
                <div class="item item-02"></div>
                <div class="item item-03"></div>
                <div class="item item-04"></div>
                <div class="item item-01"></div>
                <div class="item item-02"></div>
                <div class="item item-03"></div>
                <div class="item item-04"></div>
              </div>
            </div>
          </div>
        </div>

        <div id="item_zuo_zi_box_2" style="top:62vw;">
          <div id="item_zuo_zi_box_inner_2">
            <div id="item_zuo_zi_2">
              <div class="inner" style="top: -7vw;">
                <div class="item item-01"></div>
                <div class="item item-02"></div>
                <div class="item item-03"></div>
                <div class="item item-la-zu">
                  <canvas id="zu-huo-1" style="width: 10vw; height: 10vw;"></canvas>
                </div>
                <div class="item item-xiang-lu">
                  <div class="item-xiang-lu-box">
                    <div class="item-xiang">
                    </div>
                  </div>
                </div>
                <div class="item item-la-zu">
                  <canvas id="zu-huo-2" style="width: 10vw; height: 10vw;"></canvas>
                </div>
                <div class="item item-03"></div>
                <div class="item item-04"></div>
                <div class="item item-01"></div>
              </div>
            </div>
          </div>
        </div>


        <div class="big-fire-box">
          <div class="inner">]
            <canvas id="big-fire" style="width: 100px;height: 100px;"></canvas>
          </div>
        </div>


        <div class="buttons">
          <div class="button" @click="jibai()">上香祭拜</div>
          <div class="button" @click="flower()">送花</div>
          <div class="button" @click="dianlazu()">点蜡烛</div>
          <div class="button">更多</div>
        </div>
      </div>


      <div id="jibai"
           style="width: 100%;text-align: center; position: absolute;left: 0;right: 0;bottom: 0vw;height: 360px;z-index: 11; visibility: hidden;">
        <img src="./images/baifo.gif" style="width: 250px;height: 366px;"/>
      </div>

      <div id="flower"></div>
    </div>
  </div>
</template>
<script>
  import {mapGetters} from 'vuex';
  import {Link} from '@/config/utils'

  export default {
    data() {
      return {}
    },
    components: {},
    computed: {},
    methods: {
      //祭拜
      jibai() {
        var dom = document.getElementById("jibai");
        let xiangDom = document.querySelector('.item-xiang-lu-box');
        dom.style.visibility = 'visible'
        setTimeout(function () {
          dom.style.visibility = 'hidden';
          xiangDom.style.visibility = 'visible';
        }, 3000)
      },
      //点烛
      dianlazu() {
        var dom1 = document.getElementById("zu-huo-1");
        var dom2 = document.getElementById("zu-huo-2");
        dom1.style.visibility = 'visible'
        dom2.style.visibility = 'visible'
        setTimeout(function () {
          dom1.style.visibility = 'hidden';
          dom2.style.visibility = 'hidden';
        }, 3000)
      },
      //送花
      flower() {
        var dom = document.getElementById("flower");
        dom.style.animationName = 'flowerIn';
        setTimeout(function () {
          dom.style.animationName = '';
        }, 5000)
      },

      initBigFire(){

        'use strict';

        var _createClass = function () {
          function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
              var descriptor = props[i];
              descriptor.enumerable = descriptor.enumerable || false;
              descriptor.configurable = true;
              if ("value" in descriptor) descriptor.writable = true;
              Object.defineProperty(target, descriptor.key, descriptor);
            }
          }

          return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
          };
        }();

        function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
          }
        }

        console.clear();

        var $ = {};

        $.PI = Math.PI;
        $.TAU = $.PI * 2;

        $.rand = function (min, max) {
          return Math.random() * (max - min) + min;
        };

        $.hsla = function (h, s, l, a) {
          return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')';
        };

        $.baseRange = function (base, range) {
          return base + $.rand(-range, range);
        };

        $.Pool = function () {
          function _class(base, preallocateAmount) {
            _classCallCheck(this, _class);

            this.base = base;
            this.preallocateAmount = preallocateAmount || 0;
            this.alive = [];
            this.dead = [];
            this.length = 0;
            this.deadLength = 0;
            if (this.preallocateAmount) {
              this.preallocate();
            }
          }

          _createClass(_class, [{
            key: 'preallocate',
            value: function preallocate() {
              for (var i = 0; i < this.preallocateAmount; i++) {
                this.dead.push(new this.base());
                this.deadLength++;
              }
            }
          }, {
            key: 'create',
            value: function create(opt) {
              if (this.deadLength) {
                var obj = this.dead.pop();
                obj.init(opt);
                this.alive.push(obj);
                this.deadLength--;
                this.length++;
                return obj;
              } else {
                var newItem = new this.base();
                newItem.init(opt);
                this.alive.push(newItem);
                this.length++;
                return newItem;
              }
            }
          }, {
            key: 'release',
            value: function release(obj) {
              var i = this.alive.indexOf(obj);
              if (i > -1) {
                this.dead.push(this.alive.splice(i, 1)[0]);
                this.length--;
                this.deadLength++;
              }
            }
          }, {
            key: 'empty',
            value: function empty() {
              this.alive.length = 0;
              this.dead.length = 0;
              this.length = 0;
              this.deadLength = 0;
            }
          }, {
            key: 'each',
            value: function each(action, asc) {
              var i = this.length;
              while (i--) {
                this.alive[i][action](i);
              }
            }
          }]);

          return _class;
        }();

        $.Particle = function () {
          function _class2() {
            _classCallCheck(this, _class2);
          }

          _createClass(_class2, [{
            key: 'init',
            value: function init(opt) {
              Object.assign(this, opt);
              this.life = 1;
            }
          }, {
            key: 'step',
            value: function step() {
              this.velocity += this.acceleration;
              this.angle += $.rand(-this.wander, this.wander);
              this.x += Math.cos(this.angle) * this.velocity;
              this.y += Math.sin(this.angle) * this.velocity;
              this.life -= this.decay;
              this.alpha = this.fade ? this.life * 1.5 : 1;
              if (this.life < 0) {
                this.parent.particles.release(this);
              }
            }
          }, {
            key: 'draw',
            value: function draw() {
              $.ctx.beginPath();
              $.ctx.arc(this.x, this.y, this.radius, 0, $.TAU);
              $.ctx.fillStyle = $.hsla(this.hue, this.saturation, this.lightness, this.alpha);
              $.ctx.fill();
            }
          }]);

          return _class2;
        }();

        $.ParticleEmitter = function () {
          function _class3(opt) {
            _classCallCheck(this, _class3);

            Object.assign(this, opt);
            this.particles = new $.Pool($.Particle, 100);
          }

          _createClass(_class3, [{
            key: 'step',
            value: function step() {
              if ($.tick % this.interval === 0) {
                this.particles.create({
                  parent: this,
                  x: $.baseRange(this.x.base, this.x.range),
                  y: $.baseRange(this.y.base, this.y.range),
                  radius: $.baseRange(this.radius.base, this.radius.range),
                  angle: $.baseRange(this.angle.base, this.angle.range),
                  velocity: $.baseRange(this.velocity.base, this.velocity.range),
                  acceleration: $.baseRange(this.acceleration.base, this.acceleration.range),
                  decay: $.baseRange(this.decay.base, this.decay.range),
                  hue: $.baseRange(this.hue.base, this.hue.range),
                  saturation: $.baseRange(this.saturation.base, this.saturation.range),
                  lightness: $.baseRange(this.lightness.base, this.lightness.range),
                  wander: this.wander,
                  fade: this.fade
                });
              }
              this.particles.each('step');
            }
          }, {
            key: 'draw',
            value: function draw() {
              $.ctx.globalCompositeOperation = this.blend;
              this.particles.each('draw');
            }
          }]);

          return _class3;
        }();

        $.init = function () {
          $.c = document.getElementById('big-fire');
          $.ctx = $.c.getContext('2d');
          $.w = $.c.width = 400;
          $.h = $.c.height = 400;
          $.particleEmitters = [];
          $.tick = 1;

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 20
            },
            y: {
              base: $.h,
              range: 20
            },
            radius: {
              base: 0.75,
              range: 0.4
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.01
            },
            velocity: {
              base: 0.5,
              range: 0.5
            },
            acceleration: {
              base: 0.01,
              range: 0.01
            },
            decay: {
              base: 0.005,
              range: 0.001
            },
            hue: {
              base: 30,
              range: 30
            },
            saturation: {
              base: 80,
              range: 20
            },
            lightness: {
              base: 80,
              range: 20
            },
            wander: 0.06,
            blend: 'lighter',
            fade: true,
            interval: 5
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w - 100,
              range: 25
            },
            y: {
              base: $.h,
              range: 5
            },
            radius: {
              base: 20,
              range: 10
            },
            angle: {
              base: -$.PI * 0.55,
              range: $.PI * 0.05
            },
            velocity: {
              base: 2,
              range: 0
            },
            acceleration: {
              base: 0.02,
              range: 0.01
            },
            decay: {
              base: 0.001,
              range: 0
            },
            hue: {
              base: 0,
              range: 0
            },
            saturation: {
              base: 0,
              range: 0
            },
            lightness: {
              base: 0,
              range: 0
            },
            wander: 0.05,
            blend: 'destination-out',
            fade: false,
            interval: 1
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: 100,
              range: 25
            },
            y: {
              base: $.h,
              range: 5
            },
            radius: {
              base: 20,
              range: 10
            },
            angle: {
              base: -$.PI * 0.45,
              range: $.PI * 0.05
            },
            velocity: {
              base: 2,
              range: 0
            },
            acceleration: {
              base: 0.02,
              range: 0.01
            },
            decay: {
              base: 0.001,
              range: 0
            },
            hue: {
              base: 0,
              range: 0
            },
            saturation: {
              base: 0,
              range: 0
            },
            lightness: {
              base: 0,
              range: 0
            },
            wander: 0.05,
            blend: 'destination-out',
            fade: false,
            interval: 1
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 20
            },
            y: {
              base: $.h,
              range: 20
            },
            radius: {
              base: 15,
              range: 5
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.05
            },
            velocity: {
              base: 1.5,
              range: 0
            },
            acceleration: {
              base: 0.02,
              range: 0.01
            },
            decay: {
              base: 0.0075,
              range: 0
            },
            hue: {
              base: 60,
              range: 0
            },
            saturation: {
              base: 100,
              range: 0
            },
            lightness: {
              base: 70,
              range: 0
            },
            wander: 0.01,
            blend: 'source-over',
            fade: false,
            interval: 2
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 20
            },
            y: {
              base: $.h - 20,
              range: 20
            },
            radius: {
              base: 2,
              range: 1
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.001
            },
            velocity: {
              base: 0.5,
              range: 0
            },
            acceleration: {
              base: 0.02,
              range: 0.02
            },
            decay: {
              base: 0.0075,
              range: 0
            },
            hue: {
              base: 60,
              range: 0
            },
            saturation: {
              base: 90,
              range: 0
            },
            lightness: {
              base: 100,
              range: 0
            },
            wander: 0.025,
            blend: 'source-over',
            fade: false,
            interval: 3
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 20
            },
            y: {
              base: $.h - 20,
              range: 15
            },
            radius: {
              base: 25,
              range: 5
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.025
            },
            velocity: {
              base: 2,
              range: 0.25
            },
            acceleration: {
              base: 0.01,
              range: 0.01
            },
            decay: {
              base: 0.0075,
              range: 0
            },
            hue: {
              base: 30,
              range: 0
            },
            saturation: {
              base: 90,
              range: 0
            },
            lightness: {
              base: 50,
              range: 0
            },
            wander: 0.01,
            blend: 'source-over',
            fade: false,
            interval: 2
          }));

          $.particleEmitters.push(new $.ParticleEmitter({
            x: {
              base: $.w * 0.5,
              range: 30
            },
            y: {
              base: $.h - 20,
              range: 15
            },
            radius: {
              base: 35,
              range: 10
            },
            angle: {
              base: -$.PI * 0.5,
              range: $.PI * 0.025
            },
            velocity: {
              base: 2,
              range: 0.25
            },
            acceleration: {
              base: 0.01,
              range: 0.01
            },
            decay: {
              base: 0.0075,
              range: 0
            },
            hue: {
              base: 0,
              range: 0
            },
            saturation: {
              base: 90,
              range: 0
            },
            lightness: {
              base: 50,
              range: 0
            },
            wander: 0.01,
            blend: 'source-over',
            fade: false,
            interval: 2
          }));

          $.gradient = $.ctx.createLinearGradient(0, 0, 0, $.h * 0.75);
          $.gradient.addColorStop(0, $.hsla(0, 0, 0, 1));
          $.gradient.addColorStop(1, $.hsla(0, 0, 0, 0));

          $.loop();
        };

        $.step = function () {
          var i = $.particleEmitters.length;
          while (i--) {
            $.particleEmitters[i].step();
          }
          $.tick++;
        };

        $.draw = function () {
          $.ctx.clearRect(0, 0, $.w, $.h);
          var i = $.particleEmitters.length;
          while (i--) {
            $.particleEmitters[i].draw();
          }

          $.ctx.globalCompositeOperation = 'destination-out';
          $.ctx.fillStyle = $.gradient;
          $.ctx.fillRect(0, 0, $.w, $.h);

          $.ctx.beginPath();
          $.ctx.globalCompositeOperation = 'source-over';
          $.ctx.arc($.w * 0.5, $.h + 40, 63, 0, $.TAU);
          $.ctx.fillStyle = '#f00';
          $.ctx.fill();

          $.ctx.beginPath();
          $.ctx.globalCompositeOperation = 'source-over';
          $.ctx.arc($.w * 0.5, $.h + 40, 60, 0, $.TAU);
          $.ctx.fillStyle = '#000';
          $.ctx.fill();
        };

        $.loop = function () {
          requestAnimationFrame($.loop);
          $.step();
          $.draw();
        };

        $.init();
      },

      initZhuHuo(){
        const flameFrag = document.querySelector("#flame-frag").textContent;
        const baseUrl = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/106114/";

        const manifest = [
          {name: "noise", url: "noise-texture-11.png?v=9"}
        ];


//
// FLAME FILTER
// ===========================================================================
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


//
// APPLICATION
// ===========================================================================

        let width = document.body.clientWidth;
        let itemWidth = width / 10;

        class Application extends PIXI.Application {

          constructor(config) {

            if (window.devicePixelRatio > 1) {
              PIXI.settings.RESOLUTION = 2;
            }

            PIXI.settings.PRECISION_FRAGMENT = "highp";

            super({
              view: config.view,
              width: itemWidth,
              height: itemWidth,
              backgroundColor: 0x000000,
              autoResize: true,
              antialias: false,
              transparent: true
            });

            this.isResized = true;
            this.loader.baseUrl = baseUrl;
          }

          load(manifest) {
            var that = this;
            that.loader
              .add(manifest)
              .load(function (l, r) {
                that.init(r)
              });
          }

          init(resources) {
            var that = this;
            this.flame = new FlameFilter(resources.noise.texture);
            this.stage.filterArea = this.screen;
            this.stage.filters = [this.flame];
            this.ticker.add(this.update, this);
            window.addEventListener("resize", function () {
                that.isResized = true
              }
            )
          }

          update(delta) {

            if (this.isResized) {
              this.renderer.resize(itemWidth, itemWidth);
              this.isResized = false;
            }

            this.flame.time += 0.1 * delta;
          }
        }

        const app1 = new Application({
          view: document.querySelector("#zu-huo-1"),
        });
        const app2 = new Application({
          view: document.querySelector("#zu-huo-2"),
        });
        app1.load(manifest);
        app2.load(manifest);
      }
    },
    created() {
    },
    mounted() {
      console.clear();
      this.initZhuHuo();
      this.initBigFire();
    }
  }
</script>

<style rel="stylesheet/less" lang="less">
  @import "~@/config/config.less";

  .sacrifice {
    //
  }

  html, body {
    width: 100%;
    height: 100%;
    position: relative;
    background: black;
    box-sizing: border-box;
    overflow: hidden;
  }

  .space-container {
    background: url("./images/bg.jpg");
    background-size: 100% 100%;
  }

  .xiang_kuang {
    background: url("./images/item_xiang_kuang_black.png");
    background-size: cover;
    width: 180px;
    height: 230px;
    padding: 0;
    margin: 0 auto;
    margin-top: 12vh;
    position: relative;
  }

  #yi_xiang {
    position: absolute;
    left: 27px;
    right: 14px;
    top: 23px;
    bottom: 28px;
    background: url('./images/item_yi_xiang.png');
    background-size: cover !important;
  }

  .view1-box {
    width: 108px;
    height: 108px;
    position: absolute;
    bottom: 328px;
    left: 200px;
  }

  .file-01 {
    width: 60px;
    height: 60px;
    touch-action: none;
    cursor: inherit;
    position: absolute;
    left: 24px;
    top: -38px;
  }

  #dui_lian_box {
    position: absolute;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    color: white;
    text-align: left;
    padding: 0px;
    margin: 0px;
    display: flex;
  }

  .inner {
    flex: 1;
    position: relative;
    padding: 0px;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .dui_lian {
    background: #f0eadd;
    color: black;
    height: auto;
    writing-mode: vertical-rl;
    text-align: center;
    vertical-align: middle;
    font-size: 14px;
    padding: 15px 10px;
    letter-spacing: 8px;
    box-sizing: border-box;
    position: relative;
    font-weight: bold;
    box-shadow: 4px 6px 9px rgba(1, 1, 1, 0.61);
  }

  .big-fire-box{
    background-image: url(./images/item_huo_lu.png);
    background-size: 100% 100%;
    width: 100px;
    height: 100px;
    margin: 0 auto;
    position: absolute;
    left: 50%;
    margin-left: -50px;
    bottom: 4vw;
    display: flex;
  }

  #big-fire {
    animation: fade-in 2000ms 1000ms forwards;
    /*background: #000;*/
    /*background: radial-gradient( circle at 50% 75%, #311, #000 );*/
    border-radius: 50%;
    /*box-shadow: inset 0 0 0 10px rgba(255, 255, 255, 0.05);*/
    left: 0;
    margin: 0 auto;
    bottom: 31px;
    opacity: 0;
    position: absolute;
    right: 0;
  }

  @keyframes fade-in {
    to {
      opacity: 1;
    }
  }

  @keyframes fade-in2 {
    to {
      opacity: 0.06;
    }
  }

  #main-box {
    position: absolute;
    left: 0px;
    right: 0px;
    bottom: 0px;
    height: 100vw;
    /*background: red;*/
    display: flex;
  }

  #item_hua_bg {
    background: url("./images/item_hua_bg.png");
    background-size: 100% 100%;
    width: 100vw;
    height: 70vw;
    position: absolute;
    bottom: 15vh;
    left: 0px;
    right: 0px;
    top: 0px;
    display: flex;
  }

  #hua_box {
    display: flex;
    flex-direction: row;
  }

  .hua {
    background: url("./images/item_hua_quan.png");
    height: 15vw;
    background-size: 100% 100%;
    width: 15vw;
  }

  #item_zuo_zi_box {
    position: absolute;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 0px;
    text-align: center;
    left: 0px;
    right: 0px;
    top: 46vw;
    height: 400px;
    transform: scale(0.9);
  }

  #item_zuo_zi_box_inner {
    flex: 1;
    position: relative;
    padding: 2vw;
    margin: 0 auto;
    box-sizing: border-box;
  }

  #item_zuo_zi .inner, #item_zuo_zi_2 .inner {
    display: flex;
    flex-direction: row;
    vertical-align: top;
    justify-items: center;
    position: absolute;
    top: -8vw;
    text-align: center;
    margin: 0 auto;
    left: 0;
    right: 0;
    justify-content: center;
    align-items: center;
  }

  #item_zuo_zi_box_2 {
    position: absolute;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 0px;
    text-align: center;
    left: 0px;
    right: 0px;
    top: 506px;
    height: 400px;
  }

  #item_zuo_zi_box_inner_2 {
    flex: 1;
    position: relative;
    padding: 2vw;
    margin: 0 auto;
    box-sizing: border-box;
  }

  #item_zuo_zi, #item_zuo_zi_2 {
    background: url("./images/item_zuo_zi.png");
    background-size: 100% 100%;
    width: 100%;
    height: 23vw;
    margin: 0 auto;
  }

  #item_zuo_zi .inner .item, #item_zuo_zi_2 .inner .item {
    width: 10vw;
    height: 10vw;
    margin-right: 0px;
    background-size: 100% 100%;
    position: relative;
  }

  .item.item-01 {
    background-image: url("./images/item_pan_bing.png") !important;
    background-position: 0px 3px;
  }

  .item.item-02 {
    background-image: url("./images/item_pan_ya.png") !important;
    background-position: 0px 3px;
  }

  .item.item-03 {
    background-image: url("./images/item_hua_01.png") !important;
  }

  .item.item-04 {
    background-image: url("./images/item_jiu_01.png") !important;
  }

  .item.item-05 {
    background-image: url("./images/item_jiu_02.png") !important;
  }

  .item-la-zu {
    background-image: url("./images/item_la_zhu.png") !important;
  }

  .item-xiang-lu {
    background-image: url("./images/item_xiang_lu.png") !important;
    position: relative;
    .item-xiang-lu-box{
      position: absolute;
      left: 0px;
      right: 0px;
      bottom: 6vw;
      visibility: hidden;
      .item-xiang{
        position: relative;
        background-image: url("./images/item_xiang.png") !important;
        background-size: cover;
        width: 10vw;
        height: 20vw;
      }
    }
  }

  .item-la-zu canvas {
    position: absolute;
    left: 0px;
    right: 0;
    top: -31px;
    touch-action: none;
    cursor: inherit;
    width: 10vw;
    height: 10vw;
    visibility: hidden;
  }

  .buttons {
    display: flex;
    flex-direction: row;
    position: fixed;
    bottom: 0px;
    left: 0px;
    right: 0px;
    box-sizing: border-box;
    padding: 5px;
  }

  .button {
    background: #C58233;
    padding: 6px 2px;
    margin-right: 4px;
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    text-align: center;
    color: white;
    font-size: 14px;
    font-weight: bold;
  }

  #flower {
    background-image: url("./images/item_hua_01.png") !important;
    background-size: 100% 100%;
    width: 10vw;
    height: 10vw;
    position: absolute;
    margin-left: -5vw;
    left: 50%;
    bottom: 0vw;
    transition: all 5s ease 1s;
    animation-duration: 5s;
    animation-timing-function: ease;
    animation-fill-mode: both;
    visibility: hidden;
  }

  @keyframes flowerIn {
    0% {
      transform: scale(0);
      opacity: 0;
      visibility: visible;
    }
    15% {
      transform: scale(1);
      opacity: 1;
      visibility: visible;
    }
    85% {
      transform: scale(1.25);
      opacity: 1;
      bottom: 75vw;
      visibility: visible;
    }
    100% {
      transform: scale(0);
      opacity: 0;
      bottom: 75vw;
      visibility: visible;
    }
  }
</style>
