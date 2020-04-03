<template>
  <div class="error-container">
    <div class="error-icon"><i class="iconfont icon-warn"></i></div>
    <div class="error-text">发生错误，资源不存在</div>
  </div>
</template>

<script>
    export default {
      name: "Error",
      data(){
        return{

        }
      },
      methods:{

      },
      created() {

      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .error-container{
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 30%;
    .error-icon{
      .iconfont{
        font-size: 40px;
        color: @FONT_THIRD_COLOR;
      }
    }
    .error-text{
      margin-top: 12px;
      font-size: 14px;
      color: @FONT_THIRD_COLOR;
    }

  }
</style>
