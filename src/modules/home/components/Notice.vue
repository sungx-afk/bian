<template>
  <div class="notice-container">
    <div class="tip">长按二维码直接识别关注公众号</div>
    <img :src="url"/>
  </div>
</template>

<script>
    export default {
      name: "Notice",
      data(){
        return {
          app_id:"",
          url:"",
        }
      },
      created(){
        let app_id = window.app_id || config_server.wechatAppId
        this.app_id = app_id;
        let url = `https://static-app01.yugusoft.com/static/bian/${app_id}.jpg`
        this.url = url;
      }
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
