<template>
  <div class="sacrifice">


    <canvas id="big-fire"></canvas>

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
                <div class="item item-xiang"></div>
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
        console.log(dom);
        dom.style.visibility = 'visible'
        setTimeout(function () {
          dom.style.visibility = 'hidden';
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
      flower(){
        var dom = document.getElementById("flower");
        dom.style.animationName='flowerIn';
        setTimeout(function () {
          dom.style.animationName = '';
        }, 5000)
      }
    },
    created() {
    },
    mounted() {
      console.clear();

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
    background: url("./images/bg.png");
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

  #big-fire {
    animation: fade-in 2000ms 1000ms forwards;
    /*background: #000;*/
    /*background: radial-gradient( circle at 50% 75%, #311, #000 );*/
    border-radius: 50%;
    /*box-shadow: inset 0 0 0 10px rgba(255, 255, 255, 0.05);*/
    left: 0;
    margin: 0 auto;
    bottom: 340px;
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
    transition: all 5s  ease 1s;
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
