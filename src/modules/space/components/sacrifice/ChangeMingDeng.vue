<template>
  <div class="item item-zhang-min-ding">
    <canvas ref="deng" style="width: 10vw; height: 10vw;"></canvas>
  </div>
</template>

<script>
    export default {
      name: "ChangMingDeng",
      data(){
        return{
          //
        }
      },
      computed:{
        //
      },
      methods:{
        initZhuHuo() {
          const flameFrag = document.querySelector("#flame-frag").textContent;
          const baseUrl = "/static/bian-mobile/images/";

          const manifest = [
            {name: "noise", url: "noise-texture-11.png?v=9"}
          ]


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

          new Application({
            view: this.$refs.deng,
          }).load(manifest);
        }
      },
      mounted() {
        let that = this;
        setTimeout(()=>{
          that.initZhuHuo()
        }, 1000)
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
</style>
