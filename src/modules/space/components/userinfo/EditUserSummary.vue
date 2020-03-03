<template>
  <div class="edit-user-summary-container">

  </div>
</template>

<script>
    export default {
      name: "EditUserSummary",
      props:{
        users:{
          type:Array,
          default:[],
          twoWay:true
        }
      },
      data(){
        return{

        }
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

</style>
