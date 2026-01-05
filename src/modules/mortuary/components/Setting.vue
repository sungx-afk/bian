<template>
  <div class="mortuary-setting-wrapper">
    <van-cell @click="goEditMortuary" title="设置馆名称" is-link />
    <van-cell @click="goProduct" title="商品服务" is-link />
    <!-- <van-cell @click="goActivity" title="告别活动" is-link /> -->
    <van-cell @click="goOrder" title="订单" is-link />
    <!-- <van-cell @click="goMortuaryList" title="殡仪馆列表" is-link /> -->
    <!-- <van-cell @click="goSetManager" title="设置管理员" is-link /> -->
    <van-cell @click="goGift" title="在线纪念馆礼物设置" is-link />
  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  export default{
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
    },
    methods:{
      goEditMortuary(){
        let url = '/mortuary/create'
        let query = {
          id:this.user.merchant_id
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
      },
      goMortuaryList(){
        let url = '/mortuary/list'
        let query = {
        }
        Link(url,query)
      },
      goSetManager(){
        let url = '/mortuary/set_manager'
        let query = {
        }
        Link(url,query)
      },
      goGift(){
        let url = '/mortuary/gift'
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
    /deep/ .van-cell{
      font-size:16px;
    }
  }


</style>
