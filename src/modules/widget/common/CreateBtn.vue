<template>
  <div class="create-btn"
       :style="{
       right: `${right}px`,
       bottom: `${bottom}px`,
    }"><div class="icon"></div></div>
</template>

<script>
  /**
   * ​​新建按钮
   * @options right   String    选填   距离屏幕左边位置
   * @options bottom  String    选填   距离屏幕底部位置
   */

  export default {
    props: {
      right: {
        type: Number,
        default: 26
      },
      bottom: {
        type: Number,
        default: 30
      },

    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .create-btn{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 46px;
    height: 46px;
    border-radius: 23px;
    background-color: #67a7f6;
    position: fixed;
    right: 26px;
    bottom: 30px;
    z-index: 8;
    .icon{
      width: 19px;
      height: 19px;
      background-image: url(~@/modules/widget/common/images/add.png);
      background-repeat: no-repeat;
      background-size: 100%;
    }
  }
</style>
