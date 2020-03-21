<template>
  <div class="message-wrapper">
    <van-popup
      v-model="showPopup"
      position="top"
      :style="{ height: '30%' }"
    />
  </div>
</template>

<script>
    export default {
      name: "Message",
      data(){
        return{
          showPopup:true
        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .message-wrapper{

  }
</style>
