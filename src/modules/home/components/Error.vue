<template>
  <div class="error-container">
    <div class="error-info" v-if="response">
      <p class="text">
        path:{{response.path}}
      </p>
      <p class="text">
        error:{{response.error}}
      </p>
      <p class="text">
        status:{{response.status}}
      </p>
      <p class="text">
        message:{{response.message}}
      </p>
      <p class="text">
        timestamp:{{response.timestamp}}
      </p>
    </div>
    <div v-else class="empty">
      没有可用错误信息
    </div>
  </div>
</template>

<script>
    export default {
      name: "Error",
      data(){
        return{
          response:null
        }
      },
      methods:{
        initErrorData(){
          let value = localStorage.getItem("axios_error")
          localStorage.removeItem("axios_error")
          if (value){
            this.response = JSON.parse(value)
          }
        }
      },
      created() {
        this.initErrorData()
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .error-container{
    .error-info{
      padding: 20px;
      .text{
        color: @FONT_THIRD_COLOR;
        word-break: break-all;
        margin: 10px 0px;
      }
    }
    .empty{
      padding: 20px;
      color: @FONT_THIRD_COLOR;
    }
  }
</style>
