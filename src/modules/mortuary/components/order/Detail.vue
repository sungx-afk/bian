<template>
  <div class="order_detail">
    <div class="back-home" v-if="showBack" @click="goHome">
      <van-icon name="arrow-left" /><span>返回首页</span>
    </div>
    <order-item :item="order" source="detail" v-if="order"></order-item>
  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  import OrderItem from './OrderItem'
  export default{
    components:{
      OrderItem
    },
    data(){
      return {
        order:null
      }
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
      showBack(){
        let result = false;
        if(this.$route && this.$route.query.from && this.$route.query.from == 'notice'){
          result = true;
        }
        return result;
      }
    },
    methods:{
      getDetail(){
        if(this.$route.query.id){
          $API.mortuary.getOrderDetail({id:this.$route.query.id}, rsp => {
            this.order = rsp;
          })
        }
      },
      goHome(){
        Link('/list')
      }
    },
    created(){
      this.getDetail();
    }
  }
</script>

<style lang="less" scoped>
  @import "~@/config/config.less";
  .order_detail{
    .back-home{
      font-size: 16px;
      padding:10px;
      background-color: #fff;
      border-bottom: 1px solid #ccc;
      display: flex;
      align-items: center;
    }
  }
</style>
