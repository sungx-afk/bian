<template>
  <div class="item item-zhang-min-ding">
    <!-- 只作为火苗的定位锚点，真正的渲染统一交给 flameLayer（全页一个 PIXI 上下文） -->
    <div ref="deng" class="ming-deng-anchor"></div>
  </div>
</template>

<script>
  import flameLayer from './flameLayer';

  export default {
    name: "ChangMingDeng",
    mounted() {
      this.flame = flameLayer.addFlame(this.$refs.deng);
    },
    beforeDestroy() {
      if (this.flame) {
        flameLayer.removeFlame(this.flame);
        this.flame = null;
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
</style>
