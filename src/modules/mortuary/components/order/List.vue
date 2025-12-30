<template>
  <div class="list-wrapper">
    <van-dropdown-menu>
      <van-dropdown-item v-model="status" @change="getList" :options="statusList" />
    </van-dropdown-menu>
    <template v-if="list.length > 0">
      <order-item v-for="item in list" :key="item.id" :item="item" source="list" @refresh="getList"></order-item>
    </template>
    <div v-else>
      <van-empty description="暂无订单数据" />
    </div>

    <div class="new-btn" @click="goNewOrder">
      <i class="iconfont icon-anonymous-iconfont"></i>
    </div>

  </div>
</template>

<script>
  import {mapGetters,mapActions} from 'vuex';
  import {Link,gUuid} from '@/config/utils'
  import FinishOrder from '@/modules/widget/finish-order'
  import OrderItem from './OrderItem'
  export default{
    components:{
      OrderItem
    },
    data(){
      return {
        list:[],
        locked:false,
        status:"ALL",
        statusList:[{
          text:"全部订单",
          value:"ALL"
        },{
          text:"已支付订单",
          value:"PAID"
        },{
          text:"未支付订单",
          value:"CREATED"
        },{
          text:"已完成订单",
          value:"DELIVERED"
        },{
          text:"已取消订单",
          value:"CANCELED"
        }]
      }
    },
    computed:{
      ...mapGetters({
        user: 'userStore/user',
      }),
    },
    methods:{
      goNewOrder(){
        let url = '/mortuary/new_order'
        Link(url)
      },
      getList(){
        if(this.locked){
          return false;
        }
        this.locked = true;
        console.log("====>>>",this.$route.query)
        let params = {};
        if(this.status && this.status != 'ALL'){
          params.status = this.status;
        }
        if(this.$route.query.scope && this.$route.query.scope == 'my'){
          $API.mortuary.getMyOrderList(params,(rsp) => {
            this.list = rsp;
            this.locked = false;
          },() => {
            this.locked = false;
          })
        }else{
          $API.mortuary.getOrderList(params,(rsp) => {
            this.list = rsp;
            this.locked = false;
          },() => {
            this.locked = false;
          })
        }
      },
      goPay(item){
        let orderId = item.id;
        $API.mortuary.getPayOrderInfo({orderId},rsp=>{
          this.wechatPay(rsp).then((res)=>{
            if (res === 0){
              this.$toast("支付成功")
              this.getList();
            }
          }).catch(error=>{
            this.$toast(error.errMsg)
          })
        },error=>{
          this.$toast("获取订单失败，请稍后重试")
          this.getList();
        })
      },
      goDel(item){
        this.$dialog.confirm({
          title: '提示',
          message: '确定要删除吗？',
        })
        .then(() => {
          $API.mortuary.deleteOrder({sid:item.id}, rsp => {
            this.$toast({
              message:'删除成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.getList()
              }
            })
          }, error => {
            this.$toast('操作失败，请稍后重试')
          })
        })
        .catch(() => {
          // on cancel
        });
      },
      goEdit(item){
        Link('/mortuary/new_order?id='+item.id);
      },
      goFinishOrder(item){
        Link('/mortuary/finish_order?id='+item.id);
      },
      filterImg(item){
        item = JSON.parse(item);
        if(item.url){
          return item.url;
        }else{
          return ''
        }
      },
      goCancel(item){
        this.$dialog.confirm({
          title: '提示',
          message: '确定要取消该订单吗？',
        })
        .then(() => {
          $API.mortuary.cancelOrder({sid:item.id}, rsp => {
            this.$toast({
              message:'取消成功',
              type:'success',
              duration:1500,
              onClose:()=>{
                this.getList()
              }
            })
          }, error => {
            this.$toast('操作失败，请稍后重试')
          })
        })
        .catch(() => {
          // on cancel
        });
      }
    },
    activated(){
      this.getList();
    },
    created(){
      this.getList();
    }
  }
</script>

<style rel="stylesheet/less" lang="less" scoped>
  @import "~@/config/config.less";
  .list-wrapper{
    width:100%;
    height:100%;
    overflow: auto;
    /deep/ .van-dropdown-menu{
      padding:0 16px;
      .van-dropdown-menu__item{
        justify-content: flex-start !important;
      }
    }

    .new-btn{
      width:50px;
      height:50px;
      line-height:50px;
      color:#fff;
      text-align: center;
      background: @MAIN_THEME_COLOR;
      border-radius: 100%;
      position: fixed;
      bottom: 25px;
      right: 20px;
      .iconfont{
        font-size:20px;
      }
    }
  }
</style>
