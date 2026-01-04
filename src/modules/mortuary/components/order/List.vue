<template>
  <div class="list-wrapper">
    <div class="back-home">
      <div class="left-btn" @click="goHome">
        <van-icon name="arrow-left" /><span>返回</span>
      </div>
      <van-dropdown-menu>
        <van-dropdown-item v-model="status" @change="getList" :options="statusList" />
      </van-dropdown-menu>
    </div>
    <div class="list-container">
      <template v-if="list.length > 0">
        <order-item v-for="item in list" :key="item.id" :item="item" source="list" @refresh="getList"></order-item>
      </template>
      <div v-else>
        <van-empty description="暂无订单数据" />
      </div>
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
      showBack(){
        let result = false;
        if(this.$route && this.$route.query.opt_from && this.$route.query.opt_from == 'notice'){
          result = true;
        }
        return result;
      },
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
      },
      goHome(){
        if(this.showBack){
          Link('/list')
        }else{
          this.$router.go(-1)
        }
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
    display: flex;
    flex-direction: column;
    background-color: #f6f6f6;
    .back-home{
      font-size: 16px;
      padding:0 16px;
      background-color: #fff;
      border-bottom: 1px solid #ccc;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      .left-btn,.right-btn{
        display: flex;
        align-items: center;
      }
      /deep/ .van-dropdown-menu{
        padding:0 16px;
        .van-dropdown-menu__item{
          justify-content: flex-start !important;
        }
      }
    }
    .list-container{
      flex-grow:1;
      height:0;
      overflow:auto;
      padding:16px;
      box-sizing: border-box;
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
