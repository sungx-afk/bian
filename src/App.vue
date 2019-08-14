<template>
  <div id="app">
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


</style>
