<template>
  <div class='nodata-container'>
    <img class="image" src="~@/modules/images/logo_gray.png" />
    <span class="text">{{text || '爱，永存'}}</span>
  </div>
</template>

<script>
    export default {
      name: "NoData",
      props: {
        text:{
          type:String,
          default:''
        }
      },
      methods:{

      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

  .nodata-container{
    display:flex;
    flex-direction:column;
    align-items: center;
    padding-top:30%;
    .image{
      width: 100px;
      height: 100px;
    }
    .text{
      font-size: 16px;
      color: #a9a9a9;
    }
  }
</style>
