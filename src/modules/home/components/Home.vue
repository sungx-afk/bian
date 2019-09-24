<template>

</template>

<script>
  import {Link} from '@/config/utils'
    export default {
      name: "Home",
      created() {
        //空白页面解决Android微信中返回首页时页面重新创建的问题
        Link(`/list`,this.$route.query,true)
      }
    }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";

</style>
