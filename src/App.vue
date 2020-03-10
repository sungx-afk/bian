<template>
  <div id="app">
    <div class="navigator" v-if="showNavigator">
      <i class="left iconfont icon-triangle-left-copy" @click.stop="goHistory('back')"></i>
      <i class="right iconfont icon-triangle-right" @click.stop="goHistory('forward')"></i>
    </div>
    <navigation>
      <router-view></router-view>
    </navigation>
    <audio id="bgMusic" preload hidden loop="loop"></audio>
  </div>
</template>

<script>
  export default {
    name: 'app',
    data() {
      return {

      }
    },
    computed:{
      showNavigator(){
        let result = false
        let plat = getPlat()

        if (plat === 'web'){
          result = true
        }
        return result
      },
    },
    methods:{
      goHistory(direction){
        if (direction === 'back'){
          this.$router.back()
        }else if(direction === 'forward'){
          this.$router.forward()
        }
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less">
  @import "~@/config/config.less";

  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  #app {
    font-family: -apple-system-font, Helvetica Neue, Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: @BG_WHITE;
  }

  * {
    -webkit-overflow-scrolling: touch
  }

  li {
    list-style-type: none;
  }

  /**公共样式**/

  *{
    tap-highlight-color:transparent;
    -webkit-tap-highlight-color:transparent;
  }

  *{
    -webkit-touch-callout:none;
    -webkit-user-select:none;
    -khtml-user-select:none;
    -moz-user-select:none;
    -ms-user-select:none;
    user-select:none;
  }
  input{
    -webkit-user-select:auto;
  }
  textarea{
    -webkit-user-select:auto;
  }


  input,textarea{
    border-color: transparent;
    tap-highlight-color:transparent;
    -webkit-tap-highlight-color:transparent;
  }


  .clearfix{ zoom:1;}
  .clearfix:after {display: block; content: ''; clear: both; }


  .van-popup--center{
    width: 300px;
    border-radius: 10px;
    .menu{
      padding: 15px 20px;
      border-bottom: 1px solid @BORDER_COLOR_2;
      &:last-child{
        border-bottom: none;
      }
    }
  }
  .navigator{
    position: absolute;
    top: 0;
    z-index: 10000;
    color: white;
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0px 12px;
    box-sizing: border-box;
    .iconfont{
      font-size: 32px;
      text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -1px 0 0, #000 0 -1px 0;
      &.right{
        margin-left: auto;
      }
    }
  }

</style>
