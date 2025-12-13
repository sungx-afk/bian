<template>
  <div class="mortuary-setting-wrapper">
    <van-cell @click="goEditMortuary" title="设置馆" is-link />
    <van-cell @click="goProduct" title="商品" is-link />
    <van-cell @click="goActivity" title="告别活动" is-link />
    <van-cell @click="goOrder" title="订单" is-link />
  </div>
</template>

<script>
  import {Link,gUuid} from '@/config/utils'
  export default{
    methods:{
      goEditMortuary(){
        let url = '/mortuary/create'
        let query = {
          id:"11"
        }
        Link(url,query)
      },
      goProduct(){
        let url = '/mortuary/product_list'
        let query = {
        }
        Link(url,query)
      },
      goActivity(){
        let url = '/mortuary/activity_list'
        let query = {
        }
        Link(url,query)
      },
      goOrder(){
        let url = '/mortuary/order_list'
        let query = {
        }
        Link(url,query)
      }
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .mortuary-setting-wrapper{

  }


</style>
