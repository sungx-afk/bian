<template>
  <div class="notice-container">
    <div class="tip">长按二维码直接识别关注公众号</div>
    <img src="https://static-app01.yugusoft.com/bian/qrcode.jpg"/>
  </div>
</template>

<script>
    export default {
        name: "Notice"
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .notice-container{
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 100px;

  }

</style>
