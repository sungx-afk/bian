<template>
  <div class="list-wrapper">
    <div class="order-item" v-for="item in list" :key="item.id">
      <div class="sub-item">订单编号：{{item.id}}</div>
      <div class="sub-item">下单人：{{item.senderName}}</div>
      <div class="sub-item">下单时间：{{item.createDate | timesToDate('yyyy-MM-dd HH:mm')}}</div>
      <div class="sub-item">挽联留言：{{item.summary}}</div>
      <div class="sub-item">送至：{{item.spaceName}} 逝者：{{item.spaceUserName}}</div>
      <div class="sub-item btn">
        <van-button type="primary" size="small" @click="goPay(item)">支付订单</van-button>
        <van-button type="primary" size="small" @click="goDel(item)">删除订单</van-button>
        <van-button type="primary" size="small">完成订单</van-button>
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
  export default{
    data(){
      return {
        list:[]
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
        $API.mortuary.getOrderList({},(rsp) => {
          this.list = rsp;
        })
      },
      goPay(item){
        let orderId = item.id;
        $API.mortuary.getPayOrderInfo({orderId},rsp=>{
          this.wechatPay(rsp).then((res)=>{
            if (res === 0){
              this.$toast("支付成功")
            }
          }).catch(error=>{
            this.$toast(error.errMsg)
          })
        },error=>{
          this.$toast("获取订单失败，请稍后重试")
        })
      },
      goDel(item){
        this.$dialog.confirm({
          title: '提示',
          message: '确定要删除吗？',
        })
        .then(() => {
          $API.mortuary.deleteOrder({sid:item.id}, rsp => {
            this.$toast.clear()
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
      }
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
    .order-item{
      padding:10px 20px;
      border-bottom:1px solid #f4f4f4;
      .sub-item{
        margin-bottom:6px;
        font-size: 14px;
        &.btn{
          text-align: right;
          /deep/ .van-button--primary{
            background: @MAIN_THEME_COLOR;
            border:1px solid @MAIN_THEME_COLOR;
          }
        }
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
