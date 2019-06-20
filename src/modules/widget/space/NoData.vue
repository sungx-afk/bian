<template>
  <div class='nodata-container'>
    <img class="image" src="~@/modules/images/nodata.png" />
    <span class="text">{{text || '暂无数据'}}</span>
  </div>
</template>

<script>
    export default {
      name: "NoData",
      props: {
        text:{
          type:String,
          default:'暂无数据'
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
      width: 60px;
      height: 60px;
    }
    .text{
      font-size: 13px;
      color: #a9a9a9;
    }
  }
</style>
