<template>
  <div class="notice-container">
    <div class="tip">长按二维码直接识别关注公众号</div>
    <img src="https://ba.yugusoft.com/api/v1/files/download/bian_user/19/09/23/1569227181396/qrcode_for_gh_44093dc42ad4_258.jpg"/>
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
